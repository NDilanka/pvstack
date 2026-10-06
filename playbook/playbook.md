# The PV Stack Playbook

> Ship with agents. Prove every step.

A beginner's guide to pstack, the set of skills Lauren Tan (poteto) uses to ship thousands of PRs a month, and to PV Stack, which runs pstack on Droid. The habits work with any agent that can load skills.

## For AI agents

You are an AI agent helping a person use pstack. Read all of `playbook.md` before you answer.

Ask one question first. Does the person already have code that runs? Yes means the brownfield line. No means the greenfield line.

Ask which agent tool the person uses. Find its section under the "Install on your tool" heading, and use its install steps and its "Run a skill", "Parallel work", and "Scheduled runs" lines. If the tool is not listed, use the "Any agent that can load SKILL.md folders" section.

Adapt every prompt to that tool. For example, on Codex a skill is called with `$`, so `/poteto-mode` becomes `$poteto-mode`.

Go one step at a time, in the order the steps appear under the "Greenfield line" or "Brownfield line" heading. Each step heading starts with the step's id, for example `bf-map`. Name each step by that id.

When a step's text sends the person to another step, follow it. Skip a step only when its own text says it doesn't apply to this work, and tell the person which step you skipped and why.

Copy a prompt from the step's "Prompt" blocks for the person. Replace every \<placeholder> with their real app, feature, bug, or file before they send it.

Before you move to the next step, go through that step's "Done when" list. Check each item yourself when you can. Otherwise ask the person to confirm it.

On the greenfield line, do not start `gf-verify` until the app starts from one command. The verification generator needs an app it can launch.

When the person is stuck, check the step's "Watch out" list, then the "Pitfalls" section. Offer a matching entry from the "Recipes" section. If none fits, or the person asks which skill fits a situation, suggest they type `/poteto-help` with their question. It answers and hands back a prompt without starting the work.

Never tell the person that a step worked without proof, such as command output, an HTTP response, a screenshot, a video, or a measured number.

Explain a term from the "Glossary" section the first time you use it. Keep your sentences short and plain.

When you give advice, cite the step id or chapter id and its source, for example `gf-plan` and `playbooks/multi-phase-plan.md`.

## pstack in 60 seconds

*The idea*

pstack is a set of skills for AI coding agents. A skill is a folder of instructions that the agent reads when you call it by name, or when another skill runs it. Lauren Tan, known as poteto, wrote pstack and uses it to ship thousands of pull requests a month. PV Stack is the same skills packaged for Droid, with a model chosen for each kind of work.

The core idea is verification. The agent checks its own work in the real app, the way a person would. Then it can keep going until the task is done, and you stop being the bottleneck. poteto treats a good verification skill as critical infrastructure, not as one more skill.

Every task follows one loop. You say the goal. The agent makes a small change. It drives the real app to check the change. It hands you proof, such as a video, a screenshot, command output, or a number.

The one habit to learn is to say what you want and how to check it. You don't list steps or skills. `/poteto-mode` picks the workflow for you.

Go deeper:

`/poteto-mode` is the front door. It matches your request to one of 23 playbooks, copies that playbook's steps into a todo list, and calls other skills such as `how`, `why`, `architect`, and `interrogate` as the steps need them. A skipped step stays in the list with `skip: <reason>`, so you can see what the agent chose not to do.

Playbooks are not skills. They are reference files inside `poteto-mode`, and the agent loads only the one that matches, to save context. The Bug fix playbook demands a reproduction first. The Refactoring playbook pins current behavior first. The Perf issue playbook captures a baseline first. Your prompt doesn't have to say any of that.

Part 1 argues that the harder your stack is to debug and control, the harder it is to use agents well. poteto suggests building rich debugging tools, or even choosing a different tech stack, so agents can verify their own work.

Prompt: A first prompt with a goal and a check

```text
/poteto-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify.
```

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [guide/README.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/README.md)
- [skills/poteto-mode](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md)

## The core loop

1. **Goal.** You say what done looks like and how to check it.
2. **Change.** The agent makes the smallest change that moves toward the goal.
3. **Verify.** The agent drives the real app, the way a user would, to check its own work.
4. **Proof.** You get a video, screenshots, command output, HTTP responses, or numbers, whichever fits your app. Then the loop repeats.

## Install pstack and run your first task

*Install*

Install the skills for your agent tool. The platform table lists the steps for Droid, Claude Code, Cursor, Codex, and other tools. On Droid, PV Stack installs with two commands.

To check that the install worked, start a new session. Type `/poteto-mode`, or `$poteto-mode` on Codex, and see the skill load. You can also ask the agent to list its skills and look for `poteto-mode` in the list.

On Droid, run `/setup-pvstack` next. It asks you to pick a mode (Balanced, Budget, Quality, Fast, Safe or Open) and writes a small file called the role sheet. The role sheet tells each skill which model to use for each job. On Cursor, the upstream version of this skill is `/setup-pstack`.

Then start every real task with `/poteto-mode`. You don't pick a playbook. It reads your request and picks one. Typing it applies the skill to that request. It may fade as the chat moves on, so type it again when you start the next task. On Cursor, a Custom Mode keeps it on every turn. The Cursor section under "Install on your tool" shows how.

When you're stuck, or can't tell which skill fits, type `/poteto-help` with your question. It answers, hands you a prompt to send, and links the file the answer came from. It doesn't start the work, so nothing runs until you send that prompt.

Go deeper:

The role sheet lives at `~/.factory/pvstack-models.md`. Without it, PV Stack uses the Balanced sheet. Skills read the sheet the next time they spawn a subagent, so you don't need to restart. At the end, `/setup-pvstack` checks whether the project can already prove app behavior. If it can't, it offers once to run `/create-verification-skill`.

pstack's skills are written for Cursor. They name Cursor tools such as `/loop`, cloud agents, and the `control-ui` and `control-cli` skills from Cursor's `cursor-team-kit` plugin. PV Stack maps each of these to a Droid tool in `skills/poteto-mode/references/droid-tools.md`. On another tool, give your agent that file as an example and ask it to map the same names to your tool.

Your first task should be real and small. The guide suggests a prompt like the second one below. Watch the todo list. Its first items are the Feature playbook's steps.

In headless `droid exec`, the Task tool is blocked below `--auto high`, so playbooks that delegate do their work in the parent. Interactive sessions can spawn subagents at any autonomy level. To update PV Stack, run `droid plugin update pvstack@pvstack --scope user`.

Prompt: Pick a mode and write the role sheet (Droid)

```text
/setup-pvstack
```

Prompt: Run a small first task

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Prompt: Ask which skill fits

```text
/poteto-help which skill should i use to review this branch?
```

Sources:

- [guide/01-setup.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/01-setup.md)
- [skills/setup-pvstack](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/setup-pvstack/SKILL.md)
- [skills/poteto-mode](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md)
- [skills/poteto-help](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-help/SKILL.md)

## Install on your tool

### Droid

Install:

```text
droid plugin marketplace add NDilanka/pvstack
droid plugin install pvstack@pvstack --scope user
```

- Run a skill: Type the skill as a slash command, for example `/poteto-mode`. Type it again at the start of each new task, because Droid has no Custom Mode to keep it on. Run `/setup-pvstack` once to pick a mode.
- Parallel work: Subagents through the Task tool. Give each one its own git worktree.
- Scheduled runs: Automations, or the Loop tool for a run that keeps going.
- Docs: https://docs.factory.ai

### Claude Code

Install:

Copy each folder under `pstack/skills/` from https://github.com/cursor/plugins/tree/main/pstack into `~/.claude/skills/` for all your projects, or into `.claude/skills/` in one repository.

- Run a skill: Type `/` and the skill name, for example `/poteto-mode`. The folder name becomes the command.
- Parallel work: Subagents, or a separate session in its own git worktree.
- Scheduled runs: Routines or desktop scheduled tasks. Routines start fresh cloud sessions that don't read `~/.claude/skills/`, so commit the skills to the repository's `.claude/skills/` for those runs.
- Docs: https://code.claude.com/docs/en/skills

### Cursor

Install:

```text
/add-plugin pstack
```

- Run a skill: Type the skill as a slash command, for example `/poteto-mode`. Pick it from the `/` menu with Option+Enter on Mac or Alt+Enter on Windows to make it a Custom Mode, which stays on every turn until you exit it. Run `/setup-pstack` once to pick models, then start a new chat, because its rule applies to new chats. Install the `cursor-team-kit` plugin too, for `control-ui`, `control-cli`, and `deslop`.
- Parallel work: Cloud agents, or git worktrees.
- Scheduled runs: Cursor Automations, or the `/loop` command for a run that keeps going.
- Docs: https://github.com/cursor/plugins/tree/main/pstack

### Codex

Install:

Copy each folder under `pstack/skills/` from https://github.com/cursor/plugins/tree/main/pstack into `~/.agents/skills/` for all repositories, or into `.agents/skills/` at the repository root.

- Run a skill: Type `$` and the skill name, for example `$poteto-mode`, or run `/skills` to pick one. Where this playbook shows `/poteto-mode`, type `$poteto-mode`.
- Parallel work: Git worktrees, or Codex Cloud environments.
- Scheduled runs: No built-in scheduler was confirmed for this playbook. Start Codex in non-interactive mode from a scheduler you already use, such as CI.
- Docs: https://developers.openai.com/codex/skills

### Any agent that can load SKILL.md folders

Unverified: check your tool's docs.

Install:

Copy each folder under `pstack/skills/` from https://github.com/cursor/plugins/tree/main/pstack into the folder your tool loads skills from.

- Run a skill: Call the skill by name in the way your tool supports. If it has no way, tell the agent to read `poteto-mode/SKILL.md` and follow it.
- Parallel work: Separate agent sessions, each in its own git worktree, container, or cloud sandbox.
- Scheduled runs: Any scheduler you already have, such as cron or CI, that starts your agent with a prompt.
- Docs: https://github.com/cursor/plugins/tree/main/pstack

## Say the goal and how to check it

*The one habit*

A good prompt has two parts. The first is the outcome you want. The second is the check that proves it. "Users get two notifications after a retry. Repro first, then fix and verify." That is enough. The playbook supplies the rest.

Don't list skills. A prompt such as "use /how, then /architect, then /arena" usually reorders or drops steps the playbook would have kept. Name a skill only when you want to override a choice.

When you are not sure what the problem is, don't guess for the agent. Ask it to restate the problem in its own words first. poteto calls this the indirect prompt.

Go deeper:

Part 2 says the indirect prompt does three things. It makes the agent compress a noisy thread into a clear problem statement. It lets you catch a misunderstanding before any code exists. It also keeps your own guesses, which may be wrong, from steering the agent.

