(function (root) {
  'use strict';
  const ZONE = 'America/Chicago';
  const EPOCH = Date.UTC(2026, 9, 8);
  const DAY = 86400000;
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
  function dateKey(date = new Date()) {
    const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function dayNumber(key) { return Math.floor((Date.parse(`${key}T00:00:00Z`) - EPOCH) / DAY); }
  function nextReset(now = new Date()) {
    const key = dateKey(now);
    let lo = now.getTime(), hi = lo + 26 * 3600000;
    while (hi - lo > 1) {
      const mid = Math.floor((hi + lo) / 2);
      if (dateKey(new Date(mid)) === key) lo = mid;
      else hi = mid;
    }
    return hi;
  }
  function hash(text) {
    let n = 2166136261;
    for (const c of text) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); }
    return n >>> 0;
  }
  const cycles = new Map();
  function dailyAnswer(items, key, mode) {
    if (!items.length) throw new Error('No puzzle answers available.');
    const day = dayNumber(key), cycle = Math.floor(day / items.length);
    const cacheKey = `${mode}:${items.length}:${cycle}`;
    let order = cycles.get(cacheKey);
    if (!order) {
      order = Array.from({ length: items.length }, (_, i) => i);
      let seed = hash(`daily-queue-v1:${mode}:${cycle}`);
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      cycles.set(cacheKey, order);
    }
    return items[order[((day % items.length) + items.length) % items.length]];
  }
  function scoreWord(guess, answer) {
    guess = guess.toLowerCase(); answer = answer.toLowerCase();
    const score = Array(5).fill('miss'), remaining = {};
    for (let i = 0; i < 5; i++) {
      if (guess[i] === answer[i]) score[i] = 'match';
      else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < 5; i++) {
      if (score[i] !== 'match' && remaining[guess[i]] > 0) { score[i] = 'partial'; remaining[guess[i]]--; }
    }
    return score;
  }
  function compare(guess, answer) {
    if (Array.isArray(guess)) {
      const a = new Set(guess), b = new Set(answer);
      if (a.size === b.size && [...a].every(x => b.has(x))) return 'match';
      return [...a].some(x => b.has(x)) ? 'partial' : 'miss';
    }
    if (guess === answer) return 'match';
    return typeof guess === 'number' ? (answer > guess ? 'higher' : 'lower') : 'miss';
  }
  function normalize(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/♀/g, 'f').replace(/♂/g, 'm').replace(/[^a-z0-9]/g, ''); }
  function status(guesses, answerId, max) {
    if (guesses.includes(answerId)) return 'won';
    return guesses.length >= max ? 'lost' : 'playing';
  }
  const api = { ZONE, dateKey, dayNumber, nextReset, dailyAnswer, scoreWord, compare, normalize, status };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QueueEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
