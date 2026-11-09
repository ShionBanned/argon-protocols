#!/usr/bin/env bun
// hooks/post-edit-slop.ts — Argon v9.2 PostToolUse LCS Diff-Scoped Pattern Scanner
// Stateful String/Comment Sanitizer, Multi-Target Support & Non-Destructive IDE-Safe Diagnostics
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

interface HookPayload {
  conversationId?: string;
  session_id?: string;
  stepIdx?: number;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  cwd?: string;
}

interface SlopRule {
  id: string;
  description: string;
  regex: RegExp;
  extensions: Set<string>;
  useSanitizedCode: boolean;
}

const ALL_CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go"]);
const TS_JS_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const C_STYLE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".rs", ".go"]);

const SLOP_RULES: SlopRule[] = [
  {
    id: "LAZY_PLACEHOLDER",
    description:
      "Lazy or truncated placeholder comment (TODO, FIXME, 'existing code', 'rest of code')",
    regex:
      /(?:\/\/|#)\s*(TODO|FIXME|HACK|XXX|\.\.\.|resto del c[oó]digo|rest of code|existing code|implement here|remain unchanged)/i,
    extensions: ALL_CODE_EXTS,
    useSanitizedCode: false,
  },
  {
    id: "BLOCK_PLACEHOLDER",
    description: "Comment block used as an implementation placeholder",
    regex: /\/\*\s*(\.\.\.|TODO|implementar|implement here|existing)\s*\*\//i,
    extensions: C_STYLE_EXTS,
    useSanitizedCode: false,
  },
  {
    id: "TS_TYPE_EVASION",
    description: "Explicit TypeScript type system evasion (: any, as any)",
    regex: /(:\s*any\b|\bas\s+any\b)/,
    extensions: TS_JS_EXTS,
    useSanitizedCode: true,
  },
  {
    id: "COMPILER_SUPPRESSION",
    description:
      "Unjustified compiler diagnostic suppression (@ts-ignore, @ts-nocheck, eslint-disable)",
    regex:
      /(@ts-ignore|@ts-nocheck|@ts-expect-error(?!\s+\S+:)|eslint-disable(?!\s+[\w/-]+\s+--\s+\S+))/,
    extensions: TS_JS_EXTS,
    useSanitizedCode: false,
  },
  {
    id: "EMPTY_CATCH_BLOCK",
    description: "Empty catch block silently swallowing exceptions",
    regex: /\bcatch\s*(\([^)]*\))?\s*\{\s*\}/,
    extensions: C_STYLE_EXTS,
    useSanitizedCode: true,
  },
];

/**
 * Stateful lexical sanitizer that blanks out string literals ("...", '...', `...`)
 * and comments (//..., #..., /*...* /) while preserving exact line breaks.
 * Prevents false positives on URLs ("https://..."), UI labels ("Filter: any"), and hex colors ("#fff").
 */
function sanitizeCodePreservingLines(source: string, ext: string): string[] {
  const isPython = ext === ".py";
  const chars = Array.from(source);
  const out: string[] = [];
  let i = 0;
  const n = chars.length;

  let state: "CODE" | "SINGLE_Q" | "DOUBLE_Q" | "TEMPLATE_Q" | "LINE_COMMENT" | "BLOCK_COMMENT" =
    "CODE";

  while (i < n) {
    const ch = chars[i];
    const next = i + 1 < n ? chars[i + 1] : "";

    if (ch === "\n" || ch === "\r") {
      out.push(ch);
      if (state === "LINE_COMMENT" || state === "SINGLE_Q" || state === "DOUBLE_Q") {
        if (ch === "\n") state = "CODE";
      }
      i++;
      continue;
    }

    if (state === "LINE_COMMENT") {
      out.push(" ");
      i++;
      continue;
    }

    if (state === "BLOCK_COMMENT") {
      if (ch === "*" && next === "/") {
        out.push(" ", " ");
        state = "CODE";
        i += 2;
      } else {
        out.push(" ");
        i++;
      }
      continue;
    }

    if (state === "SINGLE_Q") {
      if (ch === "\\") {
        out.push(" ", " ");
        i += 2;
      } else if (ch === "'") {
        out.push("'");
        state = "CODE";
        i++;
      } else {
        out.push(" ");
        i++;
      }
      continue;
    }

    if (state === "DOUBLE_Q") {
      if (ch === "\\") {
        out.push(" ", " ");
        i += 2;
      } else if (ch === '"') {
        out.push('"');
        state = "CODE";
        i++;
      } else {
        out.push(" ");
        i++;
      }
      continue;
    }

    if (state === "TEMPLATE_Q") {
      if (ch === "\\") {
        out.push(" ", " ");
        i += 2;
      } else if (ch === "`") {
        out.push("`");
        state = "CODE";
        i++;
      } else {
        out.push(" ");
        i++;
      }
      continue;
    }

    // state === "CODE"
    if (!isPython && ch === "/" && next === "/") {
      out.push(" ", " ");
      state = "LINE_COMMENT";
      i += 2;
      continue;
    }

    if (!isPython && ch === "/" && next === "*") {
      out.push(" ", " ");
      state = "BLOCK_COMMENT";
      i += 2;
      continue;
    }

    if (isPython && ch === "#") {
      out.push(" ");
      state = "LINE_COMMENT";
      i++;
      continue;
    }

    if (ch === "'") {
      out.push("'");
      state = "SINGLE_Q";
      i++;
      continue;
    }

    if (ch === '"') {
      out.push('"');
      state = "DOUBLE_Q";
      i++;
      continue;
    }

    if (!isPython && ch === "`") {
      out.push("`");
      state = "TEMPLATE_Q";
      i++;
      continue;
    }

    out.push(ch);
    i++;
  }

  return out.join("").split(/\r?\n/);
}

