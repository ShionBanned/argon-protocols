#!/usr/bin/env bun
// hooks/pre-edit-audit.ts — Argon v9.2 PreToolUse Deterministic Gate
// Multi-Target PCA, Proximity Drift Self-Healing, Reverse Tail Transcript Reader & OS Temp Staging
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

interface HookPayload {
  conversationId?: string;
  session_id?: string;
  stepIdx?: number;
  transcriptPath?: string;
  transcript_path?: string;
  cwd?: string;
  workspacePaths?: string[];
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
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
  isMediaAsset: boolean;
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

const SHELL_TOOLS = new Set([
  "run_command",
  "bash",
  "Bash",
  "execute_command",
  "run_terminal_cmd",
]);

const MEDIA_EXTENSIONS = new Set([
  ".mp4", ".mov", ".mkv", ".webm", ".avi",
  ".wav", ".mp3", ".flac", ".ogg", ".aac", ".m4a",
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp",
  ".pdf", ".zip", ".tar", ".gz", ".wasm",
]);

const LOW_ENTROPY_TOKENS = new Set([
  "const", "let", "var", "function", "return", "import", "export",
  "default", "class", "interface", "type", "async", "await", "true",
  "false", "null", "undefined", "void", "this", "super", "if", "else",
  "for", "while", "switch", "case", "break", "continue", "try", "catch",
  "public", "private", "protected", "static", "readonly", "from",
]);

// Domain-locked matrix validation: Software (ENG/SRF/SYS/PIP x JCE/CRF/DNS/MIN) or Media (DOC/PED/KEY/SHRT x BST/KYN/CIN/RAW)
const VALID_MATRIX_REGEX =
  /MATRIX:\s*(?:(?:ENG|SRF|SYS|PIP)\s*x\s*(?:JCE|CRF|DNS|MIN)|(?:DOC|PED|KEY|SHRT)\s*x\s*(?:BST|KYN|CIN|RAW))\b/i;

const MODULE_REGEX = /\b(?:MODULE:\s*)?M(?:1[01]|[1-9])\b/i;
const MAX_SELF_HEAL_DRIFT = 150;

function sleepSync(ms: number): void {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      // busy wait fallback
    }
  }
}

