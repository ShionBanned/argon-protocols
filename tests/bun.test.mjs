import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root} from '../scripts/sync.mjs';
test('Bun executes the full Antigravity pre/post/feedback cycle',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'argon-bun-'));
  try{
    const target=path.join(dir,'app.ts'),transcript=path.join(dir,'transcript.jsonl');fs.writeFileSync(target,'export const anchorValue=1;\n');
    const audit='<system_audit>\nRISK: N0\nEVIDENCE: [{"path":"app.ts","line":1,"token":"anchorValue"}]\nINVARIANT_CHECK: Preserve public export contract\n</system_audit>';
    fs.writeFileSync(transcript,[{type:'USER_INPUT',source:'USER_EXPLICIT',content:'fix'},{type:'PLANNER_RESPONSE',source:'MODEL',content:audit}].map(x=>JSON.stringify(x)).join('\n')+'\n');
    const p={conversationId:'bun-test',workspacePaths:[dir],transcriptPath:transcript,stepIdx:2,toolCall:{name:'replace_file_content',args:{TargetFile:target}}};
    const invoke=(file,payload=p)=>{const r=spawnSync('bun',[path.join(root,'hooks',file),'--host','antigravity'],{input:JSON.stringify(payload),encoding:'utf8',env:{...process.env,ARGON_STATE_DIR:path.join(dir,'state')},timeout:10000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);};
    assert.equal(invoke('pre-edit-audit.ts').decision,'allow');fs.appendFileSync(target,'const problem: any=2;');assert.deepEqual(invoke('post-edit-slop.ts'),{});
    const feedback=invoke('feedback.mjs',{conversationId:p.conversationId,workspacePaths:p.workspacePaths});assert.match(feedback.injectSteps[0].ephemeralMessage,/EXPLICIT_ANY/);
    p.stepIdx=3;assert.equal(invoke('pre-edit-audit.ts').decision,'allow');fs.writeFileSync(target,'export const anchorValue=2;\n');invoke('post-edit-slop.ts');assert.deepEqual(invoke('feedback.mjs',{conversationId:p.conversationId,workspacePaths:p.workspacePaths}),{});
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
