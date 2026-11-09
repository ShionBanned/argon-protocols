# ⚡ Argon Protocols (v9.0 Hybrid)

[![Version](https://img.shields.io/badge/Version-9.0.0-blue.svg?style=for-the-badge)](https://github.com/ShionBanned/argon-protocols)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-Proof--Carrying%20Audit%20%28PCA%29-purple?style=for-the-badge)](#1-hybrid-compiler-architecture-proof-carrying-audit)
[![Compatibility](https://img.shields.io/badge/Compatibility-Antigravity%20|%20Claude%20Code%20|%20Cursor%20|%20Codex-success?style=for-the-badge)](#installation--setup)

> **Frontier Proof-Carrying Audit (PCA) & Deterministic Execution Architecture for Autonomous AI Coding Agents.**  
> *Engineered to bridge lightweight, high-speed models into rigorous, self-auditing Frontier Architects using hybrid compiler-grade verification.*

---

## 🎯 Core Mission & The v9.0 Hybrid Breakthrough

In **Argon v8.0**, agent guardrails relied entirely on language-level prompt instructions ("soft-steering"). While effective, lightweight models (like **Gemini Flash** or **Claude Haiku**) under long contexts could fall victim to *Compliance Theater*—emitting superficial audit blocks or hallucinating line numbers to bypass gates.

**Argon v9.0 Hybrid** solves this through a fundamental separation of concerns derived from compiler design:

1. **The Prompt (`SKILL.md` < 100 lines):** Functions strictly as a **Semantic & Invariant Generator**. Zero tokens wasted on punitive lectures or threats.
2. **The Runtime (`hooks/` in Bun/Node):** Functions as a **Deterministic Type-Checker, Lexical Linter, and Proof-Carrying Gatekeeper**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                ARGON v9.0 HYBRID TOPOLOGY                              │
│                                                                                        │
│   ⚡ Lightweight Model (e.g. Gemini Flash / Claude Haiku)                              │
│   [ High Speed · Low Cost · Massive Context · Lean Focus ]                            │
│                                      │                                                 │
│                                      ▼                                                 │
│   📜 SEMANTIC SKILL SPEC (< 100 lines)                                                │
│   ├─ N0 / N1 / N2 Risk Tier Routing                                                   │
│   ├─ Orthogonal Execution Tensor (Domain D × Profile P)                               │
│   └─ Proof-Carrying Audit Scheme: EVIDENCE [file:line["exactToken"]]                  │
│                                      │                                                 │
│                                      ▼ (Agent calls edit_file / write_file)            │
│   🛡️ RUNTIME DETERMINISTIC GATES (bun hooks/...)                                       │
│   ├─ PreToolUse (`pre-edit-audit.ts`):                                                │
│   │   • Physical verification of disk existence                                       │
│   │   • Exact lexical anchor token match (±5 line tolerance)                          │
│   │   • Mechanical block (exit code 2 / deny) if audit or token is missing/hallucinated│
│   └─ PostToolUse (`post-edit-slop.ts`):                                               │
│       • Sub-15ms lexical & AST linter                                                 │
│       • Blocks `// TODO`, `// ...`, `: any`, `as any`, `@ts-ignore`, empty `catch {}` │
│                                      │                                                 │
│                                      ▼                                                 │
│   🏛️ Deterministic Frontier Output (Zero Hallucination · Production Ready · Verified) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 The 4 Pillars of Argon v9.0

### 1. 🛡️ Proof-Carrying Audit (PCA) with Lexical Anchoring
To prevent hallucinated line numbers, Argon v9.0 mandates **Lexical Anchors**:
```xml
<system_audit>
RISK: N1
MATRIX: SYS x MIN
EVIDENCE: [src/core/auth.ts:42["validateSessionToken"], src/new/route.ts:0["NEW_FILE"]]
INVARIANT_CHECK: Preserves POSIX exit codes and idempotent session lookup
</system_audit>
```
The `PreToolUse` hook opens the physical file on disk, inspects line 42 (with a $\pm 5$ line tolerance window for drift), and verifies that `"validateSessionToken"` literally exists. If the model did not actually read the file, it is statistically impossible to guess the token.

### 2. 🎛️ Orthogonal Execution Tensors ($\mathcal{D} \times \mathcal{P}$)
Replaces rigid binary choices with a composable Cartesian product:

#### A. Software Engineering (`argon-builder`):
* **Domain $\mathcal{D}$ (Invariants):**
  * `ENG` (Engine): `alloc_in_tick == 0` · `dt_decoupled == true` · `frame <= 16.6ms`.
  * `SRF` (Surface): `CLS == 0` · `a11y == WCAG_AA` · 5 UI States (*Empty, Loading, Success, Error w/ Recovery, Overflow*).
  * `SYS` (System): `POSIX_exit_codes` · `graceful_sigterm` · `idempotent_io` · `structured_stderr`.
  * `PIP` (Pipeline): `backpressure == bounded` · `DLQ_enabled` · `atomic_checkpoints`.
* **Profile $\mathcal{P}$ (Expression):**
  * `JCE` (Juice): Kinetic feedback, spring physics, multi-sensory response.
  * `CRF` (Craft): Swiss precision, cubic-bezier easing, design tokens.
  * `DNS` (Dense): High data-ink ratio, keyboard-first, tabular numbers.
  * `MIN` (Minimal): Zero external dependencies, pure UNIX throughput, raw stdio.

#### B. Audiovisual Engineering (`argon-director`):
* **Domain $\mathcal{D}$:** `SHRT` (Shorts/Vertical) | `PED` (Tutorial/Screencast) | `KEY` (Keynote) | `DOC` (Documentary).
* **Profile $\mathcal{P}$:** `BST` (Beast/Viral Pacing) | `KYN` (Cupertino Elegance) | `CIN` (Cinematic) | `RAW` (Technical Live-Demo).

### 3. ⚡ Attention-Budget Optimization (< 100 Lines per Skill)
By delegating mechanical validation to runtime hooks, each `SKILL.md` was compressed from ~300 lines down to **under 100 lines**:
* `argon-core`: **93 lines**
* `argon-builder`: **96 lines**
* `argon-director`: **90 lines**

This eliminates the *Lost in the Middle* phenomenon, allowing lightweight models to maintain 100% instruction fidelity.

### 4. 🔬 Sub-15ms Anti-Slop Enforcement
The `post-edit-slop.ts` hook runs in milliseconds after every edit, ensuring zero AI placeholders (`// TODO`, `// rest of code`), zero type evasions (`: any`, `as any`), and zero error silencing (`@ts-ignore`, empty `catch {}`).

---

## 🏛️ The Triad Architecture Overview

| Protocol | Scope | Core Mechanisms & Enforcement | Lines |
| :--- | :--- | :--- | :---: |
| **`argon-core`** | Systems & Architecture | PCA Lexical Anchors, N0/N1/N2 Matrix, M1-M11 On-Demand Dispatch, Falsification Debugging. | **93** |
| **`argon-builder`** | Greenfield Construction | Tensor $\mathcal{D} \times \mathcal{P}$ (Engine, Surface, System, Pipeline x Juice, Craft, Dense, Minimal), Zero-GC Loop, 5-State UI. | **96** |
| **`argon-director`** | Audiovisual Engineering | Media Tensor $\mathcal{D} \times \mathcal{P}$ (Shorts, Pedagogy, Keynote, Doc x Beast, Keynote, Cinema, Raw), LUFS Ducking (-24 dBFS), `ffprobe` Multimodal Audit. | **90** |

---

## 🚀 Installation & Integration

### Google Antigravity & Gemini CLI
Install via `agy`:
```bash
agy plugin install https://github.com/ShionBanned/argon-protocols
```

Or clone into your local configuration:
```bash
# Windows (PowerShell)
Copy-Item -Recurse skills/* "$env:USERPROFILE\.gemini\config\skills\"
Copy-Item -Recurse hooks "$env:USERPROFILE\.gemini\config\"

# Linux / macOS
cp -r skills/* ~/.gemini/config/skills/
cp -r hooks ~/.gemini/config/
```

### Hook Configuration (`hooks.json`)
Argon comes bundled with ready-to-use hooks for Antigravity and Claude Code:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(write_file|edit_file|write_to_file|replace_file_content|multi_replace_file_content|MultiEdit|Write|Edit)$",
        "hooks": [
          {
            "type": "command",
            "command": "bun hooks/pre-edit-audit.ts",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "^(write_file|edit_file|write_to_file|replace_file_content|multi_replace_file_content|MultiEdit|Write|Edit)$",
        "hooks": [
          {
            "type": "command",
            "command": "bun hooks/post-edit-slop.ts",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

---

## 👤 Author & Recognition

* **Architect & Author:** **Shion** ([@ShionBanned](https://github.com/ShionBanned))
* **License:** [MIT License](LICENSE)
* **Contributions:** Open-source issues and PRs advancing deterministic agent governance are welcome!
