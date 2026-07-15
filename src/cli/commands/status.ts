import pc from "picocolors";
import { getPrForBranch, isGhAvailable } from "@/gh/client.ts";
import { assertGitRepo } from "@/git/client.ts";
import { getStatus, lastCommit } from "@/git/ops.ts";
import { printError } from "@/tui/prompts.ts";

export type StatusOptions = {
  json?: boolean;
};

export async function runStatus(opts: StatusOptions): Promise<void> {
  try {
    await assertGitRepo();
    const status = await getStatus();
    const last = await lastCommit();

    let pr: Awaited<ReturnType<typeof getPrForBranch>> = null;
    if (await isGhAvailable()) {
      pr = await getPrForBranch();
    }

    const payload = {
      branch: status.branch,
      upstream: status.upstream,
      ahead: status.ahead,
      behind: status.behind,
      clean: status.clean,
      staged: status.staged.map((f) => f.path),
      unstaged: status.unstaged.map((f) => f.path),
      untracked: status.untracked.map((f) => f.path),
      lastCommit: last ? { hash: last.shortHash, subject: last.subject, author: last.author } : null,
      pr: pr ? { number: pr.number, title: pr.title, url: pr.url, state: pr.state } : null,
    };

    if (opts.json) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    console.log(
      `${pc.bold("Branch")}  ${pc.cyan(status.branch)}${status.upstream ? pc.dim(` → ${status.upstream}`) : ""}`
    );
    if (status.ahead || status.behind) {
      console.log(`         ${pc.green(`↑${status.ahead}`)} ${pc.red(`↓${status.behind}`)}`);
    }
    console.log(
      `${pc.bold("Files")}   staged ${status.staged.length} · unstaged ${status.unstaged.length} · untracked ${status.untracked.length}`
    );
    if (last) {
      console.log(`${pc.bold("Last")}    ${pc.dim(last.shortHash)} ${last.subject}`);
    } else {
      console.log(`${pc.bold("Last")}    ${pc.dim("no commits yet")}`);
    }
    if (pr) {
      console.log(`${pc.bold("PR")}      #${pr.number} ${pr.title} ${pc.dim(`(${pr.state})`)}`);
      console.log(`         ${pc.underline(pr.url)}`);
    } else if (await isGhAvailable()) {
      console.log(`${pc.bold("PR")}      ${pc.dim("none open for this branch")}`);
    } else {
      console.log(`${pc.bold("PR")}      ${pc.dim("gh not available")}`);
    }
    if (status.clean) {
      console.log(pc.green("\nWorking tree clean."));
    } else {
      if (status.staged.length) {
        console.log(pc.bold("\nStaged"));
        for (const f of status.staged) console.log(`  ${pc.green(f.path)}`);
      }
      if (status.unstaged.length) {
        console.log(pc.bold("\nUnstaged"));
        for (const f of status.unstaged) console.log(`  ${pc.yellow(f.path)}`);
      }
      if (status.untracked.length) {
        console.log(pc.bold("\nUntracked"));
        for (const f of status.untracked) console.log(`  ${pc.red(f.path)}`);
      }
    }
  } catch (err) {
    printError(err);
    process.exitCode = 1;
  }
}
