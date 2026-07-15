import * as p from "@clack/prompts";
import pc from "picocolors";
import { assertGitRepo, git } from "@/git/client.ts";
import { getBranches } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrExit, handleCancel, printError, requireFlag, sayEmpty } from "@/tui/prompts.ts";

export type MergeOptions = {
  branch?: string;
  noFf?: boolean;
  yes?: boolean;
};

export async function runMerge(opts: MergeOptions): Promise<void> {
  await assertGitRepo();
  let branch = opts.branch;
  if (!branch) {
    const branches = await getBranches();
    if (branches.length === 0) {
      sayEmpty("No branches to merge.");
      return;
    }
    const choice = await pick({
      message: "Merge branch",
      options: branches.map((b) => ({ value: b, label: b })),
    });
    handleCancel(choice);
    branch = choice as string;
  } else {
    branch = requireFlag(branch, "branch");
  }

  if (!opts.yes && !(await confirmOrExit(`Merge ${pc.cyan(branch)} into current branch?`))) {
    return;
  }

  const args = ["merge"];
  if (opts.noFf) args.push("--no-ff");
  args.push(branch);
  await git(args);
  p.log.success(`Merged ${branch}`);
}

export async function runMergeInteractive(): Promise<void> {
  try {
    const noFf = await p.confirm({
      message: "Create a merge commit (--no-ff)?",
      initialValue: false,
    });
    handleCancel(noFf);
    await runMerge({ noFf: noFf as boolean });
  } catch (err) {
    printError(err);
  }
}
