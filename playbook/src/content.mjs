// Single source for the playbook. tools/playbook.mjs renders it to
// playbook/index.html, playbook/playbook.md, and playbook/llms.txt.
// Prose fields are plain text. Inline `code` and **bold** are the only markup.

/** @typedef {'greenfield'|'brownfield'} Mode */
/** @typedef {{ intent: string, text: string }} Prompt */
/**
 * A source reference. One of:
 *   "p1" | "p2"                      poteto's articles (see meta.sources)
 *   "guide/<file>.md"                plugins/pvstack/docs/upstream/guide/<file>.md
 *   "skills/<dir>"                   plugins/pvstack/skills/<dir>/SKILL.md
 *   "playbooks/<file>.md"            plugins/pvstack/skills/poteto-mode/playbooks/<file>.md
 * @typedef {string} SourceRef
 */
/**
 * @typedef {{
 *   id: string, station: string, title: string,
 *   plain: string[], deeper: string[],
 *   skills: string[], prompts: Prompt[], done: string[],
 *   pitfalls: string[], sources: SourceRef[],
 * }} Step
 */
/**
 * @typedef {{
 *   id: string, kicker: string, title: string,
 *   plain: string[], deeper: string[], prompts: Prompt[], sources: SourceRef[],
 * }} Chapter
 */

export const meta = {
  title: "The pvstack Playbook",
  tagline: "Ship with agents. Prove every step.",
  summary:
    "A beginner's guide to pstack, the set of skills Lauren Tan (poteto) uses to ship thousands of PRs a month, and to pvstack, which runs pstack on Droid. The habits work with any agent that can load skills.",
  repo: "https://github.com/NDilanka/pvstack",
  sources: [
    { id: "p1", title: "Part 1: Verification is all you need", url: "https://x.com/poteto/status/2094457600259842065" },
    { id: "p2", title: "Part 2: Research, planning, prototyping, and architecture", url: "https://x.com/poteto/status/2097732320606507506" },
  ],
};

export const agentBrief = [
  "You are an AI agent helping a person use pstack. Read all of `playbook.md` before you answer.",
  "Ask one question first. Does the person already have code that runs? Yes means the brownfield line. No means the greenfield line.",
  "Ask which agent tool the person uses. Find its section under the \"Install on your tool\" heading, and use its install steps and its \"Run a skill\", \"Parallel work\", and \"Scheduled runs\" lines. If the tool is not listed, use the \"Any agent that can load SKILL.md folders\" section.",
  "Adapt every prompt to that tool. For example, on Codex a skill is called with `$`, so `/poteto-mode` becomes `$poteto-mode`.",
  "Go one step at a time, in the order the steps appear under the \"Greenfield line\" or \"Brownfield line\" heading. Each step heading starts with the step's id, for example `bf-map`. Name each step by that id.",
  "When a step's text sends the person to another step, follow it. Skip a step only when its own text says it doesn't apply to this work, and tell the person which step you skipped and why.",
  "Copy a prompt from the step's \"Prompt\" blocks for the person. Replace every <placeholder> with their real app, feature, bug, or file before they send it.",
  "Before you move to the next step, go through that step's \"Done when\" list. Check each item yourself when you can. Otherwise ask the person to confirm it.",
  "On the greenfield line, do not start `gf-verify` until the app starts from one command. The verification generator needs an app it can launch.",
  "When the person is stuck, check the step's \"Watch out\" list, then the \"Pitfalls\" section. Offer a matching entry from the \"Recipes\" section. If none fits, or the person asks which skill fits a situation, suggest they type `/poteto-help` with their question. It answers and hands back a prompt without starting the work.",
  "Never tell the person that a step worked without proof, such as command output, an HTTP response, a screenshot, a video, or a measured number.",
  "Explain a term from the \"Glossary\" section the first time you use it. Keep your sentences short and plain.",
  "When you give advice, cite the step id or chapter id and its source, for example `gf-plan` and `playbooks/multi-phase-plan.md`.",
];

/** @type {{ id: string, name: string, install: string[], invoke: string, parallel: string, schedule: string, verified: boolean, docs: string }[]} */
export const platforms = [
  {
    id: "droid",
    name: "Droid",
    install: ["droid plugin marketplace add NDilanka/pvstack", "droid plugin install pvstack@pvstack --scope user"],
    invoke: "Type the skill as a slash command, for example `/poteto-mode`. Type it again at the start of each new task, because Droid has no Custom Mode to keep it on. Run `/setup-pvstack` once to pick a mode.",
    parallel: "Subagents through the Task tool. Give each one its own git worktree.",
    schedule: "Automations, or the Loop tool for a run that keeps going.",
    verified: true,
    docs: "https://docs.factory.ai",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    install: [
      "Copy each folder under `pstack/skills/` from https://github.com/cursor/plugins/tree/main/pstack into `~/.claude/skills/` for all your projects, or into `.claude/skills/` in one repository.",
    ],
    invoke: "Type `/` and the skill name, for example `/poteto-mode`. The folder name becomes the command.",
    parallel: "Subagents, or a separate session in its own git worktree.",
    schedule: "Routines or desktop scheduled tasks. Routines start fresh cloud sessions that don't read `~/.claude/skills/`, so commit the skills to the repository's `.claude/skills/` for those runs.",
    verified: true,
    docs: "https://code.claude.com/docs/en/skills",
  },
  {
    id: "cursor",
    name: "Cursor",
    install: ["/add-plugin pstack"],
    invoke: "Type the skill as a slash command, for example `/poteto-mode`. Pick it from the `/` menu with Option+Enter on Mac or Alt+Enter on Windows to make it a Custom Mode, which stays on every turn until you exit it. Run `/setup-pstack` once to pick models, then start a new chat, because its rule applies to new chats. Install the `cursor-team-kit` plugin too, for `control-ui`, `control-cli`, and `deslop`.",
    parallel: "Cloud agents, or git worktrees.",
    schedule: "Cursor Automations, or the `/loop` command for a run that keeps going.",
    verified: true,
    docs: "https://github.com/cursor/plugins/tree/main/pstack",
  },
  {
    id: "codex",
    name: "Codex",
    install: [
      "Copy each folder under `pstack/skills/` from https://github.com/cursor/plugins/tree/main/pstack into `~/.agents/skills/` for all repositories, or into `.agents/skills/` at the repository root.",
    ],
    invoke: "Type `$` and the skill name, for example `$poteto-mode`, or run `/skills` to pick one. Where this playbook shows `/poteto-mode`, type `$poteto-mode`.",
    parallel: "Git worktrees, or Codex Cloud environments.",
    schedule: "No built-in scheduler was confirmed for this playbook. Start Codex in non-interactive mode from a scheduler you already use, such as CI.",
    verified: true,
    docs: "https://developers.openai.com/codex/skills",
  },
  {
    id: "generic",
    name: "Any agent that can load SKILL.md folders",
    install: [
      "Copy each folder under `pstack/skills/` from https://github.com/cursor/plugins/tree/main/pstack into the folder your tool loads skills from.",
    ],
    invoke: "Call the skill by name in the way your tool supports. If it has no way, tell the agent to read `poteto-mode/SKILL.md` and follow it.",
    parallel: "Separate agent sessions, each in its own git worktree, container, or cloud sandbox.",
    schedule: "Any scheduler you already have, such as cron or CI, that starts your agent with a prompt.",
    verified: false,
    docs: "https://github.com/cursor/plugins/tree/main/pstack",
  },
];

/** The core loop diagram, in order. */
export const loop = [
  { id: "goal", title: "Goal", plain: "You say what done looks like and how to check it." },
  { id: "change", title: "Change", plain: "The agent makes the smallest change that moves toward the goal." },
  { id: "verify", title: "Verify", plain: "The agent drives the real app, the way a user would, to check its own work." },
  { id: "proof", title: "Proof", plain: "You get a video, screenshots, command output, HTTP responses, or numbers, whichever fits your app. Then the loop repeats." },
];

