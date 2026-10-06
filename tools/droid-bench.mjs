#!/usr/bin/env node
// Runs VulcanBench Python Suite v1 tasks through `droid exec` for pv-* cells and grades them
// with each task's hidden tests. Functional pass rate only: the combined score's Code quality
// third needs VulcanBench's judge models, so these numbers never mix with the board's.
//
//   node tools/droid-bench.mjs validate --suite <VulcanBench>/tasks/python-1 --python <venv>/bin
//   node tools/droid-bench.mjs run --suite ... --python ... --cells pv-ds-low,pv-sol-high --repeats 3 --jobs 6
//   node tools/droid-bench.mjs summarize        rewrite data/droid-bench.json from the run log

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CELLS } from "./droids.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runLog = path.join(root, "data", "droid-bench-runs.jsonl");
const summaryFile = path.join(root, "data", "droid-bench.json");
const AGENT_TIMEOUT_MS = 45 * 60 * 1000;

const PROMPT = (issue) => `${issue.trim()}

Fix this issue in the repository in the current directory. Change only files inside this directory.
Do not use the network, and do not look up the upstream fix. Hidden tests will check the observable
behavior described above. When you are done, stop; do not commit.
`;

function args() {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = { cmd };
  for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, "")] = rest[i + 1];
  return opts;
}

function sh(cmd, argv, { cwd, env, timeoutMs } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, argv, { cwd, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], detached: true });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = timeoutMs && setTimeout(() => {
      timedOut = true;
      try { process.kill(-child.pid, "SIGKILL"); } catch {}
    }, timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}

function loadTasks(suite) {
  return fs.readdirSync(suite)
    .filter((d) => fs.existsSync(path.join(suite, d, "metadata.json")))
    .sort()
    .map((id) => {
      const dir = path.join(suite, id);
      const meta = JSON.parse(fs.readFileSync(path.join(dir, "metadata.json"), "utf8"));
      return { id, dir, meta };
    });
}

function copyRepo(task, dest) {
  fs.cpSync(path.join(task.dir, "repo"), dest, { recursive: true });
}

async function initGit(dir) {
  await sh("git", ["init", "-q"], { cwd: dir });
  await sh("git", ["add", "-A"], { cwd: dir });
  await sh("git", ["-c", "user.email=bench@local", "-c", "user.name=bench", "commit", "-q", "-m", "base"], { cwd: dir });
}

async function grade(task, repoDir, python) {
  const gradeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dbg-"));
  try {
    fs.cpSync(repoDir, gradeDir, { recursive: true, filter: (src) => !src.includes(`${path.sep}.git`) });
    fs.cpSync(path.join(task.dir, "tests"), gradeDir, { recursive: true });
    const env = { PATH: `${python}:${process.env.PATH}`, PYTHONDONTWRITEBYTECODE: "1" };
    const timeoutMs = (task.meta.test_timeout_s ?? 120) * 1000;
    const results = {};
    for (const kind of ["fail_to_pass", "pass_to_pass"]) {
      results[kind] = [];
      for (const t of task.meta.tests[kind] ?? []) {
        const r = await sh("bash", ["-c", t.cmd], { cwd: gradeDir, env, timeoutMs });
        results[kind].push({ name: t.name, ok: r.code === 0 && !r.timedOut });
      }
    }
    const all = [...results.fail_to_pass, ...results.pass_to_pass];
    return {
      f2p: results.fail_to_pass.filter((t) => t.ok).length,
      f2pTotal: results.fail_to_pass.length,
      p2p: results.pass_to_pass.filter((t) => t.ok).length,
      p2pTotal: results.pass_to_pass.length,
      functional: all.filter((t) => t.ok).length / all.length,
      resolved: all.every((t) => t.ok),
    };
  } finally {
    fs.rmSync(gradeDir, { recursive: true, force: true });
  }
}

