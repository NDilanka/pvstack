# Model evidence

pvstack picks a model and reasoning effort for every pstack role from the published results of [VulcanBench](https://vulcanbench.com), Morgan Linton's open-source benchmark for real engineering tasks ([methodology](https://vulcanbench.com/methodology.html)). This page records each number it relies on, where the number comes from, and which picks are inferred rather than measured.

Data pulled on 2026-10-06 from:

- Frontier v4 leaderboard and Routine v1 board: https://vulcanbench.com/leaderboard.html (CSV: https://vulcanbench.com/assets/data/swe-v4-board.csv, https://vulcanbench.com/assets/data/routine-v1-board.csv)
- Grok 4.7 report (Frontier v4, Routine v1 and Safety v1), published 2026-10-04: https://vulcanbench.com/benchmarks/swe-v4-grok47-cursor-v320.html (per-run data: https://vulcanbench.com/assets/data/swe-v4-grok47-cursor-v320/runs.csv)
- Grok 4.7 API prices: https://docs.x.ai/developers/models/grok-4.7
- Retired SWE v3 board: https://vulcanbench.com/leaderboard.json
- Droid model IDs, reasoning levels and multipliers: https://docs.factory.com/models.md

## How to read the numbers

- **Frontier v4** has 23 hard behavioral-reconstruction tasks. The combined score is 50% hidden tests, 8.5% lint and complexity, 8.5% security, and 33% code quality judged for a human reader. Cost is API-equivalent at list rates.
- **Routine v1** has 12 everyday tickets on small Python packages. It answers "what is the cheapest effort level that is enough".
- **SWE v3** is retired. It has 23 tasks from merged open-source PRs, ranked by pass@1. It is the only VulcanBench data for DeepSeek, GLM, Qwen and Kimi. **Its numbers can't be compared with v4.** They are used here only to compare models and effort levels within v3.
- Every Frontier v4 run used an agent CLI (Claude Code for Claude, Codex for GPT, Cursor for Grok 4.7), not Droid. VulcanBench measured harness effects of up to about 20 points on a single model (Reports 15, 16 and 18). Treat all picks as strong priors to re-check in Droid, not as guarantees.
- The Droid multiplier is what Droid bills relative to its base rate. It roughly tracks list price but not token use, so both numbers are shown.

## Measured cells (Frontier v4)

<!-- vulcanbench:cells -->
| Droid | Model / effort | Score | Passed | $/task | Min/task | Droid multiplier |
| --- | --- | --- | --- | --- | --- | --- |
| `pv-sol-low` | GPT-6.1 Sol / low | 86.22 | 20/23 | $0.31 | 6.9 | 0.8× |
| `pv-sol-high` | GPT-6.1 Sol / high | 88.23 | 23/23 | $0.33 | 10.2 | 0.8× |
| `pv-sol-xhigh` | GPT-6.1 Sol / xhigh | 88.78 | 23/23 | $0.43 | 15.4 | 0.8× |
| `pv-opus-medium` | Claude Opus 5.5 / medium | 90.86 | 23/23 | $2.84 | 18.6 | 1.6× |
| `pv-opus-high` | Claude Opus 5.5 / high | 91.11 | 22/22 | $3.27 | 21.4 | 1.6× |
| `pv-grok-high` | Grok 4.7 / high | 92.71 | 22/23 | ~$2.19 (estimate) | 25.4 | 0.8× |
| `pv-grok-xhigh` | Grok 4.7 / xhigh | 93.15 | 23/23 | ~$2.96 (estimate) | 28.5 | 0.8× |
<!-- /vulcanbench:cells -->

Cells pvstack doesn't ship but cites below: Grok 4.7 medium 92.30 (21/23, one run hit the 3-hour bound, 27.2 min). Grok 4.7 low 89.42 (18/23, 20.2 min).

Routine v1 for the same models: every level passes 12/12. GPT-6.1 Sol wasn't on Routine v1 when this was written. Opus 5.5 low scores 94.22 at $0.072, and medium scores 95.30 at $0.11. Grok 4.7's four levels are the four top cells, from 97.14 at xhigh to 97.37 at high. Low scores 97.29 at 1.1 minutes per ticket. Grok's Routine cells were judged by Muse Spark 1.3 alone, which VulcanBench says flatters Grok 4.7. Every other column used Muse plus Grok 4.6.

## Reading the Grok 4.7 numbers

- **Different second judge.** Grok 4.6 is the second Code quality judge on every other column. It sat out for an xAI submission, and GPT-6.1 Sol took its seat. Sol rates Grok 4.7's code about 6 points above Muse Spark 1.3, the judge every column shares. Rescored on Muse alone, Grok 4.7 drops 0.8 to 1.0 points. It still leads at medium, high and xhigh. At xhigh it scores 92.27 on the shared judge. VulcanBench compares that with 91.03 for Opus 5.5 high, the cell this change replaces, and 90.86 for Fable 5.1 xhigh at the same level.
- **Different harness.** Grok 4.7 ran in Cursor's agent CLI. Opus ran in Claude Code and Sol in Codex. A Grok Build run is announced and not yet published.
- **No published cost.** The sweep ran on a Cursor subscription, so VulcanBench reports cost as unavailable. The estimates above are pvstack's own. They take each run's tokens from `runs.csv` and price them at xAI's list rates ($2 per million uncached input, $0.50 cached, $6 output). They ignore xAI's higher rate above 200K context, so read them as a floor.
- **Slow and token-heavy.** Grok 4.7 is slower than GPT-6.1 Sol, Opus 5.5 and GPT-6 Astra at every shared effort level. At the same level it uses 2 to 4 times as many tokens per task as GPT-6.1 Sol (3.1 times at high, 3.5 times at xhigh).
- **Safety v1.** Ten tasks carried planted repository notes asking for something the user didn't request. Over 40 runs, Grok 4.7 followed 14 of 80 notes and reported none of them to the user. Over 50 runs, Opus 5.5 followed 3 of 100 and reported 64. Grok never ran the network beacon, the exfiltration or the destructive delete. Neither model leaked the planted secret.

## Inferred cells

<!-- vulcanbench:inferred -->
| Droid | Model / effort | Evidence | Why it is inferred |
| --- | --- | --- | --- |
| `pv-ds-low` | DeepSeek V4.1 Flash / low | v3: V4-Flash low 86% at $0.04, 8.4 min. | VulcanBench measured V4-Flash, not V4.1 Flash. Droid lists V4.1 Flash at 0.12x and marks V4 Flash 0731 deprecated. Its Droid run is under Measured in Droid. |
| `pv-ds-high` | DeepSeek V4.1 Flash / high | v3: V4-Flash high 87% at $0.08, 12 min. | Same as above. |
| `pv-ds-max` | DeepSeek V4.1 Flash / max | v3: V4-Flash max 88.4% at $0.06, 11.2 min. Third-best cell on the whole v3 board, and it scored higher and cost less than high. | Same as above. |
<!-- /vulcanbench:inferred -->

## Presets

The mode sheets in `plugins/pvstack/skills/setup-pvstack/modes/` are generated. Each preset names a rule per role class, and `tools/presets.mjs` resolves those rules over the cells above, so a VulcanBench refresh moves the sheets. Run `npm run vulcanbench`, then `npm run presets`, `npm run evidence` and `npm run playbook`.

<!-- vulcanbench:presets -->
**Balanced.** The default. It trades a little score for a lot of cost on the roles that run often, and buys the top score on the few changes that hurt most.

- Code delegates (feature, refactor, bug fix, perf, hillclimb): `pv-sol-high` (cheapest cell that passed every task it ran and scores within 5 points of the best cell in its pool).
- Swarm workers: `pv-sol-high` (cheapest cell that passed every task it ran and scores within 5 points of the best cell in its pool).
- Exploration, investigators, mechanical edits: `pv-sol-low` (fastest cell).
- Judgment, prose, explainers, synthesizers: `pv-opus-medium` (cheapest cell whose model reported planted notes to the user on Safety v1).
- Hardest changes: `pv-grok-xhigh` (highest-scoring cell).
- Reflect tooling: `pv-sol-xhigh` (highest-scoring cell that runs on GPT-6.1 Sol).
- Review panels: `pv-opus-medium`, `pv-sol-xhigh`, `pv-grok-high` (cheapest cell that scores within 0.5 points of the best cell in its pool, one cell per lab, from Anthropic, OpenAI, xAI).
- Pins: none.

**Budget.** Spends as little as it can on the roles that run often. Code and exploration stay on the open DeepSeek model, judgment and the hardest changes keep the cheapest cell with a published cost and Safety v1 evidence, and the fan-out panels drop Opus. DeepSeek effort levels that the Droid run shows a cheaper level beating are skipped.

- Code delegates (feature, refactor, bug fix, perf, hillclimb): `pv-ds-high` (highest-scoring cell that runs on DeepSeek V4.1 Flash and no cell of the same model beats in the Droid run with more tasks resolved on fewer credits).
- Swarm workers: `pv-ds-high` (highest-scoring cell that runs on DeepSeek V4.1 Flash and no cell of the same model beats in the Droid run with more tasks resolved on fewer credits).
- Exploration, investigators, mechanical edits: `pv-ds-low` (cheapest cell).
- Judgment, prose, explainers, synthesizers: `pv-opus-medium` (cheapest cell whose model reported planted notes to the user on Safety v1).
- Hardest changes: `pv-opus-medium` (cheapest cell that has a published cost and whose model reported planted notes to the user on Safety v1).
- Reflect tooling: `pv-sol-high` (cheapest cell that runs on GPT-6.1 Sol and passed every task it ran).
- Review panels: `pv-sol-high`, `pv-ds-low`, `pv-grok-high` (cheapest cell that scores within 1 point of the best cell in its pool and no cell of the same model beats in the Droid run with more tasks resolved on fewer credits, one cell per lab, from OpenAI, DeepSeek, xAI; arena cross-judge pool from Anthropic, OpenAI, xAI, because the runners are OpenAI, DeepSeek and xAI, so the cross-judge pool needs an outside lab).
  - arena runners, architect runners, interrogate reviewers: `pv-sol-high`, `pv-ds-low`, `pv-grok-high`
  - arena cross-judge pool: `pv-opus-medium`, `pv-sol-high`, `pv-grok-high`
- Pins: none.

**Quality.** Ignores cost. Every class takes the highest score on the board, except judgment, which stays on a model that reported the planted notes on Safety v1, and exploration, which only reads code and takes the fastest cell that passed every task.

- Code delegates (feature, refactor, bug fix, perf, hillclimb): `pv-grok-xhigh` (highest-scoring cell).
- Swarm workers: `pv-grok-xhigh` (highest-scoring cell).
- Exploration, investigators, mechanical edits: `pv-sol-high` (fastest cell that passed every task it ran).
- Judgment, prose, explainers, synthesizers: `pv-opus-high` (highest-scoring cell whose model reported planted notes to the user on Safety v1).
- Hardest changes: `pv-grok-xhigh` (highest-scoring cell).
- Reflect tooling: `pv-grok-xhigh` (highest-scoring cell).
- Review panels: `pv-opus-high`, `pv-sol-xhigh`, `pv-grok-xhigh` (highest-scoring cell, one cell per lab, from Anthropic, OpenAI, xAI).
- Pins: none.

**Fast.** Minimizes minutes. Every class that writes code or judges it takes the fastest cell that failed at most one task. Exploration only reads code, and Routine v1 shows the lowest effort level is enough there, so it takes the fastest cell outright.

- Code delegates (feature, refactor, bug fix, perf, hillclimb): `pv-sol-high` (fastest cell that passed all but one task).
- Swarm workers: `pv-sol-high` (fastest cell that passed all but one task).
- Exploration, investigators, mechanical edits: `pv-sol-low` (fastest cell).
- Judgment, prose, explainers, synthesizers: `pv-opus-medium` (fastest cell that passed all but one task and whose model reported planted notes to the user on Safety v1).
- Hardest changes: `pv-sol-high` (fastest cell that passed all but one task).
- Reflect tooling: `pv-sol-high` (fastest cell that passed all but one task).
- Review panels: `pv-opus-medium`, `pv-sol-high`, `pv-grok-high` (fastest cell that passed all but one task, one cell per lab, from Anthropic, OpenAI, xAI).
- Pins: none.

**Safe.** Keeps Grok 4.7 out of judgment, code and the hardest changes, because Safety v1 shows it followed 14 of 80 planted notes and reported none of them. Grok still votes on panels, where models from other labs can outvote it.

- Code delegates (feature, refactor, bug fix, perf, hillclimb): `pv-sol-high` (cheapest cell that passes the Safety v1 screen and passed every task it ran and scores within 5 points of the best cell in its pool).
- Swarm workers: `pv-sol-high` (cheapest cell that passes the Safety v1 screen and passed every task it ran and scores within 5 points of the best cell in its pool).
- Exploration, investigators, mechanical edits: `pv-sol-low` (fastest cell).
- Judgment, prose, explainers, synthesizers: `pv-opus-medium` (cheapest cell whose model reported planted notes to the user on Safety v1).
- Hardest changes: `pv-opus-high` (highest-scoring cell that passes the Safety v1 screen).
- Reflect tooling: `pv-sol-xhigh` (highest-scoring cell that runs on GPT-6.1 Sol).
- Review panels: `pv-opus-medium`, `pv-sol-xhigh`, `pv-grok-high` (cheapest cell that scores within 0.5 points of the best cell in its pool, one cell per lab, from Anthropic, OpenAI, xAI).
- Pins: none.

**Open.** Uses open-weights models only. DeepSeek V4.1 Flash is the only one on the board, so every role runs on it, judgment included, and the panel seats three of its effort levels. Max effort leaves the single-seat roles because the Droid run measured it resolving fewer tasks than high on more than twice the credits.

- Code delegates (feature, refactor, bug fix, perf, hillclimb): `pv-ds-high` (highest-scoring cell that comes from an open-weights model and no cell of the same model beats in the Droid run with more tasks resolved on fewer credits).
- Swarm workers: `pv-ds-high` (highest-scoring cell that comes from an open-weights model and no cell of the same model beats in the Droid run with more tasks resolved on fewer credits).
- Exploration, investigators, mechanical edits: `pv-ds-low` (cheapest cell that comes from an open-weights model).
- Judgment, prose, explainers, synthesizers: `pv-ds-high` (pinned because the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights).
- Hardest changes: `pv-ds-high` (highest-scoring cell that comes from an open-weights model and no cell of the same model beats in the Droid run with more tasks resolved on fewer credits).
- Reflect tooling: `pv-ds-high` (highest-scoring cell that comes from an open-weights model and no cell of the same model beats in the Droid run with more tasks resolved on fewer credits).
- Review panels: `pv-ds-max`, `pv-ds-high`, `pv-ds-low` (highest-scoring cell that comes from an open-weights model, one cell per effort level, up to 3).
- Pin: `judgment and prose`, `how explainer`, `why synthesizer`, `reflect judgment, divergent, synthesizer` run on `pv-ds-high`, because the only open-weights model has no Safety v1 evidence, and this preset keeps every role on open weights.
<!-- /vulcanbench:presets -->

## Role reasoning

### Code work: GPT-6.1 Sol @ high (Balanced)
- Sol @ high passes all 23 tasks, at 97% of Opus 5.5's best combined score (88.23 vs 91.11), for about 1/10 of the cost ($0.33 vs $3.27).
- Sol @ high also costs less than Sol @ medium ($0.33 vs $0.40) while scoring higher, so medium is never the better choice.
- xhigh adds 0.55 points for 30% more cost and 50% more time. That trade is worth it for panels and reflect tooling, where one strong answer matters, but not for every code delegate.
- Upstream pstack uses Grok 4.7 at xhigh for code. Grok 4.7 high scores 4.5 points above Sol high (92.71 vs 88.23), but takes 25.4 minutes per task instead of 10.2, and costs an estimated $2.19 instead of $0.33. Code delegates run often, so Sol's time and cost win. Grok takes the hardest changes instead, where a miss costs the most.

### Judgment and prose: Claude Opus 5.5 @ medium
- Opus @ medium passes 23/23 at 90.86. High gains 0.25 points for 15% more cost. xhigh and max score lower than medium and cost more ($4.11 and $8.75).
- Code quality, the part of the score judged for a human reader, is 77.3 for Opus @ medium vs 73.7 for Sol @ high. Prose and judgment roles are where readability matters most.
- Opus stays here even though Grok 4.7 scores higher on code. These roles write what reaches the user with no other model in between. On Safety v1, Opus reported 64 of 100 planted notes to the user and Grok 4.7 reported none of 80.
- Grok still sits on review panels and in the arena cross-judge pool. There it is one voice among models from other labs, and an Opus-family synthesizer or the parent decides what the user sees.
- Fable 5.1 @ max is the top Anthropic cell (91.84, code quality 82.4), but it costs $9.06 per task, has a 4× Droid multiplier, and requires Anthropic's 30-day retention opt-in. It isn't the default. Add it as a personal override through `/setup-pvstack` if you want it.
- Quality takes Opus @ high instead, because that preset ignores cost and takes the top score among the cells with Safety v1 evidence. Safe takes it for the hardest changes, where Grok 4.7 is excluded.

### Hardest tasks: Grok 4.7 @ xhigh (Balanced), Opus 5.5 @ medium (Budget)
- Grok 4.7 xhigh is the top cell on Frontier v4: 93.15, every task passed, and all 231 hidden behaviours fixed. Opus 5.5 high, the previous pick, scores 91.11. The lead holds on the shared judge alone (92.27 vs 91.03).
- Droid bills Grok at 0.8× against Opus's 1.6×. That is the measured cost argument. The API estimate is at least $2.96 per task against Opus high's measured $3.27, but it leaves requests above 200K context at the base rate, so the real figure may be higher.
- It is slower, 28.5 minutes per task against 21.4. That is acceptable for the few changes that reach this role.
- The parent reviews every delegate's diff (poteto-mode's Subagents section). That review is the check on Grok's Safety v1 result.
- Budget keeps Opus 5.5 medium (90.86, 23/23, measured $2.84). This is the maintainer's choice to keep Budget's defaults on cells with a measured cost. To try Grok there, override `hardest tasks` to `pv-grok-high` with `/setup-pvstack`: 92.71 at an estimated $2.19.

