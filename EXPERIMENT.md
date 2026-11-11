# Two-worker experiment

The parent invoked independent Engineer and QA workers through Codex's native collaboration runtime. The Engineer sent its implementation directly to QA. QA created its acceptance plan before reading source and executed its own tests. No user copied messages between workers.

The calculator passed the first review. QA then identified a real controller defect: a repeat run could say APPROVED while leaving the old Pages approval hashes in place. The parent automatically assigned correction round one to Engineer. Engineer changed the controller to hash the site before QA, reject changes during review, and refresh the deployment approval after a valid verdict. It added fixture tests and sent the fix directly back to QA.

The stopping rule is approval or at most two correction rounds. Runtime errors stop the repeat controller immediately. The first run used native workers under an active parent agent; the included deterministic CLI controller provides a separate repeat-run path and has not been run with live model processes end to end.

## Review the evidence

- `evidence/session-events.jsonl`: parent-authored ordered handoff ledger.
- `evidence/engineer-handoff-0.json`: initial Engineer implementation and test results.
- `evidence/qa-round-0.json` and test output: independent calculator review.
- `evidence/qa-final.json`: independent approval and exact site hashes for deployment.
- `evidence/qa-round-1.json`: correction review when completed.

These files are durable session evidence, not a raw signed platform audit trail. The repeat CLI controller stores per-worker JSONL output, stderr, structured results and transitions in a new evidence/run-* directory.

## Remaining publication step

GitHub Actions workflows and Pages deployment are prepared locally. Neither has run remotely. Publication requires the user's repository/publication decision and sufficient GitHub access. See SETUP.md. QA used direct function tests, a minimal DOM stub for the real UI handler, and static markup/workflow checks; a full browser visual/accessibility session remains outside the verification performed here.
