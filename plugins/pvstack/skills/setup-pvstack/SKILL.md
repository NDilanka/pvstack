---
name: setup-pvstack
description: Choose PV Stack's mode (Balanced or Budget) and per-role droids, then write the role sheet every pstack skill reads. Use for /setup-pvstack, "configure pvstack models", "pvstack budget mode", or changing which model a pstack role uses.
disable-model-invocation: true
---

# Setup PV Stack

Write `~/.factory/pvstack-models.md`. This is the role sheet that `poteto-mode` and the routed skills read to choose a `pv-*` droid for each role. See `../poteto-mode/references/droid-tools.md` for how the sheet is read.

## Steps

### 1. Load current state

If `~/.factory/pvstack-models.md` exists, read it. Its `# mode:` line is the current mode. Its `# overrides:` line lists the roles the user chose. Every other line that differs from that mode's sheet in `modes/` is a stale default from an older plugin version: replace it with the sheet's value and tell the user which roles changed. A role label that is in neither `modes/balanced.md` nor `modes/budget.md` is retired: drop it and tell the user. An override whose droid exists in none of the plugin's `droids/`, `~/.factory/droids/` or `.factory/droids/` is also retired: replace it with the sheet's value and tell the user.

### 2. Pick a mode

Explain both modes in plain words, then ask with `AskUser`. Name the current mode if there is one.

- **Balanced** (default). GPT-6.1 Sol handles code work. Claude Opus 5.5 handles judgment and prose. Grok 4.7 at extra-high effort takes the hardest changes. Review panels use Opus, Sol and Grok 4.7.
- **Budget**. DeepSeek V4.1 Flash, an open model, handles code, search and mechanical work. Opus 5.5 at medium effort keeps judgment and prose. GPT-6.1 Sol handles reflect tooling. Opus is dropped from the fan-out panels but still writes the synthesis.

Start the working table from `modes/<mode>.md`. On a re-run with the same mode, keep the user's overrides. When the mode changes, ask whether to keep or drop each override.

### 3. Offer per-role overrides

Show every role and its droid. Ask whether to accept the table or change specific roles. The choices for a role are the `pv-*` droids in the plugin's `droids/` directory, plus `inherit` (the role runs on the parent session's model through the built-in `worker` droid). Panel roles (`arena runners`, `arena cross-judge pool`, `architect runners`, `interrogate reviewers`) take a list, and the list length sets the panel size.

If the user wants a model or effort that no `pv-*` droid covers, create a personal droid in `~/.factory/droids/` with the same frontmatter shape as the `pv-*` droids (`name`, `description`, `model`, `reasoningEffort`) and a model ID from Droid's model list. Use that droid's name in the sheet.

### 4. Validate

- Every value must be `inherit` or the name of a droid that exists: a `pv-*` droid in this plugin, or a droid in `~/.factory/droids/` or `.factory/droids/`.
- If org model policy might block a model, warn the user. A blocked droid falls back to the parent model rather than failing.
- If any value is invalid, stop and ask again.

### 5. Write the sheet

Overwrite `~/.factory/pvstack-models.md` completely so that re-runs give the same result. Copy the header comments and the `# mode:` line from `modes/<mode>.md`. Then write one line per role in that file's order, applying the user's overrides. If you made any overrides, add `# overrides: <role>, <role>` under the mode line.

### 6. Recommend matching subagent routing

Droid's built-in `worker` and `explorer` droids follow the **Subagents** settings in `/settings` (the Light, Medium and Heavy task models). Suggest values that match the mode, but don't change settings yourself:

| Tier | Balanced | Budget |
| --- | --- | --- |
| Light | `gpt-6.1-sol` low | `deepseek-v4.1-flash` low |
| Medium | `gpt-6.1-sol` high | `deepseek-v4.1-flash` high |
| Heavy | `claude-opus-5-5` medium | `claude-opus-5-5` medium |

### 7. Confirm

Tell the user the sheet was written and that skills read it the next time they spawn a subagent, with no restart needed. Re-running this skill updates the sheet.

### 8. Offer a verification skill (optional)

Check whether the project already has a way to drive the real app for proof: a `verify-*` skill, or an existing harness. If it doesn't, offer once: "Want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." If the user says yes, invoke `create-verification-skill`. If no, move on.
