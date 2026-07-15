import pc from "picocolors";
import { assertGitRepo } from "@/git/client.ts";
import { getLog } from "@/git/ops.ts";
import { isBack, pauseForContinue, printError, showNoteAndContinue, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type LogOptions = {
  count?: number;
  oneline?: boolean;
  pause?: boolean;
};

export async function runLog(opts: LogOptions): Promise<void> {
  await assertGitRepo();
  const count = opts.count ?? 20;
  const entries = await withSpinner("Loading log...", () => getLog(undefined, count));

  if (entries.length === 0) {
    if (opts.pause) {
      await showNoteAndContinue("Log", "No commits yet.");
    } else {
      console.log(pc.dim("No commits yet."));
    }
    return;
  }

  if (opts.oneline) {
    for (const e of entries) {
      console.log(`${pc.yellow(e.shortHash)} ${e.subject}`);
    }
  } else {
    for (const e of entries) {
      console.log(`${pc.yellow(e.shortHash)} ${e.subject}\n  ${pc.dim(`${e.author} · ${e.date}`)}`);
    }
  }

  if (opts.pause) await pauseForContinue();
}

export async function runLogInteractive(): Promise<void> {
  try {
    for (;;) {
      const n = await textOrBack({
        message: "How many commits?",
        initialValue: "20",
        validate: (v) => (/^\d+$/.test(v ?? "") ? undefined : "Enter a number"),
      });
      if (isBack(n)) return;
      await runLog({ count: Number(n), oneline: true, pause: true });
      return;
    }
  } catch (err) {
    printError(err);
  }
}
