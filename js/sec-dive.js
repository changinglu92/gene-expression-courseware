/* ============ 深入细胞：分层下潜 ============ */
(function(){
const GE = window.GE;
let S, layers=[], L=0, T0=-1e9, stars, warp=0, lastWheel=0, movers=[];
const N = GE.LAYERS.length;

function prepFade(g){ g.traverse(o=>{ if(o.material){ const ms = Array.isArray(o.material)?o.material:[o.material]; ms.forEach(m=>{ if(m.userData.base===undefined){ m.userData.base = m.isHolo ? m.uniforms.uOp.value : m.opacity; m.transparent = true; } }); } }); }
function setFade(g,a){ g.traverse(o=>{ if(o.material){ const ms = Array.isArray(o.material)?o.material:[o.material]; ms.forEach(m=>{ if(m.isHolo) m.uniforms.uOp.value = m.userData.base*a; else m.opacity = m.userData.base*a; }); } }); }

function buildCell(){
  const g = new THREE.Group();
  const mem = new THREE.Mesh(new THREE.SphereGeometry(4.2,64,48), GE.glassMat(0x22e6ff,.12)); g.add(mem);
  const memW = new THREE.Mesh(new THREE.SphereGeometry(4.22,28,20), new THREE.MeshBasicMaterial({color:0x22e6ff, wireframe:true, transparent:true, opacity:.035})); g.add(memW);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(1.5,48,32), GE.mat(0x7a5cff,{transparent:true, opacity:.85, emissiveIntensity:.6})); g.add(nuc);
  nuc.add(GE.glowSprite(0x9d7bff, 5.5, .5));
  // 内质网弧
  for(let i=0;i<5;i++){ const t = new THREE.Mesh(new THREE.TorusGeometry(1.95+i*.28,.05,8,80,Math.PI*1.1), GE.mat(0x22e6ff,{transparent:true,opacity:.5})); t.rotation.set(Math.random()*.6,Math.random()*.6, i*.9); g.add(t); }
  // 线粒体
  const mitos=[];
  for(let i=0;i<6;i++){ const m = new THREE.Mesh(new THREE.CapsuleGeometry(.22,.7,6,12), GE.mat(0xff9a5c,{emissiveIntensity:.45})); const a=i*1.05, r=3+Math.random()*.4; m.position.set(Math.cos(a)*r, (Math.random()-.5)*2.2, Math.sin(a)*r*.8); m.rotation.set(Math.random()*3,Math.random()*3,0); g.add(m); mitos.push(m); }
  // 核糖体点云
  const n=900, p=new Float32Array(n*3);
  for(let i=0;i<n;i++){ let v; do{ v=new THREE.Vector3((Math.random()-.5)*8,(Math.random()-.5)*8,(Math.random()-.5)*8); }while(v.length()>3.9 || v.length()<1.8); p.set([v.x,v.y,v.z],i*3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(p,3));
  const ribo = new THREE.Points(pg, new THREE.PointsMaterial({color:0x00ffc6, size:.07, map:GE.glowTex(), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending})); g.add(ribo);
  const ribAnchor = new THREE.Object3D(); ribAnchor.position.set(2.4,1.6,1.2); g.add(ribAnchor);
  g.userData.labels = [[mem,'细胞膜',new THREE.Vector3(-3.1,2.6,1.4)],[nuc,'细胞核 · 转录',new THREE.Vector3(0,1.9,0),'warm'],[mitos[0],'线粒体'],[ribAnchor,'核糖体 · 翻译','','warm']];
  g.userData.spin = .12;
  return g;
}
function buildNucleus(){
  const g = new THREE.Group();
  const env = new THREE.Mesh(new THREE.SphereGeometry(3.6,64,48), GE.glassMat(0x9d7bff,.16)); g.add(env);
  const pores = new THREE.Group(); g.add(pores);
  const pgeo = new THREE.TorusGeometry(.17,.05,8,20), pmat = GE.mat(0x22e6ff,{emissiveIntensity:1});
  const poreList=[];
  for(let i=0;i<70;i++){ const y = 1-2*(i+.5)/70, r=Math.sqrt(1-y*y), th=i*2.399963; const dir = new THREE.Vector3(Math.cos(th)*r, y, Math.sin(th)*r);
    const t = new THREE.Mesh(pgeo,pmat); t.position.copy(dir.clone().multiplyScalar(3.6)); t.lookAt(dir.clone().multiplyScalar(10)); pores.add(t); poreList.push(dir); }
  // 染色质（随机游走管）
  const cols=[0x22e6ff,0x3dffa8,0xffc94d,0xff5c7a,0x3db8ff,0xb98cff];
  for(let k=0;k<7;k++){ const pts=[]; let v=new THREE.Vector3((Math.random()-.5)*2,(Math.random()-.5)*2,(Math.random()-.5)*2);
    for(let i=0;i<40;i++){ v.add(new THREE.Vector3((Math.random()-.5)*.9,(Math.random()-.5)*.9,(Math.random()-.5)*.9)); if(v.length()>2.8) v.multiplyScalar(.8); pts.push(v.clone()); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),200,.045,6), GE.mat(cols[k%6],{transparent:true,opacity:.8,emissiveIntensity:.7}))); }
  const nl = new THREE.Mesh(new THREE.SphereGeometry(.8,32,24), GE.mat(0xff5c7a,{transparent:true,opacity:.7})); nl.position.set(.9,-.6,.6); g.add(nl);
  // mRNA 出核粒子
  const mr=[];
  for(let i=0;i<14;i++){ const s = GE.glowSprite(0xb98cff,.45,.95); s.userData={dir:poreList[(i*5)%70], t:Math.random()}; g.add(s); mr.push(s); }
  movers.push(dt=> mr.forEach(s=>{ s.userData.t += dt*.18; if(s.userData.t>1) s.userData.t=0; s.position.copy(s.userData.dir).multiplyScalar(1.5+s.userData.t*3.4); }));
  g.userData.labels = [[env,'核膜',new THREE.Vector3(-2.6,2.4,1.2)],[pores.children[12],'核孔'],[nl,'核仁'],[mr[0],'mRNA → 经核孔出核','warm']];
  g.userData.spin = .1;
  return g;
}
function buildChromosome(){
  const g = new THREE.Group();
  const mat = GE.mat(0x3db8ff,{emissiveIntensity:.55, roughness:.6});
  const mat2 = GE.mat(0x22e6ff,{emissiveIntensity:.55, roughness:.6});
  const geo = new THREE.CapsuleGeometry(.48,2.4,10,24);
  const arms=[];
  [[-.42,.95,.32],[.42,.95,-.32],[-.42,-.95,-.32],[.42,-.95,.32]].forEach(([x,y,r],i)=>{ const m = new THREE.Mesh(geo, i%2?mat2:mat); m.position.set(x*1.1,y*1.25,0); m.rotation.z = r*(x<0?1:1); g.add(m); arms.push(m);
    // 环纹
    for(let k=0;k<9;k++){ const ring = new THREE.Mesh(new THREE.TorusGeometry(.5,.025,6,30), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.25})); ring.rotation.x=Math.PI/2; ring.position.y=-1.2+k*.3; m.add(ring); } });
  const cen = new THREE.Mesh(new THREE.SphereGeometry(.38,24,16), GE.mat(0xffc857,{emissiveIntensity:.9})); g.add(cen); cen.add(GE.glowSprite(0xffc857,2,.6));
  // 从臂端伸出的 DNA
  const h = GE.buildHelix({n:28, rise:.22, radius:.32, bead:.07, rod:.03, tube:.03});
  h.position.set(2.6,2.4,0); h.rotation.z = -1.1; g.add(h);
  g.userData.labels = [[cen,'着丝粒',new THREE.Vector3(0,-.5,0)],[arms[0],'染色单体',new THREE.Vector3(0,1.4,0)],[h,'DNA 双螺旋',new THREE.Vector3(0,2.4,0),'warm'],[arms[3],'DNA + 蛋白质',new THREE.Vector3(0,-1.6,0)]];
  g.userData.spin = .25;
  return g;
}
function buildGene(){
  const outer = new THREE.Group(), g = new THREE.Group(); g.scale.setScalar(.62); g.position.x = -1.5; outer.add(g);
  const h = GE.buildHelix({n:64, rise:.3, radius:.75, bead:.11, rod:.045, tube:.04});
  h.rotation.z = Math.PI/2; g.add(h);
  // 高亮基因区
  const box = (x0,x1,c,op) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,x1-x0,40,1,true), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:op, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending})); m.rotation.z=Math.PI/2; m.position.x=(x0+x1)/2; g.add(m);
    const e1 = new THREE.Mesh(new THREE.TorusGeometry(1.15,.025,8,60), new THREE.MeshBasicMaterial({color:c})); e1.rotation.y=Math.PI/2; e1.position.x=x0; g.add(e1); const e2=e1.clone(); e2.position.x=x1; g.add(e2); return m; };
  const gA = box(-3.2,2.4,0xffc857,.16), gB = box(4.6,8.6,0x22e6ff,.1);
  const nonA = new THREE.Object3D(); nonA.position.set(3.5,-1.1,0); g.add(nonA);
  outer.userData.labels = [[gA,'基因 A（有遗传效应的DNA片段）',new THREE.Vector3(1.9,0,0),'warm'],[gB,'基因 B',new THREE.Vector3(1.8,0,0)],[nonA,'基因间区','small']];
  outer.userData.spin = 0; outer.userData.sway = true;
  return outer;
}
function buildBP(){
  const g = new THREE.Group();
  const pairs = ['A','G','C','T','G','A'];
  const sugarG = new THREE.CylinderGeometry(.28,.28,.14,5), phosG = new THREE.SphereGeometry(.2,20,14);
  const sugarM = GE.mat(0x22e6ff,{emissiveIntensity:.4}), phosM = GE.mat(0xffc857,{emissiveIntensity:.5});
  const lab=[]; const W=2.6, step=1.05;
  pairs.forEach((b,i)=>{
    const y = (i-(pairs.length-1)/2)*step, tw = i*.28;
    const row = new THREE.Group(); row.position.y = y; row.rotation.y = i*.12; g.add(row);
    const c = GE.compDNA[b];
    [[-W,b],[W,c]].forEach(([x,bb],side)=>{
      const s = new THREE.Mesh(sugarG,sugarM); s.position.x = x; s.rotation.x=Math.PI/2; row.add(s);
      const p = new THREE.Mesh(phosG,phosM); p.position.set(x*1.12, step/2, 0); row.add(p);
      const rod = new THREE.Mesh(new THREE.BoxGeometry(W-.55,.34,.22), GE.mat(GE.BASE_COLOR[bb],{emissiveIntensity:.55}));
      rod.position.x = x/2 + (x<0?.05:-.05) + (x<0? .14:-.14); row.add(rod);
      const t = GE.textSprite(bb,{fs:80,h:.4,color:'#001018'}); t.position.set(x*.5,0,.32); row.add(t);
      if(i===1 && side===0) lab.push([s,'脱氧核糖']); if(i===1 && side===0) lab.push([p,'磷酸']);
    });
    const hb = (b==='G'||b==='C') ? 3 : 2;
    for(let k=0;k<hb;k++){ const d = new THREE.Mesh(new THREE.SphereGeometry(.045,8,6), new THREE.MeshBasicMaterial({color:0xffffff})); d.position.set(0,(k-(hb-1)/2)*.11,.13); row.add(d); }
    if(i===2) lab.push([row,'氢键 ×3（G≡C）','warm']);
    if(i===0) lab.push([row,'氢键 ×2（A=T）','warm']);
  });
  const t5 = new THREE.Object3D(); t5.position.set(-W,  3.6,0); g.add(t5);
  const t3 = new THREE.Object3D(); t3.position.set(-W, -3.4,0); g.add(t3);
  const u5 = new THREE.Object3D(); u5.position.set( W, -3.4,0); g.add(u5);
  const u3 = new THREE.Object3D(); u3.position.set( W,  3.6,0); g.add(u3);
  g.userData.labels = lab.concat([[t5,"5'"],[t3,"3'"],[u5,"5'"],[u3,"3'"]]);
  g.scale.setScalar(.85);
  const outer = new THREE.Group(); outer.add(g); outer.userData = g.userData; g.userData = {}; outer.userData.spin = 0; outer.userData.sway = true;
  return outer;
}

