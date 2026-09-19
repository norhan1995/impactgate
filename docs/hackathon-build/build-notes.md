# Build Notes

- The challenge disqualifies confirmation-dialog theater, so the preview is computed from persisted state and can change execution scope.
- The failure test is deliberately architectural: simulation and authoritative preflight are separate trust layers.
- A state fingerprint invalidates approvals when live state changes between preview and commit.
- The demo avoids external paid APIs and credentials while still performing a real destructive write.
