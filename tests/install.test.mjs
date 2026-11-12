import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {planInstall,applyInstall,restore} from '../scripts/install.mjs';
import {spawnSync} from 'node:child_process';
import {root,hookConfig} from '../scripts/sync.mjs';
test('doctor accepts generated installation, including a trailing runtime slash',()=>{
  assert.deepEqual(hookConfig(root),hookConfig(root.replace(/[\\/]+$/,'')));
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'argon-doctor-'));
  try{const config=path.join(tmp,'config');applyInstall(planInstall({configRoot:config}),path.join(tmp,'backup'));
    const r=spawnSync(process.execPath,[path.join(root,'scripts/doctor.mjs'),'--config-root',config],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);assert.equal(JSON.parse(r.stdout).ok,true);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('install preserves other hooks and restore returns exact previous content',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'argon-install-'));
  try{
    const config=path.join(tmp,'config');fs.mkdirSync(config);const before='{"my-other-hook":{"enabled":false}}\n';fs.writeFileSync(path.join(config,'hooks.json'),before);
    const plan=planInstall({configRoot:config});assert.equal(fs.readdirSync(config).length,1);
    const backup=path.join(tmp,'backup');applyInstall(plan,backup);assert.equal(JSON.parse(fs.readFileSync(path.join(config,'hooks.json'),'utf8'))['my-other-hook'].enabled,false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(config,'hooks.json'),'utf8'))['argon-protocols'].enabled,true);
    restore(backup);assert.equal(fs.readFileSync(path.join(config,'hooks.json'),'utf8'),before);assert.equal(fs.existsSync(path.join(config,'skills/argon-core/SKILL.md')),false);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('install and restore refuse to overwrite changes made after planning',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'argon-install-'));
  try{const config=path.join(tmp,'config');const plan=planInstall({configRoot:config});fs.mkdirSync(config);fs.writeFileSync(path.join(config,'hooks.json'),'{}');assert.throws(()=>applyInstall(plan,path.join(tmp,'backup')),/changed/);
    const backup=path.join(tmp,'new-backup');applyInstall(planInstall({configRoot:config}),backup);fs.appendFileSync(path.join(config,'skills/argon-core/SKILL.md'),'user edit');assert.throws(()=>restore(backup),/subsequently changed/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
