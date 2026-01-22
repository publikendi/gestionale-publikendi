const fetchFn = global.fetch;
const DEFAULT_TIMEOUT_MS = 10000;

async function jsonOrEmpty(resp) {
  return resp.json().catch(() => ({}));
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

async function fetchJsonWithTimeout(url, { accessToken, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!fetchFn) {
    throw new Error('fetch non disponibile. Usa Node 18+ oppure installa node-fetch.');
  }
  if (!url) throw new Error('url mancante');
  if (!accessToken) throw new Error('accessToken mancante');

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetchFn(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }

  const data = await jsonOrEmpty(resp);

  if (!resp.ok) {
    const err = new Error(`Salesforce HTTP ${resp.status}`);
    err.status = resp.status;
    err.details = data;
    throw err;
  }

  return data;
}

async function fetchSalesforceIdentity({ identityUrl, accessToken }) {
  if (!identityUrl) throw new Error('identityUrl mancante');
  if (!accessToken) throw new Error('accessToken mancante');

  return fetchJsonWithTimeout(identityUrl, { accessToken });
}

async function fetchSalesforceUserRecord({ instanceUrl, accessToken, apiVersion, userId }) {
  if (!instanceUrl) throw new Error('instanceUrl mancante');
  if (!accessToken) throw new Error('accessToken mancante');
  if (!apiVersion) throw new Error('apiVersion mancante');
  if (!userId) throw new Error('userId mancante');

  const getUrl = (fields) => {
    const u = new URL(
      `/services/data/v${apiVersion}/sobjects/User/${encodeURIComponent(userId)}`,
      instanceUrl
    );
    u.searchParams.set('fields', fields.join(','));
    return u.toString();
  };

  const fieldsFull = [
    'Id', 'Name', 'FirstName', 'LastName', 'Username', 'Email',
    'Title', 'Department', 'SmallPhotoUrl', 'FullPhotoUrl',
    'Profile.Name', 'UserRole.Name'
  ];

  const fieldsSafe = [
    'Id', 'Name', 'FirstName', 'LastName', 'Username', 'Email',
    'Title', 'Department', 'SmallPhotoUrl', 'FullPhotoUrl'
  ];

  try {
    const data = await fetchJsonWithTimeout(getUrl(fieldsFull), { accessToken });

    if (!isPlainObject(data) || !data.Id) {
      const err = new Error('Salesforce User record not found');
      err.details = data;
      throw err;
    }
    return data;
  } catch (err) {
    if (err && err.status === 400) {
      const data2 = await fetchJsonWithTimeout(getUrl(fieldsSafe), { accessToken });
      
      if (!isPlainObject(data2) || !data2.Id) {
        const e2 = new Error('Salesforce User record not found (retry)');
        e2.details = data2;
        throw e2;
      }
      return data2;
    }
    throw err;
  }
}

function flattenUser({ identity, userRecord }) {
  const user = {
    sfIdentityIdUrl: identity.id,
    sfUserId: identity.user_id,
    sfOrgId: identity.organization_id,
    displayName: identity.display_name,
    nickName: identity.nick_name,
    username: identity.username,
    email: identity.email,
    firstName: identity.first_name,
    lastName: identity.last_name,
    locale: identity.locale,
    language: identity.language,
    timezone: identity.timezone,
    photoSmallUrl:
      userRecord.SmallPhotoUrl ||
      identity.photos?.thumbnail ||
      null,
    photoFullUrl:
      userRecord.FullPhotoUrl ||
      identity.photos?.picture ||
      null,
    title: userRecord.Title || null,
    department: userRecord.Department || null,
    profileName: userRecord.Profile?.Name || null,
    roleName: userRecord.UserRole?.Name || null,
  };

  if (process.env.NODE_ENV !== 'production') {
    user.raw = { identity, userRecord };
  }

  return user;
}

module.exports = {
  fetchSalesforceIdentity,
  fetchSalesforceUserRecord,
  flattenUser,
};