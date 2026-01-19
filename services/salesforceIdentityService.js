const fetchFn = global.fetch;

async function jsonOrEmpty(resp) {
  return resp.json().catch(() => ({}));
}


/** GET identity endpoint (tokenData.id) -> info identità (display_name, photos, ecc.) */
async function fetchSalesforceIdentity({ identityUrl, accessToken }) {
  if (!fetchFn) {
    throw new Error('fetch non disponibile. Usa Node 18+ oppure installa node-fetch.');
  }
  if (!identityUrl) throw new Error('identityUrl mancante');
  if (!accessToken) throw new Error('accessToken mancante');

  const resp = await fetchFn(identityUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await jsonOrEmpty(resp);

  if (!resp.ok) {
    const err = new Error(`Salesforce identity error: ${resp.status}`);
    err.details = data;
    throw err;
  }

  return data;
}

/** Query su /services/data/vXX.X/query */
async function querySalesforce({ instanceUrl, accessToken, apiVersion, soql }) {
  if (!fetchFn) throw new Error('fetch non disponibile. Usa Node 18+ oppure installa node-fetch.');
  if (!instanceUrl) throw new Error('instanceUrl mancante');
  if (!accessToken) throw new Error('accessToken mancante');
  if (!apiVersion) throw new Error('apiVersion mancante');
  if (!soql) throw new Error('soql mancante');

  const url = new URL(`/services/data/v${apiVersion}/query/`, instanceUrl);
  url.searchParams.set('q', soql);

  const resp = await fetchFn(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await jsonOrEmpty(resp);

  if (!resp.ok) {
    const err = new Error(`Salesforce query error: ${resp.status}`);
    err.details = data;
    throw err;
  }

  return data;
}

/**
 * Recupera record User partendo dallo userId
 */
async function fetchSalesforceUserRecord({ instanceUrl, accessToken, apiVersion, userId }) {
  const soql =
    "SELECT Id, Name, FirstName, LastName, Username, Email, Title, Department, " +
    "SmallPhotoUrl, FullPhotoUrl, Profile.Name, UserRole.Name " +
    `FROM User WHERE Id = '${userId}'`;

  const data = await querySalesforce({ instanceUrl, accessToken, apiVersion, soql });
  const record = Array.isArray(data.records) ? data.records[0] : null;

  if (!record) {
    const err = new Error('Salesforce User record not found');
    err.details = data;
    throw err;
  }

  return record;
}

/**
 * Flatten: unisce identity + User record in un singolo oggetto "user" per la sessione/view.
 */
function flattenUser({ identity, userRecord }) {
  return {
    // Identity (comodo per topbar)
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
    photoSmallUrl: userRecord.SmallPhotoUrl || (identity.photos && identity.photos.thumbnail) || null,
    photoFullUrl: userRecord.FullPhotoUrl || (identity.photos && identity.photos.picture) || null,

    // Qualifica
    title: userRecord.Title || null,
    department: userRecord.Department || null,
    profileName: (userRecord.Profile && userRecord.Profile.Name) || null,
    roleName: (userRecord.UserRole && userRecord.UserRole.Name) || null,

    // Debug/extra
    raw: {
      identity,
      userRecord,
    },
  };
}

module.exports = {
  fetchSalesforceIdentity,
  fetchSalesforceUserRecord,
  flattenUser,
};