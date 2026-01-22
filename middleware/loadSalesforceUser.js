const {
  fetchSalesforceIdentity,
  fetchSalesforceUserRecord,
  flattenUser,
} = require('../services/salesforceIdentity');

const { sfFetchWithAutoRefresh } = require('../services/sfFetchWithAutoRefresh');

const USER_CACHE_TTL_MS = 5 * 60 * 1000;

module.exports = async function loadSalesforceUser(req, res, next) {
  try {
    if (!req.session?.isAuthenticated) return next();

    const sf = req.session.salesforce;
    if (!sf?.accessToken || !sf.identityUrl) {
      return req.session.destroy(() => res.redirect('/auth-login'));
    }

    const now = Date.now();

    if (
      req.session.user &&
      req.session.userCachedAt &&
      now - req.session.userCachedAt < USER_CACHE_TTL_MS
    ) {
      res.locals.user = req.session.user;
      return next();
    }

    const identity = await sfFetchWithAutoRefresh({
      req,
      fetchFn: () =>
        fetchSalesforceIdentity({
          identityUrl: sf.identityUrl,
          accessToken: sf.accessToken,
        }),
      buildRequest: (newToken) =>
        fetchSalesforceIdentity({
          identityUrl: sf.identityUrl,
          accessToken: newToken,
        }),
    });

    const userRecord = await sfFetchWithAutoRefresh({
      req,
      fetchFn: () =>
        fetchSalesforceUserRecord({
          instanceUrl: sf.instanceUrl,
          accessToken: sf.accessToken,
          apiVersion: process.env.SALESFORCE_API_VERSION || '59.0',
          userId: identity.user_id,
        }),
      buildRequest: (newToken) =>
        fetchSalesforceUserRecord({
          instanceUrl: sf.instanceUrl,
          accessToken: newToken,
          apiVersion: process.env.SALESFORCE_API_VERSION || '59.0',
          userId: identity.user_id,
        }),
    });

    req.session.user = flattenUser({ identity, userRecord });
    req.session.userCachedAt = now;

    res.locals.user = req.session.user;
    next();

  } catch (err) {
    if (err.status === 401) {
      return req.session.destroy(() => res.redirect('/auth-login'));
    }
    next(err);
  }
};