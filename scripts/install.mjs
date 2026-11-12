#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {root,names,hookConfig} from './sync.mjs';
import {canonical,within,readJson,digest} from '../hooks/common.mjs';

export function planInstall({configRoot=path.join(os.homedir(),'.gemini','config'),runtimeRoot=root,executable='bun'}={}) {
  configRoot=canonical(configRoot);runtimeRoot=canonical(runtimeRoot);
  if(/["\r\n$`]/.test(runtimeRoot)||!/^bun$|^node$|^"[^"\r\n$`]+"$/.test(executable))throw new Error('Runtime path/executable cannot be safely represented in a hook shell command');
  const changes=[];
  const add=(relative,content)=>{
    const target=path.join(configRoot,relative);if(!within(target,configRoot))throw new Error('Install target escapes config root');
    const before=fs.existsSync(target)?fs.readFileSync(target):null;
    changes.push({target,content,expected:before?digest(before):null,before});
  };
  for(const name of names)for(const relative of ['SKILL.md','references/protocol.md'])add(`skills/${name}/${relative}`,fs.readFileSync(path.join(runtimeRoot,'skills',name,relative)));
  for(const name of names)add(`agents/${name}.md`,fs.readFileSync(path.join(runtimeRoot,'agents',`${name}.md`)));
  const hooksPath=path.join(configRoot,'hooks.json');const hooks=fs.existsSync(hooksPath)?readJson(hooksPath):{};
  if(!hooks||Array.isArray(hooks)||typeof hooks!=='object')throw new Error('Existing hooks.json is not an object');
  // Preserve other hook groups. Registration lives at the documented global root.
  Object.assign(hooks,hookConfig(runtimeRoot,executable));add('hooks.json',Buffer.from(JSON.stringify(hooks,null,2)+'\n'));
  add('bin/argon-receipt.mjs',fs.readFileSync(path.join(runtimeRoot,'scripts/receipt.mjs')));
  add('bin/argon-receipt.ts',Buffer.from("import {main} from './argon-receipt.mjs';\nawait main().catch(e=>{console.error(e.message);process.exitCode=2;});\n"));
  // A Bun wrapper is already part of the user's installation. Keep invocation available on Windows.
  add('bin/argon-receipt.cmd',Buffer.from('@echo off\r\nbun "%~dp0argon-receipt.ts" %*\r\n'));
  return {configRoot,runtimeRoot,changes};
}
export function applyInstall(plan,backupRoot){
  backupRoot=path.resolve(backupRoot);if(fs.existsSync(backupRoot))throw new Error('Backup directory must be new');
  for(const c of plan.changes){const now=fs.existsSync(c.target)?digest(fs.readFileSync(c.target)):null;if(now!==c.expected)throw new Error('Target changed after planning: '+c.target);}
  fs.mkdirSync(backupRoot,{recursive:true});const manifest=[];
  for(const [index,c]of plan.changes.entries()){
    const backup=c.before?path.join(backupRoot,`${index}.bak`):null;if(backup)fs.writeFileSync(backup,c.before);
    manifest.push({target:c.target,backup,before_sha256:c.expected,after_sha256:digest(c.content)});
  }
  fs.writeFileSync(path.join(backupRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  for(const c of plan.changes){fs.mkdirSync(path.dirname(c.target),{recursive:true});fs.writeFileSync(c.target,c.content);}
  return {files:manifest.length,backup:backupRoot};
}
export function restore(backupRoot){
  const manifest=readJson(path.join(backupRoot,'manifest.json'));
  // Refuse to erase edits made after installation. Check all files before touching any.
  for(const c of manifest)if(!fs.existsSync(c.target)||digest(fs.readFileSync(c.target))!==c.after_sha256)throw new Error('Cannot restore a subsequently changed target: '+c.target);
  for(const c of manifest){if(c.backup)fs.copyFileSync(c.backup,c.target);else fs.unlinkSync(c.target);}
  return {restored:manifest.length};
}
function main(){
  const argv=process.argv.slice(2),opts={};let apply=false;
  while(argv.length){const key=argv.shift();if(key==='--apply'){apply=true;continue;}if(!['--config-root','--runtime-root','--executable','--backup','--restore'].includes(key)||!argv.length)throw new Error('Use --config-root PATH [--apply --backup NEW_DIR] or --restore BACKUP_DIR');opts[key.slice(2)]=argv.shift();}
  if(opts.restore){console.log(JSON.stringify(restore(opts.restore),null,2));return;}
  const plan=planInstall({configRoot:opts['config-root'],runtimeRoot:opts['runtime-root'],executable:opts.executable});
  if(!apply){console.log(JSON.stringify({mode:'dry-run',runtime:plan.runtimeRoot,targets:plan.changes.map(c=>c.target)},null,2));return;}
  if(!opts.backup)throw new Error('--backup NEW_DIR is mandatory with --apply');
  console.log(JSON.stringify(applyInstall(plan,opts.backup),null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
