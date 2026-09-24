# ImpactGate

[![CI](https://github.com/norhan1995/impactgate/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/norhan1995/impactgate/actions/workflows/verify.yml)

**Simulate before you act.** ImpactGate is a safety layer for agents that previews the blast radius of a consequential write, lets a human approve/tweak/reject it, then re-checks live state before commit.

## Live demo
https://impactgate-nqy6vz.v2.appdeploy.ai/

## The high-stakes action
The demo deletes a persisted production-like customer workspace and its dependent member access, API keys, automations, scheduled exports, and webhook configuration.

This is not an “are you sure?” modal. The simulation reads live state, computes a before/after diff, describes side effects, records a state fingerprint, and defines a rollback path. A scope tweak — preserving scheduled exports — changes both the preview and the write.

## Safety model
1. **Intent** — proposed destructive action.
2. **Simulate** — compute projected effects from live state.
3. **Present** — show diff, side effects, and rollback.
4. **Human decision** — reject, tweak, or approve.
5. **Preflight** — re-read live state, reject drift, enforce hard invariants.
6. **Snapshot** — persist rollback data before deletion.
7. **Execute** — perform the actual write.
8. **Rollback** — restore from snapshot.

The simulator is advisory. The preflight is authoritative.

## Failure test
Enable **Failure Lab**. It inserts a real regulatory hold into persisted state, but the simulator intentionally does not model that dependency. The preview therefore under-predicts the side effect. When the user approves, the independent execution preflight finds the hold and blocks the delete. The workspace remains active and the block is audited.

## Clean-clone run
```bash
npm install
npm test
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:8787` and persists demo state to `data/store.json`.

## Tests
`npm test` verifies:
- full destructive blast-radius prediction,
- scope tweak preserving exports,
- hidden legal hold caught downstream,
- state-drift invalidation,
- rollback restoration.

## Submission assets
- Architecture: `docs/architecture.md`
- Failure test: `docs/failure-test.md`
- ≤300-word thesis: `docs/thesis.md`
- 90-second walkthrough: `docs/demo-script.md`
- Submission notes: `docs/submission-notes.md`
- Playbook artifacts: `docs/hackathon-build/`

## AI usage
GPT-5.6 Sol was used for scoping, architecture, implementation, eval design, debugging, and submission drafting. AppDeploy hosts the public demo.

## Out of scope
Real financial transfers, external email APIs, production multi-tenant auth/RBAC, and a general-purpose natural-language planner. The entry is intentionally focused on the simulation-gate primitive.

## Author

**Norhan Rifaie**  
[Portfolio](https://norhanrifaie.vercel.app) · [GitHub](https://github.com/norhan1995)
