import * as p from "@clack/prompts";
import pc from "picocolors";
import { createRelease, isGhAvailable } from "@/gh/client.ts";
import { assertGitRepo, git } from "@/git/client.ts";
import { getLog } from "@/git/ops.ts";
import { confirmOrExit, handleCancel, printError, requireFlag } from "@/tui/prompts.ts";

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

  let tag = opts.tag;
  if (!tag) {
    const t = await p.text({
      message: "Tag (e.g. v0.1.0)",
      validate: (v) => (v?.trim() ? undefined : "Required"),
    });
    handleCancel(t);
    tag = t as string;
  } else {
    tag = requireFlag(tag, "tag");
  }

  const title =
    opts.title ??
    (await (async () => {
      const t = await p.text({ message: "Release title", initialValue: tag });
      handleCancel(t);
      return t as string;
    })());

  let notes = opts.notes;
  if (!notes) {
    const commits = await getLog(undefined, 30);
    const suggested =
      commits.length > 0 ? notesFromCommits(commits.map((c) => c.subject)) : "## Changes\n\n(no commits yet)";
    const n = await p.text({
      message: "Release notes",
      initialValue: suggested,
    });
    handleCancel(n);
    notes = n as string;
  }

  if (!opts.yes && !(await confirmOrExit(`Create git tag ${pc.cyan(tag)} and GitHub release?`))) {
    return;
  }

  // Create annotated tag if missing
  try {
    await git(["rev-parse", tag]);
    p.log.info(`Tag ${tag} already exists locally`);
  } catch {
    await git(["tag", "-a", tag, "-m", title]);
    await git(["push", "origin", tag]);
  }

  const url = await createRelease({ tag, title, notes: notes ?? "" });
  p.log.success(url);
}

export async function runReleaseInteractive(): Promise<void> {
  try {
    await runRelease({});
  } catch (err) {
    printError(err);
  }
}