async function validate(opts) {
  let bad = 0;
  for (const task of loadTasks(opts.suite)) {
    const work = fs.mkdtempSync(path.join(os.tmpdir(), "dbv-"));
    try {
      const repo = path.join(work, "repo");
      copyRepo(task, repo);
      await initGit(repo);
      const empty = await grade(task, repo, opts.python);
      const applied = await sh("git", ["apply", path.join(task.dir, "gold_patch.diff")], { cwd: repo });
      const gold = await grade(task, repo, opts.python);
      const ok = applied.code === 0 && gold.resolved && empty.f2p === 0 && empty.p2p === empty.p2pTotal;
      if (!ok) bad++;
      console.log(`${ok ? "ok  " : "BAD "} ${task.id} empty f2p ${empty.f2p}/${empty.f2pTotal} p2p ${empty.p2p}/${empty.p2pTotal}; gold ${gold.f2p}/${gold.f2pTotal} ${gold.p2p}/${gold.p2pTotal}${applied.code ? " (patch failed)" : ""}`);
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }
  console.log(bad ? `${bad} task(s) fail the gold/empty check.` : "Every task: empty fails its fail_to_pass tests, gold passes all.");
  process.exit(bad ? 1 : 0);
}

const readRuns = () =>
  fs.existsSync(runLog) ? fs.readFileSync(runLog, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];

function parseExec(stdout) {
  try {
    const out = JSON.parse(stdout.trim().split("\n").at(-1));
    return { usage: out.usage ?? null, isError: Boolean(out.is_error), numTurns: out.num_turns ?? null };
  } catch {
    return { usage: null, isError: true, numTurns: null };
  }
}

async function runOne(task, cell, rep, python) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "dbr-"));
  try {
    const repo = path.join(work, "repo");
    copyRepo(task, repo);
    await initGit(repo);
    const promptFile = path.join(work, "prompt.md");
    fs.writeFileSync(promptFile, PROMPT(fs.readFileSync(path.join(task.dir, "issue.md"), "utf8")));
    const started = Date.now();
    const r = await sh("droid", ["exec", "-m", cell.model, "-r", cell.effort, "--auto", "high", "-o", "json", "--cwd", repo, "-f", promptFile], {
      cwd: repo,
      timeoutMs: AGENT_TIMEOUT_MS,
    });
    const minutes = (Date.now() - started) / 60000;
    const exec = parseExec(r.stdout);
    const diff = await sh("git", ["status", "--porcelain"], { cwd: repo });
    const g = await grade(task, repo, python);
    return {
      task: task.id, cell: cell.name, rep, minutes: +minutes.toFixed(2), timedOut: r.timedOut, exitCode: r.code,
      agentError: exec.isError, usage: exec.usage, numTurns: exec.numTurns, changed: diff.stdout.trim() !== "", ...g,
      stderrTail: r.code ? r.stderr.slice(-400) : undefined,
    };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

async function run(opts) {
  const tasks = loadTasks(opts.suite).filter((t) => !opts.tasks || opts.tasks.split(",").includes(t.id));
  const cells = opts.cells.split(",").map((name) => CELLS.find((c) => c.name === name) ?? (() => { throw new Error(`unknown cell ${name}`); })());
  const repeats = Number(opts.repeats ?? 1);
  const done = new Set(readRuns().map((r) => `${r.task}|${r.cell}|${r.rep}`));
  const queue = [];
  for (let rep = 1; rep <= repeats; rep++)
    for (const task of tasks) for (const cell of cells) if (!done.has(`${task.id}|${cell.name}|${rep}`)) queue.push({ task, cell, rep });
  console.log(`${queue.length} run(s) queued, ${done.size} already logged.`);
  fs.mkdirSync(path.dirname(runLog), { recursive: true });
  let finished = 0;
  const worker = async () => {
    while (queue.length) {
      const { task, cell, rep } = queue.shift();
      const result = await runOne(task, cell, rep, opts.python);
      fs.appendFileSync(runLog, JSON.stringify(result) + "\n");
      finished++;
      console.log(`[${finished}] ${result.resolved ? "PASS" : "fail"} ${cell.name} ${task.id} #${rep} ${result.minutes} min${result.timedOut ? " TIMEOUT" : ""}${result.agentError ? " AGENT-ERROR" : ""}`);
    }
  };
  await Promise.all(Array.from({ length: Number(opts.jobs ?? 4) }, worker));
  summarize();
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null;
};

function summarize() {
  const text = JSON.stringify(summaryOf(readRuns()), null, 2) + "\n";
  fs.writeFileSync(summaryFile, text);
  console.log(text);
}

function check() {
  const want = JSON.stringify(summaryOf(readRuns()), null, 2) + "\n";
  if (!fs.existsSync(summaryFile) || fs.readFileSync(summaryFile, "utf8") !== want) {
    console.error("data/droid-bench.json does not match data/droid-bench-runs.jsonl. Run node tools/droid-bench.mjs summarize.");
    process.exit(1);
  }
  console.log("data/droid-bench.json matches the run log.");
}

function summaryOf(runs) {
  const cells = {};
  for (const name of [...new Set(runs.map((r) => r.cell))].sort()) {
    const mine = runs.filter((r) => r.cell === name);
    const infra = mine.filter((r) => r.timedOut || r.agentError);
    const graded = mine.filter((r) => !r.timedOut && !r.agentError);
    const reps = [...new Set(graded.map((r) => r.rep))].sort();
    const perRep = reps.map((rep) => graded.filter((r) => r.rep === rep)).map((rs) => rs.filter((r) => r.resolved).length / rs.length);
    cells[name] = {
      runs: mine.length,
      infraFailures: infra.length,
      resolvedRate: +(graded.filter((r) => r.resolved).length / graded.length).toFixed(4),
      resolvedRateRange: perRep.length ? [+Math.min(...perRep).toFixed(4), +Math.max(...perRep).toFixed(4)] : null,
      functional: +(graded.reduce((s, r) => s + r.functional, 0) / graded.length).toFixed(4),
      medianMinutes: +median(graded.map((r) => r.minutes)).toFixed(2),
      medianCredits: median(graded.map((r) => r.usage?.factory_credits).filter((c) => c != null)),
      tasks: new Set(mine.map((r) => r.task)).size,
      repeats: reps.length,
    };
  }
  return { suite: "VulcanBench Python Suite v1 (python-1)", harness: "droid exec --auto high", metric: "hidden-test resolution, functional only", cells };
}

const opts = args();
if (opts.cmd === "validate") await validate(opts);
else if (opts.cmd === "run") await run(opts);
else if (opts.cmd === "summarize") summarize();
else if (opts.cmd === "check") check();
else {
  console.error("usage: droid-bench.mjs validate|run|summarize|check [--suite dir] [--python bin] [--cells a,b] [--repeats n] [--jobs n] [--tasks a,b]");
  process.exit(2);
}
