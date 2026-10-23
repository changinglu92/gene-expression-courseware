/* ============ 首页：3D DNA 双螺旋（投屏级光效） ============ */
(function(){
const GE = window.GE;
let S, helix, stars, rings=[], floaters=[], beams=[], mx=0, my=0, pulse=0;
GE.register({
  id:'home', title:'首页',
  init(){
    if(!GE.has3D) return;
    S = GE.make3D(GE.$('#home-3d'), {dist:13.5, fog:.025, autoRotate:.22, limitX:.4, springBack:true});
    S.camera.position.set(0,0,13.5);
    // 额外体积光：贴近螺旋的青 / 品红点光
    const key = new THREE.PointLight(0x22e6ff, 2.4, 28); key.position.set(3.5, 2.2, 4); S.scene.add(key);
    const rim = new THREE.PointLight(0xff3f8e, 1.6, 26); rim.position.set(6.5,-2.5,3); S.scene.add(rim);
    const fill = new THREE.PointLight(0xb98cff, 1.1, 30); fill.position.set(1,4,-2); S.scene.add(fill);
    S.homeLights = {key, rim, fill};

    const holder = new THREE.Group(); holder.position.set(4.2,0,0); holder.rotation.z = -.35; S.pivot.add(holder);
    helix = GE.buildHelix({n:50, rise:.34, radius:1.28, bead:.155, rod:.065, tube:.07, colA:0x3df0ff, colB:0xa56bff});
    holder.add(helix);
    // 多层光晕（近/中/远）
    [[5.5,.35, 0x22e6ff],[9,.18,0xb98cff],[14,.1,0x00ffc6]].forEach(([sz,op,col])=>{
      const h = GE.glowSprite(col, sz, op); holder.add(h); beams.push(h);
    });
    // 轨道环 + 能量刻度
    for(let i=0;i<4;i++){
      const r = new THREE.Mesh(new THREE.TorusGeometry(2.4+i*.85, .014, 8, 180), new THREE.MeshBasicMaterial({color: i%2?0xff3f8e:0x22e6ff, transparent:true, opacity:.42-i*.05}));
      r.rotation.x = Math.PI/2 + (i-1.5)*.22; r.position.y = (i-1.5)*2.8; holder.add(r); rings.push(r);
      const tick = new THREE.Mesh(new THREE.BoxGeometry(.04,.28,.04), new THREE.MeshBasicMaterial({color:0xffc857, transparent:true, opacity:.7}));
      tick.position.set(2.4+i*.85, (i-1.5)*2.8, 0); holder.add(tick);
    }
    // 漂浮核苷酸（更亮）
    const geo = new THREE.IcosahedronGeometry(.13,0);
    for(let i=0;i<80;i++){
      const b = 'AUGC'[i%4]; const m = new THREE.Mesh(geo, GE.mat(GE.BASE_COLOR[b],{emissiveIntensity:1.15}));
      m.userData = {r: 3+Math.random()*6.5, a: Math.random()*7, y:(Math.random()-.5)*14, s:.1+Math.random()*.28};
      holder.add(m); floaters.push(m);
    }
    // 地面能量环
    const floor = new THREE.Mesh(new THREE.RingGeometry(2.2, 5.8, 64), new THREE.MeshBasicMaterial({color:0x22e6ff, transparent:true, opacity:.08, side:THREE.DoubleSide}));
    floor.rotation.x = -Math.PI/2; floor.position.set(4.2,-6.2,0); S.pivot.add(floor);
    stars = GE.starfield(1800, 72); S.scene.add(stars);
    addEventListener('pointermove', e=>{ mx = e.clientX/innerWidth-.5; my = e.clientY/innerHeight-.5; });
    const ro = () => { holder.position.x = innerWidth < 1300 ? 4.8 : 4.2; }; ro(); addEventListener('resize', ro);
  },
  enter(){ S && S.resize(); },
  frame(dt,t){
    if(!S || !helix) return;
    pulse = .55 + Math.sin(t*2.2)*.45;
    helix.rotation.y += dt*.38;
    // 碱基对脉动发光
    if(helix.userData.bases){
      helix.userData.bases.forEach((b,i)=>{
        if(b.material && b.material.emissiveIntensity!=null){
          b.material.emissiveIntensity = .45 + .55*((Math.sin(t*3 + i*.35)+1)*.5);
        }
      });
    }
    rings.forEach((r,i)=> r.rotation.z += dt*(.12+i*.04)*(i%2?-1:1));
    beams.forEach((b,i)=>{ b.material.opacity = (.12+i*.08) + pulse*.12; b.scale.setScalar((5.5+i*4)*(.92+pulse*.08)); });
    if(S.homeLights){
      S.homeLights.key.intensity = 1.8 + pulse*1.2;
      S.homeLights.rim.intensity = 1.1 + (1-pulse)*.9;
    }
    floaters.forEach(f=>{ const u=f.userData; u.a += dt*u.s; f.position.set(Math.cos(u.a)*u.r, u.y+Math.sin(t*.5+u.a)*.3, Math.sin(u.a)*u.r); f.rotation.x += dt; });
    stars.rotation.y += dt*.012;
    S.camera.position.x = GE.lerp(S.camera.position.x, mx*1.6, .04);
    S.camera.position.y = GE.lerp(S.camera.position.y, -my*1.1, .04);
    S.camera.lookAt(0,0,0);
    S.render(dt);
  }
});
})();
