import * as p from "@clack/prompts";
import pc from "picocolors";
import { ALIAS_CANDIDATES, DEFAULT_EMOJI_MAP, defaultConfig } from "@/config/defaults.ts";
import { writeGlobalConfig } from "@/config/loader.ts";
import type { GritConfigInput } from "@/config/schema.ts";
import { detectShellRc, probeAlias, probeAliasCandidates, resolveBinaryPath, upsertAliasInRc } from "@/init/alias.ts";
import { checkDeps } from "@/init/deps.ts";
import { pick } from "@/tui/pick.ts";

export type InitOptions = {
  yes?: boolean;
};

function cancelIfNeeded(value: unknown): asserts value is string | boolean {
  if (p.isCancel(value)) {
    p.cancel("Init cancelled.");
    process.exit(0);
  }
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" grit init ")));
  p.log.step("Grit is an opinionated Git assistant. Let's set up your machine.");

  const deps = await checkDeps();
  if (!deps.git.available) {
    p.log.error("git is required but was not found on PATH.");
    p.outro("Install git, then re-run: arsams-grit init");
    process.exit(1);
  }
  p.log.success(`git found${deps.git.path ? ` (${deps.git.path})` : ""}`);
  if (deps.gh.available) {
    p.log.success(`gh found${deps.gh.path ? ` (${deps.gh.path})` : ""}`);
  } else {
    p.log.warn(
      "gh (GitHub CLI) not found. PR/release features will be unavailable until you install it: https://cli.github.com"
    );
  }

  let alias = "grit";
  let writeShell = false;
  let config: GritConfigInput = { ...defaultConfig, alias };

  if (options.yes) {
    const gritProbe = await probeAlias("grit");
    if (!gritProbe.free) {
      const gProbe = await probeAlias("g");
      alias = gProbe.free ? "g" : "arsams-grit";
    }
    config = {
      ...defaultConfig,
      alias,
      commit: {
        emoji: { enabled: false, map: DEFAULT_EMOJI_MAP },
      },
    };
    writeGlobalConfig(config);
    p.log.info(`Wrote global config with alias "${alias}" (--yes mode skips shell RC edit).`);
    p.outro(`Done. Run ${pc.cyan("arsams-grit --help")} or add alias manually.`);
    return;
  }

  const probes = await probeAliasCandidates();
  const freePreferred = probes.find((x) => x.name === "grit" && x.free);
  const occupied = probes.filter((x) => !x.free);

  if (occupied.length) {
    for (const o of occupied) {
      p.log.warn(`\`${o.name}\` is already on PATH (${o.ownerHint ?? "unknown"})`);
    }
  }

  const aliasChoice = await pick({
    message: "Choose a shell alias for grit",
    options: [
      ...ALIAS_CANDIDATES.map((name) => {
        const probe = probes.find((x) => x.name === name);
        const free = probe?.free ?? true;
        return {
          value: name,
          label: name,
          hint: free ? "available" : `conflict: ${probe?.ownerHint ?? "taken"}`,
        };
      }),
      { value: "__custom__", label: "Custom alias…" },
      { value: "__skip__", label: "Skip alias (use arsams-grit)" },
    ],
    initialValue: freePreferred ? "grit" : "g",
  });
  cancelIfNeeded(aliasChoice);

  if (aliasChoice === "__custom__") {
    const custom = await p.text({
      message: "Alias name",
      placeholder: "mygrit",
      validate: (v) => (v && /^[a-zA-Z][\w-]*$/.test(v) ? undefined : "Invalid alias"),
    });
    cancelIfNeeded(custom);
    alias = custom;
    const customProbe = await probeAlias(custom);
    if (!customProbe.free) {
      p.log.warn(`\`${custom}\` is already on PATH (${customProbe.ownerHint}). Continuing anyway.`);
    }
  } else if (aliasChoice === "__skip__") {
    alias = "arsams-grit";
  } else {
    alias = aliasChoice;
  }

  const rc = detectShellRc();
  if (alias !== "arsams-grit" && rc) {
    const shellOk = await p.confirm({
      message: `Add alias to ${rc}?`,
      initialValue: true,
    });
    cancelIfNeeded(shellOk);
    writeShell = shellOk;
  } else if (process.platform === "win32") {
    p.log.info("On Windows, add a PATH entry or PowerShell alias for arsams-grit manually after install.");
  }

  const template = await p.text({
    message: "Default branch name template",
    initialValue: defaultConfig.branch.template,
    placeholder: "{type}/{ticket}-{slug}",
  });
  cancelIfNeeded(template);

  const emoji = await p.confirm({
    message: "Enable emoji in commit messages?",
    initialValue: false,
  });
  cancelIfNeeded(emoji);

  const upstream = await p.text({
    message: "Default rebase upstream",
    initialValue: defaultConfig.rebase.defaultUpstream,
  });
  cancelIfNeeded(upstream);

  const editor = await p.text({
    message: "Preferred editor command (empty to use $EDITOR)",
    initialValue: process.env.EDITOR ?? "",
    placeholder: "code --wait",
  });
  cancelIfNeeded(editor);

  config = {
    alias,
    editor: editor || undefined,
    branch: {
      template,
      types: defaultConfig.branch.types,
      ticketPattern: defaultConfig.branch.ticketPattern,
    },
    commit: {
      emoji: {
        enabled: emoji,
        map: DEFAULT_EMOJI_MAP,
      },
      types: defaultConfig.commit.types,
    },
    rebase: {
      defaultUpstream: upstream,
      confirmForcePush: true,
    },
    github: { prTemplate: true },
  };

  writeGlobalConfig(config);
  p.log.success(`Wrote ${pc.dim("global config")}`);

  if (writeShell && rc) {
    upsertAliasInRc(rc, alias, resolveBinaryPath());
    p.log.success(`Updated ${rc} (reload your shell or run: source ${rc})`);
  }

  p.outro(`You're set. Try: ${pc.cyan(`cd my-repo && ${alias}`)} or ${pc.cyan(`${alias} status`)}`);
}
