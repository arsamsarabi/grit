import * as p from "@clack/prompts";
import pc from "picocolors";
import { BACK, isBack, type Back } from "@/tui/nav.ts";
import { pick } from "@/tui/pick.ts";

export function handleCancel(value: unknown): void {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }
}

/** Exit grit from the main menu (Esc / cancel). */
export function exitOnCancel(value: unknown): void {
  handleCancel(value);
}

/** Always acknowledge an empty result so the CLI never goes silent. */
export function sayEmpty(message: string): void {
  console.log(pc.dim(message));
}

/** Show a persistent note, then wait for Enter (Continue) so the user can read it. */
export async function showNoteAndContinue(title: string, body: string): Promise<void> {
  p.note(body, title);
  await pauseForContinue();
}

/** Pause after scrolled output (status/log) so the main menu doesn’t flash back. */
export async function pauseForContinue(message = "Continue"): Promise<void> {
  await pick({
    message,
    options: [{ value: "ok", label: "OK" }],
    back: false,
  });
}

/**
 * Confirm that supports Back: Esc → BACK; false → aborted (not back).
 * Returns true | false | BACK.
 */
export async function confirmOrBack(message: string, initialValue = true): Promise<boolean | Back> {
  const ok = await p.confirm({ message, initialValue });
  if (p.isCancel(ok)) return BACK;
  return ok as boolean;
}

/** Legacy: cancel exits process. Prefer `confirmOrBack` in interactive flows. */
export async function confirmOrExit(message: string, initialValue = true): Promise<boolean> {
  const ok = await p.confirm({ message, initialValue });
  handleCancel(ok);
  if (!ok) {
    p.log.info("Aborted.");
  }
  return ok as boolean;
}

export async function textOrBack(opts: {
  message: string;
  placeholder?: string;
  initialValue?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
}): Promise<string | Back> {
  const value = await p.text(opts);
  if (p.isCancel(value)) return BACK;
  return value as string;
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

export { BACK, isBack };
