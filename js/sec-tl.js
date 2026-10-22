/* ============ 翻译工厂 ============ */
(function(){
const GE = window.GE, D = GE.DEMO;
const FL = 'CGC', FR = 'ACG';
const seq = FL + D.mrna + FR, NB = seq.length, DX = .6, CW = DX*3;
const C = D.mrna.match(/.../g), K = C.length;            // 6 个密码子
const AAS = C.map(c=>GE.CODE[c]);                         // Met His Trp Lys Gly Stop
let S, ST = [], si = 0, playing=false, timer=0, speed=1, mode='manual';
let ribo, small, large, sites={}, trnas=[], aaMeshes=[], bonds=[], mBeads=[];
const xAt = j => (j-(NB-1)/2)*DX;
const cX = k => xAt(FL.length + 3*k + 1);
const up = new THREE.Vector3(0,1,0), tmp = new THREE.Vector3();
function orient(m,a,b){ tmp.copy(b).sub(a); const l=tmp.length()||1e-4; m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(1,l,1); m.quaternion.setFromUnitVectors(up,tmp.divideScalar(l)); }
const anti = c => c.split('').map(b=>GE.comp[b]).join('');

/* ---------- 状态序列 ---------- */
function buildStates(){
  ST = [];
  const base = {r:0, entered:0, holder:-1, len:0, released:false, await:null};
  const push = (o, t, b) => ST.push(Object.assign({}, ST.length ? ST[ST.length-1] : base, o, {t, b}));
  push({await:0}, '准备 · mRNA 与核糖体结合', 'mRNA 进入细胞质，与核糖体结合，形成合成蛋白质的“生产线”。起始密码子 <b>AUG</b> 位于<b>位点1</b>。请为 AUG 选择正确的 tRNA。');
  push({entered:1, holder:0, len:1, await:1}, '第1步 · 起始', '携带<b>甲硫氨酸</b>的 tRNA，通过反密码子 <b>UAC</b> 与 AUG 互补配对，进入<b>位点1</b>。下一个密码子 <b>'+C[1]+'</b> 已进入位点2。');
  for(let k=1;k<K-1;k++){
    push({entered:k+1, await:null}, '第2步 · 进位', `携带<b>${GE.aaName(AAS[k])}</b>的 tRNA 以同样的方式（反密码子 ${anti(C[k])} 与密码子 ${C[k]} 配对）进入<b>位点2</b>。`);
    push({holder:k, len:k+1}, '第3步 · 形成肽键', `位点1上的${k===1?'甲硫氨酸':'肽链'}与这个氨基酸形成<b>肽键</b>（脱水缩合），从而转移到位点2的 tRNA 上。肽链现有 <b>${k+1}</b> 个氨基酸。`);
    push({r:k, await:k+1}, '第4步 · 移位', `核糖体沿 mRNA <b>5'→3'</b> 移动一个密码子的距离：原位点1的 tRNA 离开，原位点2的 tRNA 进入位点1，位点2读取下一个密码子 <b>${C[k+1]}</b>${k+1===K-1?'（终止密码子！）':''}。`);
  }
  push({released:true, await:null}, '终止 · 肽链释放', '核糖体遇到<b>终止密码子 UAA</b>：没有与之配对的 tRNA，合成告终止。肽链（甲硫氨酸—组氨酸—色氨酸—赖氨酸—甘氨酸）从核糖体上释放，经加工成为成熟的蛋白质；核糖体大小亚基解离，可再次使用。');
}

/* ---------- 3D ---------- */
function makeTRNA(k){
  const g = new THREE.Group();
  const acs = anti(C[k]);
  const bodyM = GE.mat(0xff7a1a,{transparent:true, opacity:.95, emissiveIntensity:.22, roughness:.55, metalness:0});
  for(let i=0;i<3;i++){ const r = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.45,10), GE.mat(GE.BASE_COLOR[acs[i]],{emissiveIntensity:.8})); r.position.set((i-1)*DX, .78, 0); g.add(r);
    const t = GE.textSprite(acs[i],{fs:64,h:.28,color:GE.BASE_CSS[acs[i]]}); t.position.set((i-1)*DX,.62,.25); g.add(t); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,CW*.85,10), bodyM); bar.rotation.z=Math.PI/2; bar.position.y=1.02; g.add(bar);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,1.5,12), bodyM); stem.position.y=1.8; g.add(stem);
  [[-.42,1.85,Math.PI/2],[.42,1.85,Math.PI/2],[0,2.25,0]].forEach(([x,y,r])=>{ const lobe = new THREE.Mesh(new THREE.TorusGeometry(.24,.07,8,24), bodyM); lobe.position.set(x,y,0); lobe.rotation.z = r; g.add(lobe); });
  const acc = new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.4,8), bodyM); acc.position.y=2.75; g.add(acc);
  g.userData = {k, op:0};
  g.traverse(o=>{ if(o.material){ o.material = o.material.clone(); o.material.transparent = true; o.material.userData.base = o.material.opacity; } });
  return g;
}
function build(){
  S = GE.make3D(GE.$('#tl-3d'), {dist:14, fog:.02, limitX:.5, springBack:true});
  S.scene.add(GE.starfield(900,60));
  S.pivot.position.y = .2;
  // mRNA
  const bead = new THREE.SphereGeometry(.12,14,10), link = new THREE.CylinderGeometry(.04,.04,1,6);
  const mB = GE.mat(0xb98cff,{emissiveIntensity:.8}), mL = new THREE.MeshBasicMaterial({color:0xb98cff});
  for(let j=0;j<NB;j++){
    const b = new THREE.Mesh(bead,mB); b.position.set(xAt(j),0,0); S.pivot.add(b); mBeads.push(b);
    const fl = j<FL.length || j>=NB-FR.length;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.45,10), GE.mat(GE.BASE_COLOR[seq[j]],{emissiveIntensity: fl?.2:.7, transparent:true, opacity: fl?.45:1})); r.position.set(xAt(j),.24,0); S.pivot.add(r);
    const t = GE.textSprite(seq[j],{fs:64,h:.28,color:GE.BASE_CSS[seq[j]]}); t.position.set(xAt(j),-.32,.2); S.pivot.add(t);
    if(j>0){ const l = new THREE.Mesh(link,mL); orient(l, new THREE.Vector3(xAt(j-1),0,0), new THREE.Vector3(xAt(j),0,0)); S.pivot.add(l); }
  }
  // 密码子分隔
  for(let k=0;k<=K;k++){ const m = new THREE.Mesh(new THREE.BoxGeometry(.02,.9,.02), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.25})); m.position.set(cX(k)-CW/2,.05,0); S.pivot.add(m); }
  S.addLabel(mBeads[0],"mRNA 5'",'small',new THREE.Vector3(-.6,0,0));
  S.addLabel(mBeads[NB-1],"3'",'small',new THREE.Vector3(.4,0,0));
  // 核糖体
  ribo = new THREE.Group(); S.pivot.add(ribo);
  small = new THREE.Mesh(new THREE.SphereGeometry(1,48,32), GE.glassMat(0x22e6ff,.2)); small.scale.set(3.3,.95,1.7); small.position.y = -.75; ribo.add(small);
  large = new THREE.Mesh(new THREE.SphereGeometry(1,48,32), GE.glassMat(0x00ffc6,.13)); large.scale.set(3.6,2.2,2.1); large.position.y = 2.05; ribo.add(large);
  [small,large].forEach(m=>{ const w = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({color:0x22e6ff,wireframe:true,transparent:true,opacity:.07})); m.add(w); });
  ribo.add(GE.glowSprite(0x22e6ff,7,.08));
  [['E',-1.5*CW,0x777777,'E位'],['P',-.5*CW,0xffc857,'位点1 · P'],['A',.5*CW,0x22e6ff,'位点2 · A']].forEach(([n,x,c,lab])=>{
    const box = new THREE.Mesh(new THREE.BoxGeometry(CW*.92,2.6,1.2), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity: n==='E'?.04:.07, depthWrite:false}));
    box.position.set(x,1.65,0); ribo.add(box);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({color:c, transparent:true, opacity:n==='E'?.25:.6})); edge.position.copy(box.position); ribo.add(edge);
    sites[n] = {box, edge, label: S.addLabel(box, lab, n==='E'?'small':(n==='P'?'warm':''), new THREE.Vector3(0,-1.75,.7))};
  });
  S.riboLabel = S.addLabel(large,'核糖体','',new THREE.Vector3(1.05,1.1,0));
  // tRNA 与氨基酸
  for(let k=0;k<K-1;k++){ const t = makeTRNA(k); t.position.set(cX(k)+5,6,3); t.visible=false; S.pivot.add(t); trnas.push(t);
    const aa = new THREE.Group(); const sp = new THREE.Mesh(new THREE.SphereGeometry(.34,24,16), GE.mat(new THREE.Color(GE.AA_COLOR[AAS[k]]).getHex(),{emissiveIntensity:.55})); aa.add(sp);
    const tx = GE.textSprite(AAS[k],{fs:60,h:.26,color:'#001018',depthTest:false}); tx.position.z=.36; aa.add(tx);
    aa.position.copy(t.position); aa.visible=false; S.pivot.add(aa); aaMeshes.push(aa);
    aa.userData.lab = S.addLabel(aa, GE.aaName(AAS[k]), 'small', new THREE.Vector3(.0,.55,0));
  }
  for(let k=0;k<K-2;k++){ const b = new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1,8), new THREE.MeshBasicMaterial({color:0xffffff})); b.visible=false; S.pivot.add(b); bonds.push(b); }
}
function fade(g,a){ g.traverse(o=>{ if(o.material) o.material.opacity = (o.material.userData.base ?? 1)*a; }); }

