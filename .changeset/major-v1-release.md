---
"@arsams/grit": major
---

# Major Release v1.0.0

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
