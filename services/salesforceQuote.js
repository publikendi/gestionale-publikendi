const salesforceSOQL = require("./salesforceSOQL");

exports.fetchQuote = async function fetchQuote({
  instanceUrl,
  accessToken,
  apiVersion,
}) {
  const soql = `
    SELECT Name, Opportunity.Name, ExpirationDate, TotalPrice, CreatedDate    
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
    name: quote.Name ?? "",
    nameOpportunity: quote.Opportunity?.Name ?? "",
    expirationDate : quote.ExpirationDate ?? "",
    totalPrice: quote.TotalPrice ?? "",
  }));
};
