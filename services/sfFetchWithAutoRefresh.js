const { refreshAccessToken } = require('./salesforceOAuthFacade');

async function sfFetchWithAutoRefresh({
  req,
  fetchFn,
  buildRequest,
}) {
  try {
    return await fetchFn();
  } catch (err) {
    if (err.status !== 401) {
      throw err;
    }

    const sf = req.session?.salesforce;
    if (!sf?.refreshToken) {
      throw err;
    }

    // 🔁 refresh token
    const refreshed = await refreshAccessToken({
      refreshToken: sf.refreshToken,
    });

    // aggiorna sessione
    req.session.salesforce.accessToken = refreshed.access_token;
    req.session.salesforce.issuedAt = refreshed.issued_at || Date.now();

    // retry UNA volta
    return await buildRequest(refreshed.access_token);
  }
}

module.exports = {
  sfFetchWithAutoRefresh,
};