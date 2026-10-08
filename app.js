(() => {
  'use strict';
  const E = window.QueueEngine, D = window.QueueData;
  const $ = id => document.getElementById(id);
  if (!E || !D) { $('game-content').textContent = 'A game file is missing. Please refresh, or check that data.js and engine.js were uploaded beside index.html.'; return; }
  const MODES = ['word', 'rift', 'dex'];
  const KANTO = D.dex.filter(item => item.generation === 1 && item.number <= 151);
  const META = {
    word: { id: 'word', name: 'Wordle', label: 'Wordle', category: 'word', type: 'word', max: 6, title: 'Make every letter count.', description: "Find today's five-letter word. Your colors are your clues.", kicker: 'DAILY WORD', items: D.answers, seed: 'word' },
    rift_clues: { id: 'rift_clues', name: 'Rift · Champion Clues', label: 'Champion Clues', category: 'rift', type: 'roster', max: 8, title: 'Name the champion.', description: 'Compare class, resource, range, speed, and difficulty with the mystery champion.', kicker: 'RIFT // CHAMPION CLUES', items: D.rift, fields: [{ key: 'roles', label: 'Class' }, { key: 'resource', label: 'Resource' }, { key: 'range', label: 'Atk. range' }, { key: 'speed', label: 'Move speed' }, { key: 'difficulty', label: 'Difficulty' }], seed: 'rift', hintLabel: 'Champion title' },
    rift_role: { id: 'rift_role', name: 'Rift · Role Queue', label: 'Role Queue', category: 'rift', type: 'roster', max: 6, title: 'Queue up the answer.', description: 'Use class, resource, and difficulty to lock onto a League champion.', kicker: 'RIFT // ROLE QUEUE', items: D.rift, fields: [{ key: 'roles', label: 'Class' }, { key: 'resource', label: 'Resource' }, { key: 'difficulty', label: 'Difficulty' }], seed: 'rift-role', hintLabel: 'Champion title' },
    rift_silhouette: { id: 'rift_silhouette', name: 'Rift · Champion Silhouette', label: 'Champion Silhouette', category: 'rift', type: 'silhouette', max: 6, title: 'Who is hiding in the mist?', description: 'Search the shadow and identify the League champion before the signal fades.', kicker: 'RIFT // SILHOUETTE DROP', items: D.rift, seed: 'rift-silhouette', hintLabel: 'Champion title' },
    dex_clues: { id: 'dex_clues', name: 'Dex · Kanto Clues', label: 'Kanto Clues', category: 'dex', type: 'roster', max: 8, title: 'Read the Kanto entry.', description: 'Compare types, Pokédex number, size, and color across the original 151.', kicker: 'DEX // KANTO CLUES', items: KANTO, fields: [{ key: 'types', label: 'Types' }, { key: 'number', label: '#', prefix: '#' }, { key: 'height', label: 'Height', suffix: ' m' }, { key: 'weight', label: 'Weight', suffix: ' kg' }, { key: 'color', label: 'Color' }], seed: 'dex-kanto', hintLabel: 'Pokédex category' },
    dex_silhouette: { id: 'dex_silhouette', name: "Dex · Who's That Pokémon?", label: "Who's That Pokémon?", category: 'dex', type: 'silhouette', max: 6, title: "Who's that Pokémon?", description: 'The silhouette is from the original 151. Search the Kanto Pokédex to reveal it.', kicker: 'DEX // WHO’S THAT POKÉMON?', items: KANTO, seed: 'dex-silhouette', hintLabel: 'Pokédex category' },
    dex_types: { id: 'dex_types', name: 'Dex · Type Scan', label: 'Type Scan', category: 'dex', type: 'roster', max: 6, title: 'Match the type signature.', description: 'Use type, color, and Pokédex direction clues to find a Kanto Pokémon.', kicker: 'DEX // TYPE SCAN', items: KANTO, fields: [{ key: 'types', label: 'Types' }, { key: 'color', label: 'Color' }, { key: 'number', label: 'Dex no.', prefix: '#' }], seed: 'dex-types', hintLabel: 'Pokédex category' }
  };
  const GAME_KEYS = Object.keys(META);
  const VARIANTS = { rift: [META.rift_clues, META.rift_role, META.rift_silhouette], dex: [META.dex_clues, META.dex_silhouette, META.dex_types] };
  const THEMES = {
    word: { title: 'The letter arcade', eyebrow: 'INSERT A LITTLE BRAINPOWER', note: 'THE LETTER ARCADE', color: '#160e2c' },
    rift: { title: 'Enter the Rift', eyebrow: 'LEAGUE OF LEGENDS', note: 'THE CHAMPION ARCHIVE', color: '#061319' },
    dex: { title: 'Pokédex discovery', eyebrow: 'POKÉMON FIELD GUIDE', note: 'POKÉDEX // DAILY SCAN', color: '#082634' }
  };
  const WORDS = new Set(D.validWords.split(' '));
  const MAPS = Object.fromEntries(GAME_KEYS.filter(key => key !== 'word').map(key => [key, new Map(META[key].items.map(item => [item.id, item]))]));
  const categoryOf = key => META[key]?.category || 'word';
  const variantOf = key => key === 'word' ? '' : key.slice(categoryOf(key).length + 1);
  const validVariant = (category, variant) => Boolean(VARIANTS[category]?.some(meta => variantOf(meta.id) === variant));
  const hashFor = (category, variant) => category === 'word' ? 'word' : `${category}-${variant}`;
  const readHash = () => {
    const raw = location.hash.slice(1).toLowerCase();
    if (raw === 'word') return { category: 'word', variant: '' };
    for (const category of ['rift', 'dex']) {
      if (raw === category) return { category, variant: variantOf(VARIANTS[category][0].id) };
      if (raw.startsWith(`${category}-`) && validVariant(category, raw.slice(category.length + 1))) return { category, variant: raw.slice(category.length + 1) };
    }
    return { category: 'word', variant: '' };
  };
  const initialHash = readHash();
  let today = E.dateKey(), resetAt = E.nextReset(), mode = initialHash.category;
  let variant = { rift: initialHash.category === 'rift' ? initialHash.variant : 'clues', dex: initialHash.category === 'dex' ? initialHash.variant : 'clues' };
  let round = 0, typedWord = '', states = {}, lastReveal = '', letterPulse = -1, toastTimer, storageWarned = false, suggestions = [], selectedSuggestion = -1;
  const memory = new Map();
  const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const activeKey = () => mode === 'word' ? 'word' : `${mode}_${variant[mode]}`;
  function addDays(key, amount) {
    const date = new Date(`${key}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }
  const puzzleDate = () => addDays(today, round);
  const answer = (key = activeKey()) => E.dailyAnswer(META[key].items, puzzleDate(), round ? `${key}:practice:${round}` : META[key].seed);
  const answerId = key => key === 'word' ? answer(key) : answer(key).id;
  const stateKey = key => `daily-queue:v3:${today}:${round}:${key}`;
  const legacyStateKeys = key => {
    if (round !== 0) return [];
    if (key === 'rift_clues') return [`daily-queue:v2:${today}:0:rift`, `daily-queue:v1:${today}:rift`];
    if (key === 'dex_clues') return [`daily-queue:v2:${today}:0:dex`, `daily-queue:v1:${today}:dex`];
    if (key === 'word') return [`daily-queue:v2:${today}:0:word`, `daily-queue:v1:${today}:word`];
    return [];
  };
  const roundKey = () => `daily-queue:v2:round:${today}`;
  const gameStatus = key => E.status(states[key]?.guesses || [], answerId(key), META[key].max);
  function warnStorage() {
    if (storageWarned) return;
    storageWarned = true;
    toast('Browser storage is unavailable. Progress will last only while this tab stays open.');
  }
  function loadState(key) {
    let raw;
    try { raw = localStorage.getItem(stateKey(key)); } catch { warnStorage(); }
    if (!raw) {
      for (const legacy of legacyStateKeys(key)) {
        try { raw = localStorage.getItem(legacy); } catch { warnStorage(); }
        if (raw) break;
      }
    }
    if (!raw) raw = memory.get(stateKey(key));
    let s;
    try { s = JSON.parse(raw); } catch { s = null; }
    const valid = key === 'word' ? x => typeof x === 'string' && WORDS.has(x) && /^[a-z]{5}$/.test(x) : x => MAPS[key].has(x);
    let guesses = Array.isArray(s?.guesses) ? [...new Set(s.guesses.filter(valid))].slice(0, META[key].max) : [];
    const winAt = guesses.indexOf(answerId(key));
    if (winAt >= 0) guesses = guesses.slice(0, winAt + 1);
    return { guesses, hint: Boolean(s?.hint) && guesses.length >= 3 };
  }
  function saveState(key) {
    const raw = JSON.stringify(states[key]);
    memory.set(stateKey(key), raw);
    try { localStorage.setItem(stateKey(key), raw); } catch { warnStorage(); }
  }
  function loadRound() {
    try { round = Math.max(0, Number.parseInt(localStorage.getItem(roundKey()) || '0', 10) || 0); } catch { round = 0; warnStorage(); }
  }
  function saveRound() {
    memory.set(roundKey(), String(round));
    try { localStorage.setItem(roundKey(), String(round)); } catch { warnStorage(); }
  }
  function loadAll() { for (const key of GAME_KEYS) states[key] = loadState(key); }
  function toast(message) {
    $('toast').textContent = message; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500);
  }
  function message(text, shake = false) {
    $('game-message').textContent = text;
    if (shake) { const board = document.querySelector('.word-board'); board?.classList.remove('shake'); void board?.offsetWidth; board?.classList.add('shake'); }
  }
  function checkDay() {
    const next = E.dateKey();
    if (next === today) return false;
    today = next; resetAt = E.nextReset(); round = 0; saveRound(); typedWord = ''; lastReveal = ''; loadAll(); render();
    toast('A fresh daily lineup is ready. Good luck!'); return true;
  }
  function tick() {
    checkDay();
    const seconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
    const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
    $('countdown').textContent = [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
  }
  function switchGame(next, focus = false) {
    if (META[next]) {
      mode = categoryOf(next);
      if (mode !== 'word') variant[mode] = variantOf(next);
    } else if (MODES.includes(next)) {
      mode = next;
    } else return;
    lastReveal = ''; message(''); closeSuggestions();
    try { history.replaceState(null, '', `#${hashFor(mode, variant[mode])}`); } catch { /* file previews can forbid history changes */ }
    render();
    if (focus) { const target = mode === 'word' ? $('game-panel') : $('guess-input'); target?.focus({ preventScroll: true }); }
  }
  function switchVariant(next, focus = false) {
    if (mode === 'word' || !validVariant(mode, next)) return;
    variant[mode] = next; lastReveal = ''; message(''); closeSuggestions();
    try { history.replaceState(null, '', `#${hashFor(mode, variant[mode])}`); } catch { /* file previews can forbid history changes */ }
    render();
    if (focus) $('guess-input')?.focus({ preventScroll: true });
  }
  function render() {
    const key = activeKey(), meta = META[key], theme = THEMES[mode];
    document.body.dataset.theme = mode;
    $('theme-heading').innerHTML = `${theme.title}<span>.</span>`;
    $('theme-eyebrow').textContent = theme.eyebrow;
    $('theme-header-note').textContent = theme.note;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', theme.color);
    $('dex-device-status').textContent = ['dex_clues', 'dex_silhouette', 'dex_types'].some(game => gameStatus(game) === 'won') ? 'ENTRY IDENTIFIED' : 'SCANNER READY';
    $('dex-scan-number').textContent = `NO. ${Math.max(1, E.dayNumber(today) + 1).toString().padStart(3, '0')}`;
    $('date-label').textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: E.ZONE }).format(new Date());
    $('edition-label').textContent = round ? `Practice +${round}` : `Daily #${Math.max(1, E.dayNumber(today) + 1).toString().padStart(3, '0')}`;
    for (const m of MODES) {
      const tab = $(`tab-${m}`), active = mode === m;
      tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
    }
    $('game-panel').setAttribute('aria-labelledby', `tab-${mode}`);
    $('game-panel').dataset.mode = mode;
    $('game-panel').dataset.game = key;
    $('game-kicker').textContent = meta.kicker; $('game-title').textContent = meta.title;
    $('game-description').textContent = meta.description;
    $('attempt-counter').textContent = `${states[key].guesses.length} / ${meta.max}`;
    $('legend-extra').textContent = meta.type === 'word' ? 'Yellow letters belong in a different spot.' : meta.type === 'silhouette' ? 'Search the shadow. The answer is revealed when you solve it.' : 'Green is exact. Yellow means a partial match. Arrows point toward the answer.';
    $('game-message').textContent = '';
    renderVariantPicker();
    if (meta.type === 'word') renderWord();
    else if (meta.type === 'silhouette') renderSilhouette(key);
    else renderRoster(key);
    renderResult(key); renderSidebar();
  }
  function renderVariantPicker() {
    const picker = $('variant-picker');
    if (mode === 'word') { picker.hidden = true; picker.innerHTML = ''; return; }
    const key = activeKey();
    picker.hidden = false;
    picker.setAttribute('aria-label', `${THEMES[mode].title} games`);
    picker.innerHTML = VARIANTS[mode].map(meta => `<button class="variant-button ${meta.id === key ? 'active' : ''}" type="button" role="tab" aria-selected="${meta.id === key}" data-variant="${variantOf(meta.id)}"><span>${esc(meta.label)}</span><small>${meta.max} tries</small></button>`).join('');
    picker.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => switchVariant(button.dataset.variant, true)));
  }
  function renderWord() {
    const guesses = states.word.guesses, target = answer('word'), keyColors = {};
    const rank = { miss: 1, partial: 2, match: 3 };
    let tiles = '';
    for (let row = 0; row < 6; row++) {
      const word = guesses[row] || (row === guesses.length && gameStatus('word') === 'playing' ? typedWord : '');
      const score = guesses[row] ? E.scoreWord(word, target) : null;
      for (let col = 0; col < 5; col++) {
        const c = word[col] || '', color = score?.[col] || '';
        if (score && (!keyColors[c] || rank[color] > rank[keyColors[c]])) keyColors[c] = color;
        const reveal = lastReveal === `word:${row}` ? ' reveal' : '';
        const pulse = row === guesses.length && c && col === letterPulse ? ' letter-pop' : '';
        const mark = color === 'match' ? '✓' : color === 'partial' ? '·' : color ? '×' : '';
        const accessible = color === 'match' ? 'correct spot' : color === 'partial' ? 'wrong spot' : color ? 'not in word' : c ? 'not submitted' : 'empty';
        tiles += `<div class="tile ${color || (c ? 'filled' : '')}${row === guesses.length ? ' active-row' : ''}${reveal}${pulse}" style="--i:${col}" role="img" aria-label="Row ${row + 1}, letter ${col + 1}: ${c ? c.toUpperCase() + ', ' : ''}${accessible}">${c.toUpperCase()}${mark ? `<span class="tile-mark" aria-hidden="true">${mark}</span>` : ''}</div>`;
      }
    }
    const keyboard = ['qwertyuiop', 'asdfghjkl', '↵zxcvbnm⌫'].map(row => `<div class="key-row">${[...row].map(key => `<button class="key ${key === '↵' || key === '⌫' ? 'wide' : ''} ${keyColors[key] || ''}" data-key="${key}" aria-label="${key === '↵' ? 'Submit guess' : key === '⌫' ? 'Delete letter' : key.toUpperCase()}" ${gameStatus('word') !== 'playing' ? 'disabled' : ''}>${key === '↵' ? 'ENTER' : key}</button>`).join('')}</div>`).join('');
    $('game-content').innerHTML = `<div class="word-board" aria-label="Word puzzle, six rows of five letters">${tiles}</div><div class="keyboard" aria-label="Letter keyboard">${keyboard}</div>`;
    $('game-content').querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => inputWord(button.dataset.key)));
    lastReveal = ''; letterPulse = -1;
  }
  function inputWord(key) {
    if (checkDay() || gameStatus('word') !== 'playing') return;
    message('');
    if (key === '↵' || key === 'Enter') { submitWord(typedWord); return; }
    if (key === '⌫' || key === 'Backspace' || key === 'Delete') { letterPulse = Math.max(0, typedWord.length - 1); typedWord = typedWord.slice(0, -1); }
    else if (/^[a-z]$/i.test(key) && typedWord.length < 5) { typedWord += key.toLowerCase(); letterPulse = typedWord.length - 1; }
    renderWord();
  }
  function submitWord(value) {
    if (checkDay()) return { error: 'The daily puzzle just changed. Try again.' };
    states.word = loadState('word');
    if (gameStatus('word') !== 'playing') { render(); return { error: 'This puzzle is finished.' }; }
    const guess = String(value).trim().toLowerCase();
    if (!/^[a-z]{5}$/.test(guess)) { message('Use five letters.', true); return { error: 'Use five letters.' }; }
    if (!WORDS.has(guess)) { message('That word isn’t in this dictionary.', true); return { error: 'Word not in dictionary.' }; }
    if (states.word.guesses.includes(guess)) { message('You already tried that word.', true); return { error: 'Already guessed.' }; }
    states.word.guesses.push(guess); typedWord = ''; saveState('word'); lastReveal = `word:${states.word.guesses.length - 1}`; render();
    return { guess, feedback: E.scoreWord(guess, answer('word')), status: gameStatus('word') };
  }
  function portrait(item, key, extra = '') {
    const category = categoryOf(key), src = window.QueueArt?.[category]?.[item.id];
    return src ? `<img src="${src}" alt="" class="portrait ${category === 'rift' ? 'champion' : ''} ${extra}" width="36" height="36" loading="lazy">` : '<span class="portrait-missing" aria-hidden="true">?</span>';
  }
  function formatValue(value, field) { return `${field.prefix || ''}${Array.isArray(value) ? value.join(' / ') : value}${field.suffix || ''}`; }
  function clueRow(key, id, index) {
    const guess = MAPS[key].get(id), target = answer(key), fields = META[key].fields;
    return `<tr class="${lastReveal === `${key}:${index}` ? 'reveal' : ''}"><td>${portrait(guess, key)}${esc(guess.name)}</td>${fields.map(f => {
      const result = E.compare(guess[f.key], target[f.key]);
      const tag = result === 'higher' ? '↑ Higher' : result === 'lower' ? '↓ Lower' : result === 'match' ? '✓ Match' : result === 'partial' ? '~ Some' : '× No';
      return `<td class="${result}">${esc(formatValue(guess[f.key], f))}<span class="clue-tag">${tag}</span></td>`;
    }).join('')}</tr>`;
  }
  function renderGuessForm(key, finished) {
    if (finished) return '';
    const noun = META[key].category === 'rift' ? 'champion' : 'Pokémon';
    return `<form class="guess-form" id="guess-form" autocomplete="off"><label for="guess-input" class="visually-hidden">${noun} name</label><div class="input-row"><input class="guess-input" id="guess-input" type="text" placeholder="Search a ${noun}…" spellcheck="false" autocapitalize="off" role="combobox" aria-expanded="false" aria-controls="suggestions" aria-autocomplete="list" maxlength="60"><button class="primary-button" type="submit">Guess</button></div><div class="suggestions" id="suggestions" role="listbox" aria-label="Matching names" hidden></div><p class="roster-caption">${META[key].category === 'rift' ? `${META[key].items.length} champions · Data Dragon ${D.version}` : `${META[key].items.length} Kanto Pokémon · Original 151 only`}</p></form>`;
  }
  function renderHint(key) {
    const state = states[key];
    if (META[key].type === 'word' || gameStatus(key) !== 'playing') return '';
    const remaining = Math.max(0, 3 - state.guesses.length);
    return `<div class="hint-row"><button class="hint-button" id="hint-button" ${state.guesses.length < 3 || state.hint ? 'disabled' : ''}>${state.hint ? 'Hint revealed' : 'Reveal a hint'}</button><p>${state.guesses.length < 3 ? `Unlocks after ${remaining} more ${remaining === 1 ? 'guess' : 'guesses'}.` : 'Using a hint is shown in your shared result.'}</p></div>${state.hint ? `<div class="hint-content">${esc(META[key].hintLabel)}: <strong>${esc(answer(key).title || answer(key).genus)}</strong></div>` : ''}`;
  }
  function attachGuessEvents() {
    if (!$('guess-form')) return;
    $('guess-input').addEventListener('input', updateSuggestions);
    $('guess-input').addEventListener('keydown', suggestionKeys);
    $('guess-form').addEventListener('submit', event => { event.preventDefault(); const selected = suggestions[selectedSuggestion]; submitRoster(selected?.id || $('guess-input').value); });
    $('hint-button')?.addEventListener('click', revealHint);
  }
  function renderRoster(key) {
    const state = states[key], finished = gameStatus(key) !== 'playing', fields = META[key].fields;
    const table = `<div class="clue-scroll" tabindex="0" role="region" aria-label="Guess clues; scroll horizontally for all columns"><table class="clue-table"><thead><tr><th scope="col">Your guess</th>${fields.map(f => `<th scope="col">${esc(f.label)}</th>`).join('')}</tr></thead><tbody>${state.guesses.map((_, i) => clueRow(key, state.guesses[state.guesses.length - 1 - i], state.guesses.length - 1 - i)).join('')}</tbody></table></div>`;
    const empty = !state.guesses.length ? `<div class="empty-board"><span aria-hidden="true">?</span><strong>Every guess gives you a clue.</strong><p>Start with any ${META[key].category === 'rift' ? 'champion' : 'Kanto Pokémon'} you know. The comparisons will narrow it down.</p></div>` : '';
    $('game-content').innerHTML = renderGuessForm(key, finished) + table + empty + renderHint(key);
    attachGuessEvents();
    lastReveal = '';
  }
  function renderSilhouette(key) {
    const status = gameStatus(key), finished = status !== 'playing', target = answer(key);
    const label = status === 'won' ? 'ENTRY IDENTIFIED' : status === 'lost' ? 'SIGNAL COMPLETE' : 'SIGNAL MASKED';
    const stage = `<div class="silhouette-stage ${finished ? 'revealed' : ''}" aria-label="${finished ? 'The answer image is revealed' : 'A hidden silhouette'}"><div class="silhouette-scanline"></div>${portrait(target, key, 'silhouette-art')}<span class="silhouette-label">${label}</span></div>`;
    $('game-content').innerHTML = stage + renderGuessForm(key, finished) + renderHint(key);
    attachGuessEvents();
    lastReveal = '';
  }
  function updateSuggestions() {
    const key = activeKey(), meta = META[key], input = $('guess-input'), list = $('suggestions'), search = E.normalize(input.value);
    selectedSuggestion = -1;
    suggestions = search ? meta.items.filter(x => !states[key].guesses.includes(x.id) && (E.normalize(x.name).includes(search) || E.normalize(x.id).includes(search))).sort((a, b) => Number(E.normalize(b.name).startsWith(search)) - Number(E.normalize(a.name).startsWith(search)) || a.name.localeCompare(b.name)).slice(0, 8) : [];
    list.hidden = !suggestions.length; input.setAttribute('aria-expanded', String(!!suggestions.length)); input.removeAttribute('aria-activedescendant');
    list.innerHTML = suggestions.map((x, i) => `<div class="suggestion" role="option" id="suggestion-${i}" data-index="${i}" aria-selected="false">${portrait(x, key)}<strong>${esc(x.name)}</strong><span>${meta.category === 'rift' ? esc(x.roles.join(' / ')) : '#' + String(x.number).padStart(3, '0')}</span></div>`).join('');
    list.querySelectorAll('[data-index]').forEach(row => row.addEventListener('click', () => submitRoster(suggestions[Number(row.dataset.index)].id)));
  }
  function suggestionKeys(event) {
    if (event.key === 'Escape') { closeSuggestions(); return; }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !suggestions.length) return;
    event.preventDefault();
    selectedSuggestion = (selectedSuggestion + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length;
    document.querySelectorAll('.suggestion').forEach((row, i) => { row.classList.toggle('selected', i === selectedSuggestion); row.setAttribute('aria-selected', String(i === selectedSuggestion)); });
    $('guess-input').setAttribute('aria-activedescendant', `suggestion-${selectedSuggestion}`);
    $(`suggestion-${selectedSuggestion}`).scrollIntoView({ block: 'nearest' });
  }
  function closeSuggestions() { const list = $('suggestions'); if (list) list.hidden = true; $('guess-input')?.setAttribute('aria-expanded', 'false'); $('guess-input')?.removeAttribute('aria-activedescendant'); suggestions = []; selectedSuggestion = -1; }
  function submitRoster(value) {
    if (checkDay()) return { error: 'The daily puzzle just changed. Try again.' };
    const key = activeKey(), meta = META[key];
    if (meta.type === 'word') return { error: 'Choose a themed game.' };
    states[key] = loadState(key);
    if (gameStatus(key) !== 'playing') { render(); return { error: 'This puzzle is finished.' }; }
    const normalized = E.normalize(value), guess = meta.items.find(x => x.id === value || E.normalize(x.name) === normalized || E.normalize(x.id) === normalized);
    if (!guess) { message(`Choose a ${meta.category === 'rift' ? 'champion' : 'Kanto Pokémon'} from the suggestions.`); return { error: 'Name not found.' }; }
    if (states[key].guesses.includes(guess.id)) { message('You already tried that one. Pick another.'); return { error: 'Already guessed.' }; }
    states[key].guesses.push(guess.id); saveState(key); lastReveal = `${key}:${states[key].guesses.length - 1}`; render();
    $('guess-input')?.focus({ preventScroll: true });
    return { guess: guess.name, feedback: meta.fields?.map(f => ({ field: f.label, value: guess[f.key], result: E.compare(guess[f.key], answer(key)[f.key]) })) || [guess.id === answer(key).id ? 'match' : 'miss'], status: gameStatus(key) };
  }
  function revealHint() {
    if (checkDay() || mode === 'word') return { error: 'Hint unavailable.' };
    const key = activeKey();
    states[key] = loadState(key);
    if (states[key].guesses.length < 3 || gameStatus(key) !== 'playing') return { error: 'Hints unlock after three guesses during an active puzzle.' };
    states[key].hint = true; saveState(key); render();
    return { hint: answer(key).title || answer(key).genus };
  }
  function renderResult(key) {
    const meta = META[key], status = gameStatus(key), state = states[key];
    if (status === 'playing') { $('game-result').innerHTML = ''; return; }
    const target = answer(key), name = key === 'word' ? target.toUpperCase() : target.name;
    const heading = status === 'lost' ? 'There’s always tomorrow.' : key === 'word' ? (state.guesses.length === 1 ? 'One guess. Unreal.' : 'That’s the word.') : meta.type === 'silhouette' ? (meta.category === 'rift' ? 'Champion revealed.' : 'Pokédex entry revealed.') : meta.category === 'rift' ? 'Champion identified.' : 'Pokédex entry secured.';
    const next = GAME_KEYS.find(candidate => candidate !== key && gameStatus(candidate) === 'playing');
    $('game-result').innerHTML = `<div class="result-card ${status === 'won' ? 'solved' : 'lost'}"><div class="result-head">${key === 'word' ? '' : portrait(target, key)}<div><h3>${heading}</h3><span class="answer-name">${esc(name)}</span></div></div><p>${status === 'won' ? `Solved in ${state.guesses.length} of ${meta.max} guesses${state.hint ? ', with a hint' : ''}. Send it to the group chat.` : `Today’s answer was ${esc(name)}. A fresh puzzle arrives at midnight Central.`}</p><div class="result-actions"><button class="primary-button" id="share-game">Copy result</button>${next ? `<button class="outline-button" id="next-game" data-next="${next}">Play ${esc(META[next].label)}</button>` : '<button class="outline-button" id="all-results">Copy daily results</button>'}</div></div>`;
    $('share-game').addEventListener('click', () => copyResults(key));
    $('next-game')?.addEventListener('click', event => switchGame(event.currentTarget.dataset.next, true));
    $('all-results')?.addEventListener('click', () => copyResults());
  }
  function categorySummary(category) {
    const keys = GAME_KEYS.filter(key => categoryOf(key) === category);
    return { won: keys.filter(key => gameStatus(key) === 'won').length, total: keys.length };
  }
  function queueLabel(key) { return key === 'word' ? 'Wordle' : `${META[key].category === 'rift' ? 'Rift' : 'Dex'} · ${META[key].label}`; }
  function renderSidebar() {
    const total = GAME_KEYS.length, won = GAME_KEYS.filter(key => gameStatus(key) === 'won').length;
    $('completion-label').textContent = `${won} / ${total}`; $('progress-fill').style.width = `${won / total * 100}%`; $('daily-progress').setAttribute('aria-valuemax', String(total)); $('daily-progress').setAttribute('aria-valuenow', String(won));
    $('queue-title').textContent = round ? `Practice lineup +${round}` : `Your daily ${total}`;
    $('lineup-note').textContent = round ? 'One Wordle, three Rift games, and three Kanto games. Keep going.' : "Same puzzles. Everyone's own guesses.";
    $('refresh-lineup').innerHTML = round ? '<span aria-hidden="true">↻</span> Refresh again' : '<span aria-hidden="true">↻</span> Refresh lineup';
    $('return-daily').hidden = round === 0;
    $('queue-list').innerHTML = GAME_KEYS.map(key => {
      const status = gameStatus(key), n = states[key].guesses.length;
      const label = status === 'won' ? `${n}/${META[key].max} solved` : status === 'lost' ? 'Try tomorrow' : n ? `${n} ${n === 1 ? 'guess' : 'guesses'} in` : 'Ready to play';
      return `<button class="queue-row" data-open="${key}"><span class="queue-mini ${categoryOf(key)}" aria-hidden="true">${categoryOf(key) === 'word' ? 'W' : categoryOf(key) === 'rift' ? 'R' : 'D'}</span><span>${esc(queueLabel(key))}</span><span class="${status}">${label}</span></button>`;
    }).join('');
    document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => switchGame(button.dataset.open, true)));
    for (const category of MODES) { const summary = categorySummary(category), target = $(`tab-status-${category}`); target.textContent = summary.won === summary.total ? '✓' : `${summary.won}/${summary.total}`; target.classList.toggle('done', summary.won === summary.total); }
    $('share-day').innerHTML = `${won === total ? 'Perfect queue. Copy results' : 'Copy daily results'} <span aria-hidden="true">▤</span>`;
  }
  function feedbackSymbols(key, id) {
    const target = answer(key);
    if (key === 'word') return E.scoreWord(id, target);
    if (META[key].type === 'silhouette') return [id === target.id ? 'match' : 'miss'];
    const guess = MAPS[key].get(id);
    return META[key].fields.map(field => E.compare(guess[field.key], target[field.key]));
  }
  function shareText(single) {
    const keys = single ? [single] : GAME_KEYS;
    const lines = [`Daily Queue · ${round ? `Practice +${round} · ${today}` : today}`, ''];
    for (const key of keys) {
      const state = states[key], status = gameStatus(key);
      lines.push(`${queueLabel(key)} ${status === 'won' ? state.guesses.length : status === 'lost' ? 'X' : state.guesses.length ? state.guesses.length + ' so far' : '—'}/${META[key].max}${state.hint ? ' · hint used' : ''}`);
      for (const id of state.guesses) lines.push(feedbackSymbols(key, id).map(value => value === 'match' ? '🟩' : value === 'partial' ? '🟨' : '⬛').join(''));
      lines.push('');
    }
    if (/^https?:$/.test(location.protocol)) { const url = new URL(location.href); url.search = ''; url.hash = single ? hashFor(categoryOf(single), variantOf(single)) : ''; lines.push(url.href); }
    return lines.join('\n').trim();
  }
  async function copyResults(single) {
    const text = shareText(single);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text); toast('Copied. The group chat awaits.');
    } catch {
      openDialog('Your spoiler-free result', '<p>Copy the text below and send it to your friends.</p><textarea class="share-text" id="share-text" aria-label="Results to copy" readonly></textarea>');
      $('share-text').value = text; $('share-text').focus(); $('share-text').select();
    }
    return text;
  }
  function openDialog(title, html) { $('dialog-title').textContent = title; $('dialog-content').innerHTML = html; if (!$('info-dialog').open) $('info-dialog').showModal(); }
  function showHelp() {
    openDialog('One Wordle. Six themed games.', `<div class="help-step"><span>01</span><div><strong>Wordle · six guesses</strong><p>Find the five-letter word. Green is the right letter in the right spot. Yellow means the letter belongs elsewhere.</p></div></div><div class="help-step"><span>02</span><div><strong>Rift · three games</strong><p>Champion Clues compares five stats, Role Queue narrows the champion with three stats, and Champion Silhouette asks you to identify a shadow.</p></div></div><div class="help-step"><span>03</span><div><strong>Dex · original 151</strong><p>Kanto Clues compares Pokédex data, Type Scan focuses on type and color, and Who’s That Pokémon? uses a silhouette. Every Pokémon game is limited to Generation 1.</p></div></div><p>Hints unlock after three guesses in the themed games. The whole group gets the same daily lineup. Refresh starts a deterministic practice lineup whenever you want, while Back to today’s set restores the shared daily games.</p><p>Progress stays in this browser. Copy your colored results to compare with friends without spoiling the answers.</p>`);
  }
  $('help-button').addEventListener('click', showHelp);
  $('credits-button').addEventListener('click', () => openDialog('Made for the daily queue.', `<p>An independent fan project inspired by daily guessing games. Not affiliated with Wordle, LoLdle, Pokédle, Riot Games, Nintendo, Game Freak, or The Pokémon Company.</p><p>Champion data and portraits: <a href="https://developer.riotgames.com/docs/lol" target="_blank" rel="noopener noreferrer">Riot Games Data Dragon ${D.version}</a>. Pokémon data and sprites: <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokéAPI</a>. This build intentionally limits the playable Pokémon games to the original Kanto 151.</p><p>Guess dictionary: <a href="https://github.com/dwyl/english-words" target="_blank" rel="noopener noreferrer">dwyl/english-words</a>. Answer words are a separate curated list. Data snapshot: ${D.snapshot}.</p><p>Daily Queue isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.</p>`));
  $('close-dialog').addEventListener('click', () => $('info-dialog').close());
  $('info-dialog').addEventListener('click', event => { if (event.target === $('info-dialog')) { const rect = $('info-dialog').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('info-dialog').close(); } });
  $('share-day').addEventListener('click', () => copyResults());
  $('refresh-lineup').addEventListener('click', () => {
    round += 1; saveRound(); typedWord = ''; letterPulse = -1; lastReveal = ''; closeSuggestions(); loadAll(); render();
    toast(`Practice lineup +${round} loaded. Keep going!`);
  });
  $('return-daily').addEventListener('click', () => {
    round = 0; saveRound(); typedWord = ''; letterPulse = -1; lastReveal = ''; closeSuggestions(); loadAll(); render();
    toast("Today's lineup restored.");
  });
  document.querySelectorAll('[data-game]').forEach(tab => {
    tab.addEventListener('click', () => switchGame(tab.dataset.game, true));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? MODES.length - 1 : (MODES.indexOf(mode) + (event.key === 'ArrowRight' ? 1 : MODES.length - 1)) % MODES.length;
      switchGame(MODES[index]); $(`tab-${MODES[index]}`).focus();
    });
  });
  document.addEventListener('keydown', event => {
    if (mode !== 'word' || $('info-dialog').open || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const target = event.target instanceof Element ? event.target : document.body;
    const keyButton = target.closest('button[data-key]');
    if (target.closest('input,textarea,select,a') || (target.closest('button') && !keyButton)) return;
    if (/^[a-z]$/i.test(event.key) || ['Enter', 'NumpadEnter', 'Backspace', 'Delete'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); inputWord(event.key === 'NumpadEnter' ? 'Enter' : event.key); }
  }, true);
  document.addEventListener('click', event => { if (!(event.target instanceof Element) || !event.target.closest('.guess-form')) closeSuggestions(); });
  window.addEventListener('hashchange', () => { const next = readHash(); mode = next.category; if (mode !== 'word') variant[mode] = next.variant; render(); });
  window.addEventListener('storage', event => { if (event.key === null || event.key === roundKey() || GAME_KEYS.some(key => event.key === stateKey(key))) { loadRound(); loadAll(); render(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkDay(); loadAll(); render(); tick(); } });
  window.addEventListener('focus', () => { if (!checkDay()) { loadAll(); render(); } });
  loadRound(); loadAll(); render(); tick(); setInterval(tick, 1000);
  // Progressive enhancement: unsupported browsers simply use the normal UI.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* optional API */ } };
    register({ name: 'read_daily_queue', title: 'Read puzzle progress', description: 'Read the current daily or practice lineup and saved guesses without revealing unsolved answers.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => { checkDay(); return { date: today, lineup: round ? `practice +${round}` : 'daily', practiceRound: round, selectedGame: activeKey(), games: GAME_KEYS.map(key => ({ game: key, category: categoryOf(key), name: META[key].name, status: gameStatus(key), guesses: [...states[key].guesses], maxGuesses: META[key].max, hintUsed: states[key].hint })) }; } });
    register({ name: 'submit_daily_guess', title: 'Submit a puzzle guess', description: 'Select one of the Wordle, League, or Kanto Pokémon games and submit one guess, consuming an attempt if valid.', inputSchema: { type: 'object', properties: { game: { type: 'string', enum: GAME_KEYS }, guess: { type: 'string', minLength: 1, maxLength: 60 } }, required: ['game', 'guess'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: input => { if (!input || !META[input.game] || typeof input.guess !== 'string' || input.guess.length > 60 || !input.guess.trim()) return { error: 'Provide a valid game and guess.' }; switchGame(input.game); return input.game === 'word' ? submitWord(input.guess) : submitRoster(input.guess); } });
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
