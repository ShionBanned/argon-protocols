import fs from 'node:fs';
import path from 'node:path';
import {readBounded, resolveFile, pathKey, digest} from './common.mjs';

const generic = new Set('const let var function return import export default class interface type async await true false null undefined void this super else while switch case break continue catch public private protected static readonly from'.split(' '));
const media = new Set('.mp4 .mov .mkv .webm .avi .wav .mp3 .flac .ogg .aac .m4a .png .jpg .jpeg .webp .gif .bmp .pdf .zip .gz .wasm'.split(' '));
export function parseAudit(text) {
  const blocks = [...text.matchAll(/<system_audit>\s*([\s\S]*?)\s*<\/system_audit>/g)];
  if (!blocks.length) throw new Error('Emit a current-turn <system_audit> with RISK, EVIDENCE and INVARIANT_CHECK before editing');
  const fields = {};
  for (const line of blocks.at(-1)[1].split(/\r?\n/)) {
    const m = /^([A-Z_]+):[ \t]*(.*)$/.exec(line.trim());
    if (!m) { if (line.trim()) throw new Error('Audit fields must each occupy one line'); continue; }
    if (Object.hasOwn(fields, m[1])) throw new Error(`Duplicate audit field: ${m[1]}`);
    fields[m[1]] = m[2];
  }
  if (!/^N[012]$/.test(fields.RISK ?? '')) throw new Error('RISK must be N0, N1 or N2');
  const matrix = /^(?:(ENG|SRF|SYS|PIP) x (JCE|CRF|DNS|MIN)|(DOC|PED|KEY|SHRT) x (BST|KYN|CIN|RAW))$/;
  if ((fields.RISK !== 'N0' || fields.MATRIX) && !matrix.test(fields.MATRIX ?? '')) throw new Error('Invalid or missing MATRIX');
  if ((fields.INVARIANT_CHECK ?? '').length < 15 || fields.INVARIANT_CHECK.trim().split(/\s+/).length < 3) throw new Error('State a concrete invariant in INVARIANT_CHECK');
  let anchors;
  try { anchors = JSON.parse(fields.EVIDENCE); } catch {
    let value = fields.EVIDENCE ?? '';
    if (!value.startsWith('[') || !value.endsWith(']')) throw new Error('EVIDENCE must be a JSON array');
    value = value.slice(1, -1);
    const re = /\s*((?:[A-Za-z]:)?[^\[\]\r\n,]+?):(\d+)\["([^"\r\n]+)"\]\s*(?:,\s*|$)/gy;
    anchors = []; let offset = 0;
    while (offset < value.length) { re.lastIndex = offset; const m = re.exec(value); if (!m) throw new Error('Malformed legacy evidence; use JSON anchors'); anchors.push({path:m[1].trim(), line:Number(m[2]), token:m[3]}); offset = re.lastIndex; }
  }
  if (!Array.isArray(anchors) || !anchors.length || anchors.length > 64) throw new Error('EVIDENCE requires 1-64 anchors');
  for (const a of anchors) if (!a || typeof a.path !== 'string' || !Number.isSafeInteger(a.line) || a.line < 0 || typeof a.token !== 'string') throw new Error('Each evidence anchor needs path, nonnegative integer line, and token');
  if (fields.RISK === 'N2' && !/^M(?:[1-9]|10|11):\s*\S.{14,}$/.test(fields.MODULE ?? '')) throw new Error('N2 requires MODULE: M1..M11: concrete plan (at least 15 characters)');
  return {fields, anchors};
}
export function verifyHeader(file) {
  const ext = path.extname(file).toLowerCase();
  const fd = fs.openSync(file, 'r');
  try {
    if (!fs.fstatSync(fd).isFile()) throw new Error('Asset must be a regular file');
    const b = Buffer.alloc(64); const n = fs.readSync(fd,b,0,64,0); const s = b.subarray(0,n);
    if (!n) throw new Error('Asset is empty');
    const ascii = (a,z) => s.subarray(a,z).toString('ascii');
    let valid;
    if (['.mp4','.mov','.m4a'].includes(ext)) valid = n >= 12 && ['ftyp','moov','wide','mdat','free','skip'].includes(ascii(4,8)) && s.readUInt32BE(0) >= 8;
    else if (['.wav','.avi','.webp'].includes(ext)) valid = n >= 12 && ascii(0,4) === 'RIFF' && ascii(8,12) === ({'.wav':'WAVE','.avi':'AVI ','.webp':'WEBP'})[ext];
    else if (ext === '.png') valid = s.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    else if (['.jpg','.jpeg'].includes(ext)) valid = n >= 3 && s[0] === 255 && s[1] === 216 && s[2] === 255;
    else if (ext === '.gif') valid = ['GIF87a','GIF89a'].includes(ascii(0,6));
    else if (ext === '.flac') valid = ascii(0,4) === 'fLaC';
    else if (ext === '.ogg') valid = ascii(0,4) === 'OggS';
    else if (ext === '.pdf') valid = ascii(0,5) === '%PDF-';
    else if (['.mkv','.webm'].includes(ext)) valid = s.subarray(0,4).equals(Buffer.from([26,69,223,163]));
    else if (ext === '.mp3') valid = ascii(0,3) === 'ID3' || (n >= 2 && s[0] === 255 && (s[1] & 224) === 224);
    else if (ext === '.aac') valid = n >= 2 && s[0] === 255 && (s[1] & 246) === 240;
    else if (ext === '.bmp') valid = ascii(0,2) === 'BM';
    else if (ext === '.zip') valid = s.subarray(0,2).equals(Buffer.from([80,75]));
    else if (ext === '.gz') valid = s[0] === 31 && s[1] === 139;
    else if (ext === '.wasm') valid = s.subarray(0,4).equals(Buffer.from([0,97,115,109]));
    else throw new Error('Unsupported MEDIA_ASSET format; inspect using the format-specific tool');
    if (!valid) throw new Error('Asset header does not match its extension');
  } finally { fs.closeSync(fd); }
}
export function validateAudit(audit, files, ctx) {
  const mapped = audit.anchors.map(a => ({...a, absolute: resolveFile(a.path,ctx)}));
  const unique = new Set(mapped.filter(a => a.token !== 'MEDIA_ASSET').map(a => pathKey(a.absolute)));
  if (unique.size > 3 && audit.fields.RISK !== 'N2') throw new Error('More than three editable files requires N2');
  if (unique.size > 1 && audit.fields.RISK === 'N0') throw new Error('N0 is limited to one editable file');
  const notes = [];
  for (const a of mapped) {
    const exists = fs.existsSync(a.absolute);
    if (a.line === 0 && a.token === 'NEW_FILE') { if (exists) throw new Error('NEW_FILE target already exists; read it again'); continue; }
    if (!exists) throw new Error('Evidence file does not exist');
    if (a.token === 'MEDIA_ASSET') { if (a.line !== 0) throw new Error('MEDIA_ASSET requires line 0'); verifyHeader(a.absolute); continue; }
    if (media.has(path.extname(a.absolute).toLowerCase())) throw new Error('Binary assets require MEDIA_ASSET evidence and are read-only');
    const buffer = readBounded(a.absolute);
    if (buffer.includes(0)) throw new Error('Binary files cannot use textual anchors');
    if (a.line === 0 && a.token === 'EMPTY_FILE') { if (buffer.length !== 0) throw new Error('EMPTY_FILE must be zero bytes'); continue; }
    if (a.line === 0 || a.token.trim().length < 4 || generic.has(a.token) || !/[\p{L}\p{N}]/u.test(a.token)) throw new Error('Use line >=1 and a specific token of at least four characters');
    const lines = buffer.toString('utf8').split(/\r?\n/);
    if (lines[a.line-1]?.includes(a.token)) continue;
    const matches = lines.map((line,i) => line.includes(a.token) && Math.abs(i+1-a.line)<=8 ? i+1 : null).filter(Boolean);
    if (matches.length !== 1) throw new Error('Anchor missing or ambiguous within +/-8 lines; re-read the target');
    notes.push(`Anchor reconciled: ${a.path}:${a.line} -> ${matches[0]}`);
  }
  for (const file of files) {
    const covered = mapped.filter(a => pathKey(a.absolute) === pathKey(file));
    if (!covered.length) throw new Error('Every edit target must appear in EVIDENCE');
    if (covered.some(a => a.token === 'MEDIA_ASSET') || media.has(path.extname(file).toLowerCase())) throw new Error('Source media cannot be edited by text mutation tools; render to a separate output');
  }
  const baseline = files.map(file => {
    const exists = fs.existsSync(file);
    const content = exists ? readBounded(file).toString('utf8') : '';
    return {file, exists, content, hash: digest(content)};
  });
  return {baseline, notes};
}
