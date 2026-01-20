const fetchFn = global.fetch;

async function jsonOrEmpty(resp) {
  return resp.json().catch(() => ({}));
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

async function fetchJsonWithTimeout(url, { accessToken, timeoutMs = 10000 } = {}) {
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

  return fetchJsonWithTimeout(identityUrl, { accessToken, timeoutMs: 10000 });
}

async function fetchSalesforceUserRecord({ instanceUrl, accessToken, apiVersion, userId }) {
  if (!instanceUrl) throw new Error('instanceUrl mancante');
  if (!accessToken) throw new Error('accessToken mancante');
  if (!apiVersion) throw new Error('apiVersion mancante');
  if (!userId) throw new Error('userId mancante');

  const url = new URL(
    `/services/data/v${apiVersion}/sobjects/User/${encodeURIComponent(userId)}`,
    instanceUrl
  );

  url.searchParams.set(
    'fields',
    [
      'Id',
      'Name',
      'FirstName',
      'LastName',
      'Username',
      'Email',
      'Title',
      'Department',
      'SmallPhotoUrl',
      'FullPhotoUrl',
      'Profile.Name',
      'UserRole.Name',
    ].join(',')
  );

  try {
    const data = await fetchJsonWithTimeout(url.toString(), { accessToken, timeoutMs: 10000 });

    if (!isPlainObject(data) || !data.Id) {
      const err = new Error('Salesforce User record not found');
      err.details = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err && err.status === 400) {
      const url2 = new URL(
        `/services/data/v${apiVersion}/sobjects/User/${encodeURIComponent(userId)}`,
        instanceUrl
      );

      url2.searchParams.set(
        'fields',
        [
          'Id',
          'Name',
          'FirstName',
          'LastName',
          'Username',
          'Email',
          'Title',
          'Department',
          'SmallPhotoUrl',
          'FullPhotoUrl',
        ].join(',')
      );

      const data2 = await fetchJsonWithTimeout(url2.toString(), { accessToken, timeoutMs: 10000 });

      if (!isPlainObject(data2) || !data2.Id) {
        const e2 = new Error('Salesforce User record not found');
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
    // Identity 
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

    // Foto
    photoSmallUrl:
      userRecord.SmallPhotoUrl ||
      (identity.photos && identity.photos.thumbnail) ||
      null,
    photoFullUrl:
      userRecord.FullPhotoUrl ||
      (identity.photos && identity.photos.picture) ||
      null,

    // Qualifica
    title: userRecord.Title || null,
    department: userRecord.Department || null,
    profileName: (userRecord.Profile && userRecord.Profile.Name) || null,
    roleName: (userRecord.UserRole && userRecord.UserRole.Name) || null,
  };

  // Debug/extra: evita di salvare raw in produzione (privacy + session bloat)
  if (process.env.NODE_ENV !== 'production') {
    user.raw = {
      identity,
      userRecord,
    };
  }

  return user;
}

module.exports = {
  fetchSalesforceIdentity,
  fetchSalesforceUserRecord,
  flattenUser,
};