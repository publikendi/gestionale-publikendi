const salesforceSOQL = require("./salesforceSOQL");

exports.fetchQuote = async function fetchQuote({
  instanceUrl,
  accessToken,
  apiVersion,
}) {
  const soql = `
    SELECT Id, Name, Opportunity.Name, ExpirationDate, TotalPrice, CreatedDate    
    FROM Quote
    ORDER BY CreatedDate DESC
    LIMIT 2000
  `.trim();

  const records = await salesforceSOQL.executeQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql,
  });

  return records.map((quote) => ({
    id: quote.Id,
    name: quote.Name ?? "",
    nameOpportunity: quote.Opportunity?.Name ?? "",
    expirationDate: quote.ExpirationDate ?? "",
    totalPrice: quote.TotalPrice ?? "",
  }));
};

exports.fetchQuoteDetails = async function fetchQuoteDetails({
  instanceUrl,
  accessToken,
  apiVersion,
  quoteId,
}) {

  if (!quoteId) throw new Error("ID Preventivo mancante");

  const escapedId = salesforceSOQL.escapeSoqlString(quoteId);

  const soql = `
    SELECT Id, QuoteNumber, Name, Opportunity.Name, ExpirationDate, TotalPrice, CreatedDate,
           BillingName, BillingStreet, BillingCity, BillingState, BillingPostalCode,
           (SELECT Product2.Name, Quantity, UnitPrice, TotalPrice FROM QuoteLineItems)
    FROM Quote
    WHERE Id = '${escapedId}'
  `.trim();

  const data = await salesforceSOQL.executeQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql,
  });

  const records = Array.isArray(data) ? data : data.records || [];

  if (!records.length) return null;

  const quote = records[0];

  return {
    id: quote.Id,
    quoteNumber: quote.QuoteNumber,
    invoiceId: quote.Name,
    name: quote.BillingName || quote.Opportunity?.Name || "Cliente",
    date: quote.CreatedDate,
    expirationDate: quote.ExpirationDate,
    billingAddress: {
      street: quote.BillingStreet || "",
      city: quote.BillingCity || "",
      state: quote.BillingState || "",
      zip: quote.BillingPostalCode || "",
    },
    totalPrice: quote.TotalPrice,
    items: (quote.QuoteLineItems?.records || []).map((item) => ({
      productName: item.Product2?.Name || "Prodotto",
      quantity: item.Quantity,
      unitPrice: item.UnitPrice,
      totalPrice: item.TotalPrice,
    })),
  };
};
