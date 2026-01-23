const salesforceSOQL = require("./salesforceSOQL");

exports.fetchAccount = async function fetchAccount({
  instanceUrl,
  accessToken,
  apiVersion,
}) {
  const soql = `
    SELECT Name, Phone, Industry, CreatedDate    
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
  }));
};
