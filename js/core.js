/* ============ 核心：路由 / 3D工具 / 教师控制 ============ */
(function(){
const GE = window.GE;
GE.has3D = typeof THREE !== 'undefined';
GE.sections = [];
GE.cur = null;
GE.register = s => GE.sections.push(s);
GE.$ = (s, r=document) => r.querySelector(s);
GE.$$ = (s, r=document) => Array.from(r.querySelectorAll(s));
GE.lerp = (a,b,t) => a+(b-a)*t;
GE.clamp = (v,a,b) => Math.max(a,Math.min(b,v));
GE.ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;

/* ---------- toast ---------- */
let toastT;
GE.toast = (msg, type='') => {
  const el = GE.$('#toast'); el.innerHTML = msg; el.className = 'show ' + type;
  clearTimeout(toastT); toastT = setTimeout(()=> el.className = type, 2600);
};

/* ---------- WebAudio 小音效（无外部文件） ---------- */
let actx;
GE.beep = (type='ok') => {
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    const now = actx.currentTime;
    const f = {ok:[660,990], bad:[220,140], tick:[880,880], win:[523,1046]}[type] || [600,600];
    o.type = type==='bad' ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(f[0], now); o.frequency.exponentialRampToValueAtTime(f[1], now+.15);
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.08, now+.02); g.gain.exponentialRampToValueAtTime(.0001, now+.25);
    o.connect(g).connect(actx.destination); o.start(now); o.stop(now+.3);
  }catch(e){}
};

/* ---------- 3D 场景工厂 ---------- */
let _glowTex;
GE.glowTex = () => {
  if(_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.25,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0,0,128,128);
  _glowTex = new THREE.CanvasTexture(c); return _glowTex;
};
GE.glowSprite = (color, size=1, opacity=.8) => {
  const m = new THREE.SpriteMaterial({map:GE.glowTex(), color, transparent:true, opacity, depthWrite:false, blending:THREE.AdditiveBlending});
  const s = new THREE.Sprite(m); s.scale.set(size,size,size); return s;
};
GE.mat = (color, o={}) => new THREE.MeshStandardMaterial(Object.assign({color, roughness:.35, metalness:.15, emissive:color, emissiveIntensity:.35}, o));
GE.glassMat = (color, opacity=.18) => {
  /* 全息菲涅尔材质：边缘发光、中心通透，不遮挡内部结构 */
  const m = new THREE.ShaderMaterial({
    uniforms:{ uColor:{value:new THREE.Color(color)}, uOp:{value:Math.min(1, opacity*4.2)} },
    vertexShader:'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader:'uniform vec3 uColor; uniform float uOp; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0-abs(dot(normalize(vN),normalize(vV))); float a = pow(f,2.2)*0.9 + 0.05; gl_FragColor = vec4(uColor*(0.6+f*0.8), a*uOp); }',
    transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending });
  m.isHolo = true; return m;
};

GE.starfield = (n=1200, r=60) => {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n*3), col = new Float32Array(n*3);
  const c1 = new THREE.Color(0x22e6ff), c2 = new THREE.Color(0xb98cff), c3 = new THREE.Color(0xffffff);
  for(let i=0;i<n;i++){
    const u=Math.random(), v=Math.random(), th=2*Math.PI*u, ph=Math.acos(2*v-1), rr=r*(.35+Math.random()*.65);
    p[i*3]=rr*Math.sin(ph)*Math.cos(th); p[i*3+1]=rr*Math.sin(ph)*Math.sin(th); p[i*3+2]=rr*Math.cos(ph);
    const c = [c1,c2,c3][i%3]; col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  g.setAttribute('position', new THREE.BufferAttribute(p,3)); g.setAttribute('color', new THREE.BufferAttribute(col,3));
  return new THREE.Points(g, new THREE.PointsMaterial({size:.12, map:GE.glowTex(), vertexColors:true, transparent:true, opacity:.85, depthWrite:false, blending:THREE.AdditiveBlending}));
};

