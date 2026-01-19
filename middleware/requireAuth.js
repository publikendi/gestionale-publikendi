// Middleware di protezione.
module.exports = function requireAuth(req, res, next) {
  const isAuthenticated = Boolean(req.session && req.session.isAuthenticated);
  if (isAuthenticated) return next();

  const isPublicAuthPath =
    req.path.startsWith('/auth-') || req.path.startsWith('/oauth/');

  if (!isPublicAuthPath && req.method === 'GET' && req.session) {
    req.session.returnTo = req.originalUrl;
  }

  const accepts = req.get('accept') || '';
  const isAjax = req.xhr === true;
  const wantsJson = accepts.includes('application/json');

  if (isAjax || wantsJson) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.redirect('/auth-login');
};