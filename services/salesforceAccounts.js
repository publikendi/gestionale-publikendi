const salesforceSOQL = require("./salesforceSOQL");

exports.fetchAccount = async function fetchAccount({
  instanceUrl,
  accessToken,
  apiVersion,
}) {
  const soql = `
    SELECT Name, Phone, Industry, CreatedDate, 
      (SELECT Name, StageName, CloseDate FROM Opportunities)
    FROM Account
    ORDER BY CreatedDate DESC
    LIMIT 2000
  `.trim();

  const records = await salesforceSOQL.executeQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql,
  });

  return records.map((account) => ({
    name: account.Name ?? "",
    phone: account.Phone ?? "",
    industry: account.Industry ?? "",
    opportunities: (account.Opportunities?.records ?? []).map((opp) => ({
      name: opp.Name ?? "",
      stageName: opp.StageName ?? "",
      closeDate: opp.CloseDate ?? "",
      amount: opp.Amount ?? "",
    })),
  }));
};
