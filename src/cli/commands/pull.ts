import * as p from "@clack/prompts";
import { assertGitRepo, currentBranch } from "@/git/client.ts";
import { getStatus, pull } from "@/git/ops.ts";
import { confirmOrBack, isBack, printError } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type PullOptions = {
  rebase?: boolean;
  autostash?: boolean;
  yes?: boolean;
};

export async function runPull(opts: PullOptions): Promise<void> {
  await assertGitRepo();

  const branch = await currentBranch();
  const status = await withSpinner("Reading status…", () => getStatus());

  if (status.behind === 0) {
    p.log.info("Already up to date.");
    return;
  }

  if (opts.yes) {
    await withSpinner("Pulling…", () => pull({ rebase: opts.rebase, autostash: opts.autostash }), {
      successMessage: "Pulled",
    });
    p.log.success(`Updated ${branch}`);
    return;
  }

  let message = `Pull ${branch}`;
  if (status.behind > 0) {
    message += ` (${status.behind} commit${status.behind > 1 ? "s" : ""} behind)`;
  }
  if (opts.rebase) {
    message += " with rebase";
  }
  message += "?";

  const ok = await confirmOrBack(message, true);
  if (isBack(ok)) return;
  if (!ok) {
    p.log.info("Aborted.");
    return;
  }

  await withSpinner("Pulling…", () => pull({ rebase: opts.rebase, autostash: opts.autostash }), {
    successMessage: "Pulled",
  });
  p.log.success(`Updated ${branch}`);
}

export async function runPullInteractive(): Promise<void> {
  try {
    await runPull({});
  } catch (err) {
    printError(err);
  }
}
