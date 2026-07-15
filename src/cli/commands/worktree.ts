import * as p from "@clack/prompts";
import { assertGitRepo, git } from "../../git/client.ts";
import { pick } from "../../tui/pick.ts";
import { handleCancel, printError, requireFlag, sayEmpty } from "../../tui/prompts.ts";

export async function worktreeList(): Promise<void> {
  await assertGitRepo();
  const out = await git(["worktree", "list"]);
  if (!out.trim()) {
    sayEmpty("No worktrees.");
    return;
  }
  console.log(out);
}

export async function worktreeAdd(opts: {
  path: string;
  branch?: string;
  newBranch?: boolean;
}): Promise<void> {
  await assertGitRepo();
  const args = ["worktree", "add"];
  if (opts.branch && opts.newBranch) {
    args.push("-b", opts.branch, opts.path);
  } else if (opts.branch) {
    args.push(opts.path, opts.branch);
  } else {
    args.push(opts.path);
  }
  await git(args);
  p.log.success(`Worktree added at ${opts.path}`);
}

export async function worktreeRemove(path: string): Promise<void> {
  await assertGitRepo();
  await git(["worktree", "remove", path]);
  p.log.success(`Removed worktree ${path}`);
}

export async function runWorktreeInteractive(): Promise<void> {
  try {
    const action = await pick({
      message: "Worktree",
      options: [
        { value: "list", label: "List" },
        { value: "add", label: "Add" },
        { value: "remove", label: "Remove" },
      ],
    });
    handleCancel(action);
    if (action === "list") {
      await worktreeList();
      return;
    }
    if (action === "add") {
      const path = await p.text({
        message: "Path for new worktree",
        placeholder: "../feature-worktree",
        validate: (v) => (v?.trim() ? undefined : "Required"),
      });
      handleCancel(path);
      const branch = await p.text({
        message: "Branch name (optional)",
        placeholder: "feat/foo",
      });
      handleCancel(branch);
      const newBranch = branch
        ? await p.confirm({ message: "Create new branch?", initialValue: true })
        : false;
      if (branch) handleCancel(newBranch);
      await worktreeAdd({
        path: path as string,
        branch: (branch as string) || undefined,
        newBranch: Boolean(newBranch),
      });
      return;
    }
    const path = await p.text({
      message: "Worktree path to remove",
      validate: (v) => (v?.trim() ? undefined : "Required"),
    });
    handleCancel(path);
    await worktreeRemove(path as string);
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
