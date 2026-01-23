const salesforceSOQL = require("./salesforceSOQL");

exports.fetchOpportunity = async function fetchOpportunity({
  instanceUrl,
  accessToken,
  apiVersion,
}) {
  const soql = `
    SELECT Name, AccountId, Account.Name, StageName, CloseDate, CreatedDate    
    FROM Opportunity
    ORDER BY CreatedDate DESC
    LIMIT 2000
  `.trim();

  const records = await salesforceSOQL.executeQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql,
  });

  return records.map((opportunity) => ({
    name: opportunity.Name ?? "",
    nameAccount: opportunity.Account?.Name ?? "",
    stageName : opportunity.StageName ?? "",
    closeDate: opportunity.CloseDate ?? "",
  }));
};
