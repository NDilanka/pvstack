#!/usr/bin/env node
// Startup context each pvstack entry point loads before any task work, in bytes and
// estimated tokens (bytes / 4). It follows the same rules the agents follow: a droid's
// prompt names the skill a poteto-agent delegate loads, and a skill carrying the droid
// note pulls in droid-tools.md once per session.
//
//   node tools/footprint.mjs              the working tree
//   node tools/footprint.mjs --ref main   the working tree next to a git ref
//   node tools/footprint.mjs --check      exit 1 if a code delegate loads half or more of what /poteto-mode loads

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = "plugins/pvstack";
const NOTE_MARKER = "<!-- pvstack:droid-note -->";
const DROID_TOOLS = `${PLUGIN}/skills/poteto-mode/references/droid-tools.md`;
const SHEET = `${PLUGIN}/skills/setup-pvstack/modes/balanced.md`;

// prefixed: the parent's Task prompt says "Operate as poteto-agent".
const ENTRIES = [
  { name: "/poteto-mode (parent)", skills: ["poteto-mode"], files: [SHEET] },
  { name: "/poteto-mode, then how and architect", skills: ["poteto-mode", "how", "architect"], files: [SHEET] },
  { name: "code delegate (pv-sol-high as poteto-agent)", droid: "pv-sol-high", prefixed: true },
  { name: "lookup delegate (pv-sol-low, plain prompt)", droid: "pv-sol-low", prefixed: false },
  { name: "inherit delegate (poteto-agent droid)", droid: "poteto-agent", prefixed: true },
];

function reader(ref) {
  if (!ref) return (rel) => (fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), "utf8") : null);
  return (rel) => {
    try {
      return execFileSync("git", ["show", `${ref}:${rel}`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return null;
    }
  };
}

function delegateSkill(droidText) {
  return droidText.match(/\b(?:load|read) the `([a-z0-9-]+)` skill/i)?.[1] ?? null;
}

function measure(entry, read) {
  const loaded = new Map();
  const load = (rel) => {
    if (loaded.has(rel)) return null;
    const text = read(rel);
    if (text === null) throw new Error(`${rel} is missing`);
    loaded.set(rel, Buffer.byteLength(text));
    return text;
  };
  const loadSkill = (name) => {
    const text = load(`${PLUGIN}/skills/${name}/SKILL.md`);
    if (text?.includes(NOTE_MARKER)) load(DROID_TOOLS);
  };
  const skills = [...(entry.skills ?? [])];
  if (entry.droid) {
    const text = load(`${PLUGIN}/droids/${entry.droid}.md`);
    if (entry.prefixed) {
      const skill = delegateSkill(text);
      if (!skill) throw new Error(`${entry.droid}.md names no skill to load; update delegateSkill in tools/footprint.mjs`);
      skills.push(skill);
    }
  }
  for (const name of skills) loadSkill(name);
  for (const rel of entry.files ?? []) load(rel);
  const bytes = [...loaded.values()].reduce((a, b) => a + b, 0);
  return { bytes, files: [...loaded.keys()].map((rel) => rel.replace(`${PLUGIN}/`, "")) };
}

const fmt = (r) => (r ? `${(r.bytes / 1024).toFixed(1)} KB, ~${Math.round(r.bytes / 4 / 100) / 10}k tokens` : "n/a");

function main() {
  const args = process.argv.slice(2);
  const refIdx = args.indexOf("--ref");
  const ref = refIdx >= 0 ? args[refIdx + 1] : null;
  const now = Object.fromEntries(ENTRIES.map((e) => [e.name, measure(e, reader(null))]));

  if (args.includes("--check")) {
    const parent = now[ENTRIES[0].name].bytes;
    const pct = (bytes) => Math.round((100 * bytes) / parent);
    const delegates = ENTRIES.filter((e) => e.prefixed);
    const over = delegates.filter((e) => now[e.name].bytes * 2 >= parent);
    if (over.length) {
      for (const e of over) console.error(`footprint: ${e.name} loads ${now[e.name].bytes} bytes, ${pct(now[e.name].bytes)}% of /poteto-mode's ${parent}. Keep it under half.`);
      process.exit(1);
    }
    console.log(`footprint: ${delegates.map((e) => `${e.droid} ${fmt(now[e.name])} (${pct(now[e.name].bytes)}%)`).join(", ")} of /poteto-mode.`);
    return;
  }

  const then = ref
    ? Object.fromEntries(
        ENTRIES.map((e) => {
          try {
            return [e.name, measure(e, reader(ref))];
          } catch {
            return [e.name, null];
          }
        }),
      )
    : null;
  console.log(ref ? `| Entry point | ${ref} | working tree | Loads (working tree) |\n| --- | --- | --- | --- |` : "| Entry point | Startup context | Loads |\n| --- | --- | --- |");
  for (const e of ENTRIES) {
    const cells = ref ? [fmt(then[e.name]), fmt(now[e.name])] : [fmt(now[e.name])];
    console.log(`| ${e.name} | ${cells.join(" | ")} | ${now[e.name].files.map((f) => `\`${f}\``).join(", ")} |`);
  }
}

main();
