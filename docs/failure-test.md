# Failure Test — Simulator Under-Predicts a Side Effect

1. Reset the demo.
2. Enable **Failure lab**.
3. The backend inserts a real `legal_hold` dependency into persisted live state.
4. The simulation layer deliberately does not model `legal_hold`, so the preview looks safe enough to approve.
5. Click **Approve & execute**.
6. The execution preflight independently scans live dependencies, finds `criticalGuard: true`, and blocks the write.
7. The workspace remains active and the audit trail records a blocked action.

This proves the safety model does not depend on the simulator being perfectly accurate.
