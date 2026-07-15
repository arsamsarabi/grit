# Publishing `@arsams/grit` to npm

Package: **`@arsams/grit`**  
Registry: https://www.npmjs.com/package/@arsams/grit  
Repo: https://github.com/arsamsarabi/grit  
CI workflow: [`.github/workflows/release.yml`](../.github/workflows/release.yml)

---

## Day-to-day release (CI + Changesets)

This is the normal path after Trusted Publisher works.

### Step 1 — Land work (usually on a feature branch)

Do **not** bump `package.json` version by hand.

Preferred flow: add the changeset **on the same feature branch / PR** as the code change, then merge that PR into `main`. You can also add a changeset afterward on `main`, but keeping it with the feature PR is clearer and harder to forget.

### Step 2 — Add a changeset

From a clean working tree on the branch that contains the change (feature branch, or `main` if you already merged):

```bash
bun run changeset
```

1. Select `@arsams/grit`
2. Choose bump: `patch` / `minor` / `major`
3. Write a short summary (goes into the changelog)

Commit and push **on that branch**:

```bash
git add .changeset
git commit -m "chore: add changeset for <reason>"
git push
```

If you created it on a feature branch, open/merge the PR so the changeset lands on `main`.

### Step 3 — Version Packages PR

After the changeset is on `main`, the **Release** workflow runs [`changesets/action`](https://github.com/changesets/action):

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

- [ ] Code + changeset merged to `main` (changeset usually added on the feature branch)
- [ ] Version Packages PR reviewed and merged
- [ ] Release workflow succeeded (Actions)
- [ ] `npm view @arsams/grit version` matches expected
- [ ] Smoke: `bunx @arsams/grit --help`
