#!/usr/bin/env node
// Structural checks for the PV Stack layer. Exit 1 on any failure.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CELLS } from "./droids.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plugin = path.join(root, "plugins", "pvstack");
const failures = [];
const fail = (msg) => failures.push(msg);

// Model IDs and reasoning levels from https://docs.factory.com/models.md for the models PV Stack pins.
const DROID_MODELS = {
  "gpt-6.1-sol": ["low", "medium", "high", "xhigh", "max"],
  "claude-opus-5-5": ["low", "medium", "high", "xhigh", "max"],
  "grok-4.7": ["low", "medium", "high", "xhigh"],
  "deepseek-v4.1-flash": ["off", "low", "high", "max"],
};

for (const cell of CELLS) {
  const levels = DROID_MODELS[cell.model];
  if (!levels) fail(`${cell.name}: model ${cell.model} is not in DROID_MODELS`);
  else if (!levels.includes(cell.effort)) fail(`${cell.name}: ${cell.model} does not accept effort ${cell.effort}`);
  if (!/^[a-z0-9_-]+$/.test(cell.name)) fail(`${cell.name}: invalid droid name`);
}

const droidNames = new Set(
  fs.readdirSync(path.join(plugin, "droids")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")),
);
const ALIASES = new Set(["inherit"]);
const PANELS = new Set(["arena runners", "arena cross-judge pool", "architect runners", "interrogate reviewers"]);

function readSheet(file) {
  const roles = new Map();
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const idx = line.lastIndexOf(": ");
    if (idx < 0) {
      fail(`${path.basename(file)}: unparseable line "${line}"`);
      continue;
    }
    roles.set(line.slice(0, idx), line.slice(idx + 2).split(",").map((v) => v.trim()));
  }
  return roles;
}

const modesDir = path.join(plugin, "skills", "setup-pvstack", "modes");
const sheets = Object.fromEntries(
  fs.readdirSync(modesDir).map((f) => [f.replace(/\.md$/, ""), readSheet(path.join(modesDir, f))]),
);
const [firstMode, ...otherModes] = Object.keys(sheets);
for (const [mode, roles] of Object.entries(sheets)) {
  for (const [role, values] of roles) {
    for (const v of values) if (!droidNames.has(v) && !ALIASES.has(v)) fail(`${mode}: ${role} -> unknown droid ${v}`);
    if (PANELS.has(role) && values.length < 2) fail(`${mode}: panel ${role} needs at least two entries`);
    if (!PANELS.has(role) && values.length !== 1) fail(`${mode}: ${role} must name exactly one droid`);
  }
  for (const panel of PANELS) if (!roles.has(panel)) fail(`${mode}: missing panel ${panel}`);
}
for (const mode of otherModes) {
  const a = [...sheets[firstMode].keys()].join("|");
  const b = [...sheets[mode].keys()].join("|");
  if (a !== b) fail(`${firstMode} and ${mode} sheets list different roles or orders`);
}

// Every role line a skill names must exist in the sheets.
const skillsDir = path.join(plugin, "skills");
const sheetRoles = new Set(sheets[firstMode].keys());
for (const dir of fs.readdirSync(skillsDir)) {
  const file = path.join(skillsDir, dir, "SKILL.md");
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/the `([a-z][a-z ,-]+)` line/g)) {
    if (!sheetRoles.has(m[1])) fail(`${dir}/SKILL.md names role line "${m[1]}" that no sheet defines`);
  }
  for (const m of text.matchAll(/\]\(([^)]*droid-tools\.md)\)/g)) {
    if (!fs.existsSync(path.resolve(path.dirname(file), m[1]))) fail(`${dir}/SKILL.md: broken link ${m[1]}`);
  }
}

if (failures.length) {
  console.error(`validate: ${failures.length} problem(s)\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`validate: ${CELLS.length} droids, ${Object.keys(sheets).length} modes, ${sheetRoles.size} roles OK.`);
