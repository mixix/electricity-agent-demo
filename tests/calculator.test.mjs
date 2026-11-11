import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../site/calculator.mjs';

test('reference appliance uses two kWh and costs €18 monthly, €219 annually', () => {
  assert.deepEqual(calculate(1000, 2, .30), { dailyKwh: 2, dailyCost: .6, monthlyCost: 18, annualCost: 219 });
});
test('accepts decimal inputs without rounding intermediate results', () => {
  assert.equal(calculate('12.5', '1.5', '0.4').monthlyCost, .22500000000000003);
});
test('zero and 24-hour boundaries are valid', () => {
  assert.equal(calculate(0, 24, 1).annualCost, 0);
  assert.equal(calculate(1000, 24, 1).dailyKwh, 24);
  assert.equal(calculate(1000, 0, 1).monthlyCost, 0);
  assert.equal(calculate(1000, 24, 0).annualCost, 0);
});
test('rejects blanks, nonfinite numbers, negatives, excessive hours, and overflow', () => {
  for (const value of ['', ' ', null, undefined, NaN, Infinity, -1, {}, []]) {
    assert.throws(() => calculate(value, 1, 1), RangeError);
    assert.throws(() => calculate(1, value, 1), RangeError);
    assert.throws(() => calculate(1, 1, value), RangeError);
  }
  assert.throws(() => calculate(1, 24.1, 1), RangeError);
  assert.throws(() => calculate(1e308, 24, 1e308), RangeError);
});
