const crypto = require("crypto");
const fetchFn = global.fetch;

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function generateState() {
  return crypto.randomBytes(16).toString("base64url");
}

function buildAuthorizeUrl({
  baseUrl,
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
}) {
  const authorizeUrl = new URL("/services/oauth2/authorize", baseUrl);

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  if (scope) authorizeUrl.searchParams.set("scope", scope);

  return authorizeUrl.toString();
}

async function exchangeCodeForToken({
  baseUrl,
  clientId,
  clientSecret,
  redirectUri,
  code,
  codeVerifier,
}) {
  if (!fetchFn) {
    throw new Error(
      "fetch non disponibile. Usa Node 18+ oppure installa node-fetch e adattiamo il codice."
    );
  }

  const tokenUrl = new URL("/services/oauth2/token", baseUrl);
  const body = new URLSearchParams();

  body.set("grant_type", "authorization_code");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("redirect_uri", redirectUri);
  body.set("code", code);
  body.set("code_verifier", codeVerifier);

  const resp = await fetchFn(tokenUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const err = new Error(`Salesforce token error: ${resp.status}`);
    err.details = data;
    throw err;
  }

  return data;
}

module.exports = {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizeUrl,
  exchangeCodeForToken,
};