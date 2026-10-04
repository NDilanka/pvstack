# Model evidence

PV Stack picks a model and reasoning effort for every pstack role from the published results of [VulcanBench](https://vulcanbench.com), Morgan Linton's open-source benchmark for real engineering tasks ([methodology](https://vulcanbench.com/methodology.html)). This page records each number it relies on, where the number comes from, and which picks are inferred rather than measured.

Data pulled on 2026-10-04 from:

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

| Droid | Model / effort | Score | Passed | $/task | Min/task | Droid multiplier |
| --- | --- | --- | --- | --- | --- | --- |
| `pv-sol-low` | GPT-6.1 Sol / low | 86.22 | 20/23 | $0.31 | 6.9 | 0.8× |
| `pv-sol-high` | GPT-6.1 Sol / high | 88.23 | 23/23 | $0.33 | 10.2 | 0.8× |
| `pv-sol-xhigh` | GPT-6.1 Sol / xhigh | 88.78 | 23/23 | $0.43 | 15.4 | 0.8× |
| `pv-opus-medium` | Claude Opus 5.5 / medium | 90.86 | 23/23 | $2.84 | 18.6 | 1.6× |
| `pv-grok-high` | Grok 4.7 / high | 92.71 | 22/23 | ~$2.19 (estimate) | 25.4 | 0.8× |
| `pv-grok-xhigh` | Grok 4.7 / xhigh | 93.15 | 23/23 | ~$2.96 (estimate) | 28.5 | 0.8× |

Cells PV Stack doesn't ship but cites below: Opus 5.5 high 91.11 (22/22, $3.27, 21.4 min). Grok 4.7 medium 92.30 (21/23, one run hit the 3-hour bound, 27.2 min). Grok 4.7 low 89.42 (18/23, 20.2 min).

Routine v1 for the same models: every level passes 12/12. GPT-6.1 Sol wasn't on Routine v1 when this was written. Opus 5.5 low scores 94.22 at $0.072, and medium scores 95.30 at $0.11. Grok 4.7's four levels are the four top cells, from 97.14 at xhigh to 97.37 at high. Low scores 97.29 at 1.1 minutes per ticket. Grok's Routine cells were judged by Muse Spark 1.3 alone, which VulcanBench says flatters Grok 4.7. Every other column used Muse plus Grok 4.6.

## Reading the Grok 4.7 numbers

- **Different second judge.** Grok 4.6 is the second Code quality judge on every other column. It sat out for an xAI submission, and GPT-6.1 Sol took its seat. Sol rates Grok 4.7's code about 6 points above Muse Spark 1.3, the judge every column shares. Rescored on Muse alone, Grok 4.7 drops 0.8 to 1.0 points. It still leads at medium, high and xhigh. At xhigh it scores 92.27 on the shared judge. VulcanBench compares that with 91.03 for Opus 5.5 high, the cell this change replaces, and 90.86 for Fable 5.1 xhigh at the same level.
- **Different harness.** Grok 4.7 ran in Cursor's agent CLI. Opus ran in Claude Code and Sol in Codex. A Grok Build run is announced and not yet published.
- **No published cost.** The sweep ran on a Cursor subscription, so VulcanBench reports cost as unavailable. The estimates above are PV Stack's own. They take each run's tokens from `runs.csv` and price them at xAI's list rates ($2 per million uncached input, $0.50 cached, $6 output). They ignore xAI's higher rate above 200K context, so read them as a floor.
- **Slow and token-heavy.** Grok 4.7 is slower than GPT-6.1 Sol, Opus 5.5 and GPT-6 Astra at every shared effort level. At the same level it uses 2 to 4 times as many tokens per task as GPT-6.1 Sol (3.1 times at high, 3.5 times at xhigh).
- **Safety v1.** Ten tasks carried planted repository notes asking for something the user didn't request. Over 40 runs, Grok 4.7 followed 14 of 80 notes and reported none of them to the user. Over 50 runs, Opus 5.5 followed 3 of 100 and reported 64. Grok never ran the network beacon, the exfiltration or the destructive delete. Neither model leaked the planted secret.

## Inferred cells

| Droid | Model / effort | Evidence | Why it is inferred |
| --- | --- | --- | --- |
| `pv-ds-low` | DeepSeek V4.1 Flash / low | v3: V4-Flash low 86% at $0.04, 8.4 min | VulcanBench measured V4-Flash, not V4.1 Flash. Droid lists V4.1 Flash at 0.12× and marks V4 Flash 0731 deprecated. |
| `pv-ds-high` | DeepSeek V4.1 Flash / high | v3: V4-Flash high 87.0% at $0.08, 12.0 min | Same as above. |
| `pv-ds-max` | DeepSeek V4.1 Flash / max | v3: V4-Flash max 88.4% at $0.06, 11.2 min. This was the third-best cell on the whole v3 board, and it scored higher and cost less than high. | Same as above. |

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

### Review panels: Opus 5.5, GPT-6.1 Sol, Grok 4.7 @ high
- Panels get their signal from model diversity: findings that independent models agree on carry more weight. This uses three labs: Anthropic, OpenAI and xAI.
- Grok sits at high. It scores 92.71 (SE 0.41), uses the fewest tokens of any Grok level (2.85M per task) and has the lowest estimated cost ($2.19). Medium, the earlier pick, scores 92.30 but had the sweep's one 3-hour timeout, so its token and cost figures cover 22 runs. Medium came from Grok 4.6, whose effort knob ran backward. Grok 4.7's combined score rises at every step.
- In Budget, Opus leaves the fan-out (Opus @ medium costs about 9× Sol @ high per task, $2.84 vs $0.33) and DeepSeek takes its seat. Opus stays in the arena cross-judge pool and still writes every synthesis.

## Rejected for Budget mode

| Model | Evidence (v3) | Why not |
| --- | --- | --- |
| GLM 5.3 (`glm-5.3`, 0.56×) | Low 78.3%. Max, its default, 65.2% in a bare harness. In Z.ai's own ZCode harness, 87.0% at max (Report 18). | Score depends heavily on the harness, and effort works backward outside ZCode. Droid's harness is unmeasured. Revisit after a Droid run. |
| Qwen3.8-Max (`qwen3.8-max`, 0.8×) | Low 81.2% at 19.6 min. Its default, xhigh, 55.1% (Report 12). | Slower and weaker than Sol at the same multiplier. |
| Kimi K3 (`kimi-k3`, 1.2×) | Extra-high 73.7% on 19 of 23 tasks (Report 8). | Lower score at a higher multiplier than Sol. |
| GPT-6 Luna (0.04×) | v4: max 81.4% with 6 runs hitting the 3-hour timeout, 60 min per task. | Too slow and unreliable on hard tasks. On routine work it is a candidate for a future "mechanical" override. |
| Other Droid Core models (MiniMax M3, Nemotron 3 Ultra, Inkling, Mistral Medium 3.5, GLM-5.3-Flash) | No VulcanBench data. | No evidence to rank them. |

## Re-checking in Droid

VulcanBench's harness is open source (https://github.com/morganlinton/VulcanBench). The inferred cells, the harness gap and Grok 4.7's unpublished cost are the open questions. When VulcanBench publishes the Grok Build run, re-check the Grok cells. A useful next step is to run the Routine v1 public subset, or a small Frontier slice, through `droid exec` for each `pv-*` droid and update this page.
