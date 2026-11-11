import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const report=JSON.parse(await readFile(resolve(root,'evidence/qa-final.json'),'utf8'));
if(report.approved!==true || !report.snapshot) throw Error('Independent QA approval missing');
async function files(dir){const entries=await readdir(resolve(root,dir),{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(`${dir}/${e.name}`):`${dir}/${e.name}`))).flat();}
const paths=(await files('site')).sort();
const recorded=Object.keys(report.snapshot).filter(p=>p.startsWith('site/')).sort();
if(JSON.stringify(paths)!==JSON.stringify(recorded)) throw Error('QA file inventory differs from deployment');
for(const path of paths){const hash=createHash('sha256').update(await readFile(resolve(root,path))).digest('hex');if(hash!==report.snapshot[path])throw Error(`QA snapshot changed: ${path}`);}
console.log(`QA approved exact deployment snapshot (${paths.length} files)`);
