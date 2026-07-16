#!/usr/bin/env bun
/**
 * After an npm publish, rewrite Formula/grit.rb with the npm tarball url + sha256.
 *
 * Usage:
 *   bun run scripts/sync-homebrew-formula.ts
 *   VERSION=0.1.1 bun run scripts/sync-homebrew-formula.ts
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const FORMULA_PATH = join(ROOT, "Formula", "grit.rb");
const PACKAGE_NAME = "@arsams/grit";

function packageJsonVersion(): string {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    version: string;
  };
  return pkg.version;
}

async function npmMeta(version: string): Promise<{ tarball: string }> {
  const res = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/${version}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch npm metadata for ${PACKAGE_NAME}@${version}: ${res.status}`);
  }
  const json = (await res.json()) as { dist: { tarball: string } };
  return { tarball: json.dist.tarball };
}

async function sha256Url(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return createHash("sha256").update(buf).digest("hex");
}

function renderFormula(tarball: string, sha256: string): string {
  return `class Grit < Formula
  desc "Opinionated Git assistant — interactive TUI and scriptable CLI"
  homepage "https://github.com/arsamsarabi/grit"
  url "${tarball}"
  sha256 "${sha256}"
  license "MIT"

  depends_on "git"
  depends_on "gh" => :recommended

  def install
    binary = prebuilt_binary
    odie "No prebuilt binary for this platform" unless File.exist?(binary)
    bin.install binary => "arsams-grit"
  end

  def caveats
    <<~EOS
      Installed as arsams-grit. Run \`arsams-grit init\` to choose a shell alias
      (e.g. grit / g / gg) if you want a shorter command.
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/arsams-grit --version")
  end

  private

  def prebuilt_binary
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    os = OS.mac? ? "darwin" : "linux"
    "dist/arsams-grit-" + os + "-" + arch
  end
end
`;
}

async function main(): Promise<void> {
  const version = process.env.VERSION?.trim() || packageJsonVersion();
  const { tarball } = await npmMeta(version);
  const sha256 = await sha256Url(tarball);
  const formula = renderFormula(tarball, sha256);

  mkdirSync(join(ROOT, "Formula"), { recursive: true });
  writeFileSync(FORMULA_PATH, formula, "utf8");
  console.log(`Updated ${FORMULA_PATH} → ${version}`);
  console.log(`  url: ${tarball}`);
  console.log(`  sha256: ${sha256}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
