const {
  fetchSalesforceIdentity,
  fetchSalesforceUserRecord,
  flattenUser,
} = require('../services/salesforceIdentity');

module.exports = async function loadSalesforceUser(req, res, next) {
  try {
    if (!(req.session && req.session.isAuthenticated)) return next();

    const sf = req.session.salesforce;
    if (!sf || !sf.accessToken || !sf.identityUrl) {
      return req.session.destroy(() => res.redirect('/auth-login'));
    }

    const apiVersion = process.env.SALESFORCE_API_VERSION || '59.0';

    try {
      const identity = await fetchSalesforceIdentity({
        identityUrl: sf.identityUrl,
        accessToken: sf.accessToken,
      });

      if (!req.session.user) {
        const userRecord = await fetchSalesforceUserRecord({
          instanceUrl: sf.instanceUrl,
          accessToken: sf.accessToken,
          apiVersion,
          userId: identity.user_id,
        });
        req.session.user = flattenUser({ identity, userRecord });
      }

      res.locals.user = req.session.user;
      return next();

    } catch (err) {
      if (err.status === 401) {
        console.warn('Sessione Salesforce non più valida. Logout in corso...');
        return req.session.destroy(() => {
          res.clearCookie('connect.sid'); 
          res.redirect('/auth-login');
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('Errore nel middleware di validazione:', err.message);
    next();
  }
};