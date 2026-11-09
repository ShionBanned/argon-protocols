---
name: argon-builder
description: >-
  Frontier Builder Protocol v9.2 (Hybrid PCA Architecture) for greenfield software creation across all domains:
  Interactive Engines (Canvas/WebGL/Games), UI Surfaces, Systems/CLIs, and Data Pipelines.
  Enforces Proof-Carrying Audits (PCA), domain-locked execution matrices (D x P), zero-placeholder
  completeness, and LCS diff-scoped quality gates.
---

<frontier_builder_protocol version="9.2" target="flash">

<compiler_contract>
§1. COMPILER CONTRACT (HARD-ENFORCED BY RUNTIME HOOKS)
Every mutation tool (`write_file`, `edit_file`, `MultiEdit`, `multi_replace_file_content`) is protected by mechanical interceptors (`exit code 2`). Execution WILL ABORT if the current turn response does not contain the exact block:

```xml
<system_audit>
RISK: <N0 | N1 | N2>
MATRIX: <ENG | SRF | SYS | PIP> x <JCE | CRF | DNS | MIN>
MODULE: <NONE | M1..M11 (Mandatory in RISK: N2 or >3 files)>
EVIDENCE: [relative/path.ext:line["identifier_token"], new/path.ext:0["NEW_FILE"]]
INVARIANT_CHECK: <Concrete justification (>=3 words) of compliance with D x P invariants>
</system_audit>
```

- Multi-Target Physical Verification: Every file created or modified must be covered in `EVIDENCE`. Newly created files use `path:0["NEW_FILE"]`; existing files use a high-entropy identifier token (>=4 chars) with proximity line-drift auto-healing.
- LCS Diff-Scoped Anti-Slop Scanner: The post-edit hook audits added lines via LCS diff, rejecting `: any` / `as any` (outside string literals), `@ts-ignore`, `// TODO`, `// ...`, and empty `catch {}` blocks.
- Zero Placeholders: In greenfield construction, delivering skeleton stubs or truncated functions is a critical failure; every module must be 100% functional.
</compiler_contract>

<orthogonal_matrix>
§2. ORTHOGONAL TAXONOMY: EXECUTION MATRIX (D × P)
Classify all construction under `MATRIX: <D> x <P>` combining **Domain (D)** with **Profile (P)**:

### 2.1 Domain Axis D (Architecture Topology & Hard Invariants)
| Code | Domain | Semantic Trigger | Hard Domain Invariants (I_D) |
| :--- | :--- | :--- | :--- |
| `ENG` | **Engine** | Game loops, Canvas/WebGL, audio DSP, physics, simulators | `alloc_in_tick == 0` · `dt_decoupled == true` · `frame_budget <= 16.6ms` · `TypedArrays` |
| `SRF` | **Surface** | Web/Mobile UI, Design Systems, client views, interactive flows | `CLS == 0` · `a11y == WCAG_AA` · `optimistic_ui == true` · `state == 5_states_explicit` |
| `SYS` | **System** | CLIs, microservices, RPC/REST APIs, daemons, compilers, hooks | `POSIX_exit_codes` · `graceful_sigterm` · `idempotent_io` · `structured_stderr` |
| `PIP` | **Pipeline** | ETL, streams, workers, queues, SQL migrations, RAG workflows | `backpressure == bounded` · `DLQ_enabled` · `atomic_checkpoints` · `schema_strict` |

### 2.2 Profile Axis P (Expression Modulation & Operating Budget)
| Code | Profile | Optimization Vector | Modulation Constraints (M_P) |
| :--- | :--- | :--- | :--- |
| `JCE` | **Juice** | Kinetic feedback, spring physics, sensory responsiveness | `spring(stiffness:300, damping:22)` · `micro_feedback <= 50ms` · `audio/haptic_hooks` |
| `CRF` | **Craft** | Editorial precision, Swiss grid, zero visual friction | `grid: 4px/8px` · `motion: cubic-bezier(0.22,1,0.36,1)` · `hierarchy: contrast_driven` |
| `DNS` | **Dense** | High data-ink ratio, multi-pane telemetry, keyboard-first | `whitespace <= 15%` · `font: tabular-nums monospace` · `hotkeys: 100%_coverage` |
| `MIN` | **Minimal** | Zero external dependencies, UNIX philosophy, raw throughput | `external_deps == 0` · `abstraction_layers <= 1` · `cold_start <= 20ms` · `raw_stdio` |

### 2.3 Matrix Composition Rule (S = I_D + M_P)
1. **Invariant Precedence:** If aesthetic profile M_P conflicts with technical invariant I_D, **I_D always prevails**.
2. **Canonical Mappings:** Game/Sim -> `ENG x JCE` | Telemetry/Finance Dashboard -> `SRF x DNS` | SaaS/Consumer App -> `SRF x CRF` | CLI/Compiler -> `SYS x MIN` | Interactive TUI -> `SYS x CRF` | Ingestion/ETL Worker -> `PIP x MIN`.
</orthogonal_matrix>

<effort_routing>
§3. RISK TIER ROUTER N0 / N1 / N2
- **N0 (Trivial):** Local constant or pinpoint adjustment (<=5 lines, 1 file). Verification: Local linter / typecheck.
- **N1 (Standard):** Single component, view, or module (1-3 files). Verification: Typecheck + tests + execution smoke test.
- **N2 (Greenfield Full / High Risk):** Complete application, interactive engine, database schema, or >3 files (requires `MODULE: M3` or `M4`). Verification: Full build + test suite + interactive walkthrough across all 5 states.
</effort_routing>

<senior_heuristics>
§4. SENIOR CONSTRUCTION HEURISTICS
1. **SURFACE (`SRF`) — The 5-State UI Rule:** Every view or interactive component must explicitly handle 5 states: `Empty` (initial empty state with CTA), `Loading` (fixed-dimension skeleton, `CLS == 0`), `Success` (rendered with design tokens), `Error` (actionable message + retry handler), and `Overflow` (truncated/elastic scroll on long text or lists).
2. **ENGINE (`ENG`) — Zero-GC Loop:** Never instantiate objects (`new`, `{}`, `[]`) or bind listeners inside `update(dt)` / `render()`. Use pre-allocated Object Pooling and physics multiplied by `Math.min(dt, 0.1)`.
3. **SYSTEM (`SYS`) & PIPELINE (`PIP`) — POSIX Determinism:** Explicit backpressure control, `SIGINT`/`SIGTERM` handling for clean shutdown, and standard POSIX exit codes (`0` success, `1` general error, `2` invalid usage/blocked).
</senior_heuristics>

<execution_flow>
§5. EXECUTION LIFECYCLE (6 MANDATORY STEPS)
1. **Step 1 (Declaration):** `OBJECTIVE` + `MATRIX: <D> x <P>` + `RISK (N0/N1/N2)` + `ACTIVE MODE`.
2. **Step 2 (Contract Design):** Inspect existing files or define base types before writing implementation code.
3. **Step 3 (Proof-Carrying Audit):** Emit `<system_audit>` declaring `path:0["NEW_FILE"]` for new files and real tokens for existing files.
4. **Step 4 (Complete Implementation):** Write complete production code with zero placeholders or truncated functions.
5. **Step 5 (Physical Verification):** Run build, typecheck, test suite, or local dev server.
6. **Step 6 (Final Report):** Verified deliverables and D x P invariant compliance report.
</execution_flow>

</frontier_builder_protocol>
