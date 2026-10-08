const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

test('duplicate letters are scored only as often as they occur', () => {
  assert.deepEqual(E.scoreWord('allee', 'apple'), ['match', 'partial', 'miss', 'miss', 'match']);
  assert.deepEqual(E.scoreWord('eerie', 'serve'), ['miss', 'match', 'match', 'miss', 'match']);
  assert.deepEqual(E.scoreWord('level', 'level'), Array(5).fill('match'));
});
test('the whole world sees the same US Central puzzle date', () => {
  assert.equal(E.dateKey(new Date('2026-10-09T04:59:59Z')), '2026-10-08');
  assert.equal(E.dateKey(new Date('2026-10-09T05:00:00Z')), '2026-10-09');
  assert.equal(E.dateKey(new Date('2026-10-09T13:59:59+09:00')), '2026-10-08');
});
test('midnight resets remain correct on 23-hour and 25-hour DST days', () => {
  const spring = new Date('2027-03-14T06:00:00Z');
  const fall = new Date('2026-11-01T05:00:00Z');
  assert.equal(E.nextReset(spring) - spring.getTime(), 23 * 3600000);
  assert.equal(E.nextReset(fall) - fall.getTime(), 25 * 3600000);
  assert.equal(new Date(E.nextReset(new Date('2026-10-08T19:00:00Z'))).toISOString(), '2026-10-09T05:00:00.000Z');
});
test('answers are deterministic and never repeat within a roster cycle', () => {
  const words = ['one', 'two', 'three', 'four', 'five'];
  const answers = [];
  for (let i = 0; i < 5; i++) {
    const day = `2026-10-${String(8 + i).padStart(2, '0')}`;
    answers.push(E.dailyAnswer(words, day, 'test'));
    assert.equal(E.dailyAnswer(words, day, 'test'), E.dailyAnswer([...words], day, 'test'));
  }
  assert.equal(new Set(answers).size, words.length);
});
test('list clues match sets and number arrows point toward the answer', () => {
  assert.equal(E.compare(['Fire', 'Flying'], ['Flying', 'Fire']), 'match');
  assert.equal(E.compare(['Fire'], ['Fire', 'Flying']), 'partial');
  assert.equal(E.compare(['Water'], ['Fire']), 'miss');
  assert.equal(E.compare(300, 350), 'higher');
  assert.equal(E.compare(500, 350), 'lower');
  assert.equal(E.compare(350, 350), 'match');
});
test('wins take precedence on the final attempt', () => {
  assert.equal(E.status(['a', 'b'], 'b', 2), 'won');
  assert.equal(E.status(['a', 'b'], 'c', 2), 'lost');
  assert.equal(E.status(['a'], 'c', 2), 'playing');
});
test('names normalize punctuation, accents, and Nidoran genders', () => {
  assert.equal(E.normalize("Kai’Sa"), 'kaisa');
  assert.equal(E.normalize('Flabébé'), 'flabebe');
  assert.equal(E.normalize('Nidoran♀'), 'nidoranf');
  assert.equal(E.normalize('Nidoran♂'), 'nidoranm');
});
