import * as p from "@clack/prompts";
import { assertGitRepo, git } from "@/git/client.ts";
import { pick } from "@/tui/pick.ts";
import { isBack, printError, showNoteAndContinue, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export async function stashPush(message?: string): Promise<"empty" | "ok"> {
  await assertGitRepo();
  const args = ["stash", "push"];
  if (message) args.push("-m", message);
  const out = await withSpinner("Stashing...", () => git(args));
  if (/no local changes/i.test(out)) {
    return "empty";
  }
  p.log.success("Stashed");
  return "ok";
}

export async function stashPop(): Promise<void> {
  await assertGitRepo();
  await withSpinner("Popping stash…", () => git(["stash", "pop"]));
  p.log.success("Stash popped");
}

export async function stashApply(): Promise<void> {
  await assertGitRepo();
  await withSpinner("Applying stash…", () => git(["stash", "apply"]));
  p.log.success("Stash applied");
}

export async function stashList(): Promise<string> {
  await assertGitRepo();
  return (await withSpinner("Listing stashes...", () => git(["stash", "list"]))).trim();
}

export async function runStashInteractive(): Promise<void> {
  try {
    for (;;) {
      const action = await pick({
        message: "Stash",
        options: [
          { value: "push", label: "Save (push)" },
          { value: "pop", label: "Pop" },
          { value: "apply", label: "Apply" },
          { value: "list", label: "List" },
        ],
      });
      if (isBack(action)) return;

      if (action === "push") {
        const msg = await textOrBack({ message: "Message (optional)" });
        if (isBack(msg)) continue;
        const result = await stashPush(msg || undefined);
        if (result === "empty") {
          await showNoteAndContinue("Stash", "Nothing to stash — working tree is clean.");
        }
        continue;
      }
      if (action === "pop") {
        await stashPop();
        continue;
      }
      if (action === "apply") {
        await stashApply();
        continue;
      }
      const out = await stashList();
      if (!out) {
        await showNoteAndContinue("Stashes", "No stashes.");
      } else {
        await showNoteAndContinue("Stashes", out);
      }
    }
  } catch (err) {
    printError(err);
  }
}
