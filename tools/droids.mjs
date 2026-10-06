#!/usr/bin/env node
// Writes plugins/pvstack/droids/pv-*.md from CELLS. Each cell is one VulcanBench
// model x effort column; mode sheets map pstack roles onto these droid names.
//
//   node tools/droids.mjs           write the droids and delete pv-*.md files not in CELLS
//   node tools/droids.mjs --check   exit 1 if a droid file differs from CELLS or is not in CELLS

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const droidDir = path.join(root, "plugins", "pvstack", "droids");

export const CELLS = [
  { name: "pv-sol-low", model: "gpt-6.1-sol", effort: "low", label: "GPT-6.1 Sol, low effort", use: "Fast read-only exploration and mechanical edits." },
  { name: "pv-sol-high", model: "gpt-6.1-sol", effort: "high", label: "GPT-6.1 Sol, high effort", use: "Code delegates: feature, refactoring, bug fix, perf, hillclimb, swarm workers." },
  { name: "pv-sol-xhigh", model: "gpt-6.1-sol", effort: "xhigh", label: "GPT-6.1 Sol, extra-high effort", use: "Review panels and reflect tooling where Sol's best score matters." },
  { name: "pv-opus-medium", model: "claude-opus-5-5", effort: "medium", label: "Claude Opus 5.5, medium effort", use: "Judgment, prose, explainers, synthesizers, and review panels." },
  { name: "pv-opus-high", model: "claude-opus-5-5", effort: "high", label: "Claude Opus 5.5, high effort", use: "Quality preset judgment, and the hardest changes in the Safe preset." },
  { name: "pv-grok-high", model: "grok-4.7", effort: "high", label: "Grok 4.7, high effort", use: "Third-lab member of review panels." },
  { name: "pv-grok-xhigh", model: "grok-4.7", effort: "xhigh", label: "Grok 4.7, extra-high effort", use: "The hardest changes: cross-cutting design, concurrency, subtle algorithms." },
  { name: "pv-ds-low", model: "deepseek-v4.1-flash", effort: "low", label: "DeepSeek V4.1 Flash, low effort", use: "Budget mode: exploration and mechanical tasks." },
  { name: "pv-ds-high", model: "deepseek-v4.1-flash", effort: "high", label: "DeepSeek V4.1 Flash, high effort", use: "Budget mode: swarm workers." },
  { name: "pv-ds-max", model: "deepseek-v4.1-flash", effort: "max", label: "DeepSeek V4.1 Flash, max effort", use: "Budget mode: code delegates and review panels." },
];

function render(cell) {
  return `---
name: ${cell.name}
description: "pvstack role droid pinned to ${cell.label}. ${cell.use} Spawn it when the pvstack role sheet maps a role to ${cell.name}."
model: ${cell.model}
reasoningEffort: ${cell.effort}
---

You are a pvstack subagent running on ${cell.label}. The parent picked you because its role sheet maps the current role to \`${cell.name}\`.

- If the prompt says to operate as \`poteto-agent\`, load the \`poteto-mode\` skill and read its \`SKILL.md\` in full before any work, including the Principles index, then follow it. Open a leaf \`principle-*\` skill whenever you apply that principle. If the Skill tool will not load a skill, read its \`SKILL.md\` from the plugin's \`skills/\` directory instead.
- If the prompt marks the task read-only, do not create, edit, or delete files, and do not run commands that change state.
- Otherwise follow the prompt as written.

You cannot ask the user questions or spawn subagents. When something is unclear or blocked, say so in your final message instead of guessing.

End with one message the parent can check: what you did, the evidence (commands run, output, file and line references), and what is still open.
`;
}

function main() {
  const check = process.argv.includes("--check");
  const drift = [];
  fs.mkdirSync(droidDir, { recursive: true });
  const names = new Set(CELLS.map((c) => c.name));
  for (const file of fs.readdirSync(droidDir)) {
    if (!file.endsWith(".md")) continue;
    const name = file.slice(0, -3);
    if (!name.startsWith("pv-") || names.has(name)) continue;
    if (check) drift.push(`${name} (no longer in CELLS)`);
    else fs.rmSync(path.join(droidDir, file));
  }
  for (const cell of CELLS) {
    const file = path.join(droidDir, `${cell.name}.md`);
    const text = render(cell);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) drift.push(cell.name);
    } else {
      fs.writeFileSync(file, text);
    }
  }
  if (check && drift.length) {
    console.error(`Droids out of date: ${drift.join(", ")}. Run node tools/droids.mjs.`);
    process.exit(1);
  }
  console.log(check ? `${CELLS.length} droids match CELLS.` : `Wrote ${CELLS.length} droids.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
