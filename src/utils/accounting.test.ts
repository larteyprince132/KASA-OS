import test from 'node:test';
import assert from 'node:assert/strict';
import {
  round2,
  formatCurrency,
  calculateWeightedAverageCost,
  verifyDoubleEntryBalance,
} from './accounting';

test('Decimal safe rounding avoids JavaScript binary float representation errors', () => {
  const floatSum = 0.1 + 0.2;
  assert.notEqual(floatSum, 0.3); // raw float fails
  assert.equal(round2(floatSum), 0.3); // round2 succeeds
  assert.equal(round2(143.749999999), 143.75);
});

test('Format currency properly displays standard symbols and 2 decimal points', () => {
  assert.equal(formatCurrency(2500, 'GH₵'), 'GH₵ 2,500.00');
  assert.equal(formatCurrency(12.5, '$'), '$ 12.50');
  assert.equal(formatCurrency(0, '€'), '€ 0.00');
});

test('Weighted Average Cost (WAC) formula accurately averages stock intake', () => {
  // Existing: 100 units at 50 = 5,000
  // Added: 50 units at 80 = 4,000
  // Total: 150 units with value 9,000 -> New WAC = 60.00
  const newWac = calculateWeightedAverageCost(100, 50, 50, 80);
  assert.equal(newWac, 60);

  // New stock only
  const initWac = calculateWeightedAverageCost(0, 0, 20, 125);
  assert.equal(initWac, 125);
});

test('Double-Entry Balance verifier accepts equal debits and credits and rejects unbalances', () => {
  const balanced = [
    { debit: 1250, credit: 0 },
    { debit: 0, credit: 1250 },
  ];
  assert.equal(verifyDoubleEntryBalance(balanced), true);

  const unbalanced = [
    { debit: 1000, credit: 0 },
    { debit: 0, credit: 950 },
  ];
  assert.equal(verifyDoubleEntryBalance(unbalanced), false);
});
