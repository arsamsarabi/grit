import * as p from "@clack/prompts";
import { assertGitRepo } from "@/git/client.ts";
import { getLog, resetCommit } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, isBack, printError } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type ResetOptions = {
  mode?: "soft" | "mixed" | "hard";
  target?: string;
  yes?: boolean;
};

export async function runReset(opts: ResetOptions): Promise<void> {
  await assertGitRepo();

  let mode = opts.mode;
  let target = opts.target;

  if (!mode) {
    const result = await pick({
      message: "Reset mode",
      options: [
        { value: "soft", label: "Soft", hint: "Keep changes staged" },
        { value: "mixed", label: "Mixed", hint: "Keep changes unstaged (default)" },
        { value: "hard", label: "Hard", hint: "Discard all changes (dangerous)" },
      ],
    });

    if (isBack(result)) return;
    mode = result as "soft" | "mixed" | "hard";
  }

  if (!target) {
    const useDefault = await confirmOrBack("Reset to HEAD~1 (previous commit)?", true);
    if (isBack(useDefault)) return;

    if (!useDefault) {
      const log = await withSpinner("Loading recent commits…", () => getLog(undefined, 20));
      if (log.length === 0) {
        p.log.info("No commits found.");
        return;
      }

      const result = await pick({
        message: "Select target commit",
        options: log.map((entry) => ({
          value: entry.hash,
          label: `${entry.shortHash} ${entry.subject}`,
          hint: entry.author,
        })),
      });

      if (isBack(result)) return;
      target = result as string;
    }
  }

  const targetDesc = target || "HEAD~1";
  const modeDesc =
    mode === "hard" ? "and discard changes" : mode === "soft" ? "and keep changes staged" : "and keep changes unstaged";
  const message = `Reset to ${targetDesc} ${modeDesc}?`;

  const ok = opts.yes || (await confirmOrBack(message, false));
  if (isBack(ok)) return;
  if (!ok) {
    p.log.info("Aborted.");
    return;
  }

  await withSpinner("Resetting…", () => resetCommit({ mode, target }), { successMessage: "Reset complete" });
  p.log.success(`Reset to ${targetDesc} (${mode} mode)`);

  if (mode === "hard") {
    p.log.warning("All uncommitted changes have been discarded.");
  }
}

export async function runResetInteractive(): Promise<void> {
  try {
    await runReset({});
  } catch (err) {
    printError(err);
  }
}
