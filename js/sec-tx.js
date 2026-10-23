/* ============ 转录实验室 ============ */
(function(){
const GE = window.GE, D = GE.DEMO;
const N = D.template.length, F = 6, M = N + 2*F, DX = .56, TW = Math.PI*2/10.5, R = .85;
const FLANK_L = 'GCTAGC', FLANK_R = 'CGATCG';               // 侧翼（编码链）
const coding = FLANK_L + D.coding + FLANK_R;
const template = coding.split('').map(b=>GE.compDNA[b]).join('');
let S, s = 0, pAnim = 0, close = 0, playing = false, timer = 0, speed = 1, mode = 'manual';
let cB=[], tB=[], cR=[], tR=[], cL=[], tL=[], rB=[], rR=[], rL=[], pol, polGlow, target, freeNts=[];
const xAt = j => (j-(M-1)/2)*DX;
const sm = x => { x = GE.clamp(x,0,1); return x*x*(3-2*x); };
const up = new THREE.Vector3(0,1,0), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function orient(m, a, b){ tmp.copy(b).sub(a); const len = tmp.length()||1e-4; m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(1,len,1); m.quaternion.setFromUnitVectors(up, tmp.divideScalar(len)); }

function build(){
  S = GE.make3D(GE.$('#tx-3d'), {dist:13, fog:.02, limitX:.5, springBack:true});
  S.scene.add(GE.starfield(900,60));
  S.pivot.position.y = 1.0;
  const bead = new THREE.SphereGeometry(.13,16,12), rod = new THREE.CylinderGeometry(.075,.075,1,10), link = new THREE.CylinderGeometry(.04,.04,1,6);
  const mC = GE.mat(0x5a6b85,{emissiveIntensity:.3}), mT = GE.mat(0x3fa9ff,{emissiveIntensity:.6}), mR = GE.mat(0xb98cff,{emissiveIntensity:.8});
  const mLC = new THREE.MeshBasicMaterial({color:0x5a6b85}), mLT = new THREE.MeshBasicMaterial({color:0x3fa9ff}), mLR = new THREE.MeshBasicMaterial({color:0xb98cff});
  for(let j=0;j<M;j++){
    const gene = j>=F && j<F+N;
    const a = new THREE.Mesh(bead,mC), b = new THREE.Mesh(bead,mT);
    S.pivot.add(a,b); cB.push(a); tB.push(b);
    const ra = new THREE.Mesh(rod, GE.mat(GE.BASE_COLOR[coding[j]],{emissiveIntensity: gene?.55:.2, transparent:true, opacity: gene?1:.5}));
    const rb = new THREE.Mesh(rod, GE.mat(GE.BASE_COLOR[template[j]],{emissiveIntensity: gene?.65:.2, transparent:true, opacity: gene?1:.5}));
    S.pivot.add(ra,rb); cR.push(ra); tR.push(rb);
    if(j<M-1){ const la = new THREE.Mesh(link,mLC), lb = new THREE.Mesh(link,mLT); S.pivot.add(la,lb); cL.push(la); tL.push(lb); }
  }
  for(let k=0;k<N;k++){
    const b = new THREE.Mesh(bead,mR); b.visible=false; S.pivot.add(b); rB.push(b);
    const r = new THREE.Mesh(rod, GE.mat(GE.BASE_COLOR[D.mrna[k]],{emissiveIntensity:.8})); r.visible=false; S.pivot.add(r); rR.push(r);
    b.userData.spawned=false;
    if(k<N-1){ const l = new THREE.Mesh(link,mLR); l.visible=false; S.pivot.add(l); rL.push(l); }
  }
  // RNA聚合酶
  pol = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1,48,32), GE.glassMat(0x00ffc6,.16)); shell.scale.set(3.1,2.2,2.0); pol.add(shell);
  const wire = new THREE.Mesh(new THREE.SphereGeometry(1.01,24,16), new THREE.MeshBasicMaterial({color:0x00ffc6, wireframe:true, transparent:true, opacity:.12})); wire.scale.copy(shell.scale); pol.add(wire);
  polGlow = GE.glowSprite(0x00ffc6, 6, .25); pol.add(polGlow);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.22,.5,16), GE.mat(0x00ffc6,{emissiveIntensity:1})); arrow.rotation.z = -Math.PI/2; arrow.position.set(3.4,-1.9,0); pol.add(arrow);
  S.pivot.add(pol); pol.userData.shell = shell;
  target = GE.glowSprite(0xffc857, 1.1, 1); S.pivot.add(target);
  // 游离核糖核苷酸
  const ico = new THREE.IcosahedronGeometry(.11,0);
  for(let i=0;i<46;i++){ const b='AUGC'[i%4]; const m = new THREE.Mesh(ico, GE.mat(GE.BASE_COLOR[b],{emissiveIntensity:.9})); m.userData={p:new THREE.Vector3((Math.random()-.5)*20,(Math.random()-.5)*8,(Math.random()-.5)*6), v:new THREE.Vector3((Math.random()-.5)*.4,(Math.random()-.5)*.4,(Math.random()-.5)*.4)}; S.pivot.add(m); freeNts.push(m); }
  // 标签
  S.addLabel(cB[0],"5'",'small',new THREE.Vector3(-.4,0,0)); S.addLabel(cB[M-1],"3'",'small',new THREE.Vector3(.4,0,0));
  S.addLabel(tB[0],"3'",'small',new THREE.Vector3(-.4,0,0)); S.addLabel(tB[M-1],"5'",'small',new THREE.Vector3(.4,0,0));
  S.addLabel(cB[2],'非模板链（编码链）','small',new THREE.Vector3(0,.55,0));
  S.addLabel(tB[2],'模板链','small',new THREE.Vector3(0,-.55,0));
  S.addLabel(pol,'RNA聚合酶','warm',new THREE.Vector3(0,2.5,0));
  S.addLabel(pol,'移动方向 →','small',new THREE.Vector3(2.6,-2.45,0));
  S.rna5 = S.addLabel(rB[0],"mRNA 5'",'small',new THREE.Vector3(-.2,.45,0));
}

