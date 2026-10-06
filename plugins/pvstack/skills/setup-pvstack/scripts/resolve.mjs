#!/usr/bin/env node
// Resolves a pvstack preset into a role sheet. This file ships inside the
// plugin and is also imported by tools/presets.mjs, so the generated sheets and
// a user's CLI run the same code.
//
//   node resolve.mjs <name-or-path>    print the role sheet to stdout
//   node resolve.mjs --list            list built-in and custom presets
//   node resolve.mjs --explain <name>  print each role's rule and the picked cell
//
// Custom presets are JSON files at ~/.factory/pvstack-presets/<name>.json or
// .factory/pvstack-presets/<name>.json in a project. See README.md.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptsDir, "..");
const pluginDir = path.resolve(skillDir, "..", "..");
const cellsPath = path.join(scriptsDir, "cells.json");
const presetsPath = path.join(skillDir, "presets.json");

const USAGE = "Usage: node resolve.mjs <name-or-path> | --list | --explain <name-or-path>";

/** Invalid preset, at load or at resolve time. The CLI prints the message and exits 1. */
export class PresetError extends Error {}

export const CLASSES = {
  code: "Code delegates (feature, refactor, bug fix, perf, hillclimb)",
  explore: "Exploration, investigators, mechanical edits",
  judgment: "Judgment, prose, explainers, synthesizers",
  hardest: "Hardest changes",
  "reflect tooling": "Reflect tooling",
  panels: "Review panels",
};

/** Balanced sheet order. Every preset writes this order. */
const SHEET_ROLES = [
  ["feature, refactoring", "code"],
  ["bug-fix", "code"],
  ["perf-issue", "code"],
  ["hillclimb", "code"],
  ["mechanical edits", "explore"],
  ["judgment and prose", "judgment"],
  ["hardest tasks", "hardest"],
  ["how explorer", "explore"],
  ["how explainer", "judgment"],
  ["why investigators", "explore"],
  ["why synthesizer", "judgment"],
  ["reflect tooling", "reflect tooling"],
  ["reflect judgment, divergent, synthesizer", "judgment"],
  ["arena runners", "panels"],
  ["arena cross-judge pool", "panels"],
  ["swarm workers", "code"],
  ["architect runners", "panels"],
  ["interrogate reviewers", "panels"],
];

export const ROLES = SHEET_ROLES.map(([role]) => role);
export const classOf = (role) => SHEET_ROLES.find(([name]) => name === role)[1];
export const PANEL_ROLES = new Set(["arena runners", "arena cross-judge pool", "architect runners", "interrogate reviewers"]);

/** The rows of the README table and of the Presets section in docs/model-evidence.md. */
export const GROUPS = [
  { label: CLASSES.code, klass: "code" },
  { label: "Swarm workers", role: "swarm workers" },
  { label: CLASSES.explore, klass: "explore" },
  { label: CLASSES.judgment, klass: "judgment" },
  { label: CLASSES.hardest, klass: "hardest" },
  { label: CLASSES["reflect tooling"], klass: "reflect tooling" },
  { label: CLASSES.panels, klass: "panels" },
];

let cellCache = null;

/** The joined cell data shipped with this plugin, written by tools/presets.mjs. */
export function cellData() {
  if (!cellCache) {
    if (!fs.existsSync(cellsPath)) throw new PresetError(`${cellsPath} is missing; reinstall the plugin`);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(cellsPath, "utf8"));
    } catch (error) {
      throw new PresetError(`${cellsPath}: ${error.message}`);
    }
    cellCache = parsed.cells;
  }
  return cellCache;
}

let builtinCache = null;

/** The built-in preset table shipped with this plugin, keyed by name. Unvalidated; call validatePreset. */
export function builtins() {
  if (!builtinCache) {
    if (!fs.existsSync(presetsPath)) throw new PresetError(`${presetsPath} is missing; reinstall the plugin`);
    try {
      builtinCache = JSON.parse(fs.readFileSync(presetsPath, "utf8"));
    } catch (error) {
      throw new PresetError(`${presetsPath}: ${error.message}`);
    }
  }
  return builtinCache;
}

