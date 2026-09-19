# Scope

## User
A human operator reviewing a high-stakes action proposed by an autonomous agent.

## Problem
Confirmation dialogs reveal intent but not consequences. At agent speed, humans need a concrete blast-radius preview before commitment.

## MVP outcome
A judge can watch a destructive action move through simulate → review/tweak → authoritative preflight → execute → rollback, then watch a wrong simulation get blocked downstream.

## In scope
- Real persisted demo system.
- Destructive workspace delete.
- Before/after effect diff.
- Side effects and rollback path.
- Approve / tweak / reject.
- State fingerprint drift detection.
- Independent critical-dependency guard.
- Failure Lab.
- Audit trail.

## Cut
- Payments: requires external credentials and distracts from the safety primitive.
- Mass email: weaker rollback semantics.
- General-purpose agent planner: too broad for a sharp 90-second demo.