function poses(t){
  for(let j=0;j<M;j++){
    const i = j-F, x = xAt(j), a = j*TW;
    let o = sm((i-(pAnim-7.5))/1.6) * sm(((pAnim+1.6)-i)/1.6); o *= (1-close);
    const hc = tmp.set(x, R*Math.cos(a), R*Math.sin(a)), ht = new THREE.Vector3(x, -R*Math.cos(a), -R*Math.sin(a));
    const oc = new THREE.Vector3(x, 1.6, -.4), ot = new THREE.Vector3(x, -1.15, 0);
    const pc = hc.clone().lerp(oc,o), pt = ht.lerp(ot,o);
    cB[j].position.copy(pc); tB[j].position.copy(pt);
    const mid = pc.clone().lerp(pt,.5);
    const ec = mid.clone().lerp(pc.clone().add(new THREE.Vector3(0,-.42,0)), o);
    const et = mid.clone().lerp(pt.clone().add(new THREE.Vector3(0,.4,0)), o);
    orient(cR[j], pc, ec.lerp(pc,.04)); orient(tR[j], pt, et.lerp(pt,.04));
  }
  for(let j=0;j<M-1;j++){ orient(cL[j], cB[j].position, cB[j+1].position); orient(tL[j], tB[j].position, tB[j+1].position); }
  const count = Math.min(s,N), released = s>N;
  for(let k=0;k<N;k++){
    const b = rB[k], r = rR[k];
    const vis = k < count; b.visible = r.visible = vis;
    if(!vis){ b.userData.spawned=false; continue; }
    let tgt;
    if(released){ tgt = new THREE.Vector3((k-N/2)*.48, 3.2+Math.sin(k*.55+t*1.2)*.25, .6+Math.cos(k*.4+t)*.2); }
    else {
      const behind = pAnim-1-k;
      if(behind<=6.2){ tgt = new THREE.Vector3(xAt(k+F), -.12, 0); }
      else { const u = behind-6.2; tgt = new THREE.Vector3(xAt(pAnim-7.2+F) - u*.36 - u*u*.012, -.12 + u*.34 - u*u*.006, .18*u + Math.sin(u*.9+t)*.08); }
    }
    if(!b.userData.spawned){ b.position.set(tgt.x+.6, tgt.y+2.6, tgt.z+2); b.userData.spawned = true; }
    b.position.lerp(tgt, .14);
    const rodEnd = released ? b.position.clone().add(new THREE.Vector3(0,-.42,0)) : (pAnim-1-k<=6.2 ? b.position.clone().add(new THREE.Vector3(0,-.48,0)) : b.position.clone().add(new THREE.Vector3(.15,-.38,.1)));
    orient(r, b.position, rodEnd);
  }
  for(let k=0;k<N-1;k++){ const l = rL[k]; l.visible = k+1 < count; if(l.visible) orient(l, rB[k].position, rB[k+1].position); }
  S.rna5.show = count>0;
  // 聚合酶
  const px = released ? xAt(F+N)+9 : xAt(F + pAnim - 2.8);
  pol.position.x = GE.lerp(pol.position.x, px, released ? .03 : .2); pol.position.y = .05;
  pol.userData.shell.material.uniforms.uOp.value = .6 + Math.sin(t*3)*.12;
  pol.visible = pol.position.x < xAt(M)+6;
  target.visible = s<N && mode==='manual';
  if(target.visible){ target.position.copy(tB[F+s].position).add(new THREE.Vector3(0,.55,0)); target.material.opacity = .6+Math.sin(t*6)*.4; }
  freeNts.forEach(m=>{ const u=m.userData; u.p.addScaledVector(u.v,.016); ['x','y','z'].forEach((ax,i)=>{ const lim=[10,4,3][i]; if(Math.abs(u.p[ax])>lim) u.v[ax]*=-1; }); m.position.copy(u.p); m.rotation.x+=.02; m.rotation.y+=.015; });
}

