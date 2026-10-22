/* ============ 中心法则 ============ */
(function(){
const GE = window.GE;
const NODES = { DNA:[170,300,'#3fa9ff'], RNA:[470,300,'#b98cff'], PRO:[770,300,'#ffc857'] };
const ARROWS = [
  {id:'rep', name:'DNA 复制', d:'M120 245 C 60 120, 280 120, 220 245', col:'#3fa9ff', lx:170, ly:150, flow:'DNA → DNA',
    info:{模板:'DNA 的两条链', 原料:'4种脱氧核苷酸', 酶:'解旋酶、DNA聚合酶', 场景:'能分裂的细胞（细胞分裂前的间期）；DNA病毒在宿主细胞内'}},
  {id:'tx', name:'转录', d:'M235 270 C 300 225, 340 225, 405 270', col:'#22e6ff', lx:320, ly:222, flow:'DNA → RNA',
    info:{模板:'DNA 的一条链', 原料:'4种核糖核苷酸', 酶:'RNA聚合酶', 场景:'细胞生物（主要在细胞核）；DNA病毒在宿主细胞内'}},
  {id:'tl', name:'翻译', d:'M535 300 L 705 300', col:'#00ffc6', lx:620, ly:282, flow:'mRNA → 蛋白质',
    info:{模板:'mRNA', 原料:'21种氨基酸', 工具:'tRNA、核糖体', 场景:'所有具有细胞结构的生物；病毒在宿主细胞的核糖体上'}},
  {id:'rrep', name:'RNA 复制', d:'M420 245 C 360 120, 580 120, 520 245', col:'#b98cff', lx:470, ly:150, flow:'RNA → RNA', added:true,
    info:{模板:'RNA', 原料:'4种核糖核苷酸', 酶:'RNA复制酶', 场景:'某些RNA病毒（如烟草花叶病毒）；1965年在RNA病毒中发现RNA复制酶'}},
  {id:'rt', name:'逆转录', d:'M405 330 C 340 380, 300 380, 235 330', col:'#ff3f8e', lx:320, ly:405, flow:'RNA → DNA', added:true,
    info:{模板:'RNA', 原料:'4种脱氧核苷酸', 酶:'逆转录酶', 场景:'逆转录病毒（如 HIV、某些致癌RNA病毒）；1970年发现逆转录酶'}}
];
const MODES = {
  all:{on:['rep','tx','tl','rrep','rt'], t:'完整的中心法则', p:'遗传信息可以从 DNA 流向 DNA（复制），也可以从 DNA 流向 RNA，进而流向蛋白质（转录和翻译）。后来发现：遗传信息也可以从 RNA 流向 RNA（RNA复制）以及从 RNA 流向 DNA（逆转录），这是对中心法则的补充。'},
  crick:{on:['rep','tx','tl'], t:'1957年 克里克提出的中心法则', p:'最初内容：遗传信息可以从 DNA 流向 DNA，即 DNA 的复制；也可以从 DNA 流向 RNA，进而流向蛋白质，即遗传信息的转录和翻译。'},
  cell:{on:['rep','tx','tl'], t:'细胞生物（如人、大肠杆菌）', p:'能分裂的细胞：DNA复制、转录、翻译。高度分化的细胞（如神经细胞、心肌细胞）一般不再分裂，不进行 DNA 复制，但仍进行转录和翻译。'},
  rnavirus:{on:['rrep','tl'], t:'RNA复制病毒（如烟草花叶病毒）', p:'以 RNA 为遗传物质，在宿主细胞内通过 RNA 复制产生子代 RNA，并以 RNA 为模板，利用宿主细胞的核糖体翻译出病毒蛋白质。'},
  retro:{on:['rt','rep','tx','tl'], t:'逆转录病毒（如 HIV）', p:'病毒 RNA 在逆转录酶作用下合成 DNA，DNA 可整合到宿主细胞的 DNA 上并复制，再经转录、翻译合成病毒蛋白质和子代 RNA。'}
};
let mode = 'all', sel = null;
const order = Object.keys(MODES);
function draw(){
  const svg = GE.$('#dogma-svg');
  let s = `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    ${ARROWS.map(a=>`<marker id="ah-${a.id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${a.col}"/></marker>`).join('')}</defs>`;
  ARROWS.forEach(a=>{
    s += `<g class="dg-arrow" data-id="${a.id}"><path class="line" d="${a.d}" stroke="${a.col}" marker-end="url(#ah-${a.id})" ${a.added?'stroke-dasharray="14 8"':''}/>
      <path d="${a.d}" stroke="transparent" stroke-width="30" fill="none"/>
      <rect class="lbg" x="${a.lx-58}" y="${a.ly-20}" width="116" height="38" rx="10" fill="rgba(3,12,22,.85)" stroke="${a.col}"/>
      <text x="${a.lx}" y="${a.ly+8}" text-anchor="middle">${a.name}</text>
      ${[0,1,2].map(i=>`<circle r="5" fill="${a.col}" filter="url(#glow)"><animateMotion dur="2.4s" begin="${i*.8}s" repeatCount="indefinite" path="${a.d}"/></circle>`).join('')}</g>`;
  });
  Object.entries(NODES).forEach(([k,[x,y,c]])=>{
    const lab = k==='PRO' ? '蛋白质' : k;
    s += `<g class="dg-node"><circle cx="${x}" cy="${y}" r="62" fill="rgba(3,12,22,.9)" stroke="${c}" stroke-width="3" filter="url(#glow)"/><circle cx="${x}" cy="${y}" r="74" fill="none" stroke="${c}" stroke-opacity=".3" stroke-dasharray="4 8"><animateTransform attributeName="transform" type="rotate" from="0 ${x} ${y}" to="360 ${x} ${y}" dur="20s" repeatCount="indefinite"/></circle><text x="${x}" y="${y+12}" text-anchor="middle" font-size="${k==='PRO'?30:36}" fill="${c}">${lab}</text></g>`;
  });
  s += `<text x="450" y="500" text-anchor="middle" fill="#7f9bb0" font-size="17">实线：克里克最初提出　·　虚线：后来补充（RNA复制、逆转录）　·　点击箭头查看详情</text>`;
  svg.innerHTML = s;
  GE.$$('.dg-arrow', svg).forEach(g=> g.onclick = ()=>{ sel = sel===g.dataset.id ? null : g.dataset.id; apply(); });
}
function apply(){
  const m = MODES[mode];
  GE.$$('#dogma-tabs button').forEach(b=>b.classList.toggle('on', b.dataset.o===mode));
  GE.$$('.dg-arrow').forEach(g=>{ g.classList.toggle('off', !m.on.includes(g.dataset.id)); g.classList.toggle('sel', g.dataset.id===sel); });
  let h = `<div class="hud-title">${mode==='all'?'CENTRAL DOGMA':'INFORMATION FLOW'}</div><h3>${m.t}</h3><p>${m.p}</p><div class="tagrow">${m.on.map(id=>{ const a = ARROWS.find(x=>x.id===id); return `<span style="border-color:${a.col};color:${a.col}">${a.name}：${a.flow}</span>`; }).join('')}</div>`;
  if(sel){ const a = ARROWS.find(x=>x.id===sel); h += `<div class="glass" style="padding:12px 16px;margin-top:8px;border-color:${a.col}"><b style="color:${a.col};font-size:1.15em">${a.name}</b>　<span class="mono">${a.flow}</span><dl class="kv" style="margin-top:8px">${Object.entries(a.info).map(([k,v])=>`<dt>${k}</dt><dd class="mask">${v}</dd>`).join('')}</dl></div>`; }
  else h += `<p class="dim" style="font-size:.88em">↖ 点击图中任一箭头，查看该过程的模板、原料、酶与适用范围。</p>`;
  h += `<p class="note">遗传信息不能从蛋白质流向蛋白质或核酸。以上过程都遵循<b>碱基互补配对原则</b>。</p>`;
  GE.$('#dogma-info').innerHTML = h;
}
GE.register({
  id:'dogma', title:'中心法则',
  init(){ draw(); GE.$$('#dogma-tabs button').forEach(b=> b.onclick = ()=>{ mode = b.dataset.o; sel = null; apply(); }); apply(); },
  next(){ const i = order.indexOf(mode); if(i<order.length-1){ mode = order[i+1]; sel=null; apply(); return true; } return false; },
  prev(){ const i = order.indexOf(mode); if(i>0){ mode = order[i-1]; sel=null; apply(); return true; } return false; },
  reset(){ mode='all'; sel=null; apply(); }
});
})();
