export type BranchParts = {
  type: string;
  ticket?: string;
  slug: string;
};

/** Render a branch name from a template like `{type}/{ticket}-{slug}`. */
export function renderBranchName(template: string, parts: BranchParts): string {
  const slug = slugify(parts.slug);
  let result = template
    .replaceAll("{type}", parts.type)
    .replaceAll("{slug}", slug)
    .replaceAll("{ticket}", parts.ticket?.trim() ?? "");

  // Collapse empty ticket segments: feat/-slug or feat/--slug → feat/slug
  result = result.replace(/\/-+/g, "/").replace(/-+$/g, "").replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");

  // Remove dangling separators from missing ticket: type/-slug already handled;
  // also type/TICKET- when slug empty shouldn't happen (caller validates slug).
  result = result.replace(/\/-/g, "/").replace(/-$/g, "");

  return result;
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractTicket(branchName: string, ticketPattern: string): string | undefined {
  try {
    const re = new RegExp(ticketPattern);
    const match = branchName.match(re);
    return match?.[0];
  } catch {
    return undefined;
  }
}
