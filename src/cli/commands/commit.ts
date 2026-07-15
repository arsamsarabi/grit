import * as p from "@clack/prompts";
import pc from "picocolors";
import { extractTicket } from "@/config/branch-template.ts";
import { formatCommitMessage } from "@/config/commit-message.ts";
import { loadConfig } from "@/config/loader.ts";
import { assertGitRepo, currentBranch } from "@/git/client.ts";
import { commit, getStatus, hasStagedChanges, push, stageAll } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrExit, handleCancel, printError, requireFlag } from "@/tui/prompts.ts";

export type CommitOptions = {
  all?: boolean;
  type?: string;
  scope?: string;
  message?: string;
  body?: string;
  push?: boolean;
  yes?: boolean;
};

export async function runCommit(opts: CommitOptions): Promise<void> {
  await assertGitRepo();
  const config = loadConfig();
  const status = await getStatus();
  const flagged = Boolean(opts.type && opts.message);

  let staged = await hasStagedChanges();
  if (!staged) {
    if (opts.all || opts.yes || flagged) {
      await stageAll();
      staged = true;
    } else if (
      status.unstaged.length + status.untracked.length > 0 &&
      (await confirmOrExit("Nothing staged. Stage all changes?", true))
    ) {
      await stageAll();
      staged = true;
    }
  }

  if (!(await hasStagedChanges())) {
    throw new Error("Nothing to commit.");
  }

  const type =
    opts.type ??
    ((await (async () => {
      const c = await pick({
        message: "Commit type",
        options: config.commit.types.map((t) => ({ value: t, label: t })),
      });
      handleCancel(c);
      return c as string;
    })()) as string);

  let scope = opts.scope;
  if (scope === undefined && !opts.message) {
    const s = await p.text({ message: "Scope (optional)", placeholder: "ui" });
    handleCancel(s);
    scope = (s as string) || undefined;
  }

  let summary = opts.message;
  if (!summary) {
    const s = await p.text({
      message: "Commit summary",
      validate: (v) => (v?.trim() ? undefined : "Required"),
    });
    handleCancel(s);
    summary = s as string;
  }

  let body = opts.body;
  if (body === undefined && !opts.message) {
    const branch = await currentBranch();
    const ticket = extractTicket(branch, config.branch.ticketPattern);
    const b = await p.text({
      message: "Body (optional)",
      placeholder: ticket ? `Refs ${ticket}` : undefined,
    });
    handleCancel(b);
    body = (b as string) || undefined;
  }

  const full = formatCommitMessage({
    type,
    scope,
    summary: requireFlag(summary, "message"),
    body,
    emojiEnabled: config.commit.emoji.enabled,
    emojiMap: config.commit.emoji.map,
  });

  p.log.info(pc.dim(full));
  if (!opts.yes && !flagged && !(await confirmOrExit("Create commit?"))) return;

  await commit(full);
  p.log.success("Committed");

  const shouldPush =
    opts.push === true ||
    (opts.push === undefined && !opts.yes && !flagged && (await confirmOrExit("Push to remote?", false)));

  if (shouldPush) {
    await push({ setUpstream: true });
    p.log.success("Pushed");
  }
}

export async function runCommitInteractive(): Promise<void> {
  try {
    await runCommit({});
  } catch (err) {
    printError(err);
  }
}
