const salesforceSOQL = require('./salesforceSOQL');

exports.fetchProductsForPricebook = async function fetchProductsForPricebook({
  instanceUrl,
  accessToken,
  apiVersion,
  pricebookName,
}) {
  salesforceSOQL.assertNonEmpty('pricebookName', pricebookName);

  const safeName = salesforceSOQL.escapeSoqlString(pricebookName);

  const soql = `
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
    WHERE Pricebook2.Name = '${safeName}'
      AND IsActive = true
      AND Product2.IsActive = true
    ORDER BY Product2.Family, Product2.ProductCode
    LIMIT 2000
  `.trim();

  const entries = await salesforceSOQL.executeQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql,
  });

  // Mapping dei dati
  return entries.map((e) => ({
    pricebookEntryId: e.Id,
    productId: e.Product2?.Id,
    name: e.Product2?.Name,
    productCode: e.Product2?.ProductCode,
    family: e.Product2?.Family,
    description: salesforceSOQL.htmlToText(e.Product2?.Description),
    unitPrice: e.UnitPrice,
    obiettivo: salesforceSOQL.htmlToText(e.Product2?.Obiettivo__c),
    servizio: salesforceSOQL.htmlToText(e.Product2?.Servizio__c),
    vantaggi: salesforceSOQL.htmlToText(e.Product2?.Vantaggi__c),
  }));
};