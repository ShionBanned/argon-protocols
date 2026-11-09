#!/usr/bin/env bun
// hooks/pre-edit-audit.ts — Argon v9.0 PreToolUse Deterministic Gate
// Proof-Carrying Audit (PCA) with Lexical Anchoring
import * as fs from "node:fs";
import * as path from "node:path";

interface HookPayload {
  // Common & Antigravity fields
  conversationId?: string;
  stepIdx?: number;
  transcriptPath?: string;
  transcript_path?: string;
  cwd?: string;
  workspacePaths?: string[];
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  // Claude Code / Standard fields
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  assistant_message?: string;
}

interface EvidenceAnchor {
  raw: string;
  filePath: string;
  line: number;
  expectedToken: string;
  isNewFile: boolean;
}

const EDIT_TOOLS = new Set([
  "write_file",
  "edit_file",
  "write_to_file",
  "replace_file_content",
  "multi_replace_file_content",
  "replace_in_file",
  "MultiEdit",
  "Write",
  "Edit",
]);

function respond(allowed: boolean, reason?: string, fix?: string): never {
  const isAntigravity = Boolean(process.env.ANTIGRAVITY_APP_DIR || process.env.AGY_SESSION_ID);

  if (allowed) {
    if (isAntigravity) {
      process.stdout.write(JSON.stringify({ decision: "allow" }));
    }
    process.exit(0);
  }

  const errMessage = [
    `[ARGON-GATE-BLOCK]`,
    `CAUSE: ${reason ?? "Audit requirements not satisfied."}`,
    `REQUIRED ACTION: ${fix ?? "Provide a valid <system_audit> block with verified lexical evidence."}`,
  ].join("\n");

  if (isAntigravity) {
    process.stdout.write(
      JSON.stringify({
        decision: "deny",
        reason: errMessage,
      })
    );
    process.exit(0);
  } else {
    process.stderr.write(`\n${errMessage}\n`);
    // Exit code 2 in Claude Code / Unix toolgates blocks execution and feeds stderr to LLM
    process.exit(2);
  }
}

