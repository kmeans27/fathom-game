import test from 'node:test';
import { strict as assert } from 'node:assert';
import { generateRounds, dailySeed } from '../js/rounds.js';
import { TRENCH } from '../js/balance.js';
test('same seed => identical trench', () => {
  assert.deepEqual(generateRounds(12345), generateRounds(12345));
});
test('different seeds differ', () => {
  assert.notDeepEqual(generateRounds(1), generateRounds(2));
});
test('a run is 7 rounds', () => {
  assert.equal(generateRounds(9).length, TRENCH.rounds);
});
test('targets stay inside the fair band', () => {
  for (const r of generateRounds(42)) {
    assert.ok(r.target >= 60 && r.target <= 940);
  }
});
test('daily seed is date-keyed and stable', () => {
  const d = new Date(2026, 9, 14);
  assert.equal(dailySeed(d), dailySeed(new Date(2026, 9, 14)));
});
