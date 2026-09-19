# ImpactGate Project Playbook

## Purpose
Build and validate the Simulate Before You Act hackathon entry.

## When to use
Use for implementation, review, debugging, demo prep, and submission readiness for ImpactGate.

## Inputs
Challenge brief, current source, eval results, deployment status, and submission requirements.

## Steps
1. Validate feasibility, cost, and judging fit.
2. Define the smallest complete high-stakes action.
3. Write tests/evals before implementation changes.
4. Separate advisory simulation from authoritative execution controls.
5. Build the full vertical slice and persisted rollback.
6. Test normal, tweak, reject, drift, rollback, and under-prediction paths.
7. Review privacy, security, reproducibility, and demo clarity.
8. Deploy and verify public access.
9. Prepare repo, architecture, demo, failure test, thesis, and submission notes.

## Decisions
Prefer free/open tools, explicit state, bounded blast radius, and reversible demo data. Never let human approval bypass authoritative preflight failure.

## Definition of done
PASS only when the clean clone runs, tests pass, live demo works, a real write is gated, rollback is real, under-prediction is caught, and all submission assets exist.

## Edge cases
State changes after preview; missing snapshot; already-deleted target; hidden critical dependency; repeated approval; rollback when target already exists.
