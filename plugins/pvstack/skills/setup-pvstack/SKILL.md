---
name: setup-pvstack
description: Choose pvstack's mode (Balanced, Budget, Quality, Fast, Safe, Open or a custom preset) and per-role droids, then write the role sheet every pstack skill reads. Use for /setup-pvstack, "configure pvstack models", "pvstack budget mode", "custom pvstack preset", or changing which model a pstack role uses.
disable-model-invocation: true
---

# Setup pvstack

Write `~/.factory/pvstack-models.md`. This is the role sheet that `poteto-mode` and the routed skills read to choose a `pv-*` droid for each role. See `../poteto-mode/references/droid-tools.md` for how the sheet is read.

## Steps

### 1. Load current state

If `~/.factory/pvstack-models.md` exists, read it. Its `# mode:` line is the current mode, or `custom:<name>` for a custom preset. Its `# overrides:` line lists the roles the user chose.

When the mode is `custom:<name>`, re-resolve the preset with `node scripts/resolve.mjs <name>` from this skill's directory: the file or the VulcanBench data may have changed. Re-apply the roles named on the `# overrides:` line and tell the user which role lines differ. If no preset file named `<name>` is found, fall back to the `# extends:` base's sheet in `modes/`, tell the user, and continue from there.

Every other line that differs from the resolved sheet is a stale default from an older plugin version: replace it with the sheet's value and tell the user which roles changed. A role label that is in no file in `modes/` is retired: drop it and tell the user. An override whose droid exists in none of the plugin's `droids/`, `~/.factory/droids/` or `.factory/droids/` is also retired: replace it with the sheet's value and tell the user.

### 2. Pick a mode

Explain the modes in plain words, then ask with `AskUser`. Name the current mode if there is one. Each mode is a preset that resolves the VulcanBench data to a droid per role, so the sheet's header comments list any explicit exceptions it needed.

- **Balanced** (default). GPT-6.1 Sol handles code work. Claude Opus 5.5 handles judgment and prose. Grok 4.7 at extra-high effort takes the hardest changes. Review panels use Opus, Sol and Grok 4.7.
- **Budget**. DeepSeek V4.1 Flash, an open model, handles code, search and mechanical work. Opus 5.5 at medium effort keeps judgment and prose. GPT-6.1 Sol handles reflect tooling. Opus is dropped from the fan-out panels but still writes the synthesis.
- **Quality**. Cost and time don't matter. Grok 4.7 at extra-high effort takes every class it can, and Opus 5.5 at high effort takes judgment, because it is the strongest cell that reported the planted notes on Safety v1.
- **Fast**. Minutes matter most. GPT-6.1 Sol at high effort takes most roles, since it is the quickest cell that still passes the tasks. Opus 5.5 at medium effort keeps judgment.
- **Safe**. Grok 4.7 is kept out of code, judgment and the hardest changes, because Safety v1 shows it followed planted notes it never reported. Opus 5.5 at high effort takes the hardest changes. Grok still votes on panels, where other labs can outvote it.
- **Open**. Open-weights models only. DeepSeek V4.1 Flash takes every role, judgment included, at the effort level the role's rule picks.
- **Custom**. A preset file the user has or wants. Run `node scripts/resolve.mjs --list` from this skill's directory and show the custom presets it found, with their summaries. To author one, interview the user on what each class should optimize: code (feature, refactor, bug fix, perf, hillclimb), exploration, judgment and prose, the hardest changes, reflect tooling, and the panels. Write `~/.factory/pvstack-presets/<name>.json`, or `.factory/pvstack-presets/<name>.json` in the project. A custom preset names one built-in base in `extends`, overrides the base per class or per role in `rules`, and may pin a role in `pins`. Every pin needs a `reason`. Then run `node scripts/resolve.mjs --explain <name>`, show the user the rule, the pin and the picked cell for each role, and adjust the file until they accept it. The name must not collide with a built-in.

Start the working table from `modes/<mode>.md`, or from the output of `node scripts/resolve.mjs <name>` for a custom preset. On a re-run with the same mode, keep the user's overrides. When the mode changes, ask whether to keep or drop each override.

### 3. Offer per-role overrides

Show every role and its droid. Ask whether to accept the table or change specific roles. The choices for a role are the `pv-*` droids in the plugin's `droids/` directory, plus `inherit` (the role runs on the parent session's model through the built-in `worker` droid). Panel roles (`arena runners`, `arena cross-judge pool`, `architect runners`, `interrogate reviewers`) take a list, and the list length sets the panel size.

If the user wants a model or effort that no `pv-*` droid covers, create a personal droid in `~/.factory/droids/` with the same frontmatter shape as the `pv-*` droids (`name`, `description`, `model`, `reasoningEffort`) and a model ID from Droid's model list. Use that droid's name in the sheet.

### 4. Validate

- Every value must be `inherit` or the name of a droid that exists: a `pv-*` droid in this plugin, or a droid in `~/.factory/droids/` or `.factory/droids/`.
- A custom preset is validated by `resolve.mjs`. When a rule key, filter, pick or pin is wrong it exits 1 and lists the valid options. Fix the file and run it again before writing the sheet.
- If org model policy might block a model, warn the user. A blocked droid falls back to the parent model rather than failing.
- If any value is invalid, stop and ask again.

### 5. Write the sheet

Overwrite `~/.factory/pvstack-models.md` completely so that re-runs give the same result. For a built-in mode, copy the header comments and the `# mode:` line from `modes/<mode>.md`, then write one line per role in that file's order, applying the user's overrides. For a custom preset, write the output of `node scripts/resolve.mjs <name-or-path>` instead: its header already carries `# mode: custom:<name>`, `# extends:` and one `# pin:` line per pin. If you made any overrides, add `# overrides: <role>, <role>` under the mode line, or under `# extends:` for a custom preset.

### 6. Recommend matching subagent routing

Droid's built-in `worker` and `explorer` droids follow the **Subagents** settings in `/settings` (the Light, Medium and Heavy task models). Suggest values that match the mode, but don't change settings yourself. The table covers Balanced and Budget; for another mode or a custom preset, use the cells its sheet picks for code, exploration and judgment.

| Tier | Balanced | Budget |
| --- | --- | --- |
| Light | `gpt-6.1-sol` low | `deepseek-v4.1-flash` low |
| Medium | `gpt-6.1-sol` high | `deepseek-v4.1-flash` high |
| Heavy | `claude-opus-5-5` medium | `claude-opus-5-5` medium |

### 7. Confirm

Tell the user the sheet was written and that skills read it the next time they spawn a subagent, with no restart needed. Re-running this skill updates the sheet.

### 8. Offer a verification skill (optional)

Check whether the project already has a way to drive the real app for proof: a `verify-*` skill, or an existing harness. If it doesn't, offer once: "Want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." If the user says yes, invoke `create-verification-skill`. If no, move on.
