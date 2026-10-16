# pvstack on Droid: tool and model mapping

pstack's skills are written for Cursor. This file resolves every Cursor-specific term for Droid. When a skill and this file disagree about a tool, parameter, model, or the token budget below, this file wins. Read it once per session. Delegates don't read it; they load `poteto-delegate`.

## Models: the role sheet

Skills name a role line ("the `how explorer` line") and a Cursor default slug. On Droid:

1. Read `~/.factory/pvstack-models.md`. If it is missing, use `../../setup-pvstack/modes/balanced.md` (relative to this file) and tell the user once that `/setup-pvstack` picks a mode.
2. The role's line names a `pv-*` droid, or a comma-separated list for panels. Pass it as the Task tool's `subagent_type`. Droid's Task tool has no `model` parameter; each `pv-*` droid has a fixed model and effort.
3. Ignore the Cursor slugs in the skills (`claude-opus-5-5-max`, `gpt-5.6-sol-max`, `grok-4.7-xhigh-fast`, and variants). A role with no line uses the Balanced line.
4. `inherit`, `inherit-parent`, or `auto` means the built-in `worker` droid on the parent model.
5. A `pv-*` droid that no longer exists was retired by a plugin update. Use that role's line in `../../setup-pvstack/modes/<mode>.md`, with `<mode>` from the sheet's `# mode:` line, or from its `# extends:` line when the mode is `custom:<name>`. Tell the user once to re-run `/setup-pvstack`.
6. If Droid rejects a droid for another reason (org model policy, for example), use `worker` and tell the user which role fell back.

Panels get one subagent per list entry, same prompt for each. For `arena cross-judge pool`, pick an entry from a different model family than the parent when you can.

Roles the skills describe without a line:

| Skill text | Sheet line |
| --- | --- |
| "trivial mechanical edits go to your fast code model" | `mechanical edits` |
| `recall`: "parallel subagents on a fast, cheap model" | `how explorer` |
| `no-comments`: spawn `comment-sicko` | the `comment-sicko` droid (parent model) |
| `eval` and other ad-hoc helpers | the code playbook's line, or `mechanical edits` for lookups |

## Task tool parameters

| Cursor | Droid |
| --- | --- |
| `subagent_type: "poteto-agent"` with a model | `subagent_type:` the role's `pv-*` droid. For a delegate that writes code or makes a judgment call, start the prompt with "Operate as poteto-agent: load the poteto-delegate skill before any work." A lookup, fact check, or smoke run gets a plain prompt with no prefix. Use the bundled `poteto-agent` droid only when the role resolves to `inherit`. |
| `subagent_type: "generalPurpose"` with a model | `subagent_type:` the role's `pv-*` droid |
| `model: <slug>` | Not a parameter. Resolve through the role sheet. |
| `readonly: true` | Start the prompt with "Read-only task: do not edit files or run commands that change state." MCP is not stripped on Droid, so "readonly strips MCP" warnings don't apply. |
| `run_in_background: true` | Same. Results arrive automatically; don't poll `TaskOutput` in a loop. |
| `resume` | Same (`resume: <task_id>`). |
| `environment: "cloud"` / `"local"` | No parameter. Subagents run where the parent runs. For isolated parallel work, give each worker its own git worktree and say so in its prompt. |
| `is_background` in agent frontmatter | Not used. |

Subagents on Droid cannot spawn subagents or ask the user questions. A step that expects a subagent to fan out runs that fan-out from the parent.

## Token budget

Each rule below cut a measured cost in a real pvstack mission. The numbers are in the pvstack repository's `docs/token-budget.md`.

- **Delegates load `poteto-delegate`, not `poteto-mode`.** It is about a third of the size of `poteto-mode/SKILL.md` plus this file.
- **Point, don't paste, and point at the section.** Give a delegate the path plus a line range, heading, or Grep pattern. A shared note over about 20 KB gets a short index at its top, and readers read the section they need.
- **Keep tool output small.** Filter with `rg`, `Select-Object -First`, or `head`, or write the output to a file and read the part you need. Raw multi-thousand-line output stays in the context for every later turn.
- **Rerun only what failed.** After a failed gate, the next round re-checks the failing assertions and reuses passing evidence unchanged.
- **Script a setup the second time you run it.** A per-round harness rebuilt by hand cost hundreds of times the run it set up. Parameterize it once (the **build-the-lever** principle skill) and have later rounds call it.
- **Inside a Droid Mission, the mission's validators are the review system.** Workers skip `arena`, `swarm`, `interrogate`, review panels, and second-opinion delegates, and own their diff directly. This replaces the Feature playbook's mandatory arena. A worker still runs `how` when the subsystem is new to it.

## Other tools and built-ins

| Cursor | Droid |
| --- | --- |
| `AskQuestion` (rewritten to `AskUser` in sync) | `AskUser`. Explain the options in plain words before the call. |
| Cursor Custom Mode | None. Typing `/poteto-mode` applies it to that request; start each new task with it. |
| "The `/setup-pvstack` rule applies to new chats" | The sheet is read the next time a skill spawns a subagent. No new chat needed. |
| "Only `/setup-pvstack` loads from the user's words" | No pvstack skill loads on its own except `poteto-delegate`. Type the skill's name, or let `/poteto-mode` run it. |
| `/loop` | The `Loop` tool (ToolSearch `select:Loop`), or a scheduled automation (`CreateAutomation`). |
| Cursor plan mode / `CreatePlan` | Spec mode (`ExitSpecMode` presents the plan). |
| `cursor-team-kit` `/deslop` | The built-in `simplify` skill. |
| `cursor-team-kit` `control-ui` / `control-cli` | The built-in `agent-browser` / `tuistory` skill. |
| Cursor's built-in `create-skill` | Write `SKILL.md` per Droid's skills docs: `name` and `description` frontmatter, under `.factory/skills/<name>/` or `~/.factory/skills/<name>/`. |
| Cursor's built-in `babysit` | Not present. The Babysit playbook applies as written. |
| Bugbot comments | Any automated reviewer (Droid code review, Bugbot, others) gets the Bugbot triage rules. |
| "Built-in PR tool" | None. Use `gh` per the playbook's CLI rules (omit `--draft`). |
| `.cursor/rules/*.mdc` always-applied rules | `AGENTS.md` for project rules. The role sheet is read on demand. |

## Paths

| Cursor | Droid |
| --- | --- |
| `~/.cursor/skills/`, `.cursor/skills/` (rewritten in sync) | `~/.factory/skills/`, `.factory/skills/` |
| `~/.cursor/plugins/...` | The installed plugin cache. Find a sibling skill by going up from the loaded `SKILL.md` to the plugin's `skills/` directory. |
| `~/.cursor/projects/<slug>/agent-transcripts/` | Sessions under `~/.factory/sessions/`; use the built-in `session-navigation` skill. The transcript scripts in `poteto-mode/scripts/` and `reflect/` parse Cursor's JSONL, so read Droid sessions through `session-navigation` instead. |
| `.cursor/worktrees/` | Any git worktree. Droid's `--worktree` flag and the Factory App create them under the configured worktree directory. |

## Loading sibling skills

Most pstack skills set `disable-model-invocation: true`, so the Skill tool may refuse "run the **how** skill". Then read `../../<name>/SKILL.md` from this file and follow it. Leaf `principle-*` skills are read the same way.
