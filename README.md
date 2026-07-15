# grit

Opinionated Git assistant — beautiful interactive TUI and a full scriptable CLI.

**Package:** [`@arsams/grit`](https://www.npmjs.com/package/@arsams/grit)  
**Binary:** `arsams-grit` (alias via `init`)  
**License:** [MIT](./LICENSE)

## Install

```bash
# Bun (recommended)
bun add -g @arsams/grit

# npm
npm install -g @arsams/grit

# one-shot
bunx @arsams/grit --help
```

Then run first-time setup:

```bash
arsams-grit init
```

`init` checks for `git` / `gh`, resolves PATH conflicts for the `grit` name (e.g. vs GritQL), writes your shell alias, and creates `~/.config/grit/config.json`.

### Homebrew

```bash
brew tap arsamsarabi/tap
brew install grit
```

(Requires the tap repo to publish the formula from [`formula/grit.rb`](./formula/grit.rb).)

## Usage

```bash
# Interactive main menu
grit

# Scriptable commands
grit status
grit status --json
grit branch new --type feat --ticket TRF-123 --slug add-login
grit commit --all --type feat --message "add login" --push
grit rebase --onto origin/main
grit stash push --message "wip"
grit pr create
grit release --tag v0.2.0
```

### Commands

| Command                              | Description                             |
| ------------------------------------ | --------------------------------------- |
| `init`                               | Guided setup                            |
| `branch new \| checkout \| delete`   | Branch workflows                        |
| `commit`                             | Conventional commits (+ optional emoji) |
| `status`                             | Dashboard (ahead/behind, files, PR)     |
| `log`                                | Recent history                          |
| `rebase`                             | Rebase onto upstream                    |
| `stash push \| pop \| apply \| list` | Stash helpers                           |
| `merge`                              | Merge a branch                          |
| `cherry-pick`                        | Cherry-pick a commit                    |
| `worktree list \| add \| remove`     | Worktrees                               |
| `pr create \| status`                | GitHub PRs via `gh`                     |
| `release`                            | Tag + GitHub release via `gh`           |

## Configuration

**Precedence:** CLI flags > repo `grit.config.json` > global config

| Platform      | Global config path           |
| ------------- | ---------------------------- |
| macOS / Linux | `~/.config/grit/config.json` |
| Windows       | `%APPDATA%/grit/config.json` |

Example:

```json
{
  "alias": "grit",
  "branch": {
    "template": "{type}/{ticket}-{slug}",
    "types": ["fix", "feat", "docs", "chore", "refactor"],
    "ticketPattern": "[A-Z]+-[0-9]+"
  },
  "commit": {
    "emoji": {
      "enabled": false,
      "map": { "feat": "✨", "fix": "🐛", "docs": "📝" }
    }
  },
  "rebase": {
    "defaultUpstream": "origin/main",
    "confirmForcePush": true
  },
  "github": {
    "prTemplate": true
  }
}
```

Commit a `grit.config.json` in your repo to share team conventions.

## Requirements

- [Bun](https://bun.sh) ≥ 1.1 (runtime)
- `git` on PATH
- [`gh`](https://cli.github.com) (optional; required for `pr` / `release`)

## Development

```bash
bun install
bun test
bun run lint
bun run src/index.ts --help
bun run compile   # produce dist/arsams-grit binary
```

Publishing to npm (Trusted Publisher + Changesets): see [docs/npm-publishing.md](./docs/npm-publishing.md).

## Why arsams-grit?

The short name `grit` is already used by [GritQL](https://docs.grit.io/). This package ships as `arsams-grit` and lets you pick a conflict-free shell alias during `init`.

## License

MIT — see [LICENSE](./LICENSE).