function setLayer(i, quiet){
  i = GE.clamp(i,0,N-1); if(i===L && !quiet && layers.length) return;
  const dir = i > L ? 1 : -1; L = i; warp = 1.6*dir;
  T0 = performance.now(); layers.forEach(g=>{ g.userData.fs = g.userData.s; g.userData.fa = g.userData.a; });
  const d = GE.LAYERS[L];
  GE.$('#dive-num').textContent = String(L+1).padStart(2,'0');
  GE.$('#dive-tag').textContent = `第 ${L+1} 层 · ${d.tag}`;
  GE.$('#dive-title').textContent = d.name;
  GE.$('#dive-subtitle').textContent = d.sub;
  GE.$('#dive-scale').textContent = d.scale;
  GE.$$('#dive-timeline li').forEach((li,k)=>{ li.classList.toggle('on',k===L); li.classList.toggle('passed',k<L); });
  GE.$$('#dive-dots i').forEach((e,k)=> e.classList.toggle('on',k===L));
  const card = GE.$('#dive-card'); card.classList.add('swap');
  setTimeout(()=>{ GE.$('#dive-card-body').innerHTML = d.body + `<div class="facts">${d.facts.map(f=>`<span>${f}</span>`).join('')}</div>`; GE.$('#dive-q').innerHTML = d.q; GE.$('#dive-q').classList.remove('revealed'); card.classList.remove('swap'); }, quiet?0:250);
  if(S){ S.ctl.rx = 0; }
}