/* ---------- UI ---------- */
const STEPS = {
  1:['第1步 · 解旋','RNA聚合酶与DNA结合，DNA双链解开，双链的碱基得以暴露。'],
  2:['第2步 · 配对','游离的核糖核苷酸与模板链碱基碰撞；遵循 <b>A–U、T–A、G–C、C–G</b> 互补时，以<b>氢键</b>结合。注意：RNA 中是 <b>U</b>，没有 T。'],
  3:['第3步 · 连接','在RNA聚合酶的作用下，新结合的核糖核苷酸连接到正在合成的mRNA分子上，mRNA沿 <b>5\'→3\'</b> 方向延伸。'],
  4:['第4步 · 释放','合成的mRNA从DNA链上释放，而后DNA双链恢复成双螺旋结构。mRNA 将通过<b>核孔</b>进入细胞质。']
};
function status(extra, cls){
  const el = GE.$('#tx-status'); let st;
  if(s===0) st=STEPS[1]; else if(s<N) st=STEPS[3]; else st=STEPS[4];
  let html = `<div class="st-tag">STEP ${String(Math.min(s,N)).padStart(2,'0')} / ${N} · ${s>N?'RELEASED':s===N?'COMPLETE':'ELONGATION'}</div><div class="st-title">${st[0]}</div><div class="st-body">${st[1]}</div>`;
  if(s<N) html += `<div class="st-body" style="margin-top:.5em">${STEPS[2][1]}</div>`;
  if(s===N) html = `<div class="st-tag">STEP ${N} / ${N} · COMPLETE</div><div class="st-title">mRNA 合成完毕</div><div class="st-body">RNA聚合酶到达基因末端，共连接了 <b>${N}</b> 个核糖核苷酸。按“下一步”释放 mRNA。</div>`;
  if(s>N) html += `<div style="margin-top:.7em"><button class="btn-neon" data-go="tl" style="font-size:.85em;padding:.5em 1.2em">送往翻译工厂 →</button></div>`;
  if(extra) html += `<div class="st-body" style="margin-top:.6em;color:${cls==='err'?'#ff8fb6':'#7dffd9'}">${extra}</div>`;
  el.innerHTML = html;
  el.classList.remove('flash','err'); void el.offsetWidth; if(cls) el.classList.add(cls);
}
function ui(){
  GE.$('#tx-count').textContent = Math.min(s,N);
  const cur = s<N ? D.template[s] : '—';
  const tg = GE.$('#tx-target'); tg.textContent = cur; tg.style.color = s<N ? GE.BASE_CSS[cur] : '';
  const slot = GE.$('#tx-slot');
  if(slot){ slot.classList.toggle('wait', s<N && mode==='manual' && !playing); if(s>=N) slot.innerHTML = '<span>完成</span>'; else if(mode==='auto') slot.innerHTML = '<span>自动中</span>'; else slot.innerHTML = '<span>拖到这里<br>或点击碱基</span>'; }
  let h = `<span class="end">5'</span>`;
  for(let k=0;k<N;k++){ const gap = k%3===2 ? ' gap' : ''; h += k < s ? `<span class="nt${gap}" style="background:${GE.BASE_CSS[D.mrna[k]]}">${D.mrna[k]}</span>` : `<span class="ph${gap}" style="${gap?'margin-right:6px':''}"></span>`; }
  GE.$('#tx-mrna').innerHTML = h + `<span class="end">3'</span>`;
  GE.$('#tx-coding').textContent = D.coding.replace(/(...)/g,'$1 ');
  GE.$$('#tx-pool .nt-chip').forEach(c=> c.classList.toggle('disabled', s>=N || mode==='auto'));
  GE.$('#tx-play').textContent = playing ? '❚❚' : '▶';
}
function setS(v, msg, cls){ s = GE.clamp(v,0,N+1); if(s>N) close = 0; ui(); status(msg, cls); }
function attempt(b, chip){
  if(s>=N || mode==='auto') return;
  const tb = D.template[s], ok = GE.txPair[tb];
  if(b===ok){
    GE.beep('ok'); chip && flashChip(chip,'good');
    const slot = GE.$('#tx-slot'); if(slot){ slot.classList.add('hot'); setTimeout(()=>slot.classList.remove('hot'),420); }
    setS(s+1, `✔ 配对成功：模板链 <b>${tb}</b>（${GE.BASE_NAME[tb]}）— <b>${b}</b>（${GE.BASE_NAME[b]}核糖核苷酸）`, 'flash');
    if(s===N) GE.toast('转录完成！按“下一步”释放 mRNA，送往翻译工厂','ok');
  } else {
    GE.beep('bad'); chip && flashChip(chip,'bad');
    let m;
    if(b==='T') m = `✘ RNA 中没有 <b>T（胸腺嘧啶）</b>！转录原料是核糖核苷酸，模板链 ${tb} 应与 <b>${ok}</b> 配对。`;
    else if(b===tb) m = `✘ 相同碱基不能配对。碱基互补配对：模板 ${tb} → <b>${ok}</b>。`;
    else m = `✘ 配对错误：模板链是 <b>${tb}</b>（${GE.BASE_NAME[tb]}），应对 <b>${ok}</b>。口诀：A–U、T–A、G–C、C–G。`;
    status(m,'err'); GE.toast(m.replace(/<[^>]+>/g,''),'err');
  }
}
function flashChip(c,k){ c.classList.remove('good','bad'); void c.offsetWidth; c.classList.add(k); setTimeout(()=>c.classList.remove(k), k==='good'?750:650); }
function setupPool(){
  const pool = GE.$('#tx-pool');
  ['A','U','G','C','T'].forEach(b=>{
    const c = document.createElement('div'); c.className = 'nt-chip'; c.dataset.b = b;
    c.innerHTML = `<b style="color:${GE.BASE_CSS[b]}">${b}</b><small>${GE.BASE_NAME[b]}</small>`;
    c.style.borderColor = GE.BASE_CSS[b]+'66';
    pool.appendChild(c);
    c.addEventListener('pointerdown', e=>{
      if(c.classList.contains('disabled')) return;
      e.preventDefault();
      const sx=e.clientX, sy=e.clientY; let ghost=null;
      const slot = GE.$('#tx-slot'), canvas = GE.$('#tx-3d');
      const mv = ev=>{
        if(!ghost && Math.hypot(ev.clientX-sx, ev.clientY-sy) > 6){ ghost = c.cloneNode(true); ghost.classList.add('dragging'); document.body.appendChild(ghost); }
        if(ghost){ ghost.style.left = (ev.clientX-38)+'px'; ghost.style.top = (ev.clientY-38)+'px'; const r = slot.getBoundingClientRect(); slot.classList.toggle('hot', ev.clientX>r.left-20 && ev.clientX<r.right+20 && ev.clientY>r.top-20 && ev.clientY<r.bottom+20); }
      };
      const upH = ev=>{
        removeEventListener('pointermove',mv); removeEventListener('pointerup',upH);
        if(!ghost){ attempt(b,c); return; }
        ghost.remove(); const r = slot.getBoundingClientRect(); const hot = slot.classList.contains('hot'); slot.classList.remove('hot');
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        if(hot || (el && (el.closest('#tx-3d') || el.tagName==='CANVAS' && canvas.contains(el)))) attempt(b,c);
      };
      addEventListener('pointermove',mv); addEventListener('pointerup',upH);
    });
  });
}