function respond(allowed: boolean, reason?: string, fix?: string, advisory?: string): never {
  const isAntigravity = Boolean(
    process.env.ANTIGRAVITY_APP_DIR || process.env.AGY_SESSION_ID
  );

  if (allowed) {
    if (isAntigravity) {
      const payloadOut: Record<string, string> = { decision: "allow" };
      if (advisory) payloadOut.reason = advisory;
      process.stdout.write(JSON.stringify(payloadOut));
    } else if (advisory) {
      process.stderr.write(`\n[ARGON-PCA-INFO] ${advisory}\n`);
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
    process.exit(2);
  }
}

/**
 * Reads only the tail (last 128KB) of the transcript file in O(1) time.
 */
function readTranscriptTail(filePath: string, maxBytes = 131072): string {
  const stat = fs.statSync(filePath);
  if (stat.size === 0) return "";
  const readSize = Math.min(maxBytes, stat.size);
  const startOffset = stat.size - readSize;
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(readSize);
    fs.readSync(fd, buf, 0, readSize, startOffset);
    return buf.toString("utf-8");
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Extracts assistant text strictly from the CURRENT turn with a 3x50ms retry cushion for disk flush lag.
 */
function extractCurrentTurnAssistantText(payload: HookPayload): {
  text: string;
  transcriptAvailable: boolean;
} {
  if (typeof payload.assistant_message === "string" && payload.assistant_message.trim()) {
    return { text: payload.assistant_message, transcriptAvailable: true };
  }

  const transcriptPath = payload.transcriptPath || payload.transcript_path;
  if (!transcriptPath) {
    return { text: "", transcriptAvailable: false };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    if (fs.existsSync(transcriptPath)) {
      try {
        const tailContent = readTranscriptTail(transcriptPath).trim();
        if (tailContent) {
          const lines = tailContent.split("\n");
          const collectedChunks: string[] = [];

          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (!line) continue;
            try {
              const entry = JSON.parse(line);
              if (
                entry.source === "USER" ||
                entry.role === "user" ||
                entry.type === "USER_MESSAGE" ||
                entry.type === "user"
              ) {
                break;
              }

              if (entry.source === "MODEL" || entry.type === "PLANNER_RESPONSE") {
                const chunk = [entry.thinking, entry.content].filter(Boolean).join("\n");
                if (chunk) collectedChunks.push(chunk);
              } else if (entry.role === "assistant" || entry.type === "assistant") {
                const msg = entry.message?.content ?? entry.content;
                if (typeof msg === "string") {
                  collectedChunks.push(msg);
                } else if (Array.isArray(msg)) {
                  const textPart = msg
                    .filter(
                      (c: { type?: string; text?: string }) =>
                        c.type === "text" || c.type === "thinking" || !c.type
                    )
                    .map((c: { text?: string; thinking?: string }) => c.text ?? c.thinking ?? "")
                    .join("\n");
                  if (textPart) collectedChunks.push(textPart);
                }
              }
            } catch {
              continue;
            }
          }

          const joined = collectedChunks.reverse().join("\n").trim();
          if (joined) {
            return { text: joined, transcriptAvailable: true };
          }
        }
      } catch {
        // Retry after cushion
      }
    }
    if (attempt < 2) sleepSync(50);
  }

  return {
    text: "",
    transcriptAvailable: Boolean(transcriptPath && fs.existsSync(transcriptPath)),
  };
}

function parseEvidenceAnchors(auditContent: string): EvidenceAnchor[] {
  const anchorRegex = /([^\s,\[\]:]+):(\d+)\["([^"]+)"\]/g;
  const anchors: EvidenceAnchor[] = [];
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(auditContent)) !== null) {
    const filePath = match[1];
    const line = parseInt(match[2], 10);
    const expectedToken = match[3];
    const ext = path.extname(filePath).toLowerCase();

    anchors.push({
      raw: match[0],
      filePath,
      line,
      expectedToken,
      isNewFile: line === 0 && expectedToken === "NEW_FILE",
      isMediaAsset:
        (line === 0 && expectedToken === "MEDIA_ASSET") || MEDIA_EXTENSIONS.has(ext),
    });
  }
  return anchors;
}

/**
 * Extracts all target file paths across both scalar and batch/multi-edit tool schemas.
 */
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

/**
 * Validates binary magic bytes for known media/binary formats.
 */
function verifyMediaMagicBytes(buf: Buffer, ext: string): boolean {
  if (buf.length < 4) return false;
  const ascii4 = buf.subarray(0, 4).toString("ascii");
  const ascii8 = buf.subarray(0, Math.min(8, buf.length)).toString("ascii");

  if (ext === ".mp4" || ext === ".mov" || ext === ".m4a") {
    return buf.includes(Buffer.from("ftyp")) || buf.includes(Buffer.from("moov"));
  }
  if (ext === ".wav" || ext === ".avi" || ext === ".webp") {
    return ascii4 === "RIFF";
  }
  if (ext === ".png") {
    return buf[0] === 0x89 && ascii4.slice(1) === "PNG";
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (ext === ".gif") {
    return ascii4 === "GIF8";
  }
  if (ext === ".flac") {
    return ascii4 === "fLaC";
  }
  if (ext === ".ogg") {
    return ascii4 === "OggS";
  }
  if (ext === ".pdf") {
    return ascii4 === "%PDF";
  }
  if (ext === ".mkv" || ext === ".webm") {
    return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  }
  if (ext === ".mp3" || ext === ".aac") {
    return ascii8.startsWith("ID3") || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0);
  }
  return true;
}

/**
 * Blocks shell redirections or inline interpreter scripts writing directly to source code files.
 * Benign commands (e.g., `npm test > results.json`, `git status`, `ffprobe`) pass freely without <system_audit>.
 */
