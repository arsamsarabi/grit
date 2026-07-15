import * as p from "@clack/prompts";
import pc from "picocolors";
import { createRelease, isGhAvailable } from "@/gh/client.ts";
import { assertGitRepo, git } from "@/git/client.ts";
import { getLog } from "@/git/ops.ts";
import { confirmOrBack, isBack, printError, requireFlag, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type ReleaseOptions = {
  tag?: string;
  title?: string;
  notes?: string;
  yes?: boolean;
};

function notesFromCommits(subjects: string[]): string {
  return ["## Changes", ...subjects.map((s) => `- ${s}`)].join("\n");
}

export async function runRelease(opts: ReleaseOptions): Promise<void> {
  await assertGitRepo();
  if (!(await isGhAvailable())) {
    throw new Error("gh is required for release. Install: https://cli.github.com");
  }

  if (opts.tag && opts.yes) {
    const tag = requireFlag(opts.tag, "tag");
    const title = opts.title ?? tag;
    const notes = opts.notes ?? "";
    await tagAndRelease(tag, title, notes);
    return;
  }

  let tag = opts.tag;
  let title = opts.title;
  let notes = opts.notes;
  let i = 0;
  const steps = ["tag", "title", "notes", "confirm"] as const;

  while (i >= 0 && i < steps.length) {
    switch (steps[i]!) {
      case "tag": {
        if (opts.tag) {
          tag = opts.tag;
          i++;
          break;
        }
        const t = await textOrBack({
          message: "Tag (e.g. v0.1.0)",
          validate: (v) => (v?.trim() ? undefined : "Required"),
        });
        if (isBack(t)) return;
        tag = t;
        i++;
        break;
      }
      case "title": {
        if (opts.title) {
          title = opts.title;
          i++;
          break;
        }
        const t = await textOrBack({ message: "Release title", initialValue: tag });
        if (isBack(t)) {
          i--;
          if (i < 0) return;
          break;
        }
        title = t;
        i++;
        break;
      }
      case "notes": {
        if (opts.notes !== undefined) {
          notes = opts.notes;
          i++;
          break;
        }
        const commits = await withSpinner("Loading commits…", () => getLog(undefined, 30));
        const suggested =
          commits.length > 0 ? notesFromCommits(commits.map((c) => c.subject)) : "## Changes\n\n(no commits yet)";
        const n = await textOrBack({
          message: "Release notes",
          initialValue: suggested,
        });
        if (isBack(n)) {
          i--;
          break;
        }
        notes = n;
        i++;
        break;
      }
      case "confirm": {
        if (opts.yes) {
          i++;
          break;
        }
        const ok = await confirmOrBack(`Create git tag ${pc.cyan(tag!)} and GitHub release?`, true);
        if (isBack(ok)) {
          i--;
          break;
        }
        if (!ok) {
          p.log.info("Aborted.");
          return;
        }
        i++;
        break;
      }
    }
  }

  await tagAndRelease(tag!, title ?? tag!, notes ?? "");
}

async function tagAndRelease(tag: string, title: string, notes: string): Promise<void> {
  try {
    await git(["rev-parse", tag]);
    p.log.info(`Tag ${tag} already exists locally`);
  } catch {
    await withSpinner(`Creating tag ${tag}…`, async () => {
      await git(["tag", "-a", tag, "-m", title]);
      await git(["push", "origin", tag]);
    });
  }

  const url = await withSpinner("Creating GitHub release…", () => createRelease({ tag, title, notes }));
  p.log.success(url);
}

export async function runReleaseInteractive(): Promise<void> {
  try {
    await runRelease({});
  } catch (err) {
    printError(err);
  }
}
