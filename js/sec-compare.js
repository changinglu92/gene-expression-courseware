/* ============ 对比与易错 ============ */
(function(){
const GE = window.GE;
const TABS = ['pe','three','trap','calc'];
let tab = 'pe';
function setTab(t){ tab = t; GE.$$('#cmp-tabs button').forEach(b=>b.classList.toggle('on', b.dataset.t===t)); GE.$$('.cmp-pane').forEach(p=>p.classList.toggle('on', p.dataset.p===t)); }

function svgEuk(){
  return `<defs><radialGradient id="gcy" cx="50%" cy="50%"><stop offset="0" stop-color="#22e6ff" stop-opacity=".18"/><stop offset="1" stop-color="#22e6ff" stop-opacity="0"/></radialGradient>
  <path id="mpath1" d="M175 165 C 230 150, 262 120, 300 110 S 390 100, 430 140"/></defs>
  <ellipse cx="260" cy="165" rx="245" ry="150" fill="url(#gcy)" stroke="#22e6ff" stroke-opacity=".6" stroke-width="2"/>
  <circle cx="160" cy="170" r="88" fill="rgba(122,92,255,.12)" stroke="#9d7bff" stroke-width="3" stroke-dasharray="14 5"/>
  <text x="160" y="250" fill="#b9a6ff" font-size="15" text-anchor="middle">细胞核</text>
  <path d="M100 150 q15 -20 30 0 t30 0 t30 0 t30 0" fill="none" stroke="#3fa9ff" stroke-width="4"/>
  <path d="M100 160 q15 20 30 0 t30 0 t30 0 t30 0" fill="none" stroke="#5a6b85" stroke-width="4"/>
  <text x="160" y="195" fill="#9fd2ff" font-size="14" text-anchor="middle">① 转录：DNA → mRNA</text>
  <rect x="243" y="118" width="12" height="22" rx="3" fill="#22e6ff"/><text x="250" y="105" fill="#22e6ff" font-size="13" text-anchor="middle">核孔</text>
  <g><path d="M0 0 q6 -6 12 0 t12 0 t12 0 t12 0" fill="none" stroke="#b98cff" stroke-width="4"/>
    <animateMotion dur="5s" repeatCount="indefinite" rotate="auto"><mpath href="#mpath1"/></animateMotion></g>
  <text x="330" y="88" fill="#d3bcff" font-size="14">② mRNA 经核孔进入细胞质</text>
  <g transform="translate(420,170)">
    <path d="M-60 0 q8 -8 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="#b98cff" stroke-width="4"/>
    ${[-40,0,40].map((x,i)=>`<g transform="translate(${x},-6)"><ellipse rx="17" ry="9" cy="12" fill="rgba(34,230,255,.35)" stroke="#22e6ff"/><ellipse rx="20" ry="13" cy="-6" fill="rgba(0,255,198,.3)" stroke="#00ffc6"/><path d="M0 -18 q-6 -10 2 -18 q8 -8 0 -18" fill="none" stroke="#ffc857" stroke-width="3" stroke-dasharray="${8+i*8} 40"/></g>`).join('')}
    <text x="0" y="45" fill="#7dffd9" font-size="14" text-anchor="middle">③ 翻译：核糖体（细胞质）</text>
  </g>
  <text x="260" y="305" fill="#ffc857" font-size="15" text-anchor="middle" font-weight="bold">时空分隔 · 先转录 后翻译</text>`;
}
function svgPro(){
  let s = `<rect x="15" y="20" width="490" height="290" rx="140" fill="rgba(34,230,255,.06)" stroke="#22e6ff" stroke-opacity=".6" stroke-width="2"/>
  <text x="260" y="300" fill="#ffc857" font-size="15" text-anchor="middle" font-weight="bold">无核膜 · 边转录 边翻译</text>
  <path d="M60 230 L460 230" stroke="#3fa9ff" stroke-width="5"/><path d="M60 238 L460 238" stroke="#5a6b85" stroke-width="5"/>
  <text x="70" y="262" fill="#9fd2ff" font-size="14">拟核 DNA</text>
  <text x="470" y="222" fill="#7dffd9" font-size="13" text-anchor="end">RNA聚合酶移动方向 →</text>`;
  const xs = [110,190,270,350,430];
  xs.forEach((x,i)=>{ const len = 30 + i*32;
    s += `<circle cx="${x}" cy="232" r="9" fill="#00ffc6" opacity=".85"><animate attributeName="r" values="8;11;8" dur="1.6s" repeatCount="indefinite" begin="${i*.2}s"/></circle>`;
    s += `<path d="M${x} 224 q-10 -${len/4} 0 -${len/2} t0 -${len/2}" fill="none" stroke="#b98cff" stroke-width="3.5"/>`;
    for(let r=0;r<=i;r++){ const y = 224 - len + r*(len/(i+1)) + 6; s += `<ellipse cx="${x+ (r%2?6:-6)}" cy="${y}" rx="11" ry="7" fill="rgba(0,255,198,.35)" stroke="#00ffc6"/>`; }
  });
  s += `<text x="260" y="45" fill="#d3bcff" font-size="14" text-anchor="middle">mRNA 尚未合成完，核糖体就已结合并开始翻译（多聚核糖体）</text>`;
  return s;
}
function threeTable(){
  const T = GE.THREE; let h = `<tr>${T.head.map(x=>`<th>${x}</th>`).join('')}</tr>`;
  T.rows.forEach(r=>{ h += `<tr><td>${r[0]}</td>${r.slice(1).map(c=>`<td class="mask">${c}</td>`).join('')}</tr>`; });
  GE.$('#three-table').innerHTML = h;
}
function traps(){
  GE.$('#trap-grid').innerHTML = GE.TRAPS.map((t,i)=>`<div class="trap" data-i="${i}"><div class="trap-in">
    <div class="trap-f"><div class="tg">易错 ${String(i+1).padStart(2,'0')} · ${t.tag}</div><div class="st">${t.s}</div><div class="hint">判断对错 · 点击翻转</div></div>
    <div class="trap-b ${t.ok?'':'wrong'}"><div class="vd ${t.ok?'t':'f'}">${t.ok?'✔ 正确':'✘ 错误'}</div><div class="ex">${t.e}</div></div></div></div>`).join('');
  GE.$$('.trap').forEach(c=> c.onclick = ()=> c.classList.toggle('flip'));
}
function calc(){
  const n = Math.max(1, Math.min(999, +GE.$('#calc-n').value||1)), m = Math.max(1, Math.min(n, +GE.$('#calc-m').value||1));
  const show = Math.min(n, 12), more = n>12 ? `<span class="dim" style="margin-left:6px">… 共 ${n} 个</span>` : '';
  const units = (k, colorFn, grp) => Array.from({length:k}, (_,i)=>`<i class="u${grp && i%grp===grp-1?' gp':''}" style="background:${colorFn(i)}"></i>`).join('');
  const mr = GE.DEMO.mrna; const pal = i => GE.BASE_CSS['AUGC'[(i*7+3)%4]];
  const seq = Array.from({length:show*3}, (_,i)=> 'AUGCAGUCGAUC'[ (i*5)%12 ]);
  const dnaT = seq.map(b=>({A:'T',U:'A',G:'C',C:'G'})[b]), dnaC = seq.map(b=>b==='U'?'T':b);
  GE.$('#calc-viz').innerHTML = `
   <div class="row"><span>DNA 编码链</span><div class="units">${units(show*3, i=>GE.BASE_CSS[dnaC[i]], 3)}</div>${more}</div>
   <div class="row"><span>DNA 模板链</span><div class="units">${units(show*3, i=>GE.BASE_CSS[dnaT[i]], 3)}</div></div>
   <div class="row"><span>mRNA</span><div class="units">${units(show*3, i=>GE.BASE_CSS[seq[i]], 3)}</div></div>
   <div class="row"><span>氨基酸</span><div class="units">${Array.from({length:show},(_,i)=>`<i class="aa" style="background:hsl(${i*37%360} 80% 65%)"></i>`).join('')}</div></div>`;
  GE.$('#calc-res').innerHTML = `
    <div><small>基因（DNA）碱基数</small><b class="mask">≥ ${6*n}</b><em>6n（两条链）</em></div>
    <div><small>mRNA 碱基数</small><b class="mask">≥ ${3*n}</b><em>3n（不计终止密码子）</em></div>
    <div><small>决定氨基酸的密码子数</small><b class="mask">${n}</b><em>另有 1 个终止密码子</em></div>
    <div><small>tRNA 搬运次数</small><b class="mask">${n}</b><em>每次搬运 1 个氨基酸</em></div>
    <div><small>肽键数 = 脱水数</small><b class="mask">${n-m}</b><em>n − m（m 条肽链）</em></div>`;
}
GE.register({
  id:'cmp', title:'对比与易错',
  init(){
    GE.$('#svg-euk').innerHTML = svgEuk(); GE.$('#svg-pro').innerHTML = svgPro();
    threeTable(); traps(); calc();
    GE.$$('#cmp-tabs button').forEach(b=> b.onclick = ()=> setTab(b.dataset.t));
    const n = GE.$('#calc-n'), r = GE.$('#calc-range');
    n.oninput = ()=>{ r.value = Math.min(12, +n.value||1); calc(); }; r.oninput = ()=>{ n.value = r.value; calc(); }; GE.$('#calc-m').oninput = calc;
  },
  next(){ const i = TABS.indexOf(tab); if(tab==='trap'){ const c = GE.$$('.trap:not(.flip)')[0]; if(c){ c.classList.add('flip'); c.scrollIntoView({block:'nearest',behavior:'smooth'}); return true; } } if(i<TABS.length-1){ setTab(TABS[i+1]); return true; } return false; },
  prev(){ const i = TABS.indexOf(tab); if(i>0){ setTab(TABS[i-1]); return true; } return false; },
  reset(){ setTab('pe'); GE.$$('.trap').forEach(c=>c.classList.remove('flip')); GE.$('#calc-n').value=4; GE.$('#calc-range').value=4; GE.$('#calc-m').value=1; calc(); }
});
})();