function poses(t, dt){
  const st = ST[si], k5 = 1-Math.pow(.02,dt);
  // 核糖体
  const rx = cX(st.r) + CW/2;
  ribo.position.x = GE.lerp(ribo.position.x, rx, k5*.9);
  small.position.y = GE.lerp(small.position.y, st.released ? -2.2 : -.75, k5*.5);
  large.position.y = GE.lerp(large.position.y, st.released ? 3.2 : 2.05, k5*.5);
  large.position.z = GE.lerp(large.position.z, st.released ? -3 : 0, k5*.5);
  [small,large].forEach(m=>{ m.material.uniforms.uOp.value = GE.lerp(m.material.uniforms.uOp.value, st.released ? .25 : (m===small?.84:.55), k5*.5); });
  ['E','P','A'].forEach(n=>{ sites[n].box.visible = sites[n].edge.visible = !st.released; sites[n].label.show = !st.released; });
  S.riboLabel.show = !st.released;
  // tRNA
  trnas.forEach((g,k)=>{
    const entered = k < st.entered, rel = k - st.r;
    let tgt, op;
    if(!entered){ tgt = new THREE.Vector3(cX(k)+5, 6, 3); op = 0; }
    else if(st.released || rel <= -2){ tgt = new THREE.Vector3(cX(k)-3, 6.5, -2); op = 0; }
    else { tgt = new THREE.Vector3(cX(k), 0, 0); op = rel===-1 ? .45 : 1; }
    g.position.lerp(tgt, k5*.75); g.userData.op = GE.lerp(g.userData.op, op, k5);
    g.visible = g.userData.op > .02; if(g.visible) fade(g, g.userData.op);
  });
  // 氨基酸
  const anchorOf = k => trnas[k].position.clone().add(new THREE.Vector3(0,3.2,0));
  aaMeshes.forEach((m,k)=>{
    let tgt, vis = true;
    if(st.released){ const n = st.len; tgt = new THREE.Vector3(ribo.position.x - .9 + (k-(n-1)/2)*.95, 4.4 + Math.sin(t*1.5+k)*.18, 2.2); }
    else if(k < st.len){ const q = st.len-1-k; const a = anchorOf(st.holder); tgt = a.add(new THREE.Vector3(-.5*q, .5*q + Math.sin(q*1.3)*.12, -.12*q)); }
    else if(k < st.entered){ tgt = anchorOf(k); }
    else { tgt = trnas[k].position.clone().add(new THREE.Vector3(0,3.2,0)); vis = false; }
    m.position.lerp(tgt, k5*.8); m.visible = vis || trnas[k].visible; if(!(k < st.entered) && !st.released) m.visible = trnas[k].visible && trnas[k].userData.op > .3;
    m.userData.lab.show = m.visible && !st.released && k >= st.len;
  });
  bonds.forEach((b,k)=>{ const on = k+1 < st.len; b.visible = on; if(on) orient(b, aaMeshes[k].position, aaMeshes[k+1].position); });
  // 当前密码子高亮
  S.camera.position.x = GE.lerp(S.camera.position.x, ribo.position.x*.8, .04);
  S.camera.position.y = 1.9; S.camera.position.z = 16; S.camera.lookAt(S.camera.position.x, 1.15, 0);
}

