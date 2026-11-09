# Argon Protocols (v9.2 Hybrid)

[![Version](https://img.shields.io/badge/Version-9.2.0-blue.svg?style=for-the-badge)](https://github.com/ShionBanned/argon-protocols)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-Proof--Carrying%20Audit%20%28PCA%29-purple?style=for-the-badge)](#1-proof-carrying-audit-pca-with-lexical-anchoring)
[![Compatibility](https://img.shields.io/badge/Compatibility-Antigravity%20|%20Claude%20Code-success?style=for-the-badge)](#installation--integration)
[![Launch Video](https://img.shields.io/badge/Watch-Launch%20Video%20(24s)-E62117?style=for-the-badge&logo=youtube&logoColor=white)](https://github.com/ShionBanned/argon-protocols/releases/download/v9.2.0/Argon_Protocols_v9_Launch_Video.mp4)

**[English](README.md)** · **[Español](README_ES.md)**

> **Proof-Carrying Audit (PCA) & Diff-Scoped Runtime Governance for Autonomous AI Coding Agents.**  
> *Engineered to pair compact semantic skill specifications with deterministic pre- and post-mutation hooks in Google Antigravity and Claude Code.*

---

## 🎬 Official Presentation Video

https://github.com/user-attachments/assets/083ab72b-3096-4468-88e8-8e1c9b637a7b

---

## Problem Statement & Core Architecture

In prompt-only frameworks (**Argon v8.0**), agent guardrails relied exclusively on prompt instructions ("soft-steering"). Under extended context windows, fast models (such as **Gemini Flash** or **Claude Haiku**) frequently exhibit *Compliance Theater*—emitting superficial audit blocks, guessing line numbers without reading target files, or leaving truncated `// TODO` placeholders to conserve output tokens.

**Argon v9.2 Hybrid** separates semantic guidance from mechanical enforcement:

1. **The Prompt (`SKILL.md` ~90 lines per skill):** Functions as a compact **Semantic & Invariant Specification**, mitigating attention degradation in long contexts.
2. **The Runtime (`hooks/` in TypeScript/Bun):** Functions as a **Deterministic Lexical Gatekeeper, Magic-Byte Media Validator, and LCS Diff-Scoped Pattern Scanner**.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                ARGON v9.2 HYBRID TOPOLOGY                              │
│                                                                                        │
│   Fast Agent Model (e.g. Gemini Flash / Claude Haiku)                                  │
│   [ High Throughput · Low Latency · Compact Semantic Context ]                         │
│                                      │                                                 │
│                                      ▼                                                 │
│   SEMANTIC SKILL SPEC (~90 lines per skill)                                            │
│   ├─ N0 / N1 / N2 Risk Tier Routing & 6-Step Execution Lifecycle                       │
│   ├─ Domain-Locked Execution Matrix (Domain D x Profile P)                             │
│   └─ Proof-Carrying Audit Block: <system_audit> in current turn transcript             │
│                                      │                                                 │
│                                      ▼ (Host passes JSON payload via STDIN)            │
│   RUNTIME INTERCEPTOR GATES ({{PLUGIN_DIR}}/hooks/...)                                 │
│   ├─ PreToolUse (`pre-edit-audit.ts`):                                                 │
│   │   • Reads last 128KB of transcript (3x50ms retry cushion, fail-closed default)     │
│   │   • Enforces RISK, domain-locked MATRIX (N1/N2), MODULE (N2), and multi-target     │
│   │   • Text files: verifies identifier token (+-8 lines) with proximity auto-healing  │
│   │   • Binary media: validates non-empty disk presence & 64B header magic bytes       │
│   │   • Blocks shell source-code writes (`> file.ts`, `sed -i`); allows test/read CLI  │
│   │   • Stages baseline snapshots in `os.tmpdir()/argon-staging/<session>/`            │
│   └─ PostToolUse (`post-edit-slop.ts`):                                                │
│       • Computes added lines via LCS diff against `os.tmpdir()` baseline               │
│       • Masks string literals ("...", '...', `...`) and comments before syntax checks  │
│       • Emits non-destructive line diagnostics without desynchronizing IDE buffers     │
│                                      │                                                 │
│                                      ▼                                                 │
│   Verified Working Tree (Audited Edits · Clean Diffs · Zero Repo Pollution)            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Goals & Non-Goals

### Goals
* **Require Lexical Anchor Verification Before Mutations:** Mechanically verify that agents have inspected every target file (via high-entropy identifier tokens) prior to executing single-file or batch edits (`MultiEdit`).
* **Preserve Brownfield Compatibility via LCS Diffing:** Restrict post-edit pattern scanning strictly to newly added or modified lines so legacy files with pre-existing `TODO` comments can be surgically patched without triggering unprompted refactoring.
* **Prevent Workspace & IDE Desynchronization:** Store temporary diff snapshots in `os.tmpdir()/argon-staging/` (never polluting `git status`) and return explicit line-level rejection diagnostics rather than overwriting IDE in-memory buffers on disk.
* **Eliminate Regex False Positives on Strings:** Mask string literals and comments via a stateful lexical sanitizer before checking for TypeScript `: any` / `as any` or empty `catch {}` blocks.

### Non-Goals
* **Full Compiler Type-Checking Inside Runtime Hooks:** The runtime hooks perform fast (<15ms) lexical proof checks and diff-scoped pattern scanning; full AST compilation, static type-checking (`tsc`, `cargo check`), and test execution occur in Step 5 of the execution lifecycle.

---

## The 4 Pillars of Argon v9.2

### 1. Proof-Carrying Audit (PCA) with Lexical Anchoring
Before invoking any file mutation tool (`edit_file`, `write_file`, `MultiEdit`, `multi_replace_file_content`), the agent must emit a `<system_audit>` block in its current conversational response:

```xml
<system_audit>
RISK: N1
MATRIX: SYS x MIN
MODULE: NONE
EVIDENCE: [src/core/auth.ts:42["validateSessionToken"], src/new/route.ts:0["NEW_FILE"]]
INVARIANT_CHECK: Preserves POSIX exit codes and idempotent session lookup
</system_audit>
```

The host environment invokes `pre-edit-audit.ts` and passes the tool call event metadata via standard input (`STDIN`). The hook reads the active session transcript (`transcriptPath` or inline `assistant_message`), isolates the current turn, and validates:
* **Reserved Protocol Literals (`NEW_FILE` & `MEDIA_ASSET`):** Newly created files must be declared at line `0` with the literal token `"NEW_FILE"` (`path/new.ts:0["NEW_FILE"]`); the hook verifies the file does not already exist on disk. Optional binary media references use line `0` with `"MEDIA_ASSET"` (`source.mp4:0["MEDIA_ASSET"]`), triggering a 64-byte magic-number header check (`ftyp`, `RIFF`, `ID3`, `PNG`, `JPEG`, `fLaC`, `EBML`).
* **Lexical Entropy & Proximity Self-Healing:** For existing text files, the cited token must be a specific identifier (`>= 4` characters, excluding generic language keywords like `const` or `return`). If prior edits shifted the token beyond the `+-8` line window, the hook locates the closest occurrence by absolute line distance (`<= 150` lines) and **auto-reconciles the drift without blocking execution**.
* **Terminal Execution Scope:** Standard diagnostic and build commands (`npm test`, `git status`, `ffprobe`) execute freely **without** requiring a `<system_audit>` block. The hook only blocks shell commands that attempt to bypass file editors by redirecting output directly into source code files (`> app.ts`, `sed -i`, `python -c "...write..."`).

### 2. Orthogonal Execution Matrices (D x P)
Tasks in `N1` and `N2` are classified across two domain-locked orthogonal axes—**Domain (D)** (architectural invariants) and **Profile (P)** (operational modulation)—validated mechanically by `pre-edit-audit.ts` (optional for trivial `N0` edits):

* **Software Engineering (`argon-core` & `argon-builder`):**
  * **Domain D:**
    * `ENG` (**Engine**): Interactive loops, Canvas/WebGL, audio DSP. Invariants: **Zero-GC Loop** (zero object allocations inside `update()`/`render()`, static object pooling, `dt` clamped to `<= 0.1s`).
    * `SRF` (**Surface**): Web/mobile UI and design systems. Invariants: zero layout shift (`CLS == 0`), `WCAG_AA`, and explicit **5-State UI** implementation (`Empty`, `Loading`, `Success`, `Error with Recovery`, and `Overflow`).
    * `SYS` (**System**): CLIs, daemons, RPC/REST APIs, compiler hooks. Invariants: standard POSIX exit codes, graceful `SIGINT`/`SIGTERM` shutdown, idempotent I/O.
    * `PIP` (**Pipeline**): ETL, stream workers, queues, SQL migrations. Invariants: bounded backpressure, Dead-Letter Queue (`DLQ`), atomic checkpoints.
  * **Profile P:** `JCE` (**Juice** — spring physics & kinetic feedback) | `CRF` (**Craft** — 4px/8px Swiss grid & editorial precision) | `DNS` (**Dense** — high data-ink ratio, tabular numerals, 100% hotkeys) | `MIN` (**Minimal** — zero external dependencies, raw UNIX stdio).
* **Audiovisual Engineering (`argon-director`):**
  * **Domain D:** `SHRT` (**Shorts** — 9:16 vertical, `<= 2.5s` hook) | `PED` (**Pedagogy** — 16:9 technical screencast) | `KEY` (**Keynote** — product launch showcase) | `DOC` (**Documentary** — narrative/archival).
  * **Profile P:** `BST` (**Beast** — pattern interrupts every 2.5–3.5s) | `KYN` (**Keynote Craft** — clean geometry & sub-bass swells) | `CIN` (**Cinematic** — wide dynamic range) | `RAW` (**Raw** — unedited live terminal flow).

### 3. Risk Tier Routing (`N0 / N1 / N2`), Conditional Modules (`M1–M11`) & 6-Step Lifecycle
Defined in [`skills/argon-core/SKILL.md`](skills/argon-core/SKILL.md):

#### Risk Tiers
* **`N0` (Trivial):** `<= 5` lines in 1 file, zero external contract changes (`MATRIX` and `MODULE` optional).
* **`N1` (Standard):** 1–3 files, module-scoped changes (`MATRIX` required; verified via `typecheck && lint && test`).
* **`N2` (High Risk):** `> 3` files, shared schemas, auth, or concurrency (`MATRIX` and at least one `MODULE: M1..M11` required).

#### On-Demand Heavy Modules (`M1–M11`)
Instantiated inside `<system_audit>` when triggered (mandatory for `RISK: N2`):
* **`M1 Data Chain`** (*Trigger: datum crosses `>= 3` files*): Traces `File:Fn -> in(Type) -> mutation -> out(Type) -> Next`.
* **`M2 Distilled Facts`** (*Trigger: inspecting `> 3` files*): Lists exact function signatures and invariants (`<= 15` lines).
* **`M3 The Ledger`** (*Trigger: plan modifies `> 3` files*): Tracks `FROZEN CONTRACT`, `COMPLETED`, `CURRENT`, `PENDING`.
* **`M4 Topological Order`** (*Trigger: shared contract change*): Orders edits from base types -> core logic -> UI consumers.
* **`M5 Concurrency Timeline`** (*Trigger: async shared state*): Maps interleaved execution table `T1, T2...` across actors.
* **`M6 Binary Instrumentation`** (*Trigger: bug with `>= 2` hypotheses and no stacktrace*): Bisects state with temporary `[DEBUG-TMP]` logs.
* **`M7 Decoupled Algorithm`** (*Trigger: non-trivial algorithm*): States invariant, 5–10 line pseudocode, and boundary desk-check.
* **`M8 State Machine Table`** (*Trigger: `>= 2` interacting boolean flags*): Replaces booleans with discriminated union table `STATE | EVENT | NEXT_STATE`.
* **`M9 Boolean Decomposition`** (*Trigger: `> 2` logical operators in auth/billing*): Extracts named boolean constants and truth table.
* **`M10 Black Box`** (*Trigger: legacy spaghetti function*): Redefines `INPUTS -> OUTPUTS -> SIDE EFFECTS` contract prior to rewrite.
* **`M11 Turn Partitioning`** (*Trigger: `N2` touching `> 4` files*): Splits work into Phase A (Audit & Contracts) and Phase B (Sequential Edits).

#### The 6-Step Execution Lifecycle
1. **Step 1 (Declaration):** State `OBJECTIVE`, `RISK (N0/N1/N2)`, `MATRIX (D x P)`, and `ACTIVE MODE`.
2. **Step 2 (Physical Inspection):** Read target files to obtain exact line numbers and identifier tokens.
3. **Step 3 (Proof-Carrying Audit):** Emit `<system_audit>` covering every file to be created or modified.
4. **Step 4 (Atomic Mutation):** Execute file editing tools (`edit_file`, `write_file`, `MultiEdit`).
5. **Step 5 (Chained Physical Verification):** Execute `typecheck && lint && test` (or `ffprobe` + keyframe extraction in `argon-director`).
6. **Step 6 (Final Report):** Document `WHAT CHANGED`, `WHY`, `VERIFICATION` output, and `FINAL REVIEW`.

### 4. LCS Diff-Scoped Pattern Scanner
`post-edit-slop.ts` compares the edited file against the pre-edit baseline staged in `os.tmpdir()/argon-staging/<session>/` using a Longest Common Subsequence (LCS) diff algorithm, inspecting **only newly added lines**:
* Strips string literals (`"..."`, `'...'`, `` `...` ``) and comments before checking syntax rules so URLs (`https://...`), UI text (`"Select: any option"`), and hex colors (`"#ffffff"`) never trigger false positives.
* Blocks lazy truncation comments (`// TODO`, `// rest of code`, `# implement here`) and empty `catch {}` blocks (single-line and multiline).
* Scopes TypeScript type-evasion checks (`: any`, `as any`, `@ts-ignore`) strictly to `.ts`/`.tsx`/`.js`/`.jsx` files, preserving idiomatic `any` in Go 1.18+.

---

## Repository & Runtime Directory Structure

```text
argon-protocols/
├── plugin.json                      # Antigravity plugin manifest (v9.2.0)
├── hooks.json                       # Root hook interceptor configuration
├── README.md                        # Master architecture specification (English)
├── README_ES.md                     # Especificación de arquitectura (Español)
├── assets/
│   └── thumbnail.png                # Official presentation video banner & preview
├── hooks/
│   ├── pre-edit-audit.ts            # PreToolUse PCA & proximity drift gatekeeper
│   └── post-edit-slop.ts            # PostToolUse LCS diff-scoped pattern scanner
├── skills/
│   ├── argon-core/
│   │   └── SKILL.md                 # Systems, refactoring & M1-M11 protocol
│   ├── argon-builder/
│   │   └── SKILL.md                 # Greenfield software & D x P matrix protocol
│   └── argon-director/
│       └── SKILL.md                 # Audiovisual engineering & LUFS/ffprobe protocol
└── agents/
    ├── argon-core.md                # Autonomous Systems & Refactoring Subagent
    ├── argon-builder.md             # Autonomous Greenfield Construction Subagent
    └── argon-director.md            # Autonomous Audiovisual Engineering Subagent
```

---

## The Triad Architecture Overview

| Protocol | Scope | Core Mechanisms & Enforcement | Spec Size |
| :--- | :--- | :--- | :---: |
| **[`argon-core`](skills/argon-core/SKILL.md)** | Systems & Refactoring | PCA Lexical Anchors, N0/N1/N2 Risk Routing, M1–M11 Conditional Modules, Falsification Debugging. | ~90 lines |
| **[`argon-builder`](skills/argon-builder/SKILL.md)** | Greenfield Construction | Matrix `D x P` (`ENG`, `SRF`, `SYS`, `PIP` x `JCE`, `CRF`, `DNS`, `MIN`), Zero-GC Loop, 5-State UI. | ~90 lines |
| **[`argon-director`](skills/argon-director/SKILL.md)** | Audiovisual Engineering | Media Matrix `D x P`, Magic-Byte `MEDIA_ASSET` Validator, LUFS/Ducking Standards, `ffprobe` Gate. | ~90 lines |

---

## Alternatives Considered

| Alternative Approach | Reason for Rejection |
| :--- | :--- |
| **Prompt-Only Soft-Steering (Argon v8.0)** | Degrades in long context windows; fast models skip file reads or invent line citations under token pressure. |
| **Whole-File or Naive `Set<string>` Post-Edit Scanning** | Whole-file scanning causes the *Brownfield Hostage Trap* on legacy `TODO`s, whereas unordered `Set<string>` lookup allows duplicate slop insertion. LCS diffing isolates exact added lines in `<3ms`. |
| **Full Tree-Sitter / LSP Compilation Inside PreToolUse** | Introduces 500ms–3,000ms latency on every edit and native binary dependencies. Lexical + LCS hooks run in `<15ms` while delegating full compilation to Step 5 verification. |
| **Stealth Disk Rollback in PostToolUse** | Overwriting files on disk behind the host IDE's back desynchronizes in-memory LSP buffers from the filesystem. Non-destructive denial diagnostics allow clean single-turn correction. |

---

## Risks, Limits & Mitigations

1. **Runtime Dependency on Bun / Node.js:** Hook scripts use standard `node:fs`, `node:path`, `node:os`, and `node:crypto` modules with zero external npm dependencies, running natively on **Bun** (`>= 1.0`) or **Node.js** (`>= 22.6` via `node --experimental-strip-types`).
2. **Asynchronous Transcript Flush Lag:** If a host runner invokes `PreToolUse` before flushing the assistant's text stream to `transcriptPath`, the hook performs 3 bounded retries (`3 x 50ms`) reading the last 128KB of the file, failing closed by default unless `ARGON_PERMISSIVE_TRANSCRIPT=1` is set for headless CI environments.
3. **Line Coordinate Drift Across Multi-Hunk Edits:** When prior edits shift line numbers beyond `+-8` lines, the proximity resolver locates the closest matching identifier (`<= 150` lines) and auto-heals the coordinate without halting the agent.

---

## Installation & Integration

### Prerequisites
* **Bun** (`>= 1.0`) or **Node.js** (`>= 22.6`) available in `PATH`.
* **Google Antigravity** or **Claude Code**.

### Option A: Google Antigravity Setup
1. Copy the `skills/`, `agents/`, `hooks/`, and `hooks.json` files into `~/.gemini/config/`:

```powershell
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\config\skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\config\agents"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\config\hooks"
Copy-Item -Recurse -Force skills\* "$env:USERPROFILE\.gemini\config\skills\"
Copy-Item -Recurse -Force agents\* "$env:USERPROFILE\.gemini\config\agents\"
Copy-Item -Recurse -Force hooks\* "$env:USERPROFILE\.gemini\config\hooks\"
Copy-Item -Force hooks.json "$env:USERPROFILE\.gemini\config\hooks.json"
```

```bash
# Linux / macOS
mkdir -p ~/.gemini/config/skills ~/.gemini/config/agents ~/.gemini/config/hooks
cp -r skills/* ~/.gemini/config/skills/
cp -r agents/* ~/.gemini/config/agents/
cp -r hooks/* ~/.gemini/config/hooks/
cp hooks.json ~/.gemini/config/hooks.json
```

2. When installed as an Antigravity plugin, `{{PLUGIN_DIR}}` in `hooks.json` resolves automatically. For standalone user-config installation (`~/.gemini/config/hooks.json`), replace `{{PLUGIN_DIR}}` with the absolute path to `~/.gemini/config` (e.g., `$HOME/.gemini/config/hooks/pre-edit-audit.ts` on Unix or `C:/Users/<you>/.gemini/config/hooks/pre-edit-audit.ts` on Windows).

### Option B: Claude Code Setup (`~/.claude/settings.json`)
Copy the `hooks/` directory to `~/.claude/hooks/` and register `PreToolUse` and `PostToolUse` inside `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit|Bash)$",
        "hooks": [
          {
            "type": "command",
            "command": "bun \"$HOME/.claude/hooks/pre-edit-audit.ts\"",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [
          {
            "type": "command",
            "command": "bun \"$HOME/.claude/hooks/post-edit-slop.ts\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

---

## Verification & Smoke Testing

Run these commands from the repository root to verify hook behavior:

```bash
# 1. Verify PreToolUse blocks un-audited file edits (Expected: exit code 2 / [ARGON-GATE-BLOCK])
echo '{"tool_name":"edit_file","tool_input":{"path":"plugin.json"},"assistant_message":"Editing file now"}' | bun hooks/pre-edit-audit.ts

# 2. Verify PreToolUse approves valid <system_audit> with real lexical anchor (Expected: exit code 0)
echo '{"tool_name":"edit_file","tool_input":{"path":"plugin.json"},"assistant_message":"<system_audit>\nRISK: N0\nEVIDENCE: [plugin.json:3[\"argon-protocols\"]]\nINVARIANT_CHECK: Preserves plugin manifest schema version\n</system_audit>"}' | bun hooks/pre-edit-audit.ts

# 3. Verify PreToolUse allows benign terminal commands without <system_audit> (Expected: exit code 0)
echo '{"tool_name":"run_command","tool_input":{"command":"npm test > results.json"}}' | bun hooks/pre-edit-audit.ts
```

---

## Author & License

* **Author:** **Shion** ([@ShionBanned](https://github.com/ShionBanned))
* **License:** [MIT License](LICENSE)
