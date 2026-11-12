#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {root,names,hookConfig} from './sync.mjs';
import {digest,readJson} from '../hooks/common.mjs';
const argv=process.argv.slice(2);const index=argv.indexOf('--config-root');const config=index<0?path.join(os.homedir(),'.gemini','config'):argv[index+1];
const checks=[];function check(name,ok,detail=''){checks.push({name,ok,detail});}
check('node',Number(process.versions.node.split('.')[0])>=22,process.versions.node);
try{check('typescript-parser',readJson(path.join(root,'node_modules/typescript/package.json')).version==='5.9.3');}catch{check('typescript-parser',false,'Run bun install --frozen-lockfile --ignore-scripts');}
const r=spawnSync('bun',['--version'],{encoding:'utf8',windowsHide:true});check('bun-runtime',r.status===0,r.stdout?.trim()??r.error?.message);
let hooks;try{hooks=readJson(path.join(config,'hooks.json'));check('global-hooks',!!hooks['argon-protocols'],path.join(config,'hooks.json'));}catch{check('global-hooks',false,'Missing or invalid global hooks.json');}
if(hooks?.['argon-protocols']){
  const actual=hooks['argon-protocols'];check('hooks-enabled',actual.enabled!==false);
  const expected=hookConfig(root)['argon-protocols'];
  for(const event of ['PreToolUse','PostToolUse','PreInvocation']){
    check(event,JSON.stringify(actual[event])===JSON.stringify(expected[event]),'Compare to runtime root; custom executable paths may need manual review');
  }
}
for(const name of names)for(const rel of ['SKILL.md','references/protocol.md']){try{check(`${name}/${rel}`,digest(fs.readFileSync(path.join(root,'skills',name,rel)))===digest(fs.readFileSync(path.join(config,'skills',name,rel))));}catch{check(`${name}/${rel}`,false,'Missing installed skill file');}}
console.log(JSON.stringify({ok:checks.every(c=>c.ok),runtime:root,config,checks,limitation:'Filesystem/configuration checks only. Confirm loaded hooks in the host; no live model task was executed.'},null,2));
process.exitCode=checks.every(c=>c.ok)?0:1;
