/**
 * Service: Servizi
 * Responsabile di interrogare Salesforce e restituire dati pronti all'uso.
 */

async function salesforceQuery({ instanceUrl, accessToken, apiVersion, soql }) {
  const url =
    `${instanceUrl}/services/data/v${apiVersion}/query?q=` +
    encodeURIComponent(soql);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error('Salesforce query failed');
    err.details = text;
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.records || [];
}

/**
 * Prodotti
 */
exports.fetchProductsForPricebook = async function fetchProductsForPricebook({
  instanceUrl,
  accessToken,
  apiVersion,
  pricebookName,
}) {
  const safeName = String(pricebookName).replace(/'/g, "\\'");

  // 1) Trovo Pricebook2.Id
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

  // 2) Prendo le entry del listino con Product2 + prezzo
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
    Product2.CreatedDate
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

  // 3) "Flatten": trasformo ogni entry in un oggetto facile da usare in frontend
  return entries.map((e) => ({
    pricebookEntryId: e.Id,
    productId: e.Product2?.Id,
    name: e.Product2?.Name,
    productCode: e.Product2?.ProductCode,
    family: e.Product2?.Family,
    isActive: !!e.Product2?.IsActive,
    createdDate: e.Product2?.CreatedDate,
    unitPrice: e.UnitPrice,
  }));
};