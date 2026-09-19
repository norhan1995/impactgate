# Submission Notes

## What to look at
- Real destructive action against persisted application state.
- Diff-style before/after simulation.
- One-step reject, tweak, or approve.
- Rollback snapshot created before the destructive write.
- Failure Lab where simulation is deliberately incomplete but an independent preflight catches the missed dependency.

## AI tools used
- ChatGPT / GPT-5.6 Sol for product scoping, architecture, implementation, testing design, and submission drafting.
- AppDeploy for the public live build and persisted demo backend.

## Key decisions
- Chose destructive data deletion so the demo can prove a real high-stakes write without paid external APIs or credentials.
- Kept simulation advisory and execution preflight authoritative.
- Added state fingerprints so approval expires when state drifts after simulation.
- Added a deliberately unmodeled dependency to prove the safety net works when prediction is wrong.

## Out of scope
- Real billing or banking APIs.
- Multi-tenant authentication.
- Production-grade RBAC and encryption key management.
- Generic natural-language planning across arbitrary tools; the submission focuses on the simulation-gate primitive.
