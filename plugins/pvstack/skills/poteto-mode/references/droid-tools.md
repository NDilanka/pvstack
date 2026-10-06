# PV Stack on Droid: tool and model mapping

pstack's skills are written for Cursor. PV Stack keeps them close to upstream and resolves every Cursor-specific term here. When a skill and this file disagree about a tool, parameter, or model, this file wins.

## Models: the role sheet

pstack names a role line ("the `how explorer` line", "the `interrogate reviewers` line") and a Cursor default slug. On Droid:

1. Read `~/.factory/pvstack-models.md`. If it does not exist, use the Balanced sheet at `../../setup-pvstack/modes/balanced.md` (relative to this file) and tell the user once that `/setup-pvstack` picks a mode.
2. Find the role's line. Its value is a `pv-*` droid name, or a comma-separated list for panels.
3. Spawn that droid by passing the name as the Task tool's `subagent_type`. Droid's Task tool has no `model` parameter. Each `pv-*` droid has a fixed model and reasoning effort.
4. Ignore every Cursor default slug in the skills (`claude-opus-5-5-max`, `gpt-5.6-sol-max`, `grok-4.7-xhigh-fast`, and their variants). They are not Droid model IDs. A role that has no line in the sheet uses the Balanced sheet's line.
5. If the value is `inherit`, `inherit-parent`, or `auto`, use the built-in `worker` droid. It runs on the parent model.
6. If the value names a `pv-*` droid that no longer exists (a plugin update retired it), use the line for that role in `../../setup-pvstack/modes/<mode>.md`, where `<mode>` comes from the sheet's `# mode:` line. Tell the user once to re-run `/setup-pvstack`.
7. If Droid rejects a droid for any other reason (blocked by org model policy, for example), use `worker` and tell the user which role fell back.

Panels: one subagent per list entry, with the same prompt for each. The list length sets the panel size. For `arena cross-judge pool`, pick one entry from a different model family than the parent session when you can.

Roles that the skills describe but don't name with a line:

| Skill text | Sheet line |
| --- | --- |
| "trivial mechanical edits go to your fast code model" | `mechanical edits` |
| `recall`: "parallel subagents on a fast, cheap model" | `how explorer` |
| `no-comments`: spawn `comment-sicko` | the `comment-sicko` droid (runs on the parent model) |
| `eval` and other ad-hoc helpers | the code playbook's line, or `mechanical edits` for lookups |

## Task tool parameters

| Cursor | Droid |
| --- | --- |
| `subagent_type: "poteto-agent"` with a model | `subagent_type:` the role's `pv-*` droid. Start the prompt with: "Operate as poteto-agent: load the poteto-mode skill and read its SKILL.md in full before any work." The bundled `poteto-agent` droid is the same instruction on the parent model; use it only when the role resolves to `inherit`. |
| `subagent_type: "generalPurpose"` with a model | `subagent_type:` the role's `pv-*` droid |
| `model: <slug>` | Not a Droid parameter. Resolve through the role sheet above. |
| `readonly: true` | No parameter. Start the prompt with "Read-only task: do not edit files or run commands that change state." The `pv-*` droids honor it. MCP access is not stripped on Droid, so the "readonly strips MCP" warnings don't apply. |
| `run_in_background: true` | Same. Results arrive automatically; don't poll with `TaskOutput` in a loop. |
| `resume` | Same (`resume: <task_id>`). |
| `environment: "cloud"` / `"local"` | No parameter. Subagents run where the parent runs. For isolated parallel work, give each worker its own git worktree and say so in its prompt. |
| `is_background` in agent frontmatter | Not used. |

Subagents on Droid cannot spawn their own subagents or ask the user questions. A playbook step that expects a subagent to fan out must run that fan-out from the parent.

## Other tools and built-ins

| Cursor | Droid |
| --- | --- |
| `AskQuestion` (rewritten to `AskUser` during sync) | `AskUser`. Explain the options in plain words before the call. |
| Cursor Custom Mode (Option+Enter / Alt+Enter, or Use as Mode) | Droid has no Custom Mode. Typing `/poteto-mode` applies it to that request. Start each new task with `/poteto-mode`. |
| "The rule from `/setup-pvstack` applies to new chats" / "start a new chat" after setup | The role sheet is read the next time a skill spawns a subagent. No new chat needed. |
| "Only `/setup-pvstack` loads from the user's words" | No PV Stack skill loads on its own. Type the skill's name, or let `/poteto-mode` run it. |
| `/loop` | The `Loop` tool (load it with ToolSearch `select:Loop`). For an overnight or hourly tick, use `Loop` or a scheduled automation (`CreateAutomation`). |
| Cursor plan mode / `CreatePlan` | Droid spec mode (`ExitSpecMode` presents the plan). |
| `cursor-team-kit` `/deslop` | The built-in `simplify` skill. |
| `cursor-team-kit` `control-ui` | The built-in `agent-browser` skill. |
| `cursor-team-kit` `control-cli` | The built-in `tuistory` skill. |
| Cursor's built-in `create-skill` | Write `SKILL.md` per Droid's skills docs: `name` and `description` frontmatter, under `.factory/skills/<name>/` or `~/.factory/skills/<name>/`. |
| Cursor's built-in `babysit` | Not present. The Babysit playbook applies as written. |
| Bugbot comments | Treat any automated reviewer (Droid code review, Bugbot, others) with the Bugbot triage rules. |
| "Built-in PR tool" | Droid has none. Use `gh` per the playbook's CLI rules (omit `--draft`). |
| `.cursor/rules/*.mdc` always-applied rules | `AGENTS.md` for project rules. The role sheet is read on demand from `~/.factory/pvstack-models.md`. |

## Paths

| Cursor | Droid |
| --- | --- |
| `~/.cursor/skills/`, `.cursor/skills/` (rewritten during sync) | `~/.factory/skills/`, `.factory/skills/` |
| `~/.cursor/plugins/...` | The installed plugin cache. Find a sibling skill by going up from the directory of the `SKILL.md` you loaded to the plugin's `skills/` directory. |
| `~/.cursor/projects/<slug>/agent-transcripts/` | Droid sessions under `~/.factory/sessions/`. Use the built-in `session-navigation` skill to list and search them. The transcript scripts in `poteto-mode/scripts/` and `reflect/` parse Cursor's JSONL format; on Droid, read sessions through `session-navigation` instead. |
| `.cursor/worktrees/` | Any git worktree. Droid's `--worktree` flag and the Factory App create them under the configured worktree directory. |

## Loading sibling skills

Most pstack skills set `disable-model-invocation: true`, so the Skill tool may refuse when a step says "run the **how** skill". In that case, read `skills/<name>/SKILL.md` directly from the same plugin directory as this file (`../../<name>/SKILL.md` from here) and follow it. Leaf `principle-*` skills are read the same way.
