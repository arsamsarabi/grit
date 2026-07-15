class Grit < Formula
  desc "Opinionated Git assistant — interactive TUI and scriptable CLI"
  homepage "https://github.com/arsamsarabi/grit"
  url "https://registry.npmjs.org/@arsams/grit/-/grit-0.1.1.tgz"
  sha256 "3b57178639f1ff6029d17969bf2db8c050d8b31d4f262e3df8bb263d2f2b3d92"
  license "MIT"

  depends_on "bun"
  depends_on "git"
  depends_on "gh" => :recommended

  def install
    # npm pack layout is under package/; Homebrew cds into it.
    libexec.install "bin", "src", "package.json", "LICENSE", "README.md", "CHANGELOG.md"

    (bin/"arsams-grit").write <<~EOS
      #!/bin/bash
      exec "#{Formula["bun"].opt_bin}/bun" "#{libexec}/src/index.ts" "$@"
    EOS
  end

  def caveats
    <<~EOS
      Installed as arsams-grit. Run `arsams-grit init` to choose a shell alias
      (e.g. grit / g / gg) if you want a shorter command.
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/arsams-grit --version")
  end
end
