#!/usr/bin/env node
// Regenerates the VulcanBench-numbered parts of docs/model-evidence.md from
// data/vulcanbench.json, data/catalog.mjs and the preset rules. The prose
// between the markers is maintained by hand.
//
//   node tools/evidence.mjs          rewrite the generated sections
//   node tools/evidence.mjs --check  exit 1 if the doc differs from the data

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODELS, V3_NOTE } from "../data/catalog.mjs";
import { GROUPS, PRESETS, classOf, resolveSheet, ruleFor, ruleText, ROLES, shippedCells } from "./presets.mjs";
import { loadSnapshot } from "./vulcanbench.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docPath = path.join(root, "docs", "model-evidence.md");

const MARKERS = {
  cells: ["<!-- vulcanbench:cells -->", "<!-- /vulcanbench:cells -->"],
  inferred: ["<!-- vulcanbench:inferred -->", "<!-- /vulcanbench:inferred -->"],
  presets: ["<!-- vulcanbench:presets -->", "<!-- /vulcanbench:presets -->"],
  droid: ["<!-- droid-bench:cells -->", "<!-- /droid-bench:cells -->"],
};
const droidBenchPath = path.join(root, "data", "droid-bench.json");

const pct = (x) => `${(x * 100).toFixed(1)}%`;

function droidTable(cells) {
  const bench = JSON.parse(fs.readFileSync(droidBenchPath, "utf8"));
  const rows = Object.entries(bench.cells).map(([name, b]) => {
    const cell = cells.find((c) => c.name === name);
    const range = b.resolvedRateRange[0] === b.resolvedRateRange[1] ? "" : ` (${pct(b.resolvedRateRange[0])} to ${pct(b.resolvedRateRange[1])})`;
    return `| \`${name}\` | ${MODELS[cell.model].vbName} / ${cell.effort} | ${pct(b.resolvedRate)}${range} | ${pct(b.functional)} | ${b.medianMinutes.toFixed(1)} | ${b.medianCredits == null ? "n/a" : Math.round(b.medianCredits).toLocaleString("en-US")} | ${b.tasks} × ${b.repeats} (${b.infraFailures} infra) |`;
  });
  return [
    "| Droid | Model / effort | Resolved (range across repeats) | Hidden tests passed | Median min | Median credits | Tasks × repeats |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

const usd = (value, estimated) => `$${value.toFixed(2)}${estimated ? " (estimate)" : ""}`;
const score = (value) => `${+value.toFixed(2)}%`;

function measuredTable(cells) {
  const rows = cells
    .filter((c) => !c.inferred)
    .map((c) => `| \`${c.name}\` | ${MODELS[c.model].vbName} / ${c.effort} | ${c.score.toFixed(2)} | ${c.passed}/${c.passed_of} | ${c.usdEstimated ? "~" : ""}${usd(c.usd, c.usdEstimated)} | ${c.minutes.toFixed(1)} | ${c.multiplier}× |`);
  return [
    "| Droid | Model / effort | Score | Passed | $/task | Min/task | Droid multiplier |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function inferredTable(cells) {
  let previousWhy = null;
  const rows = cells
    .filter((c) => c.inferred)
    .map((c) => {
      const evidence = `v3: ${c.inferredName} ${c.effort} ${score(c.score)} at ${usd(c.usd, false)}, ${+c.minutes.toFixed(1)} min`;
      const note = c.v3Note ? ` ${c.v3Note}` : "";
      const why = V3_NOTE === previousWhy ? "Same as above." : V3_NOTE;
      previousWhy = V3_NOTE;
      return `| \`${c.name}\` | ${MODELS[c.model].vbName} / ${c.effort} | ${evidence}.${note} | ${why} |`;
    });
  return ["| Droid | Model / effort | Evidence | Why it is inferred |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

const groupRoles = (group) => (group.role ? [group.role] : ROLES.filter((role) => classOf(role) === group.klass));

function groupLines(preset, group, rows) {
  const roles = groupRoles(group);
  const names = (role) => rows.find((r) => r.role === role).value.map((n) => `\`${n}\``).join(", ");
  const pins = roles.map((role) => PRESETS[preset].pins.find((p) => p.role === role));
  if (pins.every(Boolean) && new Set(pins.map((p) => `${p.droid}|${p.reason}`)).size === 1) {
    return [`- ${group.label}: ${names(roles[0])} (pinned because ${pins[0].reason}).`];
  }
  const lines = [`- ${group.label}: ${names(roles[0])} (${ruleText(ruleFor(preset, roles[0]))}).`];
  const lists = new Map();
  for (const role of roles) {
    const key = rows.find((r) => r.role === role).value.join(", ");
    if (!lists.has(key)) lists.set(key, { value: names(role), roles: [] });
    lists.get(key).roles.push(role);
  }
  if (group.klass === "panels" && lists.size > 1) {
    for (const entry of lists.values()) lines.push(`  - ${entry.roles.join(", ")}: ${entry.value}`);
  }
  return lines;
}

function presetsSection(cells) {
  const lines = [];
  for (const preset of Object.keys(PRESETS)) {
    const rows = resolveSheet(preset, cells);
    lines.push(`**${preset.charAt(0).toUpperCase() + preset.slice(1)}.** ${PRESETS[preset].summary}`, "");
    for (const group of GROUPS) lines.push(...groupLines(preset, group, rows));
    const pins = new Map();
    for (const pin of PRESETS[preset].pins) {
      const key = `${pin.droid}|${pin.reason}`;
      if (!pins.has(key)) pins.set(key, { droid: pin.droid, reason: pin.reason, roles: [] });
      pins.get(key).roles.push(pin.role);
    }
    if (!pins.size) lines.push("- Pins: none.");
    else for (const pin of pins.values()) lines.push(`- Pin: ${pin.roles.map((r) => `\`${r}\``).join(", ")} run on \`${pin.droid}\`, because ${pin.reason}.`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function replaceBetween(text, [start, end], body) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a < 0 || b < 0) throw new Error(`docs/model-evidence.md is missing ${start} ... ${end}`);
  return text.slice(0, a + start.length) + "\n" + body + "\n" + text.slice(b);
}

export function renderDoc(cells = shippedCells(), snapshot = loadSnapshot()) {
  let text = fs.readFileSync(docPath, "utf8");
  if (!/^Data pulled on \d{4}-\d{2}-\d{2} from:$/m.test(text)) throw new Error("docs/model-evidence.md has no \"Data pulled on <date> from:\" line");
  text = text.replace(/^Data pulled on \d{4}-\d{2}-\d{2} from:$/m, `Data pulled on ${snapshot.pulled} from:`);
  text = replaceBetween(text, MARKERS.cells, measuredTable(cells));
  text = replaceBetween(text, MARKERS.inferred, inferredTable(cells));
  text = replaceBetween(text, MARKERS.presets, presetsSection(cells));
  text = replaceBetween(text, MARKERS.droid, droidTable(cells));
  return text;
}

function main() {
  const check = process.argv.includes("--check");
  const updated = renderDoc();
  const current = fs.readFileSync(docPath, "utf8");
  if (updated === current) {
    console.log(check ? "docs/model-evidence.md matches the snapshot and the presets." : "docs/model-evidence.md is already current.");
    return;
  }
  if (check) {
    console.error("docs/model-evidence.md is out of date with the data. Run node tools/evidence.mjs.");
    process.exit(1);
  }
  fs.writeFileSync(docPath, updated);
  console.log("Wrote docs/model-evidence.md.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`evidence: ${error.message}`);
    process.exit(1);
  }
}
