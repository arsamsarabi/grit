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
import { confirmOrExit, handleCancel, printError } from "@/tui/prompts.ts";

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
  const commits = await getLog(undefined, 10);
  const ticket = extractTicket(branch, config.branch.ticketPattern);

  let title = opts.title;
  if (!title) {
    const defaultTitle = commits[0]?.subject ?? branch;
    const t = await p.text({
      message: "PR title",
      initialValue: defaultTitle,
      validate: (v) => (v?.trim() ? undefined : "Required"),
    });
    handleCancel(t);
    title = t as string;
  }

  let body = opts.body;
  if (!body) {
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

    const b = await p.text({
      message: "PR body",
      initialValue: defaultBody,
    });
    handleCancel(b);
    body = b as string;
  }

  if (!opts.yes && !(await confirmOrExit(`Create PR: ${pc.cyan(title)}?`))) return;
  const url = await createPr({
    title,
    body: body ?? "",
    draft: opts.draft,
  });
  p.log.success(url);
}

export async function runPrStatus(): Promise<void> {
  await assertGitRepo();
  if (!(await isGhAvailable())) {
    throw new Error("gh is required for PR commands.");
  }
  const pr = await getPrForBranch();
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
    handleCancel(action);
    if (action === "create") await runPrCreate({});
    else await runPrStatus();
  } catch (err) {
    printError(err);
  }
}
