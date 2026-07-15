# typed Homebrew formula for @arsams/grit
#
# Install from a personal tap:
#   brew tap arsamsarabi/tap
#   brew install grit
#
# Or directly:
#   brew install arsamsarabi/tap/grit
#
# NOTE: This formula expects release assets. Until the first GitHub Release
# exists, prefer: bun add -g @arsams/grit

class Grit < Formula
  desc "Opinionated Git assistant — interactive TUI and scriptable CLI"
  homepage "https://github.com/arsamsarabi/grit"
  # Update url/sha on release; for now install via npm/bun is recommended
  version "0.1.0"
  license "MIT"

  depends_on "bun"
  depends_on "git"
  depends_on "gh" => :recommended

  def install
    system "bun", "install", "--frozen-lockfile"
    # Runtime: wrap arsams-grit
    (bin/"arsams-grit").write <<~EOS
      #!/bin/bash
      exec bun "#{prefix}/src/index.ts" "$@"
    EOS
    prefix.install "src", "package.json", "LICENSE", "README.md"
  end

  def caveats
    <<~EOS
      The binary is installed as arsams-grit to avoid colliding with GritQL.
      Run `arsams-grit init` to choose a shell alias (grit / g / gg).
    EOS
  end

  test do
    assert_match "0.1.0", shell_output("#{bin}/arsams-grit --version")
  end
end
