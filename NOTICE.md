# Notice

pvstack includes and modifies pstack by Lauren Tan ([@poteto](https://github.com/poteto)), from https://github.com/cursor/plugins/tree/main/pstack, under the MIT License. The original license is in `plugins/pvstack/LICENSE-pstack`.

## Files from pstack

These files are listed in `plugins/pvstack/.upstream-files.json`:

- `plugins/pvstack/skills/**` (except the pvstack files below)
- `plugins/pvstack/droids/poteto-agent.md`, `plugins/pvstack/droids/comment-sicko.md`
- `plugins/pvstack/docs/upstream/**`

## Changes made by the sync tool

- Cursor paths, tool names and the model-rule filename are rewritten (see `REWRITES` in `tools/sync-upstream.mjs`).
- Each skill that names a Cursor tool or model slug gets a one-line pointer to `droid-tools.md`.
- Cursor agents are converted to Droid droids: the name is normalized, `model: inherit` is added, and Cursor-only keys are removed.
- `setup-pstack` and the Benny automation pack are not included.

## Files written for pvstack

- `plugins/pvstack/droids/pv-*.md`
- `plugins/pvstack/skills/setup-pvstack/**`
- `plugins/pvstack/skills/poteto-mode/references/droid-tools.md`
- `docs/`, `tools/`, manifests, and this repository's README

## VulcanBench

The benchmark figures in `docs/model-evidence.md`, and the model choices based on them, come from VulcanBench (https://vulcanbench.com) by Morgan Linton ([@morganlinton](https://github.com/morganlinton), https://www.morganlinton.com). The figures are cited with links to their source reports, not redistributed. The VulcanBench harness is open source at https://github.com/morganlinton/VulcanBench.