export const builtinNames = () => Object.keys(builtins());

export const PICKS = {
  // A cell with no cost sorts last, so a preset only reaches one when nothing cheaper matches.
  "min-usd": { compare: (a, b) => (a.usd ?? Infinity) - (b.usd ?? Infinity) || b.score - a.score || a.name.localeCompare(b.name), word: "cheapest" },
  "max-score": { compare: (a, b) => b.score - a.score || (a.usd ?? Infinity) - (b.usd ?? Infinity) || a.name.localeCompare(b.name), word: "highest-scoring" },
  "min-minutes": { compare: (a, b) => a.minutes - b.minutes || b.score - a.score || a.name.localeCompare(b.name), word: "fastest" },
};

const modelName = (id, cells) => cells.find((cell) => cell.model === id)?.vbName ?? id;
const labNames = (cells) => [...new Set(cells.map((cell) => cell.lab))].sort();
const reportsNotes = (cell) => cell.safety != null && cell.safety.reported > 0;
const isSafe = (cell) => cell.safety == null || (reportsNotes(cell) && cell.safety.followed / cell.safety.total <= 0.1);

const FILTERS = {
  model: { test: (c, v) => c.model === v, text: (v, cells) => `that runs on ${modelName(v, cells)}` },
  openWeights: { test: (c, v) => c.openWeights === v, text: () => "that comes from an open-weights model" },
  safe: { test: (c, v) => isSafe(c) === v, text: () => "that passes the Safety v1 screen" },
  safetyEvidence: { test: (c, v) => reportsNotes(c) === v, text: () => "whose model reported planted notes to the user on Safety v1" },
  measuredUsd: { test: (c, v) => (c.usd != null && !c.usdEstimated) === v, text: () => "that has a published cost" },
  passed: {
    test: (c, v) => {
      if (v !== "all" && v !== "one") throw new PresetError(`unknown passed value "${v}"`);
      return c.passed != null && c.passed >= c.passed_of - (v === "one" ? 1 : 0);
    },
    text: (v) => (v === "all" ? "that passed every task it ran" : "that passed all but one task"),
  },
  scoreWithin: {
    test: (c, v, best) => c.score >= best - v,
    text: (v) => `that scores within ${v} point${v === 1 ? "" : "s"} of the best cell in its pool`,
  },
  // Strictly more resolved, so a tie in the Droid run never overrides a Frontier v4 gap.
  droidDominated: {
    test: (c, v, best, pool) => {
      const beaten = c.droid != null && pool.some((o) => o.model === c.model && o.droid != null && o.droid.resolvedRate > c.droid.resolvedRate && o.droid.credits < c.droid.credits);
      return beaten === v;
    },
    text: () => "that no cell of the same model beats in the Droid run with more tasks resolved on fewer credits",
  },
};

export function eligible(pool, where) {
  const keys = where ? Object.keys(where) : [];
  if (!keys.length) return pool;
  const others = keys.filter((key) => key !== "scoreWithin");
  const kept = pool.filter((cell) => others.every((key) => FILTERS[key].test(cell, where[key], null, pool)));
  if (!keys.includes("scoreWithin")) return kept;
  const best = Math.max(...kept.map((c) => c.score));
  return kept.filter((cell) => FILTERS.scoreWithin.test(cell, where.scoreWithin, best));
}

