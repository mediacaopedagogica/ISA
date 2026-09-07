// Carrega os recursos complementares de forma independente do boot principal.
// Cada módulo já sabe esperar o perfil/mainView quando necessário.
const modules = [
  import('./mobile-responsive-v2.js?v=11-fastfix'),
  import('./notifications-v2.js?v=7-fastfix'),
  import('./extras-loader.js?v=11-fastfix')
];

const results = await Promise.allSettled(modules);
window.__ISA_EXTRAS_READY__ = true;
window.__ISA_EXTRAS_RESULTS__ = results.map((r, i) => ({
  index: i,
  ok: r.status === 'fulfilled',
  error: r.status === 'rejected' ? String(r.reason?.message || r.reason || 'Erro') : null
}));

results.forEach((r, i) => {
  if (r.status === 'rejected') console.warn('Módulo complementar não carregou', i, r.reason);
});
