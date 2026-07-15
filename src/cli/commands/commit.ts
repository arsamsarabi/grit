import * as p from "@clack/prompts";
import pc from "picocolors";
import { extractTicket } from "@/config/branch-template.ts";
import { formatCommitMessage } from "@/config/commit-message.ts";
import { loadConfig } from "@/config/loader.ts";
import { assertGitRepo, currentBranch } from "@/git/client.ts";
import { commit, getStatus, hasStagedChanges, push, stageAll } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, isBack, printError, requireFlag, showNoteAndContinue, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

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
  const flagged = Boolean(opts.type && opts.message);

  if (flagged || opts.yes) {
    await runCommitLinear(opts, config, flagged);
    return;
  }

  await runCommitStepped(opts, config);
}

async function runCommitLinear(
  opts: CommitOptions,
  config: ReturnType<typeof loadConfig>,
  flagged: boolean
): Promise<void> {
  await withSpinner("Reading status…", () => getStatus());
  if (!(await hasStagedChanges())) {
    if (opts.all || opts.yes || flagged) {
      await withSpinner("Staging all changes…", () => stageAll());
    }
  }
  if (!(await hasStagedChanges())) {
    throw new Error("Nothing to commit.");
  }

  const type = requireFlag(opts.type, "type");
  const summary = requireFlag(opts.message, "message");
  const full = formatCommitMessage({
    type,
    scope: opts.scope,
    summary,
    body: opts.body,
    emojiEnabled: config.commit.emoji.enabled,
    emojiMap: config.commit.emoji.map,
  });
  await withSpinner("Committing (hooks may run)…", () => commit(full), {
    successMessage: "Commit created",
  });
  p.log.success("Committed");
  if (opts.push) {
    await withSpinner("Pushing…", () => push({ setUpstream: true }), {
      successMessage: "Pushed",
    });
    p.log.success("Pushed");
  }
}

async function runCommitStepped(opts: CommitOptions, config: ReturnType<typeof loadConfig>): Promise<void> {
  const order = ["stage", "type", "scope", "summary", "body", "confirm", "push"] as const;
  let i = 0;
  let type = opts.type;
  let scope = opts.scope;
  let summary = opts.message;
  let body = opts.body;
  let full = "";

  while (i >= 0 && i < order.length) {
    const step = order[i]!;
    switch (step) {
      case "stage": {
        const status = await withSpinner("Reading status…", () => getStatus());
        if (!(await hasStagedChanges())) {
          if (opts.all) {
            await withSpinner("Staging all changes…", () => stageAll());
          } else if (status.unstaged.length + status.untracked.length > 0) {
            const ok = await confirmOrBack("Nothing staged. Stage all changes?", true);
            if (isBack(ok)) return;
            if (!ok) {
              p.log.info("Aborted.");
              return;
            }
            await withSpinner("Staging all changes…", () => stageAll());
          }
        }
        if (!(await hasStagedChanges())) {
          await showNoteAndContinue("Commit", "Nothing to commit.");
          return;
        }
        i++;
        break;
      }
      case "type": {
        if (opts.type) {
          type = opts.type;
          i++;
          break;
        }
        const c = await pick({
          message: "Commit type",
          options: config.commit.types.map((t) => ({ value: t, label: t })),
        });
        if (isBack(c)) {
          i--;
          if (i < 0) return;
          break;
        }
        type = c as string;
        i++;
        break;
      }
      case "scope": {
        if (opts.message !== undefined && opts.scope !== undefined) {
          i++;
          break;
        }
        if (opts.message) {
          // flagged summary path skips optional scope when provided via flags only
        }
        const s = await textOrBack({ message: "Scope (optional)", placeholder: "ui" });
        if (isBack(s)) {
          i--;
          break;
        }
        scope = s || undefined;
        i++;
        break;
      }
      case "summary": {
        if (opts.message) {
          summary = opts.message;
          i++;
          break;
        }
        const s = await textOrBack({
          message: "Commit summary",
          validate: (v) => (v?.trim() ? undefined : "Required"),
        });
        if (isBack(s)) {
          i--;
          break;
        }
        summary = s;
        i++;
        break;
      }
      case "body": {
        if (opts.body !== undefined) {
          body = opts.body;
          i++;
          break;
        }
        const branch = await currentBranch();
        const ticket = extractTicket(branch, config.branch.ticketPattern);
        const b = await textOrBack({
          message: "Body (optional)",
          placeholder: ticket ? `Refs ${ticket}` : undefined,
        });
        if (isBack(b)) {
          i--;
          break;
        }
        body = b || undefined;
        i++;
        break;
      }
      case "confirm": {
        full = formatCommitMessage({
          type: requireFlag(type, "type"),
          scope,
          summary: requireFlag(summary, "message"),
          body,
          emojiEnabled: config.commit.emoji.enabled,
          emojiMap: config.commit.emoji.map,
        });
        p.log.info(pc.dim(full));
        const ok = await confirmOrBack("Create commit?", true);
        if (isBack(ok)) {
          i--;
          break;
        }
        if (!ok) {
          p.log.info("Aborted.");
          return;
        }
        await withSpinner("Committing (hooks may run)…", () => commit(full), {
          successMessage: "Commit created",
        });
        p.log.success("Committed");
        i++;
        break;
      }
      case "push": {
        if (opts.push === true) {
          await withSpinner("Pushing…", () => push({ setUpstream: true }), {
            successMessage: "Pushed",
          });
          p.log.success("Pushed");
          return;
        }
        if (opts.push === false) return;
        const ok = await confirmOrBack("Push to remote?", false);
        if (isBack(ok)) {
          i--;
          break;
        }
        if (ok) {
          await withSpinner("Pushing…", () => push({ setUpstream: true }), {
            successMessage: "Pushed",
          });
          p.log.success("Pushed");
        }
        return;
      }
    }
  }
}

export async function runCommitInteractive(): Promise<void> {
  try {
    await runCommit({});
  } catch (err) {
    printError(err);
  }
}
