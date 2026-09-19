# Architecture Snapshot

```mermaid
flowchart LR
  A[Agent intent] --> B[Simulation engine]
  B --> C[Projected effects + side effects + rollback]
  C --> D{Human decision}
  D -->|Tweak| B
  D -->|Reject| N[No write]
  D -->|Approve| P[Authoritative preflight]
  P -->|State drift / critical dependency| X[Block + audit]
  P -->|Pass| S[Persist rollback snapshot]
  S --> E[Execute real write]
  E --> L[Audit trail]
  E --> R[Rollback endpoint]
  R --> L
```

## Safety boundary
The simulation is advisory. The preflight is authoritative. Approval never bypasses a failed preflight.

## Data path
Intent → simulation snapshot/fingerprint → human review → live-state re-read → invariant checks → rollback snapshot → destructive write → audit/rollback.
