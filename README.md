# ⚡ Argon Protocols (v8.0)

[![Version](https://img.shields.io/badge/Version-8.0.0-blue.svg?style=for-the-badge)](https://github.com/ShionBanned/argon-protocols)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Compatibility](https://img.shields.io/badge/Compatibility-Antigravity%20|%20Claude%20Code%20|%20Cursor%20|%20Codex-success?style=for-the-badge)](#installation--setup)
[![Protocol Status](https://img.shields.io/badge/Standard-Frontier%20Quality%20Gate-red?style=for-the-badge)](#the-triad-architecture)

> **Deterministic Execution, Zero-Assumption Exploration, and Hostile Quality-Gates for Autonomous AI Coding Agents.**

---

## 📖 Overview

**Argon Protocols** is an enterprise-grade execution framework designed to eradicate the most pervasive failure modes of autonomous AI coding agents: **hallucinated APIs, complacency, lazy diffs, silent failures, and unverified assumptions.**

Rather than acting as a simple collection of "prompt recipes," Argon enforces an **adversarial, rule-bound constitution** that transforms any coding agent into a Principal Software Architect with zero tolerance for regression.

```
                     ┌─────────────────────────────────────────┐
                     │          ARGON CONSTITUTION             │
                     │  "What is not written was not done"    │
                     └────────────────────┬────────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         ▼                                ▼                                ▼
  🛡️ ARGON CORE                   🏗️ ARGON BUILDER                 🎬 ARGON DIRECTOR
• Systems Architecture           • Greenfield Creation            • Video Engineering
• N0 / N1 / N2 Risk Engine       • Arcade-Juice (60 FPS Game Loop)• Viral-Beast vs Apple-Keynote
• M1-M11 Heavy Modules           • Cupertino-Craft (5-State UI)   • Sub-frame sync & LUFS audio
• Zero-Assumption Exploration    • Zero-Placeholder Guarantee     • Multimodal ffprobe check
```

---

## 🧬 Genesis & Architectural Philosophy

Argon was forged through **adversarial cross-model synthesis**:
* **Claude (Anthropic):** Injected extreme instruction adherence, pedantic edge-case auditing, and deep aversion to unverified assumptions (*"Tu propio diff es sospechoso"*).
* **Gemini (Google):** Injected large-scale systemic architecture, multimodal video/audio parsing, and determinism in high-throughput engines.
* **Orchestration:** Iteratively stress-tested, refined, and codified across **8 major generational versions** by **[Shion](https://github.com/ShionBanned)** to eliminate model drift and ensure immediate, first-pass production readiness.

---

## 🏛️ The Triad Architecture

### 1. 🛡️ `argon-core` (Systems Engineering & Architecture)
Designed for backend engines, state management, refactoring, and critical mission infrastructure.
* **Risk Classification Engine:** Classifies every incoming prompt before writing a single line of code:
  * **N0 (Trivial):** Maximum 5 lines, 1 file, no shared state. Lightweight audit.
  * **N1 (Standard):** 1-3 files. Requires mapping all symbol consumers, style cloning, and targeted verification.
  * **N2 (High Risk):** Public contracts, database schemas, monetary math, permissions, concurrency, or >3 files. Demands frozen interfaces, pre-edit baseline checks, and full regression sweeps.
* **Heavy Modules (`M1-M11`):** Triggered conditionally when handling high-risk domains:
  * Concurrency, race conditions, and deadlocks.
  * Financial floating-point precision and rounding errors.
  * Data loss prevention and atomic state migrations.
  * Memory leak elimination and resource cleanup.

### 2. 🏗️ `argon-builder` (Greenfield Development & High-Fidelity UI/UX)
Designed for building software from absolute zero (games, WebGL, interactive Canvas, SaaS apps).
* **Dual Paradigm Selection:**
  * **`ARCADE-JUICE`:** Game loops, physics simulations, 2D/3D Canvas. Enforces bounded delta time (`dt`), zero garbage collection inside the render loop, and verified 60 FPS frame times.
  * **`CUPERTINO-CRAFT`:** Production SaaS, e-commerce, and dashboards. Enforces **5 mandatory states** for every interactive component (`default`, `hover/active`, `focus`, `disabled`, `loading/error`).
* **Zero-Placeholder Guarantee:** Strict prohibition of `// TODO: implement later`, empty skeleton mocks, or incomplete UI components.

### 3. 🎬 `argon-director` (Audiovisual Post-Production & Video Engineering)
Designed for algorithmic, programmatic video/audio rendering with FFmpeg, Remotion, MoviePy, and Whisper.
* **Dual Aesthetic Paradigms:**
  * **`VIRAL-BEAST`:** Dynamic pacing, 3-second hook retention, stimulus every <3.5s, aggressive dynamic zooms.
  * **`APPLE-KEYNOTE`:** Architectural restraint, 50% breathing room, continuous cubic bezier easing, zero linear interpolations.
* **Multimodal Verification:** Prohibits declaring a render "successful" based merely on `exit code 0`. Mandates `ffprobe` stream validation, keyframe extraction, LUFS decibel balancing, and audio ducking calibration.

---

## ⚖️ The 11 Invariable Core Laws

Every agent operating under Argon is bound by 11 unbendable laws:

1. **What is not written was not done:** Every architectural decision, risk analysis, and edge case must be explicitly written in the `<system_audit>` log.
2. **Zero assumptions:** Never guess API signatures, library versions, routes, or props. Verify them against installed packages or documentation.
3. **Classify before acting:** Formulate `OBJECTIVE`, `LEVEL (N0/N1/N2)`, and `ACTIVE MODE` before touching code.
4. **Minimal diff:** Modify only what is strictly required to satisfy acceptance criteria.
5. **Executed physical verification:** Never claim code compiles, tests pass, or frames render without executing the diagnostic command and observing the output in the active turn.
6. **Zero suppression:** Never suppress linter warnings, silence errors with empty catches, or alter tests just to force green passes.
7. **Non-destructive operations:** Never delete sources, overwrite unversioned artifacts, or run breaking scripts without explicit user consent.
8. **Three-strike rule:** If an implementation fails 3 consecutive times, stop immediately and report the block to the user.
9. **Refute before believing:** For every working hypothesis, formulate and test its counter-evidence first.
10. **Your own diff is suspicious:** Audit newly written code with the hostile skepticism of a third-party security reviewer.
11. **On-demand heavy modules:** Activate deep audit modules (`M1-M11`) only when risk criteria are met to keep simple tasks fast.

---

## 🚀 Installation & Setup

### Google Antigravity & Gemini CLI
Clone or install directly via the `agy` CLI:
```bash
agy plugin install https://github.com/ShionBanned/argon-protocols
```
Or copy the skills to your local configuration:
```bash
# Windows
Copy-Item -Recurse skills/* "$env:USERPROFILE\.gemini\config\skills\"

# Linux / macOS
cp -r skills/* ~/.gemini/config/skills/
```

### Claude Code & Codex CLI
Add the skills directly to your Claude Code or Codex project directory:
```bash
# Clone into your agent skills path
git clone https://github.com/ShionBanned/argon-protocols.git ~/.claude/skills/argon
```

---

## 👤 Author & Architecture

* **Creator:** **Shion** ([@ShionBanned](https://github.com/ShionBanned))
* **License:** [MIT License](LICENSE)
* **Contributions:** PRs and issue discussions on frontier agent governance are welcome!
