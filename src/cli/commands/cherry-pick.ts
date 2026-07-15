import * as p from "@clack/prompts";
import pc from "picocolors";
import { assertGitRepo, git } from "@/git/client.ts";
import { getLog } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, confirmOrExit, isBack, printError, requireFlag, sayEmpty } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type CherryPickOptions = {
  hash?: string;
  yes?: boolean;
};

export async function runCherryPick(opts: CherryPickOptions): Promise<void> {
  await assertGitRepo();
  let hash = opts.hash;

  if (!hash) {
    for (;;) {
      const entries = await withSpinner("Loading commits…", () => getLog(undefined, 30));
      if (entries.length === 0) {
        sayEmpty("No commits to cherry-pick.");
        return;
      }
      const choice = await pick({
        message: "Cherry-pick commit",
        options: entries.map((e) => ({
          value: e.hash,
          label: `${e.shortHash} ${e.subject}`,
        })),
      });
      if (isBack(choice)) return;
      hash = choice as string;
      if (opts.yes) break;
      const ok = await confirmOrBack(`Cherry-pick ${pc.cyan(hash.slice(0, 7))}?`, true);
      if (isBack(ok)) continue;
      if (!ok) {
        p.log.info("Aborted.");
        return;
      }
      break;
    }
  } else {
    hash = requireFlag(hash, "hash");
    if (!opts.yes && !(await confirmOrExit(`Cherry-pick ${pc.cyan(hash.slice(0, 7))}?`))) {
      return;
    }
  }

  await withSpinner("Cherry-picking…", () => git(["cherry-pick", hash!]));
  p.log.success("Cherry-picked");
}

export async function runCherryPickInteractive(): Promise<void> {
  try {
    await runCherryPick({});
  } catch (err) {
    printError(err);
  }
}