Part 2 names two ways agents fail. They misread your intent because the task is underspecified, or they lack the context to do the work well. Both improve when you fill the agent's context with good material. Restating, `/teach`, `/recall`, `/how`, and `/why` all do that.

Match the check to the change. A CLI change runs the real command. A UI change walks the changed flow in the running app. A parser or migration replays a saved input. A perf change compares before and after profiles. A storage change reads back the written value.

When the context is already in the chat, short prompts work. Examples are `/poteto-mode do it`, `continue`, and `keep going until done`. Say `new task` when you switch subjects, so the mode picks a fresh playbook.

Prompt: State a goal and its check

```text
/poteto-mode users get two notifications after a retry. repro first, then fix and verify.
```

Prompt: Draw the problem out of the agent

```text
/poteto-mode read this slack thread. restate in your own words and in plain english what you think the underlying issue is
```

Prompt: Switch to a new read-only question

```text
/poteto-mode new task. figure out why <the cache entry survives logout>. don't change any code yet.
```

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [guide/02-poteto-mode.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/02-poteto-mode.md)
- [guide/06-verify-and-ship.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/06-verify-and-ship.md)

## Pick your line

*Choose*

Do you already have code that runs? If yes, take the brownfield line. If no, take the greenfield line. Greenfield means a new project that starts from an empty repo or an idea. Brownfield means an existing codebase.

The two lines visit the same stations in a different order. Brownfield starts with verification, because your app already runs and the agent can learn to drive it today. Greenfield first reaches a walking skeleton, the smallest version of the app that starts and does one thing, because the verification generator needs an app it can launch.

Both lines end with the same habits. Every change ends with proof from the real app, and every change ships as a small pull request.

Go deeper:

`create-verification-skill` interviews the repository. It works out how the app starts, what can drive it, and what evidence proves behavior. If the checkout doesn't build or start, the skill says to fix that first or report it, because a skill written against a broken base teaches wrong steps. So the greenfield line puts design and a walking skeleton before verification.

Greenfield gets a design phase that brownfield mostly skips. With no code yet, the cheapest way to find the right shape is a tutorial, a throwaway prototype, and an `/architect` sketch. On brownfield, the existing code already constrains the shape, so understanding comes first.

Sources:

- [skills/create-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md)
- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

## Greenfield line

Starting from an empty repo or an idea.

### gf-tutorial: Write the tutorial before the code

Greenfield line, station 1 of 9: Tutorial.

Before any code exists, ask the agent to write a tutorial for your project as if the project were finished. A tutorial walks a newcomer through building something visible, step by step. Write it for the person who will use what you build. That is an end user for an app, or a developer for a library or an API. Writing it first shows you what using the thing will feel like.

The tutorial becomes the target. The agent can check its later work against it, and you can read it in minutes to see what the agent plans to build.

Go deeper:

poteto calls this README-driven development. To build Dune, an in-house framework for desktop apps, poteto started with a tutorial. The first draft mixed four goals in one document, so poteto wrote `/technical-writing` to fix that.

`/technical-writing` uses the Diátaxis framework, which splits docs into four modes. A tutorial teaches by doing. A how-to guide solves one real problem for someone who knows the basics. A reference describes facts for lookup. An explanation discusses background, design choices, and tradeoffs. One document uses one mode. The skill also applies `/unslop` to cut filler.

Part 2 argues that most plan modes over-specify implementation details and under-specify everything else. A tutorial starts from the user's side and works back to the design.

Skills: [`/technical-writing`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/technical-writing/SKILL.md), [`/unslop`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/unslop/SKILL.md), [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md)

Prompt: Write the tutorial first

```text
/poteto-mode use /technical-writing to write a tutorial for <project>, as if it already exists. show how a user would <first thing they build with it>.
```

Prompt: Check that the approach holds up

```text
/teach me and prove to me why this new approach is superior to <the approach you would have picked>
```

Done when:

- [ ] A tutorial file exists in the repo, written in one Diátaxis mode.
- [ ] You can say in one sentence what a user builds in the tutorial.
- [ ] Each tutorial step names a result the reader can see.

Watch out:

- Don't let one document try to be a tutorial, a reference, and a design doc at once. Split it into one document per mode.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [skills/technical-writing](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/technical-writing/SKILL.md)

### gf-prototype: Prototype a few options and pick one

Greenfield line, station 2 of 9: Prototype.

Use this step when a design decision is open, such as which layout, which interaction, or which approach. If no decision is open, skip it. The Prototype playbook says no decision means no prototype.

Ask for several quick, throwaway versions of the core idea instead of one careful version. The agent builds them in a scratch folder, puts two or three variants behind one switcher, and shows you screenshots or measurements of each.

You pick the direction from evidence, not from a description. The prototype code gets thrown away. Only the decision moves forward.

Go deeper:

The Prototype playbook is the one place where speed beats polish. There is no planning, no tests, and no abstraction. For a visual question it uses plain HTML, CSS, and JavaScript, or the lightest stack that renders the idea. For a behavior or timing question it writes the smallest script that answers it, then logs the timing or prints the output.

Part 2 names accepting the agent's first design as a common mistake. Prototypes let the agent explore and surprise you, and they answer open questions with evidence instead of waiting for you. If there is no decision to make, there is no prototype. The playbook sends that work to the Feature playbook instead.

Before your app exists, you have no verification skill yet. The agent can still screenshot a scratch page with whatever browser automation it has, such as the `agent-browser` skill on Droid, or print the output of a script.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/principle-exhaust-the-design-space`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-exhaust-the-design-space/SKILL.md)

Prompt: Compare variants of the core idea

```text
/poteto-mode prototype a few options for <the core interaction>. take videos/screenshots for me to review and choose from
```

Done when:

- [ ] Two or three variants exist in a scratch folder, outside production code.
- [ ] You have a screenshot, an output, or a timing for each variant.
- [ ] You picked one direction and wrote down why.
- [ ] The agent's reply says plainly that the prototype is throwaway.
- [ ] Or you skipped this step because no decision was open, and you wrote down that reason.

Watch out:

- Don't ship prototype code. Hand the chosen direction to `/architect` or the Feature playbook for the real build.

Sources:

- [playbooks/prototype.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/prototype.md)
- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### gf-architect: Sketch the shape before filling in code

Greenfield line, station 3 of 9: Architect.

Use this step when the code will cross function boundaries or add a subsystem. Skip it when the first version is one small script with an obvious shape, and write down why.

`/architect` designs before it builds. It writes how a caller will use the code first, then the types and function signatures, with placeholder bodies. Several agents, often on different models, draft competing designs in parallel. A judge on another model compares them, and the best parts merge into one sketch.

Then the agent fills in the real code against that sketch. If the code keeps fighting the sketch, the agent throws the sketch away and designs again.

Ask for a checkpoint on this line. By default `/architect` goes straight from the sketch to implementation. Here the walking skeleton and the verification skill come next, so the agent should stop after the sketch and show it to you.

Go deeper:

The phases are ground, sketch, agree, implement, and scrap. Ground runs `/how` and `/why` over the systems the new code touches. On a brand new project with nothing to integrate, the skill skips grounding. Sketch runs `/arena` and requires at least two structurally different candidates. Agree is optional. By default the agent goes straight to implementation unless you ask for a checkpoint.

A wrong sketch shows a pattern, not one bad case. The same workaround appears in unrelated code. Types need escape hatches such as `any` or forced casts. Callers must know the abstraction's internal rules. When that happens, the skill re-grounds, removes code before it adds any, and sketches again.

Part 2 advises against reviewing abstract plans adversarially. Agents start to invent risks and edge cases that never happen. Answer open questions with prototypes and real runs instead.

Skills: [`/architect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md), [`/arena`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/arena/SKILL.md), [`/how`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/how/SKILL.md), [`/why`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/why/SKILL.md)

Prompt: Design the first real feature and stop before code

```text
/architect this new <feature request> with checkpoint. stop and show me before implementing.
```

Done when:

- [ ] A usage sketch shows how callers will use the code.
- [ ] At least two structurally different designs were compared.
- [ ] Types and signatures exist with placeholder bodies, in one file or a module map.
- [ ] A rationale records which design won and why.
- [ ] The agent stopped after the sketch and did not implement it.
- [ ] Or you skipped this step because the shape was obvious, and you wrote down that reason.

Watch out:

- Don't accept the first design. The skill exists to compare at least two.

Sources:

- [skills/architect](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md)
- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [guide/04-design.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/04-design.md)

### gf-skeleton: Build a walking skeleton that runs

Greenfield line, station 4 of 9: Skeleton.

A walking skeleton is the smallest version of your app that starts and does one real thing from end to end. It has almost no features. It proves that the pieces connect and that the app starts from one command.

You need it before the next step. The verification generator learns how to launch and drive your app, so it needs an app that launches.

Go deeper:

Build the dev experience into the skeleton now. Part 1 lists three needs. You need a way to seed a dev database. You need a way to handle auth, test users, and API calls against a test or staging environment. You need one consistent way to install and start the dev environment. Agents need these as much as people do.

Pick tools an agent can control. Part 1 points out that a web or Electron app can use the Chrome DevTools Protocol (CDP), the protocol behind the browser's developer tools, and that an iOS app can use the simulator. The harder your stack is to debug and control, the harder it is to use agents well.

The skeleton is a Feature task, so `/poteto-mode` uses the Feature playbook. It names the data shape first, then builds, then verifies on the surface a user touches.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/architect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md)

Prompt: Build the smallest runnable version

```text
/poteto-mode build the smallest version of <project> that starts with one command and lets a user <one real action> end to end. if the app has data or logins, add a seed script and a test user. show me it running.
```

Done when:

- [ ] One documented command starts the app from a clean checkout. The command may assume prerequisites, such as a language runtime, when the README lists them.
- [ ] One user action works end to end, and you saw it work.
- [ ] Seed data and a test login exist, if the app needs them.

Watch out:

- Don't add features before the app starts reliably. A flaky start teaches the verification skill wrong steps.

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [skills/create-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md)
- [playbooks/feature.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/feature.md)

### gf-verify: Teach the agent to drive your app

Greenfield line, station 5 of 9: Verify. Shared with the Brownfield line.

Run `/create-verification-skill`. The agent studies your repository, works out how to launch the app and drive it like a user, and writes a project-local skill for that. From then on, "verify it in the app" is a step any agent can run.

The same run starts a Feature Map. That is a folder with one index file and one file per feature. It tells agents what each feature does and how a user reaches it.

Give the skill a control tool, a dependable way to drive the app. It can be the automation you already have. poteto recommends a small CLI built for agents as the upgrade.

Go deeper:

