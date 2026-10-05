#!/usr/bin/env node
// Renders playbook/src/content.mjs into playbook/index.html (interactive, self-contained),
// playbook/playbook.md (the full content for agents), and playbook/llms.txt.
// style.css and app.js from playbook/src are inlined into the HTML.
//
//   node tools/playbook.mjs           validate the content and write the three outputs
//   node tools/playbook.mjs --check   exit 1 if the content is invalid or an output differs from disk

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as content from "../playbook/src/content.mjs";
import { CELLS } from "./droids.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = path.join(root, "plugins", "pvstack", "skills");
const modesDir = path.join(skillsDir, "setup-pvstack", "modes");
const srcDir = path.join(root, "playbook", "src");
const outDir = path.join(root, "playbook");

const MODES = ["greenfield", "brownfield"];
const SECTION_IDS = ["top", "main", "for-agents", "loop", "lines", "greenfield", "brownfield", "platforms", "skills", "principles", "recipes", "pitfalls", "glossary", "routing"];

// Each repo-backed SourceRef kind maps to one file path. "p1"/"p2" style ids resolve through meta.sources.
const SOURCE_KINDS = [
  [/^guide\/([\w.-]+\.md)$/, (f) => `plugins/pvstack/docs/upstream/guide/${f}`],
  [/^skills\/([\w-]+)$/, (d) => `plugins/pvstack/skills/${d}/SKILL.md`],
  [/^playbooks\/([\w.-]+\.md)$/, (f) => `plugins/pvstack/skills/poteto-mode/playbooks/${f}`],
];

const blob = (C, rel) => `${C.meta.repo}/blob/main/${rel}`;
const skillUrl = (C, id) => blob(C, `plugins/pvstack/skills/${id}/SKILL.md`);

function sourceFile(ref) {
  for (const [re, toPath] of SOURCE_KINDS) {
    const m = re.exec(ref);
    if (m) return toPath(m[1]);
  }
  return null;
}

function resolveSource(C, ref) {
  const article = C.meta.sources.find((s) => s.id === ref);
  if (article) return { label: article.title, url: article.url };
  const rel = sourceFile(ref);
  return rel ? { label: ref, url: blob(C, rel) } : null;
}

function sharedIdOf(C, step) {
  const hit = C.sharedStations.find((s) => s.station.toLowerCase() === step.station.toLowerCase() || step.id.endsWith(`-${s.id}`));
  return hit ? hit.id : null;
}


function readRouting() {
  const modes = [];
  for (const file of fs.readdirSync(modesDir).filter((f) => f.endsWith(".md")).sort()) {
    let id = file.slice(0, -3);
    const roles = new Map();
    for (const line of fs.readFileSync(path.join(modesDir, file), "utf8").split(/\r?\n/)) {
      const mode = /^#\s*mode:\s*(\S+)/.exec(line);
      if (mode) id = mode[1];
      if (!line.trim() || line.startsWith("#")) continue;
      const idx = line.lastIndexOf(": ");
      if (idx < 0) throw new Error(`${file}: unparseable line "${line}"`);
      roles.set(line.slice(0, idx), line.slice(idx + 2).split(",").map((v) => v.trim()));
    }
    modes.push({ id, roles });
  }
  const roles = [];
  for (const m of modes) for (const r of m.roles.keys()) if (!roles.includes(r)) roles.push(r);
  const rows = roles.map((role) => ({ role, cells: modes.map((m) => m.roles.get(role) || []) }));
  return { modes: modes.map((m) => m.id), rows };
}

const cellFor = (name) => CELLS.find((c) => c.name === name);
const isInherit = (name) => ["inherit", "inherit-parent", "auto"].includes(name);
const droidLabel = (name) => (isInherit(name) ? "Parent model" : cellFor(name).label);


function* strings(value, at) {
  if (typeof value === "string") yield [at, value];
  else if (Array.isArray(value)) for (let i = 0; i < value.length; i++) yield* strings(value[i], `${at}[${i}]`);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) yield* strings(v, `${at}.${k}`);
}

