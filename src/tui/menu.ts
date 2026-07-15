import * as p from "@clack/prompts";
import pc from "picocolors";
import { runBranchInteractive } from "@/cli/commands/branch.ts";
import { runCherryPickInteractive } from "@/cli/commands/cherry-pick.ts";
import { runCommitInteractive } from "@/cli/commands/commit.ts";
import { runLogInteractive } from "@/cli/commands/log.ts";
import { runMergeInteractive } from "@/cli/commands/merge.ts";
import { runPrInteractive } from "@/cli/commands/pr.ts";
import { runRebaseInteractive } from "@/cli/commands/rebase.ts";
import { runReleaseInteractive } from "@/cli/commands/release.ts";
import { runStashInteractive } from "@/cli/commands/stash.ts";
import { runStatus } from "@/cli/commands/status.ts";
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
        { value: "rebase", label: "Rebase" },
        { value: "stash", label: "Stash" },
        { value: "merge", label: "Merge" },
        { value: "cherry-pick", label: "Cherry-pick" },
        { value: "worktree", label: "Worktree" },
        { value: "log", label: "Log" },
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
      case "rebase":
        await runRebaseInteractive();
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