export function ruleText(rule, cells = cellData()) {
  const pick = PICKS[rule.pick].word;
  const clauses = Object.entries(rule.where ?? {}).map(([key, value]) => FILTERS[key].text(value, cells));
  const joined = clauses.map((clause, i) => (i === 0 ? clause : clause.replace(/^that /, ""))).join(" and ");
  let text = joined ? `${pick} cell ${joined}` : `${pick} cell`;
  if (rule.per === "lab") {
    text += `, one cell per lab, from ${rule.rosters.default.join(", ")}`;
    for (const [role, labs] of Object.entries(rule.rosters)) {
      if (role === "default") continue;
      text += `; ${role} from ${labs.join(", ")}, because ${rule.rosterNote}`;
    }
  }
  if (rule.per === "effort") text += `, one cell per effort level, up to ${rule.count}`;
  return text;
}

export function applyRule(rule, cells, role) {
  if (rule.per === "effort") {
    const picked = [...eligible(cells, rule.where)].sort(PICKS[rule.pick].compare).slice(0, rule.count);
    if (!picked.length) throw new PresetError(`${role}: no cell matches "${ruleText(rule, cells)}"`);
    return picked.map((cell) => cell.name);
  }
  if (rule.per === "lab") {
    const roster = rule.rosters[role] ?? rule.rosters.default;
    return roster.map((lab) => {
      const pool = eligible(cells.filter((cell) => cell.lab === lab), rule.where);
      if (!pool.length) throw new PresetError(`${role}: no ${lab} cell matches "${ruleText(rule, cells)}"`);
      return [...pool].sort(PICKS[rule.pick].compare)[0].name;
    });
  }
  const pool = [...eligible(cells, rule.where)].sort(PICKS[rule.pick].compare);
  if (!pool.length) throw new PresetError(`${role}: no cell matches "${ruleText(rule, cells)}"`);
  return [pool[0].name];
}

/** The rule a role uses: its own, or its class's. */
export function ruleFor(preset, role) {
  const current = typeof preset === "string" ? builtins()[preset] : preset;
  return current.rules?.[role] ?? current.rules?.[classOf(role)];
}

export function resolveSheet(preset, cells = cellData()) {
  const current = typeof preset === "string" ? builtins()[preset] : preset;
  if (!current) throw new PresetError(`unknown preset "${preset}"`);
  return SHEET_ROLES.map(([role]) => {
    const pin = (current.pins ?? []).find((entry) => entry.role === role);
    if (pin) return { role, value: Array.isArray(pin.droid) ? pin.droid : [pin.droid] };
    const rule = ruleFor(current, role);
    if (!rule) throw new PresetError(`${role}: preset "${current.name ?? "?"}" gives no rule for this role or its "${classOf(role)}" class`);
    return { role, value: applyRule(rule, cells, role) };
  });
}

export const SHEET_HEADER = [
  "# pvstack role sheet. One line per role; each value is a pv-* droid name (or a list for panels).",
  "# Pass the value as the Task tool's subagent_type. `inherit` means use the built-in `worker` droid on the parent model.",
  "# Evidence for every choice: docs/model-evidence.md in the pvstack repository.",
];

export function renderSheet(preset, rows) {
  const current = typeof preset === "string" ? builtins()[preset] : preset;
  const mode = typeof preset === "string" ? preset : current.custom ? `custom:${current.name}` : current.name;
  const lines = [...SHEET_HEADER, `# mode: ${mode}`];
  if (current.custom) lines.push(`# extends: ${current.extends}`);
  for (const pin of current.pins ?? []) lines.push(`# pin: ${pin.role}: ${pin.reason}`);
  for (const { role, value } of rows) lines.push(`${role}: ${value.join(", ")}`);
  return lines.join("\n") + "\n";
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value) => typeof value === "string" && value.trim() !== "";
const RULE_KEYS = ["where", "pick", "per", "count", "rosters", "rosterNote"];
const PIN_KEYS = ["role", "droid", "reason"];
const PRESET_KEYS = ["summary", "extends", "rules", "pins"];

function ancestors(dir) {
  const out = [];
  let current = path.resolve(dir);
  for (;;) {
    out.push(current);
    const parent = path.dirname(current);
    if (parent === current) return out;
    current = parent;
  }
}

