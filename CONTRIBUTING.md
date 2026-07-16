# Contributing to grit

Thanks for wanting to help. grit is a small, opinionated Git assistant — short PRs, clear UX, and boringly solid tooling beat clever abstractions.

You don’t need to be an expert. Bug reports, docs fixes, and good questions count.

## Before you start

- Skim the [README](./README.md) so you know what grit is (and isn’t).
- Search [existing issues](https://github.com/arsamsarabi/grit/issues) before opening a new one.
- For larger ideas, open an issue first so we can align on approach.

## Development setup

**Requirements**

- [Bun](https://bun.sh) `>= 1.1`
- `git` on your `PATH`
- `gh` (optional; needed for PR/release-related paths)

```bash
git clone https://github.com/arsamsarabi/grit.git
cd grit
bun install
```

Useful scripts:

| Command                  | What it does                                   |
| ------------------------ | ---------------------------------------------- |
| `bun run src/index.ts`   | Run the CLI from source (TUI if no args)       |
| `bun test`               | Run tests                                      |
| `bun run lint`           | ESLint + Prettier check                        |
| `bun run lint:fix`       | Auto-fix lint/format                           |
| `bun run typecheck`      | `tsc --noEmit`                                 |
| `bun run build:binaries` | Cross-compile standalone binaries into `dist/` |
| `bun run compile`        | Alias for `build:binaries`                     |

Pre-commit hooks (Husky + lint-staged) format and lint staged files. CI runs the same checks on Ubuntu, macOS, and Windows.

### Imports

Source lives under `src/`. Prefer the path alias:

```ts
import { pick } from "@/tui/pick.ts";
```

`@/*` maps to `./src/*` (see `tsconfig.json`). Bun and `tsc` both resolve it.

## How we like changes

- **Small and focused.** One problem per PR when you can.
- **Match the neighborhood.** Look at nearby files for style; we use ESLint, Prettier (with import sorting), and TypeScript strict mode.
- **Keep it lean.** Avoid new dependencies unless they’re clearly worth the weight. Prefer the standard library / what’s already in `package.json`.
- **Leave a check behind.** Non-trivial logic should include a small `bun:test` that fails if the behavior regresses. Trivial one-liners don’t need ceremony.
- **TUI and CLI both matter.** Interactive prompts and scriptable flags should stay consistent where the feature applies to both.

User-facing changes (behavior, CLI surface, notable docs) should include a [Changeset](https://github.com/changesets/changesets):

```bash
bun run changeset
```

Follow the prompts. Patch for fixes, minor for features, major for breaking changes.

## Pull requests

1. Branch from `main`.
2. Make your change; keep commits readable.
3. Run `bun test`, `bun run lint`, and `bun run typecheck` locally.
4. Open a PR against `main` with a short description of **why** (not just what).
5. Link related issues if any.

CI must be green. We’ll review as soon as we can — feedback is about the code, not you.

## Reporting bugs

A good bug report includes:

- grit version (`arsams-grit --version` or package version)
- OS and Bun version (`bun --version`)
- What you ran
- What you expected vs what happened
- Logs or screenshots if they’re useful

Security-sensitive reports: see [SECURITY.md](./SECURITY.md) — don’t open a public issue with exploit details.

## Docs and publishing

- Day-to-day usage: [README](./README.md)
- Release / npm / Homebrew maintainers: [docs/publishing.md](./docs/publishing.md)

You don’t need to touch publishing docs for ordinary feature PRs.

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be
respectful, assume good intent, and give people the benefit of the doubt. To
report an incident, use the contact listed in that document.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE) — the same as the rest of the project.

---

Questions welcome on the PR or issue. Thanks again for contributing.
