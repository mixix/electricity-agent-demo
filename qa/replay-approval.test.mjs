import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { snapshotSite, recordApproval } from '../orchestration/snapshot.mjs';

test('QA corrected replay approval replaces stale snapshot and satisfies real deployment gate', async () => {
  const fixture=await mkdtemp(join(tmpdir(),'electricity-qa-replay-'));
  try {
    for(const dir of ['site','site/nested','evidence','orchestration']) await mkdir(join(fixture,dir));
    await writeFile(join(fixture,'orchestration/verify-qa.mjs'),await readFile(new URL('../orchestration/verify-qa.mjs',import.meta.url)));
    await writeFile(join(fixture,'site/nested/index.html'),'old version');
    await recordApproval(fixture,await snapshotSite(fixture),{approved:true,findings:[]},0,'old/events.jsonl');
    await writeFile(join(fixture,'site/nested/index.html'),'new reviewed version');
    const gate=()=>spawnSync(process.execPath,[join(fixture,'orchestration/verify-qa.mjs')],{encoding:'utf8'});
    assert.notEqual(gate().status,0,'stale original approval must block deployment');
    const reviewed=await snapshotSite(fixture);
    await recordApproval(fixture,reviewed,{approved:true,findings:[]},1,'new/events.jsonl');
    assert.equal(gate().status,0,'new independent approval must unblock exact reviewed snapshot');
    const report=JSON.parse(await readFile(join(fixture,'evidence/qa-final.json'),'utf8'));
    assert.equal(report.round,1);
    assert.equal(report.runEvidence,'new/events.jsonl');
    assert.ok(report.snapshot['site/nested/index.html']);
    await unlink(join(fixture,'site/nested/index.html'));
    await assert.rejects(recordApproval(fixture,reviewed,{approved:true,findings:[]},1,'bad/events.jsonl'),/changed during/);
    assert.notEqual(gate().status,0);
  } finally {
    const checked=resolve(fixture); const tempRoot=resolve(tmpdir());
    assert.ok(!relative(tempRoot,checked).startsWith('..') && checked!==tempRoot);
    await rm(checked,{recursive:true,force:true});
  }
});