function inspectShellBypass(payload: HookPayload): void {
  const args = payload.toolCall?.args || payload.tool_input || {};
  const cmd = String(
    args.command || args.CommandLine || args.cmd || args.script || ""
  ).trim();
  if (!cmd) return;

  const sourceWriteRedirectRegex =
    /(?:>|>>|\btee\s+|\bsed\s+-i|\bOut-File\b|\bSet-Content\b|\bAdd-Content\b)[^|;&]*?\.(ts|tsx|js|jsx|py|rs|go)\b/i;

  const inlineScriptWriteRegex =
    /\b(?:python3?|node|bun)\s+-(?:c|e)\s+[\s\S]*?(?:writeFileSync|write_text|\.write\s*\()[\s\S]*?\.(ts|tsx|js|jsx|py|rs|go)\b/i;

  if (sourceWriteRedirectRegex.test(cmd) || inlineScriptWriteRegex.test(cmd)) {
    respond(
      false,
      `Shell source-code mutation bypass detected: "${cmd.slice(0, 100)}"`,
      "Do not mutate source code files (.ts, .tsx, .js, .jsx, .py, .rs, .go) via terminal redirections or inline scripts. Use dedicated file editing tools with a valid <system_audit>."
    );
  }
}

function getSessionStagingDir(payload: HookPayload, cwd: string): string {
  const sessionKey =
    payload.conversationId ||
    payload.session_id ||
    process.env.AGY_SESSION_ID ||
    crypto.createHash("sha256").update(cwd).digest("hex").slice(0, 12);
  const safeSession = String(sessionKey).replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(os.tmpdir(), "argon-staging", safeSession);
}

function stageBackupForDiff(payload: HookPayload, cwd: string, targetFile: string): void {
  try {
    const absPath = path.isAbsolute(targetFile)
      ? targetFile
      : path.resolve(cwd, targetFile);
    const stagingDir = getSessionStagingDir(payload, cwd);
    fs.mkdirSync(stagingDir, { recursive: true });

    const hash = crypto
      .createHash("sha256")
      .update(path.normalize(absPath).toLowerCase())
      .digest("hex")
      .slice(0, 16);
    const bakPath = path.join(stagingDir, `${hash}.bak`);
    const metaPath = path.join(stagingDir, `${hash}.meta.json`);

    if (fs.existsSync(absPath)) {
      fs.copyFileSync(absPath, bakPath);
      fs.writeFileSync(
        metaPath,
        JSON.stringify({ existed: true, absPath, timestamp: Date.now() }),
        "utf-8"
      );
    } else {
      if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath);
      fs.writeFileSync(
        metaPath,
        JSON.stringify({ existed: false, absPath, timestamp: Date.now() }),
        "utf-8"
      );
    }
  } catch {
    // Non-fatal if OS temp dir is inaccessible
  }
}

