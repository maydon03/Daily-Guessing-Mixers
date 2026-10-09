(function (root) {
  'use strict';
  const E = typeof module === 'object' && module.exports ? require('./engine.js') : root.QueueEngine;
  function hash(text) { let n = 2166136261; for (const c of String(text)) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); } return n >>> 0; }
  function random(seed) { let n = hash(seed); return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
  function shuffle(items, rng) { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pick = (items, rng) => items[Math.floor(rng() * items.length)];
  const difference = (a, b) => a.length === b.length ? [...a].filter((c, i) => c !== b[i]).length : Infinity;
  function codeScore(guess, answer) {
    let exact = 0, misplaced = 0; const remaining = {};
    for (let i = 0; i < answer.length; i++) { if (guess[i] === answer[i]) exact++; else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1; }
    for (let i = 0; i < answer.length; i++) if (guess[i] !== answer[i] && remaining[guess[i]] > 0) { misplaced++; remaining[guess[i]]--; }
    return { exact, misplaced };
  }
  function permutations(a) { if (a.length < 2) return [a]; return a.flatMap((x, i) => permutations(a.filter((_, j) => i !== j)).map(p => [x, ...p])); }
  function satisfies(world, clue) {
    const [kind, a, b, positive] = clue;
    const actual = kind === 'pet' ? world.pets[a] === b : kind === 'town' ? world.towns[a] === b : world.towns[world.pets.indexOf(a)] === b;
    return positive ? actual : !actual;
  }
  function logicPuzzle(rng) {
    const perms = permutations([0, 1, 2]);
    const worlds = perms.flatMap(pets => perms.map(towns => ({ pets, towns })));
    const solution = pick(worlds, rng);
    const candidates = [];
    for (const kind of ['pet', 'town', 'petTown']) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const c = [kind, a, b, true]; c[3] = satisfies(solution, c); candidates.push(c);
    }
    let remaining = worlds, clues = [];
    const pool = shuffle(candidates, rng);
    while (remaining.length > 1) {
      let chosen = null, count = remaining.length;
      // Prefer indirect exclusions initially; the resulting clues always identify one solution.
      for (const c of pool) {
        if (clues.includes(c)) continue;
        const n = remaining.filter(w => satisfies(w, c)).length;
        const indirectBonus = clues.length < 2 && !c[3] ? 0.85 : 1;
        if (n * indirectBonus < count) { count = n * indirectBonus; chosen = c; }
      }
      if (!chosen) throw new Error('Unable to create a unique logic puzzle.');
      clues.push(chosen); remaining = remaining.filter(w => satisfies(w, chosen));
    }
    // Remove clues that do not contribute to uniqueness.
    for (let i = clues.length - 1; i >= 0; i--) {
      const trial = clues.filter((_, j) => i !== j);
      if (worlds.filter(w => trial.every(c => satisfies(w, c))).length === 1) clues = trial;
    }
    return { people: shuffle(['Maya', 'Finn', 'Jules', 'Alex', 'Sam', 'Riley', 'Kai', 'Robin'], rng).slice(0, 3),
      pets: shuffle(['Pikachu', 'Eevee', 'Squirtle', 'Bulbasaur', 'Charmander', 'Vulpix', 'Growlithe', 'Psyduck', 'Meowth'], rng).slice(0, 3),
      towns: shuffle(['Pewter City', 'Cerulean City', 'Vermilion City', 'Celadon City', 'Fuchsia City', 'Pallet Town'], rng).slice(0, 3), solution, clues: shuffle(clues, rng) };
  }
  function crossEntries(grid, across, down) {
    const entries = []; let number = 0, ac = 0, dn = 0;
    const good = (r, c) => r >= 0 && r < 5 && c >= 0 && c < 5 && grid[r][c] !== '#';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      if (!good(r, c)) continue;
      const a = !good(r, c - 1) && good(r, c + 1), d = !good(r - 1, c) && good(r + 1, c);
      if (a || d) number++;
      for (const dir of ['across', 'down']) if (dir === 'across' ? a : d) {
        const cells = []; let y = r, x = c;
        while (good(y, x)) { cells.push(y * 5 + x); if (dir === 'across') x++; else y++; }
        entries.push({ id: `${number}-${dir}`, number, dir, cells, clue: dir === 'across' ? across[ac++] : down[dn++] });
      }
    }
    return entries;
  }
  function makePuzzle(id, seed, D, P) {
    const rng = random(`daily-queue-v4:${id}:${seed}`);
    if (id === 'wordle') return { answer: /^d-\d{4}-\d{2}-\d{2}$/.test(seed) ? E.dailyAnswer(D.answers, seed.slice(2), 'word') : pick(D.answers, rng) };
    if (id === 'categories') {
      const groups = [], used = new Set();
      for (const g of shuffle(P.groups, rng)) {
        if (g.words.some(w => used.has(w))) continue;
        groups.push(g); g.words.forEach(w => used.add(w)); if (groups.length === 4) break;
      }
      return { groups, words: shuffle(groups.flatMap(g => g.words), rng) };
    }
    if (id === 'ladder') return pick(P.ladders, rng);
    if (id === 'codebreaker') return { answer: Array.from({ length: 4 }, () => String(1 + Math.floor(rng() * 6))).join('') };
    if (id === 'anagrams') {
      const signatures = new Set(), words = [];
      for (const w of shuffle(D.answers.filter(w => new Set(w).size >= 4), rng)) {
        const signature = [...w].sort().join('');
        if (!signatures.has(signature)) { signatures.add(signature); words.push(w); }
        if (words.length === 5) break;
      }
      return { words, scrambles: words.map(w => { let s = w; while (s === w) s = shuffle([...w], rng).join(''); return s; }) };
    }
    if (id === 'hive') { const p = pick(P.hives, rng); return { ...p, outer: shuffle(p.letters.filter(l => l !== p.center), rng) }; }
    if (id === 'crossword') { const p = pick(P.crosswords, rng); return { ...p, entries: crossEntries(p.grid, p.across, p.down) }; }
    if (id === 'logic') return logicPuzzle(rng);
    if (id === 'rift-classic') return { target: pick(P.league, rng) };
    if (id === 'rift-quote' || id === 'rift-emoji') { const clue = pick(P.riddles, rng); return { target: D.rift.find(x => x.id === clue.champion), clue, line: Math.floor(rng() * clue.lines.length) }; }
    if (id === 'rift-ability') { const ability = pick(P.abilities, rng); return { target: D.rift.find(x => x.id === ability.champion), ability }; }
    if (id === 'rift-splash') { const targetId = pick(Object.keys(P.art.splash), rng); return { target: D.rift.find(x => x.id === targetId), x: 30 + Math.floor(rng() * 40), y: 30 + Math.floor(rng() * 30) }; }
    if (id.startsWith('dex-')) return { target: pick(P.dex, rng), angle: pick([-16, -10, 12, 18], rng) };
    throw new Error('Unknown puzzle');
  }
  function ladderPath(start, end, words) {
    const queue = [start], previous = new Map([[start, null]]); let index = 0;
    while (index < queue.length) {
      const w = queue[index++];
      if (w === end) { const path = []; let v = end; while (v !== null) { path.unshift(v); v = previous.get(v); } return path; }
      for (let i = 0; i < w.length; i++) for (let c = 97; c <= 122; c++) {
        const n = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
        if (words.has(n) && !previous.has(n)) { previous.set(n, w); queue.push(n); }
      }
    }
    return null;
  }
  function hiveScore(w) { return w.length === 4 ? 1 : w.length + (new Set(w).size === 7 ? 7 : 0); }
  const api = { hash, random, shuffle, pick, difference, codeScore, permutations, satisfies, logicPuzzle, crossEntries, makePuzzle, ladderPath, hiveScore };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.ArcadeEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
