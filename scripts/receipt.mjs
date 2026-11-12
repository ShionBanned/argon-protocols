#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export async function runCheck({command,cwd=process.cwd(),timeoutMs=120000,maxOutputBytes=262144,claim,task}) {
  if(!Array.isArray(command)||!command.length||command.some(x=>typeof x!=='string'||x.includes('\0'))||!command[0]) throw new Error('An explicit executable and argument array is required');
  if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>3600000) throw new Error('timeoutMs must be 1..3600000');
  if(!Number.isSafeInteger(maxOutputBytes)||maxOutputBytes<1) throw new Error('Invalid output limit');
  if(!claim?.trim()||!task?.trim()) throw new Error('task and claim are required');
  const started=Date.now(), chunks={stdout:[],stderr:[]}, sizes={stdout:0,stderr:0}, total={stdout:0,stderr:0};
  let timedOut=false, spawnError, signal;
  const child=spawn(command[0],command.slice(1),{cwd,stdio:['ignore','pipe','pipe'],shell:false,windowsHide:true,detached:process.platform!=='win32'});
  for(const kind of ['stdout','stderr']) child[kind].on('data',data=>{
    total[kind]+=data.length; const keep=Math.max(0,maxOutputBytes-sizes[kind]);
    if(keep) {const chunk=data.subarray(0,keep); chunks[kind].push(chunk); sizes[kind]+=chunk.length;}
  });
  const timer=setTimeout(()=>{
    timedOut=true;
    if(!child.pid) return;
    if(process.platform==='win32') {
      const killer=spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});
      killer.on('error',()=>child.kill('SIGKILL'));
      killer.on('close',code=>{if(code!==0)child.kill('SIGKILL');});
      // A restricted Windows Job Object can deny taskkill without emitting an error.
      setTimeout(()=>child.kill('SIGKILL'),500).unref();
    } else { try { process.kill(-child.pid,'SIGKILL'); } catch { child.kill('SIGKILL'); } }
  },timeoutMs);
  const exitCode=await new Promise(resolve=>{
    child.on('error',e=>{spawnError=e.message;});
    child.on('close',(code,sig)=>{signal=sig;clearTimeout(timer);resolve(code);});
  });
  return {schema_version:1,task,claim,verdict:timedOut?'TIMED_OUT':spawnError?'EXECUTION_ERROR':exitCode===0?'CHECK_PASSED':'CHECK_FAILED',
    meaning:'Records this command only; a passing check does not prove the entire claim.',
    evidence:{command,cwd:path.resolve(cwd),timestamp:new Date(started).toISOString(),duration_ms:Date.now()-started,exit_code:exitCode,signal:signal??null,timed_out:timedOut,
      stdout:Buffer.concat(chunks.stdout).toString('utf8'),stderr:Buffer.concat(chunks.stderr).toString('utf8'),
      output_truncated:total.stdout>sizes.stdout||total.stderr>sizes.stderr,...(spawnError?{error:spawnError}:{})}};
}
export async function hashArtifact(file) {
  const hash=crypto.createHash('sha256'); let bytes=0;
  for await(const chunk of fs.createReadStream(file)){hash.update(chunk);bytes+=chunk.length;}
  return {path:path.resolve(file),bytes,sha256:hash.digest('hex')};
}
export async function main(argv=process.argv.slice(2)) {
  if(argv[0]==='help'||argv.includes('--help')) {console.log('receipt verify --task ID --claim TEXT --out receipt.json [--timeout-ms 120000] [--artifact FILE] -- EXECUTABLE ARG...');return;}
  if(argv.shift()!=='verify') throw new Error('Use verify or --help');
  const options={artifacts:[]}; let command;
  while(argv.length){const key=argv.shift();if(key==='--'){command=argv;break;}
    if(!['--task','--claim','--out','--cwd','--timeout-ms','--artifact'].includes(key)||!argv.length) throw new Error('Unknown/missing argument; --cmd shell strings are no longer accepted');
    const value=argv.shift();if(key==='--artifact')options.artifacts.push(value);else options[key.slice(2)]=value;
  }
  if(!options.out) throw new Error('--out is required to persist evidence');
  const result=await runCheck({command,task:options.task,claim:options.claim,cwd:options.cwd,timeoutMs:options['timeout-ms']?Number(options['timeout-ms']):120000});
  result.artifacts=[];
  for(const file of options.artifacts) {try {result.artifacts.push(await hashArtifact(path.resolve(options.cwd??process.cwd(),file)));}catch(e){result.artifacts.push({path:file,error:e.message});result.verdict='EVIDENCE_ERROR';}}
  const destination=path.resolve(options.out);fs.mkdirSync(path.dirname(destination),{recursive:true});
  // Do not overwrite an earlier receipt; preserve the evidence chain.
  fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({verdict:result.verdict,receipt:destination}));process.exitCode=result.verdict==='CHECK_PASSED'?0:2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) main().catch(e=>{console.error(e.message);process.exitCode=2;});
