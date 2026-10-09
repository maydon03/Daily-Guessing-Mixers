const {test}=require('node:test');
const assert=require('node:assert/strict');
const V=require('../vault.js'),A=require('../puzzle-engine.js'),S=require('../squad-data.js');
test('authored cryptic wordplay uses the promised letters',()=>{
 assert.equal(V.clues.length,60);
 for(const c of V.clues){
  const sort=s=>[...s].sort().join('');
  if(c.type==='Anagram')assert.equal(sort(c.answer),sort(c.fodder),c.answer);
  if(c.type==='Reversal')assert.equal(c.answer,[...c.fodder].reverse().join(''),c.answer);
  if(c.type==='Hidden word')assert.ok(c.fodder.includes(c.answer),c.answer);
  if(c.type==='Deletion')assert.equal(c.fodder.length-c.answer.length,1,c.answer);
 }
});
test('1,000 seeds produce six distinct solvable locks and a correct extraction',()=>{
 for(let i=0;i<1000;i++){
  const p=V.make('p-check'+i,A);
  assert.equal(p.clues.length,6);assert.equal(new Set(p.clues.map(c=>c.id)).size,6);
  assert.equal(p.clues.map(c=>c.answer[c.extract]).join(''),p.answer);
  assert.ok(new Set(p.clues.map(c=>c.type)).size>=3);
  assert.deepEqual(p,V.make('p-check'+i,A));
 }
});
test('expert failures, final extraction gate, and forgiving word input',()=>{
 const p=V.make('p-check1',A),s={solved:[],wrong:[],vaultHard:true};
 s.vaultFinal=p.answer;assert.equal(V.status(s,p),'playing');
 s.wrong=Array(8).fill('x');assert.equal(V.status(s,p),'lost');
 s.vaultHard=false;assert.equal(V.status(s,p),'playing');
 s.solved=p.clues.map(c=>c.id);assert.equal(V.status(s,p),'won');
 assert.equal(V.normalize('  THE vault! '),'thevault');
});
test('sixteen trail stops span distinct games and no one needs the new hard game to finish',()=>{
 const stops=S.trails.flatMap(t=>t.steps);
 assert.equal(stops.length,16);assert.equal(new Set(stops.map(s=>s.game)).size,16);
 assert.ok(stops.every(s=>s.game!=='cryptic'&&s.answers.length&&s.hint&&s.location&&s.evidence));
 assert.equal(S.trails.map(t=>t.seal).join(' '),'LOVE ALL MY KITTENS');
 assert.equal(Object.keys(S.themes).length,19);
});
