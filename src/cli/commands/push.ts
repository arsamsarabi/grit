import * as p from "@clack/prompts";
import { assertGitRepo, currentBranch } from "@/git/client.ts";
import { getStatus, push } from "@/git/ops.ts";
import { confirmOrBack, isBack, printError } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type PushOptions = {
  force?: boolean;
  upstream?: boolean;
  yes?: boolean;
};

export async function runPush(opts: PushOptions): Promise<void> {
  await assertGitRepo();

  const branch = await currentBranch();
  const status = await withSpinner("Reading status…", () => getStatus());

  if (status.clean && status.ahead === 0) {
    p.log.info("Nothing to push — branch is up to date with remote.");
    return;
  }

  if (opts.yes) {
    await withSpinner("Pushing…", () => push({ force: opts.force, setUpstream: opts.upstream }), {
      successMessage: "Pushed",
    });
    p.log.success(`Pushed ${branch}`);
    return;
  }

  let message = `Push ${branch}`;
  if (status.ahead > 0) {
    message += ` (${status.ahead} commit${status.ahead > 1 ? "s" : ""})`;
  }
  if (opts.force) {
    message += " with force-with-lease";
  }
  message += "?";

  const ok = await confirmOrBack(message, true);
  if (isBack(ok)) return;
  if (!ok) {
    p.log.info("Aborted.");
    return;
  }

  await withSpinner("Pushing…", () => push({ force: opts.force, setUpstream: opts.upstream }), {
    successMessage: "Pushed",
  });
  p.log.success(`Pushed ${branch}`);
}

export async function runPushInteractive(): Promise<void> {
  try {
    await runPush({});
  } catch (err) {
    printError(err);
  }
}
