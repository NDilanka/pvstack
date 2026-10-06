#!/usr/bin/env node
// Writes data/vulcanbench.json from the two published VulcanBench board CSVs.
// The snapshot is the source for the mode sheets (tools/presets.mjs) and for
// the numbers in docs/model-evidence.md (tools/evidence.mjs).
//
//   node tools/vulcanbench.mjs                fetch and rewrite data/vulcanbench.json
//   node tools/vulcanbench.mjs --check-fresh  fetch, warn if the published rows moved, always exit 0

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COST_ESTIMATES, MODELS, V3_CELLS } from "../data/catalog.mjs";
import { CELLS } from "./droids.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_PATH = path.join(root, "data", "vulcanbench.json");

export const SOURCES = {
  frontier: "https://vulcanbench.com/assets/data/swe-v4-board.csv",
  routine: "https://vulcanbench.com/assets/data/routine-v1-board.csv",
};

const EFFORTS = { "extra-high": "xhigh" };
const normEffort = (value) => EFFORTS[value] ?? value;
const num = (value) => (value == null || value === "" ? null : Number(value));
const bool = (value) => value === "True";
const round = (value, places) => Number(value.toFixed(places));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.length > 1).map((values) => Object.fromEntries(header.map((name, i) => [name, values[i]])));
}

export function frontierRows(csv) {
  return parseCsv(csv)
    .map((r) => ({
      rank: num(r.rank),
      model: r.model,
      lab: r.lab,
      harness: r.harness,
      effort: normEffort(r.effort),
      n: num(r.n),
      passed: num(r.passed),
      passed_of: num(r.passed_of),
      score: num(r.combined_33),
      se: num(r.combined_33_se),
      code_quality: num(r.code_quality),
      minutes: num(r.mean_minutes),
      usd: num(r.mean_usd),
    }))
    .sort((a, b) => a.rank - b.rank);
}

export function routineRows(csv) {
  return parseCsv(csv).map((r) => ({
    model: r.model,
    lab: r.lab,
    harness: r.harness,
    effort: normEffort(r.effort),
    routine: bool(r.suggested_for_routine),
    n: num(r.n),
    passed: num(r.passed),
    score: num(r.combined_33),
    se: num(r.combined_33_se),
    code_quality: num(r.code_quality_l1),
    minutes: round(num(r.mean_seconds) / 60, 2),
    usd: num(r.mean_usd),
  }));
}

export function snapshotFrom(frontierCsv, routineCsv, pulled) {
  return {
    pulled,
    sources: SOURCES,
    frontier: frontierRows(frontierCsv),
    routine: routineRows(routineCsv),
  };
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
}

export async function fetchSnapshot() {
  const [frontier, routine] = await Promise.all([fetchText(SOURCES.frontier), fetchText(SOURCES.routine)]);
  return snapshotFrom(frontier, routine, new Date().toISOString().slice(0, 10));
}

export function loadSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) throw new Error(`${SNAPSHOT_PATH} is missing. Run node tools/vulcanbench.mjs.`);
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
}

const rowKey = (r) => `${r.model}|${r.effort}|${r.harness}`;
const index = (rows) => new Map(rows.map((r) => [rowKey(r), JSON.stringify(r)]));

function movedRows(before, after) {
  const a = index(before);
  const b = index(after);
  const moved = [];
  for (const [key, row] of b) {
    if (!a.has(key)) moved.push(`new row ${key}`);
    else if (a.get(key) !== row) moved.push(`changed row ${key}`);
  }
  for (const key of a.keys()) if (!b.has(key)) moved.push(`dropped row ${key}`);
  return moved;
}

/** Joins each CELL to its evidence. A cell's own board row wins over the v3 rows and the cost estimates. */
export function cellData() {
  const snapshot = loadSnapshot();
  const benchFile = path.join(root, "data", "droid-bench.json");
  const droidBench = fs.existsSync(benchFile) ? JSON.parse(fs.readFileSync(benchFile, "utf8")).cells : {};
  const frontier = new Map(snapshot.frontier.map((r) => [`${r.model}|${r.effort}`, r]));
  const v3 = new Map(V3_CELLS.map((r) => [`${r.model}|${r.effort}`, r]));
  const estimates = new Map(COST_ESTIMATES.map((r) => [`${r.model}|${r.effort}`, r]));
  return CELLS.map((cell) => {
    const model = MODELS[cell.model];
    if (!model) throw new Error(`${cell.name}: ${cell.model} is not in data/catalog.mjs`);
    const row = frontier.get(`${model.boardName}|${cell.effort}`);
    const older = v3.get(`${cell.model}|${cell.effort}`);
    if (!row && !older) throw new Error(`${cell.name}: ${model.boardName} ${cell.effort} is on neither VulcanBench board`);
    const estimate = estimates.get(`${cell.model}|${cell.effort}`);
    return {
      ...cell,
      vbName: model.vbName,
      lab: model.lab,
      openWeights: model.openWeights,
      safety: model.safety,
      multiplier: model.multiplier,
      score: row ? row.score : older.score,
      passed: row ? row.passed : null,
      passed_of: row ? row.passed_of : null,
      usd: row ? (row.usd ?? estimate?.usd ?? null) : older.usd,
      usdEstimated: row ? row.usd == null && estimate != null : false,
      minutes: row ? row.minutes : older.minutes,
      inferred: !row,
      inferredName: older?.boardName ?? null,
      v3Note: older?.note ?? null,
      droid: droidBench[cell.name]
        ? { resolvedRate: droidBench[cell.name].resolvedRate, credits: droidBench[cell.name].medianCredits, minutes: droidBench[cell.name].medianMinutes }
        : null,
    };
  });
}

async function checkFresh() {
  let fresh;
  try {
    fresh = await fetchSnapshot();
  } catch (error) {
    console.warn(`WARNING: could not fetch VulcanBench (${error.message}). Snapshot freshness unknown.`);
    return;
  }
  const moved = [...movedRows(loadSnapshot().frontier, fresh.frontier), ...movedRows(loadSnapshot().routine, fresh.routine)];
  if (!moved.length) return;
  console.warn(`WARNING: VulcanBench published ${moved.length} row(s) that differ from data/vulcanbench.json:`);
  for (const line of moved.slice(0, 10)) console.warn(`  ${line}`);
  if (moved.length > 10) console.warn(`  ...and ${moved.length - 10} more`);
  console.warn("Run node tools/vulcanbench.mjs, then npm run presets and npm run evidence.");
}

async function main() {
  if (process.argv.includes("--check-fresh")) return checkFresh();
  const snapshot = await fetchSnapshot();
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`Wrote ${path.relative(root, SNAPSHOT_PATH)}: ${snapshot.frontier.length} frontier rows, ${snapshot.routine.length} routine rows, pulled ${snapshot.pulled}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`vulcanbench: ${error.message}`);
    process.exit(1);
  });
}
