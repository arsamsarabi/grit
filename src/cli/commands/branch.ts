import * as p from "@clack/prompts";
import pc from "picocolors";
import { renderBranchName, slugify } from "@/config/branch-template.ts";
import { loadConfig } from "@/config/loader.ts";
import { assertGitRepo } from "@/git/client.ts";
import { checkoutBranch, createBranch, deleteBranch, getBranches } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, confirmOrExit, isBack, printError, requireFlag, sayEmpty, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type BranchNewOptions = {
  type?: string;
  ticket?: string;
  name?: string;
  slug?: string;
  yes?: boolean;
};

export async function branchNew(opts: BranchNewOptions): Promise<void> {
  await assertGitRepo();
  const config = loadConfig();
  const flagged = Boolean(opts.type && (opts.slug || opts.name));

  if (flagged || opts.yes) {
    const type = requireFlag(opts.type, "type");
    const slug = opts.slug ?? opts.name;
    if (!slug) throw new Error("Provide --slug or --name");
    const branchName = opts.name?.includes("/")
      ? opts.name
      : renderBranchName(config.branch.template, {
          type,
          ticket: opts.ticket,
          slug: slugify(slug),
        });
    await withSpinner(`Creating ${branchName}…`, () => createBranch(branchName));
    p.log.success(`On branch ${branchName}`);
    return;
  }

  const order = ["type", "ticket", "slug", "confirm"] as const;
  let i = 0;
  let type = opts.type;
  let ticket = opts.ticket;
  let slug = opts.slug ?? opts.name;

  while (i >= 0 && i < order.length) {
    switch (order[i]!) {
      case "type": {
        if (opts.type) {
          type = opts.type;
          i++;
          break;
        }
        const choice = await pick({
          message: "Branch type",
          options: config.branch.types.map((t) => ({ value: t, label: t })),
        });
        if (isBack(choice)) return;
        type = choice as string;
        i++;
        break;
      }
      case "ticket": {
        if (opts.name || opts.ticket !== undefined) {
          i++;
          break;
        }
        const t = await textOrBack({
          message: "Ticket id (optional, e.g. TRF-123)",
          placeholder: "TRF-123",
        });
        if (isBack(t)) {
          i--;
          if (i < 0) return;
          break;
        }
        ticket = t || undefined;
        i++;
        break;
      }
      case "slug": {
        if (opts.slug || opts.name) {
          slug = opts.slug ?? opts.name;
          i++;
          break;
        }
        const s = await textOrBack({
          message: "Branch slug / short name",
          placeholder: "add-login",
          validate: (v) => (v?.trim() ? undefined : "Required"),
        });
        if (isBack(s)) {
          i--;
          break;
        }
        slug = s;
        i++;
        break;
      }
      case "confirm": {
        const branchName = opts.name?.includes("/")
          ? opts.name
          : renderBranchName(config.branch.template, {
              type: requireFlag(type, "type"),
              ticket,
              slug: slugify(requireFlag(slug, "slug")),
            });
        const ok = await confirmOrBack(`Create and checkout ${pc.cyan(branchName)}?`, true);
        if (isBack(ok)) {
          i--;
          break;
        }
        if (!ok) {
          p.log.info("Aborted.");
          return;
        }
        await withSpinner(`Creating ${branchName}…`, () => createBranch(branchName));
        p.log.success(`On branch ${branchName}`);
        return;
      }
    }
  }
}

export async function branchCheckout(opts: { name?: string }): Promise<void> {
  await assertGitRepo();
  let name = opts.name;
  if (!name) {
    const branches = await withSpinner("Loading branches…", () => getBranches(undefined, true));
    if (branches.length === 0) {
      sayEmpty("No branches to check out.");
      return;
    }
    const choice = await pick({
      message: "Checkout branch",
      options: branches.map((b) => ({ value: b, label: b })),
    });
    if (isBack(choice)) return;
    name = choice as string;
  }
  await withSpinner(`Checking out ${name}…`, () => checkoutBranch(name!));
  p.log.success(`Checked out ${name}`);
}

export async function branchDelete(opts: { name?: string; force?: boolean; yes?: boolean }): Promise<void> {
  await assertGitRepo();
  let name = opts.name;
  if (!name) {
    const branches = await withSpinner("Loading branches…", () => getBranches());
    if (branches.length === 0) {
      sayEmpty("No branches to delete.");
      return;
    }
    for (;;) {
      const choice = await pick({
        message: "Delete branch",
        options: branches.map((b) => ({ value: b, label: b })),
      });
      if (isBack(choice)) return;
      name = choice as string;
      if (opts.yes) break;
      const ok = await confirmOrBack(`Delete ${pc.red(name)}?`, false);
      if (isBack(ok)) continue;
      if (!ok) {
        p.log.info("Aborted.");
        return;
      }
      break;
    }
  } else if (!opts.yes) {
    if (!(await confirmOrExit(`Delete ${pc.red(name)}?`, false))) return;
  }
  await withSpinner(`Deleting ${name}…`, () => deleteBranch(name!, { force: opts.force }));
  p.log.success(`Deleted ${name}`);
}

export async function runBranchInteractive(): Promise<void> {
  const action = await pick({
    message: "Branch",
    options: [
      { value: "new", label: "New branch" },
      { value: "checkout", label: "Checkout" },
      { value: "delete", label: "Delete" },
    ],
  });
  if (isBack(action)) return;
  try {
    if (action === "new") await branchNew({});
    else if (action === "checkout") await branchCheckout({});
    else await branchDelete({});
  } catch (err) {
    printError(err);
  }
}

export async function branchNewFromFlags(opts: BranchNewOptions): Promise<void> {
  const type = requireFlag(opts.type, "type");
  const slug = opts.slug ?? opts.name;
  if (!slug) throw new Error("Provide --slug or --name");
  await branchNew({ ...opts, type, slug, yes: true });
}
