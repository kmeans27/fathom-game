import test from 'node:test';
import { strict as assert } from 'node:assert';
import { game } from './loader.mjs';
const { evaluate, TRENCH, TIERS } = game();
test('miss: 251 m off scores nothing', () => assert.equal(evaluate(0, 251, 1).tier, 'miss'));
test('graze: 250 m off scores 5', () => assert.equal(evaluate(0, 250, 1).points, 5));
test('perfect: 5 m off scores 100', () => assert.equal(evaluate(0, 5, 1).points, 100));
test('blind perfect doubles to 200', () => assert.equal(evaluate(0, 5, 0).points, 200));
test('blind points capped at 700', () => assert.equal(evaluate(0, 0, 0).points, 200));
test('a zero-ping miss stays a miss', () => assert.equal(evaluate(0, 1000, 0).tier, 'miss'));
test('boundaries: 20 bullseye, 21 hit', () => {
  assert.equal(evaluate(0, 20, 1).tier, 'bullseye');
  assert.equal(evaluate(0, 21, 1).tier, 'hit');
});
test('boundaries: 100 hit, 101 graze', () => {
  assert.equal(evaluate(0, 100, 1).tier, 'hit');
  assert.equal(evaluate(0, 101, 1).tier, 'graze');
});