/** Project and user directories that hold custom presets, nearest project first. Also the personal droid directories. */
export function customPresetDirs(root = process.cwd()) {
  const dirs = ancestors(root).map((dir) => path.join(dir, ".factory", "pvstack-presets"));
  dirs.push(path.join(process.env.HOME || os.homedir(), ".factory", "pvstack-presets"));
  return [...new Set(dirs)];
}

export function droidDirs(root = process.cwd()) {
  const dirs = [path.join(pluginDir, "droids")];
  dirs.push(...ancestors(root).map((dir) => path.join(dir, ".factory", "droids")));
  dirs.push(path.join(process.env.HOME || os.homedir(), ".factory", "droids"));
  return [...new Set(dirs)];
}

export function droidNames() {
  const names = new Set(["inherit"]);
  for (const dir of droidDirs()) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) if (file.endsWith(".md")) names.add(file.slice(0, -3));
  }
  return names;
}

function validateFilterValue(where, filter, value, cells) {
  if (filter === "model") {
    const models = [...new Set(cells.map((cell) => cell.model))];
    if (typeof value !== "string" || !models.includes(value)) {
      throw new PresetError(`${where}: unknown model ${JSON.stringify(value)}. Valid models: ${models.join(", ")}`);
    }
  } else if (filter === "passed") {
    if (value !== "all" && value !== "one") throw new PresetError(`${where}: "passed" is "all" or "one", not ${JSON.stringify(value)}`);
  } else if (filter === "scoreWithin") {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new PresetError(`${where}: "scoreWithin" is a positive number, not ${JSON.stringify(value)}`);
    }
  } else if (typeof value !== "boolean") {
    throw new PresetError(`${where}: "${filter}" is true or false, not ${JSON.stringify(value)}`);
  }
}

function validateRule(label, key, rule, cells) {
  const where = `${label}: rules["${key}"]`;
  if (!isObject(rule)) throw new PresetError(`${where} must be an object`);
  if (!CLASSES[key] && !ROLES.includes(key)) {
    throw new PresetError(`${where}: unknown rule key. Classes: ${Object.keys(CLASSES).join(", ")}. Roles: ${ROLES.join(", ")}`);
  }
  for (const field of Object.keys(rule)) {
    if (RULE_KEYS.includes(field)) continue;
    const hint = field === "rank" ? " (rank was removed; the pick always takes the best cell)" : "";
    throw new PresetError(`${where}: unknown key "${field}"${hint}. Allowed keys: ${RULE_KEYS.join(", ")}`);
  }
  if (!isText(rule.pick) || !PICKS[rule.pick]) {
    throw new PresetError(`${where}: pick ${JSON.stringify(rule.pick)} is not a pick. Valid picks: ${Object.keys(PICKS).join(", ")}`);
  }
  if (rule.where != null) {
    if (!isObject(rule.where)) throw new PresetError(`${where}.where must be an object of filter names`);
    for (const [filter, value] of Object.entries(rule.where)) {
      if (!FILTERS[filter]) throw new PresetError(`${where}.where: unknown filter "${filter}". Valid filters: ${Object.keys(FILTERS).join(", ")}`);
      validateFilterValue(`${where}.where["${filter}"]`, filter, value, cells);
    }
  }
  if (rule.per != null) {
    if (rule.per !== "lab" && rule.per !== "effort") {
      throw new PresetError(`${where}.per ${JSON.stringify(rule.per)} is not a layout. Valid values: lab, effort`);
    }
    if (key !== "panels" && !PANEL_ROLES.has(key)) {
      throw new PresetError(`${where}.per: only the "panels" class and the panel roles take a list of cells; give "${key}" one pick`);
    }
  }
  if (rule.rosterNote != null && !isText(rule.rosterNote)) throw new PresetError(`${where}.rosterNote must be a sentence`);
  if (rule.per === "effort") {
    if (rule.rosters != null) throw new PresetError(`${where}: "rosters" needs "per": "lab"`);
    if (!Number.isInteger(rule.count) || rule.count < 2) {
      throw new PresetError(`${where}.count: "per": "effort" needs a whole number of cells, at least 2`);
    }
  } else if (rule.per === "lab") {
    if (rule.count != null) throw new PresetError(`${where}: "count" needs "per": "effort"`);
    if (!isObject(rule.rosters) || !Array.isArray(rule.rosters.default) || !rule.rosters.default.length) {
      throw new PresetError(`${where}.rosters: "per": "lab" needs a "default" array of lab names. Labs: ${labNames(cells).join(", ")}`);
    }
    const labs = new Set(cells.map((cell) => cell.lab));
    for (const [role, roster] of Object.entries(rule.rosters)) {
      if (role !== "default" && !PANEL_ROLES.has(role)) {
        throw new PresetError(`${where}.rosters["${role}"]: only a panel role can seat its own labs. Panel roles: ${[...PANEL_ROLES].join(", ")}`);
      }
      if (!Array.isArray(roster) || !roster.length || roster.some((lab) => !labs.has(lab))) {
        throw new PresetError(`${where}.rosters["${role}"]: needs at least one lab from ${labNames(cells).join(", ")}`);
      }
    }
    const overrides = Object.keys(rule.rosters).filter((role) => role !== "default");
    if (overrides.length && !isText(rule.rosterNote)) {
      throw new PresetError(`${where}: rosters["${overrides[0]}"] seats other labs for one role, so "rosterNote" is required to say why`);
    }
  } else if (rule.count != null || rule.rosters != null) {
    throw new PresetError(`${where}: "count" and "rosters" need a "per" layout`);
  }
  return rule;
}

