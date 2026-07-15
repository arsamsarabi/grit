# Publishing `@arsams/grit` to npm

This guide covers how releases get onto the npm registry for this project: one-time setup, day-to-day Changesets flow, Trusted Publisher (OIDC), and local emergency publishes.

Package: **`@arsams/grit`**  
Registry: https://www.npmjs.com/package/@arsams/grit  
Repo: https://github.com/arsamsarabi/grit  
CI workflow: [`.github/workflows/release.yml`](../.github/workflows/release.yml)

---

## Mental model

| Path                    | When                               | Auth                                               |
| ----------------------- | ---------------------------------- | -------------------------------------------------- |
| **CI (preferred)**      | Normal releases after setup        | npm Trusted Publisher (OIDC) — no long-lived token |
| **Local `npm publish`** | First package create, or emergency | Your npm login + 2FA                               |

**Provenance** (build attestation) is generated automatically on CI Trusted Publisher publishes. It is **not** enabled in `package.json`, because local `npm publish` fails with `provider: null` if provenance is forced outside CI.

---

## One-time setup (already done for v0.1.0 basics)

### 1. npm org / scope

- Own the **`@arsams`** scope on npm (org or user matching that name).
- Your account must be able to publish under that scope.

### 2. First package create (local)

New scoped packages often need a first interactive publish before Trusted Publisher can be attached:

```bash
cd /path/to/grit
npm whoami
npm publish --access public
```

Requirements:

- `bin` must not point at a `.ts` file (we use [`bin/arsams-grit`](../bin/arsams-grit)).
- Do **not** set `"provenance": true` in `publishConfig` for local publishes.

### 3. Trusted Publisher on npmjs.com

1. Open https://www.npmjs.com/package/@arsams/grit → **Settings** → **Trusted Publisher**.
2. Choose **GitHub Actions**.
3. Exact values:

   | Field                | Value                                       |
   | -------------------- | ------------------------------------------- |
   | Organization or user | `arsamsarabi`                               |
   | Repository           | `grit`                                      |
   | Workflow filename    | `release.yml` (filename only)               |
   | Environment          | blank (unless you add a GitHub Environment) |
   | Allowed actions      | at least **`npm publish`**                  |

4. Save. npm does **not** validate until the next CI publish — typos show up then.

Optional harden (after a successful CI publish):

- Settings → Publishing access → require 2FA and **disallow tokens**.

### 4. GitHub release workflow

[`.github/workflows/release.yml`](../.github/workflows/release.yml) must:

- Run on GitHub-hosted runners (`ubuntu-latest`)
- Set `permissions.id-token: write`
- Use Node 24 + recent npm (`npm install -g npm@latest`)
- Call Changesets without `NPM_TOKEN`
- Set `NPM_CONFIG_PROVENANCE=true` only in CI

SSH for this machine: remote should use the arsam host alias if you have multiple GitHub identities:

```text
git@github.com-arsam:arsamsarabi/grit.git
```

---

## Day-to-day release (CI + Changesets)

This is the normal path after Trusted Publisher works.

### Step 1 — Land work on `main`

Merge feature PRs as usual. Do **not** bump `package.json` version by hand.

### Step 2 — Add a changeset

From a clean working tree:

```bash
bun run changeset
```

1. Select `@arsams/grit`
2. Choose bump: `patch` / `minor` / `major`
3. Write a short summary (goes into the changelog)

Commit and push:

```bash
git add .changeset
git commit -m "chore: add changeset for <reason>"
git push
```

### Step 3 — Version Packages PR

On push to `main`, the **Release** workflow runs [`changesets/action`](https://github.com/changesets/action):

- If there are pending changesets and no release commit yet, it opens or updates a **Version Packages** PR.
- That PR bumps `package.json` / `CHANGELOG.md` and removes consumed changeset files.

Review and **merge** the Version Packages PR.

### Step 4 — Publish job

After the version PR merges to `main`, the same Release workflow runs again. This time it executes:

```bash
bun run release   # → changeset publish → npm publish
```

Authentication is OIDC (Trusted Publisher). No `NPM_TOKEN` secret.

### Step 5 — Verify

```bash
npm view @arsams/grit version
npm view @arsams/grit dist-tags
bunx @arsams/grit --help
# or
bun add -g @arsams/grit && arsams-grit --help
```

On npm, check the version page for **Provenance** when published from CI.

---

## What gets published

Controlled by `package.json` `"files"` (plus always-included package metadata):

- `bin/` — CLI wrapper (`arsams-grit` → Bun → `src/index.ts`)
- `src/` — TypeScript source (runtime via Bun)
- `LICENSE`, `README.md`, `CHANGELOG.md`

Installers need **Bun** on PATH for the binary to run.

Dry-run locally:

```bash
npm pack --dry-run
```

---

## Emergency / local publish

Use only if CI is blocked and you must ship:

```bash
# bump version first (or merge a Version Packages PR offline)
npm version patch   # or edit package.json carefully
npm publish --access public
# complete 2FA / OTP
```

If you previously restricted publishing to Trusted Publisher only, local token publish may be blocked — use CI instead, or temporarily relax npm Publishing access.

Never commit long-lived publish tokens into the repo.

---

## Troubleshooting

| Symptom                              | Likely fix                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `E404` on `@arsams/grit` PUT         | Scope/org `@arsams` missing, or user lacks publish rights                                                    |
| `ENEEDAUTH` in Actions               | Trusted Publisher workflow filename mismatch (`release.yml`), wrong repo/owner, or missing `id-token: write` |
| `provenance … provider: null`        | Local publish with provenance forced — remove from `publishConfig`; use CI env only                          |
| `bin[…] .ts was invalid and removed` | Point `bin` at `bin/arsams-grit`, not `src/index.ts`                                                         |
| Release workflow “does nothing”      | No pending changeset, or Version Packages PR not merged yet                                                  |
| Wrong GitHub account on `git push`   | Use `github.com-arsam` SSH host / remote URL                                                                 |
| Provenance missing on npm            | Private GitHub repo, or publish was local (not OIDC)                                                         |

Official reference: [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/).

---

## Checklist: cutting a release

- [ ] Changes merged to `main`
- [ ] `bun run changeset` → commit → push
- [ ] Version Packages PR reviewed and merged
- [ ] Release workflow succeeded (Actions)
- [ ] `npm view @arsams/grit version` matches expected
- [ ] Smoke: `bunx @arsams/grit --help`
