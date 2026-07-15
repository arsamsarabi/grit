import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { extractTicket } from "@/config/branch-template.ts";
import { loadConfig } from "@/config/loader.ts";
import { createPr, getPrForBranch, isGhAvailable } from "@/gh/client.ts";
import { assertGitRepo, currentBranch } from "@/git/client.ts";
import { getLog } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, confirmOrExit, isBack, printError, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

function readPrTemplate(cwd: string): string {
  const candidates = [
    join(cwd, ".github", "PULL_REQUEST_TEMPLATE.md"),
    join(cwd, ".github", "pull_request_template.md"),
    join(cwd, "PULL_REQUEST_TEMPLATE.md"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return readFileSync(c, "utf8");
  }
  return "";
}

export type PrCreateOptions = {
  title?: string;
  body?: string;
  draft?: boolean;
  yes?: boolean;
};

export async function runPrCreate(opts: PrCreateOptions = {}): Promise<void> {
  await assertGitRepo();
  if (!(await isGhAvailable())) {
    throw new Error("gh is required for PR commands. Install: https://cli.github.com");
  }

  const config = loadConfig();
  const branch = await currentBranch();
  const commits = await withSpinner("Loading commits…", () => getLog(undefined, 10));
  const ticket = extractTicket(branch, config.branch.ticketPattern);

  if (opts.title && (opts.body !== undefined || opts.yes)) {
    const title = opts.title;
    const body = opts.body ?? "";
    if (!opts.yes && !(await confirmOrExit(`Create PR: ${pc.cyan(title)}?`))) return;
    const url = await withSpinner("Creating pull request…", () => createPr({ title, body, draft: opts.draft }));
    p.log.success(url);
    return;
  }

  let title = opts.title;
  let body = opts.body;
  let i = 0;
  const steps = ["title", "body", "confirm"] as const;
  while (i >= 0 && i < steps.length) {
    switch (steps[i]!) {
      case "title": {
        if (opts.title) {
          title = opts.title;
          i++;
          break;
        }
        const defaultTitle = commits[0]?.subject ?? branch;
        const t = await textOrBack({
          message: "PR title",
          initialValue: defaultTitle,
          validate: (v) => (v?.trim() ? undefined : "Required"),
        });
        if (isBack(t)) return;
        title = t;
        i++;
        break;
      }
      case "body": {
        if (opts.body !== undefined) {
          body = opts.body;
          i++;
          break;
        }
        const template = config.github.prTemplate ? readPrTemplate(process.cwd()) : "";
        const commitList = commits.map((c) => `- ${c.subject}`).join("\n");
        const defaultBody = [
          ticket ? `Refs ${ticket}` : "",
          template,
          "",
          "## Commits",
          commitList || "(no commits yet)",
        ]
          .filter(Boolean)
          .join("\n");
        const b = await textOrBack({
          message: "PR body",
          initialValue: defaultBody,
        });
        if (isBack(b)) {
          i--;
          if (i < 0) return;
          break;
        }
        body = b;
        i++;
        break;
      }
      case "confirm": {
        if (opts.yes) {
          i++;
          break;
        }
        const ok = await confirmOrBack(`Create PR: ${pc.cyan(title!)}?`, true);
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

  const url = await withSpinner("Creating pull request…", () =>
    createPr({ title: title!, body: body ?? "", draft: opts.draft })
  );
  p.log.success(url);
}

export async function runPrStatus(): Promise<void> {
  await assertGitRepo();
  if (!(await isGhAvailable())) {
    throw new Error("gh is required for PR commands.");
  }
  const pr = await withSpinner("Loading PR…", () => getPrForBranch());
  if (!pr) {
    console.log(pc.dim("No open PR for this branch."));
    return;
  }
  console.log(`#${pr.number} ${pr.title} (${pr.state})`);
  console.log(pr.url);
}

export async function runPrInteractive(): Promise<void> {
  try {
    const action = await pick({
      message: "Pull request",
      options: [
        { value: "create", label: "Create" },
        { value: "status", label: "Status" },
      ],
    });
    if (isBack(action)) return;
    if (action === "create") await runPrCreate({});
    else await runPrStatus();
  } catch (err) {
    printError(err);
  }
}