GE.make3D = (host, opt={}) => {
  const W = () => host.clientWidth || window.innerWidth, H = () => host.clientHeight || window.innerHeight;
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.setSize(W(), H());
  renderer.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  if(opt.fog) scene.fog = new THREE.FogExp2(0x02050b, opt.fog);
  const camera = new THREE.PerspectiveCamera(opt.fov||45, W()/H(), .05, 500);
  camera.position.set(0,0,opt.dist||12);
  scene.add(new THREE.AmbientLight(0x6688aa, .65));
  const d1 = new THREE.DirectionalLight(0xffffff, .9); d1.position.set(5,8,10); scene.add(d1);
  const p1 = new THREE.PointLight(0x22e6ff, 1.2, 60); p1.position.set(-8,4,6); scene.add(p1);
  const p2 = new THREE.PointLight(0xb98cff, .9, 60); p2.position.set(8,-4,6); scene.add(p2);
  const pivot = new THREE.Group(); scene.add(pivot);

  /* 拖拽旋转（带惯性） */
  const ctl = {rx:0, ry:0, vx:0, vy:0, enabled: opt.drag!==false, limitX: opt.limitX ?? .9, auto: opt.autoRotate||0, zoom:1};
  let dragging=false, lx=0, ly=0;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e=>{ if(!ctl.enabled) return; dragging=true; lx=e.clientX; ly=e.clientY; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e=>{ if(!dragging) return; const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY; ctl.vy = dx*.006; ctl.vx = dy*.006; ctl.ry+=ctl.vy; ctl.rx = GE.clamp(ctl.rx+ctl.vx, -ctl.limitX, ctl.limitX); });
  el.addEventListener('pointerup', ()=> dragging=false);
  el.addEventListener('pointercancel', ()=> dragging=false);

  /* HTML 标签 */
  const labels = [];
  const addLabel = (obj, html, cls='', offset) => {
    const d = document.createElement('div'); d.className = 'label3d ' + cls; d.innerHTML = html; host.appendChild(d);
    const L = {obj, el:d, offset: offset || new THREE.Vector3(), show:true}; labels.push(L); return L;
  };
  const v = new THREE.Vector3();
  const isVisible = o => { while(o){ if(!o.visible) return false; o = o.parent; } return true; };
  const updateLabels = () => {
    const w=W(), h=H();
    for(const L of labels){
      L.obj.updateWorldMatrix(true,false);
      v.copy(L.offset).applyMatrix4(L.obj.matrixWorld).project(camera);
      const vis = L.show && isVisible(L.obj) && v.z<1 && v.z>-1;
      L.el.style.opacity = vis ? (L.opacity ?? 1) : 0;
      if(vis){ L.el.style.left = ((v.x*.5+.5)*w)+'px'; L.el.style.top = ((-v.y*.5+.5)*h)+'px'; }
    }
  };
  const resize = () => { const w=W(), h=H(); if(!w||!h) return; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize);
  const render = dt => {
    if(!dragging){ ctl.vx*=.92; ctl.vy*=.92; ctl.ry += ctl.vy + ctl.auto*dt; ctl.rx = GE.clamp(ctl.rx+ctl.vx, -ctl.limitX, ctl.limitX); if(opt.springBack){ ctl.rx*=.97; } }
    pivot.rotation.x = GE.lerp(pivot.rotation.x, ctl.rx, .12);
    pivot.rotation.y = GE.lerp(pivot.rotation.y, ctl.ry, .12);
    renderer.render(scene, camera); updateLabels();
  };
  return {renderer, scene, camera, pivot, ctl, addLabel, labels, updateLabels, resize, render, host};
};

