# Phase 6C docs lock — drop-in replacement (supersedes patch 0016)

Patch 0016 cannot apply because the docs in the real repo drifted from the
patch's preimage. These two files are the complete intended end-state, so
they apply regardless of drift.

From the repo root, on branch `ios-docs-phase-6c-lock`:

```bash
cp phase-6c-docs/README.md README.md
cp phase-6c-docs/ios-mvp-plan.md docs/ios-mvp-plan.md

git diff          # review: this is exactly what changes vs your current docs
git add README.md docs/ios-mvp-plan.md
git commit -m "Update docs for Phase 6C lock"
```

Scope: README.md and docs/ios-mvp-plan.md only — no app code, no pbxproj.
