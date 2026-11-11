export function calculate(watts, hours, price) {
  const values = [watts, hours, price];
  if (values.some(value => (typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '')) {
    throw new RangeError('Enter all three values.');
  }
  const [w, h, p] = values.map(Number);
  if (![w, h, p].every(Number.isFinite) || w < 0 || h < 0 || h > 24 || p < 0) {
    throw new RangeError('Use non-negative finite numbers, with daily hours between 0 and 24.');
  }
  const dailyKwh = w / 1000 * h;
  const dailyCost = dailyKwh * p;
  const monthlyCost = dailyCost * 30;
  const annualCost = dailyCost * 365;
  if (![dailyKwh, dailyCost, monthlyCost, annualCost].every(Number.isFinite)) {
    throw new RangeError('These values are too large to calculate.');
  }
  return { dailyKwh, dailyCost, monthlyCost, annualCost };
}
