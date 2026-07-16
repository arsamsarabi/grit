import * as p from "@clack/prompts";
import { assertGitRepo } from "@/git/client.ts";
import { getLog, resetCommit, revertCommit } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, isBack, printError } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type RevertOptions = {
  hash?: string;
  unpushed?: boolean;
  yes?: boolean;
};

export async function runRevert(opts: RevertOptions): Promise<void> {
  await assertGitRepo();

  let hash = opts.hash;

  if (!hash) {
    const log = await withSpinner("Loading recent commits…", () => getLog(undefined, 20));
    if (log.length === 0) {
      p.log.info("No commits to revert.");
      return;
    }

    const result = await pick({
      message: "Select commit to revert",
      options: log.map((entry) => ({
        value: entry.hash,
        label: `${entry.shortHash} ${entry.subject}`,
        hint: entry.author,
      })),
    });

    if (isBack(result)) return;
    hash = result as string;
  }

  if (!hash) {
    throw new Error("Missing commit hash");
  }

  const shortHash = hash.slice(0, 7);

  if (opts.unpushed) {
    const message = `Reset to before ${shortHash}? (This will undo the commit but keep changes)`;
    const ok = opts.yes || (await confirmOrBack(message, false));
    if (isBack(ok)) return;
    if (!ok) {
      p.log.info("Aborted.");
      return;
    }

    await withSpinner("Resetting…", () => resetCommit({ mode: "soft", target: `${hash}~1` }), {
      successMessage: "Reset complete",
    });
    p.log.success(`Reset to before ${shortHash} (changes kept)`);
    return;
  }

  const message = `Revert commit ${shortHash}? (Creates a new revert commit)`;
  const ok = opts.yes || (await confirmOrBack(message, true));
  if (isBack(ok)) return;
  if (!ok) {
    p.log.info("Aborted.");
    return;
  }

  await withSpinner("Reverting…", () => revertCommit(hash), { successMessage: "Revert complete" });
  p.log.success(`Reverted ${shortHash}`);
}

export async function runRevertInteractive(): Promise<void> {
  try {
    await runRevert({});
  } catch (err) {
    printError(err);
  }
}
