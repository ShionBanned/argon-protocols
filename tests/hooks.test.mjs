import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {currentAssistantText,context,resolveFile,targets,snapshotPath} from '../hooks/common.mjs';
import {parseAudit,validateAudit,verifyHeader} from '../hooks/audit.mjs';
import {preflight,postflight,pending,shellMutation} from '../hooks/runtime.mjs';
import {scan,newFindings} from '../hooks/scanner.mjs';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'argon-tests-')); process.env.ARGON_STATE_DIR=path.join(tmp,'state');
const root=fileURLToPath(new URL('..',import.meta.url));
let sequence=0;
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
function fixture(){const cwd=path.join(tmp,`case-${++sequence}`);fs.mkdirSync(cwd);fs.writeFileSync(path.join(cwd,'code.ts'),'export const anchorValue = 1;\n');return {cwd,session_id:`test-${sequence}`,tool_name:'edit_file',tool_input:{path:'code.ts'}};}
function audit(anchors=[{path:'code.ts',line:1,token:'anchorValue'}],risk='N0',extra=''){return `<system_audit>\nRISK: ${risk}\n${risk==='N0'?'':'MATRIX: SYS x MIN\n'}${extra}EVIDENCE: ${JSON.stringify(anchors)}\nINVARIANT_CHECK: Preserves exported number contract\n</system_audit>`;}
function transcript(p,entries){const file=path.join(p.cwd,'transcript.jsonl');fs.writeFileSync(file,entries.map(e=>JSON.stringify(e)).join('\n')+'\n');return {...p,transcriptPath:file};}

