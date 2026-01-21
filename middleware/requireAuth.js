module.exports = function requireAuth(req, res, next) {
  // Se l'utente è autenticato, prosegui
  if (req.session && req.session.isAuthenticated) {
    return next();
  }

  // Gestione della "memoria" della rotta richiesta per il redirect post-login
  if (req.method === 'GET' && req.session) {
    req.session.returnTo = req.originalUrl;
  }

  // Se è una richiesta API o AJAX, rispondi con JSON invece di redirect
  const accepts = req.get('accept') || '';
  const isAjax = req.xhr === true;
  const wantsJson = accepts.includes('application/json');

  if (isAjax || wantsJson) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Altrimenti, redirect al login
  return res.redirect('/auth-login');
};