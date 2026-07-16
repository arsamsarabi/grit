import { cac } from "cac";
import { branchCheckout, branchDelete, branchNew } from "@/cli/commands/branch.ts";
import { runCherryPick } from "@/cli/commands/cherry-pick.ts";
import { runCommit } from "@/cli/commands/commit.ts";
import { runDiff } from "@/cli/commands/diff.ts";
import { runFetch } from "@/cli/commands/fetch.ts";
import { runLog } from "@/cli/commands/log.ts";
import { runMerge } from "@/cli/commands/merge.ts";
import { runPrCreate, runPrStatus } from "@/cli/commands/pr.ts";
import { runPull } from "@/cli/commands/pull.ts";
import { runPush } from "@/cli/commands/push.ts";
import { runRebase } from "@/cli/commands/rebase.ts";
import { runRelease } from "@/cli/commands/release.ts";
import { runReset } from "@/cli/commands/reset.ts";
import { runRevert } from "@/cli/commands/revert.ts";
import { stashApply, stashList, stashPop, stashPush } from "@/cli/commands/stash.ts";
import { runStatus } from "@/cli/commands/status.ts";
import { tagCreate, tagDelete, tagList } from "@/cli/commands/tag.ts";
import { worktreeAddFromFlags, worktreeList, worktreeRemove } from "@/cli/commands/worktree.ts";
import { runInit } from "@/init/wizard.ts";
import { printError, sayEmpty } from "@/tui/prompts.ts";
import pkg from "../../package.json" with { type: "json" };

const VERSION = pkg.version;

function wrap(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      await fn();
    } catch (err) {
      printError(err);
      process.exitCode = 1;
    }
  };
}

