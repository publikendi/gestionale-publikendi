const salesforceSOQL = require('./salesforceSOQL');

exports.fetchLeads = async function fetchLeads({
  instanceUrl,
  accessToken,
  apiVersion,
}) {
  const soql = `
    SELECT FirstName, LastName, Company, Phone, Email, Status, CreatedDate 
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
    firstname: lead.FirstName ?? '',
    lastname: lead.LastName ?? '',
    company: lead.Company ?? '',
    phone: lead.Phone ?? '',
    email: lead.Email ?? '',
    status: lead.Status ?? '',    
    createdDate: lead.CreatedDate,
  }));
};