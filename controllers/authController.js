const salesforceOAuthService = require('../services/salesforceOAuthService');

function getConfig() {
  const baseUrl = process.env.SALESFORCE_BASE_URL;
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI;
  const scope = process.env.SALESFORCE_SCOPE || 'openid';

  if (!baseUrl || !clientId || !clientSecret || !redirectUri) {
    throw new Error('Config Salesforce mancante: SALESFORCE_BASE_URL / SALESFORCE_CLIENT_ID / SALESFORCE_CLIENT_SECRET / SALESFORCE_REDIRECT_URI');
  }

  return { baseUrl, clientId, clientSecret, redirectUri, scope };
}

// Avvio login
exports.startSalesforceLogin = (req, res, next) => {
  try {
    const { baseUrl, clientId, redirectUri, scope } = getConfig();

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

    return res.redirect(authorizeUrl);
  } catch (err) {
    return next(err);
  }
};

// Risposta Salesforce
exports.handleOAuthCallback = async (req, res, next) => {
  try {
    const { baseUrl, clientId, clientSecret, redirectUri } = getConfig();

    const code = req.query.code;
    const state = req.query.state;

    if (!code) return res.status(400).send('Missing code');
    if (!state) return res.status(400).send('Missing state');

    const oauthSession = req.session.oauth;
    if (!oauthSession || oauthSession.provider !== 'salesforce') {
      return res.status(400).send('OAuth session not found');
    }

    if (oauthSession.state !== state) {
      return res.status(400).send('Invalid state');
    }

    const tokenData = await salesforceOAuthService.exchangeCodeForToken({
      baseUrl,
      clientId,
      clientSecret,
      redirectUri,
      code,
      codeVerifier: oauthSession.codeVerifier,
    });

    req.session.salesforce = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
      instanceUrl: tokenData.instance_url,
      tokenType: tokenData.token_type,
      issuedAt: tokenData.issued_at,
      identityUrl: tokenData.id,
    };

    req.session.isAuthenticated = true;

    delete req.session.oauth;
    delete req.session.user;

    const redirectTo = req.session.returnTo || '/index';
    delete req.session.returnTo;

    return res.redirect(redirectTo);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    if (err.details) {
        console.error('OAuth error details:', err.details);
    }
    return next(err);
  }
};

exports.logout = (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      return res.redirect('/auth-logout');
    });
  } catch (err) {
    return next(err);
  }
};