/**
 * Computes newly added 0-based line indices in `newLines` compared to `oldLines`
 * using prefix/suffix trimming and LCS dynamic programming.
 */
function computeAddedLineIndices(oldLines: string[], newLines: string[]): Set<number> {
  const added = new Set<number>();
  let start = 0;
  while (
    start < oldLines.length &&
    start < newLines.length &&
    oldLines[start].trim() === newLines[start].trim()
  ) {
    start++;
  }

  let endOld = oldLines.length - 1;
  let endNew = newLines.length - 1;
  while (
    endOld >= start &&
    endNew >= start &&
    oldLines[endOld].trim() === newLines[endNew].trim()
  ) {
    endOld--;
    endNew--;
  }

  const sliceOld = oldLines.slice(start, endOld + 1).map((l) => l.trim());
  const sliceNew = newLines.slice(start, endNew + 1).map((l) => l.trim());

  const M = sliceOld.length;
  const N = sliceNew.length;

  if (N === 0) return added;
  if (M === 0) {
    for (let j = 0; j < N; j++) added.add(start + j);
    return added;
  }

  // Fallback to frequency multiset delta if hunk exceeds 2,500 lines to bound memory/latency <10ms
  if (M * N > 6_250_000) {
    const counts = new Map<string, number>();
    for (const l of sliceOld) {
      counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    for (let j = 0; j < N; j++) {
      const l = sliceNew[j];
      const c = counts.get(l) ?? 0;
      if (c > 0) {
        counts.set(l, c - 1);
      } else {
        added.add(start + j);
      }
    }
    return added;
  }

  const dp = new Int32Array((M + 1) * (N + 1));
  const width = N + 1;

  for (let i = M - 1; i >= 0; i--) {
    for (let j = N - 1; j >= 0; j--) {
      if (sliceOld[i] === sliceNew[j]) {
        dp[i * width + j] = 1 + dp[(i + 1) * width + (j + 1)];
      } else {
        const down = dp[(i + 1) * width + j];
        const right = dp[i * width + (j + 1)];
        dp[i * width + j] = down >= right ? down : right;
      }
    }
  }

  let i = 0;
  let j = 0;
  while (i < M && j < N) {
    if (sliceOld[i] === sliceNew[j]) {
      i++;
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + (j + 1)]) {
      i++;
    } else {
      added.add(start + j);
      j++;
    }
  }
  while (j < N) {
    added.add(start + j);
    j++;
  }

  return added;
}

function resolveTargetFiles(payload: HookPayload): string[] {
  const args = payload.toolCall?.args || payload.tool_input || {};
  const targets = new Set<string>();

  const scalarKeys = [
    "Path",
    "target_file",
    "TargetFile",
    "file_path",
    "filePath",
    "AbsolutePath",
    "path",
    "targetFile",
  ];

  for (const key of scalarKeys) {
    const val = args[key];
    if (typeof val === "string" && val.trim()) {
      targets.add(val.trim());
    }
  }

  const arrayKeys = ["edits", "files", "replacements", "changes", "chunks"];
  for (const arrKey of arrayKeys) {
    const list = args[arrKey];
    if (Array.isArray(list)) {
      for (const item of list) {
        if (typeof item === "string" && item.trim()) {
          targets.add(item.trim());
        } else if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          for (const key of scalarKeys) {
            const val = obj[key];
            if (typeof val === "string" && val.trim()) {
              targets.add(val.trim());
            }
          }
        }
      }
    }
  }

  return Array.from(targets);
}

function getStagingPaths(payload: HookPayload, cwd: string, absPath: string) {
  const sessionKey =
    payload.conversationId ||
    payload.session_id ||
    process.env.AGY_SESSION_ID ||
    crypto.createHash("sha256").update(cwd).digest("hex").slice(0, 12);
  const safeSession = String(sessionKey).replace(/[^a-zA-Z0-9_-]/g, "_");
  const stagingDir = path.join(os.tmpdir(), "argon-staging", safeSession);
  const hash = crypto
    .createHash("sha256")
    .update(path.normalize(absPath).toLowerCase())
    .digest("hex")
    .slice(0, 16);
  return {
    bakPath: path.join(stagingDir, `${hash}.bak`),
    metaPath: path.join(stagingDir, `${hash}.meta.json`),
  };
}

function cleanupStaging(payload: HookPayload, cwd: string, absPath: string): void {
  try {
    const { bakPath, metaPath } = getStagingPaths(payload, cwd, absPath);
    if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  } catch {
    // Ignore cleanup errors
  }
}