The generator prefers what the repo already has, such as Playwright or Cypress specs, PTY helpers, or HTTP endpoints. Otherwise it picks a generic recipe. Web and Electron apps get a browser driven over CDP. CLIs and TUIs get a tmux or PTY session. Services get plain HTTP. It writes the skill to a `verify-<app>/` folder, which on Droid is `.factory/skills/verify-<app>/`, with Launch, Doctor, Drive, Evidence, and Cleanup sections. Before it hands the skill over, it runs the skill once end to end and checks that the evidence survived cleanup.

The Feature Map lives in the skill's `features/` folder, and `features/README.md` is the index. Each feature file has an H1 title, a short description, and four H2 sections, `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, and `Gotchas`. The generator seeds the top 3 to 5 features. Part 1 calls the map materialized memory. It is a compact form of what the code already says, kept in the repo, so every contributor's agent reads the same map.

The Build the Lever principle applies here. A tool beats a page of instructions, because agents spend fewer tokens and the results are easier to repeat and test. Part 1 sketches a CLI with commands such as `start`, `stop`, `screenshot`, `video`, `perf-trace`, `seed-db`, and `login --test-user`. poteto wants a composable API, `--dry-run` on any command with destructive side effects, subcommands that reveal features gradually, error messages that tell the agent what to do instead, rich `--help` text, and machine-readable output such as JSON.

You choose the generated skill's name. Part 1 and Part 2 call poteto's example `/control-app`. This playbook writes `/verify-<app>`.

Skills: [`/create-verification-skill`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md), [`/principle-build-the-lever`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-build-the-lever/SKILL.md)

Prompt: Create the verification skill

```text
/create-verification-skill
```

Prompt: Upgrade to an agent-friendly control CLI

```text
/poteto-mode build a small control CLI for <app> that /verify-<app> uses. add subcommands for start, stop, screenshot, seed-db, and login --test-user. add --dry-run to anything destructive, rich --help, JSON output, and error messages that say what to do instead. prove each command against the running app.
```

Done when:

- [ ] A `verify-<app>` skill exists with Launch, Doctor, Drive, Evidence, and Cleanup sections.
- [ ] The generator ran the skill once end to end, and the evidence still exists after cleanup.
- [ ] `features/README.md` lists at least one feature, and each listed feature has its own file.
- [ ] The agent launched the app and showed you a screenshot or output from one feature.

Watch out:

- If the generator's own proof run fails, don't use the output. Fix the app start or report the blocker first.
- Don't drive the app by screen coordinates when a stable handle exists, such as an ARIA label, a data attribute, or a route.

Sources:

- [skills/create-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md)
- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [guide/06-verify-and-ship.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/06-verify-and-ship.md)

### gf-feature: Build features in a loop with proof

Greenfield line, station 6 of 9: Build.

Now build one feature at a time, each small enough for one PR. In each prompt, say what to build and ask for proof from the real app. Proof can be a video, screenshots, command output, or HTTP responses, whichever fits your app.

When the next piece of work is too big for one PR, use `gf-plan` to split it first. Then each item of the plan goes through this loop.

The agent uses the Feature playbook. It learns the affected code, designs the change, hands the code to a subagent, and verifies on the same surface a user touches.

Go deeper:

The Feature playbook runs `how` over the affected code, then `architect`, then writes a throughput checkpoint. The checkpoint names the steps that must run first, the work that can run in parallel, any shared state, and the smallest safe split. A subagent writes the code, and the lead agent reviews the diff. An inconclusive check, or a check on the wrong surface, does not count as a pass.

When the implementation could take several valid shapes, the playbook delegates through `/arena`, so competing versions surface. When the design is contested, it runs `/interrogate`, where reviewers on different models try to break the change.

Keep the Feature Map current. Agents often update it as they work. A new feature should get its own file in `features/`.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/how`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/how/SKILL.md), [`/architect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md), [`/interrogate`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/interrogate/SKILL.md)

Prompt: Build a feature with proof

```text
/poteto-mode build <description of feature, any useful context>. use /verify-<app> to verify your changes and show me <a video and screenshots, or the command output or HTTP responses> as proof
```

Done when:

- [ ] The reply includes proof from the running app, such as a video, screenshots, command output, or HTTP responses.
- [ ] The todo list showed the Feature playbook steps, and every skipped step had a reason.
- [ ] The Feature Map has a file for the new feature.

Watch out:

- Don't accept "the build passed" as proof. Ask for the real flow, output, or stored value.

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [playbooks/feature.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/feature.md)

### gf-plan: Turn the design into small, verifiable PRs

Greenfield line, station 7 of 9: Plan.

Use this step when the next piece of work is too big for one PR, such as a new subsystem or a change across many files. If the change touches one or two files and the approach is obvious, skip the plan and say so.

Ask for a plan after you like the design. The multi-phase plan playbook writes a checklist where each PR is one small change with its own proof.

The plan is the deliverable. Execution starts only when you say go. Then the agent works through the plan one item at a time, under the playbook the plan names. Each item goes through the `gf-feature` loop of build, verify, and proof.

Go deeper:

Every PR in the plan has unit, live, and perf verification blocks. The playbook states the rule plainly. Tests alone are not sufficient verification. The live block has ten lanes that drive the real app through its control skill, and one lane runs the same scenario on the main branch and on the PR to catch regressions.

Prototypes settle open questions before the plan is written. The script `skills/poteto-mode/scripts/check-plan.mjs` checks that the plan has every required section and verification block in order, and it flags long dashes, curly quotes, and mid-sentence colons. The agent fixes every line it prints. The plan also names the playbook that runs it, such as Autopilot-full or Autopilot-stack.

poteto doesn't keep plans around. For a project that takes about a week, a plan may be committed for a while so other agents can see the work in progress. It gets deleted when the work is done.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/technical-writing`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/technical-writing/SKILL.md), [`/swarm`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/swarm/SKILL.md)

Prompt: Turn a settled design into a plan

```text
/poteto-mode turn this design into a plan
```

Done when:

- [ ] The plan file exists, and `check-plan.mjs` prints no problems.
- [ ] Each PR section has its own files, build step, and unit, live, and perf checks.
- [ ] Prototypes answered the open questions, and the plan's first appendix lists them.
- [ ] None of the planned work is built yet, and the agent waits for your go.
- [ ] Or you skipped this step because the work fits in one PR, and you wrote down that reason.

Watch out:

- Don't overcook the plan without evidence. Settle open questions with prototypes first.
- Don't review an abstract plan adversarially. Agents invent risks that never happen.

Sources:

- [playbooks/multi-phase-plan.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/multi-phase-plan.md)
- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### gf-ship: Open the PR, get it green, and land it

Greenfield line, station 8 of 9: Ship. Shared with the Brownfield line.

Ask the agent to open the PR. It rebases the work into small ordered commits, cleans the diff, writes a short description with evidence, and returns the link.

Then hand the PR to Babysit. It fixes conflicts, answers review comments, and fixes CI until the PR is merge-ready. It never merges. When you want to land, ask for Shipping, which verifies each PR again before it merges anything.

Go deeper:

The Opening a PR playbook works from a worktree. It runs a cleanup pass over the diff before each commit and `/no-comments` before review, then writes the title in Conventional Commits form. The description has short sections such as Why, What changed, Scope, Blast Radius, and Verification. Five narrow PRs beat one large one, and stacked follow-ups beat a growing branch.

Babysit takes blockers in order. Conflicts come first, then review threads, then CI. It batches known fixes into one push so checks restart once. Comments from people and from an automated reviewer get skeptical triage. A real finding gets a fix. Noise gets dismissed with a reason.

Green is not the same as safe. Shipping sends a fresh agent to verify each PR live, and the agent that judges a change never wrote it. It lands only the unbroken run of verified PRs from the bottom of the stack.

The cleanup pass is `/deslop`, from Cursor's `cursor-team-kit` plugin. On Droid, PV Stack maps it to the built-in `simplify` skill. On other tools, ask in plain words to remove narrating comments, unneeded guards, dead compatibility code, and unrelated edits.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/no-comments`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/no-comments/SKILL.md), [`/unslop`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/unslop/SKILL.md), [`/interrogate`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/interrogate/SKILL.md)

Prompt: Open the PR

```text
/poteto-mode open the pr. small ordered commits, evidence in the description.
```

Prompt: Drive the PR to merge-ready

```text
/poteto-mode babysit this pr. get it green.
```

Prompt: Land a verified stack

```text
/poteto-mode land the stack.
```

Done when:

- [ ] The PR is open, not a draft, and its description shows how the change was verified.
- [ ] Babysit reports the PR as merge-ready. Babysit stops there and never merges.
- [ ] Before anything merged, a fresh agent verified each PR on the real app.
- [ ] Shipping merged the PR. Merged is the end state of this step.

Watch out:

- Don't accept every review comment. Bots and people file real catches and noise in the same list.

Sources:

- [playbooks/opening-a-pr.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/opening-a-pr.md)
- [playbooks/babysit.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/babysit.md)
- [playbooks/shipping.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/shipping.md)
- [guide/06-verify-and-ship.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/06-verify-and-ship.md)

### gf-keep: Keep the verification skill sharp and automate it

Greenfield line, station 9 of 9: Maintain. Shared with the Brownfield line.

Run `/maintain-verification-skill` every day, or put it on a schedule. It drives every feature in the Feature Map and fixes the map when the app has changed.

After a hard task, run `/reflect` so the lesson becomes a skill edit. When your habits settle, `/automate-me` can draft your own mode skill.

Go deeper:

The maintenance run ends as `clean`, `changed`, or `blocked`. It edits only the verification skill's own folder. A real product bug becomes a report for you, not a doc change.

Once verification is reliable, scheduled or event-triggered runs can do more. They can try to reproduce every user report, and with a good enough Feature Map they can try a fix. The last brownfield step, `bf-keep`, shows that setup.

