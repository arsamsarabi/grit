# Changelog

## 1.0.1

### Patch Changes

- 1f053a0: Fix SVG header for README file

## 1.0.0

### Major Changes

- c256f83: # Major Release v1.0.0

  This major release adds comprehensive Git operation support, making grit a feature-complete Git assistant.

  ## New Commands
  - **push**: Push commits to remote with force-with-lease and upstream options
  - **pull**: Pull changes from remote with rebase and autostash support
  - **fetch**: Fetch from remote(s) with all, prune, and specific remote options
  - **revert**: Revert commits (both pushed and unpushed) with interactive selection
  - **reset**: Reset to previous commits with soft/mixed/hard modes
  - **tag**: Complete tag management (list, create, delete) with annotated tag support
  - **diff**: Show changes with cached/staged and stat options

  ## Improvements
  - All commands available via CLI flags and interactive TUI menu
  - Consistent confirmation prompts for destructive operations
  - Interactive commit/tag pickers for better UX
  - Comprehensive help documentation for all commands

  ## Breaking Changes

  None - all existing commands remain unchanged. This is a major bump to v1.0.0 to signify feature completeness and stability.

## 0.4.1

### Patch Changes

- bbdc581: Update README file

## 0.4.0

### Minor Changes

- a4dad36: Ship binaries

## 0.3.3

### Patch Changes

- 69996ec: Iron out homebrew issues, and restrict release workflow

## 0.3.2

### Patch Changes

- effcf83: Homebrew formula hardening

## 0.3.1

### Patch Changes

- 4954567: fixing homebrew update workflow

## 0.3.0

### Minor Changes

- 816c064: Adds spinner and back option to menus

## 0.2.1

### Patch Changes

- 8b20b19: fix ci

## 0.2.0

### Minor Changes

- d133383: Homebrew wiring and documentation updates
- 3b6c3b9: Adds filterable pick helpers

## 0.1.1

### Patch Changes

- 99dd7ab: Initial public release of grit — interactive Git assistant with TUI and CLI.
- 6e5a774: Update docs - test ci publishing flow

## 0.1.0

- Initial release of `@arsams/grit`
- Hybrid TUI + CLI for branch, commit, rebase, stash, merge, cherry-pick, worktree, status, log
- Guided `init` with alias conflict detection
- GitHub PR/release helpers via `gh`
- JSON config (global + repo)
