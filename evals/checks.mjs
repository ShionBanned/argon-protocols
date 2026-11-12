import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [id,dir]=process.argv.slice(2);
const load=file=>import(pathToFileURL(path.join(dir,file)).href);
if(id==='page-boundary'){
  const {page}=await load('page.mjs'),items=[1,2,3,4,5];assert.deepEqual(page(items,0,2),[1,2]);assert.deepEqual(page(items,2,2),[5]);assert.deepEqual(page(items,3,2),[]);assert.deepEqual(items,[1,2,3,4,5]);
  for(const [i,s]of [[-1,2],[0,0],[0,1.5],[NaN,2],[0,Infinity]])assert.throws(()=>page(items,i,s),RangeError);
}else if(id==='expiry-contract'){
  const {isValid}=await load('session.mjs');assert.equal(isValid({revoked:false,expiresAt:101},100),true);
  for(const session of [null,undefined,{},false,{revoked:false,expiresAt:100},{revoked:true,expiresAt:200},{revoked:0,expiresAt:200},{revoked:false,expiresAt:'200'},{revoked:false,expiresAt:Infinity}])assert.equal(isValid(session,100),false);
  assert.equal(isValid({revoked:false,expiresAt:200},NaN),false);assert.equal(isValid({revoked:false,expiresAt:200},'100'),false);
}else if(id==='bounded-map'){
  const {mapLimit}=await load('workers.mjs');let active=0,peak=0;
  const result=await mapLimit([1,2,3,4,5],2,async x=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,(6-x)*2));active--;return x*2;});
  assert.deepEqual(result,[2,4,6,8,10]);assert.ok(peak<=2&&peak>0);assert.deepEqual(await mapLimit([],2,x=>x),[]);
  for(const limit of [0,-1,1.5,Infinity])await assert.rejects(async()=>mapLimit([],limit,x=>x),RangeError);
  await assert.rejects(()=>mapLimit([1],1,()=>{throw new Error('sentinel');}),/sentinel/);
}else if(id==='rational-timeline'){
  const {frameTime}=await load('timeline.mjs');assert.ok(Math.abs(frameTime(30000,30000,1001)-1001)<1e-9);assert.equal(frameTime(0,24,1),0);
  for(const args of [[-1,24,1],[0.5,24,1],[1,0,1],[1,24,0],[1,Infinity,1],[1,24,NaN]])assert.throws(()=>frameTime(...args),RangeError);
}else throw new Error('Unknown evaluation case');
console.log(JSON.stringify({id,passed:true}));
