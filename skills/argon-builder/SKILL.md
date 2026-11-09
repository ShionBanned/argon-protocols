---
name: argon-builder
description: >-
  Frontier Builder Protocol v9.0 (Hybrid PCA Architecture) for greenfield software creation across all domains:
  Interactive Engines (Canvas/WebGL/Games), UI Surfaces, Systems/CLIs, and Data Pipelines.
  Enforces Proof-Carrying Audits (PCA), orthogonal tensor classification (D x P), zero-placeholder completeness,
  and hard runtime quality gates.
---

<frontier_builder_protocol version="9.0" target="flash">

<compiler_contract>
§1. COMPILER CONTRACT (HARD-ENFORCED BY RUNTIME HOOKS)
Every mutation tool (`write_file`, `edit_file`, `MultiEdit`) is guarded by mechanical interceptors (`exit code 2`). Execution WILL ABORT if the preceding response does not contain the exact block:

```xml
<system_audit>
RISK: <N0 | N1 | N2>
MATRIX: <ENG | SRF | SYS | PIP> x <JCE | CRF | DNS | MIN>
EVIDENCE: [relative/path.ext:line["exact_token"], new/path.ext:0["NEW_FILE"]]
INVARIANT_CHECK: <1 line proving strict adherence to D x P invariants>
</system_audit>
```

- Physical Verification: The hook validates on disk that the file exists, the line (±5) contains `"exact_token"`, and the target file is covered. For brand-new files, declare `path:0["NEW_FILE"]`.
- Anti-Slop Linter: The post-execution hook automatically rejects code containing `any`, `@ts-ignore`, `// TODO`, `// ...`, or empty `catch {}` blocks.
- Zero Placeholders: In greenfield creation, delivering empty skeletons or truncated code is a critical failure; every component delivered must be 100% functional, integrated, and complete.
</compiler_contract>

<orthogonal_tensor>
§2. ORTHOGONAL TAXONOMY: EXECUTION TENSOR (D × P)
Monolithic archetypes are strictly forbidden. Classify every task into `MATRIX: <D> x <P>` by evaluating the Cartesian product of **Domain (D)** by **Profile (P)**:

### 2.1 Domain Axis D (Architecture Topology & Core Invariants)
| Code | Domain | Semantic Trigger | Hard Domain Invariants ($\mathcal{I}_D$) |
| :--- | :--- | :--- | :--- |
| `ENG` | **Engine** | Game loops, Canvas/WebGL, audio DSP, physics, simulation | `alloc_in_tick == 0` · `dt_decoupled == true` · `frame_budget <= 16.6ms` · `TypedArrays` |
| `SRF` | **Surface** | Web/Mobile UI, Design Systems, client views, interactive flows | `CLS == 0` · `a11y == WCAG_AA` · `optimistic_ui == true` · `state == FSM_explicit` |
| `SYS` | **System** | CLIs, microservices, RPC/REST APIs, daemons, compilers, hooks | `POSIX_exit_codes` · `graceful_sigterm` · `idempotent_io` · `structured_stderr` |
| `PIP` | **Pipeline** | ETL, streams, workers, message queues, SQL migrations, RAG | `backpressure == bounded` · `DLQ_enabled` · `atomic_checkpoints` · `schema_strict` |

### 2.2 Profile Axis P (Expression Modulator & Operational Budget)
| Code | Profile | Optimization Vector | Modulation Constraints ($\mathcal{M}_P$) |
| :--- | :--- | :--- | :--- |
| `JCE` | **Juice** | Kinetic feedback, spring physics, sensory response | `spring(stiffness:300, damping:22)` · `micro_feedback <= 50ms` · `audio/haptic_hooks` |
| `CRF` | **Craft** | Editorial precision, Swiss grid, zero visual friction | `grid: 4px/8px` · `motion: cubic-bezier(0.22,1,0.36,1)` · `hierarchy: contrast_driven` |
| `DNS` | **Dense** | High data-ink ratio, multi-panel telemetry, keyboard-first | `whitespace <= 15%` · `font: tabular-nums monospace` · `hotkeys: 100%_coverage` |
| `MIN` | **Minimal** | Zero dependencies, UNIX philosophy, raw throughput | `external_deps == 0` · `abstraction_layers <= 1` · `cold_start <= 20ms` · `raw_stdio` |

### 2.3 Tensor Composition Rule ($\mathcal{S} = \mathcal{I}_D \oplus \mathcal{M}_P$)
- **Domain Precedence:** Hard domain invariants ($\mathcal{I}_D$) always override aesthetic profile modifiers ($\mathcal{M}_P$). Never compromise engine frame budget for juice animations, nor pipeline checkpoints for minimalism.
- **Canonical Examples:** High-frequency dashboard $ightarrow$ `SRF x DNS` | CLI utility $ightarrow$ `SYS x MIN` | Canvas physics engine $ightarrow$ `ENG x JCE` | Design system component $ightarrow$ `SRF x CRF`.
</orthogonal_tensor>

<effort_routing>
§3. N0 / N1 / N2 RISK TIER ROUTER
- **N0 (Atomic Leaf):** Pure helper function, isolated UI token, static type definition. Verification: targeted unit test or AST linter.
- **N1 (Composite Component):** UI component with state, CLI command with subcommands, standalone pipeline transform. Verification: typecheck + end-to-end component test.
- **N2 (Core Architecture):** Greenfield engine, state machine store, public API gateway, distributed worker pipeline. Verification: full build + load/stress tests + zero-GC verification.
</effort_routing>

<senior_heuristics>
§4. SENIOR BUILDER HEURISTICS

1. THE 5 MANDATORY UI STATES (For `SRF` Domain)
Every surface component must explicitly implement and handle:
- Empty State (actionable call-to-action)
- Loading / Skeleton State (zero CLS)
- Populated Success State
- Error State (human-readable explanation + retry action)
- Overflow / Extreme Edge-Case State (long strings, high density, mobile viewport)

2. ZERO-ALLOCATION TICK LOOPS (For `ENG` Domain)
- Pre-allocate object pools, vectors, and typed arrays during initialization.
- Instantiating objects (`new Object()`, `{ ...spread }`, `[...arr]`) inside `requestAnimationFrame` or high-frequency processing ticks is strictly forbidden.

3. IDEMPOTENT LIFECYCLE & POSIX RESILIENCE (For `SYS` & `PIP` Domains)
- Clean signal handling (`SIGINT`, `SIGTERM`): flush buffers, close database pools, exit cleanly.
- Never write to standard output (`stdout`) what belongs in diagnostics (`stderr`).
</senior_heuristics>

<execution_flow>
§5. MANDATORY EXECUTION FLOW
1. Initial Declaration: `OBJECTIVE` + `MATRIX: <D> x <P>` + `RISK (N0/N1/N2)`.
2. Physical Inspection: Read existing codebase patterns and contracts (`read_file`).
3. Emit `<system_audit>` declaring lexical anchors and invariant check.
4. Complete Atomic Implementation (Zero placeholders, zero `TODO`).
5. Mechanical Verification (`lint && typecheck && test`).
6. Production Handover: Deliver verified files, usage instructions, and self-review.
</execution_flow>

</frontier_builder_protocol>
