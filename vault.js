(function (root) {
  'use strict';
  const clues = [
    ['listen','Attend to silent reform','Anagram','Attend','SILENT is reformed into LISTEN.','silent'],
    ['stream','Flow from confused master','Anagram','Flow','MASTER is rearranged to make STREAM.','master'],
    ['credit','Recognition for direct conversion','Anagram','Recognition','DIRECT is converted into CREDIT.','direct'],
    ['orchid','Flower from rich do, oddly','Anagram','Flower','RICH DO is rearranged to make ORCHID.','richdo'],
    ['astronomer','Sky-watcher is moon starer, eccentrically','Anagram','Sky-watcher','MOON STARER is an anagram of ASTRONOMER.','moonstarer'],
    ['education','Instruction from auctioned arrangement','Anagram','Instruction','AUCTIONED rearranges to EDUCATION.','auctioned'],
    ['dormitory','Sleeping quarters from dirty room makeover','Anagram','Sleeping quarters','DIRTY ROOM rearranges to DORMITORY.','dirtyroom'],
    ['conversation','Discussion as voices rant on wildly','Anagram','Discussion','VOICES RANT ON rearranges to CONVERSATION.','voicesranton'],
    ['schoolmaster','Teacher from the classroom, reorganized','Anagram','Teacher','THE CLASSROOM rearranges to SCHOOLMASTER.','theclassroom'],
    ['elbow','Joint below, twisted','Anagram','Joint','BELOW is twisted into ELBOW.','below'],
    ['enlist','Join up as tinsel gets tangled','Anagram','Join up','TINSEL is tangled into ENLIST.','tinsel'],
    ['rescue','Save secure arrangement','Anagram','Save','SECURE rearranges to RESCUE.','secure'],
    ['cinema','Picture house made from iceman in pieces','Anagram','Picture house','ICEMAN in pieces rearranges to CINEMA.','iceman'],
    ['danger','Risk in garden upheaval','Anagram','Risk','GARDEN is rearranged to DANGER.','garden'],
    ['night','Dark time when thing turns strange','Anagram','Dark time','THING is rearranged to NIGHT.','thing'],
    ['angle','Point of view from glean, revised','Anagram','Point of view','GLEAN rearranges to ANGLE.','glean'],
    ['triangle','Three-sided figure, integral in disarray','Anagram','Three-sided figure','INTEGRAL rearranges to TRIANGLE.','integral'],
    ['sword','Weapon from words in revolt','Anagram','Weapon','WORDS in revolt rearranges to SWORD.','words'],
    ['dear','Expensive read, revised','Anagram','Expensive','READ is revised into DEAR.','read'],
    ['draw','Tie in ward returned','Reversal','Tie','WARD returned (reversed) gives DRAW.','ward'],
    ['stressed','Under pressure as desserts come back','Reversal','Under pressure','DESSERTS reversed gives STRESSED.','desserts'],
    ['part','Role in trap turned around','Reversal','Role','TRAP reversed gives PART.','trap'],
    ['straw','Drinking tube has warts turned back','Reversal','Drinking tube','WARTS backwards is STRAW.','warts'],
    ['regal','Royal lager sent back','Reversal','Royal','LAGER sent back gives REGAL.','lager'],
    ['repaid','Settled bill as diaper came back','Reversal','Settled bill','DIAPER reversed gives REPAID.','diaper'],
    ['deliver','Hand over reviled, in reverse','Reversal','Hand over','REVILED read backwards gives DELIVER.','reviled'],
    ['reward','Prize in drawer turned over','Reversal','Prize','DRAWER reversed gives REWARD.','drawer'],
    ['evil','Wicked way to live backwards','Reversal','Wicked','LIVE reversed is EVIL.','live'],
    ['desert','Arid region from dessert losing one second','Deletion','Arid region','Remove one S (second) from DESSERT to get DESERT.','dessert'],
    ['raven','Bird is craven without its leader','Deletion','Bird','Remove the leading C from CRAVEN.','craven'],
    ['lash','Whip from flash without its head','Deletion','Whip','Remove the leading F from FLASH.','flash'],
    ['alone','Without company, Malone loses his head','Deletion','Without company','MALONE without its first letter is ALONE.','malone'],
    ['heart','Core: listen, then start talking','Charade','Core','HEAR (listen) + T (the start of Talking).'],
    ['planet','World from aircraft and time','Charade','World','PLANE (aircraft) + T (time).'],
    ['tread','Step on time, then study','Charade','Step on','T (time) + READ (study).'],
    ['pastor','Minister is history or alternative','Charade','Minister','PAST (history) + OR (an alternative).'],
    ['cabinet','Cupboard: taxi, I, and a trap','Charade','Cupboard','CAB (taxi) + I + NET (a trap).'],
    ['pirate','Sea robber from pi and a charge','Charade','Sea robber','PI + RATE (a charge).'],
    ['canon','Principle heard from a big gun','Homophone','Principle','CANON sounds like CANNON, a big gun.'],
    ['stake','Wager sounds like a cut of beef','Homophone','Wager','STAKE sounds like STEAK.'],
    ['sight','Vision of a building plot, reportedly','Homophone','Vision','SIGHT sounds like SITE, a building plot.'],
    ['knight','Armored fighter heard after sunset','Homophone','Armored fighter','KNIGHT sounds like NIGHT.'],
    ['suite','Rooms that sound sugary','Homophone','Rooms','SUITE sounds like SWEET.'],
    ['flour','Baking ingredient from a bloom, we hear','Homophone','Baking ingredient','FLOUR sounds like FLOWER.'],
    ['quay','Waterside landing sounds like a lock opener','Homophone','Waterside landing','QUAY is pronounced like KEY.'],
    ['board','Committee sounds uninterested','Homophone','Committee','BOARD sounds like BORED.'],
    ['seal','Close securely; marine animal','Double definition','Close securely / marine animal','A SEAL is a marine animal; to SEAL is to close securely.'],
    ['spring','Season for a coiled piece of metal','Double definition','Season / coiled metal','SPRING is both a season and a coil.'],
    ['crane','Long-necked bird, or lifting machine','Double definition','Bird / lifting machine','CRANE names both a bird and a machine.'],
    ['match','Contest; a small fire starter','Double definition','Contest / fire starter','MATCH can mean a contest or a fire-lighting stick.'],
    ['bank','River edge provides financial institution','Double definition','River edge / financial institution','Both definitions give BANK.'],
    ['mine','Excavation that belongs to me','Double definition','Excavation / belongs to me','MINE means an excavation, or “belonging to me”.'],
    ['bark','Tree covering makes a dog’s noise','Double definition','Tree covering / dog’s noise','BARK has both meanings.'],
    ['scale','Weigh a fish’s protective plate','Double definition','Weigh / fish plate','To SCALE can mean to weigh; a SCALE is a fish’s plate.'],
    ['cipher','Zero, or a secret writing system','Double definition','Zero / secret writing system','CIPHER can mean zero or a system for encoding a message.'],
    ['oracle','Prophet in major, a cleric','Hidden word','Prophet','majOR A CLEric hides ORACLE across the word boundaries.','majoracleric'],
    ['chess','Game hidden by duchess','Hidden word','Game','duCHESS contains CHESS.','duchess'],
    ['pearl','Gem in something spearlike','Hidden word','Gem','sPEARLike contains PEARL.','spearlike'],
    ['torch','Light carried by secret orchard','Hidden word','Light','secreT ORCHard hides TORCH.','secretorchard'],
    ['clove','Spice tucked into music lovers','Hidden word','Spice','musiC LOVErs hides CLOVE.','musiclovers']
  ].map(([answer,clue,type,definition,explanation,fodder],i)=>({id:'c'+i,answer,clue,type,definition,explanation,fodder}));
  const finals=['secret','cipher','riddle','locket','oracle','mystic','enigma','portal','shadow','anchor','stream','dragon','kitten','master','garden','silver','quiver','marble'];
  function make(seed,A){
    const rng=A.random('kitten-vault-v1:'+seed), answer=A.pick(finals,rng), used=new Set(), types=new Set();
    const selected=[...answer].map(letter=>{
      let pool=clues.filter(c=>c.answer.includes(letter)&&!used.has(c.id));
      const fresh=pool.filter(c=>!types.has(c.type));if(fresh.length)pool=fresh;
      const c=A.pick(pool,rng);used.add(c.id);types.add(c.type);
      const positions=[...c.answer].flatMap((x,i)=>x===letter?[i]:[]);
      return {...c,extract:A.pick(positions,rng)};
    });
    return {answer,clues:selected};
  }
  const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
  function status(s,p){return s.vaultFinal===p.answer&&s.solved.length===6?'won':s.vaultHard&&s.wrong.length>=8?'lost':'playing';}
  function render({state:s,puzzle:p,root:el,finish,message}){
    const outcome=status(s,p),done=outcome!=='playing';
    el.innerHTML=`<div class="vault-intro"><span class="vault-medallion" aria-hidden="true">✧</span><div><p class="eyebrow">BRENT’S AFTER-HOURS EXAM</p><h2>The Cryptic Vault</h2><p>Six locks. Six extracted letters. One last word.</p></div></div><div class="vault-mode"><label><input id="vault-hard" type="checkbox" ${s.vaultHard?'checked':''} ${s.solved.length||s.wrong.length||s.hint?'disabled':''}> Expert mode</label><span>${s.vaultHard?`${Math.max(0,8-s.wrong.length)} misses left · no hints`:'Standard · optional hints · unlimited attempts'}</span></div><div class="vault-clues">${p.clues.map((c,i)=>{
      const solved=s.solved.includes(c.id),h=s.vaultHints?.[c.id]||0;
      return `<article class="vault-clue ${solved?'unlocked':''}"><header><span>LOCK ${String(i+1).padStart(2,'0')}</span><b>${solved?'✓ OPEN':c.answer.length+' LETTERS'}</b></header><p class="cryptic-clue">${c.clue} <small>(${c.answer.length})</small></p><p class="extraction-note">Take letter ${c.extract+1} of your answer.</p>${solved||done?`<div class="vault-answer">${[...c.answer].map((x,j)=>`<span class="${j===c.extract?'extracted':''}">${x}</span>`).join('')}</div><p class="vault-explanation">${c.explanation}</p>`:`<form data-vault-clue="${c.id}" autocomplete="off"><label class="visually-hidden" for="vault-${i}">Answer to lock ${i+1}</label><input class="guess-input" id="vault-${i}" maxlength="24" placeholder="Your answer" spellcheck="false"><button class="outline-button" type="submit">Unlock ↵</button></form>${!s.vaultHard?`<button type="button" class="quiet-button vault-hint" data-vault-hint="${c.id}" ${h>=3?'disabled':''}>${h>=3?'All hints shown':'Hint '+(h+1)+' / 3'}</button>`:''}${h?`<p class="vault-hint-text">${h>=1?'Definition: '+c.definition+'. ':''}${h>=2?'Wordplay: '+c.type+'. ':''}${h>=3?'Starts with '+c.answer[0].toUpperCase()+'.':''}</p>`:''}`}</article>`;
    }).join('')}</div><div class="extraction-panel"><p class="eyebrow">THE FINAL SEAL</p><div class="extraction-letters">${p.clues.map(c=>`<span>${s.solved.includes(c.id)||done?c.answer[c.extract]:'?'}</span>`).join('')}</div><p>Read the extracted letters from lock 1 to 6. Enter the word to open the vault.</p>${s.solved.length===6&&!done?'<form id="vault-final-form"><label class="visually-hidden" for="vault-final">Final word</label><input id="vault-final" class="guess-input" maxlength="6" placeholder="Six-letter word" autocomplete="off"><button class="primary-button">Open vault ↵</button></form>':`<small>${done?(outcome==='won'?'VAULT OPEN · EMERALD EGO DEFEATED':'EXAM OVER · REVIEW THE WORDPLAY ABOVE'):'Solve all six locks to reach the final seal.'}</small>`}</div>`;
    el.querySelector('#vault-hard').addEventListener('change',e=>{s.vaultHard=e.target.checked;finish('playing');});
    el.querySelectorAll('[data-vault-clue]').forEach(form=>form.addEventListener('submit',e=>{
      e.preventDefault();if(done)return;const c=p.clues.find(c=>c.id===form.dataset.vaultClue),answer=normalize(form.querySelector('input').value);
      if(!answer)return message('Enter an answer first.',true);
      if(answer===c.answer)s.solved.push(c.id);else{const miss=c.id+':'+answer;if(s.wrong.includes(miss))return message('You already tried that answer for this lock.',true);s.wrong.push(miss);}
      finish('playing');message(answer===c.answer?'Lock opened. Its marked letter is saved.':'That lock is still closed. Check both the definition and the wordplay.',answer!==c.answer);
    }));
    el.querySelectorAll('[data-vault-hint]').forEach(b=>b.addEventListener('click',()=>{if(s.vaultHard||done)return;s.vaultHints=s.vaultHints||{};s.vaultHints[b.dataset.vaultHint]=(s.vaultHints[b.dataset.vaultHint]||0)+1;s.hint++;finish('playing');}));
    el.querySelector('#vault-final-form')?.addEventListener('submit',e=>{e.preventDefault();const v=normalize(el.querySelector('#vault-final').value);if(v===p.answer){s.vaultFinal=v;finish('playing');}else{const miss='final:'+v;if(!v)return message('Enter the six-letter extraction word.',true);if(!s.wrong.includes(miss))s.wrong.push(miss);finish('playing');message('Read the six marked letters in lock order.',true);}});
  }
  const api={clues,finals,make,normalize,status,render};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.CrypticVault=api;
})(typeof window!=='undefined'?window:globalThis);
