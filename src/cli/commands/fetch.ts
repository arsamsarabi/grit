import * as p from "@clack/prompts";
import { assertGitRepo } from "@/git/client.ts";
import { fetch } from "@/git/ops.ts";
import { confirmOrBack, isBack, printError } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type FetchOptions = {
  all?: boolean;
  prune?: boolean;
  remote?: string;
  yes?: boolean;
};

export async function runFetch(opts: FetchOptions): Promise<void> {
  await assertGitRepo();

  if (opts.yes) {
    await withSpinner("Fetching…", () => fetch({ all: opts.all, prune: opts.prune, remote: opts.remote }), {
      successMessage: "Fetched",
    });
    p.log.success("Fetch complete");
    return;
  }

  let message = "Fetch from remote";
  if (opts.remote) {
    message += ` (${opts.remote})`;
  } else if (opts.all) {
    message += "s (all)";
  }
  if (opts.prune) {
    message += " and prune deleted branches";
  }
  message += "?";

  const ok = await confirmOrBack(message, true);
  if (isBack(ok)) return;
  if (!ok) {
    p.log.info("Aborted.");
    return;
  }

  await withSpinner("Fetching…", () => fetch({ all: opts.all, prune: opts.prune, remote: opts.remote }), {
    successMessage: "Fetched",
  });
  p.log.success("Fetch complete");
}

export async function runFetchInteractive(): Promise<void> {
  try {
    await runFetch({});
  } catch (err) {
    printError(err);
  }
}
