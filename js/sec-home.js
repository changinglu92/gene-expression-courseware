/* ============ 首页：3D DNA 双螺旋 ============ */
(function(){
const GE = window.GE;
let S, helix, stars, rings=[], floaters=[], mx=0, my=0;
GE.register({
  id:'home', title:'首页',
  init(){
    if(!GE.has3D) return;
    S = GE.make3D(GE.$('#home-3d'), {dist:14, fog:.03, autoRotate:.25, limitX:.4, springBack:true});
    S.camera.position.set(0,0,14);
    const holder = new THREE.Group(); holder.position.set(4.2,0,0); holder.rotation.z = -.35; S.pivot.add(holder);
    S.pivot.position.set(0,0,0);
    helix = GE.buildHelix({n:46, rise:.36, radius:1.25, bead:.15, rod:.06});
    holder.add(helix);
    const halo = GE.glowSprite(0x22e6ff, 9, .22); holder.add(halo);
    // 轨道环
    for(let i=0;i<3;i++){
      const r = new THREE.Mesh(new THREE.TorusGeometry(2.6+i*.9, .012, 8, 160), new THREE.MeshBasicMaterial({color: i%2?0xb98cff:0x22e6ff, transparent:true, opacity:.35}));
      r.rotation.x = Math.PI/2 + (i-1)*.25; r.position.y = (i-1)*3.4; holder.add(r); rings.push(r);
    }
    // 漂浮的核苷酸
    const geo = new THREE.IcosahedronGeometry(.12,0);
    for(let i=0;i<70;i++){
      const b = 'AUGC'[i%4]; const m = new THREE.Mesh(geo, GE.mat(GE.BASE_COLOR[b],{emissiveIntensity:.9}));
      m.userData = {r: 3+Math.random()*6, a: Math.random()*7, y:(Math.random()-.5)*14, s:.1+Math.random()*.25};
      holder.add(m); floaters.push(m);
    }
    stars = GE.starfield(1600, 70); S.scene.add(stars);
    addEventListener('pointermove', e=>{ mx = e.clientX/innerWidth-.5; my = e.clientY/innerHeight-.5; });
    const ro = () => { holder.position.x = innerWidth < 1300 ? 4.8 : 4.2; }; ro(); addEventListener('resize', ro);
  },
  enter(){ S && S.resize(); },
  frame(dt,t){
    if(!S) return;
    helix.rotation.y += dt*.35;
    rings.forEach((r,i)=> r.rotation.z += dt*(.1+i*.05)*(i%2?-1:1));
    floaters.forEach(f=>{ const u=f.userData; u.a += dt*u.s; f.position.set(Math.cos(u.a)*u.r, u.y+Math.sin(t*.5+u.a)*.3, Math.sin(u.a)*u.r); f.rotation.x += dt; });
    stars.rotation.y += dt*.01;
    S.camera.position.x = GE.lerp(S.camera.position.x, mx*1.5, .04);
    S.camera.position.y = GE.lerp(S.camera.position.y, -my*1, .04);
    S.camera.lookAt(0,0,0);
    S.render(dt);
  }
});
})();