Skills: [`/maintain-verification-skill`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/maintain-verification-skill/SKILL.md), [`/reflect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/reflect/SKILL.md), [`/automate-me`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/automate-me/SKILL.md)

Prompt: Audit the verification skill

```text
/maintain-verification-skill
```

Prompt: Capture a lesson after a hard task

```text
/reflect that took way too long. capture what we learned so the next run doesn't repeat it.
```

Done when:

- [ ] A maintenance run finished and reported `clean`, `changed`, or `blocked`.
- [ ] A daily schedule runs `/maintain-verification-skill`, or you have a daily reminder to run it.
- [ ] Any `changed` outcome arrived as one PR inside the verification skill's folder.

Watch out:

- Don't let the Feature Map go stale. A stale map sends agents down paths the app no longer has.

Sources:

- [skills/maintain-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/maintain-verification-skill/SKILL.md)
- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [skills/reflect](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/reflect/SKILL.md)

## Brownfield line

Working in a codebase that already runs.

### bf-map: Teach the agent to drive your app

Brownfield line, station 1 of 8: Verify. Shared with the Greenfield line.

Start here, because your app already runs. Run `/create-verification-skill`. The agent studies your repository, launches the app, and writes a project-local skill that drives the app the way a user does.

The same run builds a Feature Map, an index plus one file per feature that says what the feature does and how a user reaches it. On a big codebase, the map saves agents from searching for features every time.

Point the verification skill at a test or sandbox setup, where actions such as payments and emails are fake. Never point it at production.

Go deeper:

The generator asks you only what it can't learn from the code. It works out what a user touches, how the app starts, what can drive it, what evidence proves behavior, and whether two copies can run side by side. Existing automation such as Playwright or Cypress comes first. A generic recipe, such as a browser over CDP, a PTY session, or plain HTTP, comes only when nothing exists.

Make the dev setup ready for agents while you are here. Part 1 suggests a way to seed a dev database, test users and auth, API calls against a test or staging environment, and one consistent way to bring up the dev environment. Many teams already have these for people.

Then upgrade the control tool. poteto recommends a small CLI made for agents, with composable commands, `--dry-run` on destructive commands, subcommands, descriptive errors, rich `--help`, and JSON output. Part 1 says to make this CLI good and error-free before anything more advanced.

The generator seeds the top 3 to 5 features. Ask for more, or let agents add files as they work. `/maintain-verification-skill` checks the whole map later.

Skills: [`/create-verification-skill`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md), [`/principle-build-the-lever`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-build-the-lever/SKILL.md)

Prompt: Create the verification skill

```text
/create-verification-skill
```

Prompt: Map more of the app

```text
/poteto-mode add Feature Map files for <area of the app> to /verify-<app>. drive each feature once and save the evidence.
```

Prompt: Upgrade to an agent-friendly control CLI

```text
/poteto-mode build a small control CLI for <app> that /verify-<app> uses. add subcommands for start, stop, screenshot, seed-db, and login --test-user. add --dry-run to anything destructive, rich --help, JSON output, and error messages that say what to do instead. prove each command against the running app.
```

Done when:

- [ ] A `verify-<app>` skill exists with Launch, Doctor, Drive, Evidence, and Cleanup sections.
- [ ] The generator proved the skill once, from launch to cleanup, and the evidence survived.
- [ ] `features/README.md` indexes your main features, with one file each.
- [ ] An agent launched the app and drove one feature without your help.
- [ ] The skill runs against a test or sandbox setup, not production.

Watch out:

- If the checkout doesn't build or start, fix that first. A skill written against a broken base teaches wrong steps.

Sources:

- [skills/create-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md)
- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [guide/06-verify-and-ship.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/06-verify-and-ship.md)

### bf-restate: Have the agent restate the problem

Brownfield line, station 2 of 8: Restate.

Before any fix, ask the agent to read the report and restate the problem in its own words, in plain English. Read its answer. If it chased a red herring, correct it now, while a correction costs one message.

This is the indirect prompt. You draw the problem statement out of the agent instead of handing it your guess.

Go deeper:

Part 2 lists three gains. The agent compresses a noisy conversation into a structured problem statement. You catch misunderstandings before code exists. Your own assumptions, which may be wrong, don't narrow what the agent considers.

It works for any noisy source, such as a chat thread, an issue, or a support ticket. When the agent's reply is too dense, `/bro` restates the last message in plain words.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/bro`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/bro/SKILL.md)

Prompt: Restate a report before acting

```text
/poteto-mode read this slack thread. restate in your own words and in plain english what you think the underlying issue is
```

Prompt: Get the last reply in plain words

```text
/bro
```

Done when:

- [ ] The agent's restatement matches what the reporter meant.
- [ ] You corrected any misunderstanding before code changed.
- [ ] No product code changed for the issue yet. A control CLI built in `bf-map` doesn't count.

Watch out:

- Don't open with your own theory of the cause. It can lead the agent down the wrong path.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [skills/bro](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/bro/SKILL.md)

### bf-understand: Build a mental model before you edit

Brownfield line, station 3 of 8: Understand.

Four skills help you understand code you didn't write. `/how` explains how something works now. `/why` digs up why it was built that way. `/teach` combines both into one plain explanation for you. `/recall` rebuilds your own context from past chats.

Use them before you change anything important. An agent that edits without a traced model tends to fix the symptom at the first plausible spot.

Go deeper:

`/how` sizes the question first. For a narrow question, one agent reads and explains. For a subsystem that spans many files or services, two to four read-only explorers run in parallel, and then a separate agent writes the explanation.

`/why` starts from source control. Then it queries every evidence source your tools can reach, such as the issue tracker, docs, team chat, monitoring, error tracking, and analytics. It separates what it found from what it infers, and it reports a null result as a finding.

`/teach` runs `/how` and `/why`, then explains plainly. It starts with a short answer and adds layers when you ask. Part 2 notes that this research helps the agent too, because it makes the agent read the code before it states things.

`/recall` mines your recent chats, the last 7 days by default, plus the shared record such as PRs, tickets, and errors still firing. It returns a short brief with a status tag on each thread and one next move. To resume one specific chat or branch instead, ask `/poteto-mode` to take over the branch, which runs the Session pickup playbook.

Skills: [`/how`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/how/SKILL.md), [`/why`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/why/SKILL.md), [`/teach`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/teach/SKILL.md), [`/recall`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/recall/SKILL.md)

Prompt: Trace how a subsystem works

```text
/how is <virtualization> implemented?
```

Prompt: Find out why code is shaped this way

```text
/why are we still stuck on an old version of <node.js>?
```

Prompt: Understand the agent's choice

```text
/teach me why you implemented it this way and not <other way>. what were the tradeoffs you made and why?
```

Prompt: Rebuild context from past chats

```text
/recall the work i did yesterday on <topic> and then read this bug report on slack
```

Done when:

- [ ] You can explain in a few sentences how the code you will change works.
- [ ] You know about any past fix that was reverted and any report users keep filing, or you know that none is on record.
- [ ] The explanation cites files, commits, or tickets, not only the agent's word.

Watch out:

- Don't skip this because the agent will read the code anyway. One `/how` costs less than a second bug.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [guide/03-understand.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/03-understand.md)
- [skills/how](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/how/SKILL.md)
- [skills/why](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/why/SKILL.md)
- [skills/teach](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/teach/SKILL.md)
- [skills/recall](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/recall/SKILL.md)
- [playbooks/session-pickup.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/session-pickup.md)

### bf-job: Pick the job and state its check

Brownfield line, station 4 of 8: The job.

This step is for contained work, such as a bug, a refactor, a perf fix, or a small feature. If the change adds a new boundary, such as a new service or subsystem, or spans many files, go to `bf-design` first. Build it here after the design is settled.

Your prompt tells `/poteto-mode` what kind of job this is, and it picks the matching playbook. Each job has its own first step.

A bug starts with a reproduction. A refactor starts by pinning current behavior. A perf fix starts with a baseline measurement. A feature starts by naming what must not change.

Go deeper:

**Bug fix.** The agent reproduces the bug itself on the real surface through the verification skill. Then it narrows the cause with runtime evidence. The failing reproduction lands in git history before the fix. If a cheap local test exists, `/tdd` writes the failing test first.

**Refactoring.** The agent records current behavior with a characterization test, a snapshot, or an equivalence script before any code moves. A type check or lint is not a pin. It deletes before it adds, and it reverts the change if the result is not easier to read.

**Perf issue.** The agent captures a baseline trace first and vets every number with `/benchmark-checklist`. It tries the cheapest fixes first, starting with "don't do it". Part 1 suggests a `/swarm` that runs the verification skill many times, to confirm the win with a big enough sample.

**Feature.** State the behavior and what must stay the same, such as "text output stays byte-identical". The Feature playbook names the data shape, designs, delegates, and verifies.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/tdd`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/tdd/SKILL.md), [`/benchmark-checklist`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/benchmark-checklist/SKILL.md), [`/swarm`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/swarm/SKILL.md)

Prompt: Fix a bug from a reproduction

```text
/poteto-mode repro <the duplicate write> first. if there's a cheap test path, /tdd it. then fix and rerun.
```

Prompt: Refactor with behavior pinned

```text
/poteto-mode move <parsing> into one module, zero behavior change. record the current output first and prove it's unchanged after.
```

Prompt: Fix perf against a baseline

```text
/poteto-mode improve <the initial loading time of our app>. first use /verify-<app> to take a trace of the status quo, and identify opportunities for improvement. then do a targeted fix and use /verify-<app> + a /swarm to confirm the win
```

Prompt: Add a feature without breaking the old path

```text
/poteto-mode add <a --json flag>. <text output stays byte-identical>. verify both forms.
```

Done when:

- [ ] Your prompt names the job's first step, such as repro first, pin behavior, or baseline first.
- [ ] Before it changed code, the agent showed the failing reproduction, the pinned output, or the baseline number.
- [ ] The final reply shows before and after from the same check.

Watch out:

- Don't state a vibe such as "make it faster". Give a number or a fixture to measure.

Sources:

- [guide/05-build-and-clean.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/05-build-and-clean.md)
- [playbooks/bug-fix.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/bug-fix.md)
- [playbooks/refactoring.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/refactoring.md)
- [playbooks/perf-issue.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/perf-issue.md)
- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)

### bf-design: Prototype and architect the bigger changes

Brownfield line, station 5 of 8: Design.

Use this step for a change that adds a new boundary, such as a new service or subsystem, or that spans many files. Do it before any code for that change, then build the change through `bf-job`. Contained work, such as a bug, a refactor, a perf fix, or a small feature, skips this step.

For these bigger changes, design before code. Ask the agent to `/architect` it and to answer open questions with prototypes. Ask to review the design before it builds.

A prototype puts two or three variants behind a switcher in your real app. Your verification skill drives each one, so you choose from screenshots and timings.

Go deeper:

On brownfield, `/architect` grounds itself first. It runs `/how` over every system the new code touches, and `/why` when the design moves ownership or layers. Then it sketches competing designs in an arena across model families, and a judge on another model compares them.

For an ambiguous production bug, Part 2 starts with research. The agent explores the code, metrics, and history in parallel. It returns what it knows, what data it used, and its best hypotheses.

Part 2 also shows how to redesign a troubled subsystem in three moves. First, recall past fixes and ground with `/how` and `/why`. Next, write a tutorial for the new design. Last, ask `/teach` to prove the new approach is better.

Skills: [`/architect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md), [`/arena`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/arena/SKILL.md), [`/how`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/how/SKILL.md), [`/why`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/why/SKILL.md), [`/teach`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/teach/SKILL.md), [`/recall`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/recall/SKILL.md), [`/technical-writing`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/technical-writing/SKILL.md)

