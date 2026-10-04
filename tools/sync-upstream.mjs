#!/usr/bin/env node
// Rebuilds the upstream-derived part of plugins/pvstack from cursor/plugins/pstack.
//
//   node tools/sync-upstream.mjs                 sync to the commit pinned in UPSTREAM.md
//   node tools/sync-upstream.mjs --ref main      sync to a new ref and re-pin
//   node tools/sync-upstream.mjs --check         exit 1 if the tree differs from a fresh sync
//   node tools/sync-upstream.mjs --source DIR    use an existing cursor/plugins checkout
//
// The PV Stack layer (pv-* droids, setup-pvstack, droid-tools.md) is never touched:
// the script deletes only files it wrote on the previous sync (.upstream-files.json).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "https://github.com/cursor/plugins.git";
const UPSTREAM_DIR = "pstack";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginDir = path.join(root, "plugins", "pvstack");
const ledgerPath = path.join(pluginDir, ".upstream-files.json");
const pinPath = path.join(root, "UPSTREAM.md");

// setup-pstack writes a Cursor rule with Cursor slugs; setup-pvstack replaces it.
const SKIPPED_SKILLS = new Set(["setup-pstack"]);

// Ordered: the full path must be rewritten before the bare filename.
const REWRITES = [
  ["~/.cursor/rules/pstack-models.mdc", "~/.factory/pvstack-models.md"],
  ["pstack-models.mdc", "pvstack-models.md"],
  ["setup-pstack", "setup-pvstack"],
  ["AskQuestion", "AskUser"],
  ['"Comment Sicko"', '"comment-sicko"'],
  ["~/.cursor/skills/", "~/.factory/skills/"],
  [".cursor/skills/", ".factory/skills/"],
];

// A skill that names any of these gets a pointer to the Droid mapping.
const NEEDS_NOTE =
  /\bTask\b|subagent_type|`model`|AskUser|pvstack-models|\/loop|readonly|\.cursor\/|cursor-team-kit|control-ui|control-cli|deslop|Bugbot/;
const NOTE_MARKER = "<!-- pvstack:droid-note -->";