/** Narrative chapters, in reading order. The two lines render after the chapter with id "pick". */
/** @type {Chapter[]} */
export const chapters = [
  {
    id: "what",
    kicker: "The idea",
    title: "pstack in 60 seconds",
    plain: [
      "pstack is a set of skills for AI coding agents. A skill is a folder of instructions that the agent reads when you call it by name, or when another skill runs it. Lauren Tan, known as poteto, wrote pstack and uses it to ship thousands of pull requests a month. pvstack is the same skills packaged for Droid, with a model chosen for each kind of work.",
      "The core idea is verification. The agent checks its own work in the real app, the way a person would. Then it can keep going until the task is done, and you stop being the bottleneck. poteto treats a good verification skill as critical infrastructure, not as one more skill.",
      "Every task follows one loop. You say the goal. The agent makes a small change. It drives the real app to check the change. It hands you proof, such as a video, a screenshot, command output, or a number.",
      "The one habit to learn is to say what you want and how to check it. You don't list steps or skills. `/poteto-mode` picks the workflow for you.",
    ],
    deeper: [
      "`/poteto-mode` is the front door. It matches your request to one of 23 playbooks, copies that playbook's steps into a todo list, and calls other skills such as `how`, `why`, `architect`, and `interrogate` as the steps need them. A skipped step stays in the list with `skip: <reason>`, so you can see what the agent chose not to do.",
      "Playbooks are not skills. They are reference files inside `poteto-mode`, and the agent loads only the one that matches, to save context. The Bug fix playbook demands a reproduction first. The Refactoring playbook pins current behavior first. The Perf issue playbook captures a baseline first. Your prompt doesn't have to say any of that.",
      "Part 1 argues that the harder your stack is to debug and control, the harder it is to use agents well. poteto suggests building rich debugging tools, or even choosing a different tech stack, so agents can verify their own work.",
    ],
    prompts: [
      { intent: "A first prompt with a goal and a check", text: "/poteto-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify." },
    ],
    sources: ["p1", "p2", "guide/README.md", "skills/poteto-mode"],
  },
  {
    id: "setup",
    kicker: "Install",
    title: "Install pstack and run your first task",
    plain: [
      "Install the skills for your agent tool. The platform table lists the steps for Droid, Claude Code, Cursor, Codex, and other tools. On Droid, pvstack installs with two commands.",
      "To check that the install worked, start a new session. Type `/poteto-mode`, or `$poteto-mode` on Codex, and see the skill load. You can also ask the agent to list its skills and look for `poteto-mode` in the list.",
      "On Droid, run `/setup-pvstack` next. It asks you to pick a mode (Balanced, Budget, Quality, Fast, Safe or Open) and writes a small file called the role sheet. The role sheet tells each skill which model to use for each job. On Cursor, the upstream version of this skill is `/setup-pstack`.",
      "Then start every real task with `/poteto-mode`. You don't pick a playbook. It reads your request and picks one. Typing it applies the skill to that request. It may fade as the chat moves on, so type it again when you start the next task. On Cursor, a Custom Mode keeps it on every turn. The Cursor section under \"Install on your tool\" shows how.",
      "When you're stuck, or can't tell which skill fits, type `/poteto-help` with your question. It answers, hands you a prompt to send, and links the file the answer came from. It doesn't start the work, so nothing runs until you send that prompt.",
    ],
    deeper: [
      "The role sheet lives at `~/.factory/pvstack-models.md`. Without it, pvstack uses the Balanced sheet. Skills read the sheet the next time they spawn a subagent, so you don't need to restart. At the end, `/setup-pvstack` checks whether the project can already prove app behavior. If it can't, it offers once to run `/create-verification-skill`.",
      "pstack's skills are written for Cursor. They name Cursor tools such as `/loop`, cloud agents, and the `control-ui` and `control-cli` skills from Cursor's `cursor-team-kit` plugin. pvstack maps each of these to a Droid tool in `skills/poteto-mode/references/droid-tools.md`. On another tool, give your agent that file as an example and ask it to map the same names to your tool.",
      "Your first task should be real and small. The guide suggests a prompt like the second one below. Watch the todo list. Its first items are the Feature playbook's steps.",
      "In headless `droid exec`, the Task tool is blocked below `--auto high`, so playbooks that delegate do their work in the parent. Interactive sessions can spawn subagents at any autonomy level. To update pvstack, run `droid plugin update pvstack@pvstack --scope user`.",
    ],
    prompts: [
      { intent: "Pick a mode and write the role sheet (Droid)", text: "/setup-pvstack" },
      { intent: "Run a small first task", text: "/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both." },
      { intent: "Ask which skill fits", text: "/poteto-help which skill should i use to review this branch?" },
    ],
    sources: ["guide/01-setup.md", "skills/setup-pvstack", "skills/poteto-mode", "skills/poteto-help"],
  },
  {
    id: "habit",
    kicker: "The one habit",
    title: "Say the goal and how to check it",
    plain: [
      "A good prompt has two parts. The first is the outcome you want. The second is the check that proves it. \"Users get two notifications after a retry. Repro first, then fix and verify.\" That is enough. The playbook supplies the rest.",
      "Don't list skills. A prompt such as \"use /how, then /architect, then /arena\" usually reorders or drops steps the playbook would have kept. Name a skill only when you want to override a choice.",
      "When you are not sure what the problem is, don't guess for the agent. Ask it to restate the problem in its own words first. poteto calls this the indirect prompt.",
    ],
    deeper: [
      "Part 2 says the indirect prompt does three things. It makes the agent compress a noisy thread into a clear problem statement. It lets you catch a misunderstanding before any code exists. It also keeps your own guesses, which may be wrong, from steering the agent.",
      "Part 2 names two ways agents fail. They misread your intent because the task is underspecified, or they lack the context to do the work well. Both improve when you fill the agent's context with good material. Restating, `/teach`, `/recall`, `/how`, and `/why` all do that.",
      "Match the check to the change. A CLI change runs the real command. A UI change walks the changed flow in the running app. A parser or migration replays a saved input. A perf change compares before and after profiles. A storage change reads back the written value.",
      "When the context is already in the chat, short prompts work. Examples are `/poteto-mode do it`, `continue`, and `keep going until done`. Say `new task` when you switch subjects, so the mode picks a fresh playbook.",
    ],
    prompts: [
      { intent: "State a goal and its check", text: "/poteto-mode users get two notifications after a retry. repro first, then fix and verify." },
      { intent: "Draw the problem out of the agent", text: "/poteto-mode read this slack thread. restate in your own words and in plain english what you think the underlying issue is" },
      { intent: "Switch to a new read-only question", text: "/poteto-mode new task. figure out why <the cache entry survives logout>. don't change any code yet." },
    ],
    sources: ["p2", "guide/02-poteto-mode.md", "guide/06-verify-and-ship.md"],
  },
  {
    id: "pick",
    kicker: "Choose",
    title: "Pick your line",
    plain: [
      "Do you already have code that runs? If yes, take the brownfield line. If no, take the greenfield line. Greenfield means a new project that starts from an empty repo or an idea. Brownfield means an existing codebase.",
      "The two lines visit the same stations in a different order. Brownfield starts with verification, because your app already runs and the agent can learn to drive it today. Greenfield first reaches a walking skeleton, the smallest version of the app that starts and does one thing, because the verification generator needs an app it can launch.",
      "Both lines end with the same habits. Every change ends with proof from the real app, and every change ships as a small pull request.",
    ],
    deeper: [
      "`create-verification-skill` interviews the repository. It works out how the app starts, what can drive it, and what evidence proves behavior. If the checkout doesn't build or start, the skill says to fix that first or report it, because a skill written against a broken base teaches wrong steps. So the greenfield line puts design and a walking skeleton before verification.",
      "Greenfield gets a design phase that brownfield mostly skips. With no code yet, the cheapest way to find the right shape is a tutorial, a throwaway prototype, and an `/architect` sketch. On brownfield, the existing code already constrains the shape, so understanding comes first.",
    ],
    prompts: [],
    sources: ["skills/create-verification-skill", "p1", "p2"],
  },
  {
    id: "parallel",
    kicker: "Scale up",
    title: "Run agents in parallel",
    plain: [
      "Once an agent can prove its own work, you can run more than one. Give each agent its own isolated copy of the code. That can be a cloud sandbox, a container, or a git worktree. A git worktree is a second checkout of the same repository in another folder, on its own branch.",
      "Two agents in one folder overwrite each other's files. Ask for isolation up front, for example \"own worktree per attempt\".",
      "pstack has two fan-out skills. `/swarm` splits work into slices, or races several workers, and returns one report. `/arena` gives several agents the same design or code brief, then picks the best result and grafts in good ideas from the others.",
    ],
    deeper: [
      "In Part 1, poteto recommends cloud machines over local worktrees. Worktrees use a lot of disk and machine resources, and one machine may run about 10 agents that way, depending on the repo and the hardware. A cloud machine can install dependencies, run the app, and record video like a local one. Good dev experience, such as seed data and one-command startup, makes that setup easier.",
      "On Droid, subagents run where the parent runs. For isolated parallel work, pvstack gives each worker its own git worktree and says so in the worker's prompt. Worktrees pile up, so the Worktree cleanup playbook deletes only the ones that evidence clears and pauses on any with uncommitted work.",
      "Pick the fan-out skill by the job. Use `/swarm` for coverage, such as one worker per package or one per Feature Map entry. It also confirms a perf win with a big enough sample. Use `/arena` for a design or code bakeoff. Using `/arena` for coverage is a listed pitfall.",
      "Part 1 describes the main agent as a coordinator that manages and supervises other agents. The work happens elsewhere, and the main agent's context stays clean.",
    ],
    prompts: [
      { intent: "Isolate a task in its own worktree", text: "/poteto-mode new task. branch off <base> in a fresh worktree, then port <the parser change> there." },
      { intent: "Check independent slices in parallel", text: "/swarm check every package under packages/ against its check.sh. one worker per package. one report." },
      { intent: "Get competing proposals on a design", text: "ask /arena for a second opinion on this thread and our approach" },
      { intent: "Reclaim disk from old worktrees", text: "/poteto-mode what's eating my disk? prune the worktrees that are safe to prune." },
    ],
    sources: ["p1", "guide/02-poteto-mode.md", "guide/04-design.md", "skills/swarm", "skills/arena", "playbooks/worktree-cleanup.md"],
  },
  {
    id: "overnight",
    kicker: "Step away",
    title: "Leave work running and audit it later",
    plain: [
      "An agent that checks its own work can keep working while you sleep. It needs a finish condition it can check, an isolated worktree, and a decision log that you read in the morning.",
      "A finish condition is a check that passes or fails, such as \"zero old callers and all parser fixtures pass\". A duration such as \"work on this for 4 hours\" is not a finish condition. It gives the agent nothing to check.",
      "The decision log is a table with one row per decision. Each row says what the agent chose, why, and where the evidence is. `/show-me-your-work` keeps the log. Before the agent reports back, a reviewer on a different model reads the log and lists what deserves your attention.",
    ],
    deeper: [
      "The guide's overnight contract has the goal, the finish condition, permissions, and an escape hatch. \"im going to bed\" tells the agent to stop asking and keep going. \"don't ask me before committing\" answers a permission question in advance. \"if you're truly stuck after a few hours, stop and write up why\" lets it stop at a real dead end.",
      "Long work that you review later routes through `/figure-it-out`. It designs the run's phases first, builds the check before the work, and logs each decision. The Autonomous run playbook makes the smallest change the evidence supports, checks it, commits it if it helped, and discards it if it didn't. A plateau means a change of approach, not a stop. The agent never relaxes the finish condition to declare victory.",
      "`/loop` in the prompt below is a Cursor built-in. On Droid, use the `Loop` tool or a scheduled automation. On other tools, use the closest wake or schedule feature.",
      "For a queue of work, three playbooks scale the same trust. Autopilot-full runs independent PRs to merged, with fresh verifiers on every patch. Autopilot-stack builds and verifies one linear stack of PRs that you land yourself. Orchestrate runs a multi-day program from one coordinator chat.",
    ],
    prompts: [
      {
        intent: "Hand off a task for the night",
        text: "/poteto-mode im going to bed. migrate every caller to <the new parser> in a fresh worktree off <base>.\ndone means zero old callers, all parser fixtures pass, old api deleted.\nkeep a decision log. don't ask me before committing.\n/loop until done. if you're truly stuck after a few hours, stop and write up why.",
      },
      { intent: "Audit the run in the morning", text: "/show-me-your-work catch me up on what you did last night" },
      { intent: "Run a queue of independent PRs", text: "/poteto-mode full autopilot on this queue. each item is independent. i want them merged by morning." },
    ],
    sources: ["guide/07-overnight.md", "skills/show-me-your-work", "skills/figure-it-out", "playbooks/autonomous-run.md"],
  },
  {
    id: "keep-sharp",
    kicker: "Keep it sharp",
    title: "Keep verification honest and learn from each run",
    plain: [
      "Apps change, and a Feature Map goes stale when they do. Run `/maintain-verification-skill` often. poteto recommends at least once a day. It drives every feature in the map and fixes the map and the control tool when they no longer match the app.",
      "Once the verification skill is reliable, put it on a schedule or an event trigger. For example, when a user reports a bug in a feedback channel, a run can try to reproduce it automatically. If the verification skill and the Feature Map are good enough, the run can also try a fix.",
      "Two skills turn experience into better skills. `/reflect` reviews the session you just finished and proposes edits to existing skills. `/automate-me` reads your past chats and drafts your own mode skill, such as `<your-name>-mode`.",
    ],
    deeper: [
      "`/maintain-verification-skill` ends in one of three outcomes. `clean` means every feature was covered and nothing needs to change. `changed` means one PR of proven fixes, limited to the verification skill's own folder. `blocked` names what stopped it. It never edits product code. If the app itself broke, it reports the regression instead of editing the docs to match.",
      "Part 1 compares the verification skill to critical infrastructure. Keep improving the control tool, and consider an on-call rotation for it. Agents also update the map as they work, and the daily maintenance run catches what they miss.",
      "`/reflect` runs three parallel reviewers over the transcript. A synthesizer sorts their proposals into `Accepted`, `Rejected`, and `Backlog`, and nothing changes until you approve. Approve a proposal only if it would change a future decision.",
      "When you keep correcting agents for the same mistake, run `/correct`. It changes the repo so the next agent can't make that mistake. It tries architecture first, then types, then a lint, then a test, and writes docs last.",
    ],
    prompts: [
      { intent: "Audit the verification skill", text: "/maintain-verification-skill" },
      { intent: "Capture a lesson after a hard task", text: "/reflect that took way too long. capture what we learned so the next run doesn't repeat it." },
      { intent: "Draft your own mode skill", text: "/automate-me" },
    ],
    sources: ["p1", "skills/maintain-verification-skill", "skills/reflect", "skills/automate-me", "skills/correct", "guide/09-make-it-yours.md"],
  },
];

