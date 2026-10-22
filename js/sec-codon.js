/* ============ 密码子解码台 ============ */
(function(){
const GE = window.GE, B = ['U','C','A','G'];
let table, filt = null, game = null;
const DEG_COL = {1:'#ff9fb8',2:'#7fd6ff',3:'#ffe17a',4:'#8dffc9',6:'#c7a8ff'};

function render(){
  let h = `<tr><th class="first">第一个<br>碱基</th>${B.map(b=>`<th>第二个碱基 <span class="bigb" style="color:${GE.BASE_CSS[b]}">${b}</span></th>`).join('')}<th class="third">第三个<br>碱基</th></tr>`;
  B.forEach(b1=>{
    h += `<tr><th class="first"><span class="bigb" style="color:${GE.BASE_CSS[b1]}">${b1}</span></th>`;
    B.forEach(b2=>{
      h += '<td class="cell">';
      B.forEach(b3=>{ const c = b1+b2+b3, a = GE.CODE[c]; const cls = (c==='AUG'||c==='GUG') ? ' start' : a==='Stop' ? ' stop' : '';
        const nm = a==='Stop' ? '终止' : GE.aaName(a) + (c==='AUG' ? '<sup style="color:var(--tl)">起始</sup>' : c==='GUG' ? '<sup style="color:var(--tl)">*</sup>' : '');
        h += `<div class="cd${cls}" data-c="${c}" data-a="${a}"><span class="co">${[b1,b2,b3].map(x=>`<i style="color:${GE.BASE_CSS[x]}">${x}</i>`).join('')}</span><span class="an mask">${nm}</span><span class="ab">${a==='Stop'?'':a}</span></div>`; });
      h += '</td>';
    });
    h += `<th class="third">${B.map(b=>`<div style="line-height:1.55;padding:3px 0;color:${GE.BASE_CSS[b]};font-family:monospace">${b}</div>`).join('')}</th></tr>`;
  });
  table.innerHTML = h;
}
function highlight(pred, msg){
  const cds = GE.$$('.cd', table); let n = 0;
  if(!pred){ table.classList.remove('filtering'); cds.forEach(c=>c.classList.remove('hit')); GE.$('#codon-foot').innerHTML = '点击任意密码子或氨基酸，查看它的所有密码子（简并性）。'; return; }
  table.classList.add('filtering'); cds.forEach(c=>{ const on = pred(c.dataset.c, c.dataset.a); c.classList.toggle('hit', on); if(on) n++; });
  GE.$('#codon-foot').innerHTML = msg ? msg(n) : `找到 <b>${n}</b> 个密码子`;
}
function aaInfo(a, extra=''){
  if(a==='Stop') return `<b>终止密码子</b>：UAA、UAG、UGA，共 3 种。一般不编码氨基酸，是翻译终止的信号，没有对应的 tRNA；特殊情况下 UGA 可以编码硒代半胱氨酸。${extra}`;
  const list = Object.keys(GE.CODE).filter(c=>GE.CODE[c]===a);
  return `<b>${GE.aaName(a)}（${a}）</b> 有 <b>${list.length}</b> 个密码子：<span class="mono">${list.join('、')}</span>${list.length>1?' —— 密码子的<b>简并</b>':'（只有1个密码子）'}。${extra}`;
}
function selectCodon(c){
  const a = GE.CODE[c], ac = c.split('').map(x=>GE.comp[x]).join('');
  const note = GE.CODON_NOTE[c] ? `<br>📌 ${GE.CODON_NOTE[c]}` : '';
  const tr = a==='Stop' ? '' : `<br>对应 tRNA 反密码子：<span class="mono">3'-${ac}-5'</span>；DNA 模板链：<span class="mono">3'-${c.replace(/./g,x=>({A:'T',U:'A',G:'C',C:'G'})[x])}-5'</span>`;
  highlight((cc,aa)=> aa===a, ()=> `<span class="mono" style="color:#fff">${c}</span> → ${aaInfo(a)}${tr}${note}`);
}
function search(q){
  q = q.trim(); filt = null; GE.$$('#codon-filters button').forEach(b=>b.classList.remove('on'));
  if(!q) return highlight(null);
  const up = q.toUpperCase().replace(/T/g,'U');
  if(/^[AUGC]{1,3}$/.test(up)){
    if(up.length===3) return selectCodon(up);
    return highlight(c=>c.startsWith(up), n=>`以 <span class="mono">${up}</span> 开头的密码子共 <b>${n}</b> 个`);
  }
  const hit = Object.keys(GE.AA).find(k=> k.toUpperCase()===q.toUpperCase() || GE.AA[k][0]===q) || Object.keys(GE.AA).find(k=> GE.AA[k][0].includes(q) || (q.length===1 && GE.AA[k][1]===q.toUpperCase()));
  if(hit) return highlight((c,a)=>a===hit, ()=> aaInfo(hit));
  highlight(()=>false, ()=> `未找到“${q}”。可输入密码子（如 GCU）、中文名（如 丙氨酸）或缩写（如 Ala）。`);
}
function decode(){
  let raw = GE.$('#dec-input').value.toUpperCase().replace(/[^AUGCT]/g,'');
  const isDNA = GE.$('#dec-dna').checked;
  let m = isDNA ? raw.replace(/./g,x=>({A:'U',T:'A',G:'C',C:'G',U:'A'})[x]) : raw.replace(/T/g,'U');
  const out = GE.$('#dec-out');
  if(!m){ out.innerHTML = '<span class="dim">请输入碱基序列</span>'; return; }
  const st = m.indexOf('AUG');
  let html = isDNA ? `<div class="dim" style="font-size:.85em">转录得 mRNA 5'→3'：<span class="mono">${m}</span></div>` : '';
  if(st<0){ out.innerHTML = html + '<div class="res">未找到起始密码子 <b>AUG</b>，翻译无法开始。</div>'; return; }
  html += `<span class="tri out">${m.slice(0,st)||'·'}</span>`;
  const peps = []; let i = st, ended = false;
  for(; i+3<=m.length; i+=3){ const c = m.slice(i,i+3), a = GE.CODE[c];
    if(ended){ html += `<span class="tri out">${c}</span>`; continue; }
    if(a==='Stop'){ html += `<span class="tri sp" title="终止">${c}</span>`; ended = true; continue; }
    html += `<span class="tri${i===st?' st':''}" title="${GE.aaName(a)}">${c}<small style="color:var(--dim)"> ${GE.aaName(a)}</small></span>`; peps.push(a); }
  if(i<m.length) html += `<span class="tri out">${m.slice(i)}</span>`;
  html += `<div class="res">肽链：${peps.map(GE.aaName).join(' — ')}　<span class="dim">（${peps.length} 个氨基酸${ended?'，遇终止密码子停止':'，未遇到终止密码子'}）</span></div>`;
  out.innerHTML = html;
}
/* ---------- 小游戏 ---------- */
function gameStart(){
  game = {score:0, combo:0, right:0, total:0, t:60};
  next();
  clearInterval(game.iv);
  game.iv = setInterval(()=>{ game.t -= .25; const bar = GE.$('#game-bar i'); if(bar) bar.style.width = (game.t/60*100)+'%'; if(game.t<=0) gameEnd(); }, 250);
}
function next(){
  const keys = Object.keys(GE.CODE), c = keys[(Math.random()*64)|0], a = GE.CODE[c];
  const pool = Object.keys(GE.AA).filter(k=>k!==a); const opts = [a];
  while(opts.length<4){ const x = pool[(Math.random()*pool.length)|0]; if(!opts.includes(x)) opts.push(x); }
  opts.sort(()=>Math.random()-.5);
  GE.$('#game-box').innerHTML = `<div class="game-bar" id="game-bar"><i style="width:${game.t/60*100}%"></i></div><div class="game-codon">${c.split('').map(x=>`<span style="color:${GE.BASE_CSS[x]}">${x}</span>`).join('')}</div><div class="game-opts">${opts.map(o=>`<button data-a="${o}">${o==='Stop'?'终止（不编码）':GE.aaName(o)}</button>`).join('')}</div><div class="dim" style="font-size:.8em">连对 ${game.combo} · 正确 ${game.right}/${game.total}</div>`;
  GE.$$('#game-box .game-opts button').forEach(b=> b.onclick = ()=>{
    if(!game || game.lock) return; game.total++; game.lock = true;
    if(b.dataset.a===a){ game.combo++; game.right++; game.score += 10 + Math.min(game.combo-1,5)*2; b.classList.add('good'); GE.beep('ok'); }
    else { game.combo=0; b.classList.add('bad'); GE.$(`#game-box button[data-a="${a}"]`).classList.add('good'); GE.beep('bad'); }
    GE.$('#game-score').textContent = game.score+' 分';
    setTimeout(()=>{ if(game){ game.lock=false; if(game.t>0) next(); } }, 550);
  });
}
function gameEnd(){
  if(!game) return; clearInterval(game.iv);
  const g = game; game = null; GE.beep('win');
  GE.$('#game-box').innerHTML = `<div class="game-idle">时间到！<br><b style="font-size:2em;color:var(--am)">${g.score}</b> 分<br>正确 ${g.right} / ${g.total}</div><button class="btn-neon" id="game-start">再来一次</button>`;
  GE.$('#game-start').onclick = gameStart;
}

GE.register({
  id:'codon', title:'密码子解码台',
  init(){
    table = GE.$('#codon-table'); render();
    table.addEventListener('click', e=>{ const c = e.target.closest('.cd'); if(!c) return; if(document.body.classList.contains('hide-answers') && e.target.closest('.mask')) return; selectCodon(c.dataset.c); GE.$('#codon-search').value = c.dataset.c; });
    GE.$('#codon-search').addEventListener('input', e=> search(e.target.value));
    GE.$$('#codon-filters button').forEach(b=> b.onclick = ()=>{
      const f = b.dataset.f; GE.$('#codon-search').value = '';
      if(f==='deg'){ const on = !table.classList.contains('deg'); table.classList.toggle('deg', on); b.classList.toggle('on', on);
        GE.$$('.cd', table).forEach(c=>{ const an = c.querySelector('.an'); an.style.background = on && c.dataset.a!=='Stop' ? DEG_COL[GE.degeneracy[c.dataset.a]] : ''; });
        GE.$('#codon-foot').innerHTML = on ? '颜色表示该氨基酸拥有的密码子数：<span style="color:#ff9fb8">■1</span> <span style="color:#7fd6ff">■2</span> <span style="color:#ffe17a">■3</span> <span style="color:#8dffc9">■4</span> <span style="color:#c7a8ff">■6</span>　（只有甲硫氨酸、色氨酸各有 1 个密码子）' : ''; return; }
      GE.$$('#codon-filters button').forEach(x=>{ if(x.dataset.f!=='deg') x.classList.remove('on'); });
      if(f==='clear'){ highlight(null); return; }
      b.classList.add('on');
      if(f==='start') highlight(c=>c==='AUG'||c==='GUG', ()=> '<b>起始密码子</b>：<span class="mono">AUG</span>（编码甲硫氨酸）；<span class="mono">GUG</span> 在原核生物中可作起始密码子，此时编码甲硫氨酸，其他情况下编码缬氨酸。');
      if(f==='stop') highlight((c,a)=>a==='Stop', ()=> aaInfo('Stop'));
    });
    GE.$('#dec-run').onclick = decode; GE.$('#dec-input').addEventListener('input', decode); GE.$('#dec-dna').onchange = decode;
    GE.$('#game-start').onclick = gameStart;
    decode();
  },
  leave(){ if(game){ clearInterval(game.iv); game=null; GE.$('#game-box').innerHTML = `<div class="game-idle">看密码子，选出它决定的氨基酸。<br>答对 +10，连对有加成。</div><button class="btn-neon" id="game-start">开始挑战</button>`; GE.$('#game-start').onclick = gameStart; } },
  reset(){ GE.$('#codon-search').value=''; highlight(null); table.classList.remove('deg'); GE.$$('.cd .an',table).forEach(a=>a.style.background=''); GE.$$('#codon-filters button').forEach(x=>x.classList.remove('on')); GE.$('#dec-input').value='GCAUGCACUGGAAAGGUUAAGC'; GE.$('#dec-dna').checked=false; decode(); }
});
})();