function validatePin(label, index, pin, droids) {
  const where = `${label}: pins[${index}]`;
  if (!isObject(pin)) throw new PresetError(`${where} must be an object`);
  for (const field of Object.keys(pin)) {
    if (!PIN_KEYS.includes(field)) throw new PresetError(`${where}: unknown key "${field}". Allowed keys: ${PIN_KEYS.join(", ")}`);
  }
  if (!isText(pin.role) || !ROLES.includes(pin.role)) {
    throw new PresetError(`${where}.role ${JSON.stringify(pin.role)} is not a sheet role. Roles: ${ROLES.join(", ")}`);
  }
  if (!isText(pin.reason)) throw new PresetError(`${where}.reason: say why "${pin.role}" is pinned; a pin without a reason is a hidden default`);
  const panel = PANEL_ROLES.has(pin.role);
  const values = Array.isArray(pin.droid) ? pin.droid : [pin.droid];
  if (!values.length || values.some((value) => !isText(value))) throw new PresetError(`${where}.droid: name one droid, or a list for a panel`);
  if (panel && values.length < 2) throw new PresetError(`${where}.droid: panel "${pin.role}" needs at least two droids`);
  if (!panel && values.length !== 1) throw new PresetError(`${where}.droid: "${pin.role}" takes one droid; only panels take a list`);
  for (const value of values) {
    if (!droids.has(value)) {
      throw new PresetError(`${where}.droid "${value}" is not a droid. Use a pv-* droid from the plugin, a personal droid in ~/.factory/droids or .factory/droids, or inherit`);
    }
  }
  return { role: pin.role, droid: pin.droid, reason: pin.reason };
}

function mergePins(label, basePins, customPins, droids) {
  const byRole = new Map();
  for (const [index, pin] of basePins.entries()) {
    const checked = validatePin(label, index, pin, droids);
    byRole.set(checked.role, checked);
  }
  const seen = new Set();
  for (const [index, pin] of customPins.entries()) {
    const checked = validatePin(label, index, pin, droids);
    if (seen.has(checked.role)) throw new PresetError(`${label}: two pins for "${checked.role}"; a role is pinned once`);
    seen.add(checked.role);
    byRole.set(checked.role, checked);
  }
  return [...byRole.values()];
}