/* ---------- 选择卡 ---------- */
function rng(seed){ return ()=>{ seed = (seed*9301+49297)%233280; return seed/233280; }; }
function cardsFor(k){
  const c = C[k], r = rng(k*7+3);
  if(GE.CODE[c]==='Stop') return shuffle([
    {stop:true, ok:true, title:'无对应 tRNA', sub:'翻译终止，肽链释放'},
    {ac:'AUU', aa:'Leu', why:'终止密码子没有与之配对的 tRNA（一般不编码氨基酸）。'},
    {ac:'AUU', aaText:'终止氨基酸', why:'不存在“终止氨基酸”。终止密码子是翻译终止的信号。'}
  ], r);
  const ok = anti(c);
  const list = [{ac:ok, aa:GE.CODE[c], ok:true}];
  list.push({ac:c, aa: GE.CODE[anti(c)] ?? 'Stop', why:`反密码子应与密码子<b>互补</b>，不是相同。${c} 的反密码子是 ${ok}。`});
  if(ok.includes('U')) list.push({ac:ok.replace(/U/g,'T'), aa:GE.CODE[c], why:'tRNA 是 RNA，不含碱基 <b>T</b>！与 A 配对的应是 U。'});
  else { const rev = ok.split('').reverse().join(''); list.push(rev!==ok ? {ac:rev, aa:GE.CODE[anti(rev)], why:'反密码子方向读反了：反密码子 3\'→5\' 与密码子 5\'→3\' 对齐配对。'} : {ac:anti('GCU'), aa:'Ala', why:'该 tRNA 的反密码子与当前密码子不互补。'}); }
  let other; do { const keys = Object.keys(GE.CODE); other = keys[(r()*64)|0]; } while(GE.CODE[other]==='Stop' || GE.CODE[other]===GE.CODE[c]);
  list.push({ac:anti(other), aa:GE.CODE[other], why:`该 tRNA 的反密码子 ${anti(other)} 对应密码子 ${other}，与当前密码子 ${c} 不互补。`});
  return shuffle(list, r);
}
function shuffle(a, r){ for(let i=a.length-1;i>0;i--){ const j=(r()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

function ui(msg, cls){
  const st = ST[si];
  GE.$('#tl-stepn').textContent = si+1; GE.$('#tl-stept').textContent = '/ '+ST.length;
  const el = GE.$('#tl-status');
  el.innerHTML = `<div class="st-tag">STEP ${String(si+1).padStart(2,'0')} / ${ST.length}</div><div class="st-title">${st.t}</div><div class="st-body">${st.b}</div>` + (msg ? `<div class="st-body" style="margin-top:.6em;color:${cls==='err'?'#ff8fb6':'#7dffd9'}">${msg}</div>`:'') + (st.released ? `<div style="margin-top:.7em;display:flex;gap:8px"><button class="btn-neon" data-go="codon" style="font-size:.85em;padding:.5em 1.1em">查密码子表 →</button><button class="btn-ghost" data-go="dogma" style="font-size:.85em;padding:.5em 1.1em">中心法则</button></div>`:'');
  el.classList.remove('flash','err'); void el.offsetWidth; if(cls) el.classList.add(cls);
  // 当前密码子
  const ak = st.await;
  const codonEl = GE.$('#tl-codon');
  if(ak!==null){ codonEl.innerHTML = C[ak].split('').map(b=>`<span style="color:${GE.BASE_CSS[b]}">${b}</span>`).join(''); GE.$('#tl-codon-label').textContent = (ak===0?'位点1':'位点2')+' 密码子 5\'→3\''; }
  else { codonEl.textContent = st.released ? '终止' : '…'; GE.$('#tl-codon-label').textContent = st.released ? '翻译结束' : '核糖体工作中'; }
  // 卡片
  const box = GE.$('#tl-cards');
  if(ak===null){ box.innerHTML = `<div class="waiting">${st.released ? '✔ 一条多肽链已合成完毕' : '按 <kbd>→</kbd> / ⏭ 继续下一步'}</div>`; }
  else if(mode==='auto'){ box.innerHTML = `<div class="waiting">自动演示中 · 将为 ${C[ak]} 选择反密码子 ${GE.CODE[C[ak]]==='Stop'?'（无）':anti(C[ak])}</div>`; }
  else {
    box.innerHTML = '';
    cardsFor(ak).forEach(cd=>{
      const b = document.createElement('button'); b.className = 'trna-card' + (cd.stop?' stopcard':'');
      if(cd.stop) b.innerHTML = `<span class="aa">■ 终止</span><div class="ac" style="font-size:1em;margin-top:10px">${cd.title}</div><small>${cd.sub}</small>`;
      else b.innerHTML = `<span class="aa" style="background:${cd.aaText?'#555':GE.AA_COLOR[cd.aa]};${cd.aaText?'color:#fff':''}">${cd.aaText || GE.aaName(cd.aa)}</span><div class="ac"><small style="display:inline;font-size:.45em">3'</small>${cd.ac.split('').map(x=>`<span style="background:${GE.BASE_CSS[x]||'#999'}">${x}</span>`).join('')}<small style="display:inline;font-size:.45em">5'</small></div><small>反密码子</small>`;
      b.onclick = ()=> choose(cd, b);
      box.appendChild(b);
    });
  }
  // 肽链
  const pep = GE.$('#tl-pep'); let ph = '';
  for(let k=0;k<st.len;k++){ ph += (k?'<span class="bond"></span>':'') + `<span class="aa" style="background:${GE.AA_COLOR[AAS[k]]}">${GE.aaName(AAS[k])}</span>`; }
  pep.innerHTML = ph || '<span class="dim" style="font-size:.85em">（尚未开始）</span>';
  GE.$('#tl-mrna').innerHTML = C.map((c,k)=>`<span style="${ak===k?'color:#ffc857;text-decoration:underline':''}">${c}</span>`).join(' ');
  GE.$('#tl-play').textContent = playing ? '❚❚' : '▶';
}
function choose(cd, el){
  if(cd.ok){ GE.beep('ok'); el.classList.add('good'); setTimeout(()=> go(si+1, '✔ 配对正确！'), 280); }
  else { GE.beep('bad'); el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); ui('✘ ' + cd.why, 'err'); GE.toast(cd.why.replace(/<[^>]+>/g,''),'err'); }
}
function go(i, msg){ si = GE.clamp(i,0,ST.length-1); ui(msg, msg?'flash':''); if(ST[si].released) GE.toast('翻译完成：合成了一条含 5 个氨基酸的肽链','ok'); }

GE.register({
  id:'tl', title:'翻译工厂',
  init(){
    buildStates();
    GE.$$('#tl-mode button').forEach(b=> b.onclick = ()=>{ mode = b.dataset.mode; GE.$$('#tl-mode button').forEach(x=>x.classList.toggle('on',x===b)); if(mode==='auto' && !playing) this.toggle(); if(mode==='manual' && playing) this.toggle(); ui(); });
    GE.$('#tl-play').onclick = ()=> this.toggle();
    GE.$('#tl-next').onclick = ()=> this.next();
    GE.$('#tl-prev').onclick = ()=> this.prev();
    GE.$('#tl-reset').onclick = ()=> this.reset();
    const sp = GE.$('#tl-speed'); sp.oninput = ()=>{ speed = +sp.value; GE.$('#tl-speed-v').textContent = speed+'×'; };
    if(GE.has3D) build();
    go(0);
  },
  enter(){ S && S.resize(); },
  leave(){ if(playing) this.toggle(); },
  frame(dt,t){
    if(playing){ timer += dt*speed; if(timer>1.5){ timer=0; if(si<ST.length-1) go(si+1); else this.toggle(); } }
    if(!S) return; poses(t,dt); S.render(dt);
  },
  toggle(){ if(si>=ST.length-1 && !playing) go(0); playing=!playing; timer=1.2; ui(); },
  next(){ if(si<ST.length-1){ const a = ST[si].await; go(si+1, a!==null ? `演示：为 ${C[a]} 选择${GE.CODE[C[a]]==='Stop'?'“终止”':'反密码子 '+anti(C[a])+' 的 tRNA'}` : ''); return true; } return false; },
  prev(){ if(si>0){ go(si-1); return true; } return false; },
  reset(){ playing=false; go(0); }
});
})();
