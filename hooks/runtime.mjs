import fs from 'node:fs';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {EDIT_TOOLS,SHELL_TOOLS,argsOf,toolOf,targets,context,resolveFile,hostArtifact,currentAssistantText,sessionDir,snapshotPath,callKey,atomicJson,readJson,readBounded,pathKey,digest} from './common.mjs';
import {parseAudit,validateAudit} from './audit.mjs';

function hostName() {
  const i = process.argv.indexOf('--host');
  const host = i < 0 ? 'generic' : process.argv[i+1];
  if (!['generic','antigravity','claude','gemini'].includes(host)) throw new Error('Unknown --host adapter');
  return host;
}
function payload() {
  const raw = fs.readFileSync(0,'utf8');
  if (Buffer.byteLength(raw) > 16*1024*1024) throw new Error('Hook payload exceeds 16 MiB');
  const p = JSON.parse(raw.replace(/^\uFEFF/,''));
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('Expected hook JSON object');
  return p;
}
function respond(host,phase,ok,reason='') {
  if (host === 'antigravity') process.stdout.write(JSON.stringify(phase === 'pre' ? {decision:ok?'allow':'deny',...(reason?{reason}:{})} : {}));
  else if (host === 'gemini') process.stdout.write(JSON.stringify({decision:ok?'allow':'deny',...(reason?{reason}:{})}));
  if (reason && (host !== 'antigravity' || phase !== 'pre')) process.stderr.write(`[ARGON] ${reason}\n`);
  process.exitCode = ok || host === 'antigravity' || host === 'gemini' ? 0 : 2;
}
export function shellMutation(command) {
  // Best-effort detection, not a shell sandbox. Never execute or expand this text.
  const ext = '\\.(?:[cm]?[jt]sx?|py|rs|go|java|c|cpp|h|cs|sh|ps1|json|ya?ml|toml|md|css|html)\\b';
  const redirect = new RegExp('(?:>{1,2}|\\btee\\s+)[^|;&\\r\\n]*'+ext,'i');
  return redirect.test(command) || /\b(?:Set-Content|Add-Content|Out-File|sed\s+-\w*i\w*|perl\s+-\w*i\w*)\b/i.test(command) ||
    /\b(?:writeFile(?:Sync)?|write_text|write_bytes)\s*\(/.test(command) || /\bopen\s*\([^)]*,\s*['"](?:w|a|x)/.test(command);
}
const fileState = (p,ctx,file) => path.join(sessionDir(p,ctx),`file-${digest(pathKey(file))}.json`);
const lockPath = (p,ctx,file) => path.join(sessionDir(p,ctx),`lock-${digest(pathKey(file))}.json`);
function release(p,ctx,files) {
  for (const file of files) {
    const lock = lockPath(p,ctx,file);
    if (fs.existsSync(lock) && readJson(lock).call === callKey(p)) fs.unlinkSync(lock);
  }
}
export async function preflight(p,host='generic') {
  const name = toolOf(p);
  if (typeof name !== 'string' || !name) throw new Error('Missing tool name');
  if (SHELL_TOOLS.has(name)) {
    const a = argsOf(p); const cmd = a.command ?? a.CommandLine ?? a.cmd ?? a.script;
    if (typeof cmd !== 'string') throw new Error('Unknown shell command schema');
    if (shellMutation(cmd)) throw new Error('Direct shell source writes bypass auditing; use a file edit tool. This detector does not sandbox arbitrary programs');
    return [];
  }
  if (!EDIT_TOOLS.has(name)) return [];
  const raw = targets(p);
  if (!raw.length) throw new Error('Recognized edit tool has no supported target path');
  if (hostArtifact(p,raw)) return [];
  const ctx = context(p), files = [...new Set(raw.map(f => resolveFile(f,ctx)))];
  let audit, lastError;
  for (let n=0;n<3;n++) {
    try { audit=parseAudit(currentAssistantText(p,host)); break; }
    catch(e) { lastError=e; if(n<2) await delay(40); }
  }
  if (!audit) throw lastError;
  const {baseline,notes} = validateAudit(audit,files,ctx);
  const dir = sessionDir(p,ctx); fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const acquired = [];
  try {
    for (const file of files) {
      const lock = lockPath(p,ctx,file);
      if (fs.existsSync(lock)) {
        const old = readJson(lock);
        if (Date.now()-old.timestamp > 600000) fs.unlinkSync(lock);
        else if (old.call !== callKey(p)) throw new Error('An edit to the same file is already in flight; serialize those edits');
        else if (fs.existsSync(snapshotPath(p,ctx))) throw new Error('Duplicate pre-event while edit is in flight; wait for the post-event');
      }
      fs.writeFileSync(lock,JSON.stringify({call:callKey(p),timestamp:Date.now()}),{flag:'wx',mode:0o600}); acquired.push(file);
    }
    // Recheck after locking to avoid silently snapshotting a changed source.
    for (const b of baseline) if (fs.existsSync(b.file)!==b.exists || (b.exists && digest(readBounded(b.file).toString('utf8'))!==b.hash)) throw new Error('Target changed during audit; read it again');
    atomicJson(snapshotPath(p,ctx),{version:1,timestamp:Date.now(),baseline});
  } catch(e) { release(p,ctx,acquired); throw e; }
  return notes;
}
export async function postflight(p) {
  if (!EDIT_TOOLS.has(toolOf(p))) return [];
  const raw = targets(p);
  if (hostArtifact(p,raw)) return [];
  if (!raw.length) throw new Error('Post-event has no target paths');
  const ctx = context(p), files = raw.map(f=>resolveFile(f,ctx)), snapshot = snapshotPath(p,ctx);
  if (!fs.existsSync(snapshot)) throw new Error('No matching pre-edit snapshot; change was NOT validated');
  const record = readJson(snapshot);
  if (Date.now()-record.timestamp > 600000) throw new Error('Pre-edit snapshot expired; change was NOT validated');
  const {newFindings} = await import('./scanner.mjs');
  const all=[];
  try {
    for (const b of record.baseline) {
      if (!files.some(file=>pathKey(file)===pathKey(b.file))) throw new Error('Post target differs from its snapshot');
      const statePath = fileState(p,ctx,b.file);
      let prior;
      if (fs.existsSync(statePath)) prior=readJson(statePath);
      const original = prior?.baseline ?? b.content;
      if (!fs.existsSync(b.file)) {
        if (!b.exists && p.error) continue;
        throw new Error('Edited target is missing after execution');
      }
      const after = readBounded(b.file).toString('utf8');
      const findings = newFindings(original,after,b.file);
      if (findings.length) {
        atomicJson(statePath,{file:b.file,baseline:original,findings,timestamp:Date.now()});
        all.push(...findings.map(f=>({...f,file:b.file})));
      } else if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
    }
  } finally { fs.unlinkSync(snapshot); release(p,ctx,files); }
  return all;
}
export async function pending(p) {
  const ctx=context(p), dir=sessionDir(p,ctx);
  if (!fs.existsSync(dir)) return [];
  const {newFindings}=await import('./scanner.mjs'); const all=[];
  for(const entry of fs.readdirSync(dir).filter(n=>/^error-[a-f0-9]+\.json$/.test(n))) {
    const s=readJson(path.join(dir,entry));
    if(Date.now()-s.timestamp<=86400000)all.push({id:'UNVALIDATED_CHANGE',file:s.file??'(hook)',line:1,message:s.message});
    // One notification per invocation error; diagnostics in file-* retain their own lifetime.
    fs.unlinkSync(path.join(dir,entry));
  }
  for(const entry of fs.readdirSync(dir).filter(n=>/^file-[a-f0-9]+\.json$/.test(n))) {
    const file=path.join(dir,entry), s=readJson(file);
    if(Date.now()-s.timestamp>86400000) { fs.unlinkSync(file); continue; }
    resolveFile(s.file,ctx);
    if(!fs.existsSync(s.file)) { all.push({id:'MISSING_TARGET',file:s.file,line:1,message:'Previously edited file is missing; review the deletion'}); continue; }
    const findings=newFindings(s.baseline,readBounded(s.file).toString('utf8'),s.file);
    if(!findings.length) fs.unlinkSync(file); else all.push(...findings.map(f=>({...f,file:s.file})));
  }
  return all;
}
const report = findings => findings.slice(0,20).map(f=>`${f.id} ${f.file}:${f.line}: ${f.message}`).join('\n');
export async function runPre() {
  let host='generic';
  try { host=hostName(); const notes=await preflight(payload(),host); respond(host,'pre',true,notes.join('\n')); }
  catch(e) { respond(host,'pre',false,e.message); }
}
export async function runPost() {
  let host='generic',p;
  try { host=hostName(); p=payload(); const findings=await postflight(p); respond(host,'post',findings.length===0,report(findings)); }
  catch(e) {
    if(p)try{const ctx=context(p);atomicJson(path.join(sessionDir(p,ctx),`error-${callKey(p)}.json`),{timestamp:Date.now(),message:e.message,file:targets(p)[0]});}catch(storageError){process.stderr.write(`[ARGON] Could not persist post-event error: ${storageError.message}\n`);}
    respond(host,'post',false,e.message);
  }
}
export async function runFeedback() {
  try {
    const findings=await pending(payload());
    process.stdout.write(JSON.stringify(findings.length?{injectSteps:[{ephemeralMessage:`Argon review findings (not a rollback or a compiler result). Review and fix or explain intentional exceptions:\n${report(findings)}`}]}:{}));
  } catch(e) { process.stderr.write(`[ARGON] Feedback unavailable: ${e.message}\n`); process.stdout.write('{}'); }
}
