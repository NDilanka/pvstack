# Model evidence

PV Stack picks a model and reasoning effort for every pstack role from the published results of [VulcanBench](https://vulcanbench.com), Morgan Linton's open-source benchmark for real engineering tasks ([methodology](https://vulcanbench.com/methodology.html)). This page records each number it relies on, where the number comes from, and which picks are inferred rather than measured.

Data pulled on 2026-10-04 from:

- Frontier v4 leaderboard and Routine v1 board: https://vulcanbench.com/leaderboard.html (CSV: https://vulcanbench.com/assets/data/swe-v4-board.csv, https://vulcanbench.com/assets/data/routine-v1-board.csv)
- Retired SWE v3 board: https://vulcanbench.com/leaderboard.json
- Droid model IDs, reasoning levels and multipliers: https://docs.factory.com/models.md

## How to read the numbers

- **Frontier v4** has 23 hard behavioral-reconstruction tasks. The combined score is 50% hidden tests, 8.5% lint and complexity, 8.5% security, and 33% code quality judged for a human reader. Cost is API-equivalent at list rates.
- **Routine v1** has 12 everyday tickets on small Python packages. It answers "what is the cheapest effort level that is enough".
- **SWE v3** is retired. It has 23 tasks from merged open-source PRs, ranked by pass@1. It is the only VulcanBench data for Grok, DeepSeek, GLM, Qwen and Kimi. **Its numbers can't be compared with v4.** They are used here only to compare models and effort levels within v3.
- Every run used the vendor's own harness (Claude Code, Codex, and so on), not Droid. VulcanBench measured harness effects of up to about 20 points on a single model (Reports 15, 16 and 18). Treat all picks as strong priors to re-check in Droid, not as guarantees.
- The Droid multiplier is what Droid bills relative to its base rate. It roughly tracks list price but not token use, so both numbers are shown.

## Measured cells (Frontier v4)

| Droid | Model / effort | Score | Passed | $/task | Min/task | Droid multiplier |
| --- | --- | --- | --- | --- | --- | --- |
| `pv-sol-low` | GPT-6.1 Sol / low | 86.22 | 20/23 | $0.31 | 6.9 | 0.8× |
| `pv-sol-high` | GPT-6.1 Sol / high | 88.23 | 23/23 | $0.33 | 10.2 | 0.8× |
| `pv-sol-xhigh` | GPT-6.1 Sol / xhigh | 88.78 | 23/23 | $0.43 | 15.4 | 0.8× |
| `pv-opus-medium` | Claude Opus 5.5 / medium | 90.86 | 23/23 | $2.84 | 18.6 | 1.6× |
| `pv-opus-high` | Claude Opus 5.5 / high | 91.11 | 22/22 | $3.27 | 21.4 | 1.6× |

Routine v1 for the same models: every level passes 12/12. GPT-6.1 Sol wasn't on Routine v1 when this was written. Opus 5.5 low scores 94.22 at $0.072, and medium scores 95.30 at $0.11.

## Inferred cells

| Droid | Model / effort | Evidence | Why it is inferred |
| --- | --- | --- | --- |
| `pv-grok-medium` | Grok 4.7 / medium | v3: Grok 4.6 medium 87.0% at $0.69. Its default, high, dropped to 73.9% and xhigh reached 78.3% (Report 14). Grok 4.5 was best at high, 89.9% at $0.47. | VulcanBench has no Grok 4.7 data. Medium follows Grok 4.6, the nearest predecessor with the same effort ladder. Upstream pstack's pick is `grok-4.7-xhigh-fast`. |
| `pv-ds-low` | DeepSeek V4.1 Flash / low | v3: V4-Flash low 86% at $0.04, 8.4 min | VulcanBench measured V4-Flash, not V4.1 Flash. Droid lists V4.1 Flash at 0.12× and marks V4 Flash 0731 deprecated. |
| `pv-ds-high` | DeepSeek V4.1 Flash / high | v3: V4-Flash high 87.0% at $0.08, 12.0 min | Same as above. |
| `pv-ds-max` | DeepSeek V4.1 Flash / max | v3: V4-Flash max 88.4% at $0.06, 11.2 min. This was the third-best cell on the whole v3 board, and it scored higher and cost less than high. | Same as above. |

## Role reasoning

### Code work: GPT-6.1 Sol @ high (Balanced)
- Sol @ high passes all 23 tasks, at 97% of Opus 5.5's best combined score (88.23 vs 91.11), for about 1/10 of the cost ($0.33 vs $3.27).
- Sol @ high also costs less than Sol @ medium ($0.33 vs $0.40) while scoring higher, so medium is never the better choice.
- xhigh adds 0.55 points for 30% more cost and 50% more time. That trade is worth it for panels and reflect tooling, where one strong answer matters, but not for every code delegate.
- Upstream pstack uses Grok 4.7 for code. VulcanBench has no Grok 4.7 data. On v3, Grok 4.6 at its default effort trailed Sol.

### Judgment and prose: Claude Opus 5.5 @ medium
- Opus @ medium passes 23/23 at 90.86. High gains 0.25 points for 15% more cost. xhigh and max score lower than medium and cost more ($4.11 and $8.75).
- Code quality, the part of the score judged for a human reader, is 77.3 for Opus @ medium vs 73.7 for Sol @ high. Prose and judgment roles are where readability matters most.
- Fable 5.1 @ max is the top cell (91.84, code quality 82.4), but it costs $9.06 per task, has a 4× Droid multiplier, and requires Anthropic's 30-day retention opt-in. It isn't the default. Add it as a personal override through `/setup-pvstack` if you want it.

### Hardest tasks: Opus 5.5 @ high (Balanced), @ medium (Budget)
- High is Opus's best cell. Balanced pays the extra 15% for the changes where a miss costs the most. Budget keeps medium, as you asked.

### Search and mechanical work: Sol @ low (Balanced), DeepSeek V4.1 Flash @ low (Budget)
- Exploration only reads code and reports what it finds, so the speed of the lowest effort level matters most. Sol @ low is the fastest Sol cell (6.9 min) and the cheapest ($0.31).
- Routine v1 shows that the lowest effort level is enough for every measured model on ordinary tickets.

### Review panels: Opus 5.5, GPT-6.1 Sol, Grok 4.7
- Panels get their signal from model diversity: findings that independent models agree on carry more weight. This uses three labs: Anthropic, OpenAI and xAI.
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

VulcanBench's harness is open source (https://github.com/morganlinton/VulcanBench). The inferred cells and the harness gap are the open questions. A useful next step is to run the Routine v1 public subset, or a small Frontier slice, through `droid exec` for each `pv-*` droid and update this page.
