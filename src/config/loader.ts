import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { defaultConfig } from "@/config/defaults.ts";
import { type GritConfig, type GritConfigInput, gritConfigSchema } from "@/config/schema.ts";

export function globalConfigDir(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, "grit");
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(xdg, "grit");
}

export function globalConfigPath(): string {
  return join(globalConfigDir(), "config.json");
}

export function repoConfigPath(cwd: string): string {
  return join(cwd, "grit.config.json");
}

function readJsonFile(path: string): unknown {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw) as unknown;
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      out[key] = deepMerge(base[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

export function loadConfig(cwd: string = process.cwd()): GritConfig {
  const globalRaw = readJsonFile(globalConfigPath()) as Record<string, unknown>;
  const repoRaw = readJsonFile(repoConfigPath(cwd)) as Record<string, unknown>;
  const merged = deepMerge(deepMerge({}, globalRaw), repoRaw);
  return gritConfigSchema.parse(merged);
}

export function writeGlobalConfig(input: GritConfigInput): GritConfig {
  const config = gritConfigSchema.parse(input);
  const dir = globalConfigDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(globalConfigPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return config;
}

export function ensureGlobalConfig(): GritConfig {
  if (existsSync(globalConfigPath())) {
    return loadConfig();
  }
  return writeGlobalConfig(defaultConfig);
}