export function validate(C, routing = readRouting()) {
  const errors = [];
  const skillDirs = new Set(fs.readdirSync(skillsDir).filter((d) => fs.statSync(path.join(skillsDir, d)).isDirectory()));

  for (const key of ["meta", "agentBrief", "platforms", "loop", "chapters", "lines", "sharedStations", "skills", "principles", "recipes", "pitfalls", "glossary", "routing"]) {
    for (const [at, s] of strings(C[key], key)) if (/[\u2013\u2014]/.test(s)) errors.push(`${at}: contains a long dash ("\u2014" or "\u2013"). Use a period or comma.`);
  }

  const checkSources = (refs, at) => {
    refs.forEach((ref, i) => {
      if (C.meta.sources.some((s) => s.id === ref)) return;
      const rel = sourceFile(ref);
      if (!rel) errors.push(`${at}.sources[${i}]: "${ref}" is not a SourceRef (p-id, guide/<f>.md, skills/<dir>, playbooks/<f>.md).`);
      else if (!fs.existsSync(path.join(root, rel))) errors.push(`${at}.sources[${i}]: "${ref}" points at ${rel}, which does not exist.`);
    });
  };
  const checkSkill = (id, at) => {
    if (!skillDirs.has(id)) errors.push(`${at}: "${id}" is not a directory under plugins/pvstack/skills.`);
  };

  const ids = new Map(SECTION_IDS.map((id) => [id, "a fixed section"]));
  const claim = (id, at) => {
    if (ids.has(id)) errors.push(`${at}: id "${id}" is already used by ${ids.get(id)}.`);
    else ids.set(id, at);
  };

  C.chapters.forEach((ch, i) => {
    claim(ch.id, `chapters[${i}]`);
    checkSources(ch.sources, `chapters[${i}]`);
  });
  if (!C.chapters.some((ch) => ch.id === "pick")) errors.push(`chapters: no chapter with id "pick". The lines render after it.`);

  for (const mode of MODES) {
    const line = C.lines[mode];
    if (!line) {
      errors.push(`lines.${mode}: missing.`);
      continue;
    }
    const order = C.sharedStations.map((s) => s.id);
    const visited = [];
    line.steps.forEach((step, i) => {
      const at = `lines.${mode}.steps[${i}]`;
      claim(step.id, at);
      step.skills.forEach((s, j) => checkSkill(s, `${at}.skills[${j}]`));
      checkSources(step.sources, at);
      const shared = sharedIdOf(C, step);
      if (!shared) return;
      const name = (id) => C.sharedStations[order.indexOf(id)].station;
      if (visited.includes(shared)) errors.push(`${at}: "${step.station}" is the shared station ${name(shared)} a second time. A line passes each shared station at most once.`);
      else if (visited.length && order.indexOf(shared) < order.indexOf(visited.at(-1)))
        errors.push(`${at}: shared station ${name(shared)} comes after ${name(visited.at(-1))}. Every line visits shared stations in the order sharedStations lists them (${C.sharedStations.map((s) => s.station).join(", ")}).`);
      visited.push(shared);
    });
  }

  C.skills.forEach((s, i) => checkSkill(s.id, `skills[${i}]`));
  C.principles.forEach((p, i) => checkSkill(p.id, `principles[${i}]`));
  C.recipes.forEach((r, i) => {
    checkSources(r.sources, `recipes[${i}]`);
    if (![...MODES, "any"].includes(r.mode)) errors.push(`recipes[${i}].mode: "${r.mode}" must be greenfield, brownfield, or any.`);
  });
  C.pitfalls.forEach((p, i) => checkSources(p.sources, `pitfalls[${i}]`));

  const pf = new Set();
  C.platforms.forEach((p, i) => {
    if (pf.has(p.id)) errors.push(`platforms[${i}]: duplicate id "${p.id}".`);
    pf.add(p.id);
  });
  if (!C.platforms.length) errors.push("platforms: at least one platform is required.");

  for (const row of routing.rows) {
    for (const names of row.cells) for (const n of names) if (!isInherit(n) && !cellFor(n)) errors.push(`routing "${row.role}": "${n}" is not a droid in CELLS.`);
  }
  return errors;
}


