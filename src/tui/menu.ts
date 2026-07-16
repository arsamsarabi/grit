import * as p from "@clack/prompts";
import pc from "picocolors";
import { runBranchInteractive } from "@/cli/commands/branch.ts";
import { runCherryPickInteractive } from "@/cli/commands/cherry-pick.ts";
import { runCommitInteractive } from "@/cli/commands/commit.ts";
import { runDiffInteractive } from "@/cli/commands/diff.ts";
import { runFetchInteractive } from "@/cli/commands/fetch.ts";
import { runLogInteractive } from "@/cli/commands/log.ts";
import { runMergeInteractive } from "@/cli/commands/merge.ts";
import { runPrInteractive } from "@/cli/commands/pr.ts";
import { runPullInteractive } from "@/cli/commands/pull.ts";
import { runPushInteractive } from "@/cli/commands/push.ts";
import { runRebaseInteractive } from "@/cli/commands/rebase.ts";
import { runReleaseInteractive } from "@/cli/commands/release.ts";
import { runResetInteractive } from "@/cli/commands/reset.ts";
import { runRevertInteractive } from "@/cli/commands/revert.ts";
import { runStashInteractive } from "@/cli/commands/stash.ts";
import { runStatus } from "@/cli/commands/status.ts";
import { runTagInteractive } from "@/cli/commands/tag.ts";
import { runWorktreeInteractive } from "@/cli/commands/worktree.ts";
import { pick } from "@/tui/pick.ts";
import { exitOnCancel } from "@/tui/prompts.ts";

export async function runMainMenu(): Promise<void> {
  p.intro(pc.bgMagenta(pc.black(" grit ")));

  for (;;) {
    const choice = await pick({
      message: "What do you want to do?",
      back: false,
      options: [
        { value: "status", label: "Status", hint: "repo dashboard" },
        { value: "branch", label: "Branch", hint: "new / checkout / delete" },
        { value: "commit", label: "Commit", hint: "conventional message" },
        { value: "push", label: "Push", hint: "push to remote" },
        { value: "pull", label: "Pull", hint: "pull from remote" },
        { value: "fetch", label: "Fetch", hint: "fetch from remote" },
        { value: "rebase", label: "Rebase" },
        { value: "revert", label: "Revert", hint: "revert a commit" },
        { value: "reset", label: "Reset", hint: "reset to commit" },
        { value: "stash", label: "Stash" },
        { value: "merge", label: "Merge" },
        { value: "cherry-pick", label: "Cherry-pick" },
        { value: "worktree", label: "Worktree" },
        { value: "log", label: "Log" },
        { value: "diff", label: "Diff", hint: "show changes" },
        { value: "tag", label: "Tag", hint: "list / create / delete" },
        { value: "pr", label: "Pull request", hint: "requires gh" },
        { value: "release", label: "Release", hint: "requires gh" },
        { value: "quit", label: "Quit" },
      ],
    });
    exitOnCancel(choice);

    switch (choice) {
      case "status":
        await runStatus({ pause: true });
        break;
      case "branch":
        await runBranchInteractive();
        break;
      case "commit":
        await runCommitInteractive();
        break;
      case "push":
        await runPushInteractive();
        break;
      case "pull":
        await runPullInteractive();
        break;
      case "fetch":
        await runFetchInteractive();
        break;
      case "rebase":
        await runRebaseInteractive();
        break;
      case "revert":
        await runRevertInteractive();
        break;
      case "reset":
        await runResetInteractive();
        break;
      case "stash":
        await runStashInteractive();
        break;
      case "merge":
        await runMergeInteractive();
        break;
      case "cherry-pick":
        await runCherryPickInteractive();
        break;
      case "worktree":
        await runWorktreeInteractive();
        break;
      case "log":
        await runLogInteractive();
        break;
      case "diff":
        await runDiffInteractive();
        break;
      case "tag":
        await runTagInteractive();
        break;
      case "pr":
        await runPrInteractive();
        break;
      case "release":
        await runReleaseInteractive();
        break;
      case "quit":
        p.outro("Happy coding!");
        return;
    }
  }
}
