# Two-Year Thesis: Simulation-Gated Agents

In two years, simulation will be a default boundary between agent intent and consequential writes, much like code review sits between a change and production today.

The important shift is not “show the user a summary before acting.” A summary can still be a confirmation dialog with better prose. A useful simulation must produce inspectable state: the exact objects expected to change, indirect effects, a confidence boundary, and a rollback plan. It must also be falsifiable. If the world changes after simulation, approval should expire.

That leads to a two-layer safety model. First, an advisory simulator predicts the blast radius and helps the human change scope. Second, an authoritative execution gate re-reads live state and checks invariants that do not depend on the simulator’s reasoning. The simulator can be wrong; the guard cannot simply trust it.

Agents will increasingly execute actions faster than humans can manually inspect individual API calls. “Undo” is too late for irreversible or cascading effects. Simulation turns the human role from micromanaging every tool call into reviewing a proposed transaction before commitment.

The winning agent platforms will make this pattern composable: action schemas declare simulators, side-effect models, approval policies, preflight invariants, and rollback handlers. High-stakes writes that cannot provide those contracts will be treated as unsafe by default.