/**
 * Validates one preset table and returns it normalized. Pass `base` to merge a
 * custom preset over a built-in one: its rules and pins are copied, then the
 * preset's own entries replace them per key.
 */
export function validatePreset(preset, { name, base = null, cells = cellData(), droids = droidNames() } = {}) {
  const label = name ?? "(unnamed preset)";
  if (!isText(name) || !/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
    throw new PresetError(`${label}: preset names use lowercase letters, numbers, dashes and underscores`);
  }
  if (!isObject(preset)) throw new PresetError(`${label}: the preset must be a JSON object`);
  for (const field of Object.keys(preset)) {
    if (!PRESET_KEYS.includes(field)) throw new PresetError(`${label}: unknown key "${field}". Allowed keys: ${PRESET_KEYS.join(", ")}`);
  }
  if (!isText(preset.summary)) throw new PresetError(`${label}: "summary" is required; --list shows it`);
  if (preset.rules != null && !isObject(preset.rules)) throw new PresetError(`${label}: "rules" must be an object keyed by role class or role name`);
  if (preset.pins != null && !Array.isArray(preset.pins)) throw new PresetError(`${label}: "pins" must be an array`);

  const rules = { ...(base?.rules ?? {}) };
  for (const [key, rule] of Object.entries(preset.rules ?? {})) rules[key] = validateRule(label, key, rule, cells);
  const pins = mergePins(label, base?.pins ?? [], preset.pins ?? [], droids);
  return { name, custom: base != null, extends: base?.name ?? null, summary: preset.summary, rules, pins };
}

/** Validates one parsed custom preset over its built-in base. Throws PresetError. */
export function customPreset(raw, { name, cells = cellData(), droids = droidNames() } = {}) {
  if (!isText(name) || !/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
    throw new PresetError(`${name ?? "(unnamed)"}: custom preset names use lowercase letters, numbers, dashes and underscores`);
  }
  if (builtins()[name]) {
    throw new PresetError(`"${name}" is a built-in preset name; name the file something else. Built-ins: ${builtinNames().join(", ")}`);
  }
  if (!isObject(raw)) throw new PresetError(`${name}: the preset file must hold a JSON object`);
  if (typeof raw.extends !== "string" || !raw.extends.trim()) {
    throw new PresetError(`${name}: "extends" is required and must name a built-in preset. Valid bases: ${builtinNames().join(", ")}`);
  }
  const base = builtins()[raw.extends];
  if (!base) {
    throw new PresetError(`${name}: "extends" is ${JSON.stringify(raw.extends)}, not a built-in preset. Valid bases: ${builtinNames().join(", ")}`);
  }
  const validatedBase = validatePreset(base, { name: raw.extends, cells, droids });
  return validatePreset(raw, { name, base: validatedBase, cells, droids });
}

export function loadCustomPreset(spec, options = {}) {
  const file = typeof spec === "string" ? spec : spec.file;
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new PresetError(`${file}: ${error.message}`);
  }
  return customPreset(raw, { ...options, name: path.basename(file, ".json") });
}

/** Every custom preset file it can find, nearest project directory first. */
export function findCustomPresets(root = process.cwd()) {
  const found = new Map();
  for (const dir of customPresetDirs(root)) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith(".json")) continue;
      const name = file.slice(0, -5);
      if (!found.has(name)) found.set(name, { name, file: path.join(dir, file) });
    }
  }
  return [...found.values()];
}

