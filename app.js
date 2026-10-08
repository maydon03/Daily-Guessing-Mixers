(() => {
  'use strict';
  const E = window.QueueEngine, D = window.QueueData;
  const $ = id => document.getElementById(id);
  if (!E || !D) { $('game-content').textContent = 'A game file is missing. Please refresh, or check that data.js and engine.js were uploaded beside index.html.'; return; }
  const MODES = ['word', 'rift', 'dex'];
  const META = {
    word: { name: 'Word', max: 6, title: 'Make every letter count.', description: "Find today's five-letter word. Your colors are your clues.", kicker: 'DAILY WORD' },
    rift: { name: 'Rift', max: 8, title: 'Name the champion.', description: 'Compare each guess with the mystery champion. Arrows point toward the answer.', kicker: 'DAILY LEAGUE CHAMPION' },
    dex: { name: 'Dex', max: 8, title: "Who's that Pokémon?", description: 'Use the types, generation, and size clues to find today’s Pokémon.', kicker: 'DAILY POKÉMON' }
  };
  const THEMES = {
    word: { title: 'The letter arcade', eyebrow: 'INSERT A LITTLE BRAINPOWER', note: 'THE LETTER ARCADE', color: '#160e2c' },
    rift: { title: 'Enter the Rift', eyebrow: 'LEAGUE OF LEGENDS', note: 'THE CHAMPION ARCHIVE', color: '#061319' },
    dex: { title: 'Pokédex discovery', eyebrow: 'POKÉMON FIELD GUIDE', note: 'POKÉDEX // DAILY SCAN', color: '#082634' }
  };
  const FIELDS = {
    rift: [{ key: 'roles', label: 'Class' }, { key: 'resource', label: 'Resource' }, { key: 'range', label: 'Atk. range' }, { key: 'speed', label: 'Move speed' }, { key: 'difficulty', label: 'Difficulty' }],
    dex: [{ key: 'types', label: 'Types' }, { key: 'generation', label: 'Gen.' }, { key: 'height', label: 'Height', suffix: ' m' }, { key: 'weight', label: 'Weight', suffix: ' kg' }, { key: 'color', label: 'Color' }]
  };
  const WORDS = new Set(D.validWords.split(' '));
  const MAPS = { rift: new Map(D.rift.map(x => [x.id, x])), dex: new Map(D.dex.map(x => [x.id, x])) };
  let today = E.dateKey(), resetAt = E.nextReset(), mode = MODES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'word';
  let round = 0, typedWord = '', states = {}, lastReveal = '', letterPulse = -1, toastTimer, storageWarned = false, suggestions = [], selectedSuggestion = -1;
  const memory = new Map();
  const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function addDays(key, amount) {
    const date = new Date(`${key}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }
  const puzzleDate = () => addDays(today, round);
  const answer = (m = mode) => E.dailyAnswer(m === 'word' ? D.answers : D[m], puzzleDate(), round ? `${m}:practice:${round}` : m);
  const answerId = m => m === 'word' ? answer(m) : answer(m).id;
  const stateKey = m => `daily-queue:v2:${today}:${round}:${m}`;
  const legacyStateKey = m => `daily-queue:v1:${today}:${m}`;
  const roundKey = () => `daily-queue:v2:round:${today}`;
  const gameStatus = m => E.status(states[m].guesses, answerId(m), META[m].max);
  function warnStorage() {
    if (storageWarned) return;
    storageWarned = true;
    toast('Browser storage is unavailable. Progress will last only while this tab stays open.');
  }
  function loadState(m) {
    let raw;
    try { raw = localStorage.getItem(stateKey(m)); } catch { warnStorage(); }
    if (!raw && round === 0) {
      try { raw = localStorage.getItem(legacyStateKey(m)); } catch { warnStorage(); }
    }
    if (!raw) raw = memory.get(stateKey(m));
    let s;
    try { s = JSON.parse(raw); } catch { s = null; }
    const valid = m === 'word' ? x => typeof x === 'string' && WORDS.has(x) && /^[a-z]{5}$/.test(x) : x => MAPS[m].has(x);
    let guesses = Array.isArray(s?.guesses) ? [...new Set(s.guesses.filter(valid))].slice(0, META[m].max) : [];
    const winAt = guesses.indexOf(answerId(m));
    if (winAt >= 0) guesses = guesses.slice(0, winAt + 1);
    return { guesses, hint: Boolean(s?.hint) && guesses.length >= 3 };
  }
  function saveState(m) {
    const raw = JSON.stringify(states[m]);
    memory.set(stateKey(m), raw);
    try { localStorage.setItem(stateKey(m), raw); } catch { warnStorage(); }
  }
  function loadRound() {
    try { round = Math.max(0, Number.parseInt(localStorage.getItem(roundKey()) || '0', 10) || 0); } catch { round = 0; warnStorage(); }
  }
  function saveRound() {
    memory.set(roundKey(), String(round));
    try { localStorage.setItem(roundKey(), String(round)); } catch { warnStorage(); }
  }
  function loadAll() { for (const m of MODES) states[m] = loadState(m); }
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
    if (!MODES.includes(next)) return;
    mode = next; lastReveal = ''; message('');
    try { history.replaceState(null, '', `#${mode}`); } catch { /* file previews can forbid history changes */ }
    render();
    if (focus) { const target = mode === 'word' ? $('game-panel') : $('guess-input'); target?.focus({ preventScroll: true }); }
  }
  function render() {
    const theme = THEMES[mode];
    document.body.dataset.theme = mode;
    $('theme-heading').innerHTML = `${theme.title}<span>.</span>`;
    $('theme-eyebrow').textContent = theme.eyebrow;
    $('theme-header-note').textContent = theme.note;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', theme.color);
    $('dex-device-status').textContent = gameStatus('dex') === 'won' ? 'ENTRY IDENTIFIED' : gameStatus('dex') === 'lost' ? 'SCAN COMPLETE' : 'SCANNER READY';
    $('dex-scan-number').textContent = `NO. ${Math.max(1, E.dayNumber(today) + 1).toString().padStart(3, '0')}`;
    $('date-label').textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: E.ZONE }).format(new Date());
    $('edition-label').textContent = round ? `Practice +${round}` : `Daily #${Math.max(1, E.dayNumber(today) + 1).toString().padStart(3, '0')}`;
    for (const m of MODES) {
      const tab = $(`tab-${m}`), active = mode === m;
      tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
    }
    $('game-panel').setAttribute('aria-labelledby', `tab-${mode}`);
    $('game-panel').dataset.mode = mode;
    $('game-kicker').textContent = META[mode].kicker; $('game-title').textContent = META[mode].title;
    $('game-description').textContent = META[mode].description;
    $('attempt-counter').textContent = `${states[mode].guesses.length} / ${META[mode].max}`;
    $('legend-extra').textContent = mode === 'word' ? 'Yellow letters belong in a different spot.' : '↑ Go higher. ↓ Go lower. Yellow means the lists share at least one item.';
    $('game-message').textContent = '';
    if (mode === 'word') renderWord(); else renderRoster();
    renderResult(); renderSidebar();
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
  function portrait(item, m, extra = '') { return `<img src="${window.QueueArt[m][item.id]}" alt="" class="portrait ${m === 'rift' ? 'champion' : ''} ${extra}" width="36" height="36" loading="lazy">`; }
  function formatValue(value, field) { return (Array.isArray(value) ? value.join(' / ') : value) + (field.suffix || ''); }
  function clueRow(id, index) {
    const guess = MAPS[mode].get(id), target = answer();
    return `<tr class="${lastReveal === `${mode}:${index}` ? 'reveal' : ''}"><td>${portrait(guess, mode)}${esc(guess.name)}</td>${FIELDS[mode].map(f => {
      const result = E.compare(guess[f.key], target[f.key]);
      const tag = result === 'higher' ? '↑ Higher' : result === 'lower' ? '↓ Lower' : result === 'match' ? '✓ Match' : result === 'partial' ? '~ Some' : '× No';
      return `<td class="${result}">${esc(formatValue(guess[f.key], f))}<span class="clue-tag">${tag}</span></td>`;
    }).join('')}</tr>`;
  }
  function renderRoster() {
    const s = states[mode], finished = gameStatus(mode) !== 'playing';
    const description = mode === 'rift' ? `${D.rift.length} champions · Data Dragon ${D.version} · Base stats` : `${D.dex.length.toLocaleString()} Pokémon · Generations 1–9 · Standard forms`;
    const form = finished ? '' : `<form class="guess-form" id="guess-form" autocomplete="off"><label for="guess-input" class="visually-hidden">${mode === 'rift' ? 'Champion' : 'Pokémon'} name</label><div class="input-row"><input class="guess-input" id="guess-input" type="text" placeholder="${mode === 'rift' ? 'Search a champion…' : 'Search a Pokémon…'}" spellcheck="false" autocapitalize="off" role="combobox" aria-expanded="false" aria-controls="suggestions" aria-autocomplete="list" maxlength="60"><button class="primary-button" type="submit">Guess</button></div><div class="suggestions" id="suggestions" role="listbox" aria-label="Matching names" hidden></div><p class="roster-caption">${description}</p></form>`;
    const table = `<div class="clue-scroll" tabindex="0" role="region" aria-label="Guess clues; scroll horizontally for all columns"><table class="clue-table"><thead><tr><th scope="col">Your guess</th>${FIELDS[mode].map(f => `<th scope="col">${f.label}</th>`).join('')}</tr></thead><tbody>${s.guesses.map((_, i) => clueRow(s.guesses[s.guesses.length - 1 - i], s.guesses.length - 1 - i)).join('')}</tbody></table></div>`;
    const empty = !s.guesses.length ? `<div class="empty-board"><span aria-hidden="true">?</span><strong>Every guess gives you a clue.</strong><p>Start with any ${mode === 'rift' ? 'champion' : 'Pokémon'} you know. The comparisons will narrow it down.</p></div>` : '';
    const hint = !finished ? `<div class="hint-row"><button class="hint-button" id="hint-button" ${s.guesses.length < 3 || s.hint ? 'disabled' : ''}>${s.hint ? 'Hint revealed' : 'Reveal a hint'}</button><p>${s.guesses.length < 3 ? `Unlocks after ${3 - s.guesses.length} more ${s.guesses.length === 2 ? 'guess' : 'guesses'}.` : 'Using a hint is shown in your shared result.'}</p></div>${s.hint ? `<div class="hint-content">${mode === 'rift' ? 'Champion title' : 'Pokédex category'}: <strong>${esc(mode === 'rift' ? answer().title : answer().genus)}</strong></div>` : ''}` : '';
    $('game-content').innerHTML = form + table + empty + hint;
    if (!finished) {
      $('guess-input').addEventListener('input', updateSuggestions);
      $('guess-input').addEventListener('keydown', suggestionKeys);
      $('guess-form').addEventListener('submit', event => { event.preventDefault(); const selected = suggestions[selectedSuggestion]; submitRoster(selected?.id || $('guess-input').value); });
      $('hint-button').addEventListener('click', revealHint);
    }
    lastReveal = '';
  }
  function updateSuggestions() {
    const input = $('guess-input'), list = $('suggestions'), search = E.normalize(input.value);
    selectedSuggestion = -1;
    suggestions = search ? D[mode].filter(x => !states[mode].guesses.includes(x.id) && (E.normalize(x.name).includes(search) || E.normalize(x.id).includes(search))).sort((a, b) => Number(E.normalize(b.name).startsWith(search)) - Number(E.normalize(a.name).startsWith(search)) || a.name.localeCompare(b.name)).slice(0, 8) : [];
    list.hidden = !suggestions.length; input.setAttribute('aria-expanded', String(!!suggestions.length)); input.removeAttribute('aria-activedescendant');
    list.innerHTML = suggestions.map((x, i) => `<div class="suggestion" role="option" id="suggestion-${i}" data-index="${i}" aria-selected="false">${portrait(x, mode)}<strong>${esc(x.name)}</strong><span>${mode === 'rift' ? esc(x.roles.join(' / ')) : '#' + String(x.number).padStart(3, '0')}</span></div>`).join('');
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
    const m = mode;
    if (m === 'word') return { error: 'Choose Rift or Dex.' };
    states[m] = loadState(m);
    if (gameStatus(m) !== 'playing') { render(); return { error: 'This puzzle is finished.' }; }
    const normalized = E.normalize(value), guess = D[m].find(x => x.id === value || E.normalize(x.name) === normalized || E.normalize(x.id) === normalized);
    if (!guess) { message(`Choose a ${m === 'rift' ? 'champion' : 'Pokémon'} from the suggestions.`); return { error: 'Name not found.' }; }
    if (states[m].guesses.includes(guess.id)) { message('You already tried that one. Pick another.'); return { error: 'Already guessed.' }; }
    states[m].guesses.push(guess.id); saveState(m); lastReveal = `${m}:${states[m].guesses.length - 1}`; render();
    $('guess-input')?.focus({ preventScroll: true });
    return { guess: guess.name, feedback: FIELDS[m].map(f => ({ field: f.label, value: guess[f.key], result: E.compare(guess[f.key], answer(m)[f.key]) })), status: gameStatus(m) };
  }
  function revealHint() {
    if (checkDay() || mode === 'word') return { error: 'Hint unavailable.' };
    states[mode] = loadState(mode);
    if (states[mode].guesses.length < 3 || gameStatus(mode) !== 'playing') return { error: 'Hints unlock after three guesses during an active puzzle.' };
    states[mode].hint = true; saveState(mode); render();
    return { hint: mode === 'rift' ? answer().title : answer().genus };
  }
  function renderResult() {
    const status = gameStatus(mode), s = states[mode];
    if (status === 'playing') { $('game-result').innerHTML = ''; return; }
    const target = answer(), name = mode === 'word' ? target.toUpperCase() : target.name;
    const heading = status === 'won' ? (s.guesses.length === 1 ? 'One guess. Unreal.' : mode === 'rift' ? 'Champion identified.' : mode === 'dex' ? 'Pokédex entry secured.' : 'That’s the word.') : 'There’s always tomorrow.';
    const next = MODES.find(m => m !== mode && gameStatus(m) === 'playing');
    $('game-result').innerHTML = `<div class="result-card ${status === 'won' ? 'solved' : 'lost'}"><div class="result-head">${mode === 'word' ? '' : portrait(target, mode)}<div><h3>${heading}</h3><span class="answer-name">${esc(name)}</span></div></div><p>${status === 'won' ? `Solved in ${s.guesses.length} of ${META[mode].max} guesses${s.hint ? ', with a hint' : ''}. Send it to the group chat.` : `Today’s answer was ${esc(name)}. A fresh puzzle arrives at midnight Central.`}</p><div class="result-actions"><button class="primary-button" id="share-game">Copy result</button>${next ? `<button class="outline-button" id="next-game" data-next="${next}">Play ${META[next].name}</button>` : '<button class="outline-button" id="all-results">Copy daily results</button>'}</div></div>`;
    $('share-game').addEventListener('click', () => copyResults(mode));
    $('next-game')?.addEventListener('click', event => switchGame(event.currentTarget.dataset.next, true));
    $('all-results')?.addEventListener('click', () => copyResults());
  }
  function renderSidebar() {
    const won = MODES.filter(m => gameStatus(m) === 'won').length;
    $('completion-label').textContent = `${won} / 3`; $('progress-fill').style.width = `${won / 3 * 100}%`; $('daily-progress').setAttribute('aria-valuenow', String(won));
    $('queue-title').textContent = round ? `Practice lineup +${round}` : 'Your daily three';
    $('lineup-note').textContent = round ? 'Practice rounds are for keeping the streak going.' : "Same puzzles. Everyone's own guesses.";
    $('refresh-lineup').innerHTML = round ? '<span aria-hidden="true">↻</span> Refresh again' : '<span aria-hidden="true">↻</span> Refresh lineup';
    $('return-daily').hidden = round === 0;
    $('queue-list').innerHTML = MODES.map(m => {
      const status = gameStatus(m), n = states[m].guesses.length;
      const label = status === 'won' ? `${n}/${META[m].max} solved` : status === 'lost' ? 'Try tomorrow' : n ? `${n} ${n === 1 ? 'guess' : 'guesses'} in` : 'Ready to play';
      return `<button class="queue-row" data-open="${m}"><span class="queue-mini ${m}" aria-hidden="true">${m[0].toUpperCase()}</span><span>${META[m].name}</span><span class="${status}">${label}</span></button>`;
    }).join('');
    document.querySelectorAll('[data-open]').forEach(x => x.addEventListener('click', () => switchGame(x.dataset.open, true)));
    MODES.forEach((m, i) => { const status = gameStatus(m), target = $(`tab-status-${m}`); target.textContent = status === 'won' ? '✓' : status === 'lost' ? '—' : `0${i + 1}`; target.classList.toggle('done', status === 'won'); });
    $('share-day').innerHTML = `${won === 3 ? 'Perfect day. Copy results' : 'Copy daily results'} <span aria-hidden="true">▤</span>`;
  }
  function shareText(single) {
    const modes = single ? [single] : MODES;
    const lines = [`Daily Queue · ${round ? `Practice +${round} · ${today}` : today}`, ''];
    for (const m of modes) {
      const state = states[m], status = gameStatus(m);
      lines.push(`${META[m].name} ${status === 'won' ? state.guesses.length : status === 'lost' ? 'X' : state.guesses.length ? state.guesses.length + ' so far' : '—'}/${META[m].max}${state.hint ? ' · hint used' : ''}`);
      for (const id of state.guesses) {
        const scores = m === 'word' ? E.scoreWord(id, answer(m)) : FIELDS[m].map(f => E.compare(MAPS[m].get(id)[f.key], answer(m)[f.key]));
        lines.push(scores.map(x => x === 'match' ? '🟩' : x === 'partial' ? '🟨' : '⬛').join(''));
      }
      lines.push('');
    }
    if (/^https?:$/.test(location.protocol)) { const url = new URL(location.href); url.search = ''; url.hash = single || ''; lines.push(url.href); }
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
    openDialog('Three games. One daily queue.', `<div class="help-step"><span>01</span><div><strong>Word · six guesses</strong><p>Find the five-letter word. Green is the right letter in the right spot. Yellow means the letter belongs elsewhere. Each letter is counted only as often as it appears in the answer.</p></div></div><div class="help-step"><span>02</span><div><strong>Rift · eight guesses</strong><p>Search for a League champion and compare the clues. Classes come from Riot’s Data Dragon tags, not lane assignments. Attack range and movement speed are base stats; difficulty uses Riot’s 1–10 rating.</p></div></div><div class="help-step"><span>03</span><div><strong>Dex · eight guesses</strong><p>Search across all ${D.dex.length.toLocaleString()} Pokémon in generations 1–9. Types are compared as a set; yellow means one type matches. Gen., height, and weight arrows point toward the answer. Standard forms only. Color is the Pokédex classification.</p></div></div><p>Hints unlock after three guesses in Rift and Dex. Using one is marked on your shared result. The whole group gets the same puzzles; a fresh set arrives at midnight US Central, including daylight saving changes.</p><p>Refresh or close the page without losing guesses on this browser. Progress does not sync between devices. Copy your colored result to compare with friends without spoiling the answer.</p>`);
  }
  $('help-button').addEventListener('click', showHelp);
  $('credits-button').addEventListener('click', () => openDialog('Made for the daily queue.', `<p>An independent fan project inspired by daily guessing games. Not affiliated with Wordle, LoLdle, Pokédle, Riot Games, Nintendo, Game Freak, or The Pokémon Company.</p><p>Champion data and portraits: <a href="https://developer.riotgames.com/docs/lol" target="_blank" rel="noopener noreferrer">Riot Games Data Dragon ${D.version}</a>. Pokémon data and sprites: <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokéAPI</a>. Names and artwork belong to their respective owners.</p><p>Guess dictionary: <a href="https://github.com/dwyl/english-words" target="_blank" rel="noopener noreferrer">dwyl/english-words</a>. Answer words are a separate curated list. Data snapshot: ${D.snapshot}.</p><p>Daily Queue isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.</p>`));
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
    tab.addEventListener('click', () => switchGame(tab.dataset.game));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (MODES.indexOf(mode) + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
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
  document.addEventListener('click', event => { if (!event.target.closest('.guess-form')) closeSuggestions(); });
  window.addEventListener('hashchange', () => { const next = location.hash.slice(1); if (MODES.includes(next)) switchGame(next); });
  window.addEventListener('storage', event => { if (event.key === null || MODES.some(m => event.key === stateKey(m))) { loadAll(); render(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkDay(); loadAll(); render(); tick(); } });
  window.addEventListener('focus', () => { if (!checkDay()) { loadAll(); render(); } });
  loadRound(); loadAll(); render(); tick(); setInterval(tick, 1000);
  // Progressive enhancement: unsupported browsers simply use the normal UI.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* optional API */ } };
    register({ name: 'read_daily_queue', title: 'Read puzzle progress', description: 'Read the current daily or practice lineup and saved guesses without revealing unsolved answers.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => { checkDay(); return { date: today, lineup: round ? `practice +${round}` : 'daily', practiceRound: round, selectedGame: mode, games: MODES.map(m => ({ game: m, status: gameStatus(m), guesses: [...states[m].guesses], maxGuesses: META[m].max, hintUsed: states[m].hint })) }; } });
    register({ name: 'submit_daily_guess', title: 'Submit a puzzle guess', description: 'Select Word, Rift, or Dex and submit one guess, consuming an attempt if valid. This updates the visible game and saved progress.', inputSchema: { type: 'object', properties: { game: { type: 'string', enum: MODES }, guess: { type: 'string', minLength: 1, maxLength: 60 } }, required: ['game', 'guess'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: input => { if (!input || !MODES.includes(input.game) || typeof input.guess !== 'string' || input.guess.length > 60 || !input.guess.trim()) return { error: 'Provide a valid game and guess.' }; switchGame(input.game); return input.game === 'word' ? submitWord(input.guess) : submitRoster(input.guess); } });
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
