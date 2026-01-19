const salesforceService = require('../services/salesforceService');

/**
 * GET /api/servizi/products
 */
exports.getProducts = async (req, res) => {
  try {
    const sf = req.session && req.session.salesforce;

    if (!sf || !sf.accessToken || !sf.instanceUrl) {
      return res.status(401).json({ error: 'Not authenticated with Salesforce' });
    }

    const pricebookName = 'Listino Prezzi 2025';

    const records = await salesforceService.fetchProductsForPricebook({
      instanceUrl: sf.instanceUrl,
      accessToken: sf.accessToken,
      apiVersion: process.env.SALESFORCE_API_VERSION || '59.0',
      pricebookName,
    });

    return res.json({ records });
  } catch (err) {
    // 6) Logging e risposta errore
    console.error('[serviceController.getProducts] failed:', err.message, err.details || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};