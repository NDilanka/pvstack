#!/usr/bin/env node
// Generates the committed artifacts of the preset layer: the mode sheets, the
// plugin's copy of the joined cell data, and the README presets table. A preset
// is a table of rules, one per role class, resolved over the cells in
// tools/droids.mjs joined to their VulcanBench evidence (tools/vulcanbench.mjs
// and data/catalog.mjs). The resolver itself lives in the plugin, so the sheets
// and a user's CLI run the same code. No sheet is written by hand.
//
//   node tools/presets.mjs          write modes/<preset>.md, cells.json and the README table
//   node tools/presets.mjs --check  exit 1 if any of them differs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GROUPS,
  ROLES,
  builtins,
  classOf,
  renderSheet,
  resolveSheet,
  ruleFor,
  ruleText,
  validatePreset,
} from "../plugins/pvstack/skills/setup-pvstack/scripts/resolve.mjs";
import { cellData, loadSnapshot } from "./vulcanbench.mjs";

export { GROUPS, ROLES, classOf, resolveSheet, ruleFor, ruleText };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const setupDir = path.join(root, "plugins", "pvstack", "skills", "setup-pvstack");
const modesDir = path.join(setupDir, "modes");
const cellsPath = path.join(setupDir, "scripts", "cells.json");
const readmePath = path.join(root, "README.md");
const TABLE_START = "<!-- presets:table -->";
const TABLE_END = "<!-- /presets:table -->";

/** The built-in preset table, read from the plugin so users and the repo share one copy. */
export const PRESETS = builtins();

/** The cell fields the plugin needs; the rest of the evidence stays in the repository. */
const CELL_FIELDS = [
  "name",
  "model",
  "vbName",
  "effort",
  "lab",
  "openWeights",
  "safety",
  "multiplier",
  "score",
  "passed",
  "passed_of",
  "usd",
  "usdEstimated",
  "minutes",
  "inferred",
  "inferredName",
  "v3Note",
  "droid",
];

export function cellsFileText(cells = cellData()) {
  const snapshot = loadSnapshot();
  const pluginCells = cells.map((cell) => Object.fromEntries(CELL_FIELDS.map((field) => [field, cell[field]])));
  return JSON.stringify({ pulled: snapshot.pulled, generated: "node tools/presets.mjs", cells: pluginCells }, null, 2) + "\n";
}

const cellText = (name, cells) => {
  const cell = cells.find((entry) => entry.name === name);
  return cell ? `${cell.vbName}, ${cell.effort}` : name;
};
const listText = (names, cells) => names.map((name) => cellText(name, cells)).join(" · ");

export function groupValue(rows, group) {
  const role = group.role ?? ROLES.find((r) => classOf(r) === group.klass);
  return rows.find((row) => row.role === role).value;
}

function renderTable(cells) {
  const presets = Object.keys(PRESETS);
  const sheets = presets.map((preset) => resolveSheet(preset, cells));
  const head = `| Role | ${presets.map((p) => (p === "balanced" ? "Balanced (default)" : p.charAt(0).toUpperCase() + p.slice(1))).join(" | ")} |`;
  const divider = `| --- | ${presets.map(() => "---").join(" | ")} |`;
  const body = GROUPS.map((group) => {
    const values = sheets.map((rows) => {
      const value = groupValue(rows, group);
      if (group.klass !== "panels") return listText(value, cells);
      const cross = listText(groupValue(rows, { role: "arena cross-judge pool" }), cells);
      const text = listText(value, cells);
      return cross === text ? text : `${text} (cross-judge pool: ${cross})`;
    });
    return `| ${group.label} | ${values.join(" | ")} |`;
  });
  return [head, divider, ...body].join("\n");
}

function replaceTable(readme, table) {
  const start = readme.indexOf(TABLE_START);
  const end = readme.indexOf(TABLE_END);
  if (start < 0 || end < 0) throw new Error(`README.md is missing ${TABLE_START} ... ${TABLE_END}`);
  return readme.slice(0, start + TABLE_START.length) + "\n" + table + "\n" + readme.slice(end);
}

/** Sheets, tables and docs resolve over the shipped cells, so they match what a user's resolver sees. */
export const shippedCells = () => JSON.parse(cellsFileText()).cells;

function main() {
  const check = process.argv.includes("--check");
  const cells = shippedCells();
  const drift = [];
  const names = Object.keys(PRESETS);
  const presets = Object.fromEntries(names.map((name) => [name, validatePreset(PRESETS[name], { name, cells })]));

  const cellsText = cellsFileText(cells);
  if (check) {
    if (!fs.existsSync(cellsPath) || fs.readFileSync(cellsPath, "utf8") !== cellsText) {
      drift.push("skills/setup-pvstack/scripts/cells.json");
    }
  } else {
    fs.mkdirSync(path.dirname(cellsPath), { recursive: true });
    fs.writeFileSync(cellsPath, cellsText);
  }

  fs.mkdirSync(modesDir, { recursive: true });
  for (const file of fs.readdirSync(modesDir).filter((f) => f.endsWith(".md"))) {
    const name = file.slice(0, -3);
    if (!names.includes(name)) drift.push(`modes/${file}: no preset named "${name}"`);
  }
  for (const name of names) {
    const text = renderSheet(presets[name], resolveSheet(presets[name], cells));
    const file = path.join(modesDir, `${name}.md`);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) drift.push(`modes/${name}.md`);
    } else fs.writeFileSync(file, text);
  }

  const readme = fs.readFileSync(readmePath, "utf8");
  const updated = replaceTable(readme, renderTable(cells));
  if (check) {
    if (updated !== readme) drift.push("README.md (presets table)");
  } else if (updated !== readme) fs.writeFileSync(readmePath, updated);

  if (check && drift.length) {
    console.error(`Presets out of date: ${drift.join(", ")}. Run node tools/presets.mjs.`);
    process.exit(1);
  }
  console.log(check ? `${names.length} mode sheets, cells.json and the README table match PRESETS.` : `Wrote ${names.length} mode sheets, cells.json and the README table.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`presets: ${error.message}`);
    process.exit(1);
  }
}
