# Argon Protocols 10.0

[Manual maestro en español](README_ES.md) · [MIT](LICENSE)

Evidence-guided skills for Gemini Flash: maintenance (`argon-core`), new software (`argon-builder`), and explicitly requested audiovisual work (`argon-director`). They improve workflow discipline, not model weights. No superiority over frontier models has been established.

Version 10 reconciles the divergent v9.2/v9.3 copies. It fixes current-turn transcript boundaries, target coverage, bounded anchors, host-specific responses, concurrent snapshots, AST-based JS/TS diagnostics, and reproducible command receipts. Guidance is proportional to risk rather than mandatory rewrite cycles, invented ambiguity scores or unmeasured performance promises.

## Setup

Use Node 22.18+ and Bun. Install the pinned parser with `bun install --frozen-lockfile --ignore-scripts`. Run:

```text
node scripts/validate.mjs
node --test tests/*.test.mjs
node scripts/install.mjs --config-root /absolute/path/to/.gemini/config
node scripts/install.mjs --config-root /absolute/path/to/.gemini/config --apply --backup /new/backup/directory
node scripts/doctor.mjs --config-root /absolute/path/to/.gemini/config
```

The installer preserves other hook groups and backs up replaced files. Hooks reference this package directory; keep it available with its dependencies. Restart/reload the host and inspect active hooks. Doctor verifies filesystem state, not that an existing host session loaded the changes. Global registration affects all matched editing tools; use workspace registration for project-only scope, avoiding duplicate registration.

Restore with `node scripts/install.mjs --restore /backup/directory`. Restore refuses to overwrite files edited after installation. Existing demo media and unrelated global tools are outside the installer's scope.

## Boundaries

- The pre-hook verifies a current assistant audit, paths, evidence and snapshots. It cannot prove comprehension or semantic correctness. It never reads private thinking or trusts tool output as an audit.
- The post-hook produces review diagnostics, not a rollback. Antigravity requires an empty post-event response; the next PreInvocation supplies pending feedback.
- The pinned TypeScript parser handles JS/TS family files. Use project tools for other languages. AST diagnostic differences avoid forcing unrelated legacy cleanup, but are not a compiler or exhaustive change analysis.
- Header checks are not media integrity checks. A shell heuristic is not a sandbox. Cross-session writes to the same target must be serialized externally.
- Command receipts say `CHECK_PASSED`, not that a natural-language claim is proven. No default command, implicit shell or automatic broad approval exists.
- Generic/Claude/Gemini adapter payloads can be tested locally; only Antigravity installation is provided. Do not interchange host hook configuration schemas.

Read the [operating contract](docs/PROTOCOL.md), [Spanish installation and limits](README_ES.md), and [controlled evaluation protocol](evals/README.md). `scripts/sync.mjs` regenerates shared skill references, agent descriptions and matching hook templates. `scripts/validate.mjs` detects drift. The pilot evaluation does not call model APIs or claim frontier parity.

Original author: Shion. License and existing assets are preserved.
