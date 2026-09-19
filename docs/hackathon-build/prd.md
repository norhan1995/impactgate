# PRD

## Epic 1 — Simulate before write
As an operator, I can simulate a destructive action and see projected effects before anything changes.

Acceptance:
- Workspace state is unchanged after simulation.
- Preview includes member, key, automation, export, and webhook counts.
- Preview includes side effects and a rollback path.

## Epic 2 — Human changes the decision
As an operator, I can reject, approve, or preserve scheduled exports and re-simulate.

Acceptance:
- Reject performs no target write.
- Tweak changes the projected diff.
- Execution follows the revised scope.

## Epic 3 — Safe execution and rollback
As an operator, I can approve a reviewed simulation and recover from the write.

Acceptance:
- Live state is re-read before commit.
- State drift blocks execution.
- Rollback snapshot exists before deletion.
- Rollback restores deleted state.

## Epic 4 — Failure thinking
As a reviewer, I can prove that an incomplete simulation does not automatically authorize an unsafe write.

Acceptance:
- Failure Lab inserts a dependency the simulator omits.
- Approval still reaches authoritative preflight.
- Preflight blocks deletion and logs the reason.
