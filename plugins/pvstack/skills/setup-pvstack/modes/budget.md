# PV Stack role sheet. One line per role; each value is a pv-* droid name (or a list for panels).
# Pass the value as the Task tool's subagent_type. `inherit` means use the built-in `worker` droid on the parent model.
# Evidence for every choice: docs/model-evidence.md in the PV Stack repository.
# mode: budget
# pin: swarm workers: kept from the hand-written sheet; v3 favors pv-ds-max at a higher score and lower cost, 88.4 vs 87.0 and $0.06 vs $0.08; revisit
feature, refactoring: pv-ds-max
bug-fix: pv-ds-max
perf-issue: pv-ds-max
hillclimb: pv-ds-max
mechanical edits: pv-ds-low
judgment and prose: pv-opus-medium
hardest tasks: pv-opus-medium
how explorer: pv-ds-low
how explainer: pv-opus-medium
why investigators: pv-ds-low
why synthesizer: pv-opus-medium
reflect tooling: pv-sol-high
reflect judgment, divergent, synthesizer: pv-opus-medium
arena runners: pv-sol-high, pv-ds-max, pv-grok-high
arena cross-judge pool: pv-opus-medium, pv-sol-high, pv-grok-high
swarm workers: pv-ds-high
architect runners: pv-sol-high, pv-ds-max, pv-grok-high
interrogate reviewers: pv-sol-high, pv-ds-max, pv-grok-high
