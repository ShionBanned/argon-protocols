import path from 'node:path';
import ts from 'typescript';

export const scannedExtensions = new Set(['.ts','.tsx','.mts','.cts','.js','.jsx','.mjs','.cjs']);
export function scan(source, file) {
  if (!scannedExtensions.has(path.extname(file).toLowerCase())) return [];
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const findings = [], comments = new Map();
  const add = (id, start, text, message) => {
    const pos = tree.getLineAndCharacterOfPosition(start);
    findings.push({id, line:pos.line+1, column:pos.character+1, key:`${id}:${text.replace(/\s+/g,' ').trim()}`, message});
  };
  const rangesAt = position => {
    for (const r of [...(ts.getLeadingCommentRanges(source,position) ?? []), ...(ts.getTrailingCommentRanges(source,position) ?? [])]) comments.set(r.pos,r);
  };
  function visit(node) {
    rangesAt(node.pos); rangesAt(node.end);
    if (node.kind === ts.SyntaxKind.AnyKeyword) add('EXPLICIT_ANY',node.getStart(tree),node.parent.getText(tree),'Review explicit any; prefer a verified type or unknown with narrowing');
    if (ts.isCatchClause(node) && node.block.statements.length === 0) {
      const body = source.slice(node.block.getStart(tree)+1,node.block.end-1).trim();
      // A documented deliberate ignore is reviewable; an empty body is not.
      if (!body) add('EMPTY_CATCH',node.getStart(tree),'catch {}','Handle, propagate, or document why this specific exception is safe to ignore');
    }
    ts.forEachChild(node,visit);
  }
  visit(tree); rangesAt(0); rangesAt(source.length);
  for (const r of comments.values()) {
    const comment = source.slice(r.pos,r.end);
    if (/(?:@ts-ignore|@ts-nocheck)\b/.test(comment)) add('COMPILER_SUPPRESSION',r.pos,comment,'Remove blanket suppression or use a documented narrow expectation');
    if (/@ts-expect-error\b/.test(comment) && !/@ts-expect-error\s*:?\s*\S.{7,}/.test(comment)) add('UNDOCUMENTED_EXPECTATION',r.pos,comment,'Explain the expected type error');
    if (/eslint-disable/.test(comment) && !/eslint-disable(?:-next-line|-line)?\s+[\w/@,-]+\s+--\s+\S.{7,}/.test(comment)) add('UNDOCUMENTED_LINT_DISABLE',r.pos,comment,'Name the disabled rule and give a reason after --');
    // TODO/FIXME can record real follow-up work; only explicit truncated implementation markers are flagged.
    if (/^\s*(?:\/\/|\/\*)\s*(?:\.\.\.|rest of (?:the )?code|existing code|implement here|resto del c[oó]digo)\s*(?:\*\/)?\s*$/i.test(comment)) add('TRUNCATED_IMPLEMENTATION',r.pos,comment,'Replace the omitted implementation with working code');
  }
  return findings;
}
export function newFindings(before, after, file) {
  const counts = new Map();
  for (const f of scan(before,file)) counts.set(f.key,(counts.get(f.key) ?? 0)+1);
  return scan(after,file).filter(f => {
    const count = counts.get(f.key) ?? 0;
    if (count > 0) { counts.set(f.key,count-1); return false; }
    return true;
  });
}
