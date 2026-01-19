const {
  fetchSalesforceIdentity,
  fetchSalesforceUserRecord,
  flattenUser,
} = require('../services/salesforceIdentityService');

/** STRICT + "once per session": */
module.exports = async function loadSalesforceUser(req, res, next) {
  try {
    // Non autenticato: non facciamo nulla
    if (!(req.session && req.session.isAuthenticated)) return next();

    // Già caricato: riuso
    if (req.session.user) {
      res.locals.user = req.session.user;
      return next();
    }

    const sf = req.session.salesforce;
    if (!sf || !sf.accessToken || !sf.instanceUrl || !sf.identityUrl) {
      req.session.destroy(() => res.redirect('/auth-login'));
      return;
    }

    const apiVersion = process.env.SALESFORCE_API_VERSION || '59.0';

    // 1) Identity
    const identity = await fetchSalesforceIdentity({
      identityUrl: sf.identityUrl,
      accessToken: sf.accessToken,
    });

    // 2) User record (per qualifica/title/profile/role)
    const userRecord = await fetchSalesforceUserRecord({
      instanceUrl: sf.instanceUrl,
      accessToken: sf.accessToken,
      apiVersion,
      userId: identity.user_id,
    });

    // 3) Flatten
    const user = flattenUser({ identity, userRecord });

    req.session.user = user;
    res.locals.user = user;

    return next();
  } catch (err) {
    // STRICT
    console.error('[loadSalesforceUser] failed:', err.message, err.details || '');
    req.session.destroy(() => res.redirect('/auth-login'));
  }
};