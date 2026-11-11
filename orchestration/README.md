# Orchestration

The first run uses two real Codex desktop workers (`/root/engineer` and `/root/qa`) and a coordinating parent. The user does not forward messages. Native worker tools supply execution and automatic message delivery; the parent routes findings and enforces at most two correction rounds. This is an actively supervised parent-agent run, not a background service.

`evidence/session-events.jsonl` is a parent-written event ledger, not a raw platform audit export. Worker reports contain their actual commands, outcomes and code hashes. It is evidence of this session, not a cryptographically authenticated transcript.

For a repeat run with a deterministic controller, use `node orchestration/run.mjs` from this folder with Codex CLI on PATH and signed in. `CODEX_BIN` may contain the full path to codex.exe. The controller starts separate Engineer and QA processes, forwards structured QA findings, preserves stdout JSONL and stderr, and stops on approval, an error, or two corrections (at most six worker calls). Each worker has a three-minute deadline. Runtime errors are terminal and are not silently retried. On Windows timeout termination of a complete descendant process tree is not guaranteed by Node's child.kill; terminate leftover processes before retrying if a CLI child hangs.

The repeat-run controller has been syntax checked and its snapshot/approval helpers have fixture tests. The separate CLI model loop has not been run end to end; the native-worker demonstration is the live agent execution in this session. CLI authentication was checked without exposing secrets. No API credential was copied, read, or embedded. CLI usage uses the user's configured account and usage allowance. External paid frameworks are unnecessary for this experiment.

QA is read-only in repeat runs; Engineer has workspace write access with explicit ownership instructions. This is role separation, not a security boundary against malicious workers. Workflows and acceptance tests must be reviewed before a repeat run. Neither controller publishes, merges or deploys.

Terminal success of local orchestration does not mean GitHub Actions or Pages ran. Those require a selected GitHub repository, permitted workflow uploads, Actions enabled, and Pages configured for GitHub Actions. Publishing the site is a separate manual workflow after tests. Keep API keys and ChatGPT credentials off GitHub.
