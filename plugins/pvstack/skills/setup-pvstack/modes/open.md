# PV Stack role sheet. One line per role; each value is a pv-* droid name (or a list for panels).
# Pass the value as the Task tool's subagent_type. `inherit` means use the built-in `worker` droid on the parent model.
# Evidence for every choice: docs/model-evidence.md in the PV Stack repository.
# mode: open
# pin: judgment and prose: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
# pin: how explainer: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
# pin: why synthesizer: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
# pin: reflect judgment, divergent, synthesizer: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
feature, refactoring: pv-ds-max
bug-fix: pv-ds-max
perf-issue: pv-ds-max
hillclimb: pv-ds-max
mechanical edits: pv-ds-low
judgment and prose: pv-ds-max
hardest tasks: pv-ds-max
how explorer: pv-ds-low
how explainer: pv-ds-max
why investigators: pv-ds-low
why synthesizer: pv-ds-max
reflect tooling: pv-ds-max
reflect judgment, divergent, synthesizer: pv-ds-max
arena runners: pv-ds-max, pv-ds-high, pv-ds-low
arena cross-judge pool: pv-ds-max, pv-ds-high, pv-ds-low
swarm workers: pv-ds-max
architect runners: pv-ds-max, pv-ds-high, pv-ds-low
interrogate reviewers: pv-ds-max, pv-ds-high, pv-ds-low