/** @type {Record<Mode, { name: string, color: string, question: string, steps: Step[] }>} */
export const lines = {
  greenfield: {
    name: "Greenfield",
    color: "#22c55e",
    question: "Starting from an empty repo or an idea.",
    steps: [
      {
        id: "gf-tutorial",
        station: "Tutorial",
        title: "Write the tutorial before the code",
        plain: [
          "Before any code exists, ask the agent to write a tutorial for your project as if the project were finished. A tutorial walks a newcomer through building something visible, step by step. Write it for the person who will use what you build. That is an end user for an app, or a developer for a library or an API. Writing it first shows you what using the thing will feel like.",
          "The tutorial becomes the target. The agent can check its later work against it, and you can read it in minutes to see what the agent plans to build.",
        ],
        deeper: [
          "poteto calls this README-driven development. To build Dune, an in-house framework for desktop apps, poteto started with a tutorial. The first draft mixed four goals in one document, so poteto wrote `/technical-writing` to fix that.",
          "`/technical-writing` uses the Diátaxis framework, which splits docs into four modes. A tutorial teaches by doing. A how-to guide solves one real problem for someone who knows the basics. A reference describes facts for lookup. An explanation discusses background, design choices, and tradeoffs. One document uses one mode. The skill also applies `/unslop` to cut filler.",
          "Part 2 argues that most plan modes over-specify implementation details and under-specify everything else. A tutorial starts from the user's side and works back to the design.",
        ],
        skills: ["technical-writing", "unslop", "poteto-mode"],
        prompts: [
          { intent: "Write the tutorial first", text: "/poteto-mode use /technical-writing to write a tutorial for <project>, as if it already exists. show how a user would <first thing they build with it>." },
          { intent: "Check that the approach holds up", text: "/teach me and prove to me why this new approach is superior to <the approach you would have picked>" },
        ],
        done: [
          "A tutorial file exists in the repo, written in one Diátaxis mode.",
          "You can say in one sentence what a user builds in the tutorial.",
          "Each tutorial step names a result the reader can see.",
        ],
        pitfalls: ["Don't let one document try to be a tutorial, a reference, and a design doc at once. Split it into one document per mode."],
        sources: ["p2", "skills/technical-writing"],
      },
      {
        id: "gf-prototype",
        station: "Prototype",
        title: "Prototype a few options and pick one",
        plain: [
          "Use this step when a design decision is open, such as which layout, which interaction, or which approach. If no decision is open, skip it. The Prototype playbook says no decision means no prototype.",
          "Ask for several quick, throwaway versions of the core idea instead of one careful version. The agent builds them in a scratch folder, puts two or three variants behind one switcher, and shows you screenshots or measurements of each.",
          "You pick the direction from evidence, not from a description. The prototype code gets thrown away. Only the decision moves forward.",
        ],
        deeper: [
          "The Prototype playbook is the one place where speed beats polish. There is no planning, no tests, and no abstraction. For a visual question it uses plain HTML, CSS, and JavaScript, or the lightest stack that renders the idea. For a behavior or timing question it writes the smallest script that answers it, then logs the timing or prints the output.",
          "Part 2 names accepting the agent's first design as a common mistake. Prototypes let the agent explore and surprise you, and they answer open questions with evidence instead of waiting for you. If there is no decision to make, there is no prototype. The playbook sends that work to the Feature playbook instead.",
          "Before your app exists, you have no verification skill yet. The agent can still screenshot a scratch page with whatever browser automation it has, such as the `agent-browser` skill on Droid, or print the output of a script.",
        ],
        skills: ["poteto-mode", "principle-exhaust-the-design-space"],
        prompts: [
          { intent: "Compare variants of the core idea", text: "/poteto-mode prototype a few options for <the core interaction>. take videos/screenshots for me to review and choose from" },
        ],
        done: [
          "Two or three variants exist in a scratch folder, outside production code.",
          "You have a screenshot, an output, or a timing for each variant.",
          "You picked one direction and wrote down why.",
          "The agent's reply says plainly that the prototype is throwaway.",
          "Or you skipped this step because no decision was open, and you wrote down that reason.",
        ],
        pitfalls: ["Don't ship prototype code. Hand the chosen direction to `/architect` or the Feature playbook for the real build."],
        sources: ["playbooks/prototype.md", "p2"],
      },
      {
        id: "gf-architect",
        station: "Architect",
        title: "Sketch the shape before filling in code",
        plain: [
          "Use this step when the code will cross function boundaries or add a subsystem. Skip it when the first version is one small script with an obvious shape, and write down why.",
          "`/architect` designs before it builds. It writes how a caller will use the code first, then the types and function signatures, with placeholder bodies. Several agents, often on different models, draft competing designs in parallel. A judge on another model compares them, and the best parts merge into one sketch.",
          "Then the agent fills in the real code against that sketch. If the code keeps fighting the sketch, the agent throws the sketch away and designs again.",
          "Ask for a checkpoint on this line. By default `/architect` goes straight from the sketch to implementation. Here the walking skeleton and the verification skill come next, so the agent should stop after the sketch and show it to you.",
        ],
        deeper: [
          "The phases are ground, sketch, agree, implement, and scrap. Ground runs `/how` and `/why` over the systems the new code touches. On a brand new project with nothing to integrate, the skill skips grounding. Sketch runs `/arena` and requires at least two structurally different candidates. Agree is optional. By default the agent goes straight to implementation unless you ask for a checkpoint.",
          "A wrong sketch shows a pattern, not one bad case. The same workaround appears in unrelated code. Types need escape hatches such as `any` or forced casts. Callers must know the abstraction's internal rules. When that happens, the skill re-grounds, removes code before it adds any, and sketches again.",
          "Part 2 advises against reviewing abstract plans adversarially. Agents start to invent risks and edge cases that never happen. Answer open questions with prototypes and real runs instead.",
        ],
        skills: ["architect", "arena", "how", "why"],
        prompts: [
          { intent: "Design the first real feature and stop before code", text: "/architect this new <feature request> with checkpoint. stop and show me before implementing." },
        ],
        done: [
          "A usage sketch shows how callers will use the code.",
          "At least two structurally different designs were compared.",
          "Types and signatures exist with placeholder bodies, in one file or a module map.",
          "A rationale records which design won and why.",
          "The agent stopped after the sketch and did not implement it.",
          "Or you skipped this step because the shape was obvious, and you wrote down that reason.",
        ],
        pitfalls: ["Don't accept the first design. The skill exists to compare at least two."],
        sources: ["skills/architect", "p2", "guide/04-design.md"],
      },
      {
        id: "gf-skeleton",
        station: "Skeleton",
        title: "Build a walking skeleton that runs",
        plain: [
          "A walking skeleton is the smallest version of your app that starts and does one real thing from end to end. It has almost no features. It proves that the pieces connect and that the app starts from one command.",
          "You need it before the next step. The verification generator learns how to launch and drive your app, so it needs an app that launches.",
        ],
        deeper: [
          "Build the dev experience into the skeleton now. Part 1 lists three needs. You need a way to seed a dev database. You need a way to handle auth, test users, and API calls against a test or staging environment. You need one consistent way to install and start the dev environment. Agents need these as much as people do.",
          "Pick tools an agent can control. Part 1 points out that a web or Electron app can use the Chrome DevTools Protocol (CDP), the protocol behind the browser's developer tools, and that an iOS app can use the simulator. The harder your stack is to debug and control, the harder it is to use agents well.",
          "The skeleton is a Feature task, so `/poteto-mode` uses the Feature playbook. It names the data shape first, then builds, then verifies on the surface a user touches.",
        ],
        skills: ["poteto-mode", "architect"],
        prompts: [
          { intent: "Build the smallest runnable version", text: "/poteto-mode build the smallest version of <project> that starts with one command and lets a user <one real action> end to end. if the app has data or logins, add a seed script and a test user. show me it running." },
        ],
        done: [
          "One documented command starts the app from a clean checkout. The command may assume prerequisites, such as a language runtime, when the README lists them.",
          "One user action works end to end, and you saw it work.",
          "Seed data and a test login exist, if the app needs them.",
        ],
        pitfalls: ["Don't add features before the app starts reliably. A flaky start teaches the verification skill wrong steps."],
        sources: ["p1", "skills/create-verification-skill", "playbooks/feature.md"],
      },
      {
        id: "gf-verify",
        station: "Verify",
        title: "Teach the agent to drive your app",
        plain: [
          "Run `/create-verification-skill`. The agent studies your repository, works out how to launch the app and drive it like a user, and writes a project-local skill for that. From then on, \"verify it in the app\" is a step any agent can run.",
          "The same run starts a Feature Map. That is a folder with one index file and one file per feature. It tells agents what each feature does and how a user reaches it.",
          "Give the skill a control tool, a dependable way to drive the app. It can be the automation you already have. poteto recommends a small CLI built for agents as the upgrade.",
        ],
        deeper: [
          "The generator prefers what the repo already has, such as Playwright or Cypress specs, PTY helpers, or HTTP endpoints. Otherwise it picks a generic recipe. Web and Electron apps get a browser driven over CDP. CLIs and TUIs get a tmux or PTY session. Services get plain HTTP. It writes the skill to a `verify-<app>/` folder, which on Droid is `.factory/skills/verify-<app>/`, with Launch, Doctor, Drive, Evidence, and Cleanup sections. Before it hands the skill over, it runs the skill once end to end and checks that the evidence survived cleanup.",
          "The Feature Map lives in the skill's `features/` folder, and `features/README.md` is the index. Each feature file has an H1 title, a short description, and four H2 sections, `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, and `Gotchas`. The generator seeds the top 3 to 5 features. Part 1 calls the map materialized memory. It is a compact form of what the code already says, kept in the repo, so every contributor's agent reads the same map.",
          "The Build the Lever principle applies here. A tool beats a page of instructions, because agents spend fewer tokens and the results are easier to repeat and test. Part 1 sketches a CLI with commands such as `start`, `stop`, `screenshot`, `video`, `perf-trace`, `seed-db`, and `login --test-user`. poteto wants a composable API, `--dry-run` on any command with destructive side effects, subcommands that reveal features gradually, error messages that tell the agent what to do instead, rich `--help` text, and machine-readable output such as JSON.",
          "You choose the generated skill's name. Part 1 and Part 2 call poteto's example `/control-app`. This playbook writes `/verify-<app>`.",
        ],
        skills: ["create-verification-skill", "principle-build-the-lever"],
        prompts: [
          { intent: "Create the verification skill", text: "/create-verification-skill" },
          {
            intent: "Upgrade to an agent-friendly control CLI",
            text: "/poteto-mode build a small control CLI for <app> that /verify-<app> uses. add subcommands for start, stop, screenshot, seed-db, and login --test-user. add --dry-run to anything destructive, rich --help, JSON output, and error messages that say what to do instead. prove each command against the running app.",
          },
        ],
        done: [
          "A `verify-<app>` skill exists with Launch, Doctor, Drive, Evidence, and Cleanup sections.",
          "The generator ran the skill once end to end, and the evidence still exists after cleanup.",
          "`features/README.md` lists at least one feature, and each listed feature has its own file.",
          "The agent launched the app and showed you a screenshot or output from one feature.",
        ],
        pitfalls: [
          "If the generator's own proof run fails, don't use the output. Fix the app start or report the blocker first.",
          "Don't drive the app by screen coordinates when a stable handle exists, such as an ARIA label, a data attribute, or a route.",
        ],
        sources: ["skills/create-verification-skill", "p1", "guide/06-verify-and-ship.md"],
      },
      {
        id: "gf-feature",
        station: "Build",
        title: "Build features in a loop with proof",
        plain: [
          "Now build one feature at a time, each small enough for one PR. In each prompt, say what to build and ask for proof from the real app. Proof can be a video, screenshots, command output, or HTTP responses, whichever fits your app.",
          "When the next piece of work is too big for one PR, use `gf-plan` to split it first. Then each item of the plan goes through this loop.",
          "The agent uses the Feature playbook. It learns the affected code, designs the change, hands the code to a subagent, and verifies on the same surface a user touches.",
        ],
        deeper: [
          "The Feature playbook runs `how` over the affected code, then `architect`, then writes a throughput checkpoint. The checkpoint names the steps that must run first, the work that can run in parallel, any shared state, and the smallest safe split. A subagent writes the code, and the lead agent reviews the diff. An inconclusive check, or a check on the wrong surface, does not count as a pass.",
          "When the implementation could take several valid shapes, the playbook delegates through `/arena`, so competing versions surface. When the design is contested, it runs `/interrogate`, where reviewers on different models try to break the change.",
          "Keep the Feature Map current. Agents often update it as they work. A new feature should get its own file in `features/`.",
        ],
        skills: ["poteto-mode", "how", "architect", "interrogate"],
        prompts: [
          { intent: "Build a feature with proof", text: "/poteto-mode build <description of feature, any useful context>. use /verify-<app> to verify your changes and show me <a video and screenshots, or the command output or HTTP responses> as proof" },
        ],
        done: [
          "The reply includes proof from the running app, such as a video, screenshots, command output, or HTTP responses.",
          "The todo list showed the Feature playbook steps, and every skipped step had a reason.",
          "The Feature Map has a file for the new feature.",
        ],
        pitfalls: ["Don't accept \"the build passed\" as proof. Ask for the real flow, output, or stored value."],
        sources: ["p1", "playbooks/feature.md"],
      },
      {
        id: "gf-plan",
        station: "Plan",
        title: "Turn the design into small, verifiable PRs",
        plain: [
          "Use this step when the next piece of work is too big for one PR, such as a new subsystem or a change across many files. If the change touches one or two files and the approach is obvious, skip the plan and say so.",
          "Ask for a plan after you like the design. The multi-phase plan playbook writes a checklist where each PR is one small change with its own proof.",
          "The plan is the deliverable. Execution starts only when you say go. Then the agent works through the plan one item at a time, under the playbook the plan names. Each item goes through the `gf-feature` loop of build, verify, and proof.",
        ],
        deeper: [
          "Every PR in the plan has unit, live, and perf verification blocks. The playbook states the rule plainly. Tests alone are not sufficient verification. The live block has ten lanes that drive the real app through its control skill, and one lane runs the same scenario on the main branch and on the PR to catch regressions.",
          "Prototypes settle open questions before the plan is written. The script `skills/poteto-mode/scripts/check-plan.mjs` checks that the plan has every required section and verification block in order, and it flags long dashes, curly quotes, and mid-sentence colons. The agent fixes every line it prints. The plan also names the playbook that runs it, such as Autopilot-full or Autopilot-stack.",
          "poteto doesn't keep plans around. For a project that takes about a week, a plan may be committed for a while so other agents can see the work in progress. It gets deleted when the work is done.",
        ],
        skills: ["poteto-mode", "technical-writing", "swarm"],
        prompts: [{ intent: "Turn a settled design into a plan", text: "/poteto-mode turn this design into a plan" }],
        done: [
          "The plan file exists, and `check-plan.mjs` prints no problems.",
          "Each PR section has its own files, build step, and unit, live, and perf checks.",
          "Prototypes answered the open questions, and the plan's first appendix lists them.",
          "None of the planned work is built yet, and the agent waits for your go.",
          "Or you skipped this step because the work fits in one PR, and you wrote down that reason.",
        ],
        pitfalls: [
          "Don't overcook the plan without evidence. Settle open questions with prototypes first.",
          "Don't review an abstract plan adversarially. Agents invent risks that never happen.",
        ],
        sources: ["playbooks/multi-phase-plan.md", "p2"],
      },
      {
        id: "gf-ship",
        station: "Ship",
        title: "Open the PR, get it green, and land it",
        plain: [
          "Ask the agent to open the PR. It rebases the work into small ordered commits, cleans the diff, writes a short description with evidence, and returns the link.",
          "Then hand the PR to Babysit. It fixes conflicts, answers review comments, and fixes CI until the PR is merge-ready. It never merges. When you want to land, ask for Shipping, which verifies each PR again before it merges anything.",
        ],
        deeper: [
          "The Opening a PR playbook works from a worktree. It runs a cleanup pass over the diff before each commit and `/no-comments` before review, then writes the title in Conventional Commits form. The description has short sections such as Why, What changed, Scope, Blast Radius, and Verification. Five narrow PRs beat one large one, and stacked follow-ups beat a growing branch.",
          "Babysit takes blockers in order. Conflicts come first, then review threads, then CI. It batches known fixes into one push so checks restart once. Comments from people and from an automated reviewer get skeptical triage. A real finding gets a fix. Noise gets dismissed with a reason.",
          "Green is not the same as safe. Shipping sends a fresh agent to verify each PR live, and the agent that judges a change never wrote it. It lands only the unbroken run of verified PRs from the bottom of the stack.",
          "The cleanup pass is `/deslop`, from Cursor's `cursor-team-kit` plugin. On Droid, pvstack maps it to the built-in `simplify` skill. On other tools, ask in plain words to remove narrating comments, unneeded guards, dead compatibility code, and unrelated edits.",
        ],
        skills: ["poteto-mode", "no-comments", "unslop", "interrogate"],
        prompts: [
          { intent: "Open the PR", text: "/poteto-mode open the pr. small ordered commits, evidence in the description." },
          { intent: "Drive the PR to merge-ready", text: "/poteto-mode babysit this pr. get it green." },
          { intent: "Land a verified stack", text: "/poteto-mode land the stack." },
        ],
        done: [
          "The PR is open, not a draft, and its description shows how the change was verified.",
          "Babysit reports the PR as merge-ready. Babysit stops there and never merges.",
          "Before anything merged, a fresh agent verified each PR on the real app.",
          "Shipping merged the PR. Merged is the end state of this step.",
        ],
        pitfalls: ["Don't accept every review comment. Bots and people file real catches and noise in the same list."],
        sources: ["playbooks/opening-a-pr.md", "playbooks/babysit.md", "playbooks/shipping.md", "guide/06-verify-and-ship.md"],
      },
      {
        id: "gf-keep",
        station: "Maintain",
        title: "Keep the verification skill sharp and automate it",
        plain: [
          "Run `/maintain-verification-skill` every day, or put it on a schedule. It drives every feature in the Feature Map and fixes the map when the app has changed.",
          "After a hard task, run `/reflect` so the lesson becomes a skill edit. When your habits settle, `/automate-me` can draft your own mode skill.",
        ],
        deeper: [
          "The maintenance run ends as `clean`, `changed`, or `blocked`. It edits only the verification skill's own folder. A real product bug becomes a report for you, not a doc change.",
          "Once verification is reliable, scheduled or event-triggered runs can do more. They can try to reproduce every user report, and with a good enough Feature Map they can try a fix. The last brownfield step, `bf-keep`, shows that setup.",
        ],
        skills: ["maintain-verification-skill", "reflect", "automate-me"],
        prompts: [
          { intent: "Audit the verification skill", text: "/maintain-verification-skill" },
          { intent: "Capture a lesson after a hard task", text: "/reflect that took way too long. capture what we learned so the next run doesn't repeat it." },
        ],
        done: [
          "A maintenance run finished and reported `clean`, `changed`, or `blocked`.",
          "A daily schedule runs `/maintain-verification-skill`, or you have a daily reminder to run it.",
          "Any `changed` outcome arrived as one PR inside the verification skill's folder.",
        ],
        pitfalls: ["Don't let the Feature Map go stale. A stale map sends agents down paths the app no longer has."],
        sources: ["skills/maintain-verification-skill", "p1", "skills/reflect"],
      },
    ],
  },
  brownfield: {
    name: "Brownfield",
    color: "#f59e0b",
    question: "Working in a codebase that already runs.",
    steps: [
      {
        id: "bf-map",
        station: "Verify",
        title: "Teach the agent to drive your app",
        plain: [
          "Start here, because your app already runs. Run `/create-verification-skill`. The agent studies your repository, launches the app, and writes a project-local skill that drives the app the way a user does.",
          "The same run builds a Feature Map, an index plus one file per feature that says what the feature does and how a user reaches it. On a big codebase, the map saves agents from searching for features every time.",
          "Point the verification skill at a test or sandbox setup, where actions such as payments and emails are fake. Never point it at production.",
        ],
        deeper: [
          "The generator asks you only what it can't learn from the code. It works out what a user touches, how the app starts, what can drive it, what evidence proves behavior, and whether two copies can run side by side. Existing automation such as Playwright or Cypress comes first. A generic recipe, such as a browser over CDP, a PTY session, or plain HTTP, comes only when nothing exists.",
          "Make the dev setup ready for agents while you are here. Part 1 suggests a way to seed a dev database, test users and auth, API calls against a test or staging environment, and one consistent way to bring up the dev environment. Many teams already have these for people.",
          "Then upgrade the control tool. poteto recommends a small CLI made for agents, with composable commands, `--dry-run` on destructive commands, subcommands, descriptive errors, rich `--help`, and JSON output. Part 1 says to make this CLI good and error-free before anything more advanced.",
          "The generator seeds the top 3 to 5 features. Ask for more, or let agents add files as they work. `/maintain-verification-skill` checks the whole map later.",
        ],
        skills: ["create-verification-skill", "principle-build-the-lever"],
        prompts: [
          { intent: "Create the verification skill", text: "/create-verification-skill" },
          { intent: "Map more of the app", text: "/poteto-mode add Feature Map files for <area of the app> to /verify-<app>. drive each feature once and save the evidence." },
          {
            intent: "Upgrade to an agent-friendly control CLI",
            text: "/poteto-mode build a small control CLI for <app> that /verify-<app> uses. add subcommands for start, stop, screenshot, seed-db, and login --test-user. add --dry-run to anything destructive, rich --help, JSON output, and error messages that say what to do instead. prove each command against the running app.",
          },
        ],
        done: [
          "A `verify-<app>` skill exists with Launch, Doctor, Drive, Evidence, and Cleanup sections.",
          "The generator proved the skill once, from launch to cleanup, and the evidence survived.",
          "`features/README.md` indexes your main features, with one file each.",
          "An agent launched the app and drove one feature without your help.",
          "The skill runs against a test or sandbox setup, not production.",
        ],
        pitfalls: ["If the checkout doesn't build or start, fix that first. A skill written against a broken base teaches wrong steps."],
        sources: ["skills/create-verification-skill", "p1", "guide/06-verify-and-ship.md"],
      },
      {
        id: "bf-restate",
        station: "Restate",
        title: "Have the agent restate the problem",
        plain: [
          "Before any fix, ask the agent to read the report and restate the problem in its own words, in plain English. Read its answer. If it chased a red herring, correct it now, while a correction costs one message.",
          "This is the indirect prompt. You draw the problem statement out of the agent instead of handing it your guess.",
        ],
        deeper: [
          "Part 2 lists three gains. The agent compresses a noisy conversation into a structured problem statement. You catch misunderstandings before code exists. Your own assumptions, which may be wrong, don't narrow what the agent considers.",
          "It works for any noisy source, such as a chat thread, an issue, or a support ticket. When the agent's reply is too dense, `/bro` restates the last message in plain words.",
        ],
        skills: ["poteto-mode", "bro"],
        prompts: [
          { intent: "Restate a report before acting", text: "/poteto-mode read this slack thread. restate in your own words and in plain english what you think the underlying issue is" },
          { intent: "Get the last reply in plain words", text: "/bro" },
        ],
        done: [
          "The agent's restatement matches what the reporter meant.",
          "You corrected any misunderstanding before code changed.",
          "No product code changed for the issue yet. A control CLI built in `bf-map` doesn't count.",
        ],
        pitfalls: ["Don't open with your own theory of the cause. It can lead the agent down the wrong path."],
        sources: ["p2", "skills/bro"],
      },
      {
        id: "bf-understand",
        station: "Understand",
        title: "Build a mental model before you edit",
        plain: [
          "Four skills help you understand code you didn't write. `/how` explains how something works now. `/why` digs up why it was built that way. `/teach` combines both into one plain explanation for you. `/recall` rebuilds your own context from past chats.",
          "Use them before you change anything important. An agent that edits without a traced model tends to fix the symptom at the first plausible spot.",
        ],
        deeper: [
          "`/how` sizes the question first. For a narrow question, one agent reads and explains. For a subsystem that spans many files or services, two to four read-only explorers run in parallel, and then a separate agent writes the explanation.",
          "`/why` starts from source control. Then it queries every evidence source your tools can reach, such as the issue tracker, docs, team chat, monitoring, error tracking, and analytics. It separates what it found from what it infers, and it reports a null result as a finding.",
          "`/teach` runs `/how` and `/why`, then explains plainly. It starts with a short answer and adds layers when you ask. Part 2 notes that this research helps the agent too, because it makes the agent read the code before it states things.",
          "`/recall` mines your recent chats, the last 7 days by default, plus the shared record such as PRs, tickets, and errors still firing. It returns a short brief with a status tag on each thread and one next move. To resume one specific chat or branch instead, ask `/poteto-mode` to take over the branch, which runs the Session pickup playbook.",
        ],
        skills: ["how", "why", "teach", "recall"],
        prompts: [
          { intent: "Trace how a subsystem works", text: "/how is <virtualization> implemented?" },
          { intent: "Find out why code is shaped this way", text: "/why are we still stuck on an old version of <node.js>?" },
          { intent: "Understand the agent's choice", text: "/teach me why you implemented it this way and not <other way>. what were the tradeoffs you made and why?" },
          { intent: "Rebuild context from past chats", text: "/recall the work i did yesterday on <topic> and then read this bug report on slack" },
        ],
        done: [
          "You can explain in a few sentences how the code you will change works.",
          "You know about any past fix that was reverted and any report users keep filing, or you know that none is on record.",
          "The explanation cites files, commits, or tickets, not only the agent's word.",
        ],
        pitfalls: ["Don't skip this because the agent will read the code anyway. One `/how` costs less than a second bug."],
        sources: ["p2", "guide/03-understand.md", "skills/how", "skills/why", "skills/teach", "skills/recall", "playbooks/session-pickup.md"],
      },
      {
        id: "bf-job",
        station: "The job",
        title: "Pick the job and state its check",
        plain: [
          "This step is for contained work, such as a bug, a refactor, a perf fix, or a small feature. If the change adds a new boundary, such as a new service or subsystem, or spans many files, go to `bf-design` first. Build it here after the design is settled.",
          "Your prompt tells `/poteto-mode` what kind of job this is, and it picks the matching playbook. Each job has its own first step.",
          "A bug starts with a reproduction. A refactor starts by pinning current behavior. A perf fix starts with a baseline measurement. A feature starts by naming what must not change.",
        ],
        deeper: [
          "**Bug fix.** The agent reproduces the bug itself on the real surface through the verification skill. Then it narrows the cause with runtime evidence. The failing reproduction lands in git history before the fix. If a cheap local test exists, `/tdd` writes the failing test first.",
          "**Refactoring.** The agent records current behavior with a characterization test, a snapshot, or an equivalence script before any code moves. A type check or lint is not a pin. It deletes before it adds, and it reverts the change if the result is not easier to read.",
          "**Perf issue.** The agent captures a baseline trace first and vets every number with `/benchmark-checklist`. It tries the cheapest fixes first, starting with \"don't do it\". Part 1 suggests a `/swarm` that runs the verification skill many times, to confirm the win with a big enough sample.",
          "**Feature.** State the behavior and what must stay the same, such as \"text output stays byte-identical\". The Feature playbook names the data shape, designs, delegates, and verifies.",
        ],
        skills: ["poteto-mode", "tdd", "benchmark-checklist", "swarm"],
        prompts: [
          { intent: "Fix a bug from a reproduction", text: "/poteto-mode repro <the duplicate write> first. if there's a cheap test path, /tdd it. then fix and rerun." },
          { intent: "Refactor with behavior pinned", text: "/poteto-mode move <parsing> into one module, zero behavior change. record the current output first and prove it's unchanged after." },
          {
            intent: "Fix perf against a baseline",
            text: "/poteto-mode improve <the initial loading time of our app>. first use /verify-<app> to take a trace of the status quo, and identify opportunities for improvement. then do a targeted fix and use /verify-<app> + a /swarm to confirm the win",
          },
          { intent: "Add a feature without breaking the old path", text: "/poteto-mode add <a --json flag>. <text output stays byte-identical>. verify both forms." },
        ],
        done: [
          "Your prompt names the job's first step, such as repro first, pin behavior, or baseline first.",
          "Before it changed code, the agent showed the failing reproduction, the pinned output, or the baseline number.",
          "The final reply shows before and after from the same check.",
        ],
        pitfalls: ["Don't state a vibe such as \"make it faster\". Give a number or a fixture to measure."],
        sources: ["guide/05-build-and-clean.md", "playbooks/bug-fix.md", "playbooks/refactoring.md", "playbooks/perf-issue.md", "p1"],
      },
      {
        id: "bf-design",
        station: "Design",
        title: "Prototype and architect the bigger changes",
        plain: [
          "Use this step for a change that adds a new boundary, such as a new service or subsystem, or that spans many files. Do it before any code for that change, then build the change through `bf-job`. Contained work, such as a bug, a refactor, a perf fix, or a small feature, skips this step.",
          "For these bigger changes, design before code. Ask the agent to `/architect` it and to answer open questions with prototypes. Ask to review the design before it builds.",
          "A prototype puts two or three variants behind a switcher in your real app. Your verification skill drives each one, so you choose from screenshots and timings.",
        ],
        deeper: [
          "On brownfield, `/architect` grounds itself first. It runs `/how` over every system the new code touches, and `/why` when the design moves ownership or layers. Then it sketches competing designs in an arena across model families, and a judge on another model compares them.",
          "For an ambiguous production bug, Part 2 starts with research. The agent explores the code, metrics, and history in parallel. It returns what it knows, what data it used, and its best hypotheses.",
          "Part 2 also shows how to redesign a troubled subsystem in three moves. First, recall past fixes and ground with `/how` and `/why`. Next, write a tutorial for the new design. Last, ask `/teach` to prove the new approach is better.",
        ],
        skills: ["architect", "arena", "how", "why", "teach", "recall", "technical-writing"],
        prompts: [
          { intent: "Design a new service boundary", text: "/poteto-mode we need to add <rate limiting for external webhooks>. /architect this first, and answer any open questions with prototypes. let me review before proceeding." },
          { intent: "Prototype options in the real app", text: "/poteto-mode prototype a few options for <feature request>. use /verify-<app> and take videos/screenshots for me to review and choose from" },
          { intent: "Research an ambiguous bug", text: "/poteto-mode investigate why <background workers periodically fail with timeout errors>. give me a breakdown of what we know, what data you used, and your best hypotheses." },
          {
            intent: "Redesign a subsystem from its history",
            text: "/recall my work fixing <virtualization bugs and perf issues> from the past 7 days. use /how and /why to understand how our current <virtualization implementation> works.\nthen use /poteto-mode planning and /technical-writing to come up with <a new virtualization engine that categorically eliminates flickering and jittering>. let's start by writing a tutorial on how i would use this new package to <virtualize a React app>\nafter you write the plan, /teach me and prove to me why this new approach is superior to our current <engine>",
          },
        ],
        done: [
          "At least two structurally different designs were compared.",
          "Each open question has a prototype result, not a guess.",
          "If you asked to review the design, you saw it before implementation started.",
          "Or you skipped this step because the work is contained, and you wrote down that reason.",
        ],
        pitfalls: ["Don't accept the agent's first design.", "Don't review abstract plans adversarially. Prototype instead."],
        sources: ["p2", "skills/architect", "playbooks/prototype.md", "playbooks/investigation.md"],
      },
      {
        id: "bf-migrate",
        station: "Plan",
        title: "Split a big migration into small, verifiable PRs",
        plain: [
          "Use this step only for a big change, such as a migration across many files. A change that fits in one PR skips it, and the agent says why.",
          "A migration across many files needs a plan. Ask for one made of small PRs, each with its own checks and live verification, and say what the end state must match.",
          "The agent writes a checklist you can audit. Each PR can be built, verified, and landed on its own.",
        ],
        deeper: [
          "The multi-phase plan playbook gives every PR unit, live, and perf checks. Live checks drive the real app through the verification skill, and one lane compares the PR with the main branch. A PR that changes an interaction waits for your review with screenshots and a video.",
          "Migrate the callers and delete the old API in the same wave. Converge on the target design rather than keeping temporary compatibility layers. The Refactoring playbook holds the same rule for smaller reshapes.",
          "Large or cross-cutting work routes to `/figure-it-out`, which designs a custom run with a decision log. A standing multi-day program routes to the Orchestrate playbook.",
        ],
        skills: ["poteto-mode", "figure-it-out", "swarm"],
        prompts: [
          {
            intent: "Plan a migration as small PRs",
            text: "/poteto-mode create a plan to migrate <our entire UI library to StyleX>. break the migration into small, verifiable PRs. each PR must have its visual regression tests and live verification steps. i want the final result to be 100% identical compared to the original - bugs included",
          },
        ],
        done: [
          "The plan lists each PR with its dependencies and checks.",
          "`check-plan.mjs` passes on the plan.",
          "The agent waits for your go before it executes.",
          "Or you skipped this step because the change fits in one PR, and you wrote down that reason.",
        ],
        pitfalls: ["Don't keep plans in the codebase after the work ends. Old plans confuse later agents."],
        sources: ["p2", "playbooks/multi-phase-plan.md", "skills/figure-it-out"],
      },
      {
        id: "bf-ship",
        station: "Ship",
        title: "Open the PR, get it green, and land it",
        plain: [
          "Ask the agent to open the PR. It rebases into small ordered commits, cleans the diff, writes a short description with evidence, and returns the link.",
          "Babysit then drives the PR to merge-ready through conflicts, review threads, and CI. It never merges. Shipping verifies each PR again with a fresh agent before it lands anything.",
        ],
        deeper: [
          "A small change you don't fully trust can get `/blast-radius` before review. It finds what the change could break outside the diff, and proves the one fact the change is safe because of by running code.",
          "For a status check without starting the full loop, ask about one PR by number. Babysit answers without polling. Review comments get skeptical triage, and noise gets dismissed with a reason.",
          "Shipping lands only the unbroken run of verified PRs from the bottom of the stack. A verified PR above an unverified one waits.",
        ],
        skills: ["poteto-mode", "blast-radius", "no-comments", "interrogate"],
        prompts: [
          { intent: "Open the PR", text: "/poteto-mode open the pr. small ordered commits, evidence in the description." },
          { intent: "Check what a PR still needs", text: "/poteto-mode check on pr <123>. anything outstanding?" },
          { intent: "Drive the PR to merge-ready", text: "/poteto-mode babysit this pr. get it green." },
          { intent: "Land a verified stack", text: "/poteto-mode land the stack." },
        ],
        done: [
          "The PR is open, not a draft, and its description shows how the change was verified.",
          "Babysit reports the PR as merge-ready. Babysit stops there and never merges.",
          "Before anything merged, a fresh agent verified each PR on the real app.",
          "Shipping merged the PR. Merged is the end state of this step.",
        ],
        pitfalls: ["Don't treat green CI as safe to merge. Shipping exists because green is not the same as verified."],
        sources: ["playbooks/opening-a-pr.md", "playbooks/babysit.md", "playbooks/shipping.md", "skills/blast-radius"],
      },
      {
        id: "bf-keep",
        station: "Maintain",
        title: "Maintain verification and reproduce user reports automatically",
        plain: [
          "Run `/maintain-verification-skill` at least once a day, so the Feature Map keeps up with the app.",
          "Then put the verification skill to work on its own. Set up a scheduled or event-triggered run that watches your feedback channel. For each report, the run tries to reproduce the bug in the real app. If the verification skill and the Feature Map are good enough, it can try a fix too.",
        ],
        deeper: [
          "The repro prompt is one line, the same one poteto types in feedback threads. It checks the bug on the main branch first, so it doesn't fix a bug that is already gone, and it returns a video as proof.",
          "How you wire the trigger depends on your tool. On Droid, use an automation. Elsewhere, use your tool's scheduled or event-triggered runs, or a CI job that starts the agent.",
          "Treat the verification skill like critical infrastructure. Keep improving the control tool. Part 1 even suggests an on-call rotation for it.",
          "When the same correction keeps coming up, run `/correct`. It changes the repo, through architecture, types, lints, or tests, so the next agent can't repeat the mistake.",
        ],
        skills: ["maintain-verification-skill", "correct", "reflect"],
        prompts: [
          { intent: "Audit the verification skill", text: "/maintain-verification-skill" },
          { intent: "Prompt for each user report", text: "/poteto-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof" },
          { intent: "Act when the thread already has the context", text: "/poteto-mode do it" },
        ],
        done: [
          "Daily maintenance runs on a schedule and reports `clean`, `changed`, or `blocked`.",
          "A new user report starts a reproduction attempt without you starting it.",
          "Each attempt returns proof, such as a video or command output, or a clear note that the bug did not reproduce.",
        ],
        pitfalls: ["Don't turn on automatic fixes before reproduction is reliable. Start with runs that only reproduce."],
        sources: ["p1", "p2", "skills/maintain-verification-skill", "skills/correct"],
      },
    ],
  },
};