function main() {
  let rawInput = "";
  try {
    rawInput = fs.readFileSync(0, "utf-8");
  } catch {
    respond(true);
  }

  if (!rawInput.trim()) respond(true);

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawInput);
  } catch {
    respond(true);
  }

  const toolName = payload.toolCall?.name || payload.tool_name || "";

  if (SHELL_TOOLS.has(toolName)) {
    inspectShellBypass(payload);
    respond(true);
  }

  if (!EDIT_TOOLS.has(toolName)) {
    respond(true);
  }

  const cwd = payload.cwd || process.cwd();
  const { text: assistantText, transcriptAvailable } =
    extractCurrentTurnAssistantText(payload);

  // Fail-closed by default unless ARGON_PERMISSIVE_TRANSCRIPT=1 is set for headless CI
  if (!transcriptAvailable) {
    if (process.env.ARGON_PERMISSIVE_TRANSCRIPT === "1") {
      respond(true);
    }
    respond(
      false,
      "Unable to verify session transcript or inline assistant_message (fail-closed gate).",
      "Ensure the host runner provides transcriptPath or assistant_message, or set ARGON_PERMISSIVE_TRANSCRIPT=1 in headless test scripts."
    );
  }

  if (!assistantText.trim()) {
    respond(
      false,
      "Invoked file mutation tool without emitting a <system_audit> block in the current turn.",
      "Emit a complete <system_audit> block before calling file editing tools."
    );
  }

  // 1. Validate <system_audit> block presence
  const auditMatch = assistantText.match(
    /<system_audit>([\s\S]*?)<\/system_audit>/
  );
  if (!auditMatch) {
    respond(
      false,
      "Attempted file mutation without a preceding <system_audit> block in the current turn.",
      'Emit a <system_audit> block with RISK, MATRIX, EVIDENCE: [path:line["exactToken"]], and INVARIANT_CHECK.'
    );
  }

  const auditBody = auditMatch[1];

  // 2. Validate Risk Tier (N0, N1, N2)
  const riskMatch = auditBody.match(/RISK:\s*(N[012])\b/);
  if (!riskMatch) {
    respond(
      false,
      "Missing or invalid RISK tier in <system_audit> (must be N0, N1, or N2).",
      "Declare `RISK: N0`, `RISK: N1`, or `RISK: N2` inside <system_audit>."
    );
  }
  const riskTier = riskMatch[1];

  // 3. Validate Orthogonal Execution Matrix (Mandatory for N1/N2; validated if present in N0)
  const hasMatrix = /MATRIX:/i.test(auditBody);
  if ((riskTier !== "N0" || hasMatrix) && !VALID_MATRIX_REGEX.test(auditBody)) {
    respond(
      false,
      "Missing or invalid domain-locked MATRIX (D x P) in <system_audit>.",
      "Declare a valid pairing: Software `<ENG|SRF|SYS|PIP> x <JCE|CRF|DNS|MIN>` or Media `<DOC|PED|KEY|SHRT> x <BST|KYN|CIN|RAW>`."
    );
  }

  // 4. Validate Substantive Invariant Check (minimum 3 words & >= 15 characters)
  const invMatch = auditBody.match(/INVARIANT(?:_CHECK)?:\s*(.+)/i);
  const invText = invMatch ? invMatch[1].trim() : "";
  if (invText.length < 15 || invText.split(/\s+/).length < 3) {
    respond(
      false,
      "Missing or superficial INVARIANT_CHECK in <system_audit>.",
      "Provide a concrete 1-line engineering invariant check (at least 3 words / 15 characters)."
    );
  }

  // 5. Extract and verify physical evidence anchors
  const anchors = parseEvidenceAnchors(auditBody);
  if (anchors.length === 0) {
    respond(
      false,
      "No valid evidence anchors found in EVIDENCE: [...].",
      'Use syntax: EVIDENCE: [path/file.ts:42["exactIdentifier"]] or path/new.ts:0["NEW_FILE"].'
    );
  }

  // 6. Enforce Heavy Module (M1-M11) instantiation on N2 or >3 files
  if ((riskTier === "N2" || anchors.length > 3) && !MODULE_REGEX.test(auditBody)) {
    respond(
      false,
      `High-complexity task (${riskTier}, ${anchors.length} files) requires an active reasoning module (M1-M11) in <system_audit>.`,
      "Declare and instantiate at least one module (e.g., `MODULE: M1 Data Chain`, `MODULE: M3 The Ledger`, or `MODULE: M4 Topological Order`) inside <system_audit>."
    );
  }

  const driftNotes: string[] = [];

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
          "Read the existing file first and cite a real line and identifier token as evidence."
        );
      }
      continue;
    }

    if (!exists) {
      respond(
        false,
        `File cited in EVIDENCE does not exist on disk: ${anchor.filePath}`,
        "Verify the file path before auditing."
      );
    }

    // Safe Multimodal Binary / Media Asset Verification with Magic-Byte Check
    if (anchor.isMediaAsset) {
      const stat = fs.statSync(absPath);
      if (stat.size === 0) {
        respond(
          false,
          `Media asset cited in EVIDENCE is empty (0 bytes): ${anchor.filePath}`,
          "Verify that the source media file is non-empty."
        );
      }
      const fd = fs.openSync(absPath, "r");
      const headerBuf = Buffer.alloc(Math.min(64, stat.size));
      fs.readSync(fd, headerBuf, 0, headerBuf.length, 0);
      fs.closeSync(fd);

      const ext = path.extname(absPath).toLowerCase();
      if (!verifyMediaMagicBytes(headerBuf, ext)) {
        respond(
          false,
          `Media asset ${anchor.filePath} failed binary header magic-byte verification for extension "${ext}".`,
          "Ensure the media file is a valid, uncorrupted binary container."
        );
      }
      continue;
    }

    // Entropy validation for text source tokens
    const cleanToken = anchor.expectedToken.trim();
    if (
      cleanToken.length < 4 ||
      LOW_ENTROPY_TOKENS.has(cleanToken) ||
      /^[\W_]+$/.test(cleanToken)
    ) {
      respond(
        false,
        `Token "${anchor.expectedToken}" in ${anchor.raw} has insufficient lexical entropy.`,
        "Cite a specific identifier, function name, or type name (>= 4 characters, not a generic keyword like 'const' or 'return')."
      );
    }

    const fileLines = fs.readFileSync(absPath, "utf-8").split(/\r?\n/);
    if (anchor.line < 1 || anchor.line > fileLines.length) {
      // Check if line drifted slightly beyond EOF after prior deletions
      const matchingLines: number[] = [];
      for (let idx = 0; idx < fileLines.length; idx++) {
        if (fileLines[idx].includes(anchor.expectedToken)) {
          matchingLines.push(idx + 1);
        }
      }
      if (matchingLines.length > 0) {
        const closest = matchingLines.reduce((prev, curr) =>
          Math.abs(curr - anchor.line) < Math.abs(prev - anchor.line) ? curr : prev
        );
        if (Math.abs(closest - anchor.line) <= MAX_SELF_HEAL_DRIFT) {
          driftNotes.push(
            `Auto-healed drift on ${anchor.filePath}: cited line ${anchor.line} -> reconciled to line ${closest}.`
          );
          continue;
        }
      }
      respond(
        false,
        `Reference ${anchor.raw} targets line ${anchor.line}, but ${anchor.filePath} has ${fileLines.length} lines.`,
        "Read the file and cite an accurate line number within bounds."
      );
    }

    // Primary tolerance window of +-8 lines
    const startIdx = Math.max(0, anchor.line - 9);
    const endIdx = Math.min(fileLines.length - 1, anchor.line + 7);
    const windowSlice = fileLines.slice(startIdx, endIdx + 1).join("\n");

    if (!windowSlice.includes(anchor.expectedToken)) {
      // Distance-proximity search across the file for True Self-Healing Reconciliation
      const matchingLines: number[] = [];
      for (let idx = 0; idx < fileLines.length; idx++) {
        if (fileLines[idx].includes(anchor.expectedToken)) {
          matchingLines.push(idx + 1);
        }
      }

      if (matchingLines.length > 0) {
        const closestLine = matchingLines.reduce((prev, curr) =>
          Math.abs(curr - anchor.line) < Math.abs(prev - anchor.line) ? curr : prev
        );
        const driftDistance = Math.abs(closestLine - anchor.line);

        if (matchingLines.length === 1 || driftDistance <= MAX_SELF_HEAL_DRIFT) {
          driftNotes.push(
            `Auto-healed line drift on ${anchor.filePath}: cited ${anchor.line} -> found "${anchor.expectedToken}" at line ${closestLine} (delta ${driftDistance} lines).`
          );
          continue;
        }

        respond(
          false,
          `Excessive line drift (${driftDistance} lines) at ${anchor.filePath}:${anchor.line}. Closest occurrence of "${anchor.expectedToken}" is at line ${closestLine}.`,
          `Re-verify the target region and update your anchor to: ${anchor.filePath}:${closestLine}["${anchor.expectedToken}"]`
        );
      }

      respond(
        false,
        `At ${anchor.filePath}:${anchor.line} (and across the entire file), token "${anchor.expectedToken}" was not found. Line ${anchor.line} contains: "${fileLines[anchor.line - 1].trim()}"`,
        "Read the target file and cite an exact identifier present in the file."
      );
    }
  }

  // 7. Verify multi-target coverage and stage baseline snapshots in OS temp dir
  const targetFiles = resolveTargetFiles(payload);
  for (const targetFile of targetFiles) {
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
        `Target file "${targetFile}" is not listed in the EVIDENCE anchors of your <system_audit>.`,
        `Add a verifiable anchor for "${targetFile}" inside EVIDENCE: [...].`
      );
    }

    stageBackupForDiff(payload, cwd, targetFile);
  }

  respond(
    true,
    undefined,
    undefined,
    driftNotes.length > 0 ? driftNotes.join(" | ") : undefined
  );
}

main();
