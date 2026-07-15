import * as p from "@clack/prompts";
import { assertGitRepo, git } from "@/git/client.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, isBack, printError, requireFlag, showNoteAndContinue, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export async function worktreeList(): Promise<{ lines: string[]; text: string }> {
  await assertGitRepo();
  const text = (await withSpinner("Listing worktrees...", () => git(["worktree", "list"]))).trim();
  const lines = text ? text.split("\n").filter(Boolean) : [];
  return { lines, text };
}

export async function worktreeAdd(opts: { path: string; branch?: string; newBranch?: boolean }): Promise<void> {
  await assertGitRepo();
  const args = ["worktree", "add"];
  if (opts.branch && opts.newBranch) {
    args.push("-b", opts.branch, opts.path);
  } else if (opts.branch) {
    args.push(opts.path, opts.branch);
  } else {
    args.push(opts.path);
  }
  await withSpinner("Adding worktree...", () => git(args));
  p.log.success(`Worktree added at ${opts.path}`);
}

export async function worktreeRemove(path: string): Promise<void> {
  await assertGitRepo();
  await withSpinner("Removing worktree...", () => git(["worktree", "remove", path]));
  p.log.success(`Removed worktree ${path}`);
}

export async function runWorktreeInteractive(): Promise<void> {
  try {
    for (;;) {
      const action = await pick({
        message: "Worktree",
        options: [
          { value: "list", label: "List" },
          { value: "add", label: "Add" },
          { value: "remove", label: "Remove" },
        ],
      });
      if (isBack(action)) return;

      if (action === "list") {
        const { lines, text } = await worktreeList();
        if (lines.length === 0) {
          await showNoteAndContinue("Worktrees", "No worktrees found.");
        } else if (lines.length === 1) {
          await showNoteAndContinue("Worktrees", `${text}\n\nOnly the primary checkout — no extra linked worktrees.`);
        } else {
          await showNoteAndContinue("Worktrees", text);
        }
        continue;
      }

      if (action === "add") {
        let i = 0;
        let path = "";
        let branch = "";
        let newBranch = false;
        const steps = ["path", "branch", "newBranch"] as const;
        while (i >= 0 && i < steps.length) {
          switch (steps[i]!) {
            case "path": {
              const v = await textOrBack({
                message: "Path for new worktree",
                placeholder: "../feature-worktree",
                validate: (x) => (x?.trim() ? undefined : "Required"),
              });
              if (isBack(v)) {
                i = -1;
                break;
              }
              path = v;
              i++;
              break;
            }
            case "branch": {
              const v = await textOrBack({
                message: "Branch name (optional)",
                placeholder: "feat/foo",
              });
              if (isBack(v)) {
                i--;
                break;
              }
              branch = v;
              i = branch ? i + 1 : steps.length;
              break;
            }
            case "newBranch": {
              const v = await confirmOrBack("Create new branch?", true);
              if (isBack(v)) {
                i--;
                break;
              }
              newBranch = v;
              i++;
              break;
            }
          }
        }
        if (i < 0) continue;
        await worktreeAdd({
          path,
          branch: branch || undefined,
          newBranch: branch ? newBranch : false,
        });
        continue;
      }

      // remove
      const { lines } = await worktreeList();
      if (lines.length <= 1) {
        await showNoteAndContinue(
          "Remove worktree",
          "No extra worktrees to remove (only the primary checkout exists)."
        );
        continue;
      }
      const path = await textOrBack({
        message: "Worktree path to remove",
        validate: (v) => (v?.trim() ? undefined : "Required"),
      });
      if (isBack(path)) continue;
      await worktreeRemove(path);
      continue;
    }
  } catch (err) {
    printError(err);
  }
}

export async function worktreeAddFromFlags(opts: {
  path?: string;
  branch?: string;
  newBranch?: boolean;
}): Promise<void> {
  await worktreeAdd({
    path: requireFlag(opts.path, "path"),
    branch: opts.branch,
    newBranch: opts.newBranch,
  });
}
