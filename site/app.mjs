import { calculate } from './calculator.mjs';
const form = document.querySelector('form');
const error = document.querySelector('#error');
const results = document.querySelector('#results');
const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
form.addEventListener('submit', event => {
  event.preventDefault();
  error.textContent = '';
  try {
    const estimate = calculate(form.elements.watts.value, form.elements.hours.value, form.elements.price.value);
    document.querySelector('#daily-energy').textContent = `${estimate.dailyKwh.toLocaleString('en-IE', { maximumFractionDigits: 4 })} kWh`;
    for (const period of ['daily', 'monthly', 'annual']) {
      document.querySelector(`#${period}`).textContent = currency.format(estimate[`${period}Cost`]);
    }
    results.hidden = false;
  } catch (problem) {
    results.hidden = true;
    error.textContent = problem.message;
  }
});
