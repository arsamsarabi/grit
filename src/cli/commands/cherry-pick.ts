import * as p from "@clack/prompts";
import pc from "picocolors";
import { assertGitRepo, git } from "../../git/client.ts";
import { getLog } from "../../git/ops.ts";
import {
  confirmOrExit,
  handleCancel,
  printError,
  requireFlag,
  sayEmpty,
} from "../../tui/prompts.ts";

export type CherryPickOptions = {
  hash?: string;
  yes?: boolean;
};

export async function runCherryPick(opts: CherryPickOptions): Promise<void> {
  await assertGitRepo();
  let hash = opts.hash;
  if (!hash) {
    const entries = await getLog(undefined, 30);
    if (entries.length === 0) {
      sayEmpty("No commits to cherry-pick.");
      return;
    }
    const choice = await p.select({
      message: "Cherry-pick commit",
      options: entries.map((e) => ({
        value: e.hash,
        label: `${e.shortHash} ${e.subject}`,
      })),
    });
    handleCancel(choice);
    hash = choice as string;
  } else {
    hash = requireFlag(hash, "hash");
  }

  if (!opts.yes && !(await confirmOrExit(`Cherry-pick ${pc.cyan(hash.slice(0, 7))}?`))) {
    return;
  }
  await git(["cherry-pick", hash]);
  p.log.success("Cherry-picked");
}

export async function runCherryPickInteractive(): Promise<void> {
  try {
    await runCherryPick({});
  } catch (err) {
    printError(err);
  }
}
