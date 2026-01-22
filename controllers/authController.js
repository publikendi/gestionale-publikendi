const oauthFacade = require('../services/salesforceOAuthFacade');
const salesforceOAuthService = require('../services/salesforceOAuthService');

// Avvio login
exports.startSalesforceLogin = (req, res, next) => {
  try {
    const {
      SALESFORCE_BASE_URL: baseUrl,
      SALESFORCE_CLIENT_ID: clientId,
      SALESFORCE_REDIRECT_URI: redirectUri,
      SALESFORCE_SCOPE: scope = 'openid',
    } = process.env;

    const codeVerifier = salesforceOAuthService.generateCodeVerifier();
    const codeChallenge = salesforceOAuthService.generateCodeChallenge(codeVerifier);
    const state = salesforceOAuthService.generateState();

    req.session.oauth = {
      provider: 'salesforce',
      codeVerifier,
      state,
      createdAt: Date.now(),
    };

    const authorizeUrl = salesforceOAuthService.buildAuthorizeUrl({
      baseUrl,
      clientId,
      redirectUri,
      scope,
      state,
      codeChallenge,
    });

    res.redirect(authorizeUrl);
  } catch (err) {
    next(err);
  }
};

// Callback OAuth
exports.handleOAuthCallback = async (req, res, next) => {
  try {
    const tokenData = await oauthFacade.exchangeCode({
      req,
      code: req.query.code,
    });

    const redirectTo = req.session.returnTo || '/index';

    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.salesforce = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        instanceUrl: tokenData.instance_url,
        identityUrl: tokenData.id,
      };

      req.session.isAuthenticated = true;

      delete req.session.oauth;
      delete req.session.returnTo;
      delete req.session.user;

      res.redirect(redirectTo);
    });

  } catch (err) {
    next(err);
  }
};

// Logout + revoca token
exports.logout = async (req, res, next) => {
  try {
    const token = req.session?.salesforce?.refreshToken
      || req.session?.salesforce?.accessToken;

    await oauthFacade.revokeToken({ token });

    req.session.destroy((err) => {
      if (err) return next(err);
      res.redirect('/auth-logout');
    });
  } catch (err) {
    next(err);
  }
};