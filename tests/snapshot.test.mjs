import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshotSite, recordApproval } from '../orchestration/snapshot.mjs';

test('controller records exact approved snapshot and evidence link; rejects changed or malformed reviews', async () => {
  const root = await mkdtemp(join(tmpdir(), 'electricity-controller-'));
  try {
    await mkdir(join(root, 'site'));
    await mkdir(join(root, 'evidence'));
    await writeFile(join(root, 'site/index.html'), 'first');
    const snapshot = await snapshotSite(root);
    assert.equal(await recordApproval(root, snapshot, { approved: false, findings: ['defect'] }, 0, 'run/events.jsonl'), false);
    await assert.rejects(readFile(join(root, 'evidence/qa-final.json')));
    await recordApproval(root, snapshot, { approved: true, findings: [] }, 1, 'run/events.jsonl');
    const approval = JSON.parse(await readFile(join(root, 'evidence/qa-final.json'), 'utf8'));
    assert.deepEqual(approval.snapshot, snapshot);
    assert.equal(approval.round, 1);
    assert.equal(approval.runEvidence, 'run/events.jsonl');
    await assert.rejects(recordApproval(root, snapshot, { approved: true, findings: [3] }, 1, 'run'), /Malformed/);
    await assert.rejects(recordApproval(root, snapshot, { approved: true, findings: ['unresolved'] }, 1, 'run'), /unresolved/);
    await writeFile(join(root, 'site/index.html'), 'changed');
    await assert.rejects(recordApproval(root, snapshot, { approved: true, findings: [] }, 1, 'run'), /changed during/);
    await writeFile(join(root, 'site/index.html'), 'first');
    await writeFile(join(root, 'site/extra.txt'), 'new');
    await assert.rejects(recordApproval(root, snapshot, { approved: false, findings: [] }, 1, 'run'), /changed during/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
