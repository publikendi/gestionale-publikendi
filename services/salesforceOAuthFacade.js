const salesforceOAuthService = require('./salesforceOAuthService');

const OAUTH_STATE_TTL_MS = 5 * 60 * 1000;

const fetchFn = global.fetch;

async function refreshAccessToken({ refreshToken }) {
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const {
    SALESFORCE_BASE_URL: baseUrl,
    SALESFORCE_CLIENT_ID: clientId,
    SALESFORCE_CLIENT_SECRET: clientSecret,
  } = process.env;

  const tokenUrl = new URL('/services/oauth2/token', baseUrl);
  const body = new URLSearchParams();

  body.set('grant_type', 'refresh_token');
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  body.set('refresh_token', refreshToken);

  const resp = await fetchFn(tokenUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || !data.access_token) {
    const err = new Error('Failed to refresh Salesforce token');
    err.details = data;
    throw err;
  }

  return data;
}

function validateOAuthSession(oauthSession, state) {
  if (!oauthSession || oauthSession.provider !== 'salesforce') {
    throw new Error('OAuth session not found');
  }

  if (oauthSession.state !== state) {
    throw new Error('Invalid OAuth state');
  }

  if (Date.now() - oauthSession.createdAt > OAUTH_STATE_TTL_MS) {
    throw new Error('OAuth session expired');
  }
}

async function exchangeCode({ req, code }) {
  const {
    SALESFORCE_BASE_URL: baseUrl,
    SALESFORCE_CLIENT_ID: clientId,
    SALESFORCE_CLIENT_SECRET: clientSecret,
    SALESFORCE_REDIRECT_URI: redirectUri,
  } = process.env;

  if (!baseUrl || !clientId || !clientSecret || !redirectUri) {
    throw new Error('Salesforce OAuth config missing');
  }

  const oauthSession = req.session.oauth;
  validateOAuthSession(oauthSession, req.query.state);

  return salesforceOAuthService.exchangeCodeForToken({
    baseUrl,
    clientId,
    clientSecret,
    redirectUri,
    code,
    codeVerifier: oauthSession.codeVerifier,
  });
}

async function revokeToken({ token }) {
  if (!token) return;

  const revokeUrl = new URL('/services/oauth2/revoke', process.env.SALESFORCE_BASE_URL);
  revokeUrl.searchParams.set('token', token);

  try {
    await fetch(revokeUrl.toString(), { method: 'POST' });
  } catch (err) {
    console.warn('Salesforce token revoke failed:', err.message);
  }
}

module.exports = {
  exchangeCode,
  revokeToken,
  refreshAccessToken,
};