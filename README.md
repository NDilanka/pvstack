# PV Stack

PV Stack is [Lauren Tan's pstack](https://github.com/cursor/plugins/tree/main/pstack) for [Droid](https://docs.factory.ai), with every role's model chosen from [VulcanBench](https://vulcanbench.com) data instead of one lab's defaults.

pstack is a set of rigorous engineering workflows. You start a task with `/poteto-mode`. It picks a playbook (bug fix, feature, investigation, perf, babysit, and others) and calls `how`, `why`, `architect`, `interrogate`, `arena` and the principle skills as each step needs them. PV Stack keeps those skills close to upstream and changes two things:

1. **It runs on Droid.** One mapping file translates Cursor's tools and Task parameters to Droid's.
2. **It routes each role to the model that VulcanBench shows is the best value for that kind of work.** You can choose from two modes.

## Modes

| Role | Balanced (default) | Budget |
| --- | --- | --- |
| Code delegates (feature, refactor, bug fix, perf, hillclimb) | GPT-6.1 Sol, high | DeepSeek V4.1 Flash, max |
| Swarm workers | GPT-6.1 Sol, high | DeepSeek V4.1 Flash, high |
| Exploration, investigators, mechanical edits | GPT-6.1 Sol, low | DeepSeek V4.1 Flash, low |
| Judgment, prose, explainers, synthesizers | Claude Opus 5.5, medium | Claude Opus 5.5, medium |
| Hardest changes | Claude Opus 5.5, high | Claude Opus 5.5, medium |
| Reflect tooling | GPT-6.1 Sol, xhigh | GPT-6.1 Sol, high |
| Review panels (arena, architect, interrogate) | Opus 5.5 · Sol xhigh · Grok 4.7 | Sol high · DeepSeek max · Grok 4.7 |

The reasons and numbers behind each choice are in [docs/model-evidence.md](docs/model-evidence.md). In short:

- GPT-6.1 Sol at high effort passes every Frontier v4 task at 97% of Opus 5.5's best score, for about 1/10 of the cost.
- Opus 5.5 at medium effort is within 0.25 points of its best, and it scores higher than its own xhigh and max levels.
- DeepSeek V4-Flash was one of the strongest and cheapest cells on VulcanBench's v3 board.

## Install

```bash
droid plugin marketplace add NDilanka/pvstack
droid plugin install pvstack@pvstack --scope user
```

Then, in a Droid session:

```text
/setup-pvstack
/poteto-mode this pr has a subtle bug where the scroll drifts every 750ms even when idle. repro first, then fix and verify.
```

`/setup-pvstack` writes `~/.factory/pvstack-models.md`. Without it, PV Stack uses Balanced.

To pick up new commits, run `droid plugin update pvstack@pvstack --scope user`. Droid runs the installed copy from its plugin cache, not from a local clone.

In headless `droid exec`, the Task tool is blocked below `--auto high`, so playbooks that delegate do their work in the parent instead. Interactive sessions spawn subagents at any autonomy level.

## How routing works

Droid's Task tool has no per-call model parameter, so each model and effort pair is a droid: `pv-sol-high`, `pv-opus-medium`, `pv-ds-max`, and so on. These map directly to the VulcanBench columns. The role sheet maps each pstack role to one of those droids. To change a role, edit the sheet or re-run `/setup-pvstack`. To use a model that no `pv-*` droid covers, add a personal droid and point the role at it.

```mermaid
flowchart LR
  PM[poteto-mode] -->|reads| SHEET[pvstack-models.md]
  SHEET -->|role to droid| DR[pv-* droids]
  DR -->|fixed model + effort| M[Sol / Opus / Grok / DeepSeek]
```

## Staying current with upstream

PV Stack follows `cursor/plugins/pstack` directly. The pinned commit is in [UPSTREAM.md](UPSTREAM.md).

```bash
node tools/sync-upstream.mjs --ref main   # pull Lauren's latest, re-pin
npm run check                             # sync drift, droids, sheets, links
```

A weekly GitHub Action does this for you. When upstream pstack changes, it pushes the sync to the `upstream-sync` branch and opens a pull request with the diff summary and the `npm run check` result. Later upstream changes refresh the same pull request, unless you have pushed your own fixes to the branch; then it only comments. If `main` catches up another way, it closes the pull request. Run it on demand from the Actions tab (workflow `upstream sync`). It needs the repository setting "Allow GitHub Actions to create and approve pull requests".

The sync rewrites only the files it copied from upstream, which are listed in `plugins/pvstack/.upstream-files.json`. The PV Stack layer is never overwritten:

- `plugins/pvstack/droids/pv-*.md`, generated from `tools/droids.mjs`
- `plugins/pvstack/skills/setup-pvstack/`
- `plugins/pvstack/skills/poteto-mode/references/droid-tools.md`

## Layout

```text
.factory-plugin/marketplace.json
plugins/pvstack/
  .factory-plugin/plugin.json
  skills/        upstream skills + setup-pvstack + droid-tools.md
  droids/        poteto-agent, comment-sicko (upstream) + pv-* (PV Stack)
  docs/upstream/ upstream's pstack guide
docs/model-evidence.md
tools/           sync-upstream.mjs, droids.mjs, validate.mjs
.github/workflows/ check.yml (npm run check), upstream-sync.yml (weekly)
```

## Credits

PV Stack is built on the work of two people. Neither of them is affiliated with this project.

### pstack, by Lauren Tan

Every workflow in PV Stack comes from Lauren Tan's pstack: `poteto-mode`, its playbooks, `how`, `why`, `architect`, `arena`, `interrogate`, and the principle skills. Lauren works at Cursor, previously worked at Meta and Netflix, and is on the React core team, where she helps build React Compiler.

- pstack source: https://github.com/cursor/plugins/tree/main/pstack
- The pstack guide: https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md
- The Complete Guide to pstack: https://x.com/poteto/article/2094457600259842065
- GitHub: [@poteto](https://github.com/poteto) · X: [@poteto](https://x.com/poteto)

pstack is MIT-licensed, © 2026 Lauren Tan. Her license is in [`plugins/pvstack/LICENSE-pstack`](plugins/pvstack/LICENSE-pstack), and [NOTICE.md](NOTICE.md) lists which files come from pstack and what PV Stack changes in them.

### VulcanBench, by Morgan Linton

Every model and effort choice in PV Stack comes from VulcanBench, an open-source benchmark for real engineering tasks. It reports token use, time and cost alongside scores. Morgan Linton, cofounder and CTO of Bold Metrics, built it and runs it. PV Stack cites VulcanBench's published numbers in [docs/model-evidence.md](docs/model-evidence.md) and doesn't redistribute its data.

- VulcanBench: https://vulcanbench.com
- Leaderboard: https://vulcanbench.com/leaderboard.html
- Methodology: https://vulcanbench.com/methodology.html
- Open-source harness: https://github.com/morganlinton/VulcanBench
- Morgan Linton: https://www.morganlinton.com · GitHub: [@morganlinton](https://github.com/morganlinton)

VulcanBench is free and runs on sponsorships. If PV Stack's routing saves you money, consider [sponsoring VulcanBench on GitHub](https://github.com/sponsors/morganlinton).