Prompt: Design a new service boundary

```text
/poteto-mode we need to add <rate limiting for external webhooks>. /architect this first, and answer any open questions with prototypes. let me review before proceeding.
```

Prompt: Prototype options in the real app

```text
/poteto-mode prototype a few options for <feature request>. use /verify-<app> and take videos/screenshots for me to review and choose from
```

Prompt: Research an ambiguous bug

```text
/poteto-mode investigate why <background workers periodically fail with timeout errors>. give me a breakdown of what we know, what data you used, and your best hypotheses.
```

Prompt: Redesign a subsystem from its history

```text
/recall my work fixing <virtualization bugs and perf issues> from the past 7 days. use /how and /why to understand how our current <virtualization implementation> works.
then use /poteto-mode planning and /technical-writing to come up with <a new virtualization engine that categorically eliminates flickering and jittering>. let's start by writing a tutorial on how i would use this new package to <virtualize a React app>
after you write the plan, /teach me and prove to me why this new approach is superior to our current <engine>
```

Done when:

- [ ] At least two structurally different designs were compared.
- [ ] Each open question has a prototype result, not a guess.
- [ ] If you asked to review the design, you saw it before implementation started.
- [ ] Or you skipped this step because the work is contained, and you wrote down that reason.

Watch out:

- Don't accept the agent's first design.
- Don't review abstract plans adversarially. Prototype instead.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [skills/architect](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md)
- [playbooks/prototype.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/prototype.md)
- [playbooks/investigation.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/investigation.md)

### bf-migrate: Split a big migration into small, verifiable PRs

Brownfield line, station 6 of 8: Plan.

Use this step only for a big change, such as a migration across many files. A change that fits in one PR skips it, and the agent says why.

A migration across many files needs a plan. Ask for one made of small PRs, each with its own checks and live verification, and say what the end state must match.

The agent writes a checklist you can audit. Each PR can be built, verified, and landed on its own.

Go deeper:

The multi-phase plan playbook gives every PR unit, live, and perf checks. Live checks drive the real app through the verification skill, and one lane compares the PR with the main branch. A PR that changes an interaction waits for your review with screenshots and a video.

Migrate the callers and delete the old API in the same wave. Converge on the target design rather than keeping temporary compatibility layers. The Refactoring playbook holds the same rule for smaller reshapes.

Large or cross-cutting work routes to `/figure-it-out`, which designs a custom run with a decision log. A standing multi-day program routes to the Orchestrate playbook.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/figure-it-out`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/figure-it-out/SKILL.md), [`/swarm`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/swarm/SKILL.md)

Prompt: Plan a migration as small PRs

```text
/poteto-mode create a plan to migrate <our entire UI library to StyleX>. break the migration into small, verifiable PRs. each PR must have its visual regression tests and live verification steps. i want the final result to be 100% identical compared to the original - bugs included
```

Done when:

- [ ] The plan lists each PR with its dependencies and checks.
- [ ] `check-plan.mjs` passes on the plan.
- [ ] The agent waits for your go before it executes.
- [ ] Or you skipped this step because the change fits in one PR, and you wrote down that reason.

Watch out:

- Don't keep plans in the codebase after the work ends. Old plans confuse later agents.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [playbooks/multi-phase-plan.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/multi-phase-plan.md)
- [skills/figure-it-out](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/figure-it-out/SKILL.md)

### bf-ship: Open the PR, get it green, and land it

Brownfield line, station 7 of 8: Ship. Shared with the Greenfield line.

Ask the agent to open the PR. It rebases into small ordered commits, cleans the diff, writes a short description with evidence, and returns the link.

Babysit then drives the PR to merge-ready through conflicts, review threads, and CI. It never merges. Shipping verifies each PR again with a fresh agent before it lands anything.

Go deeper:

A small change you don't fully trust can get `/blast-radius` before review. It finds what the change could break outside the diff, and proves the one fact the change is safe because of by running code.

For a status check without starting the full loop, ask about one PR by number. Babysit answers without polling. Review comments get skeptical triage, and noise gets dismissed with a reason.

Shipping lands only the unbroken run of verified PRs from the bottom of the stack. A verified PR above an unverified one waits.

Skills: [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md), [`/blast-radius`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/blast-radius/SKILL.md), [`/no-comments`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/no-comments/SKILL.md), [`/interrogate`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/interrogate/SKILL.md)

Prompt: Open the PR

```text
/poteto-mode open the pr. small ordered commits, evidence in the description.
```

Prompt: Check what a PR still needs

```text
/poteto-mode check on pr <123>. anything outstanding?
```

Prompt: Drive the PR to merge-ready

```text
/poteto-mode babysit this pr. get it green.
```

Prompt: Land a verified stack

```text
/poteto-mode land the stack.
```

Done when:

- [ ] The PR is open, not a draft, and its description shows how the change was verified.
- [ ] Babysit reports the PR as merge-ready. Babysit stops there and never merges.
- [ ] Before anything merged, a fresh agent verified each PR on the real app.
- [ ] Shipping merged the PR. Merged is the end state of this step.

Watch out:

- Don't treat green CI as safe to merge. Shipping exists because green is not the same as verified.

Sources:

- [playbooks/opening-a-pr.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/opening-a-pr.md)
- [playbooks/babysit.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/babysit.md)
- [playbooks/shipping.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/shipping.md)
- [skills/blast-radius](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/blast-radius/SKILL.md)

### bf-keep: Maintain verification and reproduce user reports automatically

Brownfield line, station 8 of 8: Maintain. Shared with the Greenfield line.

Run `/maintain-verification-skill` at least once a day, so the Feature Map keeps up with the app.

Then put the verification skill to work on its own. Set up a scheduled or event-triggered run that watches your feedback channel. For each report, the run tries to reproduce the bug in the real app. If the verification skill and the Feature Map are good enough, it can try a fix too.

Go deeper:

The repro prompt is one line, the same one poteto types in feedback threads. It checks the bug on the main branch first, so it doesn't fix a bug that is already gone, and it returns a video as proof.

How you wire the trigger depends on your tool. On Droid, use an automation. Elsewhere, use your tool's scheduled or event-triggered runs, or a CI job that starts the agent.

Treat the verification skill like critical infrastructure. Keep improving the control tool. Part 1 even suggests an on-call rotation for it.

When the same correction keeps coming up, run `/correct`. It changes the repo, through architecture, types, lints, or tests, so the next agent can't repeat the mistake.

Skills: [`/maintain-verification-skill`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/maintain-verification-skill/SKILL.md), [`/correct`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/correct/SKILL.md), [`/reflect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/reflect/SKILL.md)

Prompt: Audit the verification skill

```text
/maintain-verification-skill
```

Prompt: Prompt for each user report

```text
/poteto-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof
```

Prompt: Act when the thread already has the context

```text
/poteto-mode do it
```

Done when:

- [ ] Daily maintenance runs on a schedule and reports `clean`, `changed`, or `blocked`.
- [ ] A new user report starts a reproduction attempt without you starting it.
- [ ] Each attempt returns proof, such as a video or command output, or a clear note that the bug did not reproduce.

Watch out:

- Don't turn on automatic fixes before reproduction is reliable. Start with runs that only reproduce.

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [skills/maintain-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/maintain-verification-skill/SKILL.md)
- [skills/correct](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/correct/SKILL.md)

## Run agents in parallel

*Scale up*

Once an agent can prove its own work, you can run more than one. Give each agent its own isolated copy of the code. That can be a cloud sandbox, a container, or a git worktree. A git worktree is a second checkout of the same repository in another folder, on its own branch.

Two agents in one folder overwrite each other's files. Ask for isolation up front, for example "own worktree per attempt".

pstack has two fan-out skills. `/swarm` splits work into slices, or races several workers, and returns one report. `/arena` gives several agents the same design or code brief, then picks the best result and grafts in good ideas from the others.

Go deeper:

In Part 1, poteto recommends cloud machines over local worktrees. Worktrees use a lot of disk and machine resources, and one machine may run about 10 agents that way, depending on the repo and the hardware. A cloud machine can install dependencies, run the app, and record video like a local one. Good dev experience, such as seed data and one-command startup, makes that setup easier.

On Droid, subagents run where the parent runs. For isolated parallel work, PV Stack gives each worker its own git worktree and says so in the worker's prompt. Worktrees pile up, so the Worktree cleanup playbook deletes only the ones that evidence clears and pauses on any with uncommitted work.

Pick the fan-out skill by the job. Use `/swarm` for coverage, such as one worker per package or one per Feature Map entry. It also confirms a perf win with a big enough sample. Use `/arena` for a design or code bakeoff. Using `/arena` for coverage is a listed pitfall.

Part 1 describes the main agent as a coordinator that manages and supervises other agents. The work happens elsewhere, and the main agent's context stays clean.

Prompt: Isolate a task in its own worktree

```text
/poteto-mode new task. branch off <base> in a fresh worktree, then port <the parser change> there.
```

Prompt: Check independent slices in parallel

```text
/swarm check every package under packages/ against its check.sh. one worker per package. one report.
```

Prompt: Get competing proposals on a design

```text
ask /arena for a second opinion on this thread and our approach
```

Prompt: Reclaim disk from old worktrees

```text
/poteto-mode what's eating my disk? prune the worktrees that are safe to prune.
```

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [guide/02-poteto-mode.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/02-poteto-mode.md)
- [guide/04-design.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/04-design.md)
- [skills/swarm](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/swarm/SKILL.md)
- [skills/arena](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/arena/SKILL.md)
- [playbooks/worktree-cleanup.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/worktree-cleanup.md)

## Leave work running and audit it later

*Step away*

An agent that checks its own work can keep working while you sleep. It needs a finish condition it can check, an isolated worktree, and a decision log that you read in the morning.

A finish condition is a check that passes or fails, such as "zero old callers and all parser fixtures pass". A duration such as "work on this for 4 hours" is not a finish condition. It gives the agent nothing to check.

The decision log is a table with one row per decision. Each row says what the agent chose, why, and where the evidence is. `/show-me-your-work` keeps the log. Before the agent reports back, a reviewer on a different model reads the log and lists what deserves your attention.

Go deeper:

The guide's overnight contract has the goal, the finish condition, permissions, and an escape hatch. "im going to bed" tells the agent to stop asking and keep going. "don't ask me before committing" answers a permission question in advance. "if you're truly stuck after a few hours, stop and write up why" lets it stop at a real dead end.