const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s) {
  return String(s)
    .split(/(`[^`]+`)/)
    .map((part) => (part.startsWith("`") && part.endsWith("`") && part.length > 1 ? `<code>${esc(part.slice(1, -1))}</code>` : esc(part).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")))
    .join("");
}

const promptHtml = (text) => esc(text).replace(/&lt;([^&\s][^&]*?)&gt;/g, '<mark class="ph">&lt;$1&gt;</mark>');
const paras = (list, cls = "") => list.map((p) => `<p${cls ? ` class="${cls}"` : ""}>${inline(p)}</p>`).join("\n");
const pad2 = (n) => String(n).padStart(2, "0");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);


const ICON = {
  copy: '<svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><rect x="5" y="5" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V3a1 1 0 0 1 1-1h7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  theme: '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>',
  bot: '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="7" width="16" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v4M9 12h.01M15 12h.01M9 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  repeat: '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const copyButton = (label = "Copy") => `<button type="button" class="copy" data-copy>${ICON.copy}<span>${label}</span></button>`;

function sourcesHtml(C, refs) {
  if (!refs.length) return "";
  const items = refs.map((ref) => resolveSource(C, ref)).map((s) => `<li><a href="${esc(s.url)}">${esc(s.label)}</a></li>`);
  return `<div class="sources"><span class="sources-label">Sources</span><ul>${items.join("")}</ul></div>`;
}

function deeperHtml(list) {
  if (!list.length) return "";
  return `<details class="deeper blueprint"><summary><span>Go deeper</span></summary><div class="deeper-body">${paras(list)}</div></details>`;
}

function promptCard(C, p) {
  const first = C.platforms[0];
  return `<figure class="prompt">
<figcaption><span class="prompt-intent">${inline(p.intent)}</span>${copyButton()}</figcaption>
<pre><code data-copy-source>${promptHtml(p.text)}</code></pre>
<p class="prompt-on"><span class="prompt-on-label">On <span data-pf-name>${esc(first.name)}</span></span> <span data-pf-invoke>${inline(first.invoke)}</span></p>
</figure>`;
}

const promptsHtml = (C, list) => (list.length ? `<div class="prompts">${list.map((p) => promptCard(C, p)).join("\n")}</div>` : "");

function stepHtml(C, { step, mode, n, shared }, total) {
  const line = C.lines[mode];
  const other = MODES.find((m) => m !== mode);
  const sharedNote = shared ? `<span class="shared-badge">Shared with the ${esc(C.lines[other].name)} line</span>` : "";
  const skills = step.skills.length
    ? `<div class="step-skills"><span class="mini-label">Skills</span><ul class="chips">${step.skills.map((s) => `<li><a class="chip" href="${esc(skillUrl(C, s))}">/${esc(s)}</a></li>`).join("")}</ul></div>`
    : "";
  const done = step.done.length
    ? `<section class="done" aria-labelledby="${step.id}-done"><h4 id="${step.id}-done">Done when</h4><ul>${step.done
        .map((d, j) => `<li><label><input type="checkbox" data-done="${step.id}" data-index="${j}"><span>${inline(d)}</span></label></li>`)
        .join("")}</ul></section>`
    : "";
  const pitfalls = step.pitfalls.length
    ? `<section class="step-pitfalls" aria-labelledby="${step.id}-pit"><h4 id="${step.id}-pit">Watch out</h4><ul>${step.pitfalls.map((p) => `<li>${inline(p)}</li>`).join("")}</ul></section>`
    : "";
  return `<article class="station reveal${shared ? " is-shared" : ""}" id="${step.id}" data-mode="${mode}" aria-labelledby="${step.id}-h">
<div class="station-marker" aria-hidden="true"><span>${pad2(n)}</span></div>
<header class="station-head">
<p class="station-meta"><span class="station-line">${esc(line.name)} line</span> <span class="station-of">Station ${n} of ${total}</span> <span class="station-name">${esc(step.station)}</span>${sharedNote}</p>
<h3 id="${step.id}-h">${inline(step.title)}</h3>
${step.done.length ? `<p class="station-progress" data-progress="${step.id}" aria-live="polite">0 of ${step.done.length} done</p>` : ""}
</header>
<div class="station-body">
${paras(step.plain)}
${deeperHtml(step.deeper)}
${skills}
${promptsHtml(C, step.prompts)}
${done}
${pitfalls}
${sourcesHtml(C, step.sources)}
</div>
</article>`;
}

// Positions run along the map in station spacings (u). Shared stations are interchanges: every
// line that passes one meets the others there. Between two interchanges each line spreads its own
// stations evenly, and the stretch is as long as the busier line needs, so the quieter line gets
// wider spacing. A line runs on its own row between interchanges and on its own lane of a shared
// trunk at them. Both maps project this one model; only the projection differs.

const BEND = 0.8;
const STUB = 0.55;
const TRUNK = 0.09;

function mapModel(C) {
  const A = C.sharedStations.length;
  const anchors = C.sharedStations.map((sh) => ({ id: sh.id, label: sh.station, hrefs: {}, u: 0 }));
  const spans = [];
  const lines = {};
  for (const mode of MODES) {
    const stops = C.lines[mode].steps.map((step, i) => ({ step, mode, n: i + 1, shared: sharedIdOf(C, step), u: 0 }));
    let from = -1;
    let run = [];
    for (const s of stops) {
      if (!s.shared) {
        run.push(s);
        continue;
      }
      s.anchor = C.sharedStations.findIndex((sh) => sh.id === s.shared);
      anchors[s.anchor].hrefs[mode] = s.step.id;
      spans.push({ from, to: s.anchor, stops: run });
      from = s.anchor;
      run = [];
    }
    spans.push({ from, to: A, stops: run });
    lines[mode] = { stops };
  }
  // width[j] is the stretch that ends at anchor j (j === A is the open end). Spans that skip an
  // interchange are sized after the single-stretch spans, so they only add what is still missing.
  const width = Array(A + 1).fill(1);
  for (const sp of [...spans].sort((p, q) => p.to - p.from - (q.to - q.from))) {
    const have = width.slice(sp.from + 1, sp.to + 1).reduce((a, b) => a + b, 0);
    width[sp.to] += Math.max(0, sp.stops.length + 1 - have);
  }
  const bound = [0];
  for (const w of width) bound.push(bound.at(-1) + w);
  anchors.forEach((a, j) => (a.u = bound[j + 1]));
  for (const sp of spans) {
    const [u0, u1] = [bound[sp.from + 1], bound[sp.to + 1]];
    sp.stops.forEach((s, k) => (s.u = u0 + ((k + 1) * (u1 - u0)) / (sp.stops.length + 1)));
  }
  const us = [];
  for (const mode of MODES) {
    const line = lines[mode];
    for (const s of line.stops) if (s.shared) s.u = anchors[s.anchor].u;
    line.points = line.stops.map((s) => ({ u: s.u, lane: s.shared ? "trunk" : "row" }));
    line.stub = line.stops[0]?.shared ? line.stops[0].u - STUB : null;
    if (line.stub !== null) line.points.unshift({ u: line.stub, lane: "trunk" });
    us.push(...line.points.map((p) => p.u));
  }
  const side = (mode) => (MODES.indexOf(mode) === 0 ? -1 : 1);
  return { anchors, lines, uMin: Math.min(...us), uMax: Math.max(...us), offset: (mode, lane) => side(mode) * (lane === "row" ? 1 : TRUNK) };
}

// at(u, offset) returns "x y". Lines change lanes only next to an interchange.
function trackPath(M, mode, at) {
  const pts = M.lines[mode].points;
  const xy = (u, lane) => at(u, M.offset(mode, lane));
  let d = `M${xy(pts[0].u, pts[0].lane)}`;
  for (let i = 1; i < pts.length; i++) {
    const [p, q] = [pts[i - 1], pts[i]];
    if (p.lane === q.lane) {
      d += ` L${xy(q.u, q.lane)}`;
      continue;
    }
    const [u0, u1] = p.lane === "trunk" ? [p.u, p.u + BEND] : [q.u - BEND, q.u];
    const m = (u0 + u1) / 2;
    d += ` L${xy(u0, p.lane)} C${xy(m, p.lane)} ${xy(m, q.lane)} ${xy(u1, q.lane)} L${xy(q.u, q.lane)}`;
  }
  return d;
}

const startsHere = (C, mode) => `${C.lines[mode].name} starts here`;

function hrefAttrs(hrefs) {
  const target = hrefs[MODES.find((m) => hrefs[m])];
  const data = MODES.filter((m) => hrefs[m]).map((m) => ` data-href-${m}="#${hrefs[m]}"`).join("");
  return target ? { target, attrs: ` href="#${target}"${data} data-station="${target}"` } : null;
}

function boardHtml(C, M) {
  const S = 100, X0 = 80, R = 125, MID = 110 + R, H = MID + R + 230;
  // The near row hangs its labels toward the viewer on leader lines, so they never cover the far row.
  // Two drop depths are enough there; the far row's standing labels need three heights.
  const LIFTS = [40, 88, 136];
  const DROPS = [66, 180];
  const W = Math.round(X0 * 2 + (M.uMax - M.uMin) * S);
  const X = (u) => +(X0 + (u - M.uMin) * S).toFixed(1);
  const at = (u, off) => `${X(u)} ${+(MID + off * R).toFixed(1)}`;
  const paths = Object.fromEntries(MODES.map((m) => [m, trackPath(M, m, at)]));
  const svg = [];
  for (const m of MODES) svg.push(`<path class="track-bed" d="${paths[m]}"/>`);
  for (const m of MODES) svg.push(`<path class="track" data-track="${m}" stroke="${esc(C.lines[m].color)}" d="${paths[m]}"/>`);
  for (const m of MODES) {
    const stub = M.lines[m].stub;
    if (stub === null) continue;
    const y = MID + M.offset(m, "trunk") * R;
    const dy = Math.sign(M.offset(m, "trunk"));
    svg.push(`<path class="terminus" data-track="${m}" stroke="${esc(C.lines[m].color)}" d="M${X(stub)} ${y - 13} V${y + 13}"/>`);
    svg.push(`<text class="board-note" data-track="${m}" fill="${esc(C.lines[m].color)}" x="${X(stub) + 6}" y="${y + dy * 52}" text-anchor="end">${esc(startsHere(C, m))}</text>`);
  }
  const pillars = [];
  for (const m of MODES) {
    M.lines[m].stops.filter((s) => !s.shared).forEach((s, k) => {
      const near = M.offset(m, "row") > 0;
      const y = MID + M.offset(m, "row") * R;
      const place = near ? `--drop:${DROPS[k % DROPS.length]}px` : `--lift:${LIFTS[k % LIFTS.length]}px`;
      const style = `left:${X(s.u)}px;top:${y}px;${place};--c:${esc(C.lines[m].color)}`;
      pillars.push(`<a class="pillar${near ? " below" : ""}" data-track="${m}" style="${style}" href="#${s.step.id}" data-station="${s.step.id}"><b></b><i></i><span>${esc(s.step.station)}</span></a>`);
    });
  }
  M.anchors.forEach((a, j) => {
    const link = hrefAttrs(a.hrefs);
    const style = `left:${X(a.u)}px;top:${MID}px;--lift:${j % 2 ? 124 : 64}px`;
    const inner = `<b></b><i></i><span>${esc(a.label)}</span>`;
    pillars.push(link ? `<a class="pillar shared" style="${style}"${link.attrs}>${inner}</a>` : `<span class="pillar shared dead" style="${style}">${inner}</span>`);
  });
  const trains = MODES.map((m, i) => `<span class="train" data-track="${m}" style="--c:${esc(C.lines[m].color)};--dur:${(W / 105 + i * 1.3).toFixed(1)}s;--delay:${-i * 2.1}s;offset-path:path('${paths[m]}')"></span>`).join("");
  return `<nav class="board-nav" aria-label="Line map">
<div class="board-stage"><div class="board-fit"><div class="board" style="width:${W}px;height:${H}px">
<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${svg.join("")}</svg>
${pillars.join("")}${trains}
</div></div></div>
</nav>`;
}

function flatMapHtml(C, M) {
  const SV = 48, Y0 = 34, XR = 16;
  const H = Math.round(Y0 * 2 + (M.uMax - M.uMin) * SV);
  const Y = (u) => +(Y0 + (u - M.uMin) * SV).toFixed(1);
  const at = (u, off) => `${+(50 + off * XR).toFixed(2)} ${Y(u)}`;
  const tracks = MODES.map((m) => `<path data-track="${m}" stroke="${esc(C.lines[m].color)}" d="${trackPath(M, m, at)}"/>`).join("");
  const items = [];
  for (const m of MODES) {
    const side = M.offset(m, "row") < 0 ? "left" : "right";
    for (const s of M.lines[m].stops.filter((x) => !x.shared)) {
      items.push(`<a class="fm-stop ${side}" data-track="${m}" style="top:${Y(s.u)}px;--x:${50 + M.offset(m, "row") * XR}%;--c:${esc(C.lines[m].color)}" href="#${s.step.id}" data-station="${s.step.id}"><span class="fm-dot"></span><span class="fm-label">${esc(s.step.station)}</span></a>`);
    }
    const stub = M.lines[m].stub;
    if (stub !== null) {
      items.push(`<span class="fm-note ${side}" data-track="${m}" style="top:${Y(stub)}px;--x:${50 + M.offset(m, "trunk") * XR}%;--c:${esc(C.lines[m].color)}" aria-hidden="true"><span class="fm-term"></span><span class="fm-label">${esc(startsHere(C, m))}</span></span>`);
    }
  }
  for (const a of M.anchors) {
    const link = hrefAttrs(a.hrefs);
    const inner = `<span class="fm-dot"></span><span class="fm-label">${esc(a.label)}</span>`;
    const style = ` style="top:${Y(a.u)}px;--x:50%"`;
    items.push(link ? `<a class="fm-stop shared"${style}${link.attrs}>${inner}</a>` : `<span class="fm-stop shared dead"${style}>${inner}</span>`);
  }
  const legend = MODES.map((m) => `<span style="--c:${esc(C.lines[m].color)}"><span class="dot"></span>${esc(C.lines[m].name)}</span>`).join("");
  return `<nav class="flatmap" aria-label="Line map">
<p class="fm-legend">${legend}</p>
<div class="fm" style="height:${H}px"><svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" width="100%" height="${H}" aria-hidden="true">${tracks}</svg>${items.join("")}</div>
</nav>`;
}

function heroPrompt(C) {
  for (const ch of C.chapters) if (ch.prompts.length) return ch.prompts[0];
  for (const m of MODES) for (const s of C.lines[m].steps) if (s.prompts.length) return s.prompts[0];
  return C.recipes[0] ? { intent: C.recipes[0].title, text: C.recipes[0].prompt } : { intent: "", text: "/poteto-mode" };
}

function heroHtml(C, M) {
  const [lead, ...rest] = C.meta.tagline.split(/(?<=\.)\s+/);
  const p = heroPrompt(C);
  const pills = MODES.map((m) => {
    const line = C.lines[m];
    return `<a class="pill" href="#${m}" data-mode-link="${m}" style="--c:${esc(line.color)}"><span class="dot"></span><span><strong>${esc(line.name)}</strong><small>${inline(line.question)}</small></span></a>`;
  }).join("");
  return `<section class="hero" aria-labelledby="hero-h">
<div class="hero-copy">
<p class="eyebrow">${esc(C.meta.title)}</p>
<h1 id="hero-h">${esc(lead)}${rest.length ? ` <em>${esc(rest.join(" "))}</em>` : ""}</h1>
<p class="lede">${inline(C.meta.summary)}</p>
<div class="pills">${pills}</div>
<figure class="term" aria-label="Example prompt">
<div class="term-bar" aria-hidden="true"><i></i><i></i><i></i><span>${inline(p.intent)}</span></div>
<pre><code class="typed" data-copy-source>${promptHtml(p.text)}</code></pre>
</figure>
</div>
<div class="hero-map">
${boardHtml(C, M)}
${flatMapHtml(C, M)}
</div>
</section>`;
}

function agentsHtml(C) {
  return `<section class="agents reveal" id="for-agents" aria-labelledby="for-agents-h">
<div class="agents-icon">${ICON.bot}</div>
<div class="agents-body">
<h2 id="for-agents-h">For AI agents</h2>
<div class="agents-brief" data-copy-source>${paras(C.agentBrief)}</div>
<p class="agents-links"><a class="btn" href="playbook.md" type="text/markdown">Read playbook.md</a> <a class="btn ghost" href="llms.txt">llms.txt</a> ${copyButton("Copy brief")}</p>
</div>
</section>`;
}

function loopHtml(C, standalone) {
  const n = C.loop.length;
  const cards = C.loop
    .map((c, i) => `<li class="loop-card" style="--i:${i}" data-loop="${i}"><span class="k">${pad2(i + 1)}</span><h3>${inline(c.title)}</h3><p>${inline(c.plain)}</p><span class="loop-bar"><i></i></span></li>`)
    .join("");
  const figure = `<figure class="loop" aria-labelledby="loop-cap" style="--n:${n}"><figcaption id="loop-cap">The core loop</figcaption><div class="loop-scene"><ol class="loop-stack">${cards}</ol></div><p class="loop-repeat">${ICON.repeat}<span>Then repeat</span></p></figure>`;
  if (!standalone) return figure;
  return `<section class="chapter loop-solo" id="loop" aria-label="The core loop">${figure}</section>`;
}

// An install item is a command unless it ends like a sentence. Consecutive commands share one block.
function installParts(items) {
  const parts = [];
  for (const item of items) {
    const command = !/[.!?]$/.test(item.trim());
    if (parts.at(-1)?.command === command) parts.at(-1).lines.push(item);
    else parts.push({ command, lines: [item] });
  }
  return parts;
}

function platformsHtml(C, asSection) {
  const buttons = C.platforms.map((p, i) => `<button type="button" data-pf-btn="${p.id}" aria-pressed="${i === 0}">${esc(p.name)}</button>`).join("");
  const panels = C.platforms
    .map(
      (p) => `<div class="pf-panel" data-pf-panel="${p.id}">
<h3>${esc(p.name)}${p.verified ? "" : ' <span class="unverified">unverified: check your tool\'s docs</span>'}</h3>
<div class="install"><p class="mini-label">Install</p>${installParts(p.install).map((part) => (part.command ? `<figure class="prompt"><figcaption><span class="prompt-intent">Run</span>${copyButton()}</figcaption><pre><code data-copy-source>${part.lines.map(esc).join("\n")}</code></pre></figure>` : paras(part.lines))).join("")}</div>
<dl class="pf-facts"><div><dt>Run a skill</dt><dd>${inline(p.invoke)}</dd></div><div><dt>Parallel work</dt><dd>${inline(p.parallel)}</dd></div><div><dt>Scheduled runs</dt><dd>${inline(p.schedule)}</dd></div></dl>
<p class="pf-docs"><a href="${esc(p.docs)}">${esc(p.name)} docs</a></p>
</div>`,
    )
    .join("\n");
  const body = (attrs) => `<div class="platforms"${attrs}><div class="seg" role="group" aria-label="Platform">${buttons}</div>${panels}</div>`;
  if (!asSection) return body(' id="platforms"');
  return `<section class="chapter reveal" id="platforms" aria-labelledby="platforms-h"><p class="kicker">Setup</p><h2 id="platforms-h">Install on your tool</h2>${body("")}</section>`;
}

function chapterHtml(C, ch) {
  const story = ch.id === "what" && C.loop.length;
  const text = `<div class="chapter-text">
<p class="kicker">${inline(ch.kicker)}</p>
<h2 id="${ch.id}-h">${inline(ch.title)}</h2>
${paras(ch.plain, story ? "story-p" : "")}
${deeperHtml(ch.deeper)}
${promptsHtml(C, ch.prompts)}
${ch.id === "setup" ? platformsHtml(C, false) : ""}
${sourcesHtml(C, ch.sources)}
</div>`;
  if (story) return `<section class="chapter story" id="${ch.id}" aria-labelledby="${ch.id}-h">${text}<div class="story-pin">${loopHtml(C, false)}</div></section>`;
  return `<section class="chapter reveal" id="${ch.id}" aria-labelledby="${ch.id}-h">${text}</section>`;
}

function linesHtml(C, M) {
  const buttons = MODES.map(
    (m) => `<button type="button" data-mode-btn="${m}" aria-pressed="${m === "greenfield"}" style="--c:${esc(C.lines[m].color)}"><span class="dot"></span>${esc(C.lines[m].name)}<small>${C.lines[m].steps.length} stations</small></button>`,
  ).join("");
  const lines = MODES.map((m) => {
    const line = C.lines[m];
    return `<div class="line" id="${m}" data-line="${m}" style="--c:${esc(line.color)}" aria-labelledby="${m}-h">
<header class="line-head"><h2 id="${m}-h">${esc(line.name)} line</h2><p>${inline(line.question)}</p></header>
<div class="line-steps">
${M.lines[m].stops.map((s) => stepHtml(C, s, line.steps.length)).join("\n")}
</div>
</div>`;
  }).join("\n");
  return `<section class="lines" id="lines" aria-label="The two lines">
<div class="mode-bar"><div class="seg mode-seg" role="group" aria-label="Choose a line">${buttons}</div></div>
${lines}
</section>`;
}

function skillsHtml(C) {
  const cards = C.skills
    .map(
      (s) => `<li class="skill-card"><a href="${esc(skillUrl(C, s.id))}"><code>/${esc(s.id)}</code></a><p>${inline(s.oneLine)}</p><p class="skill-when"><span class="mini-label">When</span> ${inline(s.trigger)}</p>${s.needsRunningApp ? '<span class="badge">Needs a running app</span>' : ""}</li>`,
    )
    .join("");
  return `<section class="wide reveal" id="skills" aria-labelledby="skills-h"><p class="kicker">Reference</p><h2 id="skills-h">The skills</h2><ul class="skill-grid">${cards}</ul></section>`;
}

function principlesHtml(C) {
  const cards = C.principles
    .map(
      (p, i) => `<li><button type="button" class="flip" aria-pressed="false"><span class="flip-inner"><span class="face front"><span class="k">${pad2(i + 1)}</span><strong>${esc(p.name)}</strong><span class="when">${inline(p.when)}</span><span class="hint" aria-hidden="true">Flip</span></span><span class="face back"><span class="k">${esc(p.name)}</span><span class="one">${inline(p.oneLine)}</span></span></span></button><a class="deck-src" href="${esc(skillUrl(C, p.id))}">${esc(p.id)}</a></li>`,
    )
    .join("");
  return `<section class="wide reveal" id="principles" aria-labelledby="principles-h"><p class="kicker">Reference</p><h2 id="principles-h">The principles</h2><p class="section-lede">Select a card to flip it.</p><ul class="deck">${cards}</ul></section>`;
}

function recipesHtml(C) {
  const chips = ["all", ...MODES].map((m, i) => `<button type="button" data-recipe-mode="${m}" aria-pressed="${i === 0}">${m === "all" ? "All" : esc(C.lines[m].name)}</button>`).join("");
  const items = C.recipes
    .map((r) => {
      const tag = r.mode === "any" ? "Any line" : `${C.lines[r.mode].name}`;
      const color = r.mode === "any" ? "" : ` style="--c:${esc(C.lines[r.mode].color)}"`;
      return `<li class="recipe" id="recipe-${r.id}" data-mode="${r.mode}"><div class="recipe-head"><h3>${inline(r.title)}</h3><span class="tag"${color}>${tag}</span></div>
<figure class="prompt"><figcaption><span class="prompt-intent">Prompt</span>${copyButton()}</figcaption><pre><code data-copy-source>${promptHtml(r.prompt)}</code></pre></figure>
<p class="recipe-why">${inline(r.why)}</p>${sourcesHtml(C, r.sources)}</li>`;
    })
    .join("\n");
  return `<section class="wide reveal" id="recipes" aria-labelledby="recipes-h"><p class="kicker">Copy and go</p><h2 id="recipes-h">Recipes</h2>
<div class="recipe-tools"><label class="search"><span class="visually-hidden">Filter recipes</span><svg aria-hidden="true" viewBox="0 0 16 16" width="15" height="15"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><input type="search" id="recipe-q" placeholder="Filter recipes" autocomplete="off"></label><div class="seg" role="group" aria-label="Filter by line">${chips}</div><p class="recipe-count" id="recipe-count" aria-live="polite">${C.recipes.length} recipes</p></div>
<ul class="recipe-list">${items}</ul><p class="recipe-empty" id="recipe-empty" hidden>No recipe matches. Try fewer words.</p></section>`;
}

function pitfallsHtml(C) {
  const items = C.pitfalls
    .map((p) => `<li class="pair"><div class="dont"><span class="tag">Don't</span><p>${inline(p.dont)}</p></div><div class="do"><span class="tag">Do</span><p>${inline(p.do)}</p></div>${sourcesHtml(C, p.sources)}</li>`)
    .join("");
  return `<section class="wide reveal" id="pitfalls" aria-labelledby="pitfalls-h"><p class="kicker">Avoid these</p><h2 id="pitfalls-h">Pitfalls</h2><ul class="pairs">${items}</ul></section>`;
}

function glossaryHtml(C) {
  const items = C.glossary.map((g) => `<div><dt>${inline(g.term)}</dt><dd>${inline(g.plain)}</dd></div>`).join("");
  return `<section class="reveal" id="glossary" aria-labelledby="glossary-h"><p class="kicker">Words</p><h2 id="glossary-h">Glossary</h2><dl class="glossary">${items}</dl></section>`;
}

function routingHtml(C, R) {
  const head = `<tr><th scope="col">Role</th>${R.modes.map((m) => `<th scope="col">${esc(cap(m))}</th>`).join("")}</tr>`;
  const body = R.rows
    .map((row) => {
      const base = row.cells[0].join(",");
      const cells = row.cells.map((names, i) => `<td${i && names.join(",") !== base ? ' class="differs"' : ""}>${names.map((n) => `<span class="droid"><code>${esc(n)}</code><small>${esc(droidLabel(n))}</small></span>`).join("")}</td>`);
      return `<tr><th scope="row">${esc(row.role)}</th>${cells.join("")}</tr>`;
    })
    .join("");
  return `<section class="wide blueprint routing reveal" id="routing" aria-labelledby="routing-h"><p class="kicker">Under the hood</p><h2 id="routing-h">Model routing</h2>
${paras(C.routing.plain)}
<div class="table-wrap" tabindex="0" role="region" aria-label="Model routing table"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>
<p class="table-note">Highlighted cells differ from the ${esc(cap(R.modes[0]))} column.</p>
${deeperHtml(C.routing.deeper)}
</section>`;
}

function minimapHtml(C, M) {
  const entries = [];
  const hasSetup = C.chapters.some((ch) => ch.id === "setup");
  for (const ch of C.chapters) {
    entries.push({ id: ch.id, label: ch.title });
    if (ch.id === "pick") for (const m of MODES) for (const s of M.lines[m].stops) entries.push({ id: s.step.id, label: s.step.station, mode: m, color: C.lines[m].color, shared: s.shared });
  }
  if (!hasSetup) entries.push({ id: "platforms", label: "Install" });
  for (const [id, label] of [["skills", "Skills"], ["principles", "Principles"], ["recipes", "Recipes"], ["pitfalls", "Pitfalls"], ["glossary", "Glossary"], ["routing", "Model routing"]]) entries.push({ id, label });
  const items = entries
    .map((e) => `<li${e.mode ? ` data-mode="${e.mode}" class="mm-station${e.shared ? " mm-shared" : ""}" style="--c:${esc(e.color)}"` : ""}><a href="#${e.id}" data-mm="${e.id}"><span class="mm-dot"></span><span class="mm-label">${inline(e.label)}</span></a></li>`)
    .join("");
  return `<nav class="minimap" aria-label="Progress"><ol>${items}</ol></nav>`;
}

function templatesHtml(C) {
  return C.platforms.map((p) => `<template data-pf-template="${p.id}" data-name="${esc(p.name)}">${inline(p.invoke)}</template>`).join("");
}

function guardInline(text, tag) {
  if (new RegExp(`</${tag}`, "i").test(text)) throw new Error(`playbook/src: inlined ${tag} contains "</${tag}".`);
  return text.replace(/\r\n/g, "\n").trimEnd();
}

export function renderHtml(C, R, assets) {
  const pf = C.platforms;
  const M = mapModel(C);
  const hasSetup = C.chapters.some((ch) => ch.id === "setup");
  const hasStory = C.chapters.some((ch) => ch.id === "what") && C.loop.length;
  const body = [];
  for (const ch of C.chapters) {
    body.push(chapterHtml(C, ch));
    if (ch.id === "pick") body.push(linesHtml(C, M));
  }
  const data = {
    meta: C.meta, agentBrief: C.agentBrief, platforms: C.platforms, loop: C.loop, chapters: C.chapters, lines: C.lines,
    sharedStations: C.sharedStations, skills: C.skills, principles: C.principles, recipes: C.recipes, pitfalls: C.pitfalls,
    glossary: C.glossary, routing: { ...C.routing, modes: R.modes, rows: R.rows },
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en" style="--gf:${esc(C.lines.greenfield.color)};--bf:${esc(C.lines.brownfield.color)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(C.meta.title)}</title>
<meta name="description" content="${esc(C.meta.summary)}">
<meta name="color-scheme" content="light dark">
<link rel="alternate" type="text/markdown" href="playbook.md" title="${esc(C.meta.title)} (markdown)">
<link rel="help" href="llms.txt">
<script>try{var t=localStorage.getItem("pvpb.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add("js")</script>
<style>
${guardInline(assets.css, "style")}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar" id="top">
<div class="topbar-row">
<a class="brand" href="#main"><span class="brand-mark" aria-hidden="true"><i></i><i></i></span>${esc(C.meta.title)}</a>
<div class="topbar-tools">
<label class="pf-select"><span>On</span><select id="pf-select" aria-label="Your agent tool">${pf.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>
<button type="button" class="icon-btn" id="theme-toggle" aria-pressed="false" aria-label="Dark theme">${ICON.theme}</button>
</div>
</div>
${minimapHtml(C, M)}
</header>
<main id="main">
${heroHtml(C, M)}
<div class="content">
${agentsHtml(C)}
${hasStory ? "" : loopHtml(C, true)}
${body.join("\n")}
${hasSetup ? "" : platformsHtml(C, true)}
${skillsHtml(C)}
${principlesHtml(C)}
${recipesHtml(C)}
${pitfallsHtml(C)}
${glossaryHtml(C)}
${routingHtml(C, R)}
</div>
</main>
<footer class="foot">
<p><a href="${esc(C.meta.repo)}">PV Stack on GitHub</a>. Based on ${C.meta.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.title)}</a>`).join(" and ")} by Lauren Tan (poteto).</p>
<p>Agents can read this page as <a href="playbook.md">markdown</a> or start at <a href="llms.txt">llms.txt</a>.</p>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
${templatesHtml(C)}
<script type="application/json" id="playbook-data">${json}</script>
<script>
${guardInline(assets.js, "script")}
</script>
</body>
</html>
`;
}


function mdInline(s) {
  return String(s)
    .split(/(`[^`]+`)/)
    .map((part) => (part.startsWith("`") && part.length > 1 ? part : part.replace(/</g, "\\<")))
    .join("");
}
const mdParas = (list) => list.map(mdInline).join("\n\n");
const mdCell = (s) => String(s).replace(/\|/g, "\\|");
const fence = (text) => "```text\n" + text + "\n```";
const mdSources = (C, refs) => (refs.length ? `Sources:\n\n${refs.map((r) => resolveSource(C, r)).map((s) => `- [${s.label}](${s.url})`).join("\n")}` : "");
const mdPrompts = (list) => list.map((p) => `Prompt: ${mdInline(p.intent)}\n\n${fence(p.text)}`).join("\n\n");
const mdDeeper = (list) => (list.length ? `Go deeper:\n\n${mdParas(list)}` : "");
const join = (parts) => parts.filter(Boolean).join("\n\n");

function mdPlatforms(C) {
  return join([
    "## Install on your tool",
    ...C.platforms.map((p) =>
      join([
        `### ${p.name}`,
        p.verified ? "" : "Unverified: check your tool's docs.",
        `Install:\n\n${installParts(p.install).map((part) => (part.command ? fence(part.lines.join("\n")) : mdParas(part.lines))).join("\n\n")}`,
        `- Run a skill: ${mdInline(p.invoke)}\n- Parallel work: ${mdInline(p.parallel)}\n- Scheduled runs: ${mdInline(p.schedule)}\n- Docs: ${p.docs}`,
      ]),
    ),
  ]);
}

const mdLoop = (C) => join(["## The core loop", C.loop.map((c, i) => `${i + 1}. **${c.title}.** ${mdInline(c.plain)}`).join("\n")]);

function mdStep(C, { step, mode, n, shared }, total) {
  return join([
    `### ${step.id}: ${step.title}`,
    `${C.lines[mode].name} line, station ${n} of ${total}: ${step.station}.${shared ? ` Shared with the ${C.lines[MODES.find((m) => m !== mode)].name} line.` : ""}`,
    mdParas(step.plain),
    mdDeeper(step.deeper),
    step.skills.length ? `Skills: ${step.skills.map((s) => `[\`/${s}\`](${skillUrl(C, s)})`).join(", ")}` : "",
    mdPrompts(step.prompts),
    step.done.length ? `Done when:\n\n${step.done.map((d) => `- [ ] ${mdInline(d)}`).join("\n")}` : "",
    step.pitfalls.length ? `Watch out:\n\n${step.pitfalls.map((p) => `- ${mdInline(p)}`).join("\n")}` : "",
    mdSources(C, step.sources),
  ]);
}

export function renderMd(C, R) {
  const M = mapModel(C);
  const hasSetup = C.chapters.some((ch) => ch.id === "setup");
  const parts = [`# ${C.meta.title}`, `> ${C.meta.tagline}`, mdInline(C.meta.summary), join(["## For AI agents", mdParas(C.agentBrief)])];
  for (const ch of C.chapters) {
    parts.push(join([`## ${ch.title}`, `*${ch.kicker}*`, mdParas(ch.plain), mdDeeper(ch.deeper), mdPrompts(ch.prompts), mdSources(C, ch.sources)]));
    if (ch.id === "what") parts.push(mdLoop(C));
    if (ch.id === "setup") parts.push(mdPlatforms(C));
    if (ch.id === "pick") {
      for (const m of MODES) {
        const line = C.lines[m];
        parts.push(join([`## ${line.name} line`, mdInline(line.question), ...M.lines[m].stops.map((s) => mdStep(C, s, line.steps.length))]));
      }
    }
  }
  if (!C.chapters.some((ch) => ch.id === "what")) parts.push(mdLoop(C));
  if (!hasSetup) parts.push(mdPlatforms(C));
  parts.push(
    join(["## Skills", C.skills.map((s) => `- [\`/${s.id}\`](${skillUrl(C, s.id)}): ${mdInline(s.oneLine)} When: ${mdInline(s.trigger)}${s.needsRunningApp ? " Needs a running app." : ""}`).join("\n")]),
    join(["## Principles", C.principles.map((p) => `- [${p.name}](${skillUrl(C, p.id)}). When: ${mdInline(p.when)} ${mdInline(p.oneLine)}`).join("\n")]),
    join([
      "## Recipes",
      ...C.recipes.map((r) => join([`### ${r.title}`, `Line: ${r.mode === "any" ? "any" : C.lines[r.mode].name}.`, fence(r.prompt), mdInline(r.why), mdSources(C, r.sources)])),
    ]),
    join(["## Pitfalls", C.pitfalls.map((p) => `- Don't: ${mdInline(p.dont)} Do: ${mdInline(p.do)}${p.sources.length ? ` (${p.sources.map((r) => resolveSource(C, r)).map((s) => `[${s.label}](${s.url})`).join(", ")})` : ""}`).join("\n")]),
    join(["## Glossary", C.glossary.map((g) => `- **${g.term}**: ${mdInline(g.plain)}`).join("\n")]),
    join([
      "## Model routing",
      mdParas(C.routing.plain),
      [
        `| Role | ${R.modes.map(cap).join(" | ")} |`,
        `| --- | ${R.modes.map(() => "---").join(" | ")} |`,
        ...R.rows.map((row) => `| ${mdCell(row.role)} | ${row.cells.map((names) => names.map((n) => `\`${n}\` (${droidLabel(n)})`).join(", ")).join(" | ")} |`),
      ].join("\n"),
      mdDeeper(C.routing.deeper),
    ]),
  );
  return parts.filter(Boolean).join("\n\n") + "\n";
}


const mdSlug = (heading) => heading.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");

export function renderLlms(C) {
  const firsts = MODES.filter((m) => C.lines[m].steps.length).map((m) => {
    const line = C.lines[m];
    const step = line.steps[0];
    return `- [${line.name} line, first step](playbook.md#${mdSlug(`${step.id}: ${step.title}`)}): ${mdInline(line.question)}`;
  });
  return join([
    `# ${C.meta.title}`,
    `> ${C.meta.summary}`,
    C.agentBrief.map(mdInline).join(" "),
    join(["## Docs", ["- [The full playbook in markdown](playbook.md): every chapter, both lines, prompts, and checklists in reading order.", ...firsts].join("\n")]),
    join([
      "## Optional",
      [`- [Interactive playbook](index.html): the same content with a line map, toggles, and saved checklists.`, `- [PV Stack repository](${C.meta.repo}): the skills, the guide, and the source of this playbook.`].join("\n"),
    ]),
  ]) + "\n";
}


export function build(C = content, assets = readAssets()) {
  const R = readRouting();
  const errors = validate(C, R);
  if (errors.length) return { errors, files: null };
  return {
    errors,
    files: {
      "index.html": renderHtml(C, R, assets),
      "playbook.md": renderMd(C, R),
      "llms.txt": renderLlms(C),
    },
  };
}

export function readAssets() {
  return { css: fs.readFileSync(path.join(srcDir, "style.css"), "utf8"), js: fs.readFileSync(path.join(srcDir, "app.js"), "utf8") };
}

function main() {
  const check = process.argv.includes("--check");
  const { errors, files } = build();
  if (errors.length) {
    console.error(`Playbook content is invalid:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
    process.exit(1);
  }
  if (check) {
    const stale = Object.entries(files).filter(([name, text]) => {
      const file = path.join(outDir, name);
      return !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text;
    });
    if (stale.length) {
      console.error(`Playbook out of date. Run node tools/playbook.mjs. (${stale.map(([n]) => n).join(", ")})`);
      process.exit(1);
    }
    console.log("Playbook matches content.");
    return;
  }
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), text);
  console.log(`Wrote ${Object.keys(files).map((n) => `playbook/${n}`).join(", ")}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
