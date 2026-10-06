#!/usr/bin/env node
// Structural checks for the PV Stack layer. Exit 1 on any failure.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODELS } from "../data/catalog.mjs";
import { loadCustomPreset, resolveSheet, validatePreset } from "../plugins/pvstack/skills/setup-pvstack/scripts/resolve.mjs";
import { CELLS } from "./droids.mjs";
import { PRESETS } from "./presets.mjs";
import { cellData } from "./vulcanbench.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plugin = path.join(root, "plugins", "pvstack");
const failures = [];
const fail = (msg) => failures.push(msg);

for (const cell of CELLS) {
  const model = MODELS[cell.model];
  if (!model) fail(`${cell.name}: model ${cell.model} is not in data/catalog.mjs`);
  else if (!model.levels.includes(cell.effort)) fail(`${cell.name}: ${cell.model} does not accept effort ${cell.effort}`);
  if (!/^[a-z0-9_-]+$/.test(cell.name)) fail(`${cell.name}: invalid droid name`);
}

const cells = cellData();
const labOf = new Map(cells.map((c) => [c.name, c.lab]));
const modelOf = new Map(cells.map((c) => [c.name, c.model]));
const effortOf = new Map(cells.map((c) => [c.name, c.effort]));

const droidNames = new Set(
  fs.readdirSync(path.join(plugin, "droids")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")),
);

// The built-in presets and the shipped example pass the same validator users get.
const presetDroids = new Set(["inherit", ...droidNames]);
for (const [name, preset] of Object.entries(PRESETS)) {
  try {
    resolveSheet(validatePreset(preset, { name, cells, droids: presetDroids }), cells);
  } catch (error) {
    fail(`preset ${name}: ${error.message}`);
  }
}
const exampleFile = path.join(plugin, "skills", "setup-pvstack", "examples", "cheap-safe.json");
try {
  resolveSheet(loadCustomPreset(exampleFile, { cells, droids: presetDroids }), cells);
} catch (error) {
  fail(`examples/cheap-safe.json: ${error.message}`);
}

const ALIASES = new Set(["inherit"]);
const PANELS = new Set(["arena runners", "arena cross-judge pool", "architect runners", "interrogate reviewers"]);
const REFERENCE = "balanced";

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
if (!sheets[REFERENCE]) fail(`modes/${REFERENCE}.md is missing; it defines the role order and the class defaults`);

for (const [mode, roles] of Object.entries(sheets)) {
  const preset = PRESETS[mode];
  if (!preset) fail(`modes/${mode}.md: no preset named "${mode}" in tools/presets.mjs`);
  for (const [role, values] of roles) {
    for (const v of values) if (!droidNames.has(v) && !ALIASES.has(v)) fail(`${mode}: ${role} -> unknown droid ${v}`);
    if (PANELS.has(role) && values.length < 2) fail(`${mode}: panel ${role} needs at least two entries`);
    if (!PANELS.has(role) && values.length !== 1) fail(`${mode}: ${role} must name exactly one droid`);
    if (!PANELS.has(role) || !preset) continue;
    // A panel's signal is model diversity, so each entry must come from another lab. The open
    // preset has one lab to draw from, and seats distinct effort levels of it instead.
    if (preset.rules.panels.per === "lab") {
      const labs = values.map((v) => labOf.get(v) ?? `alias:${v}`);
      if (new Set(labs).size !== labs.length) fail(`${mode}: panel ${role} repeats a lab (${labs.join(", ")}); one cell per lab`);
    } else {
      const models = values.map((v) => modelOf.get(v) ?? `alias:${v}`);
      const efforts = values.map((v) => effortOf.get(v) ?? `alias:${v}`);
      if (new Set(models).size !== 1) fail(`${mode}: panel ${role} seats more than one model (${models.join(", ")})`);
      if (new Set(efforts).size !== efforts.length) fail(`${mode}: panel ${role} repeats an effort level (${efforts.join(", ")})`);
    }
  }
  for (const panel of PANELS) if (!roles.has(panel)) fail(`${mode}: missing panel ${panel}`);
}

const used = new Set(Object.values(sheets).flatMap((roles) => [...roles.values()].flat()));
for (const cell of CELLS) if (!used.has(cell.name)) fail(`${cell.name}: no mode sheet uses it; delete the cell`);

const reference = sheets[REFERENCE] ?? new Map();
for (const [mode, roles] of Object.entries(sheets)) {
  if (mode === REFERENCE) continue;
  if ([...reference.keys()].join("|") !== [...roles.keys()].join("|")) {
    fail(`${REFERENCE} and ${mode} sheets list different roles or orders`);
  }
}

// Every role line a skill names must exist in the sheets.
const skillsDir = path.join(plugin, "skills");
const sheetRoles = new Set(reference.keys());
for (const dir of fs.readdirSync(skillsDir)) {
  const file = path.join(skillsDir, dir, "SKILL.md");
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  const name = text.match(/^---\r?\n[\s\S]*?^name:\s*(.*?)\s*$/m)?.[1];
  if (name !== dir) fail(`${dir}/SKILL.md: name "${name}" must equal its directory name`);
  if (!/^[a-z0-9-]+$/.test(dir)) fail(`${dir}: skill names use lowercase letters, numbers, and hyphens`);
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