function parseArgs(argv) {
  const args = { check: false, ref: null, source: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--check") args.check = true;
    else if (a === "--ref") args.ref = argv[++i];
    else if (a === "--source") args.source = argv[++i];
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function readPinnedRef() {
  if (!fs.existsSync(pinPath)) return "main";
  const m = fs.readFileSync(pinPath, "utf8").match(/^- Commit: `([0-9a-f]{40})`/m);
  return m ? m[1] : "main";
}

function checkout(ref, source) {
  if (source) {
    const dir = path.resolve(source);
    if (ref) git(dir, "checkout", "--quiet", ref);
    return dir;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pvstack-sync-"));
  git(dir, "init", "--quiet");
  git(dir, "remote", "add", "origin", REPO);
  git(dir, "sparse-checkout", "set", UPSTREAM_DIR);
  git(dir, "fetch", "--quiet", "--depth", "1", "--filter=blob:none", "origin", ref);
  git(dir, "checkout", "--quiet", "FETCH_HEAD");
  return dir;
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out.sort();
}

function rewrite(text) {
  for (const [from, to] of REWRITES) text = text.split(from).join(to);
  return text;
}

function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return m ? [m[0], text.slice(m[0].length)] : ["", text];
}

function droidNote(skillRelPath) {
  const toSkills = "../".repeat(skillRelPath.split("/").length - 1);
  const target =
    skillRelPath === "poteto-mode/SKILL.md"
      ? "references/droid-tools.md"
      : `${toSkills}poteto-mode/references/droid-tools.md`;
  return (
    `${NOTE_MARKER}\n` +
    `> **PV Stack on Droid.** Before following this skill, read [droid-tools.md](${target}). ` +
    "It maps the Cursor tools, Task parameters, and model slugs named below to Droid tools and `pv-*` droids, " +
    "and says where the role sheet lives.\n\n"
  );
}

// Cursor agents become Droid droids: names must match ^[a-z0-9-_]+$ and Cursor-only keys go.
function toDroid(text) {
  const [fm, body] = splitFrontmatter(text);
  const lines = fm.split(/\r?\n/).filter((l) => l && l !== "---");
  const kept = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (key === "name") kept.push(`name: ${value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-")}`);
    else if (key === "description") kept.push(line);
  }
  kept.push("model: inherit");
  return `---\n${kept.join("\n")}\n---\n${rewrite(body)}`;
}

// Returns Map<pluginRelativePath, Buffer>.
function build(upstream) {
  const src = path.join(upstream, UPSTREAM_DIR);
  const files = new Map();
  // A Windows checkout with core.autocrlf yields CRLF; normalize so --check compares the same bytes everywhere.
  const put = (rel, data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
    files.set(rel, buf.includes(0) ? buf : Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8"));
  };

  for (const rel of walk(path.join(src, "skills"))) {
    if (SKIPPED_SKILLS.has(rel.split("/")[0])) continue;
    const raw = fs.readFileSync(path.join(src, "skills", rel));
    if (!rel.endsWith(".md")) {
      put(`skills/${rel}`, raw);
      continue;
    }
    let text = rewrite(raw.toString("utf8"));
    if (rel.endsWith("/SKILL.md") && NEEDS_NOTE.test(text) && !text.includes(NOTE_MARKER)) {
      const [fm, body] = splitFrontmatter(text);
      text = fm + "\n" + droidNote(rel) + body.replace(/^\r?\n/, "");
    }
    put(`skills/${rel}`, text);
  }

  for (const rel of walk(path.join(src, "agents"))) {
    const name = path.basename(rel, ".md").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    put(`droids/${name}.md`, toDroid(fs.readFileSync(path.join(src, "agents", rel), "utf8")));
  }

  for (const rel of walk(path.join(src, "docs"))) {
    const raw = fs.readFileSync(path.join(src, "docs", rel));
    put(`docs/upstream/${rel}`, rel.endsWith(".md") ? rewrite(raw.toString("utf8")) : raw);
  }

  put("LICENSE-pstack", fs.readFileSync(path.join(src, "LICENSE")));
  return files;
}

function upstreamVersion(upstream) {
  const manifest = path.join(upstream, UPSTREAM_DIR, ".cursor-plugin", "plugin.json");
  return JSON.parse(fs.readFileSync(manifest, "utf8")).version;
}

function pinText(sha, version) {
  return `# Upstream pin

PV Stack tracks Lauren Tan's pstack directly from Cursor's plugin repository.

- Repository: ${REPO.replace(/\.git$/, "")}
- Path: \`${UPSTREAM_DIR}/\`
- Commit: \`${sha}\`
- Upstream version: ${version}

Update with \`node tools/sync-upstream.mjs --ref main\`, review the diff, then commit.
\`node tools/sync-upstream.mjs --check\` fails when the tree has drifted from this pin.

## What the sync does

- Copies \`skills/\` (except \`setup-pstack\`, replaced by \`setup-pvstack\`), \`agents/\` as Droid droids, and \`docs/\` under \`docs/upstream/\`.
- Applies the string rewrites listed in \`REWRITES\` in \`tools/sync-upstream.mjs\`.
- Adds a one-line pointer to \`droid-tools.md\` at the top of each skill that names a Cursor tool or model slug.
- Leaves the Benny automation pack out: it is wired to Cursor automations.
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const ref = args.ref ?? readPinnedRef();
  const upstream = checkout(ref, args.source);
  const sha = git(upstream, "rev-parse", "HEAD");
  const files = build(upstream);
  const pin = pinText(sha, upstreamVersion(upstream));
  const previous = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, "utf8")) : [];
  const ledger = JSON.stringify([...files.keys()], null, 2) + "\n";

  if (args.check) {
    const drift = [];
    for (const [rel, data] of files) {
      const target = path.join(pluginDir, rel);
      if (!fs.existsSync(target) || !fs.readFileSync(target).equals(data)) drift.push(`changed  ${rel}`);
    }
    for (const rel of previous) if (!files.has(rel)) drift.push(`stale    ${rel}`);
    if (!fs.existsSync(ledgerPath) || fs.readFileSync(ledgerPath, "utf8") !== ledger) drift.push("changed  .upstream-files.json");
    if (!fs.existsSync(pinPath) || fs.readFileSync(pinPath, "utf8") !== pin) drift.push("changed  UPSTREAM.md");
    if (drift.length) {
      console.error(`Drift from upstream ${sha.slice(0, 7)}:\n  ${drift.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`In sync with upstream ${sha.slice(0, 7)} (${files.size} files).`);
    return;
  }

  for (const rel of previous) {
    if (files.has(rel)) continue;
    const target = path.resolve(pluginDir, rel);
    if (!target.startsWith(pluginDir + path.sep)) throw new Error(`ledger entry escapes the plugin: ${rel}`);
    fs.rmSync(target, { force: true });
  }
  for (const [rel, data] of files) {
    const target = path.join(pluginDir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
  fs.writeFileSync(ledgerPath, ledger);
  fs.writeFileSync(pinPath, pin);
  console.log(`Synced ${files.size} files from upstream ${sha.slice(0, 7)}.`);
}

main();
