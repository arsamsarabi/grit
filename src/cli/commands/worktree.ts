import * as p from "@clack/prompts";
import { assertGitRepo, git } from "@/git/client.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, isBack, printError, requireFlag, sayEmpty, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export async function worktreeList(): Promise<void> {
  await assertGitRepo();
  const out = await withSpinner("Listing worktrees…", () => git(["worktree", "list"]));
  if (!out.trim()) {
    sayEmpty("No worktrees.");
    return;
  }
  console.log(out);
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
  await withSpinner("Adding worktree…", () => git(args));
  p.log.success(`Worktree added at ${opts.path}`);
}

export async function worktreeRemove(path: string): Promise<void> {
  await assertGitRepo();
  await withSpinner("Removing worktree…", () => git(["worktree", "remove", path]));
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
        await worktreeList();
        return;
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
        return;
      }

      const path = await textOrBack({
        message: "Worktree path to remove",
        validate: (v) => (v?.trim() ? undefined : "Required"),
      });
      if (isBack(path)) continue;
      await worktreeRemove(path);
      return;
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