export function createProgram() {
  const cli = cac("arsams-grit");
  cli.version(VERSION);
  cli.help();

  cli
    .command("init", "Guided first-time setup")
    .option("--yes", "Non-interactive defaults (skips shell RC write)")
    .action(async (opts: { yes?: boolean }) => {
      await runInit({ yes: opts.yes });
    });

  // ponytail: cac does not match space-separated command names ("branch new").
  // Use "<action>" and dispatch. Upgrade path: nest with a different CLI lib.
  cli
    .command("branch <action>", "Branch ops: new | checkout | delete")
    .option("--type <type>", "Branch type (new)")
    .option("--ticket <ticket>", "Ticket id (new)")
    .option("--slug <slug>", "Slug portion of the name (new)")
    .option("--name <name>", "Branch name (checkout/delete) or full/slug (new)")
    .option("--force", "Force delete")
    .option("--yes", "Skip confirmation when fully flagged")
    .action(async (action: string, opts) => {
      await wrap(async () => {
        if (action === "new") await branchNew(opts);
        else if (action === "checkout") await branchCheckout(opts);
        else if (action === "delete") await branchDelete(opts);
        else throw new Error(`Unknown branch action "${action}". Use: new, checkout, delete`);
      })();
    });

  cli
    .command("commit", "Create a conventional commit")
    .option("--all", "Stage all changes")
    .option("--type <type>", "Commit type")
    .option("--scope <scope>", "Commit scope")
    .option("--message <message>", "Commit summary")
    .option("--body <body>", "Commit body")
    .option("--push", "Push after commit")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runCommit(opts))();
    });

  cli
    .command("status", "Show repository status dashboard")
    .option("--json", "JSON output")
    .action(async (opts) => {
      await runStatus(opts);
    });

  cli
    .command("log", "Show recent commits")
    .option("-n, --count <count>", "Number of commits", { default: "20" })
    .option("--oneline", "One line per commit")
    .action(async (opts) => {
      await wrap(async () => {
        await runLog({ count: Number(opts.count), oneline: opts.oneline });
      })();
    });

  cli
    .command("rebase", "Rebase onto an upstream")
    .option("--onto <ref>", "Upstream ref")
    .option("--force-push", "Force-push with lease after rebase")
    .option("--interactive", "Pass -i to git rebase")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(async () => {
        await runRebase({
          onto: opts.onto,
          forcePush: opts.forcePush,
          interactive: opts.interactive,
          yes: opts.yes,
        });
      })();
    });

  cli
    .command("stash <action>", "Stash ops: push | pop | apply | list")
    .option("--message <msg>", "Message (push)")
    .action(async (action: string, opts) => {
      await wrap(async () => {
        if (action === "push") {
          const result = await stashPush(opts.message);
          if (result === "empty") sayEmpty("Nothing to stash — working tree is clean.");
        } else if (action === "pop") await stashPop();
        else if (action === "apply") await stashApply();
        else if (action === "list") {
          const out = await stashList();
          if (!out) sayEmpty("No stashes.");
          else console.log(out);
        } else throw new Error(`Unknown stash action "${action}". Use: push, pop, apply, list`);
      })();
    });

  cli
    .command("merge", "Merge a branch")
    .option("--branch <name>", "Branch to merge")
    .option("--no-ff", "Create a merge commit")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(async () => {
        await runMerge({ branch: opts.branch, noFf: opts.noFf, yes: opts.yes });
      })();
    });

  cli
    .command("cherry-pick", "Cherry-pick a commit")
    .option("--hash <hash>", "Commit hash")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runCherryPick({ hash: opts.hash, yes: opts.yes }))();
    });

  cli
    .command("worktree <action>", "Worktree ops: list | add | remove")
    .option("--path <path>", "Worktree path")
    .option("--branch <branch>", "Branch name")
    .option("--new-branch", "Create new branch")
    .action(async (action: string, opts) => {
      await wrap(async () => {
        if (action === "list") {
          const { lines, text } = await worktreeList();
          if (lines.length === 0) sayEmpty("No worktrees.");
          else console.log(text);
        } else if (action === "add") await worktreeAddFromFlags(opts);
        else if (action === "remove") {
          if (!opts.path) throw new Error("Missing --path");
          await worktreeRemove(opts.path);
        } else {
          throw new Error(`Unknown worktree action "${action}". Use: list, add, remove`);
        }
      })();
    });

  cli
    .command("pr <action>", "PR ops: create | status (requires gh)")
    .option("--title <title>", "PR title")
    .option("--body <body>", "PR body")
    .option("--draft", "Create as draft")
    .option("--yes", "Skip confirmation prompts")
    .action(async (action: string, opts) => {
      await wrap(async () => {
        if (action === "create") await runPrCreate(opts);
        else if (action === "status") await runPrStatus();
        else throw new Error(`Unknown pr action "${action}". Use: create, status`);
      })();
    });

  cli
    .command("release", "Create a GitHub release (requires gh)")
    .option("--tag <tag>", "Release tag")
    .option("--title <title>", "Release title")
    .option("--notes <notes>", "Release notes")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runRelease(opts))();
    });

  cli
    .command("push", "Push commits to remote")
    .option("--force", "Force push with lease")
    .option("--upstream", "Set upstream when pushing")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runPush(opts))();
    });

  cli
    .command("pull", "Pull changes from remote")
    .option("--rebase", "Rebase instead of merge")
    .option("--autostash", "Automatically stash and unstash")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runPull(opts))();
    });

  cli
    .command("fetch", "Fetch from remote")
    .option("--all", "Fetch all remotes")
    .option("--prune", "Prune deleted remote branches")
    .option("--remote <remote>", "Specific remote to fetch from")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runFetch(opts))();
    });

  cli
    .command("revert", "Revert a commit")
    .option("--hash <hash>", "Commit hash to revert")
    .option("--unpushed", "For unpushed commits, reset instead of revert")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runRevert(opts))();
    });

  cli
    .command("reset", "Reset to a previous commit")
    .option("--mode <mode>", "Reset mode: soft | mixed | hard")
    .option("--target <target>", "Target commit (default: HEAD~1)")
    .option("--yes", "Skip confirmation prompts")
    .action(async (opts) => {
      await wrap(() => runReset(opts))();
    });

  cli
    .command("tag <action>", "Tag ops: list | create | delete")
    .option("--name <name>", "Tag name")
    .option("--message <message>", "Tag message (create)")
    .option("--annotated", "Create annotated tag (create)")
    .option("--push", "Push tags after creation (create)")
    .option("--remote", "Delete from remote too (delete)")
    .option("--yes", "Skip confirmation prompts")
    .action(async (action: string, opts) => {
      await wrap(async () => {
        if (action === "list") await tagList({});
        else if (action === "create") await tagCreate(opts);
        else if (action === "delete") await tagDelete(opts);
        else throw new Error(`Unknown tag action "${action}". Use: list, create, delete`);
      })();
    });

  cli
    .command("diff", "Show changes")
    .option("--cached", "Show staged changes")
    .option("--staged", "Show staged changes (alias for --cached)")
    .option("--stat", "Show diffstat instead of full diff")
    .action(async (opts) => {
      await wrap(() => runDiff(opts))();
    });

  return cli;
}

export async function runCli(argv: string[]): Promise<void> {
  const cli = createProgram();
  const wantsHelp = argv.includes("--help") || argv.includes("-h");
  const wantsVersion = argv.includes("--version") || argv.includes("-v");

  cli.parse(argv, { run: false });

  // cac prints help/version during parse and clears matchedCommand
  if (wantsHelp || wantsVersion) {
    return;
  }

  if (!cli.matchedCommand) {
    const attempted =
      argv
        .slice(2)
        .filter((a) => !a.startsWith("-"))
        .join(" ") || "(none)";
    sayEmpty(`Unknown command: ${attempted}`);
    cli.outputHelp();
    process.exitCode = 1;
    return;
  }

  await cli.runMatchedCommand();
}