Long work that you review later routes through `/figure-it-out`. It designs the run's phases first, builds the check before the work, and logs each decision. The Autonomous run playbook makes the smallest change the evidence supports, checks it, commits it if it helped, and discards it if it didn't. A plateau means a change of approach, not a stop. The agent never relaxes the finish condition to declare victory.

`/loop` in the prompt below is a Cursor built-in. On Droid, use the `Loop` tool or a scheduled automation. On other tools, use the closest wake or schedule feature.

For a queue of work, three playbooks scale the same trust. Autopilot-full runs independent PRs to merged, with fresh verifiers on every patch. Autopilot-stack builds and verifies one linear stack of PRs that you land yourself. Orchestrate runs a multi-day program from one coordinator chat.

Prompt: Hand off a task for the night

```text
/poteto-mode im going to bed. migrate every caller to <the new parser> in a fresh worktree off <base>.
done means zero old callers, all parser fixtures pass, old api deleted.
keep a decision log. don't ask me before committing.
/loop until done. if you're truly stuck after a few hours, stop and write up why.
```

Prompt: Audit the run in the morning

```text
/show-me-your-work catch me up on what you did last night
```

Prompt: Run a queue of independent PRs

```text
/poteto-mode full autopilot on this queue. each item is independent. i want them merged by morning.
```

Sources:

- [guide/07-overnight.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/07-overnight.md)
- [skills/show-me-your-work](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/show-me-your-work/SKILL.md)
- [skills/figure-it-out](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/figure-it-out/SKILL.md)
- [playbooks/autonomous-run.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/autonomous-run.md)

## Keep verification honest and learn from each run

*Keep it sharp*

Apps change, and a Feature Map goes stale when they do. Run `/maintain-verification-skill` often. poteto recommends at least once a day. It drives every feature in the map and fixes the map and the control tool when they no longer match the app.

Once the verification skill is reliable, put it on a schedule or an event trigger. For example, when a user reports a bug in a feedback channel, a run can try to reproduce it automatically. If the verification skill and the Feature Map are good enough, the run can also try a fix.

Two skills turn experience into better skills. `/reflect` reviews the session you just finished and proposes edits to existing skills. `/automate-me` reads your past chats and drafts your own mode skill, such as `<your-name>-mode`.

Go deeper:

`/maintain-verification-skill` ends in one of three outcomes. `clean` means every feature was covered and nothing needs to change. `changed` means one PR of proven fixes, limited to the verification skill's own folder. `blocked` names what stopped it. It never edits product code. If the app itself broke, it reports the regression instead of editing the docs to match.

Part 1 compares the verification skill to critical infrastructure. Keep improving the control tool, and consider an on-call rotation for it. Agents also update the map as they work, and the daily maintenance run catches what they miss.

`/reflect` runs three parallel reviewers over the transcript. A synthesizer sorts their proposals into `Accepted`, `Rejected`, and `Backlog`, and nothing changes until you approve. Approve a proposal only if it would change a future decision.

When you keep correcting agents for the same mistake, run `/correct`. It changes the repo so the next agent can't make that mistake. It tries architecture first, then types, then a lint, then a test, and writes docs last.

Prompt: Audit the verification skill

```text
/maintain-verification-skill
```

Prompt: Capture a lesson after a hard task

```text
/reflect that took way too long. capture what we learned so the next run doesn't repeat it.
```

Prompt: Draft your own mode skill

```text
/automate-me
```

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [skills/maintain-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/maintain-verification-skill/SKILL.md)
- [skills/reflect](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/reflect/SKILL.md)
- [skills/automate-me](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/automate-me/SKILL.md)
- [skills/correct](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/correct/SKILL.md)
- [guide/09-make-it-yours.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/09-make-it-yours.md)

## Skills