/* 双螺旋构建：沿 Y 轴（opts.axis='x' 则沿 X 轴） */
GE.buildHelix = (o={}) => {
  const n = o.n||40, rise = o.rise||.34, R = o.radius||1, twist = o.twist||(Math.PI*2/10);
  const g = new THREE.Group();
  const seq = o.seq || Array.from({length:n}, ()=> 'ATGC'[Math.random()*4|0]);
  const sphere = new THREE.SphereGeometry(o.bead||.16, 14, 10);
  const matA = GE.mat(o.colA||0x22e6ff, {emissiveIntensity:.6}), matB = GE.mat(o.colB||0x7a5cff, {emissiveIntensity:.6});
  const ptsA=[], ptsB=[];
  const y0 = -(n-1)*rise/2;
  const bases = [];
  for(let i=0;i<n;i++){
    const y = y0 + i*rise, a = i*twist;
    const pa = new THREE.Vector3(R*Math.cos(a), y, R*Math.sin(a));
    const pb = new THREE.Vector3(R*Math.cos(a+Math.PI*.78), y, R*Math.sin(a+Math.PI*.78));
    ptsA.push(pa); ptsB.push(pb);
    const sa = new THREE.Mesh(sphere, matA); sa.position.copy(pa); g.add(sa);
    const sb = new THREE.Mesh(sphere, matB); sb.position.copy(pb); g.add(sb);
    // 碱基对：两段不同颜色
    const b1 = seq[i], b2 = GE.compDNA[b1];
    const mid = pa.clone().lerp(pb,.5);
    [[pa,mid,b1],[mid,pb,b2]].forEach(([p,q,b])=>{
      const len = p.distanceTo(q);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(o.rod||.07,o.rod||.07,len*.92,8), GE.mat(GE.BASE_COLOR[b],{emissiveIntensity:.5}));
      cyl.position.copy(p).lerp(q,.5); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), q.clone().sub(p).normalize());
      g.add(cyl); bases.push(cyl);
    });
  }
  const tubeMat = (c)=> new THREE.MeshStandardMaterial({color:c, emissive:c, emissiveIntensity:.5, transparent:true, opacity:.55, roughness:.4});
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsA), n*4, o.tube||.06, 6), tubeMat(o.colA||0x22e6ff)));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsB), n*4, o.tube||.06, 6), tubeMat(o.colB||0x7a5cff)));
  g.userData = {bases, ptsA, ptsB, seq};
  if(o.axis==='x') g.rotation.z = Math.PI/2;
  return g;
};

/* 文字精灵（用于3D内的小标签） */
GE.textSprite = (text, o={}) => {
  const c = document.createElement('canvas'), fs = o.fs||64; const g = c.getContext('2d');
  g.font = `bold ${fs}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",monospace`;
  const w = Math.ceil(g.measureText(text).width)+fs*.6; c.width = w; c.height = fs*1.4;
  g.font = `bold ${fs}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",monospace`;
  if(o.bg){ g.fillStyle=o.bg; const r=fs*.3; g.beginPath(); g.roundRect ? g.roundRect(0,0,w,c.height,r) : g.rect(0,0,w,c.height); g.fill(); }
  g.fillStyle = o.color||'#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text, w/2, c.height/2+fs*.05);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false, depthTest: o.depthTest ?? true}));
  const h = o.h||.4; s.scale.set(h*w/c.height, h, 1); return s;
};

/* ---------- 2D 背景粒子 ---------- */
GE.bgParticles = () => {
  const c = GE.$('#bg-particles'), g = c.getContext('2d'); let w,h, P=[];
  const rs = () => { w = c.width = innerWidth; h = c.height = innerHeight; P = Array.from({length: Math.min(110, (w*h/16000)|0)}, ()=>({x:Math.random()*w, y:Math.random()*h, vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25, r:Math.random()*1.6+.3})); };
  rs(); addEventListener('resize', rs);
  GE.bgTick = () => {
    g.clearRect(0,0,w,h);
    const grd = g.createRadialGradient(w*.5,h*.4,0,w*.5,h*.4,Math.max(w,h)*.7); grd.addColorStop(0,'#071a2c'); grd.addColorStop(1,'#02050b');
    g.fillStyle = grd; g.fillRect(0,0,w,h);
    for(const p of P){ p.x+=p.vx; p.y+=p.vy; if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0; }
    g.strokeStyle = 'rgba(34,230,255,.07)';
    for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){ const dx=P[i].x-P[j].x, dy=P[i].y-P[j].y; if(dx*dx+dy*dy<9000){ g.beginPath(); g.moveTo(P[i].x,P[i].y); g.lineTo(P[j].x,P[j].y); g.stroke(); } }
    g.fillStyle = 'rgba(160,240,255,.7)';
    for(const p of P){ g.beginPath(); g.arc(p.x,p.y,p.r,0,7); g.fill(); }
  };
};

/* ---------- 路由 ---------- */
GE.go = (id) => {
  const s = GE.sections.find(x=>x.id===id); if(!s || s===GE.cur) return;
  if(GE.cur){ GE.cur.el.classList.remove('on'); GE.cur.leave && GE.cur.leave(); }
  GE.cur = s; s.el.classList.add('on');
  if(!s._inited){ s._inited = true; try{ s.init && s.init(); }catch(e){ console.error(e); } }
  s.enter && s.enter();
  GE.$$('#mainnav button').forEach(b=> b.classList.toggle('on', b.dataset.id===id));
  if(location.hash !== '#'+id) history.replaceState(null,'','#'+id);
  GE.syncAnswerBtn();
};
GE.goRel = d => { const i = GE.sections.indexOf(GE.cur), j = GE.clamp(i+d, 0, GE.sections.length-1); GE.go(GE.sections[j].id); };
GE.next = () => { const s = GE.cur; if(s.next && s.next()!==false) return; GE.goRel(1); };
GE.prev = () => { const s = GE.cur; if(s.prev && s.prev()!==false) return; GE.goRel(-1); };

