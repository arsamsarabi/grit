#!/usr/bin/env bun
import { runCli } from "./cli/program.ts";
import { runMainMenu } from "./tui/menu.ts";
import { printError } from "./tui/prompts.ts";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // No args → interactive TUI
  if (args.length === 0) {
    await runMainMenu();
    return;
  }

  // Help/version still go through cac
  await runCli(process.argv);
}

main().catch((err) => {
  printError(err);
  process.exit(1);
});
