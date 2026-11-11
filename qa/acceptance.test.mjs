import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculate } from '../site/calculator.mjs';

test('QA reference case uses 30 and 365 days', () => {
  const r = calculate(1000, 2, 0.30);
  assert.equal(r.dailyKwh, 2);
  assert.equal(r.dailyCost, 0.6);
  assert.equal(r.monthlyCost, 18);
  assert.equal(r.annualCost, 219);
});
test('QA decimals and numeric strings preserve units', () => {
  const r = calculate('75.5', '4.25', '0.287');
  assert.ok(Math.abs(r.monthlyCost - (75.5 * 4.25 * 0.287 * 30 / 1000)) < 1e-10);
});
test('QA zero values and 24 hour boundary', () => {
  for (const values of [[0,24,.3],[1000,0,.3],[1000,24,0]]) assert.equal(calculate(...values).annualCost,0);
  assert.equal(calculate(1000,24,1).annualCost,8760);
});
test('QA rejects missing, malformed, negative and nonfinite fields', () => {
  for (let i=0;i<3;i++) for (const bad of ['', '  ', undefined, null, NaN, Infinity, -Infinity, 'no', -1, {}, [], true]) {
    const inputs=[1000,2,.3]; inputs[i]=bad;
    assert.throws(()=>calculate(...inputs), RangeError, `field ${i}, value ${String(bad)}`);
  }
  assert.throws(()=>calculate(1000,24.001,.3), RangeError);
});
test('QA rejects arithmetic overflow', () => {
  assert.throws(()=>calculate(Number.MAX_VALUE,24,Number.MAX_VALUE),RangeError);
});
test('QA actual UI submit formats output and clears stale output on invalid submit', async () => {
  let submit;
  const nodes = Object.fromEntries(['error','results','daily-energy','daily','monthly','annual'].map(id=>[id,{textContent:'',hidden:true}]));
  const form={elements:{watts:{value:'1000'},hours:{value:'2'},price:{value:'.30'}},addEventListener(name,handler){assert.equal(name,'submit');submit=handler;}};
  globalThis.document={querySelector(selector){return selector==='form'?form:nodes[selector.slice(1)];}};
  try {
    await import('../site/app.mjs?qa=acceptance');
    let prevented=false;
    submit({preventDefault(){prevented=true;}});
    assert.ok(prevented);
    assert.equal(nodes.results.hidden,false);
    assert.equal(nodes.monthly.textContent,'€18.00');
    assert.equal(nodes.annual.textContent,'€219.00');
    form.elements.hours.value='25';
    submit({preventDefault(){}});
    assert.equal(nodes.results.hidden,true);
    assert.ok(nodes.error.textContent.length>0);
  } finally { delete globalThis.document; }
});
test('QA static markup labels all fields and announces results and errors', async () => {
  const html=await readFile(new URL('../site/index.html',import.meta.url),'utf8');
  for(const id of ['watts','hours','price']) {
    assert.match(html,new RegExp(`<label for="${id}">`));
    assert.match(html,new RegExp(`<input id="${id}"[^>]*required`));
  }
  assert.match(html,/role="alert"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/<button type="submit">/);
  assert.doesNotMatch(html,/(?:src|href)="\//);
});
test('QA Pages workflow runs tests before publishing site only', async () => {
  const yml=await readFile(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
  assert.match(yml,/workflow_dispatch:/);
  assert.match(yml,/run: npm test/);
  assert.match(yml,/needs: verify/);
  assert.match(yml,/path: site/);
});