GE.syncAnswerBtn = () => { const b = GE.$('#tb-answer'); const h = document.body.classList.contains('hide-answers'); b.classList.toggle('on', h); b.textContent = h ? '◑ 显示答案' : '◐ 隐藏答案'; };
GE.toggleAnswers = () => { document.body.classList.toggle('hide-answers'); GE.$$('.revealed').forEach(e=>e.classList.remove('revealed')); GE.syncAnswerBtn(); GE.cur && GE.cur.onAnswers && GE.cur.onAnswers(); };
GE.fullscreen = () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(()=>{}); else document.exitFullscreen(); };

GE.initShell = () => {
  const nav = GE.$('#mainnav');
  GE.sections.forEach((s,i)=>{ s.el = GE.$('#sec-'+s.id); const b = document.createElement('button'); b.dataset.id = s.id; b.innerHTML = `<i>0${i+1}</i>${s.title}`; b.onclick = ()=> GE.go(s.id); nav.appendChild(b); });
  document.addEventListener('click', e=>{ const g = e.target.closest('[data-go]'); if(g) GE.go(g.dataset.go);
    const m = e.target.closest('.mask, .answer-block'); if(m && document.body.classList.contains('hide-answers')) m.classList.toggle('revealed'); });
  GE.$('#tb-next').onclick = GE.next; GE.$('#tb-prev').onclick = GE.prev;
  GE.$('#tb-reset').onclick = ()=>{ GE.cur.reset && GE.cur.reset(); GE.toast('已重置本节'); };
  GE.$('#tb-answer').onclick = GE.toggleAnswers;
  GE.$('#tb-full').onclick = GE.fullscreen;
  GE.$('#tb-help').onclick = ()=> GE.$('#help-modal').classList.add('show');
  GE.$('#help-modal').onclick = e=>{ if(e.target.id==='help-modal') e.target.classList.remove('show'); };
  GE.$('#tb-fold').onclick = ()=> GE.$('#teacherbar').classList.add('folded');
  GE.$('#teacherbar-open').onclick = ()=> GE.$('#teacherbar').classList.remove('folded');

  document.addEventListener('keydown', e=>{
    const tg = e.target.tagName; if(tg==='INPUT' || tg==='TEXTAREA') { if(e.key==='Escape') e.target.blur(); return; }
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(GE.cur.onKey && GE.cur.onKey(e)===true){ e.preventDefault(); return; }
    const k = e.key;
    if(/^[1-8]$/.test(k)){ const s = GE.sections[+k-1]; s && GE.go(s.id); }
    else if(k==='ArrowRight' || k==='PageDown'){ e.preventDefault(); GE.next(); }
    else if(k==='ArrowLeft' || k==='PageUp'){ e.preventDefault(); GE.prev(); }
    else if(k===' '){ e.preventDefault(); GE.cur.toggle && GE.cur.toggle(); }
    else if(k==='r' || k==='R'){ GE.cur.reset && GE.cur.reset(); GE.toast('已重置本节'); }
    else if(k==='h' || k==='H'){ GE.toggleAnswers(); }
    else if(k==='f' || k==='F'){ GE.fullscreen(); }
    else if(k==='t' || k==='T'){ GE.$('#teacherbar').classList.toggle('folded'); }
    else if(k==='?' || k==='/'){ GE.$('#help-modal').classList.toggle('show'); }
    else if(k==='Escape'){ GE.$('#help-modal').classList.remove('show'); }
  });
  setInterval(()=>{ const d = new Date(); GE.$('#hud-clock').textContent = d.toTimeString().slice(0,8); }, 1000);
};

/* 主循环 */
GE.loop = () => {
  let last = performance.now();
  const tick = now => {
    const dt = Math.min(.1, (now-last)/1000); last = now;
    if(!document.hidden){
      GE.bgTick && GE.bgTick();
      if(GE.cur && GE.cur.frame){ try{ GE.cur.frame(dt, now/1000); }catch(e){ console.error(e); GE.cur.frame = null; } }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
})();