- [`/poteto-mode`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/SKILL.md): The front door. Describe the goal, and it picks a playbook and runs the other skills as the steps need them. When: Start almost every real task with it.
- [`/setup-pvstack`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/setup-pvstack/SKILL.md): Picks a mode on Droid and writes the role sheet that maps each role to a model. Upstream pstack on Cursor has `/setup-pstack` instead. When: Once after you install PV Stack, and again to change a role.
- [`/poteto-help`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-help/SKILL.md): Answers a question about pstack, such as which skill fits or why a run went wrong, and hands you a prompt to send. It doesn't start the work. When: When you're stuck, or can't tell which skill, playbook, or principle fits.
- [`/create-verification-skill`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md): Studies your repo and writes a project-local `verify-<app>` skill that launches, drives, and proves your app, plus a Feature Map. When: As soon as your app starts from one command. Needs a running app.
- [`/maintain-verification-skill`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/maintain-verification-skill/SKILL.md): Drives every feature in the Feature Map and ships at most one PR of proven fixes to the verification skill. When: Daily, or whenever the app changed. Needs a running app.
- [`/how`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/how/SKILL.md): Explains how a subsystem works now, with parallel explorers for big questions. When: Before you change code you don't know.
- [`/why`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/why/SKILL.md): Digs through history, tickets, docs, and chat to explain why code is shaped the way it is, with cited evidence. When: When the reason behind the code matters to your change.
- [`/teach`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/teach/SKILL.md): Runs `how` and `why` and explains the result plainly, building up step by step. When: When you want to understand and trust the agent's work.
- [`/recall`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/recall/SKILL.md): Rebuilds your recent context on a topic from your own chats and the shared record. When: When you return to a topic cold.
- [`/technical-writing`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/technical-writing/SKILL.md): Writes and reviews docs to a layered standard, starting with one Diátaxis mode per document. When: For a tutorial, readme, RFC, PR description, or commit message.
- [`/unslop`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/unslop/SKILL.md): Removes filler, AI vocabulary, and other tells from prose. When: On any prose the agent writes.
- [`/architect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md): Sketches usage, types, and signatures with competing designs before code, then implements against the sketch. When: Work that crosses a function boundary or adds a subsystem.
- [`/arena`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/arena/SKILL.md): Runs several attempts at the same brief, has a judge on another model compare them, and grafts the best parts into one. When: A design or code bakeoff, or a second opinion.
- [`/swarm`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/swarm/SKILL.md): Fans out workers across slices or races and returns one `PASS`, `ISSUES`, or `BLOCKED` report. When: Coverage across many parts, or many runs of the same check.
- [`/interrogate`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/interrogate/SKILL.md): Sends one diff to reviewers on different models and sorts their findings, without applying any. When: A contested design, or a branch you want challenged before shipping.
- [`/tdd`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/tdd/SKILL.md): Writes the smallest failing test first, then the fix, then reruns the test. When: A bug with a cheap local test path.
- [`/typescript-best-practices`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/typescript-best-practices/SKILL.md): Turns the type-system principles into concrete TypeScript rules, such as discriminated unions, `unknown` at boundaries, and exhaustive variants. When: Type it when a task touches `.ts` or `.tsx` files. It doesn't load on its own.
- [`/blast-radius`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/blast-radius/SKILL.md): Finds what a change could break outside the diff and proves the key safety fact by running code. When: A small diff you don't fully trust.
- [`/benchmark-checklist`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/benchmark-checklist/SKILL.md): Vets a measured number before you report or act on it. When: Any speedup or regression you measured.
- [`/no-comments`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/no-comments/SKILL.md): Hands the diff's comments to a fresh reviewer that removes all but a short keep list. When: Before review.
- [`/show-me-your-work`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/show-me-your-work/SKILL.md): Keeps a decision log with one row per decision, then has a reviewer on another model flag what needs your attention. When: Long, autonomous, or overnight work.
- [`/figure-it-out`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/figure-it-out/SKILL.md): Designs a custom, auditable playbook when no bundled one fits. When: A large migration, or work you review after stepping away.
- [`/reflect`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/reflect/SKILL.md): Reviews the session with three parallel reviewers and proposes skill edits for your approval. When: Right after a task that taught you something.
- [`/automate-me`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/automate-me/SKILL.md): Mines your past chats and drafts your own `-mode` skill. When: When you want agents to follow how you work.
- [`/correct`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/correct/SKILL.md): Changes the repo so a mistake agents keep repeating can't happen again. When: When you correct agents for the same mistake twice.
- [`/bro`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/bro/SKILL.md): Restates the last message in plain language with no jargon. When: When a reply is thorough but you still don't know what it said.
- [`/principle-build-the-lever`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-build-the-lever/SKILL.md): Build the tool that does or proves the work, instead of doing it by hand. When: Any non-trivial work, such as a control tool for your app.
- [`/principle-exhaust-the-design-space`](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-exhaust-the-design-space/SKILL.md): Build two or three competing prototypes and compare them before you commit. When: A new interaction or decision with no precedent.

## Principles

- [Laziness Protocol](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-laziness-protocol/SKILL.md). When: When you size a diff or feel tempted to add a layer. Prefer deletion and the smallest change that solves the problem.
- [Foundational Thinking](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-foundational-thinking/SKILL.md). When: Before you write logic. Choose the core types and data structures first, so the rest of the code becomes obvious.
- [Redesign from First Principles](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-redesign-from-first-principles/SKILL.md). When: When a new requirement lands on an existing design. Redesign as if the requirement had been there from day one, instead of bolting it on.
- [Attack the Premise](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-attack-the-premise/SKILL.md). When: When two or more fixes that share one assumption have failed the same check. Stop writing fixes and question the shared assumption instead.
- [Subtract Before You Add](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-subtract-before-you-add/SKILL.md). When: When you plan an addition, refactor, or rewrite. Remove dead weight first, then build on the simpler base.
- [Minimize Reader Load](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-minimize-reader-load/SKILL.md). When: When code is hard to follow. Cut the layers and hidden state a reader must hold in their head.
- [Outcome-Oriented Execution](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-outcome-oriented-execution/SKILL.md). When: During a planned rewrite or migration with clear phases. Move straight to the target design instead of keeping throwaway compatibility code.
- [Experience First](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-experience-first/SKILL.md). When: When a product or UX choice trades user delight against convenience for the builder. Choose what is better for the user, even when it is harder to build.
- [Exhaust the Design Space](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-exhaust-the-design-space/SKILL.md). When: When a decision has no precedent. Build two or three competing prototypes and compare them before you commit.
- [Build the Lever](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-build-the-lever/SKILL.md). When: On any non-trivial work. Build the script or tool that does or proves the work, so a reviewer can rerun it.
- [Model the Domain](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-model-the-domain/SKILL.md). When: When logic branches a lot or repeats the same assumption across files. Put the rules in one structure, such as a state machine or a table, instead of scattered conditionals.
- [Boundary Discipline](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-boundary-discipline/SKILL.md). When: When you wire validation, error handling, or a framework adapter. Check data where it enters the system, then trust your internal types.
- [Type System Discipline](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-type-system-discipline/SKILL.md). When: When you design a type or a function signature. Make invalid states impossible to write down.
- [Make Operations Idempotent](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-make-operations-idempotent/SKILL.md). When: When a command may run again after a crash or retry. Running it twice must end in the same state as running it once.
- [Migrate Callers Then Delete Legacy APIs](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md). When: When a new internal API replaces an old one. Move every caller and delete the old API in the same wave.
- [Separate Before Serializing Shared State](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-separate-before-serializing-shared-state/SKILL.md). When: When two agents or processes might write the same file, branch, or key. Remove the sharing first, for example with one worktree each, before you add locks.
- [Prove It Works](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-prove-it-works/SKILL.md). When: Before you call anything done. Check the real thing, not a proxy such as a green build.
- [Fix Root Causes](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-fix-root-causes/SKILL.md). When: When you debug. Reproduce first, then trace the symptom to its cause and fix it there.
- [Sequence Work into Verifiable Units](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-sequence-verifiable-units/SKILL.md). When: When work has many steps, or when you stack commits and PRs. Split the work into small units that each end in a check, and verify each one before the next.
- [Test Behavior, Not Implementation](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-test-behavior-not-implementation/SKILL.md). When: When you write, change, or keep a test. Call the code the way users do and compare the result to a literal expected value.
- [Explain the Number](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-explain-the-number/SKILL.md). When: Before you trust or report a number you measured. Find what limits the number, and rule out that it measured something else.
- [Guard the Context Window](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-guard-the-context-window/SKILL.md). When: When large outputs or long files start to fill the chat. Send bulk reading to subagents and keep only summaries in the main chat.
- [Never Block on the Human](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-never-block-on-the-human/SKILL.md). When: When the agent wants to ask permission for reversible work. Proceed, show the result, and let the person correct course. Ask only before irreversible actions.
- [Encode Lessons in Structure](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/principle-encode-lessons-in-structure/SKILL.md). When: When you give the same instruction a second time. Turn it into a lint, check, or script instead of more text.

## Recipes

### The thread already says enough

Line: any.

```text
/poteto-mode do it
```

When the context is already rich, a short prompt is enough. Typing `/poteto-mode` with it brings the mode back for this turn, and the playbook holds the structure.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [guide/02-poteto-mode.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/02-poteto-mode.md)

### Restate a report in plain English

Line: Brownfield.

```text
/poteto-mode read this slack thread. restate in your own words and in plain english what you think the underlying issue is
```

You catch a misunderstanding before any code exists, and your own guesses don't steer the agent.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### Fix a bug with a goal and a check

Line: Brownfield.

```text
/poteto-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify.
```

"repro first" and a checkable outcome are all the routing signal `/poteto-mode` needs.

Sources:

- [guide/README.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/README.md)

### Reproduce a report and prove the fix

Line: Brownfield.

```text
/poteto-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof
```

It checks the bug still exists on main before fixing, and the video is the proof. For an app with no screen, ask for command output or HTTP responses instead.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### Fix a bug through a failing test

Line: Brownfield.

```text
/poteto-mode repro the duplicate write first. if there's a cheap test path, /tdd it. then fix and rerun.
```

"if there's a cheap test path" lets the agent use the real command when a test would need brittle mocks.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Research an ambiguous bug

Line: Brownfield.

```text
/poteto-mode investigate why <background workers periodically fail with timeout errors>. give me a breakdown of what we know, what data you used, and your best hypotheses.
```

The agent explores code, metrics, and history in parallel and separates evidence from guesses.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### Understand an unfamiliar subsystem

Line: Brownfield.

```text
use /how first to understand how this initialization works. then use /why to figure out why it broke recently.
```

Mechanics first, history second. Each report names the sources it searched.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Make the agent defend its choice

Line: any.

```text
/teach me why you implemented it this way and not <other way>. what were the tradeoffs you made and why?
```

Explaining forces the agent to read the code and back its claims, which helps you trust the work.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### Pick up where you left off

Line: Brownfield.

```text
/recall the work i did yesterday on <topic> and then read this bug report on slack
```

Past chats hold context that a fresh agent would otherwise rebuild from scratch. To resume one specific chat or branch, the Session pickup playbook fits better.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [playbooks/session-pickup.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/session-pickup.md)

### Design a package by writing its tutorial

Line: Greenfield.

```text
/poteto-mode planning and /technical-writing to come up with <a new package>. let's start by writing a tutorial on how i would use this new package to <do the job>
after you write the plan, /teach me and prove to me why this new approach is superior to <the alternative>
```

A tutorial gives the agent a concrete target to check its work against, and shows you what it will build.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### Prototype a few options

Line: any.

```text
/poteto-mode prototype a few options for <feature request>. use /verify-<app> and take videos/screenshots for me to review and choose from
```

You choose from evidence, and the agent gets room to surprise you.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [playbooks/prototype.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/prototype.md)

### Sketch the design first

Line: any.

```text
/architect this new <feature request>
```

Competing designs from different models get compared before code locks in a shape.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [skills/architect](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/architect/SKILL.md)

### Design a new service boundary

Line: Brownfield.

```text
/poteto-mode we need to add <rate limiting for external webhooks>. /architect this first, and answer any open questions with prototypes. let me review before proceeding.
```

Grounding, competing designs, and throwaway prototypes come before the interface is fixed.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### Turn a settled design into a plan

Line: any.

```text
/poteto-mode turn this design into a plan
```

Every task in the plan is built around proof, and a script checks the plan's structure.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)
- [playbooks/multi-phase-plan.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-mode/playbooks/multi-phase-plan.md)

### Plan a migration as small PRs

Line: Brownfield.

```text
/poteto-mode create a plan to migrate <our entire UI library to StyleX>. break the migration into small, verifiable PRs. each PR must have its visual regression tests and live verification steps. i want the final result to be 100% identical compared to the original - bugs included
```

Each unit can be built, verified, and landed safely, and the end state has a clear test.

Sources:

- [Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506)

### Build a feature with proof

Line: any.

```text
/poteto-mode build <description of feature, any useful context>. use /verify-<app> to verify your changes and show me <a video and screenshots, or the command output or HTTP responses> as proof
```

The agent checks its own work in the real app and hands you the evidence that fits your app.

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)

### Fix perf and confirm the win

Line: Brownfield.

```text
/poteto-mode improve <the initial loading time of our app>. first use /verify-<app> to take a trace of the status quo, and identify opportunities for improvement. then do a targeted fix and use /verify-<app> + a /swarm to confirm the win
```

A baseline trace comes first, and a swarm repeats the measurement for a big enough sample.

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)

### Refactor with behavior pinned

Line: Brownfield.

```text
/poteto-mode move parsing into one module, zero behavior change. record the current output first and prove it's unchanged after.
```

The pin is recorded before structure moves, so "unchanged" has proof.

Sources:

- [guide/05-build-and-clean.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/05-build-and-clean.md)

### Teach the agent to drive your app

Line: any.

```text
/create-verification-skill
```

It writes a project-local skill and a Feature Map, then proves the skill once before handing it over.

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [skills/create-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md)

### Keep the verification skill honest

Line: any.

```text
/maintain-verification-skill
```

It drives every mapped feature and fixes drift, without touching product code.

Sources:

- [Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065)
- [skills/maintain-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/maintain-verification-skill/SKILL.md)

### Check independent slices in parallel

Line: any.

```text
/swarm check every package under packages/ against its check.sh. one worker per package. one report.
```

Each worker owns one slice, and you get one report instead of raw worker dumps.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Get a second opinion on a design

Line: any.

```text
ask /arena for a second opinion on this thread and our approach
```

Your design becomes one candidate among several, and the synthesis says whether the panel found something better.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Review a branch skeptically

Line: any.

```text
/interrogate the whole branch, but skeptically. don't change anything yet. no nitpicks unless it's an actual bug or regression in behavior.
```

"don't change anything yet" keeps it read-only, and the nitpick rule filters out noise.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Open a focused PR

Line: any.

```text
/poteto-mode open the pr. small ordered commits, evidence in the description.
```

The playbook cleans the diff and writes a short description with the proof.

Sources:

- [guide/06-verify-and-ship.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/06-verify-and-ship.md)

### Drive a PR to merge-ready

Line: any.

```text
/poteto-mode babysit this pr. get it green.
```

Conflicts, review threads, and CI get handled in order, with one push per batch of fixes.

Sources:

- [guide/06-verify-and-ship.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/06-verify-and-ship.md)

### Keep a run honest while you sleep

Line: any.

```text
im going to bed, keep going autonomously until every fixture passes. do not stop. keep a decision log i can audit in the morning.
```

A checkable finish condition and a decision log make unattended work reviewable.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Audit last night's run

Line: any.

```text
/show-me-your-work catch me up on what you did last night
```

A reviewer on another model reads the trail first, and the reply ends with what deserves your attention.

Sources:

- [guide/07-overnight.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/07-overnight.md)

### Redirect a run that claims success too early

Line: any.

```text
apply prove it works. show me the real output, not the build log.
```

A principle name points at a full rule the agent has already read.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Get the reply in plain words

Line: any.

```text
/bro
```

It restates the last message with no jargon, shorter.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)

### Ask how without starting the work

Line: any.

```text
/poteto-help how do i keep poteto-mode on for a whole task?
```

You get an answer, a prompt to send, and a link to the source. Nothing runs until you send that prompt.

Sources:

- [guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md)
- [skills/poteto-help](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-help/SKILL.md)

### Capture a lesson after a hard task

Line: any.

```text
/reflect that took way too long. capture what we learned so the next run doesn't repeat it.
```

Lessons become proposed skill edits, and nothing changes until you approve.

Sources:

- [guide/09-make-it-yours.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/09-make-it-yours.md)

## Pitfalls

- Don't: List the skills you want run, such as "use /how then /architect then /arena". Do: State the goal and constraints. Name a skill only to override a default. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md))
- Don't: Give a vague finish condition, such as "make it better". Do: Give a command or artifact that can pass or fail. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md))
- Don't: Run parallel agents in one worktree. Do: Ask for a separate worktree per attempt. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md))
- Don't: Use `/arena` for coverage. Do: Use `/swarm` to split slices or race declared arms. Use `/arena` when every agent should attempt the same design or code brief. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md))
- Don't: Accept every review comment. Do: Fix the real findings and dismiss noise with a reason. `/interrogate` sorts findings into act-on and dismissed buckets, and you can override either way. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md))
- Don't: Treat `auto` as a model name. Do: Read `auto`, `inherit-parent`, and PV Stack's `inherit` as one instruction. The role runs on the parent chat's model. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md), [skills/setup-pvstack](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/setup-pvstack/SKILL.md))
- Don't: Report success off a green build. Do: Ask for the real command, flow, stored value, or profile, and expect the evidence in the reply. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md))
- Don't: Write a `SKILL.md` freehand. Do: Route it through the Authoring or modifying a skill playbook, so validation and review happen. ([guide/10-recipes-and-pitfalls.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/10-recipes-and-pitfalls.md))
- Don't: Accept the agent's first design. Do: Ask for prototypes, or run `/architect`, which compares at least two designs before it builds. ([Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506))
- Don't: Overcook the plan before you have evidence. Do: Answer open questions with prototypes and real runs. Then turn the settled design into a plan. ([Part 2: Research, planning, prototyping, and architecture](https://x.com/poteto/status/2097732320606507506))
- Don't: Skip verification setup and check every change by hand. Do: Run `/create-verification-skill` as soon as the app starts, so agents can prove their own work. ([Part 1: Verification is all you need](https://x.com/poteto/status/2094457600259842065), [skills/create-verification-skill](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/create-verification-skill/SKILL.md))
- Don't: Expect `/poteto-mode` to stay on for the whole chat after you type it once. Do: Type `/poteto-mode` at the start of each new task. On Cursor, start it as a Custom Mode with Option+Enter or Alt+Enter, and it stays on every turn until you exit it. ([skills/poteto-help](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-help/SKILL.md), [guide/01-setup.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/01-setup.md))
- Don't: Ask a new question mid-chat and expect the mode to treat it as new. Do: Say `new task` first, so `/poteto-mode` picks a fresh playbook. Add "don't change any code yet" when you only want an answer. ([guide/02-poteto-mode.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/02-poteto-mode.md), [skills/poteto-help](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-help/SKILL.md))
- Don't: Wait for a skill to load on its own because the task matches it. Do: Type the skill's name, or let `/poteto-mode` run it as a step. `/poteto-mode` doesn't run every skill, so name one such as `/typescript-best-practices` when you want it. Ask `/poteto-help` when you can't tell which one fits. ([skills/poteto-help](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-help/SKILL.md), [guide/05-build-and-clean.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/05-build-and-clean.md))
- Don't: Run every small, obvious edit through `/poteto-mode`. Do: Save `/poteto-mode` for work that needs rigor. To spend fewer tokens, rerun `/setup-pvstack` and pick Budget mode, set a role to `inherit` so it runs on the chat's model, or shorten a panel list, because each entry runs one subagent. ([skills/poteto-help](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/poteto-help/SKILL.md), [skills/setup-pvstack](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/skills/setup-pvstack/SKILL.md), [guide/01-setup.md](https://github.com/NDilanka/pvstack/blob/main/plugins/pvstack/docs/upstream/guide/01-setup.md))

## Glossary

- **Agent**: An AI model that can read files, run commands, and edit code to finish a task.
- **Skill**: A folder of instructions, with a `SKILL.md` file, that your agent loads when you call it by name, or when another skill such as `/poteto-mode` runs it.
- **Slash command**: A skill called by typing `/` and its name, such as `/poteto-mode`. Codex uses `$` instead.
- **Playbook**: A step-by-step workflow inside `poteto-mode`, such as Bug fix or Feature. The agent picks one for you. It is not a separate skill.
- **Principle**: One of 24 short rules, such as Prove It Works. Say a principle's name to steer the agent mid-task.
- **Subagent**: A helper agent that the main agent starts for one part of the work. It reports back when it finishes.
- **Git worktree**: A second checkout of the same repository in another folder, on its own branch. Parallel agents each get one so they don't overwrite each other.
- **Verification skill**: A project-local skill, named `verify-<app>` by the generator, that tells agents how to launch your app, drive it like a user, and capture proof. poteto's articles call theirs `/control-app`.
- **Control tool**: The thing the verification skill uses to drive the app, such as Playwright, a browser over CDP, a terminal session, or a small CLI you build for agents.
- **CDP**: The Chrome DevTools Protocol. It lets a program control a browser or Electron app the way the browser's developer tools do.
- **Feature Map**: A folder inside the verification skill with an index file and one file per feature. Each file says what the feature does, how a user reaches it, how to drive it, and what to watch out for.
- **Materialized memory**: poteto's name for the Feature Map. It is a compact, shared copy of what the code already says, kept in the repo.
- **Walking skeleton**: The smallest version of an app that starts from one command and does one real thing end to end.
- **Greenfield**: A new project that starts from an empty repo or an idea.
- **Brownfield**: An existing codebase that already runs.
- **Prototype**: A throwaway sketch, often two or three variants behind a switcher, built to make one decision from evidence.
- **Swarm**: Many workers that each cover one slice, or race the same brief, then return one combined report. Run it with `/swarm`.
- **Arena**: Several agents attempt the same brief, a judge compares them, and the best parts merge into one result. Run it with `/arena`.
- **Finish condition**: A check that passes or fails, such as "all fixtures pass". The agent works until it passes.
- **Decision log**: A table with one row per decision, saying what the agent chose, why, and where the evidence is. `/show-me-your-work` keeps it.
- **PR**: A pull request, a proposed change that others review before it merges into the main branch.
- **PR stack**: A chain of small PRs where each one builds on the one below it. You land them from the bottom up.
- **Role sheet**: The file `~/.factory/pvstack-models.md`. It maps each kind of work, such as code or review, to a droid with a fixed model. `/setup-pvstack` writes it.
- **Droid**: Factory's coding agent. In PV Stack, a droid named `pv-*` is also a preset agent with one fixed model and effort level.
- **Custom Mode**: A Cursor feature that keeps a skill such as `/poteto-mode` on every turn until you exit it. Pick the skill from the `/` menu with Option+Enter on Mac or Alt+Enter on Windows. Without one, typing `/poteto-mode` applies it to one request, and it may fade as the chat moves on.

## Model routing

pstack sends different jobs to different models. A fast, cheap model can search code. A careful model can write prose and make judgment calls. A strong model takes the hardest changes. Each kind of job is called a role.

PV Stack picks the model for each role from VulcanBench, an open benchmark of real engineering tasks that reports score, time, and cost. `/setup-pvstack` offers six modes. Balanced is the default, and Budget, Quality, Fast, Safe and Open trade score, minutes, cost and safety differently.

You can override any role. The table below lists every role and the droid each mode gives it. A droid here is a preset agent with one fixed model and effort level.

| Role | Balanced | Budget | Fast | Open | Quality | Safe |
| --- | --- | --- | --- | --- | --- | --- |
| feature, refactoring | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) |
| bug-fix | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) |
| perf-issue | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) |
| hillclimb | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) |
| mechanical edits | `pv-sol-low` (GPT-6.1 Sol, low effort) | `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-sol-low` (GPT-6.1 Sol, low effort) | `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-sol-low` (GPT-6.1 Sol, low effort) |
| judgment and prose | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-opus-high` (Claude Opus 5.5, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) |
| hardest tasks | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-opus-high` (Claude Opus 5.5, high effort) |
| how explorer | `pv-sol-low` (GPT-6.1 Sol, low effort) | `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-sol-low` (GPT-6.1 Sol, low effort) | `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-sol-low` (GPT-6.1 Sol, low effort) |
| how explainer | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-opus-high` (Claude Opus 5.5, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) |
| why investigators | `pv-sol-low` (GPT-6.1 Sol, low effort) | `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-sol-low` (GPT-6.1 Sol, low effort) | `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-sol-low` (GPT-6.1 Sol, low effort) |
| why synthesizer | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-opus-high` (Claude Opus 5.5, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) |
| reflect tooling | `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort) |
| reflect judgment, divergent, synthesizer | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-opus-high` (Claude Opus 5.5, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort) |
| arena runners | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-ds-max` (DeepSeek V4.1 Flash, max effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort), `pv-ds-high` (DeepSeek V4.1 Flash, high effort), `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-opus-high` (Claude Opus 5.5, high effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) |
| arena cross-judge pool | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort), `pv-ds-high` (DeepSeek V4.1 Flash, high effort), `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-opus-high` (Claude Opus 5.5, high effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) |
| swarm workers | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort) | `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort) |
| architect runners | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-ds-max` (DeepSeek V4.1 Flash, max effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort), `pv-ds-high` (DeepSeek V4.1 Flash, high effort), `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-opus-high` (Claude Opus 5.5, high effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) |
| interrogate reviewers | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-ds-max` (DeepSeek V4.1 Flash, max effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-high` (GPT-6.1 Sol, high effort), `pv-grok-high` (Grok 4.7, high effort) | `pv-ds-max` (DeepSeek V4.1 Flash, max effort), `pv-ds-high` (DeepSeek V4.1 Flash, high effort), `pv-ds-low` (DeepSeek V4.1 Flash, low effort) | `pv-opus-high` (Claude Opus 5.5, high effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-xhigh` (Grok 4.7, extra-high effort) | `pv-opus-medium` (Claude Opus 5.5, medium effort), `pv-sol-xhigh` (GPT-6.1 Sol, extra-high effort), `pv-grok-high` (Grok 4.7, high effort) |

Go deeper:

In Balanced mode, code work goes to GPT-6.1 Sol at high effort. On VulcanBench's Frontier v4 board, it passes all 23 tasks with a score of 88.23. That is 97% of Opus 5.5's best score of 91.11, at $0.33 per task against $3.27.

Judgment and prose go to Claude Opus 5.5 at medium effort, which passes 23 of 23 tasks at 90.86. Its xhigh and max levels score lower and cost more. On VulcanBench's Safety v1 tasks, Opus reported 64 of 100 planted repository notes to the user, and Grok 4.7 reported none of 80. That matters for roles that write what you read.

The hardest changes in Balanced mode go to Grok 4.7 at xhigh effort. It is the top Frontier v4 cell at 93.15, with every task passed. It takes 28.5 minutes per task, so it is kept for the few changes where a miss costs the most. Review panels mix models from three labs, because findings that independent models agree on carry more weight.

Budget mode uses DeepSeek V4.1 Flash for code, search, and mechanical work. That pick is inferred, because VulcanBench measured the older V4-Flash on its retired v3 board, and v3 numbers can't be compared with v4. Every Frontier v4 run also used another agent tool, not Droid, and VulcanBench measured tool effects of up to about 20 points on a single model. Treat every pick as a strong starting point, and read `docs/model-evidence.md` for each number and its source.

The other four modes read the same board. Quality ignores cost and takes the top score. Fast takes the quickest cell that still passes the tasks. Safe keeps Grok 4.7 off judgment, code, and the hardest changes, on its Safety v1 result. Open stays on open-weights models, which today means DeepSeek V4.1 Flash on every role.
