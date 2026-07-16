import * as p from "@clack/prompts";
import { assertGitRepo } from "@/git/client.ts";
import { createTag, deleteTag, getTags, pushTags } from "@/git/ops.ts";
import { pick } from "@/tui/pick.ts";
import { confirmOrBack, isBack, printError, textOrBack } from "@/tui/prompts.ts";
import { withSpinner } from "@/tui/spinner.ts";

export type TagListOptions = Record<string, never>;

export async function tagList(_opts: TagListOptions): Promise<void> {
  await assertGitRepo();
  const tags = await withSpinner("Loading tags…", () => getTags());

  if (tags.length === 0) {
    p.log.info("No tags found.");
    return;
  }

  console.log(tags.join("\n"));
}

export type TagCreateOptions = {
  name?: string;
  message?: string;
  annotated?: boolean;
  push?: boolean;
  yes?: boolean;
};

export async function tagCreate(opts: TagCreateOptions): Promise<void> {
  await assertGitRepo();

  let name = opts.name;
  let message = opts.message;
  let annotated = opts.annotated;

  if (!name) {
    const n = await textOrBack({
      message: "Tag name",
      placeholder: "v1.0.0",
      validate: (v) => (v?.trim() ? undefined : "Required"),
    });
    if (isBack(n)) return;
    name = n;
  }

  if (!message && !annotated) {
    const createAnnotated = await confirmOrBack("Create annotated tag?", true);
    if (isBack(createAnnotated)) return;
    annotated = createAnnotated;
  }

  if (annotated && !message) {
    const m = await textOrBack({
      message: "Tag message",
      placeholder: "Release v1.0.0",
    });
    if (isBack(m)) return;
    message = m || undefined;
  }

  const ok = opts.yes || (await confirmOrBack(`Create tag ${name}?`, true));
  if (isBack(ok)) return;
  if (!ok) {
    p.log.info("Aborted.");
    return;
  }

  await withSpinner("Creating tag…", () => createTag(name!, { message, annotated }), { successMessage: "Tag created" });
  p.log.success(`Created tag ${name}`);

  if (opts.push) {
    const pushOk = await confirmOrBack("Push tags to remote?", true);
    if (isBack(pushOk)) return;
    if (pushOk) {
      await withSpinner("Pushing tags…", () => pushTags(), { successMessage: "Pushed" });
      p.log.success("Tags pushed");
    }
  }
}

export type TagDeleteOptions = {
  name?: string;
  remote?: boolean;
  yes?: boolean;
};

export async function tagDelete(opts: TagDeleteOptions): Promise<void> {
  await assertGitRepo();

  let name = opts.name;

  if (!name) {
    const tags = await withSpinner("Loading tags…", () => getTags());
    if (tags.length === 0) {
      p.log.info("No tags to delete.");
      return;
    }

    const result = await pick({
      message: "Select tag to delete",
      options: tags.map((t) => ({ value: t, label: t })),
    });

    if (isBack(result)) return;
    name = result as string;
  }

  let message = `Delete tag ${name}`;
  if (opts.remote) {
    message += " (local and remote)";
  }
  message += "?";

  const ok = opts.yes || (await confirmOrBack(message, false));
  if (isBack(ok)) return;
  if (!ok) {
    p.log.info("Aborted.");
    return;
  }

  await withSpinner("Deleting tag…", () => deleteTag(name!, { remote: opts.remote }), {
    successMessage: "Tag deleted",
  });
  p.log.success(`Deleted tag ${name}`);
}

export async function tagListInteractive(): Promise<void> {
  try {
    await tagList({});
  } catch (err) {
    printError(err);
  }
}

export async function tagCreateInteractive(): Promise<void> {
  try {
    await tagCreate({});
  } catch (err) {
    printError(err);
  }
}

export async function tagDeleteInteractive(): Promise<void> {
  try {
    await tagDelete({});
  } catch (err) {
    printError(err);
  }
}

export async function runTagInteractive(): Promise<void> {
  const action = await pick({
    message: "Tag action",
    options: [
      { value: "list", label: "List tags" },
      { value: "create", label: "Create tag" },
      { value: "delete", label: "Delete tag" },
    ],
  });

  if (isBack(action)) return;

  switch (action) {
    case "list":
      await tagListInteractive();
      break;
    case "create":
      await tagCreateInteractive();
      break;
    case "delete":
      await tagDeleteInteractive();
      break;
  }
}
