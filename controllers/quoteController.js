const salesforceQuote = require("../services/salesforceQuote");

function getSalesforceSession(req) {
  const sf = req.session?.salesforce;
  if (!sf?.accessToken || !sf?.instanceUrl) return null;
  return sf;
}

/**
 * GET /api/quote/all
 */
exports.getQuote = async (req, res) => {
  try {
    const sf = getSalesforceSession(req);
    if (!sf)
      return res
        .status(401)
        .json({ error: "Not authenticated with Salesforce" });

    const apiVersion = process.env.SALESFORCE_API_VERSION || "59.0";

    const records = await salesforceQuote.fetchQuote({
      instanceUrl: sf.instanceUrl,
      accessToken: sf.accessToken,
      apiVersion,
    });

    return res.json({ records });
  } catch (err) {
    console.error('[quoteController.getQuote] failed', err.message);
    
    if (err.status === 401) {
      console.warn('[quoteController] Salesforce 401: Invalido la sessione utente.');
      return req.session.destroy(() => {
        return res.status(401).json({ error: 'Sessione Salesforce scaduta. Effettua nuovamente il login.' });
      });
    }
    // Altri tipi di errori
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ 
      error: 'Errore durante il recupero dei Preventivi' 
    });
  }
    
};