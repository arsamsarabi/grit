class Grit < Formula
  desc "Opinionated Git assistant — interactive TUI and scriptable CLI"
  homepage "https://github.com/arsamsarabi/grit"
  url "https://registry.npmjs.org/@arsams/grit/-/grit-0.2.1.tgz"
  sha256 "d1a69e3ca5e7b62c623df3bcb3d869931a6bbaba39ee9b8262c1c43e65a1a101"
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
