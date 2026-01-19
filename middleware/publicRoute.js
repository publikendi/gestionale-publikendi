/**
 * Ritorna true se la richiesta deve essere accessibile senza autenticazione.
 */
module.exports = function isPublicRoute(req) {
  const p = req.path;

  if (p.startsWith('/auth-')) return true;
  if (p.startsWith('/oauth/')) return true;

  // Aggiungi qui eventuali eccezioni future:
  // if (p === '/health') return true;

  return false;
};