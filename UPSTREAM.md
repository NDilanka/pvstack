# Upstream pin

PV Stack tracks Lauren Tan's pstack directly from Cursor's plugin repository.

- Repository: https://github.com/cursor/plugins
- Path: `pstack/`
- Commit: `df581122cde17e6e27686b5a448bde23e4ad4318`
- Upstream version: 0.15.15

Update with `node tools/sync-upstream.mjs --ref main`, review the diff, then commit.
`node tools/sync-upstream.mjs --check` fails when the tree has drifted from this pin.

## What the sync does

- Copies `skills/` (except `setup-pstack`, replaced by `setup-pvstack`), `agents/` as Droid droids, and `docs/` under `docs/upstream/`.
- Applies the string rewrites listed in `REWRITES` in `tools/sync-upstream.mjs`.
- Sets each skill's `name` to its directory name, the lowercase slug Droid expects (`Poteto Mode` becomes `poteto-mode`).
- Keeps upstream's executable bits; `--check` compares them against the git index.
- Adds a one-line pointer to `droid-tools.md` at the top of each skill that names a Cursor tool or model slug.
- Leaves the Benny automation pack out: it is wired to Cursor automations.
