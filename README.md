# ⚡ Argon Protocols (v8.0)

[![Version](https://img.shields.io/badge/Version-8.0.0-blue.svg?style=for-the-badge)](https://github.com/ShionBanned/argon-protocols)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Target Architecture](https://img.shields.io/badge/Target%20Architecture-Flash%20%E2%86%92%20Frontier%20Reasoning-purple?style=for-the-badge)](#1-the-flash-to-frontier-cognitive-bridge-targetflash)
[![Compatibility](https://img.shields.io/badge/Compatibility-Antigravity%20|%20Claude%20Code%20|%20Cursor%20|%20Codex-success?style=for-the-badge)](#installation--setup)

> **Frontier Cognitive Scaffolding and Deterministic Execution Protocols for Autonomous AI Coding Agents.**  
> *Engineered to bridge lightweight, high-speed models into rigorous, self-auditing Frontier Architects.*

---

## 🎯 Core Mission & Dual Purpose

**Argon Protocols** was created to solve the fundamental trade-off of modern AI engineering: **the gap between model speed/cost and architectural rigor.**

While frontier reasoning models (like Claude Opus or Gemini Pro/Argon) possess high deliberation, they are slow, expensive, and subject to tight rate limits. Conversely, lightweight models (like **Gemini Flash**) offer blazing speed, immense context windows, and low token cost, but naturally default to "System-1" thinking: complacency, shallow exploration, unverified assumptions, and lazy diffs.

**Argon provides the externalized cognitive exoskeleton (`target="flash"`) that forces high-speed models to deliberate, audit, and execute with the uncompromising precision of a heavyweight Frontier Architect.**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                    THE ARGON HARNESS                                   │
│                                                                                        │
│   ⚡ Lightweight Model (e.g. Gemini Flash)                                              │
│   [ High Speed · Low Cost · Massive Context · Tendency to take naive shortcuts ]      │
│                                      │                                                 │
│                                      ▼                                                 │
│   🛡️ ARGON PROTOCOLS EXOSKELETON (`target="flash"`)                                    │
│   ├─ Mandatory <system_audit> before code modification                                 │
│   ├─ N0 / N1 / N2 Risk Classification & Contract Freezing                              │
│   ├─ M1-M11 Heavy Verification Modules (Concurrency, Currency, Memory, State)          │
│   ├─ Hostile Self-Auditing ("Your own diff is suspicious")                             │
│   └─ Physical Execution Proof (LSP Diagnostics, Tests, ffprobe, Clean Console)         │
│                                      │                                                 │
│                                      ▼                                                 │
│   🏛️ Deterministic Frontier Output (Zero Hallucination · Production Ready · Verified) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 The 5 Primary Purposes of Argon

### 1. ⚡ The Flash-to-Frontier Cognitive Bridge (`target="flash"`)
* **Problem:** Fast models often generate code by intuition rather than formal derivation. They easily miss edge cases, use unverified imports, or report "all tests pass" without running verification.
* **The Argon Uplift:** By mandating the `<system_audit>` block, distilled facts, and falsification-first debugging, Argon forces the model through **System-2 Analytical Reasoning**. It transforms high-throughput models into defensive, meticulous Staff-level engineers, cutting token costs by up to 80% without sacrificing architectural safety.

### 2. 🛡️ Deterministic Anti-Regression & Architecture Shield (`argon-core`)
* **Contract Protection:** Freezes interfaces, input/output types, and signatures using a strict topological order before modifying source files.
* **Heavy Modules (M1-M11):** Activates specialized mathematical and algorithmic guardrails on demand:
  * Eliminates race conditions in asynchronous code via visual timeline mapping.
  * Enforces exact fixed-point integer math for financial currencies (COP, USD) to avoid floating-point drift.
  * Audits state machines to replace brittle boolean flags with unified discriminated unions.

### 3. 🏗️ Autonomous Greenfield Construction with Zero Placeholders (`argon-builder`)
* **Production Completeness:** Strictly prohibits `// TODO`, `// rest of code`, or empty skeleton mocks. Everything delivered is complete, styled, and functional.
* **Dual Greenfield Paradigms:**
  * **`ARCADE-JUICE`:** Game loops and physics engines with bounded delta-time (`dt`), zero heap allocations in the render loop, and verified 60 FPS frame times.
  * **`CUPERTINO-CRAFT`:** SaaS dashboards and web interfaces requiring **5 mandatory states** per component (`Empty`, `Loading`, `Success`, `Error with Recovery`, and `Overflow`).

### 4. 🎬 Algorithmic Audiovisual Post-Production (`argon-director`)
* **Sub-Frame Audio/Visual Synchronization:** Brings mathematical engineering to video generation and editing pipelines (FFmpeg, Remotion, Whisper, MoviePy).
* **Acoustic Standards:** Mandates automatic audio ducking to -24 dBFS during dialogue, speech peak normalization at -6 dBFS, and integrated LUFS measurement.
* **Multimodal Verification:** Prohibits declaring a render successful from an exit code alone; mandates `ffprobe` stream comparison and keyframe extraction at transition points.

### 5. 🔬 Adversarial Falsification & Anti-Complacency
* **Falsification-First Debugging:** Mandates formulating counter-evidence before adopting any bug hypothesis. The model must prove its theory survived falsification.
* **Hostile Self-Review:** Instructs the model to evaluate its own newly created diff from the perspective of an external reviewer paid to reject the PR.

---

## 🧬 Genesis & Architectural Pedigree

Argon was engineered through **adversarial cross-model synthesis**:
* **Claude (Anthropic):** Injected extreme instruction adherence, pedantic edge-case auditing, and deep aversion to unverified assumptions (*"Your own diff is suspicious"*).
* **Gemini (Google):** Injected large-scale systemic architecture, multimodal parsing, and high-performance determinism.
* **Architecture & Direction:** Conceived, stress-tested, and iteratively refined across **8 major generational versions** by **[Shion](https://github.com/ShionBanned)** to create a standardized protocol that reliably elevates accessible models into frontier software architects.

---

## 🏛️ The Triad Architecture Overview

| Protocol | Specialized Domain | Core Mechanisms & Enforcement |
| :--- | :--- | :--- |
| **`argon-core`** | Systems Engineering & Backend Architecture | N0/N1/N2 Risk Matrix, `<system_audit>`, M1-M11 Heavy Modules, Falsification Debugging, Lazy Baseline Verification. |
| **`argon-builder`** | Greenfield Software, Games & UI/UX | `ARCADE-JUICE` (Zero-GC, 60 FPS, Game Feel) vs `CUPERTINO-CRAFT` (5 UI States, Design Tokens, CLS=0), FSM Validation. |
| **`argon-director`** | Audiovisual Post-Production & Video Pipelines | `VIRAL-BEAST` (Dynamic Retention) vs `APPLE-KEYNOTE` (Restrained Elegance), LUFS Audio Ducking, `ffprobe` Multimodal Keyframe Audit. |

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

## 🚀 Installation & Integration

### Google Antigravity & Gemini CLI
Install directly via the `agy` CLI:
```bash
agy plugin install https://github.com/ShionBanned/argon-protocols
```
Or copy the skills directly to your local Antigravity/Gemini configuration:
```bash
# Windows (PowerShell)
Copy-Item -Recurse skills/* "$env:USERPROFILE\.gemini\config\skills\"

# Linux / macOS
cp -r skills/* ~/.gemini/config/skills/
```

### Claude Code & Codex CLI
Clone into your local or global agent configuration:
```bash
git clone https://github.com/ShionBanned/argon-protocols.git ~/.claude/skills/argon
```

---

## 👤 Author & Recognition

* **Architect & Author:** **Shion** ([@ShionBanned](https://github.com/ShionBanned))
* **License:** [MIT License](LICENSE)
* **Contributions:** Open-source issues and PRs addressing frontier agent governance and model economics are welcome!
