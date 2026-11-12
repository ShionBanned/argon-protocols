import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root} from '../scripts/sync.mjs';
test('pilot rejects seeded bugs and accepts reference implementations',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'argon-eval-'));
  try{
    const candidate=path.join(temp,'candidate'),script=path.join(root,'scripts/evaluate.mjs');
    const init=spawnSync(process.execPath,[script,'init','--candidate',candidate],{encoding:'utf8'});assert.equal(init.status,0,init.stderr);
    const score=(name)=>{const out=path.join(temp,`${name}.json`);const r=spawnSync(process.execPath,[script,'score','--candidate',candidate,'--out',out,'--model','test-fixture-not-a-model','--variant','baseline','--run-id',name],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return JSON.parse(fs.readFileSync(out,'utf8'));};
    assert.equal(score('seeded-bugs').passed,0);
    fs.writeFileSync(path.join(candidate,'page.mjs'),'export function page(items,index,size){if(!Number.isInteger(index)||index<0||!Number.isInteger(size)||size<1)throw new RangeError();return items.slice(index*size,(index+1)*size); }');
    fs.writeFileSync(path.join(candidate,'session.mjs'),'export function isValid(s,now){return Boolean(s&&typeof s==="object"&&s.revoked===false&&Number.isFinite(s.expiresAt)&&Number.isFinite(now)&&s.expiresAt>now);}');
    fs.writeFileSync(path.join(candidate,'workers.mjs'),'export async function mapLimit(items,limit,fn){if(!Number.isInteger(limit)||limit<1)throw new RangeError();const result=new Array(items.length);let cursor=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(cursor<items.length){const i=cursor++;result[i]=await fn(items[i],i);}}));return result;}');
    fs.writeFileSync(path.join(candidate,'timeline.mjs'),'export function frameTime(f,n,d){if(!Number.isInteger(f)||f<0||!Number.isFinite(n)||n<=0||!Number.isFinite(d)||d<=0)throw new RangeError();return f*d/n;}');
    assert.equal(score('references').passed,4);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
