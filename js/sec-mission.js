/* ============ 闯关挑战：细胞危机 ============ */
(function(){
const GE = window.GE, MS = GE.MISSION, R = MS.rooms, NQ = R.length;
let cur = -1, st = [];   // st[i] = {tries, done, pts, clues:Set, picked:[]}
const body = () => GE.$('#mission-body');
function fresh(){ st = R.map(()=>({tries:0, done:false, pts:0, clues:new Set(), picked:[], teacher:false})); }
function score(){ return st.reduce((a,b)=>a+b.pts,0); }
function hud(){ GE.$('#ms-score').textContent = score(); GE.$('#ms-prog').textContent = cur<0 ? `关卡 0 / ${NQ}` : cur>=NQ ? `已结案` : `关卡 ${cur+1} / ${NQ}`; }

function intro(){
  cur = -1; hud();
  body().innerHTML = `<div class="ms-intro glass"><span class="ms-alert">⚠ CELL ALERT · 细胞警报</span><h2>${MS.title}</h2><p>${MS.intro}</p>
    <div class="ms-rooms">${R.map((r,i)=>`<span>${String(i+1).padStart(2,'0')} ${r.room.split('·')[1].trim()}</span>`).join('')}</div>
    <div class="ms-rules"><span>🔍 点击线索卡翻开证据</span><span>✔ 一次答对 +100</span><span>↻ 第二次答对 +50</span><span>✘ 两次答错揭晓答案</span></div>
    <button class="btn-neon big" id="ms-start">开始调查 <em>→</em></button></div>`;
  GE.$('#ms-start').onclick = ()=> room(0);
}
function room(i){
  cur = i; hud(); const r = R[i], s = st[i];
  const L = ['A','B','C','D'];
  body().innerHTML = `
   <div class="ms-map glass">${R.map((x,k)=>{ const ss = st[k]; const c = k===i?'cur':ss.done?(ss.pts===100?'ok':ss.pts>0?'half':'no'):''; return `<div class="rm ${c}" data-k="${k}"><i>${ss.done?(ss.pts===100?'✔':ss.pts>0?'½':'✘'):k+1}</i>${x.room.split('·')[1].trim()}</div>`; }).join('')}</div>
   <div class="ms-main">
     <div class="ms-story glass"><div class="room">${r.room}</div><h3>${r.title}</h3><p>${r.story}</p></div>
     <div class="ms-clues">${r.clues.map((c,k)=>`<div class="clue ${s.clues.has(k)?'open':''}" data-k="${k}"><div class="clue-in"><div class="clue-f"><b>🔍 线索 ${k+1}</b><small>${c.t} · 点击翻开</small></div><div class="clue-b"><div class="ct">${c.t}</div>${c.c}</div></div></div>`).join('')}</div>
     <div class="ms-q glass"><div class="qt">❓ ${r.q}</div>
       <div class="ms-opts">${r.opts.map((o,k)=>`<button data-k="${k}"><i>${L[k]}</i><span>${o}</span></button>`).join('')}</div>
       <div class="ms-exp" id="ms-exp"></div>
       <div class="ms-nav"><button class="btn-ghost" id="ms-prev">← 上一间</button><button class="btn-neon" id="ms-next">${i===NQ-1?'提交结案报告 →':'下一个房间 →'}</button></div>
     </div>
   </div>`;
  GE.$$('.clue').forEach(c=> c.onclick = ()=>{ c.classList.toggle('open'); const k=+c.dataset.k; c.classList.contains('open') ? s.clues.add(k) : s.clues.delete(k); });
  GE.$$('.ms-map .rm').forEach(m=> m.onclick = ()=> room(+m.dataset.k));
  GE.$$('.ms-opts button').forEach(b=> b.onclick = ()=> pick(+b.dataset.k));
  GE.$('#ms-prev').onclick = ()=> i>0 ? room(i-1) : intro();
  GE.$('#ms-next').onclick = ()=> i<NQ-1 ? room(i+1) : result();
  paint();
}
function paint(){
  const r = R[cur], s = st[cur];
  GE.$$('.ms-opts button').forEach((b,k)=>{ b.classList.toggle('bad', s.picked.includes(k) && k!==r.a); b.classList.toggle('good', s.done && k===r.a); b.disabled = s.done || s.picked.includes(k); });
  const ex = GE.$('#ms-exp');
  if(s.done){ ex.innerHTML = `${s.teacher?'🧑‍🏫 教师揭晓：':s.pts===100?'✔ 推理正确！+100　':s.pts>0?'✔ 第二次答对 +50　':'✘ 答案揭晓　'}<br>${r.ex}`; ex.classList.add('show'); }
  else if(s.picked.length){ ex.innerHTML = '✘ 推理有误，再看看线索！还有一次机会。'; ex.classList.add('show'); ex.style.borderLeftColor = 'var(--mg)'; }
  else ex.classList.remove('show');
  if(s.done) ex.style.borderLeftColor = '';
}
function pick(k){
  const r = R[cur], s = st[cur]; if(s.done) return;
  s.picked.push(k); s.tries++;
  if(k===r.a){ s.done = true; s.pts = s.tries===1 ? 100 : 50; GE.beep('ok'); }
  else { GE.beep('bad'); if(s.tries>=2){ s.done = true; s.pts = 0; } }
  hud(); paint();
  if(s.done){ const m = GE.$$('.ms-map .rm')[cur]; m.classList.remove('cur'); m.classList.add(s.pts===100?'ok':s.pts>0?'half':'no'); m.querySelector('i').textContent = s.pts===100?'✔':s.pts>0?'½':'✘'; m.classList.add('cur'); }
}
function result(){
  cur = NQ; hud(); GE.beep('win');
  const sc = score(), full = NQ*100, pct = sc/full;
  const grade = pct>=.9?'S':pct>=.75?'A':pct>=.6?'B':'C';
  const title = {S:'首席基因侦探',A:'王牌特工',B:'见习调查员',C:'继续加油的新人'}[grade];
  body().innerHTML = `<div class="ms-result glass"><div class="hud-title" style="justify-content:center">CASE CLOSED · 结案报告</div>
    <div class="grade">${grade}</div><h2>${title}</h2><div class="dim">得分 ${sc} / ${full}　·　一次通关 ${st.filter(s=>s.pts===100).length} 间</div>
    <div class="stats">${R.map((r,i)=>`<span style="border-color:${st[i].pts===100?'var(--tl)':st[i].pts>0?'var(--am)':st[i].done?'var(--mg)':'var(--line)'}">${String(i+1).padStart(2,'0')} ${r.title}</span>`).join('')}</div>
    <div class="report"><b>案情还原：</b>逆转录病毒入侵，使“修复蛋白R”基因编码区发生碱基替换 → 以<b>模板链</b>为模板、在 <b>RNA聚合酶</b>作用下转录出的 mRNA 中，第 4 个密码子变为<b>终止密码子 UAG</b> → mRNA 经核孔进入细胞质，核糖体沿 mRNA 移动翻译至 UAG 时，<b>没有对应的 tRNA</b>，翻译提前终止 → 合成的肽链只有 <b>3 个氨基酸</b>，蛋白质“失控”。<br>
    另一处突变因<b>密码子的简并</b>而没有改变氨基酸序列。整个过程体现了 <b>DNA → RNA → 蛋白质</b> 的遗传信息流动（中心法则）。</div>
    <div style="display:flex;gap:12px;justify-content:center"><button class="btn-ghost" id="ms-review">回看关卡</button><button class="btn-neon" id="ms-again">重新挑战</button></div></div>`;
  GE.$('#ms-again').onclick = ()=>{ fresh(); intro(); };
  GE.$('#ms-review').onclick = ()=> room(0);
}
GE.register({
  id:'mission', title:'闯关挑战',
  init(){ fresh(); intro(); },
  next(){
    if(cur<0){ room(0); return true; }
    if(cur>=NQ) return false;
    const s = st[cur];
    if(!s.done){ const k = R[cur].clues.findIndex((_,i)=>!s.clues.has(i)); if(k>=0){ s.clues.add(k); GE.$$('.clue')[k].classList.add('open'); return true; }
      s.done = true; s.teacher = true; s.pts = 0; room(cur); return true; }
    cur<NQ-1 ? room(cur+1) : result(); return true;
  },
  prev(){ if(cur>=NQ){ room(NQ-1); return true; } if(cur>0){ room(cur-1); return true; } if(cur===0){ intro(); return true; } return false; },
  reset(){ fresh(); intro(); }
});
})();
