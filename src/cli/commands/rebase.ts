import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig } from "@/config/loader.ts";
import { assertGitRepo, git } from "@/git/client.ts";
import { push } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, isBack, printError, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

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
    for (;;) {
      const choice = await pick({
        message: "Rebase onto",
        options: [
          { value: config.rebase.defaultUpstream, label: config.rebase.defaultUpstream },
          { value: "origin/main", label: "origin/main" },
          { value: "upstream/main", label: "upstream/main" },
          { value: "__custom__", label: "Custom…" },
        ],
      });
      if (isBack(choice)) return;
      if (choice === "__custom__") {
        const custom = await textOrBack({
          message: "Upstream ref",
          placeholder: "origin/develop",
          validate: (v) => (v?.trim() ? undefined : "Required"),
        });
        if (isBack(custom)) continue;
        onto = custom;
      } else {
        onto = choice as string;
      }
      break;
    }
  }

  const remote = onto.split("/")[0];
  if (remote === "origin" || remote === "upstream") {
    await withSpinner(`Fetching ${remote}…`, () => git(["fetch", remote]));
  }

  if (!opts.yes) {
    const ok = await confirmOrBack(`Rebase onto ${pc.cyan(onto)}?`, true);
    if (isBack(ok)) return;
    if (!ok) {
      p.log.info("Aborted.");
      return;
    }
  }

  const args = ["rebase"];
  if (opts.interactive) args.push("-i");
  args.push(onto);
  await withSpinner(`Rebasing onto ${onto}…`, () => git(args));
  p.log.success(`Rebased onto ${onto}`);

  let force = opts.forcePush;
  if (force === undefined) {
    if (opts.yes) {
      force = false;
    } else if (config.rebase.confirmForcePush) {
      const ok = await confirmOrBack("Force-push with lease to origin?", false);
      if (isBack(ok)) return;
      force = ok;
    } else {
      force = false;
    }
  }
  if (force) {
    await withSpinner("Force-pushing…", () => push({ force: true }));
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
