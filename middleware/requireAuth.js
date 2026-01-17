/**
 * Middleware di protezione.
 * Se non c'è una sessione autenticata, manda alla pagina di login.
 */
module.exports = function requireAuth(req, res, next) {
  const isAuthenticated = Boolean(req.session && req.session.isAuthenticated);

  if (!isAuthenticated) {
    return res.redirect('/auth-login');
  }

  return next();
};