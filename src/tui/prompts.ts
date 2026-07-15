import * as p from "@clack/prompts";
import pc from "picocolors";

export function handleCancel(value: unknown): void {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }
}

/** Always acknowledge an empty result so the CLI never goes silent. */
export function sayEmpty(message: string): void {
  console.log(pc.dim(message));
}

export async function confirmOrExit(message: string, initialValue = true): Promise<boolean> {
  const ok = await p.confirm({ message, initialValue });
  handleCancel(ok);
  if (!ok) {
    p.log.info("Aborted.");
  }
  return ok as boolean;
}

export function printError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(pc.red(message));
}

export function requireFlag(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required flag: --${name}`);
  }
  return value;
}
