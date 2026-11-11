import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';

export async function snapshotSite(root) {
  const snapshot = {};
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) snapshot[relative(root, path).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(path)).digest('hex');
      else throw Error('Site contains an unsupported file type');
    }
  }
  await visit(resolve(root, 'site'));
  return snapshot;
}

export async function recordApproval(root, before, verdict, round, runEvidence) {
  if (typeof verdict?.approved !== 'boolean' || !Array.isArray(verdict.findings) || !verdict.findings.every(item => typeof item === 'string')) throw Error('Malformed QA verdict');
  const after = await snapshotSite(root);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw Error('Site changed during QA review');
  if (!verdict.approved) return false;
  if (verdict.findings.length) throw Error('QA approval contains unresolved findings');
  await writeFile(resolve(root, 'evidence', 'qa-final.json'), JSON.stringify({
    approved: true, snapshot: after, round, runEvidence,
    timestamp: new Date().toISOString(), findings: verdict.findings
  }, null, 2) + '\n');
  return true;
}
