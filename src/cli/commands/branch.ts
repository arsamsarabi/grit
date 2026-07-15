import * as p from "@clack/prompts";
import pc from "picocolors";
import { renderBranchName, slugify } from "../../config/branch-template.ts";
import { loadConfig } from "../../config/loader.ts";
import { assertGitRepo } from "../../git/client.ts";
import { checkoutBranch, createBranch, deleteBranch, getBranches } from "../../git/ops.ts";
import { pick } from "../../tui/pick.ts";
import {
  confirmOrExit,
  handleCancel,
  printError,
  requireFlag,
  sayEmpty,
} from "../../tui/prompts.ts";

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
  const type = opts.type ?? (await pickType(config.branch.types));
  let ticket = opts.ticket;
  if (ticket === undefined && !opts.name && !flagged) {
    const t = await p.text({
      message: "Ticket id (optional, e.g. TRF-123)",
      placeholder: "TRF-123",
    });
    handleCancel(t);
    ticket = (t as string) || undefined;
  }

  let slug = opts.slug ?? opts.name;
  if (!slug) {
    const s = await p.text({
      message: "Branch slug / short name",
      placeholder: "add-login",
      validate: (v) => (v?.trim() ? undefined : "Required"),
    });
    handleCancel(s);
    slug = s as string;
  }

  // If --name provided as full branch name, use as-is
  const branchName = opts.name?.includes("/")
    ? opts.name
    : renderBranchName(config.branch.template, {
        type,
        ticket,
        slug: slugify(slug),
      });

  const skipConfirm = Boolean(opts.yes) || flagged;
  if (!skipConfirm && !(await confirmOrExit(`Create and checkout ${pc.cyan(branchName)}?`))) {
    return;
  }

  await createBranch(branchName);
  p.log.success(`On branch ${branchName}`);
}

async function pickType(types: string[]): Promise<string> {
  const choice = await pick({
    message: "Branch type",
    options: types.map((t) => ({ value: t, label: t })),
  });
  handleCancel(choice);
  return choice as string;
}

export async function branchCheckout(opts: { name?: string }): Promise<void> {
  await assertGitRepo();
  let name = opts.name;
  if (!name) {
    const branches = await getBranches(undefined, true);
    if (branches.length === 0) {
      sayEmpty("No branches to check out.");
      return;
    }
    const choice = await pick({
      message: "Checkout branch",
      options: branches.map((b) => ({ value: b, label: b })),
    });
    handleCancel(choice);
    name = choice as string;
  }
  await checkoutBranch(name);
  p.log.success(`Checked out ${name}`);
}

export async function branchDelete(opts: {
  name?: string;
  force?: boolean;
  yes?: boolean;
}): Promise<void> {
  await assertGitRepo();
  let name = opts.name;
  if (!name) {
    const branches = await getBranches();
    if (branches.length === 0) {
      sayEmpty("No branches to delete.");
      return;
    }
    const choice = await pick({
      message: "Delete branch",
      options: branches.map((b) => ({ value: b, label: b })),
    });
    handleCancel(choice);
    name = choice as string;
  }
  if (!opts.yes && !(await confirmOrExit(`Delete ${pc.red(name)}?`, false))) return;
  await deleteBranch(name, { force: opts.force });
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
  handleCancel(action);
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
  await branchNew({ ...opts, type, slug });
}
