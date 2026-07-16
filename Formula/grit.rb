class Grit < Formula
  desc "Opinionated Git assistant — interactive TUI and scriptable CLI"
  homepage "https://github.com/arsamsarabi/grit"
  url "https://registry.npmjs.org/@arsams/grit/-/grit-1.0.0.tgz"
  sha256 "9cc6a1599f6338565c1ce50eb1cedd78284a60aa4970be6ceeb89a142df8c35f"
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
      Installed as arsams-grit. Run `arsams-grit init` to choose a shell alias
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
