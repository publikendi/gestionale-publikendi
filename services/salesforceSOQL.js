const fetchFn = global.fetch;

function assertNonEmpty(name, value) {
  if (!value) throw new Error(`${name} mancante`);
}

async function jsonOrText(resp) {
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) return resp.json().catch(() => ({}));
  return resp.text().catch(() => '');
}

function escapeSoqlString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function htmlToText(input) {
  let s = String(input ?? '');
  if (!s) return '';

  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p\s*>/gi, '\n');
  s = s.replace(/<\/div\s*>/gi, '\n'); 
  s = s.replace(/<\/li\s*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&egrave;': 'è',
    '&eacute;': 'é',
    '&àgrave;': 'à',
    '&igrave;': 'ì',
    '&ograve;': 'ò',
    '&ugrave;': 'ù'
  };
  
  s = s.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);

  return s.trim();
}

async function sfGetJson(url, { accessToken, timeoutMs = 10000 } = {}) {
  if (!fetchFn) {
    throw new Error('fetch non disponibile (Node 18+).');
  }
  assertNonEmpty('url', url);
  assertNonEmpty('accessToken', accessToken);

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

  const data = await jsonOrText(resp);

  if (!resp.ok) {
    const err = new Error(`Salesforce HTTP ${resp.status}`);
    err.status = resp.status;
    err.details = data;
    throw err;
  }

  return data;
}

async function salesforceQuery({ instanceUrl, accessToken, apiVersion, soql }) {
  assertNonEmpty('instanceUrl', instanceUrl);
  assertNonEmpty('accessToken', accessToken);
  assertNonEmpty('apiVersion', apiVersion);
  assertNonEmpty('soql', soql);

  const url = new URL(`/services/data/v${apiVersion}/query`, instanceUrl);
  url.searchParams.set('q', soql);

  const data = await sfGetJson(url.toString(), { accessToken, timeoutMs: 10000 });
  return Array.isArray(data.records) ? data.records : [];
}

async function executeQuery({ instanceUrl, accessToken, apiVersion, soql }) {
  return await salesforceQuery({ instanceUrl, accessToken, apiVersion, soql });
};

module.exports = {
  assertNonEmpty,
  escapeSoqlString,
  htmlToText,
  sfGetJson,
  salesforceQuery,
  executeQuery
};
