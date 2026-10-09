(() => {
  'use strict';
  const {friends,themes,trails}=window.SquadData;
  const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const key='daily-queue:archive:v1';
  let api,currentGame=null,notice=false,focusBeforeDialog=null;
  const fresh=()=>({enabled:false,steps:{},cases:[],hints:{},matches:{},deduced:false,finished:false,sound:false});
  function load(){
    const s=fresh();try{const r=JSON.parse(localStorage.getItem(key));if(!r||typeof r!=='object')return s;
      for(const field of ['enabled','deduced','finished','sound'])s[field]=r[field]===true;
      for(const t of trails){const saved=Array.isArray(r.steps?.[t.id])?r.steps[t.id]:[];s.steps[t.id]=[];for(let i=0;i<4&&saved.includes(i);i++)s.steps[t.id].push(i);if(s.steps[t.id].length===4&&r.cases?.includes(t.id))s.cases.push(t.id);}
      if(r.hints&&typeof r.hints==='object')s.hints=Object.fromEntries(Object.entries(r.hints).filter(([k,v])=>/^[a-z]+-[0-3]$/.test(k)&&[1,2].includes(v)));
      if(r.matches&&typeof r.matches==='object')s.matches=Object.fromEntries(Object.entries(r.matches).filter(([k,v])=>/^e\d{1,2}$/.test(k)&&friends[v]));
      if(s.cases.length<4)s.deduced=s.finished=false;if(!s.deduced)s.finished=false;
    }catch{}return s;
  }
  let state=load();
  function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{if(!notice){notice=true;api.toast('Archive storage is unavailable. Keep this tab open for your hunt.');}}updateProgress();}
  const count=()=>trails.reduce((n,t)=>n+(state.steps[t.id]?.length||0),0);
  const theme=g=>themes[typeof g==='string'?g:g.id];
  const owner=t=>friends[t.friend]||{name:'The whole crew',color:'#c9b8ff',second:'#88e2d1',symbol:'✦',quote:'One more game.'};
  const kitty=(color='#c9b8ff')=>`<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M17 46 12 10 39 26Q50 22 61 26L88 10 83 46Q96 87 50 90 4 87 17 46Z" fill="${color}"/><path d="m20 23 4 21 12-11m44-10-4 21-12-11" fill="#0f172b" opacity=".5"/><path d="M28 55q6-8 12 0m20 0q6-8 12 0M39 70q5 9 11 0 6 9 11 0" stroke="#152033" stroke-width="4" stroke-linecap="round"/><path d="m46 62 4 5 4-5" fill="#152033"/><path d="m20 65-15-3m16 11L6 78m73-13 15-3m-16 11 15 5" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`;
  function cardArt(g){const t=theme(g);if(!t)return'';const f=owner(t);return `<div class="squad-card-scene motif-${t.motif}" style="--friend:${f.color};--friend-two:${f.second}"><img class="squad-card-image ${t.art.endsWith('.png')?'cutout':'scene'}" src="assets/themes/${t.art}" loading="lazy" alt=""><span class="squad-card-pattern" aria-hidden="true">${{diamond:'◇ ◇',cards:'▱ ▱',steps:'A → Z',lock:'? ? ? ?',signal:'···',pulse:'BOOM',grid:'M I X',chalk:'A+',blade:'⚔',runes:'✧',aura:'◎',impact:'↯',water:'≈',foil:'✦',paper:'FIELD NOTES',scan:'?',radar:'◎',vault:'VI'}[t.motif]}</span><span class="squad-card-owner">${f.symbol} ${esc(t.friend==='squad'?'THE WHOLE CREW':f.name.toUpperCase())}</span></div>`;}
  function world(g){
    currentGame=g;const t=theme(g),f=owner(t);document.body.dataset.friend=t.friend;document.body.dataset.motif=t.motif;document.body.style.setProperty('--friend',f.color);document.body.style.setProperty('--friend-two',f.second);
    $('world-art').innerHTML=`<div class="squad-world-halo"></div><img class="squad-world-image ${t.art.endsWith('.png')?'cutout':'scene'}" src="assets/themes/${t.art}" alt=""><span class="squad-world-mark">${f.symbol}</span>`;
    $('game-banner').innerHTML=`<div class="squad-banner-copy"><span>${g.category==='dex'?'KANTO · ORIGINAL 151':g.category==='rift'?'LEAGUE OF LEGENDS':'WORD & LOGIC'} / ${esc(f.name.toUpperCase())}</span><strong>${esc(t.name)}</strong></div><img class="squad-banner-image ${t.art.endsWith('.png')?'cutout':'scene'}" src="assets/themes/${t.art}" alt="">${t.extra?`<img class="squad-banner-extra" src="assets/themes/${t.extra}" alt="">`:''}<span class="squad-banner-symbol">${f.symbol}</span>${g.id==='dex-card'?'<span class="felt-hat" aria-hidden="true"></span>':''}`;
    $('friend-ribbon').innerHTML=`<span class="friend-sigil">${f.symbol}</span><div><strong>${esc(t.line)}</strong><small>${esc(t.detail)}</small></div><span class="ribbon-owner">${esc(f.name)}</span>`;
  }
  function decorate(g,outcome){
    currentGame=g;const t=theme(g),f=owner(t);
    if(outcome!=='playing'&&!$('squad-result')){$('game-result').querySelector('.result-card')?.insertAdjacentHTML('afterbegin',`<div id="squad-result" class="squad-result"><span>${outcome==='won'?f.symbol:'↻'}</span><strong>${esc(outcome==='won'?t.win:(f.miss||'The crew has requested another round.'))}</strong></div>`);}
    markers();
  }
  function markers(){
    const slot=$('hunt-marker-slot');if(!slot)return;slot.innerHTML='';if(!state.enabled||!currentGame||!$('archive-view').hidden)return;
    const available=trails.filter(t=>{const n=state.steps[t.id]?.length||0;return n<4&&t.steps[n].game===currentGame.id;});
    slot.innerHTML=available.map(t=>`<button class="hunt-marker" data-trail="${t.id}" style="--friend:${friends[t.friend].color}"><span class="marker-sigil">${t.symbol}</span><span><small>ARCHIVE SIGNAL FOUND</small><strong>${esc(t.steps[state.steps[t.id]?.length||0].title)}</strong></span><b>Inspect ↗</b></button>`).join('')+`<div class="hunt-mini-status"><span>Hunt active · ${count()} / 16 fragments</span><a href="#archive">Open field notebook →</a></div>`;
    slot.querySelectorAll('[data-trail]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.trail)));
  }
  function home(){currentGame=null;$('archive-view').hidden=true;delete document.body.dataset.friend;delete document.body.dataset.motif;document.body.style.removeProperty('--friend');document.body.style.removeProperty('--friend-two');updateProgress();}
  function updateProgress(){
    const b=$('hunt-toggle');if(b){b.setAttribute('aria-pressed',String(state.enabled));b.innerHTML=`<span>✧</span> Hunt ${state.enabled?'on':'off'}`;}
    if($('archive-home-progress'))$('archive-home-progress').textContent=`${count()} / 16 fragments · ${state.cases.length} / 4 friends found`;
  }
  function dialog(title,html){focusBeforeDialog=document.activeElement;$('hunt-dialog-title').textContent=title;$('hunt-dialog-content').innerHTML=html;if(!$('hunt-dialog').open)$('hunt-dialog').showModal();}
  function closeDialog(){$('hunt-dialog').close();if(focusBeforeDialog?.isConnected)focusBeforeDialog.focus({preventScroll:true});}
  function notebook(t){const n=state.steps[t.id]?.length||0;return `<div class="evidence-notebook"><h4>Collected evidence</h4>${n?`<ol>${t.steps.slice(0,n).map(s=>`<li>${esc(s.evidence)}</li>`).join('')}</ol>`:'<p>The first page is still blank. Follow the location riddle.</p>'}</div>`;}
  function caseMarkup(t){
    const n=state.steps[t.id]?.length||0,solved=state.cases.includes(t.id),h=state.hints[t.id+'-'+n]||0,f=friends[t.friend];
    return `<article class="archive-case ${solved?'case-complete':''}" style="--friend:${f.color}"><div class="case-cover"><span>${t.symbol}</span><small>${t.difficulty.toUpperCase()} CASE</small><b>${solved?'FOUND':'CASE '+String(trails.indexOf(t)+1).padStart(2,'0')}</b></div><div class="case-body"><p class="eyebrow">${solved?esc(t.title):'UNIDENTIFIED FRIEND'}</p><h2>${solved?f.name:esc(t.title)}</h2><p>${esc(t.intro)}</p><div class="fragment-track" aria-label="${n} of 4 fragments">${[0,1,2,3].map(i=>`<span class="${i<n?'collected':''}">${i<n?'✓':i+1}</span>`).join('')}</div>${n<4?`<div class="location-riddle"><small>NEXT LOCATION · RIDDLE ${n+1}</small><p>${esc(t.steps[n].location)}</p>${h?`<p class="location-hint">${h===1?`Look in ${t.steps[n].game.startsWith('rift')?'League of Legends':t.steps[n].game.startsWith('dex')?'Kanto':'Word & logic'}.`:esc(t.steps[n].where)}</p>`:''}<div class="case-actions"><button class="quiet-button" data-location-hint="${t.id}" ${h>=2?'disabled':''}>${h>=2?'Location revealed':h?'Reveal exact game':'Location hint'}</button>${h>=2?`<a class="outline-button" href="#${t.steps[n].game}">Visit game ↗</a>`:''}</div></div>`:solved?`<div class="case-seal"><span>SEAL SECURED</span><strong>${t.seal}</strong><small>${esc(f.quote)}</small></div>`:`<button class="primary-button" data-identify="${t.id}">Identify this friend ↵</button>`}<details><summary>Field notebook · ${n} clues</summary>${notebook(t)}</details></div></article>`;
  }
  function openArchive(){
    currentGame=null;$('home-view').hidden=true;$('play-view').hidden=true;$('archive-view').hidden=false;document.body.dataset.world='archive';delete document.body.dataset.friend;delete document.body.dataset.motif;document.body.style.removeProperty('--friend');document.body.style.removeProperty('--friend-two');$('world-art').innerHTML='<div class="archive-stars"></div>';
    renderArchive();$('archive-view').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  }
  function renderArchive(){
    $('archive-view').innerHTML=`<div class="archive-toolbar"><a class="back-link" href="#home">← Back to the arcade</a><span>OPTIONAL CO-OP HUNT</span><button class="quiet-button" id="reset-hunt">Reset hunt ↻</button></div><div class="archive-heading"><div class="archive-emblem">${kitty()}</div><p class="eyebrow">A MYSTERY FOR THE GROUP CHAT</p><h1>The Kitten Archive<span>.</span></h1><p>Four familiar strangers. Sixteen scattered fragments.<br>Follow the riddles through the arcade and bring everyone home.</p><div class="archive-progress"><span><b>${count()}</b> / 16 fragments</span><span><b>${state.cases.length}</b> / 4 friends found</span><span>${state.enabled?'✧ Signals active':'Signals paused'}</span></div>${state.enabled?'':'<button class="primary-button" id="start-hunt">'+(count()?'Resume the hunt':'Begin the hunt')+' <span>↗</span></button>'}</div><div class="hunt-instructions"><span>01 <b>Find the game</b> from its location riddle.</span><span>02 <b>Inspect the signal</b> and solve its question.</span><span>03 <b>Collect evidence</b> and identify your friend.</span></div><div class="archive-cases">${trails.map(caseMarkup).join('')}</div><section class="squad-final-gate"><span>✧</span><div><p class="eyebrow">THE SQUAD BOSS</p><h2>${state.finished?'Everyone made it home.':state.cases.length===4?'The final board is ready.':'One final secret awaits.'}</h2><p>${state.cases.length===4?'Sort the evidence together, assemble the four seals, and unlock Mason’s message.':'Identify all four friends to unlock the final deduction board.'}</p></div><button class="${state.cases.length===4?'primary':'outline'}-button" id="open-final" ${state.cases.length===4?'':'disabled'}>${state.finished?'Replay the finale':state.cases.length===4?'Open final board ↗':'Find all four friends'}</button></section><p class="archive-footnote">Stream the site in Discord and solve together. Hunt progress saves on this browser. New puzzle buttons reset only that game’s round.</p>`;
    $('start-hunt')?.addEventListener('click',()=>{state.enabled=true;save();renderArchive();});
    $('reset-hunt').addEventListener('click',confirmReset);
    $('open-final').addEventListener('click',()=>state.finished?finale():finalBoard());
    document.querySelectorAll('[data-location-hint]').forEach(b=>b.addEventListener('click',()=>{const t=trails.find(t=>t.id===b.dataset.locationHint),n=state.steps[t.id]?.length||0;state.hints[t.id+'-'+n]=Math.min(2,(state.hints[t.id+'-'+n]||0)+1);save();renderArchive();}));
    document.querySelectorAll('[data-identify]').forEach(b=>b.addEventListener('click',()=>identify(b.dataset.identify)));
    updateProgress();
  }
  function inspect(id){
    const t=trails.find(t=>t.id===id),n=state.steps[id]?.length||0;if(!state.enabled||n>=4||currentGame?.id!==t.steps[n].game)return;
    const s=t.steps[n];dialog(s.title,`<div class="discovery-tag">${t.symbol} FRAGMENT ${n+1} / 4 · ${s.kind.toUpperCase()}</div><p class="hunt-question">${esc(s.question)}</p><form id="hunt-answer-form"><label for="hunt-answer">Your answer</label><div class="hunt-answer-row"><input id="hunt-answer" class="guess-input" autocomplete="off" maxlength="100" spellcheck="false" placeholder="Talk it out, then answer…"><button class="primary-button">Check ↵</button></div></form><p id="hunt-feedback" class="hunt-feedback" role="status" aria-live="polite"></p><button class="quiet-button" id="clue-hint">A little help?</button><p id="clue-hint-text" class="location-hint" hidden></p>`);
    $('hunt-answer').focus();$('clue-hint').addEventListener('click',()=>{$('clue-hint-text').textContent=s.hint;$('clue-hint-text').hidden=false;});
    $('hunt-answer-form').addEventListener('submit',e=>{e.preventDefault();if((state.steps[id]?.length||0)!==n)return;const answer=clean($('hunt-answer').value);if(!answer){$('hunt-feedback').textContent='Enter an answer first.';return;}if(!s.answers.includes(answer)){$('hunt-feedback').textContent=friends[t.friend].miss+' Try again, or ask for a hint.';return;}state.steps[id]=[...(state.steps[id]||[]),n];save();markers();
      dialog('Evidence recovered',`<div class="fragment-reveal"><span>${t.symbol}</span><p class="eyebrow">FRAGMENT ${n+1} SECURED</p><h3>${esc(s.evidence)}</h3></div>${n<3?`<div class="location-riddle"><small>YOUR NEXT LOCATION</small><p>${esc(t.steps[n+1].location)}</p></div><div class="hunt-dialog-actions"><a class="primary-button" id="back-notebook" href="#archive">Save to notebook ↗</a><button class="quiet-button" id="keep-playing">Keep playing this game</button></div>`:`<p>You found all four fragments. Who left this trail?</p><button class="primary-button" id="identify-now">Identify the friend ↵</button>`}`);
      $('back-notebook')?.addEventListener('click',closeDialog);$('keep-playing')?.addEventListener('click',closeDialog);$('identify-now')?.addEventListener('click',()=>identify(id));
    });
  }
  function identify(id){
    const t=trails.find(t=>t.id===id);if((state.steps[id]?.length||0)<4)return;const f=friends[t.friend];
    dialog('Who left this trail?',notebook(t)+`<form id="identify-form"><label for="friend-answer">Name your friend</label><div class="hunt-answer-row"><input id="friend-answer" class="guess-input" autocomplete="off" maxlength="30" placeholder="Thack, Isaac, Ryan, or Brent"><button class="primary-button">Identify ↵</button></div></form><p id="identify-feedback" role="status"></p>`);
    $('friend-answer').focus();$('identify-form').addEventListener('submit',e=>{e.preventDefault();if(clean($('friend-answer').value)!==t.friend){$('identify-feedback').textContent='That friend doesn’t fit all four clues. Read the notebook again.';return;}if(!state.cases.includes(id))state.cases.push(id);save();
      dialog(f.name+' found',`<div class="friend-found" style="--friend:${f.color}"><img src="assets/themes/${f.champ}.jpg" alt=""><div class="friend-found-copy"><span>${t.symbol}</span><p class="eyebrow">FRIEND IDENTIFIED</p><h2>${f.name}</h2><p>“${esc(f.quote)}”</p><div class="case-seal"><span>YOUR FINAL SEAL</span><strong>${t.seal}</strong></div></div></div><a class="primary-button" id="return-map" href="#archive">${state.cases.length===4?'All four found. Open the archive':'Return to the archive'} ↗</a>`);
      if(!$('archive-view').hidden)renderArchive();$('return-map').addEventListener('click',()=>{closeDialog();openArchive();});
    });
  }
  function finalEvidence(){const entries=trails.flatMap(t=>t.steps.slice(0,3).map(s=>({friend:t.friend,text:s.evidence})));return [5,10,0,8,1,11,6,3,9,4,7,2].map((n,i)=>({...entries[n],id:'e'+i}));}
  function finalBoard(){
    if(state.cases.length<4)return;if(state.deduced)return finalSeal();
    const evidence=finalEvidence();dialog('The Squad Boss',`<p class="hunt-question">You found the evidence. Now connect the entire group.</p><p>Assign all twelve recovered clues to the right friend. Three clues belong to each person.</p><form id="deduction-form"><div class="deduction-board">${evidence.map((e,i)=>`<label class="deduction-evidence"><span class="evidence-number">${String(i+1).padStart(2,'0')}</span><span>${esc(e.text)}</span><select data-evidence="${e.id}" aria-label="Friend for clue ${i+1}"><option value="">Choose friend…</option>${Object.entries(friends).map(([id,f])=>`<option value="${id}" ${state.matches[e.id]===id?'selected':''}>${f.name}</option>`).join('')}</select></label>`).join('')}</div><button class="primary-button">Check the whole board ↵</button></form><p id="deduction-feedback" role="status" aria-live="polite"></p>`);
    document.querySelectorAll('[data-evidence]').forEach(el=>el.addEventListener('change',()=>{state.matches[el.dataset.evidence]=el.value;save();}));
    $('deduction-form').addEventListener('submit',e=>{e.preventDefault();if(evidence.some(e=>!state.matches[e.id])){$('deduction-feedback').textContent='Assign every clue before checking.';return;}const correct=evidence.filter(e=>state.matches[e.id]===e.friend).length;if(correct<12){$('deduction-feedback').textContent=`${correct} / 12 connections are right. Compare the remaining evidence together.`;return;}state.deduced=true;save();finalSeal();});
  }
  function finalSeal(){
    if(!state.deduced||state.cases.length<4)return;
    dialog('The last seal',`<p class="hunt-question">Read the four recovered seals in this order.</p><div class="final-seals">${trails.map(t=>`<div style="--friend:${friends[t.friend].color}"><small>${friends[t.friend].name}</small><strong>${t.seal}</strong></div>`).join('')}</div><form id="final-seal-form"><label for="final-phrase">The message from Mason</label><div class="hunt-answer-row"><input id="final-phrase" class="guess-input" autocomplete="off" maxlength="60" placeholder="Put the four seals together…"><button class="primary-button">Bring everyone home ↵</button></div></form><p id="seal-feedback" role="status"></p>`);
    $('final-seal-form').addEventListener('submit',e=>{e.preventDefault();if(clean($('final-phrase').value)!=='loveallmykittens'){$('seal-feedback').textContent='Read the seals left to right: Thack, Isaac, Ryan, Brent.';return;}state.finished=true;save();closeDialog();finale();if(!$('archive-view').hidden)renderArchive();});
  }
  function playChime(){
    if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C();ctx.resume();[523.25,659.25,783.99,1046.5].forEach((frequency,i)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.19;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.08,start+.02);gain.gain.exponentialRampToValueAtTime(.001,start+.8);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(start);oscillator.stop(start+.85);});setTimeout(()=>ctx.close(),2200);}catch{}
  }
  function finale(){
    if(!state.finished)return;const d=$('finale-dialog');d.innerHTML=`<button id="close-finale" class="icon-button finale-close" aria-label="Close finale">×</button><div class="finale-glow" aria-hidden="true"></div><div class="paw-confetti" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="--x:${(i*41)%100}%;--delay:${(i%8)*.2}s;--rotate:${i*31}deg">${i%3?'✦':'🐾'}</i>`).join('')}</div><div class="finale-content"><p class="eyebrow">ALL FOUR FOUND. EVERYONE HOME.</p><div class="kitten-lineup">${trails.map((t,i)=>`<div class="kitten-badge" style="--friend:${friends[t.friend].color};--i:${i}">${kitty(friends[t.friend].color)}<span>${friends[t.friend].name}</span></div>`).join('')}</div><h1>Love all my kittens</h1><p class="finale-signature">— Mason</p><p class="finale-note">The queue is better with you in it.</p><div class="finale-actions"><button id="replay-finale" class="primary-button">Replay the animation ↻</button><button id="finale-sound" class="outline-button" aria-pressed="${state.sound}">Sound ${state.sound?'on':'off'}</button><button id="return-arcade" class="quiet-button">Back to the games →</button></div></div>`;
    if(!d.open)d.showModal();$('close-finale').addEventListener('click',()=>d.close());$('replay-finale').addEventListener('click',finale);$('finale-sound').addEventListener('click',()=>{state.sound=!state.sound;save();$('finale-sound').textContent='Sound '+(state.sound?'on':'off');$('finale-sound').setAttribute('aria-pressed',String(state.sound));playChime();});$('return-arcade').addEventListener('click',()=>{d.close();location.hash='home';});playChime();
  }
  function confirmReset(){dialog('Start a fresh hunt?',`<p>This clears the 16 archive fragments, friend badges, and the finale unlock. Your game rounds, wins, and favorites stay saved.</p><div class="hunt-dialog-actions"><button class="outline-button" id="cancel-reset">Keep my progress</button><button class="primary-button" id="confirm-reset">Reset archive hunt</button></div>`);$('cancel-reset').addEventListener('click',closeDialog);$('confirm-reset').addEventListener('click',()=>{const sound=state.sound;state=fresh();state.enabled=true;state.sound=sound;save();closeDialog();renderArchive();});}
  function init(core){
    api=core;$('hunt-close').addEventListener('click',closeDialog);
    $('hunt-toggle').addEventListener('click',()=>{state.enabled=!state.enabled;save();markers();if(!$('archive-view').hidden)renderArchive();api.toast(state.enabled?'Hunt signals enabled. Follow the riddles in the archive.':'Hunt paused. Play any game as usual.');});
    window.addEventListener('storage',e=>{if(e.key===key){state=load();updateProgress();markers();if(!$('archive-view').hidden)renderArchive();}});
    updateProgress();
  }
  window.Squad={init,cardArt,world,decorate,home,openArchive,themes};
})();