/** Interchanges both lines pass through, in the order every line visits them. */
export const sharedStations = [{ id: "verify", station: "Verify" }, { id: "ship", station: "Ship" }, { id: "keep", station: "Maintain" }];

/** @type {{ id: string, oneLine: string, trigger: string, needsRunningApp: boolean }[]} id = skill directory name */
export const skills = [
  { id: "poteto-mode", oneLine: "The front door. Describe the goal, and it picks a playbook and runs the other skills as the steps need them.", trigger: "Start almost every real task with it.", needsRunningApp: false },
  { id: "setup-pvstack", oneLine: "Picks a mode on Droid and writes the role sheet that maps each role to a model. Upstream pstack on Cursor has `/setup-pstack` instead.", trigger: "Once after you install pvstack, and again to change a role.", needsRunningApp: false },
  { id: "poteto-help", oneLine: "Answers a question about pstack, such as which skill fits or why a run went wrong, and hands you a prompt to send. It doesn't start the work.", trigger: "When you're stuck, or can't tell which skill, playbook, or principle fits.", needsRunningApp: false },
  { id: "create-verification-skill", oneLine: "Studies your repo and writes a project-local `verify-<app>` skill that launches, drives, and proves your app, plus a Feature Map.", trigger: "As soon as your app starts from one command.", needsRunningApp: true },
  { id: "maintain-verification-skill", oneLine: "Drives every feature in the Feature Map and ships at most one PR of proven fixes to the verification skill.", trigger: "Daily, or whenever the app changed.", needsRunningApp: true },
  { id: "how", oneLine: "Explains how a subsystem works now, with parallel explorers for big questions.", trigger: "Before you change code you don't know.", needsRunningApp: false },
  { id: "why", oneLine: "Digs through history, tickets, docs, and chat to explain why code is shaped the way it is, with cited evidence.", trigger: "When the reason behind the code matters to your change.", needsRunningApp: false },
  { id: "teach", oneLine: "Runs `how` and `why` and explains the result plainly, building up step by step.", trigger: "When you want to understand and trust the agent's work.", needsRunningApp: false },
  { id: "recall", oneLine: "Rebuilds your recent context on a topic from your own chats and the shared record.", trigger: "When you return to a topic cold.", needsRunningApp: false },
  { id: "technical-writing", oneLine: "Writes and reviews docs to a layered standard, starting with one Diátaxis mode per document.", trigger: "For a tutorial, readme, RFC, PR description, or commit message.", needsRunningApp: false },
  { id: "unslop", oneLine: "Removes filler, AI vocabulary, and other tells from prose.", trigger: "On any prose the agent writes.", needsRunningApp: false },
  { id: "architect", oneLine: "Sketches usage, types, and signatures with competing designs before code, then implements against the sketch.", trigger: "Work that crosses a function boundary or adds a subsystem.", needsRunningApp: false },
  { id: "arena", oneLine: "Runs several attempts at the same brief, has a judge on another model compare them, and grafts the best parts into one.", trigger: "A design or code bakeoff, or a second opinion.", needsRunningApp: false },
  { id: "swarm", oneLine: "Fans out workers across slices or races and returns one `PASS`, `ISSUES`, or `BLOCKED` report.", trigger: "Coverage across many parts, or many runs of the same check.", needsRunningApp: false },
  { id: "interrogate", oneLine: "Sends one diff to reviewers on different models and sorts their findings, without applying any.", trigger: "A contested design, or a branch you want challenged before shipping.", needsRunningApp: false },
  { id: "tdd", oneLine: "Writes the smallest failing test first, then the fix, then reruns the test.", trigger: "A bug with a cheap local test path.", needsRunningApp: false },
  { id: "typescript-best-practices", oneLine: "Turns the type-system principles into concrete TypeScript rules, such as discriminated unions, `unknown` at boundaries, and exhaustive variants.", trigger: "Type it when a task touches `.ts` or `.tsx` files. It doesn't load on its own.", needsRunningApp: false },
  { id: "blast-radius", oneLine: "Finds what a change could break outside the diff and proves the key safety fact by running code.", trigger: "A small diff you don't fully trust.", needsRunningApp: false },
  { id: "benchmark-checklist", oneLine: "Vets a measured number before you report or act on it.", trigger: "Any speedup or regression you measured.", needsRunningApp: false },
  { id: "no-comments", oneLine: "Hands the diff's comments to a fresh reviewer that removes all but a short keep list.", trigger: "Before review.", needsRunningApp: false },
  { id: "show-me-your-work", oneLine: "Keeps a decision log with one row per decision, then has a reviewer on another model flag what needs your attention.", trigger: "Long, autonomous, or overnight work.", needsRunningApp: false },
  { id: "figure-it-out", oneLine: "Designs a custom, auditable playbook when no bundled one fits.", trigger: "A large migration, or work you review after stepping away.", needsRunningApp: false },
  { id: "reflect", oneLine: "Reviews the session with three parallel reviewers and proposes skill edits for your approval.", trigger: "Right after a task that taught you something.", needsRunningApp: false },
  { id: "automate-me", oneLine: "Mines your past chats and drafts your own `-mode` skill.", trigger: "When you want agents to follow how you work.", needsRunningApp: false },
  { id: "correct", oneLine: "Changes the repo so a mistake agents keep repeating can't happen again.", trigger: "When you correct agents for the same mistake twice.", needsRunningApp: false },
  { id: "bro", oneLine: "Restates the last message in plain language with no jargon.", trigger: "When a reply is thorough but you still don't know what it said.", needsRunningApp: false },
  { id: "principle-build-the-lever", oneLine: "Build the tool that does or proves the work, instead of doing it by hand.", trigger: "Any non-trivial work, such as a control tool for your app.", needsRunningApp: false },
  { id: "principle-exhaust-the-design-space", oneLine: "Build two or three competing prototypes and compare them before you commit.", trigger: "A new interaction or decision with no precedent.", needsRunningApp: false },
];

