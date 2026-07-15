import * as p from "@clack/prompts";
import { assertGitRepo, git } from "@/git/client.ts";
import { pick } from "@/tui/pick.ts";
import { isBack, printError, sayEmpty, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export async function stashPush(message?: string): Promise<void> {
  await assertGitRepo();
  const args = ["stash", "push"];
  if (message) args.push("-m", message);
  const out = await withSpinner("Stashing…", () => git(args));
  if (/no local changes/i.test(out)) {
    sayEmpty("Nothing to stash — working tree is clean.");
    return;
  }
  p.log.success("Stashed");
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

export async function stashList(): Promise<void> {
  await assertGitRepo();
  const out = await withSpinner("Listing stashes…", () => git(["stash", "list"]));
  if (!out.trim()) {
    sayEmpty("No stashes.");
    return;
  }
  console.log(out);
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
        await stashPush(msg || undefined);
        return;
      }
      if (action === "pop") {
        await stashPop();
        return;
      }
      if (action === "apply") {
        await stashApply();
        return;
      }
      await stashList();
      return;
    }
  } catch (err) {
    printError(err);
  }
}
