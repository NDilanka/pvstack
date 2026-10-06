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
const SECTION_IDS = ["top", "main", "for-agents", "loop", "lines", "greenfield", "brownfield", "platforms", "skills", "principles", "recipes", "pitfalls", "glossary", "routing", "toc", "sidebar", "status"];

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

// Browsers break lines after a hyphen, which splits a wrapped "--flag" into "-" and "-flag".
const promptHtml = (text) =>
  esc(text)
    .replace(/(^|\s)(--?[A-Za-z][\w-]*)/g, '$1<span class="nw">$2</span>')
    .replace(/&lt;([^&\s][^&]*?)&gt;/g, '<mark class="ph">&lt;$1&gt;</mark>');
const paras = (list, cls = "") => list.map((p) => `<p${cls ? ` class="${cls}"` : ""}>${inline(p)}</p>`).join("\n");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);


const ICON = {
  copy: '<svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 10.5V3.5A1 1 0 0 1 4 2.5h6.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
  theme: '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>',
  menu: '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  close: '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

// Line colors arrive as one hex per line. Each theme gets a variant that passes WCAG AA (4.5:1) as
// text. The goals carry headroom so the result holds on any paper near white or near black: the
// light paper is darker than white and the dark paper is lighter than black.
const LINE_VAR = { greenfield: "gf", brownfield: "bf" };
const lineVar = (mode) => `var(--${LINE_VAR[mode]})`;
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const hexOf = (rgb) => "#" + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
function legible(hex, theme) {
  const rgb = rgbOf(hex);
  const end = theme === "light" ? 0 : 1;
  for (let t = 0; t <= 1; t += 0.01) {
    const c = rgb.map((v) => v + (end - v) * t);
    const L = luminance(c);
    if (theme === "light" ? 1.05 / (L + 0.05) >= 5 : (L + 0.05) / 0.05 >= 5.6) return hexOf(c);
  }
  return theme === "light" ? "#000000" : "#ffffff";
}
const lineVars = (C) => MODES.map((m) => `--${LINE_VAR[m]}-l:${legible(C.lines[m].color, "light")};--${LINE_VAR[m]}-d:${legible(C.lines[m].color, "dark")}`).join(";");

const copyButton = (label = "Copy") => `<button type="button" class="copy" data-copy>${ICON.copy}<span>${label}</span></button>`;

function sourcesHtml(C, refs) {
  if (!refs.length) return "";
  const items = refs.map((ref) => resolveSource(C, ref)).map((s) => `<li><a href="${esc(s.url)}">${esc(s.label)}</a></li>`);
  return `<div class="sources"><span class="meta-label">Sources</span><ul>${items.join("")}</ul></div>`;
}

function deeperHtml(list) {
  if (!list.length) return "";
  return `<details class="deeper"><summary>Go deeper</summary><div class="deeper-body">${paras(list)}</div></details>`;
}

function promptBlock(intent, text, label = "Prompt") {
  return `<figure class="prompt">
<figcaption><span class="prompt-label">${intent ? inline(intent) : label}</span>${copyButton()}</figcaption>
<pre><code data-copy-source>${text}</code></pre>
</figure>`;
}

const promptsHtml = (list) => list.map((p) => promptBlock(p.intent, promptHtml(p.text))).join("\n");

function stepHtml(C, { step, mode, n, shared }, total) {
  const line = C.lines[mode];
  const other = MODES.find((m) => m !== mode);
  const sharedNote = shared ? ` <span class="shared-note">Shared with ${esc(C.lines[other].name)}</span>` : "";
  const skills = step.skills.length
    ? `<p class="step-skills"><span class="meta-label">Skills</span> ${step.skills.map((s) => `<a href="${esc(skillUrl(C, s))}"><code>/${esc(s)}</code></a>`).join(" ")}</p>`
    : "";
  const done = step.done.length
    ? `<fieldset class="done"><legend>Done when <span class="progress" data-progress="${step.id}" aria-live="polite">0 of ${step.done.length}</span></legend><ul>${step.done
        .map((d, j) => `<li><label><input type="checkbox" data-done="${step.id}" data-index="${j}"><span>${inline(d)}</span></label></li>`)
        .join("")}</ul></fieldset>`
    : "";
  const pitfalls = step.pitfalls.length ? `<div class="watch"><h4>Watch out</h4><ul>${step.pitfalls.map((p) => `<li>${inline(p)}</li>`).join("")}</ul></div>` : "";
  return `<article class="station${shared ? " is-shared" : ""}" id="${step.id}" data-mode="${mode}" aria-labelledby="${step.id}-h">
<span class="station-marker" aria-hidden="true">${n}</span>
<header>
<p class="station-meta">${esc(line.name)} station ${n} of ${total}. ${esc(step.station)}.${sharedNote}</p>
<h3 id="${step.id}-h">${inline(step.title)}</h3>
</header>
${paras(step.plain)}
${promptsHtml(step.prompts)}
${done}
${pitfalls}
${skills}
${deeperHtml(step.deeper)}
${sourcesHtml(C, step.sources)}
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

export function mapModel(C) {
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
  return target ? ` href="#${target}"${data} data-station="${target}"` : null;
}

// A flat schematic in the Beck and Vignelli tradition: two rows that merge at the interchanges.
// Labels live in the SVG so they scale with the drawing. The stylesheet swaps to the column map
// below a 960px viewport, where this viewBox would shrink the 16px labels under 13px.
function schematicHtml(C, M) {
  const S = 84, PAD = 44, R = 62, MID = 104;
  const W = Math.round(PAD * 2 + (M.uMax - M.uMin) * S);
  const H = MID * 2;
  const X = (u) => +(PAD + (u - M.uMin) * S).toFixed(1);
  const at = (u, off) => `${X(u)} ${+(MID + off * R).toFixed(1)}`;
  const out = [];
  for (const m of MODES) out.push(`<path class="track" data-track="${m}" style="--c:${lineVar(m)}" d="${trackPath(M, m, at)}"/>`);
  for (const m of MODES) {
    const stub = M.lines[m].stub;
    if (stub === null) continue;
    const y = +(MID + M.offset(m, "trunk") * R).toFixed(1);
    out.push(`<g class="terminus" data-track="${m}" style="--c:${lineVar(m)}"><path d="M${X(stub)} ${y - 9} V${y + 9}"/><text x="${X(stub) - 10}" y="${y + 5}" text-anchor="end">${esc(startsHere(C, m))}</text></g>`);
  }
  for (const m of MODES) {
    const above = M.offset(m, "row") < 0;
    const y = +(MID + M.offset(m, "row") * R).toFixed(1);
    for (const s of M.lines[m].stops.filter((x) => !x.shared)) {
      const ty = above ? y - 16 : y + 28;
      out.push(`<a class="stop" data-track="${m}" style="--c:${lineVar(m)}" href="#${s.step.id}" data-station="${s.step.id}"><circle cx="${X(s.u)}" cy="${y}" r="7"/><text x="${X(s.u)}" y="${ty}" text-anchor="middle">${esc(s.step.station)}</text></a>`);
    }
  }
  for (const a of M.anchors) {
    const link = hrefAttrs(a.hrefs);
    const x = X(a.u);
    const top = MID + M.offset(MODES[0], "trunk") * R;
    const bot = MID + M.offset(MODES[1], "trunk") * R;
    const inner = `<rect x="${x - 10}" y="${(top - 10).toFixed(1)}" width="20" height="${(bot - top + 20).toFixed(1)}" rx="10"/><text x="${x}" y="${(bot + 34).toFixed(1)}" text-anchor="middle">${esc(a.label)}</text>`;
    out.push(link ? `<a class="stop interchange"${link}>${inner}</a>` : `<g class="stop interchange dead">${inner}</g>`);
  }
  return `<svg class="schematic" viewBox="0 0 ${W} ${H}">${out.join("")}</svg>`;
}

// Below the tablet breakpoint the same model runs top to bottom with HTML labels.
function columnMapHtml(C, M) {
  const SV = 40, Y0 = 26, XR = 16;
  const H = Math.round(Y0 * 2 + (M.uMax - M.uMin) * SV);
  const Y = (u) => +(Y0 + (u - M.uMin) * SV).toFixed(1);
  const at = (u, off) => `${+(50 + off * XR).toFixed(2)} ${Y(u)}`;
  const tracks = MODES.map((m) => `<path data-track="${m}" style="--c:${lineVar(m)}" d="${trackPath(M, m, at)}"/>`).join("");
  const items = [];
  for (const m of MODES) {
    const side = M.offset(m, "row") < 0 ? "left" : "right";
    for (const s of M.lines[m].stops.filter((x) => !x.shared)) {
      items.push(`<a class="cm-stop ${side}" data-track="${m}" style="top:${Y(s.u)}px;--x:${50 + M.offset(m, "row") * XR}%;--c:${lineVar(m)}" href="#${s.step.id}" data-station="${s.step.id}"><span class="cm-dot"></span><span class="cm-label">${esc(s.step.station)}</span></a>`);
    }
    const stub = M.lines[m].stub;
    if (stub !== null) {
      items.push(`<span class="cm-note ${side}" data-track="${m}" style="top:${Y(stub)}px;--x:${50 + M.offset(m, "trunk") * XR}%;--c:${lineVar(m)}"><span class="cm-term"></span><span class="cm-label">${esc(startsHere(C, m))}</span></span>`);
    }
  }
  for (const a of M.anchors) {
    const link = hrefAttrs(a.hrefs);
    const inner = `<span class="cm-dot"></span><span class="cm-label">${esc(a.label)}</span>`;
    const style = ` style="top:${Y(a.u)}px;--x:50%"`;
    items.push(link ? `<a class="cm-stop interchange"${style}${link}>${inner}</a>` : `<span class="cm-stop interchange dead"${style}>${inner}</span>`);
  }
  return `<div class="column-map" style="height:${H}px"><svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" width="100%" height="${H}" aria-hidden="true">${tracks}</svg>${items.join("")}</div>`;
}

function mapHtml(C, M) {
  const legend = MODES.map((m) => `<li style="--c:${lineVar(m)}"><span class="swatch" aria-hidden="true"></span>${esc(C.lines[m].name)}</li>`).join("");
  const shared = C.sharedStations.map((s) => s.station).join(", ");
  return `<nav class="map" aria-label="Line map">
<figure>
${schematicHtml(C, M)}
${columnMapHtml(C, M)}
<figcaption id="map-cap"><ul class="legend">${legend}<li><span class="swatch interchange" aria-hidden="true"></span>Shared stations: ${esc(shared)}</li></ul><span class="map-hint">Select a station to jump to it.</span></figcaption>
</figure>
</nav>`;
}

function heroHtml(C, M) {
  const entries = MODES.map((m) => {
    const line = C.lines[m];
    const first = M.lines[m].stops[0].step.id;
    return `<a class="entry" href="#${first}" style="--c:${lineVar(m)}"><span class="entry-name">${esc(line.name)}</span><span class="entry-q">${inline(line.question)}</span></a>`;
  }).join("");
  return `<section class="hero" aria-labelledby="hero-h">
<h1 id="hero-h">${esc(C.meta.tagline)}</h1>
<p class="lede">${inline(C.meta.summary)}</p>
<div class="entries">${entries}</div>
${mapHtml(C, M)}
<p class="agent-note">AI agents can read this page as <a href="playbook.md">playbook.md</a> or start at <a href="llms.txt">llms.txt</a>.</p>
</section>`;
}

function agentsHtml(C) {
  return `<section class="agents" id="for-agents" aria-labelledby="for-agents-h">
<h2 id="for-agents-h">For AI agents</h2>
<div class="agents-brief" data-copy-source>${paras(C.agentBrief)}</div>
<p class="actions"><a class="btn" href="playbook.md" type="text/markdown">Read playbook.md</a> <a class="btn" href="llms.txt">llms.txt</a> ${copyButton("Copy brief")}</p>
</section>`;
}

function loopHtml(C, standalone) {
  const steps = C.loop.map((c, i) => `<li><span class="loop-n" aria-hidden="true">${i + 1}</span><h3>${inline(c.title)}</h3><p>${inline(c.plain)}</p></li>`).join("");
  const figure = `<figure class="loop" aria-labelledby="loop-cap"><figcaption id="loop-cap">The core loop</figcaption><ol class="loop-steps">${steps}</ol><p class="loop-repeat">Then repeat from step 1.</p></figure>`;
  if (!standalone) return figure;
  return `<section id="loop" aria-label="The core loop">${figure}</section>`;
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
<h3>${esc(p.name)}${p.verified ? "" : ' <span class="unverified">Unverified. Check your tool\'s docs.</span>'}</h3>
${installParts(p.install).map((part) => (part.command ? promptBlock("", part.lines.map(esc).join("\n"), "Run in a terminal") : paras(part.lines))).join("\n")}
<dl class="facts"><div><dt>Run a skill</dt><dd>${inline(p.invoke)}</dd></div><div><dt>Parallel work</dt><dd>${inline(p.parallel)}</dd></div><div><dt>Scheduled runs</dt><dd>${inline(p.schedule)}</dd></div></dl>
<p><a href="${esc(p.docs)}">${esc(p.name)} docs</a></p>
</div>`,
    )
    .join("\n");
  const body = (attrs) => `<div class="platforms"${attrs}><p class="seg-label" id="pf-seg-label">Your agent tool</p><div class="seg" role="group" aria-labelledby="pf-seg-label">${buttons}</div>${panels}</div>`;
  if (!asSection) return body(' id="platforms"');
  return `<section id="platforms" aria-labelledby="platforms-h"><h2 id="platforms-h">Install on your tool</h2>${body("")}</section>`;
}

function chapterHtml(C, ch) {
  const loop = ch.id === "what" && C.loop.length ? loopHtml(C, false) : "";
  return `<section class="chapter" id="${ch.id}" aria-labelledby="${ch.id}-h">
<h2 id="${ch.id}-h">${inline(ch.title)}</h2>
${paras(ch.plain)}
${loop}
${promptsHtml(ch.prompts)}
${ch.id === "setup" ? platformsHtml(C, false) : ""}
${deeperHtml(ch.deeper)}
${sourcesHtml(C, ch.sources)}
</section>`;
}

function linesHtml(C, M) {
  const buttons = MODES.map(
    (m) => `<button type="button" data-mode-btn="${m}" aria-pressed="${m === MODES[0]}" style="--c:${lineVar(m)}"><span class="swatch" aria-hidden="true"></span>${esc(C.lines[m].name)}</button>`,
  ).join("");
  const first = C.platforms[0];
  const lines = MODES.map((m) => {
    const line = C.lines[m];
    return `<div class="line" id="${m}" data-line="${m}" style="--c:${lineVar(m)}" aria-labelledby="${m}-h">
<header class="line-head"><h2 id="${m}-h">${esc(line.name)} line</h2><p>${inline(line.question)} ${line.steps.length} stations.</p></header>
<ol class="stations">
${M.lines[m].stops.map((s) => `<li>${stepHtml(C, s, line.steps.length)}</li>`).join("\n")}
</ol>
</div>`;
  }).join("\n");
  return `<section class="lines" id="lines" aria-label="The two lines">
<div class="line-switch"><p class="seg-label" id="line-seg-label">Showing</p><div class="seg" role="group" aria-labelledby="line-seg-label">${buttons}</div></div>
<p class="invoke-note"><span class="meta-label">On <span data-pf-name>${esc(first.name)}</span></span> <span data-pf-invoke>${inline(first.invoke)}</span></p>
${lines}
</section>`;
}

function skillsHtml(C) {
  const items = C.skills
    .map((s) => `<div><dt><a href="${esc(skillUrl(C, s.id))}"><code>/${esc(s.id)}</code></a>${s.needsRunningApp ? ' <span class="note">Needs a running app</span>' : ""}</dt><dd><p>${inline(s.oneLine)}</p><p class="when"><span class="meta-label">When</span> ${inline(s.trigger)}</p></dd></div>`)
    .join("");
  return `<section class="ref" id="skills" aria-labelledby="skills-h"><h2 id="skills-h">The skills</h2><dl class="ref-list">${items}</dl></section>`;
}

function principlesHtml(C) {
  const items = C.principles
    .map((p) => `<div><dt><a href="${esc(skillUrl(C, p.id))}">${esc(p.name)}</a></dt><dd><p>${inline(p.oneLine)}</p><p class="when">${inline(p.when)}</p></dd></div>`)
    .join("");
  return `<section class="ref" id="principles" aria-labelledby="principles-h"><h2 id="principles-h">The principles</h2><dl class="ref-list cols">${items}</dl></section>`;
}

function recipesHtml(C) {
  const chips = ["all", ...MODES].map((m, i) => `<button type="button" data-recipe-mode="${m}" aria-pressed="${i === 0}">${m === "all" ? "All" : esc(C.lines[m].name)}</button>`).join("");
  const items = C.recipes
    .map((r) => {
      const tag = r.mode === "any" ? `<span class="tag">Any line</span>` : `<span class="tag" style="--c:${lineVar(r.mode)}"><span class="swatch" aria-hidden="true"></span>${esc(C.lines[r.mode].name)}</span>`;
      return `<li class="recipe" id="recipe-${r.id}" data-mode="${r.mode}"><h3>${inline(r.title)}</h3>${tag}
${promptBlock("", promptHtml(r.prompt))}
<p>${inline(r.why)}</p>${sourcesHtml(C, r.sources)}</li>`;
    })
    .join("\n");
  return `<section class="ref" id="recipes" aria-labelledby="recipes-h"><h2 id="recipes-h">Recipes</h2>
<div class="recipe-tools"><label class="filter"><span>Filter</span><input type="search" id="recipe-q" placeholder="For example: migration" autocomplete="off"></label><div class="seg" role="group" aria-label="Filter by line">${chips}</div><p class="recipe-count" id="recipe-count" aria-live="polite">${C.recipes.length} recipes</p></div>
<ul class="recipe-list">${items}</ul><p class="recipe-empty" id="recipe-empty" hidden>No recipe matches. Try fewer words.</p></section>`;
}

function pitfallsHtml(C) {
  const rows = C.pitfalls.map((p) => `<tr><td data-label="Don't">${inline(p.dont)}</td><td data-label="Do">${inline(p.do)}${sourcesHtml(C, p.sources)}</td></tr>`).join("");
  return `<section class="ref" id="pitfalls" aria-labelledby="pitfalls-h"><h2 id="pitfalls-h">Pitfalls</h2><table class="pitfalls"><thead><tr><th scope="col">Don't</th><th scope="col">Do</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function glossaryHtml(C) {
  const items = C.glossary.map((g) => `<div><dt>${inline(g.term)}</dt><dd>${inline(g.plain)}</dd></div>`).join("");
  return `<section class="ref" id="glossary" aria-labelledby="glossary-h"><h2 id="glossary-h">Glossary</h2><dl class="glossary">${items}</dl></section>`;
}

function routingHtml(C, R) {
  const head = `<tr><th scope="col">Role</th>${R.modes.map((m) => `<th scope="col">${esc(cap(m))}</th>`).join("")}</tr>`;
  const body = R.rows
    .map((row) => {
      const base = row.cells[0].join(",");
      const cells = row.cells.map((names, i) => `<td${i && names.join(",") !== base ? ' class="differs"' : ""}>${names.map((n) => `<span class="droid"><code>${esc(n)}</code> <span>${esc(droidLabel(n))}</span></span>`).join("")}</td>`);
      return `<tr><th scope="row">${esc(row.role)}</th>${cells.join("")}</tr>`;
    })
    .join("");
  return `<section class="ref" id="routing" aria-labelledby="routing-h"><h2 id="routing-h">Model routing</h2>
${paras(C.routing.plain)}
<div class="table-wrap" tabindex="0" role="region" aria-label="Model routing table"><table class="routing"><thead>${head}</thead><tbody>${body}</tbody></table></div>
<p class="table-note">Marked cells differ from the ${esc(cap(R.modes[0]))} column.</p>
${deeperHtml(C.routing.deeper)}
</section>`;
}

function tocModel(C, M) {
  const pick = C.chapters.findIndex((ch) => ch.id === "pick");
  const chapter = (ch) => ({ id: ch.id, label: ch.title });
  const start = C.chapters.slice(0, pick + 1).map(chapter);
  if (!C.chapters.some((ch) => ch.id === "setup")) start.push({ id: "platforms", label: "Install on your tool" });
  if (!(C.chapters.some((ch) => ch.id === "what") && C.loop.length)) start.unshift({ id: "loop", label: "The core loop" });
  return [
    { label: "Start", items: start },
    ...MODES.map((m) => ({
      label: `${C.lines[m].name} line`,
      id: m,
      mode: m,
      items: M.lines[m].stops.map((s) => ({ id: s.step.id, label: s.step.station, n: s.n, shared: !!s.shared })),
    })),
    { label: "Going further", items: C.chapters.slice(pick + 1).map(chapter) },
    {
      label: "Reference",
      items: [["skills", "The skills"], ["principles", "The principles"], ["recipes", "Recipes"], ["pitfalls", "Pitfalls"], ["glossary", "Glossary"], ["routing", "Model routing"], ["for-agents", "For AI agents"]].map(([id, label]) => ({ id, label })),
    },
  ];
}

function tocHtml(C, M) {
  const groups = tocModel(C, M)
    .map((g) => {
      const head = g.id ? `<a class="toc-group" href="#${g.id}" data-toc="${g.id}" style="--c:${lineVar(g.mode)}"><span class="swatch" aria-hidden="true"></span>${esc(g.label)}</a>` : `<p class="toc-group">${esc(g.label)}</p>`;
      const items = g.items
        .map((it) => (g.mode
          ? `<li><a href="#${it.id}" data-toc="${it.id}" data-station="${it.id}"${it.shared ? ' class="is-shared"' : ""}><span class="toc-n" aria-hidden="true">${it.n}</span>${inline(it.label)}</a></li>`
          : `<li><a href="#${it.id}" data-toc="${it.id}">${inline(it.label)}</a></li>`))
        .join("");
      return `<li${g.mode ? ` style="--c:${lineVar(g.mode)}"` : ""}>${head}<ol>${items}</ol></li>`;
    })
    .join("");
  return `<nav class="toc" id="toc" aria-label="Contents"><ol>${groups}</ol></nav>`;
}

function toolsHtml(C, where) {
  const select = `<label class="pf-pick"><span>Using</span><select data-pf-select aria-label="Your agent tool">${C.platforms.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>`;
  return `<div class="tools tools-${where}">${select}<button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="Dark theme">${ICON.theme}</button></div>`;
}

function templatesHtml(C) {
  return C.platforms.map((p) => `<template data-pf-template="${p.id}">${inline(p.invoke)}</template>`).join("");
}

function guardInline(text, tag) {
  if (new RegExp(`</${tag}`, "i").test(text)) throw new Error(`playbook/src: inlined ${tag} contains "</${tag}".`);
  return text.replace(/\r\n/g, "\n").trimEnd();
}

export function renderHtml(C, R, assets) {
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
<html lang="en" style="${lineVars(C)}">
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
<a class="brand" href="#main">${esc(C.meta.title)}</a>
<button type="button" class="contents-btn" aria-expanded="false" aria-controls="sidebar">${ICON.menu}<span>Contents</span></button>
${toolsHtml(C, "top")}
</header>
<div class="layout">
<aside class="sidebar" id="sidebar" aria-label="Sidebar">
<div class="sidebar-head"><a class="brand" href="#main">${esc(C.meta.title)}</a><button type="button" class="icon-btn drawer-close" aria-label="Close contents">${ICON.close}</button></div>
${toolsHtml(C, "side")}
${tocHtml(C, M)}
</aside>
<div class="scrim" hidden></div>
<div class="page">
<main id="main" tabindex="-1">
${heroHtml(C, M)}
${hasStory ? "" : loopHtml(C, true)}
${body.join("\n")}
${hasSetup ? "" : platformsHtml(C, true)}
${skillsHtml(C)}
${principlesHtml(C)}
${recipesHtml(C)}
${pitfallsHtml(C)}
${glossaryHtml(C)}
${routingHtml(C, R)}
${agentsHtml(C)}
</main>
<footer class="foot">
<p><a href="${esc(C.meta.repo)}">PV Stack on GitHub</a>. Based on ${C.meta.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.title)}</a>`).join(" and ")} by Lauren Tan (poteto).</p>
</footer>
</div>
</div>
<p class="visually-hidden" id="status" role="status" aria-live="polite"></p>
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