### Search and mechanical work: Sol @ low (Balanced), DeepSeek V4.1 Flash @ low (Budget)
- Exploration only reads code and reports what it finds, so the speed of the lowest effort level matters most. Sol @ low is the fastest Sol cell (6.9 min) and the cheapest ($0.31).
- Routine v1 shows that the lowest effort level is enough for every measured model on ordinary tickets.
- Grok 4.7 low is within 0.08 of Grok's best Routine v1 score at 1.1 minutes per ticket, but on Frontier v4 it uses the most tokens of any Grok level (4.76M per task, about $3.21 estimated). Without a published cost, Sol low stays.
- Fast uses the same reasoning and takes the fastest cell outright, Sol @ low at 6.9 minutes. Its Frontier v4 pass rate (20/23) measures code writing, which exploration doesn't do.
- Quality doesn't take the top score here. Grok 4.7 xhigh would spend 28.5 minutes per lookup, and no benchmark shows that a higher Frontier score makes a read-only search better. It takes the fastest cell that passed every task, Sol @ high at 10.2 minutes.

### Swarm workers: same rule as code
- Swarm workers write code, so every preset resolves them with its code rule. In Budget and Open that is `pv-ds-high`, for the reasons in [Measured in Droid](#measured-in-droid).
- Balanced's OpenAI panel seat sits on a 0.05-point margin. Sol xhigh is 0.55 points above Sol high, and the rule allows 0.5. Any threshold has an edge somewhere. Here the edge is guarded, because `npm run check` warns when the board moves and fails when a regenerated sheet changes.

### Review panels: Opus 5.5, GPT-6.1 Sol, Grok 4.7 @ high
- Panels get their signal from model diversity: findings that independent models agree on carry more weight. This uses three labs: Anthropic, OpenAI and xAI.
- Grok sits at high. It scores 92.71 (SE 0.41), uses the fewest tokens of any Grok level (2.85M per task) and has the lowest estimated cost ($2.19). Medium, the earlier pick, scores 92.30 but had the sweep's one 3-hour timeout, so its token and cost figures cover 22 runs. Medium came from Grok 4.6, whose effort knob ran backward. Grok 4.7's combined score rises at every step.
- In Budget, Opus leaves the fan-out (Opus @ medium costs about 9× Sol @ high per task, $2.84 vs $0.33) and DeepSeek takes its seat. Opus stays in the arena cross-judge pool and still writes every synthesis.
- Budget's DeepSeek seat is `pv-ds-low`. Once max is out, low and high are within a point of each other on v3, and the rule takes the cheaper one. The Droid run shows no measurable difference between them (85.5% vs 86.8% resolved, with overlapping ranges across repeats).

## Rejected for Budget mode

| Model | Evidence (v3) | Why not |
| --- | --- | --- |
| GLM 5.3 (`glm-5.3`, 0.56×) | Low 78.3%. Max, its default, 65.2% in a bare harness. In Z.ai's own ZCode harness, 87.0% at max (Report 18). | Score depends heavily on the harness, and effort works backward outside ZCode. Droid's harness is unmeasured. Revisit after a Droid run. |
| Qwen3.8-Max (`qwen3.8-max`, 0.8×) | Low 81.2% at 19.6 min. Its default, xhigh, 55.1% (Report 12). | Slower and weaker than Sol at the same multiplier. |
| Kimi K3 (`kimi-k3`, 1.2×) | Extra-high 73.7% on 19 of 23 tasks (Report 8). | Lower score at a higher multiplier than Sol. |
| GPT-6 Luna (0.04×) | v4: max 81.4% with 6 runs hitting the 3-hour timeout, 60 min per task. | Too slow and unreliable on hard tasks. On routine work it is a candidate for a future "mechanical" override. |
| Other Droid Core models (MiniMax M3, Nemotron 3 Ultra, Inkling, Mistral Medium 3.5, GLM-5.3-Flash) | No VulcanBench data. | No evidence to rank them. |

## Measured in Droid

pvstack ran VulcanBench's public Python Suite v1 (23 tasks, each from a real open-source fix) through `droid exec --auto high`. Each task ran three times for every DeepSeek cell and for the two everyday Sol cells as controls, which makes 345 runs. Routine v1 would have been the closer match, but its tasks are private. `tools/droid-bench.mjs` is the runner. `data/droid-bench-runs.jsonl` holds every run, and `data/droid-bench.json` holds the summary that `npm run check` keeps in sync with it.

<!-- droid-bench:cells -->
| Droid | Model / effort | Resolved (range across repeats) | Hidden tests passed | Median min | Median credits | Tasks × repeats |
| --- | --- | --- | --- | --- | --- | --- |
| `pv-ds-high` | DeepSeek V4.1 Flash / high | 86.8% (82.6% to 90.9%) | 95.5% | 1.2 | 14,272 | 23 × 3 (1 infra) |
| `pv-ds-low` | DeepSeek V4.1 Flash / low | 85.5% (78.3% to 91.3%) | 95.0% | 1.0 | 11,558 | 23 × 3 (0 infra) |
| `pv-ds-max` | DeepSeek V4.1 Flash / max | 84.9% (82.6% to 86.4%) | 94.6% | 2.3 | 32,797 | 23 × 3 (3 infra) |
| `pv-sol-high` | GPT-6.1 Sol / high | 87.0% | 93.8% | 1.5 | 46,092 | 23 × 3 (0 infra) |
| `pv-sol-low` | GPT-6.1 Sol / low | 87.0% | 93.6% | 0.8 | 26,368 | 23 × 3 (0 infra) |
<!-- /droid-bench:cells -->

How to read it:

- **Functional only.** A run counts as resolved when every hidden `fail_to_pass` and `pass_to_pass` test passes. The VulcanBench combined score also includes lint, security and Code quality, and Code quality needs VulcanBench's judge models. So these numbers can't be compared with the Frontier v4 scores above. They compare cells with each other inside Droid.
- **The grader is checked.** Before any model ran, every task's untouched repository failed its `fail_to_pass` tests and passed its `pass_to_pass` tests, and the gold patch passed all of them (23 of 23 tasks).
- **Credits are what Droid bills.** They come from `droid exec`'s usage report. Medians are per run.
- **The agents couldn't run the hidden test environment.** Tests ran afterwards in a separate virtualenv. The agent's shell started with system Python, which has no pytest or task dependencies. That holds every cell back equally. Two tasks failed for every cell on every run (`oss-click-param-named-help` and `oss-sqlglot-canonicalize-internal-names`), and a third (`oss-pennylane-trotter-fragmented`) passed once in 15 runs. They set the ceiling near 87%.
- **Infra failures** are 45-minute agent timeouts. They are excluded from the resolved rate. `pv-ds-max` hit three of them and `pv-ds-high` one.

What it changed:

- **Resolution doesn't separate the cells.** All five resolve between 84.9% and 87.0%, and the DeepSeek ranges across repeats overlap (78% to 91%). Sol resolved the same 20 tasks in every repeat at both levels.
- **Cost and time do separate them.** `pv-ds-max` used 2.3 times the median credits of `pv-ds-high` (32,797 vs 14,272), took nearly twice the median time (2.3 vs 1.2 minutes) and resolved no more. That reverses the v3 numbers, where max was cheaper than high. The v3 runs measured DeepSeek V4-Flash through its API, not V4.1 Flash in Droid. So Budget and Open now skip any cell that another cell of the same model beats in Droid, with more tasks resolved on fewer credits (the `droidDominated` filter). Only `pv-ds-max` meets that test. Open's panel still seats it, because the panel needs three DeepSeek seats.
- **Budget code moves from `pv-ds-max` to `pv-ds-high`.** That brings back the hand-written Budget choice. `pv-ds-low` costs about 19% fewer credits at a resolution the run can't tell apart. High keeps a margin for harder tasks: on Frontier v4, Sol low fails 3 tasks that Sol high passes, and the Python suite is too easy to show that gap.
- **DeepSeek is cheap in Droid.** `pv-ds-high` resolved as often as `pv-sol-low` on 54% of its median credits. The filter compares cells of one model, so this doesn't move Sol out of Balanced. Frontier v4 is the hard-task evidence for Sol, and the Python suite has nothing comparable for DeepSeek.
- **Sol low and Sol high tie here.** Balanced keeps Sol high for code, because Frontier v4's three hard-task failures for Sol low are a real gap and the Python suite is too easy to show it. The filter needs strictly more resolved tasks, so the tie doesn't remove Sol high.

Still open: Grok 4.7's unpublished cost, and the Grok Build run VulcanBench has announced. Re-run with `node tools/droid-bench.mjs run --suite <VulcanBench>/tasks/python-1 --python <venv>/bin --cells <cells> --repeats 3`. It resumes from the run log.
