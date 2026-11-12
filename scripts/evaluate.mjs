#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {root} from './sync.mjs';
import {runCheck,hashArtifact} from './receipt.mjs';
const argv=process.argv.slice(2),action=argv.shift(),opts={};
while(argv.length){const k=argv.shift();if(!['--candidate','--out','--model','--variant','--run-id'].includes(k)||!argv.length)throw new Error('Invalid evaluation argument');opts[k.slice(2)]=argv.shift();}
const cases=JSON.parse(fs.readFileSync(path.join(root,'evals/cases.json'),'utf8'));
if(!opts.candidate)throw new Error('--candidate DIR is required');const candidate=path.resolve(opts.candidate);
if(action==='init'){
  if(fs.existsSync(candidate))throw new Error('Candidate directory must be new');fs.mkdirSync(candidate,{recursive:true});
  for(const c of cases)fs.writeFileSync(path.join(candidate,c.file),c.initial);
  fs.writeFileSync(path.join(candidate,'TASKS.md'),cases.map(c=>`## ${c.id}\n\n${c.prompt}`).join('\n\n')+'\n');
  console.log(candidate);
}else if(action==='score'){
  if(!opts.out||!opts.model||!['baseline','argon'].includes(opts.variant)||!opts['run-id'])throw new Error('score needs --out, --model, --variant baseline|argon and --run-id');
  const results=[];
  for(const c of cases){
    const receipt=await runCheck({command:[process.execPath,path.join(root,'evals/checks.mjs'),c.id,candidate],cwd:candidate,task:c.id,claim:c.prompt,timeoutMs:10000});
    let artifact;try{artifact=await hashArtifact(path.join(candidate,c.file));}catch(e){artifact={error:e.message};}
    results.push({id:c.id,passed:receipt.verdict==='CHECK_PASSED',artifact,receipt});
  }
  const report={suite:'argon-pilot-v1',model:opts.model,variant:opts.variant,run_id:opts['run-id'],timestamp:new Date().toISOString(),passed:results.filter(r=>r.passed).length,total:cases.length,results,
    limitations:'Four public unit-task checks, not a frontier benchmark. Model label is supplied by the operator. Does not measure UI/video quality, model latency, tokens or cost.'};
  fs.writeFileSync(path.resolve(opts.out),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:report.passed,total:report.total,out:path.resolve(opts.out)}));
}else throw new Error('Use init or score; candidate code runs with current local process permissions');