function optionalRollback(payload: HookPayload, cwd: string, absPath: string): boolean {
  if (process.env.ARGON_HARD_ROLLBACK !== "1") return false;
  try {
    const { bakPath, metaPath } = getStagingPaths(payload, cwd, absPath);
    if (!fs.existsSync(metaPath)) return false;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    if (meta.existed && fs.existsSync(bakPath)) {
      fs.copyFileSync(bakPath, absPath);
      cleanupStaging(payload, cwd, absPath);
      return true;
    } else if (!meta.existed && fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
      cleanupStaging(payload, cwd, absPath);
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

function main() {
  let rawInput = "";
  try {
    rawInput = fs.readFileSync(0, "utf-8");
  } catch {
    process.exit(0);
  }

  if (!rawInput.trim()) process.exit(0);

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawInput);
  } catch {
    process.exit(0);
  }

  const targetFiles = resolveTargetFiles(payload);
  if (targetFiles.length === 0) process.exit(0);

  const cwd = payload.cwd || process.cwd();
  const violations: string[] = [];

  for (const targetFile of targetFiles) {
    const absPath = path.isAbsolute(targetFile)
      ? targetFile
      : path.resolve(cwd, targetFile);

    if (!fs.existsSync(absPath)) continue;

    const ext = path.extname(absPath).toLowerCase();
    if (!ALL_CODE_EXTS.has(ext)) {
      cleanupStaging(payload, cwd, absPath);
      continue;
    }

    const { bakPath, metaPath } = getStagingPaths(payload, cwd, absPath);
    let oldLines: string[] = [];
    if (fs.existsSync(metaPath) && fs.existsSync(bakPath)) {
      try {
        oldLines = fs.readFileSync(bakPath, "utf-8").split(/\r?\n/);
      } catch {
        oldLines = [];
      }
    }

    const rawSource = fs.readFileSync(absPath, "utf-8");
    const newLines = rawSource.split(/\r?\n/);
    const sanitizedLines = sanitizeCodePreservingLines(rawSource, ext);
    const addedIndices = computeAddedLineIndices(oldLines, newLines);

    for (let i = 0; i < newLines.length; i++) {
      if (!addedIndices.has(i)) continue;

      const rawLine = newLines[i];
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const sanitizedLine = sanitizedLines[i] ?? "";

      for (const rule of SLOP_RULES) {
        if (!rule.extensions.has(ext)) continue;
        const subject = rule.useSanitizedCode ? sanitizedLine : rawLine;
        const match = rule.regex.exec(subject);
        if (match) {
          violations.push(
            `  - [${rule.id}] ${targetFile}:${i + 1}:${match.index + 1} -> ${rule.description}\n    Line: ${trimmed}`
          );
        }
      }
    }

    // Multiline empty catch check across newly added lines for C-style languages
    if (C_STYLE_EXTS.has(ext)) {
      const sanitizedFull = sanitizedLines.join("\n");
      const emptyCatchMultiline = /\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
      let m: RegExpExecArray | null;
      while ((m = emptyCatchMultiline.exec(sanitizedFull)) !== null) {
        const lineNumZeroBased =
          sanitizedFull.slice(0, m.index).split("\n").length - 1;
        if (addedIndices.has(lineNumZeroBased)) {
          const alreadyReported = violations.some((v) =>
            v.includes(`[EMPTY_CATCH_BLOCK] ${targetFile}:${lineNumZeroBased + 1}:`)
          );
          if (!alreadyReported) {
            violations.push(
              `  - [EMPTY_CATCH_BLOCK] ${targetFile}:${lineNumZeroBased + 1}:1 -> Empty catch block silently swallowing exceptions\n    Line: ${newLines[lineNumZeroBased]?.trim()}`
            );
          }
        }
      }
    }

    if (violations.length > 0) {
      optionalRollback(payload, cwd, absPath);
    }
    cleanupStaging(payload, cwd, absPath);
  }

  if (violations.length > 0) {
    const report = [
      `\n[ARGON-SLOP-SCANNER :: ${violations.length} DIFF VIOLATION(S) DETECTED]`,
      `Newly introduced lines contain forbidden AI slop patterns:`,
      ...violations,
      `\nREQUIRED ACTION: Apply a corrective edit removing all placeholders, untyped 'any' evasions, and empty catch blocks at the cited lines.`,
    ].join("\n");

    const isAntigravity = Boolean(
      process.env.ANTIGRAVITY_APP_DIR || process.env.AGY_SESSION_ID
    );
    if (isAntigravity) {
      process.stdout.write(
        JSON.stringify({
          decision: "deny",
          reason: report,
        })
      );
      process.exit(0);
    } else {
      process.stderr.write(`\n${report}\n`);
      process.exit(2);
    }
  }

  const isAntigravity = Boolean(
    process.env.ANTIGRAVITY_APP_DIR || process.env.AGY_SESSION_ID
  );
  if (isAntigravity) {
    process.stdout.write(JSON.stringify({ decision: "allow" }));
  }
  process.exit(0);
}

main();