GE.register({
  id:'tx', title:'转录实验室',
  init(){
    setupPool();
    GE.$$('#tx-mode button').forEach(b=> b.onclick = ()=>{ mode = b.dataset.mode; GE.$$('#tx-mode button').forEach(x=>x.classList.toggle('on',x===b)); if(mode==='auto' && !playing) this.toggle(); if(mode==='manual' && playing) this.toggle(); ui(); });
    GE.$('#tx-play').onclick = ()=> this.toggle();
    GE.$('#tx-next').onclick = ()=> this.next();
    GE.$('#tx-prev').onclick = ()=> this.prev();
    GE.$('#tx-reset').onclick = ()=> this.reset();
    const sp = GE.$('#tx-speed'); sp.oninput = ()=>{ speed = +sp.value; GE.$('#tx-speed-v').textContent = speed+'×'; };
    if(GE.has3D) build();
    setS(0);
  },
  enter(){ S && S.resize(); },
  leave(){ if(playing) this.toggle(); },
  frame(dt,t){
    if(playing){ timer += dt*speed; if(timer > .9){ timer = 0; if(s<=N){ setS(s+1, s<N ? `模板 ${D.template[s]} → ${D.mrna[s]}` : ''); } else this.toggle(); } }
    if(!S) return;
    const goal = Math.min(s,N);
    pAnim = GE.lerp(pAnim, goal, 1-Math.pow(.004,dt));
    close = GE.lerp(close, s>N ? 1 : 0, 1-Math.pow(.2,dt));
    poses(t);
    S.camera.position.x = GE.lerp(S.camera.position.x, s>N ? 0 : xAt(F+pAnim)*.55, .04);
    S.camera.position.y = 1.6; S.camera.position.z = 14; S.camera.lookAt(S.camera.position.x*.9, -.2, 0);
    S.render(dt);
  },
  toggle(){ if(s>N && !playing) setS(0); playing = !playing; timer = .8; ui(); },
  next(){ if(s<=N){ setS(s+1, s<N ? `演示：模板 ${D.template[s]} → ${D.mrna[s]}` : ''); return true; } return false; },
  prev(){ if(s>0){ setS(s-1); return true; } return false; },
  reset(){ playing=false; rB.forEach(b=>b.userData.spawned=false); setS(0); }
});
})();
