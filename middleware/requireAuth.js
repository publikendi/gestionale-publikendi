module.exports = function requireAuth(req, res, next) {
  const hasSession = req.session && req.session.isAuthenticated;
  const hasSfToken = req.session && req.session.salesforce && req.session.salesforce.accessToken;

  if (!hasSession || !hasSfToken) {
    if (req.method === 'GET' && req.session) {
      req.session.returnTo = req.originalUrl;
    }

    const accepts = req.get('accept') || '';
    const isAjax = req.xhr === true || accepts.includes('application/json');

    if (isAjax) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/auth-login');
  }

  return next();
};