test('actual Antigravity USER_EXPLICIT boundary rejects previous-turn audit',()=>{
  const p=transcript(fixture(),[{source:'USER_EXPLICIT',type:'USER_INPUT',content:'first'},{source:'MODEL',type:'PLANNER_RESPONSE',content:audit()},{source:'USER_EXPLICIT',type:'USER_INPUT',content:'second'},{source:'MODEL',type:'PLANNER_RESPONSE',content:'Working'}]);
  assert.equal(currentAssistantText(p,'antigravity'),'Working');
});
test('tool output and private thinking cannot authorize an edit',()=>{
  const p=transcript(fixture(),[{role:'user',content:'fix'},{role:'tool',content:audit()},{role:'assistant',content:[{type:'thinking',thinking:audit()}]}]);
  assert.equal(currentAssistantText(p,'generic'),'');
});
test('Claude tool-result user record is not a new user turn',()=>{
  const p=transcript(fixture(),[{type:'user',message:{role:'user',content:'fix'}},{type:'assistant',message:{role:'assistant',content:[{type:'text',text:audit()}]}},{type:'user',message:{role:'user',content:[{type:'tool_result',content:'done'}]}}]);
  assert.match(currentAssistantText(p,'claude'),/system_audit/);
});
test('no user boundary and partial JSON fail closed',()=>{
  const p=transcript(fixture(),[{role:'assistant',content:audit()}]);assert.throws(()=>currentAssistantText(p,'generic'),/boundary/);
  fs.appendFileSync(p.transcriptPath,'{"role":');assert.throws(()=>currentAssistantText(p,'generic'),/incomplete/);
});
test('large transcript without visible current boundary cannot reuse an audit',()=>{
  const p=transcript(fixture(),[{role:'user',content:'start'},{role:'tool',content:'x'.repeat(2200000)},{role:'assistant',content:audit()}]);
  assert.throws(()=>currentAssistantText(p,'generic'),/boundary/);
});
test('inline assistant field is ignored by Antigravity adapter',()=>{
  const p=transcript(fixture(),[{role:'user',content:'fix'}]);p.assistant_message=audit();assert.equal(currentAssistantText(p,'antigravity'),'');
});
test('JSON evidence supports commas and Windows paths',()=>{
  const a={path:'C:\\code dir\\a,b.ts',line:4,token:'myToken'};assert.deepEqual(parseAudit(audit([a])).anchors,[a]);
});
test('legacy syntax remains supported and malformed residue rejected',()=>{
  assert.equal(parseAudit(audit().replace(JSON.stringify([{path:'code.ts',line:1,token:'anchorValue'}]),'[code.ts:1["anchorValue"]]')).anchors[0].path,'code.ts');
  assert.throws(()=>parseAudit(audit().replace('EVIDENCE: ','EVIDENCE: garbage')));
});
test('N2 requires an explicit developed module, not incidental M3',()=>{
  assert.throws(()=>parseAudit(audit(undefined,'N2').replace('contract','contract M3')),/MODULE/);
  assert.equal(parseAudit(audit(undefined,'N2','MODULE: M3: Preserve API; patch runtime then run regressions\n')).fields.RISK,'N2');
});
test('duplicate fields and cross-domain matrix rejected',()=>{
  assert.throws(()=>parseAudit(audit().replace('RISK: N0','RISK: N0\nRISK: N2')),/Duplicate/);
  assert.throws(()=>parseAudit(audit(undefined,'N1').replace('SYS x MIN','SYS x CIN')),/MATRIX/);
});
test('evidence covers every target in batch and missing paths fail closed',async()=>{
  const p=fixture();p.tool_name='MultiEdit';p.tool_input={edits:[{file_path:'code.ts'},{file_path:'other.ts'}]};p.assistant_message=audit();
  assert.deepEqual(targets(p),['code.ts','other.ts']);await assert.rejects(preflight(p),/Every edit target/);
  p.tool_input={replacement:'nothing'};await assert.rejects(preflight(p),/no supported target/);
});
test('workspace traversal blocked',()=>{const p=fixture();assert.throws(()=>resolveFile('../escape.ts',context(p)),/escapes/);});
test('multiple workspaces accept absolute paths without guessing relative paths',()=>{
  const a=fixture(),b=fixture(),ctx=context({workspacePaths:[a.cwd,b.cwd]});assert.equal(resolveFile(path.join(b.cwd,'code.ts'),ctx),path.join(b.cwd,'code.ts'));assert.throws(()=>resolveFile('code.ts',ctx),/Multiple workspaces/);
});
test('symlink or junction escape blocked',()=>{
  const p=fixture(),outside=path.join(tmp,'outside');fs.mkdirSync(outside,{recursive:true});fs.symlinkSync(outside,path.join(p.cwd,'linked'),'junction');
  assert.throws(()=>resolveFile('linked/a.ts',context(p)),/escapes/);
});
test('NEW_FILE cannot overwrite existing and EMPTY_FILE handles empty source',async()=>{
  const p=fixture();p.assistant_message=audit([{path:'code.ts',line:0,token:'NEW_FILE'}]);await assert.rejects(preflight(p),/already exists/);
  fs.writeFileSync(path.join(p.cwd,'code.ts'),'');p.assistant_message=audit([{path:'code.ts',line:0,token:'EMPTY_FILE'}]);await preflight(p);await postflight(p);
});
test('bounded unique drift accepts eight lines, rejects remote unique tokens',()=>{
  const p=fixture(),file=path.join(p.cwd,'code.ts');fs.writeFileSync(file,'\n'.repeat(8)+'anchorValue');assert.equal(validateAudit(parseAudit(audit()),[file],context(p)).notes.length,1);
  fs.writeFileSync(file,'\n'.repeat(9)+'anchorValue');assert.throws(()=>validateAudit(parseAudit(audit()),[file],context(p)),/Anchor/);
});
test('ambiguous nearby anchor requires reread',()=>{
  const p=fixture(),file=path.join(p.cwd,'code.ts');fs.writeFileSync(file,'\nanchorValue\nanchorValue');assert.throws(()=>validateAudit(parseAudit(audit()),[file],context(p)),/ambiguous/);
});
test('generic or short tokens rejected',()=>{const p=fixture();assert.throws(()=>validateAudit(parseAudit(audit([{path:'code.ts',line:1,token:'const'}])),[path.join(p.cwd,'code.ts')],context(p)),/specific token/);});
test('RIFF subtype and complete PNG signature checked',()=>{
  const p=fixture(),wav=path.join(p.cwd,'a.wav');fs.writeFileSync(wav,'RIFF0000WEBP');assert.throws(()=>verifyHeader(wav),/header/);fs.writeFileSync(wav,'RIFF0000WAVE');verifyHeader(wav);
  const png=path.join(p.cwd,'a.png');fs.writeFileSync(png,Buffer.from([137,80,78,71]));assert.throws(()=>verifyHeader(png),/header/);
});
test('MEDIA_ASSET never authorizes overwriting the source',()=>{
  const p=fixture(),file=path.join(p.cwd,'a.wav');fs.writeFileSync(file,'RIFF0000WAVE');
  assert.throws(()=>validateAudit(parseAudit(audit([{path:'a.wav',line:0,token:'MEDIA_ASSET'}])),[file],context(p)),/cannot be edited/);
});
test('directory is not a valid textual evidence file',()=>{const p=fixture();assert.throws(()=>validateAudit(parseAudit(audit([{path:'.',line:1,token:'anchorValue'}])),[],context(p)),/regular file|EISDIR/);});
test('four unique editable files require N2 but repeated anchors do not',()=>{
  const p=fixture();const a=[1,2,3,4].map(i=>({path:`f${i}.ts`,line:0,token:'NEW_FILE'}));assert.throws(()=>validateAudit(parseAudit(audit(a,'N1')),[],context(p)),/requires N2/);
  validateAudit(parseAudit(audit(Array(4).fill({path:'code.ts',line:1,token:'anchorValue'}))),[],context(p));
});
test('strings, regex literals and JSX text do not produce type/suppression findings',()=>{
  assert.deepEqual(scan('const label="@ts-ignore // existing code : any"; const re=/: any/; const el=<p>as any</p>;','x.tsx'),[]);
});
test('template interpolation is parsed as code',()=>{assert.equal(scan('const text=`value ${value as any}`;','x.ts').filter(f=>f.id==='EXPLICIT_ANY').length,1);});
test('multiline any and empty catch detected',()=>{const f=scan('let value:\n any; try { work(); } catch (err) {\n}\n','x.ts');assert.deepEqual(f.map(x=>x.id),['EXPLICIT_ANY','EMPTY_CATCH']);});
test('deletion-only change creating empty catch is detected',()=>{
  const a='try { work(); } catch (e) {\n report(e);\n}\n',b='try { work(); } catch (e) {\n}\n';assert.equal(newFindings(a,b,'x.ts')[0].id,'EMPTY_CATCH');
});
test('existing findings do not block unrelated changes; duplicate additions detected',()=>{
  const a='const value: any = 1;\n';assert.deepEqual(newFindings(a,a+'const clean=2;\n','x.ts'),[]);assert.equal(newFindings(a,a+a,'x.ts').length,1);
});
test('TODOs and documented narrow exceptions are reviewable',()=>{
  assert.deepEqual(scan('// TODO: optimize only after profiling\n// @ts-expect-error: intentional invalid input test\nconst x=1;\ntry {x();} catch { /* optional cache is unavailable */ }','x.ts'),[]);
});
test('real truncated comment and blanket suppression detected',()=>{
  assert.deepEqual(scan('// existing code\n// @ts-ignore\nconst x=1;','x.ts').map(f=>f.id).sort(),['COMPILER_SUPPRESSION','TRUNCATED_IMPLEMENTATION']);
});
test('non-JS languages explicitly delegated, never scanned with JS regex',()=>{assert.deepEqual(scan('value: any\n"""// existing code"""','x.py'),[]);});
test('pre/post lifecycle retains unresolved findings through an unrelated edit',async()=>{
  const p=fixture();p.assistant_message=audit();await preflight(p);fs.appendFileSync(path.join(p.cwd,'code.ts'),'const trouble: any = 3;\n');assert.equal((await postflight(p)).length,1);
  p.stepIdx=2;await preflight(p);fs.appendFileSync(path.join(p.cwd,'code.ts'),'const good = 2;\n');assert.equal((await postflight(p)).length,1);
  p.stepIdx=3;await preflight(p);fs.writeFileSync(path.join(p.cwd,'code.ts'),'export const anchorValue = 1;\nconst good=2;\n');assert.deepEqual(await postflight(p),[]);assert.deepEqual(await pending(p),[]);
});
test('same-file concurrent edits cannot overwrite snapshots',async()=>{
  const p=fixture();p.assistant_message=audit();await preflight(p);await assert.rejects(preflight({...p,stepIdx:2}),/in flight/);await postflight(p);
});
test('different-file concurrent edits have isolated snapshots',async()=>{
  const p=fixture();p.assistant_message=audit();fs.writeFileSync(path.join(p.cwd,'b.ts'),'export const anchorOther=2;');
  const q={...p,stepIdx:2,tool_input:{path:'b.ts'},assistant_message:audit([{path:'b.ts',line:1,token:'anchorOther'}])};
  await Promise.all([preflight(p),preflight(q)]);assert.notEqual(snapshotPath(p,context(p)),snapshotPath(q,context(q)));await Promise.all([postflight(p),postflight(q)]);
});
test('post without baseline reports unvalidated instead of scanning all legacy code',async()=>{await assert.rejects(postflight(fixture()),/NOT validated/);});
test('unreadable snapshot storage blocks mutation',async()=>{
  const p=fixture();p.assistant_message=audit();const old=process.env.ARGON_STATE_DIR;const file=path.join(p.cwd,'blocked');fs.writeFileSync(file,'x');process.env.ARGON_STATE_DIR=file;
  try {await assert.rejects(preflight(p));}finally{process.env.ARGON_STATE_DIR=old;}
});
test('shell read/test commands pass, direct source writes detected',()=>{
  for(const cmd of ['git status','npm test > results.log','ffprobe source.mp4'])assert.equal(shellMutation(cmd),false);
  for(const cmd of ['echo bad > src/a.ts','sed -i s/a/b/ x.py','Set-Content -Path a.ts -Value x','node -e "fs.writeFileSync(path, value)"'])assert.equal(shellMutation(cmd),true);
});
test('unrelated tools bypass mutation checks',async()=>{assert.deepEqual(await preflight({tool_name:'view_file'}),[]);});
test('Antigravity protocol uses JSON deny without environment guessing',()=>{
  const p=fixture();const r=spawnSync(process.execPath,[path.join(root,'hooks/pre-edit-audit.ts'),'--host','antigravity'],{input:JSON.stringify(p),encoding:'utf8'});
  assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).decision,'deny');
});
test('malformed input fails closed with a parseable host response',()=>{
  const r=spawnSync(process.execPath,[path.join(root,'hooks/pre-edit-audit.ts'),'--host','antigravity'],{input:'{broken',encoding:'utf8'});assert.equal(JSON.parse(r.stdout).decision,'deny');
});
test('Antigravity post-event returns empty object, not unsupported deny',()=>{
  const r=spawnSync(process.execPath,[path.join(root,'hooks/post-edit-slop.ts'),'--host','antigravity'],{input:JSON.stringify(fixture()),encoding:'utf8'});assert.deepEqual(JSON.parse(r.stdout),{});assert.match(r.stderr,/NOT validated/);
});
test('Antigravity post error is delivered to next invocation, then consumed',async()=>{
  const p=fixture();spawnSync(process.execPath,[path.join(root,'hooks/post-edit-slop.ts'),'--host','antigravity'],{input:JSON.stringify(p),encoding:'utf8',env:process.env});
  assert.equal((await pending(p))[0].id,'UNVALIDATED_CHANGE');assert.deepEqual(await pending(p),[]);
});
test('generic and Gemini adapters emit documented failure conventions',()=>{
  const hook=path.join(root,'hooks/pre-edit-audit.ts');
  const generic=spawnSync(process.execPath,[hook,'--host','generic'],{input:'{}',encoding:'utf8'});assert.equal(generic.status,2);
  const claude=spawnSync(process.execPath,[hook,'--host','claude'],{input:'{}',encoding:'utf8'});assert.equal(claude.status,2);
  const gemini=spawnSync(process.execPath,[hook,'--host','gemini'],{input:'{}',encoding:'utf8'});assert.equal(gemini.status,0);assert.equal(JSON.parse(gemini.stdout).decision,'deny');
});