function extractLastAssistantText(payload: HookPayload): string {
  if (payload.assistant_message) return payload.assistant_message;

  const transcriptPath = payload.transcriptPath || payload.transcript_path;
  if (transcriptPath && fs.existsSync(transcriptPath)) {
    try {
      const content = fs.readFileSync(transcriptPath, "utf-8").trim();
      const lines = content.split("\n");
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const entry = JSON.parse(line);
          // Antigravity format
          if (entry.source === "MODEL" || entry.type === "PLANNER_RESPONSE") {
            if (typeof entry.content === "string") return entry.content;
            if (typeof entry.thinking === "string") return entry.thinking + "\n" + (entry.content || "");
          }
          // Claude Code / OpenAI format
          if (entry.role === "assistant" || entry.type === "assistant") {
            const msg = entry.message?.content ?? entry.content;
            if (typeof msg === "string") return msg;
            if (Array.isArray(msg)) {
              return msg
                .filter((c: { type?: string; text?: string }) => c.type === "text" || !c.type)
                .map((c: { text?: string }) => c.text ?? "")
                .join("\n");
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      // Fallback if transcript reading fails
    }
  }
  return "";
}

/**
 * Extracts evidence anchors from the audit body:
 *   EVIDENCE: [src/core/engine.ts:45["executeTick"], src/new/module.ts:0["NEW_FILE"]]
 *   or bullet points: - src/core/engine.ts:45["executeTick"]
 */
function parseEvidenceAnchors(auditContent: string): EvidenceAnchor[] {
  const anchorRegex = /([^\s,\[\]:]+):(\d+)\["([^"]+)"\]/g;
  const anchors: EvidenceAnchor[] = [];
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(auditContent)) !== null) {
    anchors.push({
      raw: match[0],
      filePath: match[1],
      line: parseInt(match[2], 10),
      expectedToken: match[3],
      isNewFile: match[2] === "0" && match[3] === "NEW_FILE",
    });
  }
  return anchors;
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
    respond(true);
  }

  if (!rawInput.trim()) {
    respond(true);
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawInput);
  } catch {
    respond(true);
  }

  const toolName = payload.toolCall?.name || payload.tool_name || "";
  if (!EDIT_TOOLS.has(toolName)) {
    respond(true);
  }

  const cwd = payload.cwd || process.cwd();
  const assistantText = extractLastAssistantText(payload);

  // If we couldn't inspect transcript (e.g. initial sandbox or unavailable log), permit execution
  if (!assistantText) {
    respond(true);
  }

  // 1. Validate existence of <system_audit>
  const auditMatch = assistantText.match(/<system_audit>([\s\S]*?)<\/system_audit>/);
  if (!auditMatch) {
    respond(
      false,
      "Attempted file mutation without preceding valid <system_audit> block in current turn.",
      'Emit a <system_audit> block with RISK, MATRIX, and EVIDENCE: [path:line["exactToken"]] before invoking the tool.'
    );
  }

  const auditBody = auditMatch[1];

  // 2. Validate Risk Tier
  if (!/RISK:\s*N[012]\b/.test(auditBody)) {
    respond(
      false,
      "The <system_audit> block does not declare a valid risk tier (RISK: N0 | N1 | N2).",
      "Classify architectural risk tier (RISK: N0, N1, or N2) before proceeding."
    );
  }

  // 3. Extract and verify physical evidence anchors on disk
  const anchors = parseEvidenceAnchors(auditBody);
  if (anchors.length === 0) {
    respond(
      false,
      "No valid evidence anchors found in EVIDENCE: [...].",
      'Use exact syntax: EVIDENCE: [path/file.ts:42["exactIdentifier"]] or path/new.ts:0["NEW_FILE"].'
    );
  }

  for (const anchor of anchors) {
    const absPath = path.isAbsolute(anchor.filePath)
      ? anchor.filePath
      : path.resolve(cwd, anchor.filePath);
    const exists = fs.existsSync(absPath);

    if (anchor.isNewFile) {
      if (exists) {
        respond(
          false,
          `Declared ${anchor.filePath}:0["NEW_FILE"], but the file ALREADY EXISTS on disk.`,
          "Read the existing file first and cite a real line as evidence."
        );
      }
      continue;
    }

    if (!exists) {
      respond(
        false,
        `File cited in evidence does not exist: ${anchor.filePath}`,
        "Verify the actual path using file reading/search tools before auditing."
      );
    }

    const fileLines = fs.readFileSync(absPath, "utf-8").split(/\r?\n/);
    if (anchor.line < 1 || anchor.line > fileLines.length) {
      respond(
        false,
        `Reference ${anchor.raw} targets line ${anchor.line}, but ${anchor.filePath} only has ${fileLines.length} lines.`,
        "Do not hallucinate line numbers. Read the real file and cite the exact line."
      );
    }

    // Tolerance window of +-5 lines to absorb line drift across edits
    const startIdx = Math.max(0, anchor.line - 6);
    const endIdx = Math.min(fileLines.length - 1, anchor.line + 4);
    const windowSlice = fileLines.slice(startIdx, endIdx + 1).join("\n");

    if (!windowSlice.includes(anchor.expectedToken)) {
      respond(
        false,
        `At ${anchor.filePath}:${anchor.line} (window ±5 lines) the token "${anchor.expectedToken}" was not found. Content at line ${anchor.line}: "${fileLines[anchor.line - 1].trim()}"`,
        "Read the file before editing and cite a real token present on that line."
      );
    }
  }

  // 4. Verify that the file targeted by the tool is covered in evidence
  const targetFile = resolveTargetFile(payload);
  if (targetFile) {
    const normTarget = path.isAbsolute(targetFile)
      ? path.normalize(targetFile).toLowerCase()
      : path.normalize(path.resolve(cwd, targetFile)).toLowerCase();

    const isCovered = anchors.some((a) => {
      const aAbs = path.isAbsolute(a.filePath)
        ? path.normalize(a.filePath).toLowerCase()
        : path.normalize(path.resolve(cwd, a.filePath)).toLowerCase();
      return aAbs === normTarget;
    });

    if (!isCovered) {
      respond(
        false,
        `Attempting to modify "${targetFile}", but this file is not declared in EVIDENCE anchors of your <system_audit>.`,
        `Include a verifiable anchor for "${targetFile}" inside EVIDENCE: [...].`
      );
    }
  }

  respond(true);
}

main();
