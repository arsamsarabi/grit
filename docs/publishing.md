# Publishing `@arsams/grit`

Package: **`@arsams/grit`**  
Registry: https://www.npmjs.com/package/@arsams/grit  
Homebrew: tap this repo (see below)  
Repo: https://github.com/arsamsarabi/grit  
CI: [`.github/workflows/release.yml`](../.github/workflows/release.yml)

Releases ship to **npm** (OIDC Trusted Publisher). When publish succeeds, CI updates [`Formula/grit.rb`](../Formula/grit.rb) in **this same repo** so Homebrew installs stay in sync. No separate tap repository.

---

## Day-to-day release (CI + Changesets → npm → Homebrew)

### Step 1 — Land work (usually on a feature branch)

Do **not** bump `package.json` version by hand.

Preferred flow: add the changeset **on the same feature branch / PR** as the code change, then merge into `main`. Pushing a changeset **straight to `main`** is also fine — the Release workflow runs either way.

### Step 2 — Add a changeset

From a clean working tree on the branch that contains the change:

```bash
bun run changeset
```

1. Select `@arsams/grit`
2. Choose bump: `patch` / `minor` / `major`
3. Write a short summary (goes into the changelog)

```bash
git add .changeset
git commit -m "chore: add changeset for <reason>"
git push
```

If you created it on a feature branch, merge the PR so the changeset lands on `main`.

### Step 3 — Version Packages PR

After the changeset is on `main`, the **Release** workflow runs [`changesets/action`](https://github.com/changesets/action):

- Opens/updates a **Version Packages** PR that bumps `package.json` / `CHANGELOG.md` and removes consumed changesets.

Review and **merge** that PR.

(Requires: repo **Settings → Actions → Workflow permissions → Allow GitHub Actions to create and approve pull requests**.)

### Step 4 — npm publish (CI)

After the version PR merges, Release runs again and executes:

```bash
bun run release   # → changeset publish → npm publish
```

Auth is OIDC (Trusted Publisher). No `NPM_TOKEN`.

### Step 5 — Homebrew formula bump (CI)

When publish succeeds, the **Bump Homebrew formula** job:

1. Rewrites [`Formula/grit.rb`](../Formula/grit.rb) with the new npm `url` + `sha256`
2. Commits and pushes that bump to `main`

(Workflow `GITHUB_TOKEN` pushes do not re-trigger nested Release publishes.)

### Step 6 — Verify

```bash
npm view @arsams/grit version
bunx @arsams/grit --help

brew update
brew install arsamsarabi/grit        # after tapping — see below
# or: brew upgrade grit
arsams-grit --version
```

---

## Homebrew install (users)

This repo is the tap (has `Formula/grit.rb`):

```bash
brew tap arsamsarabi/grit https://github.com/arsamsarabi/grit
brew install grit
arsams-grit --help
```

Binary name is **`arsams-grit`**. Run `arsams-grit init` to choose a shorter shell alias if you want.

Upgrade later:

```bash
brew update
brew upgrade grit
```

---

## What npm publishes

Controlled by `package.json` `"files"`:

- `bin/` — CLI wrapper
- `src/` — TypeScript (runs via Bun)
- `LICENSE`, `README.md`, `CHANGELOG.md`

Dry-run: `npm pack --dry-run`

---

## Emergency / local publish

```bash
npm version patch
npm publish --access public
bun run sync:homebrew
git add Formula/grit.rb
git commit -m "chore: bump Homebrew formula"
git push
```

Prefer CI. Never commit long-lived publish tokens.

---

## Troubleshooting

| Symptom                             | Likely fix                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `ENEEDAUTH` in Actions              | Trusted Publisher: workflow must be exactly `release.yml`; need `id-token: write` |
| Actions cannot create PRs           | Enable “Allow GitHub Actions to create and approve pull requests”                 |
| Release “does nothing”              | No pending changeset, or Version PR not merged                                    |
| Homebrew job skipped                | `published` was false (no npm publish that run)                                   |
| `brew install` formula SHA mismatch | Re-run `bun run sync:homebrew` after npm publish and push `Formula/grit.rb`       |
| Provenance / local publish errors   | Provenance is CI-only (`NPM_CONFIG_PROVENANCE`); don’t set in `publishConfig`     |

---

## Checklist

- [ ] Code + changeset on `main`
- [ ] Version Packages PR merged
- [ ] Release → npm publish succeeded
- [ ] Homebrew formula bump commit landed
- [ ] `npm view @arsams/grit version` OK
- [ ] `brew upgrade grit` / fresh install OK (`arsams-grit --version`)
