#!/usr/bin/env bun
// hooks/post-edit-slop.ts — Argon v9.0 PostToolUse Anti-Slop Enforcer
import * as fs from "node:fs";
import * as path from "node:path";

interface HookPayload {
  conversationId?: string;
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
  stripCommentsBeforeCheck?: boolean;
}

const SLOP_RULES: SlopRule[] = [
  {
    id: "LAZY_PLACEHOLDER",
    description: "Lazy or truncated placeholder comment (TODO, FIXME, 'existing code', 'rest of code')",
    regex: /\/\/\s*(TODO|FIXME|HACK|XXX|\.\.\.|resto del c[oó]digo|rest of code|existing code|implement here)/i,
  },
  {
    id: "BLOCK_PLACEHOLDER",
    description: "Comment block used as an implementation placeholder",
    regex: /\/\*\s*(\.\.\.|TODO|implementar|implement here|existing)\s*\*\//i,
  },
  {
    id: "TS_TYPE_EVASION",
    description: "Explicit type system evasion (: any, as any, <any>)",
    regex: /(:\s*any\b|\bas\s+any\b|<any>)/,
    stripCommentsBeforeCheck: true,
  },
  {
    id: "COMPILER_SUPPRESSION",
    description: "Compiler diagnostic suppression (@ts-ignore, @ts-nocheck, eslint-disable)",
    regex: /(@ts-ignore|@ts-nocheck|@ts-expect-error(?!\s+\S+:)|eslint-disable)/,
  },
  {
    id: "EMPTY_CATCH_BLOCK",
    description: "Empty catch block silently swallowing exceptions",
    regex: /catch\s*(\([^)]*\))?\s*\{\s*\}/,
    stripCommentsBeforeCheck: true,
  },
];

function stripLineComment(line: string): string {
  return line.replace(/\/\/.*$/, "");
}

function resolveTargetFile(payload: HookPayload): string | undefined {
  const args = payload.toolCall?.args || payload.tool_input || {};
  return (args.Path ||
    args.target_file ||
    args.TargetFile ||
    args.file_path ||
    args.path ||
    args.targetFile) as string | undefined;
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

  const targetFile = resolveTargetFile(payload);
  if (!targetFile) process.exit(0);

  const cwd = payload.cwd || process.cwd();
  const absPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(cwd, targetFile);

  if (!fs.existsSync(absPath)) process.exit(0);

  const ext = path.extname(absPath).toLowerCase();
  if (![".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go"].includes(ext)) {
    process.exit(0);
  }

  const lines = fs.readFileSync(absPath, "utf-8").split(/\r?\n/);
  const violations: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const codeOnlyLine = stripLineComment(rawLine);

    for (const rule of SLOP_RULES) {
      const targetStr = rule.stripCommentsBeforeCheck ? codeOnlyLine : rawLine;
      const match = rule.regex.exec(targetStr);
      if (match) {
        violations.push(
          `  - [${rule.id}] ${targetFile}:${i + 1}:${match.index + 1} -> ${rule.description}\n    Line: ${rawLine.trim()}`
        );
      }
    }
  }

  if (violations.length > 0) {
    const report = [
      `\n[ARGON-SLOP-LINTER :: ${violations.length} VIOLATION(S) DETECTED]`,
      `File "${targetFile}" was edited but contains forbidden AI slop:`,
      ...violations,
      `\nREQUIRED ACTION: Remove all placeholders, provide full typed implementations, and handle errors cleanly.`,
    ].join("\n");

    const isAntigravity = Boolean(process.env.ANTIGRAVITY_APP_DIR || process.env.AGY_SESSION_ID);
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

  const isAntigravity = Boolean(process.env.ANTIGRAVITY_APP_DIR || process.env.AGY_SESSION_ID);
  if (isAntigravity) {
    process.stdout.write(JSON.stringify({ decision: "allow" }));
  }
  process.exit(0);
}

main();
