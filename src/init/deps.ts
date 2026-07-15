import { which } from "bun";

export type DepStatus = {
  name: string;
  required: boolean;
  available: boolean;
  path: string | null;
};

export async function checkDeps(): Promise<{
  git: DepStatus;
  gh: DepStatus;
  ok: boolean;
}> {
  const gitPath = which("git") ?? null;
  const ghPath = which("gh") ?? null;
  const git: DepStatus = {
    name: "git",
    required: true,
    available: Boolean(gitPath),
    path: gitPath,
  };
  const gh: DepStatus = {
    name: "gh",
    required: false,
    available: Boolean(ghPath),
    path: ghPath,
  };
  return { git, gh, ok: git.available };
}