GE.register({
  id:'dive', title:'深入细胞',
  init(){
    const tl = GE.$('#dive-timeline'), dots = GE.$('#dive-dots');
    GE.LAYERS.forEach((d,k)=>{ const li = document.createElement('li'); li.innerHTML = `<span>${String(k+1).padStart(2,'0')}</span>${d.name}`; li.onclick=()=>setLayer(k); tl.appendChild(li);
      const dt = document.createElement('i'); dt.onclick=()=>setLayer(k); dots.appendChild(dt); });
    GE.$('#dive-up').onclick = ()=> setLayer(L-1); GE.$('#dive-down').onclick = ()=> setLayer(L+1);
    GE.$('#sec-dive').addEventListener('wheel', e=>{ if(e.target.closest('.dive-card')) return; const now=performance.now(); if(now-lastWheel<750 || Math.abs(e.deltaY)<8) return; lastWheel=now; setLayer(L + (e.deltaY>0?1:-1)); }, {passive:true});
    if(GE.has3D){
      S = GE.make3D(GE.$('#dive-3d'), {dist:12, fog:.025, limitX:.7});
      stars = GE.starfield(1400, 60); S.scene.add(stars);
      [buildCell(), buildNucleus(), buildChromosome(), buildGene(), buildBP()].forEach((g,k)=>{
        prepFade(g); g.userData.s = k===0?1:.05; g.userData.a = k===0?1:0; g.scale.setScalar(g.userData.s); S.pivot.add(g); layers.push(g);
        g.userData.L = (g.userData.labels||[]).map(([o,txt,off,cls])=> S.addLabel(o, txt, (typeof off==='string' ? off : cls)||'', off instanceof THREE.Vector3 ? off : undefined));
      });
      S.pivot.position.x = .6;
    }
    setLayer(0, true);
  },
  enter(){ S && S.resize(); },
  frame(dt,t){
    if(!S) return;
    layers.forEach((g,k)=>{
      const d = k-L, ts = d<0 ? 7 : d>0 ? .05 : 1, ta = d===0 ? 1 : 0;
      const p = GE.clamp((performance.now()-T0)/1300, 0, 1), e = GE.ease(p);
      const fs = g.userData.fs ?? g.userData.s, fa = g.userData.fa ?? g.userData.a;
      g.userData.s = fs * Math.pow(ts/fs, e);
      g.userData.a = ta >= fa ? fa + (ta-fa)*GE.clamp((p-.25)/.75,0,1) : fa * Math.pow(1-p, 2);
      g.scale.setScalar(g.userData.s); g.visible = g.userData.a > .01; if(g.visible) setFade(g, g.userData.a);
      g.rotation.y += dt*(g.userData.spin||0);
      if(g.userData.sway) g.rotation.y = Math.sin(t*.4)*.4;
      g.userData.L.forEach(l=>{ l.show = d===0 && g.userData.a>.75; });
    });
    movers.forEach(m=>m(dt));
    warp = (warp>0?1:-1) * 1.6 * Math.max(0, 1-(performance.now()-T0)/1300);
    stars.scale.setScalar(1 + Math.abs(warp)*.25); stars.rotation.z += dt*(.02 + warp*.3);
    S.camera.position.z = 12 - warp*1.2;
    S.render(dt);
  },
  next(){ if(L<N-1){ setLayer(L+1); return true; } return false; },
  prev(){ if(L>0){ setLayer(L-1); return true; } return false; },
  reset(){ setLayer(0); },
  onKey(e){ if(e.key==='ArrowDown'){ setLayer(L+1); return true; } if(e.key==='ArrowUp'){ setLayer(L-1); return true; } }
});
})();