/** @type {{ id: string, name: string, when: string, oneLine: string }[]} id = principle skill directory name */
export const principles = [
  { id: "principle-laziness-protocol", name: "Laziness Protocol", when: "When you size a diff or feel tempted to add a layer.", oneLine: "Prefer deletion and the smallest change that solves the problem." },
  { id: "principle-foundational-thinking", name: "Foundational Thinking", when: "Before you write logic.", oneLine: "Choose the core types and data structures first, so the rest of the code becomes obvious." },
  { id: "principle-redesign-from-first-principles", name: "Redesign from First Principles", when: "When a new requirement lands on an existing design.", oneLine: "Redesign as if the requirement had been there from day one, instead of bolting it on." },
  { id: "principle-attack-the-premise", name: "Attack the Premise", when: "When two or more fixes that share one assumption have failed the same check.", oneLine: "Stop writing fixes and question the shared assumption instead." },
  { id: "principle-subtract-before-you-add", name: "Subtract Before You Add", when: "When you plan an addition, refactor, or rewrite.", oneLine: "Remove dead weight first, then build on the simpler base." },
  { id: "principle-minimize-reader-load", name: "Minimize Reader Load", when: "When code is hard to follow.", oneLine: "Cut the layers and hidden state a reader must hold in their head." },
  { id: "principle-outcome-oriented-execution", name: "Outcome-Oriented Execution", when: "During a planned rewrite or migration with clear phases.", oneLine: "Move straight to the target design instead of keeping throwaway compatibility code." },
  { id: "principle-experience-first", name: "Experience First", when: "When a product or UX choice trades user delight against convenience for the builder.", oneLine: "Choose what is better for the user, even when it is harder to build." },
  { id: "principle-exhaust-the-design-space", name: "Exhaust the Design Space", when: "When a decision has no precedent.", oneLine: "Build two or three competing prototypes and compare them before you commit." },
  { id: "principle-build-the-lever", name: "Build the Lever", when: "On any non-trivial work.", oneLine: "Build the script or tool that does or proves the work, so a reviewer can rerun it." },
  { id: "principle-model-the-domain", name: "Model the Domain", when: "When logic branches a lot or repeats the same assumption across files.", oneLine: "Put the rules in one structure, such as a state machine or a table, instead of scattered conditionals." },
  { id: "principle-boundary-discipline", name: "Boundary Discipline", when: "When you wire validation, error handling, or a framework adapter.", oneLine: "Check data where it enters the system, then trust your internal types." },
  { id: "principle-type-system-discipline", name: "Type System Discipline", when: "When you design a type or a function signature.", oneLine: "Make invalid states impossible to write down." },
  { id: "principle-make-operations-idempotent", name: "Make Operations Idempotent", when: "When a command may run again after a crash or retry.", oneLine: "Running it twice must end in the same state as running it once." },
  { id: "principle-migrate-callers-then-delete-legacy-apis", name: "Migrate Callers Then Delete Legacy APIs", when: "When a new internal API replaces an old one.", oneLine: "Move every caller and delete the old API in the same wave." },
  { id: "principle-separate-before-serializing-shared-state", name: "Separate Before Serializing Shared State", when: "When two agents or processes might write the same file, branch, or key.", oneLine: "Remove the sharing first, for example with one worktree each, before you add locks." },
  { id: "principle-prove-it-works", name: "Prove It Works", when: "Before you call anything done.", oneLine: "Check the real thing, not a proxy such as a green build." },
  { id: "principle-fix-root-causes", name: "Fix Root Causes", when: "When you debug.", oneLine: "Reproduce first, then trace the symptom to its cause and fix it there." },
  { id: "principle-sequence-verifiable-units", name: "Sequence Work into Verifiable Units", when: "When work has many steps, or when you stack commits and PRs.", oneLine: "Split the work into small units that each end in a check, and verify each one before the next." },
  { id: "principle-test-behavior-not-implementation", name: "Test Behavior, Not Implementation", when: "When you write, change, or keep a test.", oneLine: "Call the code the way users do and compare the result to a literal expected value." },
  { id: "principle-explain-the-number", name: "Explain the Number", when: "Before you trust or report a number you measured.", oneLine: "Find what limits the number, and rule out that it measured something else." },
  { id: "principle-guard-the-context-window", name: "Guard the Context Window", when: "When large outputs or long files start to fill the chat.", oneLine: "Send bulk reading to subagents and keep only summaries in the main chat." },
  { id: "principle-never-block-on-the-human", name: "Never Block on the Human", when: "When the agent wants to ask permission for reversible work.", oneLine: "Proceed, show the result, and let the person correct course. Ask only before irreversible actions." },
  { id: "principle-encode-lessons-in-structure", name: "Encode Lessons in Structure", when: "When you give the same instruction a second time.", oneLine: "Turn it into a lint, check, or script instead of more text." },
];

