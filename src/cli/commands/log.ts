import * as p from "@clack/prompts";
import pc from "picocolors";
import { assertGitRepo } from "@/git/client.ts";
import { getLog } from "@/git/ops.ts";
import { handleCancel, printError, sayEmpty } from "@/tui/prompts.ts";

export type LogOptions = {
  count?: number;
  oneline?: boolean;
};

export async function runLog(opts: LogOptions): Promise<void> {
  await assertGitRepo();
  const count = opts.count ?? 20;
  const entries = await getLog(undefined, count);

  if (entries.length === 0) {
    sayEmpty("No commits yet.");
    return;
  }

  if (opts.oneline) {
    for (const e of entries) {
      console.log(`${pc.yellow(e.shortHash)} ${e.subject}`);
    }
    return;
  }

  for (const e of entries) {
    console.log(`${pc.yellow(e.shortHash)} ${e.subject}\n  ${pc.dim(`${e.author} · ${e.date}`)}`);
  }
}

export async function runLogInteractive(): Promise<void> {
  try {
    const n = await p.text({
      message: "How many commits?",
      initialValue: "20",
      validate: (v) => (/^\d+$/.test(v ?? "") ? undefined : "Enter a number"),
    });
    handleCancel(n);
    await runLog({ count: Number(n), oneline: true });
  } catch (err) {
    printError(err);
  }
}
