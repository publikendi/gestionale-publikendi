const salesforceLeads = require('../services/salesforceLeads');

function getSalesforceSession(req) {
  const sf = req.session?.salesforce;
  if (!sf?.accessToken || !sf?.instanceUrl) return null;
  return sf;
}

/**
 * GET /api/leads/all
 */
exports.getLeads = async (req, res) => {
  try {
    const sf = getSalesforceSession(req);
    if (!sf) return res.status(401).json({ error: 'Not authenticated with Salesforce' });

    const apiVersion = process.env.SALESFORCE_API_VERSION || '59.0';

    const records = await salesforceLeads.fetchLeads({
      instanceUrl: sf.instanceUrl,
      accessToken: sf.accessToken,
      apiVersion,
    });

    return res.json({ records });
  } catch (err) {
    console.error('[leadController.getLeads] failed', err.message);
    
    const statusCode = err.status === 401 ? 401 : 500;
    return res.status(statusCode).json({ 
      error: statusCode === 401 ? 'Sessione Salesforce scaduta' : 'Errore interno del server' 
    });
  }
}