/** @type {{ id: string, title: string, mode: Mode | 'any', prompt: string, why: string, sources: SourceRef[] }[]} */
export const recipes = [
  { id: "do-it", title: "The thread already says enough", mode: "any", prompt: "/poteto-mode do it", why: "When the context is already rich, a short prompt is enough. Typing `/poteto-mode` with it brings the mode back for this turn, and the playbook holds the structure.", sources: ["p2", "guide/02-poteto-mode.md"] },
  { id: "restate", title: "Restate a report in plain English", mode: "brownfield", prompt: "/poteto-mode read this slack thread. restate in your own words and in plain english what you think the underlying issue is", why: "You catch a misunderstanding before any code exists, and your own guesses don't steer the agent.", sources: ["p2"] },
  { id: "first-bug", title: "Fix a bug with a goal and a check", mode: "brownfield", prompt: "/poteto-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify.", why: "\"repro first\" and a checkable outcome are all the routing signal `/poteto-mode` needs.", sources: ["guide/README.md"] },
  { id: "repro-video", title: "Reproduce a report and prove the fix", mode: "brownfield", prompt: "/poteto-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof", why: "It checks the bug still exists on main before fixing, and the video is the proof. For an app with no screen, ask for command output or HTTP responses instead.", sources: ["p2"] },
  { id: "tdd-bug", title: "Fix a bug through a failing test", mode: "brownfield", prompt: "/poteto-mode repro the duplicate write first. if there's a cheap test path, /tdd it. then fix and rerun.", why: "\"if there's a cheap test path\" lets the agent use the real command when a test would need brittle mocks.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "investigate", title: "Research an ambiguous bug", mode: "brownfield", prompt: "/poteto-mode investigate why <background workers periodically fail with timeout errors>. give me a breakdown of what we know, what data you used, and your best hypotheses.", why: "The agent explores code, metrics, and history in parallel and separates evidence from guesses.", sources: ["p2"] },
  { id: "how-then-why", title: "Understand an unfamiliar subsystem", mode: "brownfield", prompt: "use /how first to understand how this initialization works. then use /why to figure out why it broke recently.", why: "Mechanics first, history second. Each report names the sources it searched.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "teach-tradeoffs", title: "Make the agent defend its choice", mode: "any", prompt: "/teach me why you implemented it this way and not <other way>. what were the tradeoffs you made and why?", why: "Explaining forces the agent to read the code and back its claims, which helps you trust the work.", sources: ["p2"] },
  { id: "recall", title: "Pick up where you left off", mode: "brownfield", prompt: "/recall the work i did yesterday on <topic> and then read this bug report on slack", why: "Past chats hold context that a fresh agent would otherwise rebuild from scratch. To resume one specific chat or branch, the Session pickup playbook fits better.", sources: ["p2", "playbooks/session-pickup.md"] },
  { id: "tutorial-first", title: "Design a package by writing its tutorial", mode: "greenfield", prompt: "/poteto-mode planning and /technical-writing to come up with <a new package>. let's start by writing a tutorial on how i would use this new package to <do the job>\nafter you write the plan, /teach me and prove to me why this new approach is superior to <the alternative>", why: "A tutorial gives the agent a concrete target to check its work against, and shows you what it will build.", sources: ["p2"] },
  { id: "prototype", title: "Prototype a few options", mode: "any", prompt: "/poteto-mode prototype a few options for <feature request>. use /verify-<app> and take videos/screenshots for me to review and choose from", why: "You choose from evidence, and the agent gets room to surprise you.", sources: ["p2", "playbooks/prototype.md"] },
  { id: "architect", title: "Sketch the design first", mode: "any", prompt: "/architect this new <feature request>", why: "Competing designs from different models get compared before code locks in a shape.", sources: ["p2", "skills/architect"] },
  { id: "service-boundary", title: "Design a new service boundary", mode: "brownfield", prompt: "/poteto-mode we need to add <rate limiting for external webhooks>. /architect this first, and answer any open questions with prototypes. let me review before proceeding.", why: "Grounding, competing designs, and throwaway prototypes come before the interface is fixed.", sources: ["p2"] },
  { id: "plan", title: "Turn a settled design into a plan", mode: "any", prompt: "/poteto-mode turn this design into a plan", why: "Every task in the plan is built around proof, and a script checks the plan's structure.", sources: ["p2", "playbooks/multi-phase-plan.md"] },
  { id: "migration", title: "Plan a migration as small PRs", mode: "brownfield", prompt: "/poteto-mode create a plan to migrate <our entire UI library to StyleX>. break the migration into small, verifiable PRs. each PR must have its visual regression tests and live verification steps. i want the final result to be 100% identical compared to the original - bugs included", why: "Each unit can be built, verified, and landed safely, and the end state has a clear test.", sources: ["p2"] },
  { id: "build-feature", title: "Build a feature with proof", mode: "any", prompt: "/poteto-mode build <description of feature, any useful context>. use /verify-<app> to verify your changes and show me <a video and screenshots, or the command output or HTTP responses> as proof", why: "The agent checks its own work in the real app and hands you the evidence that fits your app.", sources: ["p1"] },
  { id: "perf-swarm", title: "Fix perf and confirm the win", mode: "brownfield", prompt: "/poteto-mode improve <the initial loading time of our app>. first use /verify-<app> to take a trace of the status quo, and identify opportunities for improvement. then do a targeted fix and use /verify-<app> + a /swarm to confirm the win", why: "A baseline trace comes first, and a swarm repeats the measurement for a big enough sample.", sources: ["p1"] },
  { id: "refactor-pin", title: "Refactor with behavior pinned", mode: "brownfield", prompt: "/poteto-mode move parsing into one module, zero behavior change. record the current output first and prove it's unchanged after.", why: "The pin is recorded before structure moves, so \"unchanged\" has proof.", sources: ["guide/05-build-and-clean.md"] },
  { id: "create-verify", title: "Teach the agent to drive your app", mode: "any", prompt: "/create-verification-skill", why: "It writes a project-local skill and a Feature Map, then proves the skill once before handing it over.", sources: ["p1", "skills/create-verification-skill"] },
  { id: "maintain-verify", title: "Keep the verification skill honest", mode: "any", prompt: "/maintain-verification-skill", why: "It drives every mapped feature and fixes drift, without touching product code.", sources: ["p1", "skills/maintain-verification-skill"] },
  { id: "swarm-slices", title: "Check independent slices in parallel", mode: "any", prompt: "/swarm check every package under packages/ against its check.sh. one worker per package. one report.", why: "Each worker owns one slice, and you get one report instead of raw worker dumps.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "arena-second-opinion", title: "Get a second opinion on a design", mode: "any", prompt: "ask /arena for a second opinion on this thread and our approach", why: "Your design becomes one candidate among several, and the synthesis says whether the panel found something better.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "interrogate-branch", title: "Review a branch skeptically", mode: "any", prompt: "/interrogate the whole branch, but skeptically. don't change anything yet. no nitpicks unless it's an actual bug or regression in behavior.", why: "\"don't change anything yet\" keeps it read-only, and the nitpick rule filters out noise.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "open-pr", title: "Open a focused PR", mode: "any", prompt: "/poteto-mode open the pr. small ordered commits, evidence in the description.", why: "The playbook cleans the diff and writes a short description with the proof.", sources: ["guide/06-verify-and-ship.md"] },
  { id: "babysit", title: "Drive a PR to merge-ready", mode: "any", prompt: "/poteto-mode babysit this pr. get it green.", why: "Conflicts, review threads, and CI get handled in order, with one push per batch of fixes.", sources: ["guide/06-verify-and-ship.md"] },
  { id: "overnight", title: "Keep a run honest while you sleep", mode: "any", prompt: "im going to bed, keep going autonomously until every fixture passes. do not stop. keep a decision log i can audit in the morning.", why: "A checkable finish condition and a decision log make unattended work reviewable.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "morning-audit", title: "Audit last night's run", mode: "any", prompt: "/show-me-your-work catch me up on what you did last night", why: "A reviewer on another model reads the trail first, and the reply ends with what deserves your attention.", sources: ["guide/07-overnight.md"] },
  { id: "prove-it", title: "Redirect a run that claims success too early", mode: "any", prompt: "apply prove it works. show me the real output, not the build log.", why: "A principle name points at a full rule the agent has already read.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "bro", title: "Get the reply in plain words", mode: "any", prompt: "/bro", why: "It restates the last message with no jargon, shorter.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { id: "poteto-help", title: "Ask how without starting the work", mode: "any", prompt: "/poteto-help how do i keep poteto-mode on for a whole task?", why: "You get an answer, a prompt to send, and a link to the source. Nothing runs until you send that prompt.", sources: ["guide/10-recipes-and-pitfalls.md", "skills/poteto-help"] },
  { id: "reflect", title: "Capture a lesson after a hard task", mode: "any", prompt: "/reflect that took way too long. capture what we learned so the next run doesn't repeat it.", why: "Lessons become proposed skill edits, and nothing changes until you approve.", sources: ["guide/09-make-it-yours.md"] },
];

/** @type {{ dont: string, do: string, sources: SourceRef[] }[]} */
export const pitfalls = [
  { dont: "List the skills you want run, such as \"use /how then /architect then /arena\".", do: "State the goal and constraints. Name a skill only to override a default.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { dont: "Give a vague finish condition, such as \"make it better\".", do: "Give a command or artifact that can pass or fail.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { dont: "Run parallel agents in one worktree.", do: "Ask for a separate worktree per attempt.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { dont: "Use `/arena` for coverage.", do: "Use `/swarm` to split slices or race declared arms. Use `/arena` when every agent should attempt the same design or code brief.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { dont: "Accept every review comment.", do: "Fix the real findings and dismiss noise with a reason. `/interrogate` sorts findings into act-on and dismissed buckets, and you can override either way.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { dont: "Treat `auto` as a model name.", do: "Read `auto`, `inherit-parent`, and pvstack's `inherit` as one instruction. The role runs on the parent chat's model.", sources: ["guide/10-recipes-and-pitfalls.md", "skills/setup-pvstack"] },
  { dont: "Report success off a green build.", do: "Ask for the real command, flow, stored value, or profile, and expect the evidence in the reply.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { dont: "Write a `SKILL.md` freehand.", do: "Route it through the Authoring or modifying a skill playbook, so validation and review happen.", sources: ["guide/10-recipes-and-pitfalls.md"] },
  { dont: "Accept the agent's first design.", do: "Ask for prototypes, or run `/architect`, which compares at least two designs before it builds.", sources: ["p2"] },
  { dont: "Overcook the plan before you have evidence.", do: "Answer open questions with prototypes and real runs. Then turn the settled design into a plan.", sources: ["p2"] },
  { dont: "Skip verification setup and check every change by hand.", do: "Run `/create-verification-skill` as soon as the app starts, so agents can prove their own work.", sources: ["p1", "skills/create-verification-skill"] },
  { dont: "Expect `/poteto-mode` to stay on for the whole chat after you type it once.", do: "Type `/poteto-mode` at the start of each new task. On Cursor, start it as a Custom Mode with Option+Enter or Alt+Enter, and it stays on every turn until you exit it.", sources: ["skills/poteto-help", "guide/01-setup.md"] },
  { dont: "Ask a new question mid-chat and expect the mode to treat it as new.", do: "Say `new task` first, so `/poteto-mode` picks a fresh playbook. Add \"don't change any code yet\" when you only want an answer.", sources: ["guide/02-poteto-mode.md", "skills/poteto-help"] },
  { dont: "Wait for a skill to load on its own because the task matches it.", do: "Type the skill's name, or let `/poteto-mode` run it as a step. `/poteto-mode` doesn't run every skill, so name one such as `/typescript-best-practices` when you want it. Ask `/poteto-help` when you can't tell which one fits.", sources: ["skills/poteto-help", "guide/05-build-and-clean.md"] },
  { dont: "Run every small, obvious edit through `/poteto-mode`.", do: "Save `/poteto-mode` for work that needs rigor. To spend fewer tokens, rerun `/setup-pvstack` and pick Budget mode, set a role to `inherit` so it runs on the chat's model, or shorten a panel list, because each entry runs one subagent.", sources: ["skills/poteto-help", "skills/setup-pvstack", "guide/01-setup.md"] },
];

/** @type {{ term: string, plain: string }[]} */
export const glossary = [
  { term: "Agent", plain: "An AI model that can read files, run commands, and edit code to finish a task." },
  { term: "Skill", plain: "A folder of instructions, with a `SKILL.md` file, that your agent loads when you call it by name, or when another skill such as `/poteto-mode` runs it." },
  { term: "Slash command", plain: "A skill called by typing `/` and its name, such as `/poteto-mode`. Codex uses `$` instead." },
  { term: "Playbook", plain: "A step-by-step workflow inside `poteto-mode`, such as Bug fix or Feature. The agent picks one for you. It is not a separate skill." },
  { term: "Principle", plain: "One of 24 short rules, such as Prove It Works. Say a principle's name to steer the agent mid-task." },
  { term: "Subagent", plain: "A helper agent that the main agent starts for one part of the work. It reports back when it finishes." },
  { term: "Git worktree", plain: "A second checkout of the same repository in another folder, on its own branch. Parallel agents each get one so they don't overwrite each other." },
  { term: "Verification skill", plain: "A project-local skill, named `verify-<app>` by the generator, that tells agents how to launch your app, drive it like a user, and capture proof. poteto's articles call theirs `/control-app`." },
  { term: "Control tool", plain: "The thing the verification skill uses to drive the app, such as Playwright, a browser over CDP, a terminal session, or a small CLI you build for agents." },
  { term: "CDP", plain: "The Chrome DevTools Protocol. It lets a program control a browser or Electron app the way the browser's developer tools do." },
  { term: "Feature Map", plain: "A folder inside the verification skill with an index file and one file per feature. Each file says what the feature does, how a user reaches it, how to drive it, and what to watch out for." },
  { term: "Materialized memory", plain: "poteto's name for the Feature Map. It is a compact, shared copy of what the code already says, kept in the repo." },
  { term: "Walking skeleton", plain: "The smallest version of an app that starts from one command and does one real thing end to end." },
  { term: "Greenfield", plain: "A new project that starts from an empty repo or an idea." },
  { term: "Brownfield", plain: "An existing codebase that already runs." },
  { term: "Prototype", plain: "A throwaway sketch, often two or three variants behind a switcher, built to make one decision from evidence." },
  { term: "Swarm", plain: "Many workers that each cover one slice, or race the same brief, then return one combined report. Run it with `/swarm`." },
  { term: "Arena", plain: "Several agents attempt the same brief, a judge compares them, and the best parts merge into one result. Run it with `/arena`." },
  { term: "Finish condition", plain: "A check that passes or fails, such as \"all fixtures pass\". The agent works until it passes." },
  { term: "Decision log", plain: "A table with one row per decision, saying what the agent chose, why, and where the evidence is. `/show-me-your-work` keeps it." },
  { term: "PR", plain: "A pull request, a proposed change that others review before it merges into the main branch." },
  { term: "PR stack", plain: "A chain of small PRs where each one builds on the one below it. You land them from the bottom up." },
  { term: "Role sheet", plain: "The file `~/.factory/pvstack-models.md`. It maps each kind of work, such as code or review, to a droid with a fixed model. `/setup-pvstack` writes it." },
  { term: "Droid", plain: "Factory's coding agent. In pvstack, a droid named `pv-*` is also a preset agent with one fixed model and effort level." },
  { term: "Custom Mode", plain: "A Cursor feature that keeps a skill such as `/poteto-mode` on every turn until you exit it. Pick the skill from the `/` menu with Option+Enter on Mac or Alt+Enter on Windows. Without one, typing `/poteto-mode` applies it to one request, and it may fade as the chat moves on." },
];

/** Intro text for the generated model-routing table. Rows come from plugins/pvstack/skills/setup-pvstack/modes/*.md. */
export const routing = {
  plain: [
    "pstack sends different jobs to different models. A fast, cheap model can search code. A careful model can write prose and make judgment calls. A strong model takes the hardest changes. Each kind of job is called a role.",
    "pvstack picks the model for each role from VulcanBench, an open benchmark of real engineering tasks that reports score, time, and cost. `/setup-pvstack` offers six modes. Balanced is the default, and Budget, Quality, Fast, Safe and Open trade score, minutes, cost and safety differently.",
    "You can override any role. The table below lists every role and the droid each mode gives it. A droid here is a preset agent with one fixed model and effort level.",
  ],
  deeper: [
    "In Balanced mode, code work goes to GPT-6.1 Sol at high effort. On VulcanBench's Frontier v4 board, it passes all 23 tasks with a score of 88.23. That is 97% of Opus 5.5's best score of 91.11, at $0.33 per task against $3.27.",
    "Judgment and prose go to Claude Opus 5.5 at medium effort, which passes 23 of 23 tasks at 90.86. Its xhigh and max levels score lower and cost more. On VulcanBench's Safety v1 tasks, Opus reported 64 of 100 planted repository notes to the user, and Grok 4.7 reported none of 80. That matters for roles that write what you read.",
    "The hardest changes in Balanced mode go to Grok 4.7 at xhigh effort. It is the top Frontier v4 cell at 93.15, with every task passed. It takes 28.5 minutes per task, so it is kept for the few changes where a miss costs the most. Review panels mix models from three labs, because findings that independent models agree on carry more weight.",
    "Budget mode uses DeepSeek V4.1 Flash for code, search, and mechanical work. That pick is inferred, because VulcanBench measured the older V4-Flash on its retired v3 board, and v3 numbers can't be compared with v4. Every Frontier v4 run also used another agent tool, not Droid, and VulcanBench measured tool effects of up to about 20 points on a single model. Treat every pick as a strong starting point, and read `docs/model-evidence.md` for each number and its source.",
    "The other four modes read the same board. Quality ignores cost and takes the top score. Fast takes the quickest cell that still passes the tasks. Safe keeps Grok 4.7 off judgment, code, and the hardest changes, on its Safety v1 result. Open stays on open-weights models, which today means DeepSeek V4.1 Flash on every role.",
  ],
};
