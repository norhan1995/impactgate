# Technical Spec

## Frontend
React + Vite single-page demo. Three stages: intent, simulation review, result/rollback. Live-state and audit panels remain visible.

## Simulation engine
Pure deterministic module computes modeled effects from the current persisted state. It returns a fingerprint, effect counts, side effects, and rollback description. `legal_hold` is intentionally not part of the simulator model for the failure test.

## Persistence
Local clone uses a JSON file store for zero-infrastructure reproducibility. Public demo uses the hosted AppDeploy database adapter.

## Execution gate
Before commit:
1. Re-read live state.
2. Recompute fingerprint and reject drift.
3. Scan for authoritative `criticalGuard` dependencies.
4. Persist a rollback snapshot.
5. Execute delete.
6. Write audit event.

## API
- `GET /api/state`
- `POST /api/reset`
- `POST /api/simulate`
- `POST /api/reject`
- `POST /api/execute`
- `POST /api/rollback`

## Failure strategy
Simulator errors never cause writes. Snapshot failure aborts deletion. State drift requires re-simulation. Critical dependencies block regardless of human approval.
