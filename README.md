<p align="center">
  <img src="./docs/assets/grit.svg" alt="grit" width="720">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@arsams/grit"><img src="https://img.shields.io/npm/v/@arsams/grit?style=flat-square&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@arsams/grit"><img src="https://img.shields.io/npm/dm/@arsams/grit?style=flat-square&logo=npm" alt="npm downloads"></a>
  <a href="https://github.com/arsamsarabi/grit/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/arsamsarabi/grit/ci.yml?branch=main&style=flat-square&label=CI" alt="CI status"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/arsamsarabi/grit?style=flat-square" alt="MIT license"></a>
  <a href="https://github.com/arsamsarabi/grit"><img src="https://img.shields.io/badge/Homebrew-arsamsarabi%2Fgrit-FBB040?style=flat-square&logo=homebrew&logoColor=black" alt="Homebrew tap"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/built_with-Bun-FBF0DF?style=flat-square&logo=bun&logoColor=black" alt="Built with Bun"></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs welcome"></a>
</p>

<p align="center">
  Opinionated Git assistant with an interactive TUI and scriptable CLI.
</p>

**Package:** [`@arsams/grit`](https://www.npmjs.com/package/@arsams/grit)  
**Binary:** `arsams-grit` (short alias via `init`)

## Demo

Interactive menu with a repo status dashboard:

![grit menu and status](./docs/assets/demo-1.gif)

Guided branch naming and conventional commits:

![grit branch and commit](./docs/assets/demo-2.gif)

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

`init` checks for `git` / `gh`, lets you pick a shell alias (and avoids clobbering an existing command on PATH), and creates `~/.config/grit/config.json`.

### Homebrew

```bash
brew install arsamsarabi/grit/grit
arsams-grit --help
```

One command: Homebrew trusts that formula for the install. No separate `brew trust` step.

## Usage

```bash
# Interactive main menu
grit

# Scriptable commands
grit status
grit status --json
grit branch new --type feat --ticket TRF-123 --slug add-login
grit commit --all --type feat --message "add login" --push
grit push --force
grit pull --rebase
grit fetch --all --prune
grit revert --hash abc1234
grit reset --mode soft
grit rebase --onto origin/main
grit stash push --message "wip"
grit tag create --name v1.0.0 --message "Release v1.0.0"
grit diff --cached
grit pr create
grit release --tag v0.2.0
```

### Commands

| Command                              | Description                             |
| ------------------------------------ | --------------------------------------- |
| `init`                               | Guided setup                            |
| `branch new \| checkout \| delete`   | Branch workflows                        |
| `commit`                             | Conventional commits (+ optional emoji) |
| `push`                               | Push commits to remote                  |
| `pull`                               | Pull changes from remote                |
| `fetch`                              | Fetch from remote                       |
| `status`                             | Dashboard (ahead/behind, files, PR)     |
| `log`                                | Recent history                          |
| `rebase`                             | Rebase onto upstream                    |
| `revert`                             | Revert a commit (pushed or unpushed)    |
| `reset`                              | Reset to a previous commit              |
| `stash push \| pop \| apply \| list` | Stash helpers                           |
| `merge`                              | Merge a branch                          |
| `cherry-pick`                        | Cherry-pick a commit                    |
| `worktree list \| add \| remove`     | Worktrees                               |
| `diff`                               | Show changes                            |
| `tag list \| create \| delete`       | Tag management                          |
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

## Project support

grit is a solo-maintained project. Issues and pull requests are welcome, and I’ll respond as time allows.

## Requirements

- `git` on PATH
- [`gh`](https://cli.github.com) (optional; required for `pr` / `release`)
- [Bun](https://bun.sh) ≥ 1.1 (development only — published installs ship a standalone binary)

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide.

```bash
bun install
bun test
bun run lint
bun run src/index.ts --help
bun run compile   # cross-compile standalone binaries into dist/
```

Publishing (npm + Homebrew via CI): see [docs/publishing.md](./docs/publishing.md).

### Homebrew

```bash
brew install arsamsarabi/grit/grit
arsams-grit --help
```

## Why arsams-grit?

The installed binary is `arsams-grit`. During `init` you can add a short shell alias (`grit`, `g`, `gg`, or custom) if that name is free on your PATH.

## License

MIT — see [LICENSE](./LICENSE).
