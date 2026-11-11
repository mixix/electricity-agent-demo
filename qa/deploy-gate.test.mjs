import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

test('QA deployment gate fails closed for missing approval, changed and added files', async () => {
  const temp=await mkdtemp(join(tmpdir(),'electricity-qa-'));
  try {
    for(const dir of ['site','evidence','orchestration']) await mkdir(join(temp,dir));
    await writeFile(join(temp,'orchestration/verify-qa.mjs'),await readFile(new URL('../orchestration/verify-qa.mjs',import.meta.url)));
    await writeFile(join(temp,'site/index.html'),'reviewed');
    const snapshot={'site/index.html':createHash('sha256').update('reviewed').digest('hex')};
    const run=()=>spawnSync(process.execPath,[join(temp,'orchestration/verify-qa.mjs')],{encoding:'utf8'});
    assert.notEqual(run().status,0);
    await writeFile(join(temp,'evidence/qa-final.json'),JSON.stringify({approved:false,snapshot}));
    assert.notEqual(run().status,0);
    await writeFile(join(temp,'evidence/qa-final.json'),JSON.stringify({approved:true,snapshot}));
    assert.equal(run().status,0);
    await writeFile(join(temp,'site/index.html'),'changed');
    assert.notEqual(run().status,0);
    await writeFile(join(temp,'site/index.html'),'reviewed');
    await writeFile(join(temp,'site/extra.txt'),'extra');
    assert.notEqual(run().status,0);
  } finally { await rm(temp,{recursive:true,force:true}); }
});
