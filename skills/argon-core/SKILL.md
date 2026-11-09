---
name: argon-core
description: >-
  Frontier Engineering Protocol v9.2 (Hybrid PCA Architecture) for systems engineering, backend architecture,
  and anti-regression refactoring. Enforces compiler-grade contracts, Proof-Carrying Audits (PCA),
  domain-locked execution matrices (D x P), risk-tiered bounds (N0/N1/N2), and conditional modules (M1-M11).
---

<frontier_engineering_protocol version="9.2" target="flash">

<compiler_contract>
§1. COMPILER CONTRACT (HARD-ENFORCED BY RUNTIME HOOKS)
Every code mutation tool (`write_file`, `edit_file`, `MultiEdit`, `multi_replace_file_content`) is protected by mechanical interceptors (`exit code 2`). Execution WILL ABORT if the current turn response does not contain the exact block:

```xml
<system_audit>
RISK: <N0 | N1 | N2>
MATRIX: <ENG | SRF | SYS | PIP> x <JCE | CRF | DNS | MIN>
MODULE: <NONE | M1..M11 (Mandatory in RISK: N2 or >3 files)>
EVIDENCE: [relative/path.ext:line["identifier_token"], new/path.ext:0["NEW_FILE"]]
INVARIANT_CHECK: <Concrete justification (>=3 words) of contract and invariant preservation>
</system_audit>
```

- Domains (D): `ENG` (Engines/Loops/DSP) · `SRF` (UI/Web/5-States) · `SYS` (CLIs/APIs/POSIX) · `PIP` (ETL/Streams/Queues).
- Profiles (P): `JCE` (Juice/Spring) · `CRF` (Swiss Craft/Grid) · `DNS` (High Data-Ink/Dense) · `MIN` (Zero-Deps/UNIX).
- Matrix Risk Rules: In `RISK: N0` (<=5 lines), `MATRIX` and `MODULE` are optional. In `N1` and `N2`, `MATRIX` is mandatory. In `N2` (or >3 files in `EVIDENCE`), declaring and instantiating at least one `MODULE: M1..M11` is mandatory.
- Physical Verification with Proximity Self-Healing: The hook verifies each target file on disk, requires high-entropy tokens (>=4 chars, generic language keywords like `const` or `return` forbidden), and auto-reconciles line drifts by proximity without halting execution.
- LCS Diff-Scoped Scanner & Terminal Guard: The post-edit hook audits only newly added lines via LCS diff (rejecting `: any` outside strings, `@ts-ignore`, `// TODO`, and empty `catch {}` blocks). Diagnostic/read terminal commands (`npm test`, `git status`) do NOT require `<system_audit>`; only direct shell source writes (`> file.ts`, `sed -i`) are blocked.
</compiler_contract>

<effort_routing>
§2. RISK TIER ROUTER N0 / N1 / N2
Declare RISK and ACTIVE MODE before editing:

| Tier | Scope Definition | Exploration Bound | Mandatory Verification (Step 5) |
| :--- | :--- | :--- | :--- |
| **N0** | <=5 lines, 1 file, no external contracts. | Target region and immediate scope. | Editor diagnostics or targeted linter/typecheck. |
| **N1** | 1-3 files, without altering shared types or schemas. | File + direct consumer search + dependencies. | Typecheck + lint + tests of affected modules in one command. |
| **N2** | >3 files, public contracts, schemas, auth, concurrency. | Full N1 + lockfiles + `git status` + integration tests. | Full build + complete test suite + pre/post regression test. |

ACTIVE MODES:
  N0: Read before editing | Minimal diff | Command-verified
  N1: Zero assumptions | Lexical anchor evidence | Chained verification
  N2: Everything in writing | Frozen contract + Module M1-M11 | Full regression gate
</effort_routing>

<heavy_modules_router>
§3. CONDITIONAL MODULE DISPATCH (M1–M11)
Activate a module whenever its trigger is met (mandatory at least one in `RISK: N2`) and include its expansion inside `<system_audit>`:

- **M1 Data Chain** (Datum traverses >=3 files): `File:Fn -> in(Type) -> mutation -> out(Type) -> Next`.
- **M2 Distilled Facts** (Inspecting >3 files): Block of <=15 lines with exact signatures, contracts, and invariants.
- **M3 The Ledger** (Plan modifies >3 files): Emit state: `FROZEN CONTRACT`, `COMPLETED`, `CURRENT`, `PENDING`.
- **M4 Topological Order** (Altering shared type/contract): Strict sequence: base types -> core logic -> consumers/UI.
- **M5 Concurrency Timeline** (Async code with shared state): Interleaved execution table `T1, T2...` across actors.
- **M6 Binary Instrumentation** (Bug with >=2 hypotheses and no clear stacktrace): Temporary `[DEBUG-TMP]` logs, reproduce, isolate, and remove.
- **M7 Decoupled Algorithm** (Complex/mathematical algorithm): Invariant + Pseudocode (5-10 lines) + Edge-case desk check.
- **M8 State Machine Table** (>=2 interacting boolean flags): Table `STATE | EVENT | NEXT_STATE` using discriminated union `status`.
- **M9 Boolean Decomposition** (>2 logical operators in auth/billing): Extract semantically named boolean constants + truth table.
- **M10 Black Box** (Legacy spaghetti refactor): Pure contract `INPUTS -> OUTPUTS -> SIDE EFFECTS` prior to rewrite.
- **M11 Turn Partitioning** (Massive N2 touching >4 files): Split into Phase A (Audit & Contracts) and Phase B (Sequential Edits).
</heavy_modules_router>

<senior_heuristics>
§4. SENIOR ARCHITECTURAL HEURISTICS
1. **Falsification-First Debugging:** Reproduce the failure first. Formulate 2-3 hypotheses with explicit refutation tests (*"What concrete evidence would prove this hypothesis FALSE?"*). The reproduction test becomes your regression test.
2. **Minimal Diff & Repo Mimicry:** Modify strictly necessary lines. Mirror project conventions. Never mix cosmetic refactoring with bug fixes.
3. **Defensive Typing & Robust Contracts:** Use early returns, discriminated unions or `Result<T, E>`, and validate at I/O boundaries. Never mask errors with `?.` on mandatory fields.
4. **Three-Strike Circuit Breaker:** If a command or test fails 3 consecutive times after adjustments, STOP and report findings and discarded hypotheses.
</senior_heuristics>

<execution_flow>
§5. EXECUTION LIFECYCLE (6 MANDATORY STEPS)
1. **Step 1 (Declaration):** `OBJECTIVE` + `RISK (N0/N1/N2)` + `MATRIX (D x P)` + `ACTIVE MODE`.
2. **Step 2 (Physical Inspection):** `read_file` target files to extract exact line numbers and high-entropy identifier tokens.
3. **Step 3 (Proof-Carrying Audit):** Emit `<system_audit>` in the current turn covering every file to be mutated.
4. **Step 4 (Atomic Mutation):** Execute `edit_file` / `write_file` / `MultiEdit`.
5. **Step 5 (Chained Physical Verification):** Run `typecheck && lint && test` matched to the N0/N1/N2 risk tier.
6. **Step 6 (Final Report):** Document `WHAT CHANGED`, `WHY`, `VERIFICATION` (verbatim terminal outputs), and `FINAL REVIEW`.
</execution_flow>

</frontier_engineering_protocol>
