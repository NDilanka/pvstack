# pvstack role sheet. One line per role; each value is a pv-* droid name (or a list for panels).
# Pass the value as the Task tool's subagent_type. `inherit` means use the built-in `worker` droid on the parent model.
# Evidence for every choice: docs/model-evidence.md in the pvstack repository.
# mode: open
# pin: judgment and prose: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
# pin: how explainer: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
# pin: why synthesizer: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
# pin: reflect judgment, divergent, synthesizer: the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights
feature, refactoring: pv-ds-high
bug-fix: pv-ds-high
perf-issue: pv-ds-high
hillclimb: pv-ds-high
mechanical edits: pv-ds-low
judgment and prose: pv-ds-high
hardest tasks: pv-ds-high
how explorer: pv-ds-low
how explainer: pv-ds-high
why investigators: pv-ds-low
why synthesizer: pv-ds-high
reflect tooling: pv-ds-high
reflect judgment, divergent, synthesizer: pv-ds-high
arena runners: pv-ds-max, pv-ds-high, pv-ds-low
arena cross-judge pool: pv-ds-max, pv-ds-high, pv-ds-low
swarm workers: pv-ds-high
architect runners: pv-ds-max, pv-ds-high, pv-ds-low
interrogate reviewers: pv-ds-max, pv-ds-high, pv-ds-low
