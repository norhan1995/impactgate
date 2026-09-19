# 90-Second Walkthrough Script

**0:00–0:10 — Problem**
“Agents can move faster than humans can inspect their writes. ImpactGate adds a transaction boundary: simulate first, then commit.”

**0:10–0:28 — Simulate**
“Here the agent wants to delete a production customer workspace. I run the simulation. It reads persisted state and shows the before-versus-after diff: four members lose access, two API keys die, two automations stop, two scheduled exports disappear, and the webhook stops.”

**0:28–0:42 — Tweak**
“I can reject, approve, or change scope. I’ll preserve scheduled exports. The system re-simulates, and now the projected after-state changes before I approve.”

**0:42–0:58 — Execute + rollback**
“I approve. Before the write, ImpactGate re-reads live state, creates a rollback snapshot, then performs the deletion. The live-state card and audit trail prove the write actually happened. One click restores it from the snapshot.”

**0:58–1:22 — Failure test**
“Now the important part. I enable Failure Lab. It inserts an unmodeled regulatory hold. The simulator misses it, so the preview under-predicts the risk. I approve anyway. The independent execution guard finds the hold and blocks the write. The workspace stays active.”

**1:22–1:30 — Thesis**
“Simulation is advisory; execution guards are authoritative. That’s the pattern agents need before they touch real systems.”
