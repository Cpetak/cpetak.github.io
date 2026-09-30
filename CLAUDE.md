# Working on this repo

Read `README.md` first; it explains the requirements, the folder layout, and every place
this site deviates from the stock PaperMod theme.

Hard rules:

- Never edit anything under `themes/PaperMod/`. It is an untouched submodule. Overrides go in
  `layouts/`, styling goes in `assets/css/extended/custom.css`.
- Before reporting a change as done, run `hugo` and confirm it finishes with no warnings and
  no errors. Hugo deprecation warnings are failures here.
- Compress photos and videos before committing them (see README, "Media"). Do not commit
  multi-megabyte originals.
- Do not push. Commit when asked; pushing to `main` deploys the live site.
- The publications list is data (`data/publications.yaml`), not Markdown. Add papers there.
