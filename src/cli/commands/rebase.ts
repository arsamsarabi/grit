import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig } from "../../config/loader.ts";
import { assertGitRepo, git } from "../../git/client.ts";
import { push } from "../../git/ops.ts";
import { pick } from "../../tui/pick.ts";
import { confirmOrExit, handleCancel, printError } from "../../tui/prompts.ts";

export type RebaseOptions = {
  onto?: string;
  forcePush?: boolean;
  interactive?: boolean;
  yes?: boolean;
};

export async function runRebase(opts: RebaseOptions): Promise<void> {
  await assertGitRepo();
  const config = loadConfig();

  let onto = opts.onto;
  if (!onto) {
    const choice = await pick({
      message: "Rebase onto",
      options: [
        { value: config.rebase.defaultUpstream, label: config.rebase.defaultUpstream },
        { value: "origin/main", label: "origin/main" },
        { value: "upstream/main", label: "upstream/main" },
        { value: "__custom__", label: "Custom…" },
      ],
    });
    handleCancel(choice);
    if (choice === "__custom__") {
      const custom = await p.text({
        message: "Upstream ref",
        placeholder: "origin/develop",
        validate: (v) => (v?.trim() ? undefined : "Required"),
      });
      handleCancel(custom);
      onto = custom as string;
    } else {
      onto = choice as string;
    }
  }

  const remote = onto.split("/")[0];
  if (remote === "origin" || remote === "upstream") {
    p.log.step(`Fetching ${remote}…`);
    await git(["fetch", remote]);
  }

  if (!opts.yes && !(await confirmOrExit(`Rebase onto ${pc.cyan(onto)}?`))) return;

  const args = ["rebase"];
  if (opts.interactive) {
    args.push("-i");
  }
  args.push(onto);
  await git(args);
  p.log.success(`Rebased onto ${onto}`);

  let force = opts.forcePush;
  if (force === undefined) {
    if (opts.yes) {
      force = false;
    } else if (config.rebase.confirmForcePush) {
      force = await confirmOrExit("Force-push with lease to origin?", false);
    } else {
      force = false;
    }
  }
  if (force) {
    await push({ force: true });
    p.log.success("Force-pushed (--force-with-lease)");
  }
}

export async function runRebaseInteractive(): Promise<void> {
  try {
    await runRebase({ interactive: false });
  } catch (err) {
    printError(err);
  }
}
