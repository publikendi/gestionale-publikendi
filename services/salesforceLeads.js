const salesforceSOQL = require('./salesforceSOQL');

exports.fetchLeads = async function fetchLeads({
  instanceUrl,
  accessToken,
  apiVersion,
}) {
  const soql = `
    SELECT Id, Name, Email, Company, Status, CreatedDate, Title, Phone
    FROM Lead
    WHERE IsDeleted = false
    ORDER BY CreatedDate DESC
    LIMIT 2000
  `.trim();

  const records = await salesforceSOQL.executeQuery({
    instanceUrl,
    accessToken,
    apiVersion,
    soql,
  });

  return records.map((lead) => ({
    id: lead.Id,
    name: lead.Name ?? '',
    email: lead.Email ?? '',
    company: lead.Company ?? '',
    status: lead.Status ?? '',
    title: lead.Title ?? '',
    phone: lead.Phone ?? '',
    createdDate: lead.CreatedDate,
  }));
};