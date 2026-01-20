/** Servizi */
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

/**
 * Converte una stringa HTML in testo “leggibile”.
 * Non è un parser HTML completo, ma è robusto per markup semplice.
 */
function htmlToText(input) {
  let s = String(input ?? '');
  if (!s) return '';

  // rimuove script/style
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // newline “semantici”
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p\s*>/gi, '\n');
  s = s.replace(/<\/li\s*>/gi, '\n');

  // rimuove tutti i tag
  s = s.replace(/<[^>]+>/g, '');

  // decodifica entità comuni
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&lt;': '<',
    '&gt;': '>',
  };
  s = s.replace(/&(nbsp|amp|quot|#39|lt|gt);/g, (m) => entities[m] ?? m);

  // normalizza spazi e newline
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.replace(/[ \t]{2,}/g, ' ');

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

// Prodotti
exports.fetchProductsForPricebook = async function fetchProductsForPricebook({
  instanceUrl,
  accessToken,
  apiVersion,
  pricebookName,
}) {
  assertNonEmpty('pricebookName', pricebookName);

  const safeName = escapeSoqlString(pricebookName);

  const pricebookSoql = `
    SELECT Id
    FROM Pricebook2
    WHERE Name = '${safeName}'
    LIMIT 1
  `.trim();

  const pricebooks = await salesforceQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql: pricebookSoql,
  });

  if (!pricebooks.length) return [];

  const pricebookId = pricebooks[0].Id;

  const entriesSoql = `
    SELECT
      Id,
      UnitPrice,
      IsActive,
      Product2.Id,
      Product2.Name,
      Product2.ProductCode,
      Product2.Family,
      Product2.IsActive,
      Product2.CreatedDate,
      Product2.Description,
      Product2.Obiettivo__c,
      Product2.Servizio__c,
      Product2.Vantaggi__c
    FROM PricebookEntry
    WHERE Pricebook2Id = '${pricebookId}'
      AND IsActive = true
      AND Product2.IsActive = true
    ORDER BY Product2.Family, Product2.ProductCode
    LIMIT 2000
  `.trim();

  const entries = await salesforceQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql: entriesSoql,
  });

  

  return entries.map((e) => ({
    pricebookEntryId: e.Id,
    productId: e.Product2?.Id,
    name: e.Product2?.Name ?? '',
    productCode: e.Product2?.ProductCode ?? '',
    family: e.Product2?.Family ?? '',
    isActive: !!e.Product2?.IsActive,
    createdDate: e.Product2?.CreatedDate,
    description: e.Product2?.Description ?? '',
    obiettivo: e.Product2?.Obiettivo__c,
    servizio: e.Product2?.Servizio__c,
    vantaggi: e.Product2?.Vantaggi__c,
    unitPrice: e.UnitPrice ?? null,
  }));
};