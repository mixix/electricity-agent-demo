// Sequential independent Codex processes; no model API key or remote writes.
import { spawn } from 'node:child_process';
import { mkdir, appendFile, writeFile, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { snapshotSite, recordApproval } from './snapshot.mjs';
const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'evidence', `run-${Date.now()}`);
await mkdir(dir, { recursive: true });
const log = async (event, data = {}) => appendFile(resolve(dir, 'events.jsonl'), JSON.stringify({time:new Date().toISOString(),event,...data})+'\n');
const schema = resolve(dir,'verdict-schema.json');
await writeFile(schema, JSON.stringify({type:'object',properties:{approved:{type:'boolean'},findings:{type:'array',items:{type:'string'}}},required:['approved','findings'],additionalProperties:false}));
async function invoke(role, round, prompt) {
  await log('worker_started',{role,round,prompt});
  const result = resolve(dir,`${role}-${round}-result.json`);
  const args = ['exec','--skip-git-repo-check','--json','--color','never','--cd',root,'--sandbox',role==='qa'?'read-only':'workspace-write','--output-last-message',result];
  if(role==='qa') args.push('--output-schema',schema);
  args.push('-');
  const child = spawn(process.env.CODEX_BIN || 'codex',args,{shell:false,stdio:['pipe','pipe','pipe']});
  let transcript='', errors='', timedOut=false;
  child.stdout.on('data',d=>{transcript+=d;}); child.stderr.on('data',d=>{errors+=d;});
  const timer=setTimeout(()=>{timedOut=true;child.kill();},180000);
  child.stdin.end(prompt);
  const code = await new Promise((ok,no)=>{child.on('error',no);child.on('close',ok);}).finally(()=>clearTimeout(timer));
  await writeFile(resolve(dir,`${role}-${round}.jsonl`),transcript);
  await writeFile(resolve(dir,`${role}-${round}.stderr.txt`),errors);
  await log('worker_finished',{role,round,code,timedOut});
  if(code!==0 || timedOut) throw Error(`${role} failed or exceeded three minutes`);
  return readFile(result,'utf8');
}
try {
  await log('started',{maxCorrections:2,maximumWorkerInvocations:6,remoteWrites:false});
  let findings='Initial implementation or improvement of the existing calculator.';
  for(let round=0;round<=2;round++) {
    await invoke('engineer',round,`You are Engineer. Read README.md and implement/fix the static household electricity calculator. Only edit site source and engineering tests. Never change qa/, orchestration/, evidence/, workflows or acceptance criteria. No remote actions, subagents or installs. Run npm test. QA findings: ${findings}`);
    await log('handoff',{from:'engineer',to:'qa',round});
    const snapshot=await snapshotSite(root);
    await log('qa_snapshot',{round,snapshot});
    const raw=await invoke('qa',round,'You are independent QA. Read README.md, inspect site source, run npm test and node --test qa/*.test.mjs. Do not edit anything. Check formulas, invalid inputs, accessibility, relative paths. Approve only if all required checks pass. Return structured verdict and concrete findings. No remote actions or subagents.');
    const verdict=JSON.parse(raw);
    const approved=await recordApproval(root,snapshot,verdict,round,relative(root,dir).replaceAll('\\','/')+'/events.jsonl');
    await log('qa_verdict',{round,...verdict});
    if(approved){await log('terminal',{status:'approved',corrections:round});console.log(`APPROVED: ${dir}`);process.exit(0);}
    findings=JSON.stringify(verdict.findings);
    if(round<2) await log('handoff',{from:'qa',to:'engineer',round:round+1,findings:verdict.findings});
  }
  await log('terminal',{status:'correction_limit_reached'});process.exitCode=1;
} catch(error) {await log('terminal',{status:'runtime_error',message:error.message});console.error(error.message);process.exitCode=1;}
