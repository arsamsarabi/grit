import { assertGitRepo } from "@/git/client.ts";
import { getDiff } from "@/git/ops.ts";
import { printError, sayEmpty } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type DiffOptions = {
  cached?: boolean;
  staged?: boolean;
  stat?: boolean;
};

export async function runDiff(opts: DiffOptions): Promise<void> {
  await assertGitRepo();

  const cached = opts.cached || opts.staged;
  const diff = await withSpinner(cached ? "Loading staged changes…" : "Loading changes…", () =>
    getDiff({ cached, stat: opts.stat })
  );

  if (!diff.trim()) {
    if (cached) {
      sayEmpty("No staged changes.");
    } else {
      sayEmpty("No changes.");
    }
    return;
  }

  console.log(diff);
}

export async function runDiffInteractive(): Promise<void> {
  try {
    await runDiff({});
  } catch (err) {
    printError(err);
  }
}
