# PV Stack maintenance

- Don't hand-edit files listed in `plugins/pvstack/.upstream-files.json`. Change `tools/sync-upstream.mjs` (its `REWRITES` or the build steps) and re-run `npm run sync`, or send the change upstream to `cursor/plugins`.
- `plugins/pvstack/droids/pv-*.md` are generated. Edit `CELLS` in `tools/droids.mjs`, then run `npm run droids`.
- Whenever a mode sheet or a `pv-*` cell changes, update `docs/model-evidence.md` in the same commit with the VulcanBench number behind the change.
- Run `npm run check` before every commit. It fails if the tree has drifted from the upstream pin (content or executable bits), if a droid is out of date or no longer in `CELLS`, if a cell is used by no sheet, if a sheet names a droid that doesn't exist, if a skill's `name` differs from its directory, or if a role line in a skill has no sheet entry.
- On Windows, git ignores the filesystem executable bit. When the sync reports a new upstream executable, set it with the `git update-index --chmod=+x` command it prints.
