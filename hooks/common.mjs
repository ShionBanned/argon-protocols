import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export const EDIT_TOOLS = new Set(['write_file', 'edit_file', 'write_to_file', 'replace_file_content', 'multi_replace_file_content', 'replace_in_file', 'replace', 'MultiEdit', 'Write', 'Edit']);
export const SHELL_TOOLS = new Set(['run_command', 'run_shell_command', 'bash', 'Bash', 'execute_command', 'run_terminal_cmd']);
export const MAX_FILE = 4 * 1024 * 1024;
export const digest = value => crypto.createHash('sha256').update(value).digest('hex');
export const argsOf = p => p.toolCall?.args ?? p.tool_input ?? {};
export const toolOf = p => p.toolCall?.name ?? p.tool_name;
export function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
export function readBounded(file, limit = MAX_FILE) {
  const fd = fs.openSync(file, 'r');
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > limit) throw new Error('Expected a regular file within the size limit');
    const buffer = Buffer.alloc(stat.size + 1);
    const n = fs.readSync(fd, buffer, 0, buffer.length, 0);
    if (n > stat.size) throw new Error('File changed while being read; retry inspection');
    return buffer.subarray(0, n);
  } finally { fs.closeSync(fd); }
}
export function canonical(file) {
  const absolute = path.resolve(file);
  if (fs.existsSync(absolute)) return fs.realpathSync.native(absolute);
  const parent = path.dirname(absolute);
  if (parent === absolute) return absolute;
  return path.join(canonical(parent), path.basename(absolute));
}
export const pathKey = file => process.platform === 'win32' ? canonical(file).toLowerCase() : canonical(file);
export function within(file, root) {
  const relative = path.relative(pathKey(root), pathKey(file));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
export function context(p) {
  const cwd = p.cwd ?? p.workspacePaths?.[0];
  if (typeof cwd !== 'string' || !path.isAbsolute(cwd)) throw new Error('Host must provide absolute cwd or workspacePaths');
  const roots = p.workspacePaths?.length ? p.workspacePaths : [cwd];
  if (!roots.every(r => typeof r === 'string' && path.isAbsolute(r))) throw new Error('Invalid workspace roots');
  return {cwd: canonical(cwd), roots: roots.map(canonical), ambiguousRelative: !p.cwd && roots.length>1};
}
export function resolveFile(file, ctx) {
  if (typeof file !== 'string' || !file.trim() || file.includes('\0')) throw new Error('Invalid file path');
  if (ctx.ambiguousRelative && !path.isAbsolute(file)) throw new Error('Multiple workspaces require absolute target and evidence paths');
  const absolute = canonical(path.resolve(ctx.cwd, file));
  if (!ctx.roots.some(root => within(absolute, root))) throw new Error('Target or evidence escapes the mounted workspace');
  return absolute;
}
export function targets(p) {
  const keys = ['Path', 'path', 'TargetFile', 'target_file', 'targetFile', 'file_path', 'filePath', 'AbsolutePath'];
  const found = new Set();
  function visit(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 5) return;
    for (const key of keys) if (typeof obj[key] === 'string' && obj[key].trim()) found.add(obj[key]);
    for (const key of ['edits', 'files', 'changes', 'replacements', 'chunks', 'ReplacementChunks']) {
      if (Array.isArray(obj[key])) for (const item of obj[key]) {
        if (typeof item === 'string' && key === 'files') found.add(item);
        else visit(item, depth + 1);
      }
    }
  }
  visit(argsOf(p));
  return [...found];
}
export function hostArtifact(p, files) {
  return argsOf(p).IsArtifact === true && typeof p.artifactDirectoryPath === 'string' &&
    path.isAbsolute(p.artifactDirectoryPath) && files.length > 0 &&
    files.every(f => path.isAbsolute(f) && within(f, p.artifactDirectoryPath));
}
export function sessionDir(p, ctx) {
  const session = p.conversationId ?? p.session_id;
  if (typeof session !== 'string' || !session) throw new Error('Host session identifier is required for isolated snapshots');
  const root = process.env.ARGON_STATE_DIR ?? path.join(os.tmpdir(), 'argon-v10');
  return path.join(root, digest(JSON.stringify([session, ctx.roots.map(pathKey)])).slice(0, 40));
}
export function callKey(p) { return digest(JSON.stringify([p.tool_use_id ?? p.stepIdx ?? null, toolOf(p), argsOf(p)])); }
export function snapshotPath(p, ctx) { return path.join(sessionDir(p, ctx), `${callKey(p)}.json`); }
export function atomicJson(file, data) {
  fs.mkdirSync(path.dirname(file), {recursive: true, mode: 0o700});
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(data), {mode: 0o600, flag: 'wx'});
    fs.renameSync(tmp, file);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export function currentAssistantText(p, host) {
  // Inline input is a trusted adapter contract, never read from tool arguments.
  if (host !== 'antigravity' && typeof p.assistant_message === 'string') return p.assistant_message;
  let file = p.transcriptPath ?? p.transcript_path;
  if (typeof file !== 'string') throw new Error('Missing transcript path');
  if (file.startsWith('~/') || file.startsWith('~\\')) file = path.join(os.homedir(), file.slice(2));
  const fd = fs.openSync(file, 'r');
  let raw, start;
  try {
    const size = fs.fstatSync(fd).size;
    const bytes = Math.min(size, 2 * 1024 * 1024);
    start = size - bytes;
    const b = Buffer.alloc(bytes);
    const count = fs.readSync(fd, b, 0, bytes, start);
    raw = b.subarray(0, count).toString('utf8');
  } finally { fs.closeSync(fd); }
  const lines = raw.split(/\r?\n/);
  if (start > 0) lines.shift();
  const chunks = [];
  let boundary = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    let e;
    try { e = JSON.parse(lines[i]); } catch { throw new Error('Transcript is incomplete; retry after host flush'); }
    const role = e.role ?? e.message?.role;
    const content = e.message?.content ?? e.content;
    const toolResultOnly = Array.isArray(content) && content.length > 0 && content.every(c => c.type === 'tool_result');
    if (['USER', 'USER_EXPLICIT'].includes(e.source) || ['USER_INPUT', 'USER_MESSAGE'].includes(e.type) ||
        ((role === 'user' || e.type === 'user') && !toolResultOnly)) { boundary = true; break; }
    if (role === 'assistant' || e.type === 'assistant' || e.type === 'PLANNER_RESPONSE') {
      if (typeof content === 'string') chunks.push(content);
      else if (Array.isArray(content)) chunks.push(content.filter(c => c.type === 'text' && typeof c.text === 'string').map(c => c.text).join('\n'));
    }
  }
  if (!boundary) throw new Error('Current user-turn boundary not found within bounded transcript window');
  return chunks.reverse().join('\n');
}
