const {
  fetchSalesforceIdentity,
  fetchSalesforceUserRecord,
  flattenUser,
} = require('../services/salesforceIdentity');

module.exports = async function loadSalesforceUser(req, res, next) {
  try {
    if (!(req.session && req.session.isAuthenticated)) return next();

    if (req.session.user) {
      res.locals.user = req.session.user;
      return next();
    }

    const sf = req.session.salesforce;
    if (!sf || !sf.accessToken || !sf.instanceUrl || !sf.identityUrl) {
      return req.session.destroy(() => res.redirect('/auth-login'));
    }

    const apiVersion = process.env.SALESFORCE_API_VERSION || '59.0';

    try {
      const identity = await fetchSalesforceIdentity({
        identityUrl: sf.identityUrl,
        accessToken: sf.accessToken,
      });

      const userRecord = await fetchSalesforceUserRecord({
        instanceUrl: sf.instanceUrl,
        accessToken: sf.accessToken,
        apiVersion,
        userId: identity.user_id,
      });

      const user = flattenUser({ identity, userRecord });
      req.session.user = user;
      res.locals.user = user;
      return next();

    } catch (err) {
      // Gestione specifica per sessione scaduta (401)
      if (err.status === 401) {
        console.warn('[loadSalesforceUser] Salesforce Session Expired. Redirecting to login.');
        return req.session.destroy(() => {
          res.redirect('/auth-login');
        });
      }
      throw err;
    }

  } catch (err) {
    console.error('[loadSalesforceUser] Error:', err.message);
    next();
  }
};