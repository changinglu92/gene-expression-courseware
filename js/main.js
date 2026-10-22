(function(){
  const GE = window.GE;
  if(!GE.has3D){ document.getElementById('noscript-3d').classList.remove('hidden'); }
  GE.initShell();
  GE.bgParticles();
  const id = location.hash.slice(1);
  GE.go(GE.sections.some(s=>s.id===id) ? id : 'home');
  GE.loop();
  window.addEventListener('hashchange', ()=>{ const h = location.hash.slice(1); if(GE.sections.some(s=>s.id===h)) GE.go(h); });
})();
