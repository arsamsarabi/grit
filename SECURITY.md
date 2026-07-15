# Security Policy

## Supported Versions

grit is pre-1.0 and moves quickly. Security fixes land on the latest release published to npm (`@arsams/grit`) and the matching Homebrew formula when applicable.

| Version                        | Supported |
| ------------------------------ | --------- |
| Latest release on `main` / npm | Yes       |
| Older 0.x releases             | No        |

If you cannot upgrade immediately, still report the issue — we can advise on workarounds when feasible.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email **arsamsarabi@me.com** with:

- A short description of the issue
- Affected version(s) (`arsams-grit --version` or the npm package version)
- Steps to reproduce, or a proof of concept if you have one
- Impact (e.g. unexpected command execution, secret leakage, trust-boundary bypass)

You should receive an acknowledgment within **a few business days**. After that we’ll keep you updated as we triage and, if needed, prepare a fix.

### What to expect

- **Accepted:** We’ll work on a fix, credit you in the release notes if you want that, and coordinate disclosure once a patch is available (or after a mutually agreed window).
- **Declined:** We’ll explain why (e.g. not reproducible, out of scope, or expected behavior for a local Git/CLI tool that already has your machine privileges).

grit runs **local** Git/`gh` workflows on the user’s machine. Bugs that only matter because the tool already has the same access as the invoking user may still be worth fixing for UX, but they are not always treated as security vulnerabilities.

## Scope (examples)

In scope:

- Unexpected execution of remote content or untrusted input without clear user action
- Disclosure of secrets from config, env, or the environment beyond what the invoked Git/`gh` commands already require
- Supply-chain issues in published artifacts we control (npm package contents, release workflow)

Out of scope (report as normal bugs unless you believe there’s a security angle):

- Issues that require an already-compromised machine or malicious repo hooks the user knowingly ran
- Vulnerabilities solely in upstream tools (`git`, `gh`, Bun, npm) — prefer their own security process; mention grit only if our usage makes it worse

## Prefer GitHub’s private reporting?

If the repository has [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) enabled, you may use **Security → Report a vulnerability** instead of email. Either channel is fine.