/** Resolves a built-in name, a custom preset name, or a path to a preset file. */
export function resolvePreset(spec, { cells = cellData(), droids = droidNames(), root = process.cwd() } = {}) {
  if (!isText(spec)) throw new PresetError(`name a preset or a path to a .json file. ${USAGE}`);
  if (spec.includes("/") || spec.includes(path.sep) || spec.endsWith(".json")) {
    const file = path.resolve(spec);
    if (!fs.existsSync(file)) throw new PresetError(`${file}: no such file`);
    return loadCustomPreset(file, { cells, droids });
  }
  const custom = findCustomPresets(root).find((entry) => entry.name === spec);
  if (custom) return loadCustomPreset(custom.file, { cells, droids });
  if (builtins()[spec]) return validatePreset(builtins()[spec], { name: spec, cells, droids });
  throw new PresetError(`no preset named "${spec}". Known presets: ${[...builtinNames(), ...findCustomPresets(root).map((entry) => entry.name)].join(", ")}`);
}

function cellSummary(name, cells) {
  const cell = cells.find((entry) => entry.name === name);
  if (!cell) return `${name} (no VulcanBench cell)`;
  const usd = cell.usd == null ? "no published cost" : `$${+cell.usd.toFixed(2)}${cell.usdEstimated ? " estimated" : ""}`;
  return `${name} (score ${+cell.score.toFixed(2)}, ${usd}, ${+cell.minutes.toFixed(1)} min)`;
}

function list(cells) {
  const lines = ["Built-in presets:"];
  for (const [name, preset] of Object.entries(builtins())) {
    let summary = preset.summary;
    try {
      const validated = validatePreset(preset, { name, cells });
      resolveSheet(validated, cells);
      summary = validated.summary;
    } catch (error) {
      summary = `invalid: ${error.message}`;
    }
    lines.push(`  ${name.padEnd(12)}${summary}`);
  }
  const dirs = customPresetDirs();
  lines.push("", `Custom presets (looked in ${dirs.join(", ")}):`);
  const custom = findCustomPresets();
  if (!custom.length) lines.push("  none");
  for (const entry of custom) {
    try {
      const preset = loadCustomPreset(entry.file, { cells });
      resolveSheet(preset, cells);
      lines.push(`  ${preset.name.padEnd(12)}${preset.summary}`);
      lines.push(`    extends ${preset.extends}; ${entry.file}`);
    } catch (error) {
      lines.push(`  ${entry.name.padEnd(12)}invalid: ${error.message}`);
      lines.push(`    ${entry.file}`);
    }
  }
  return lines.join("\n") + "\n";
}

function explain(preset, cells) {
  const lines = [`${preset.custom ? `custom:${preset.name}` : preset.name}: ${preset.summary}`, ""];
  for (const { role, value } of resolveSheet(preset, cells)) {
    const pin = preset.pins.find((entry) => entry.role === role);
    lines.push(`${role}:`);
    lines.push(pin ? `  pin: ${pin.reason}` : `  rule: ${ruleText(ruleFor(preset, role), cells)}`);
    lines.push(`  picked: ${value.map((name) => cellSummary(name, cells)).join("; ")}`);
  }
  return lines.join("\n") + "\n";
}

function main(argv) {
  const args = argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  const cells = cellData();
  if (args.includes("--list")) {
    process.stdout.write(list(cells));
    return;
  }
  const at = args.indexOf("--explain");
  if (at !== -1) {
    const spec = args[at + 1];
    if (!spec || spec.startsWith("-")) throw new PresetError(`--explain needs a preset name or path. ${USAGE}`);
    process.stdout.write(explain(resolvePreset(spec, { cells }), cells));
    return;
  }
  const unknown = args.find((arg) => arg.startsWith("-"));
  if (unknown) throw new PresetError(`unknown option ${unknown}. ${USAGE}`);
  if (args.length > 1) throw new PresetError(`one preset at a time. ${USAGE}`);
  const preset = resolvePreset(args[0], { cells });
  process.stdout.write(renderSheet(preset, resolveSheet(preset, cells)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv);
  } catch (error) {
    console.error(`resolve: ${error.message}`);
    process.exitCode = 1;
  }
}
