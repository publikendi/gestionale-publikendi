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
      req.session.destroy(() => res.redirect('/auth-login'));
      return;
    }

    const apiVersion = process.env.SALESFORCE_API_VERSION || '59.0';

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
    const status = err && err.status;
    console.error('[loadSalesforceUser] failed:', err.message, err.details || '');

    if (status === 401 || status === 403) {
      req.session.destroy(() => res.redirect('/auth-login'));
      return;
    }

    res.locals.user = null;
    return next();
  }
};