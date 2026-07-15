import * as p from "@clack/prompts";
import pc from "picocolors";
import { assertGitRepo, git } from "@/git/client.ts";
import { getBranches } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, confirmOrExit, isBack, printError, requireFlag, showNoteAndContinue } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type MergeOptions = {
  branch?: string;
  noFf?: boolean;
  yes?: boolean;
};

export async function runMerge(opts: MergeOptions): Promise<void> {
  await assertGitRepo();
  let branch = opts.branch;
  let noFf = opts.noFf;

  if (!branch || noFf === undefined) {
    let i = branch ? 1 : 0;
    const steps = ["branch", "noFf", "confirm"] as const;
    while (i >= 0 && i < steps.length) {
      switch (steps[i]!) {
        case "branch": {
          if (opts.branch) {
            branch = opts.branch;
            i++;
            break;
          }
          const branches = await withSpinner("Loading branches...", () => getBranches());
          if (branches.length === 0) {
            await showNoteAndContinue("Merge", "No branches to merge.");
            return;
          }
          const choice = await pick({
            message: "Merge branch",
            options: branches.map((b) => ({ value: b, label: b })),
          });
          if (isBack(choice)) return;
          branch = choice as string;
          i++;
          break;
        }
        case "noFf": {
          if (opts.noFf !== undefined) {
            noFf = opts.noFf;
            i++;
            break;
          }
          const v = await confirmOrBack("Create a merge commit (--no-ff)?", false);
          if (isBack(v)) {
            i--;
            if (i < 0) return;
            break;
          }
          noFf = v;
          i++;
          break;
        }
        case "confirm": {
          if (opts.yes) {
            i++;
            break;
          }
          const ok = await confirmOrBack(`Merge ${pc.cyan(branch!)} into current branch?`, true);
          if (isBack(ok)) {
            i--;
            break;
          }
          if (!ok) {
            p.log.info("Aborted.");
            return;
          }
          i++;
          break;
        }
      }
    }
  } else {
    branch = requireFlag(branch, "branch");
    if (!opts.yes && !(await confirmOrExit(`Merge ${pc.cyan(branch)} into current branch?`))) {
      return;
    }
  }

  const args = ["merge"];
  if (noFf) args.push("--no-ff");
  args.push(branch!);
  await withSpinner(`Merging ${branch}…`, () => git(args));
  p.log.success(`Merged ${branch}`);
}

export async function runMergeInteractive(): Promise<void> {
  try {
    await runMerge({});
  } catch (err) {
    printError(err);
  }
}
