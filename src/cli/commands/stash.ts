import * as p from "@clack/prompts";
import { assertGitRepo, git } from "@/git/client.ts";
import { pick } from "@/tui/pick.ts";
import { handleCancel, printError, sayEmpty } from "@/tui/prompts.ts";

export async function stashPush(message?: string): Promise<void> {
  await assertGitRepo();
  const args = ["stash", "push"];
  if (message) args.push("-m", message);
  const out = await git(args);
  // git stash push with nothing to stash exits 0 and prints "No local changes to save"
  if (/no local changes/i.test(out)) {
    sayEmpty("Nothing to stash — working tree is clean.");
    return;
  }
  p.log.success("Stashed");
}

export async function stashPop(): Promise<void> {
  await assertGitRepo();
  await git(["stash", "pop"]);
  p.log.success("Stash popped");
}

export async function stashApply(): Promise<void> {
  await assertGitRepo();
  await git(["stash", "apply"]);
  p.log.success("Stash applied");
}

export async function stashList(): Promise<void> {
  await assertGitRepo();
  const out = await git(["stash", "list"]);
  if (!out.trim()) {
    sayEmpty("No stashes.");
    return;
  }
  console.log(out);
}

export async function runStashInteractive(): Promise<void> {
  try {
    const action = await pick({
      message: "Stash",
      options: [
        { value: "push", label: "Save (push)" },
        { value: "pop", label: "Pop" },
        { value: "apply", label: "Apply" },
        { value: "list", label: "List" },
      ],
    });
    handleCancel(action);
    if (action === "push") {
      const msg = await p.text({ message: "Message (optional)" });
      handleCancel(msg);
      await stashPush((msg as string) || undefined);
    } else if (action === "pop") await stashPop();
    else if (action === "apply") await stashApply();
    else await stashList();
  } catch (err) {
    printError(err);
  }
}
