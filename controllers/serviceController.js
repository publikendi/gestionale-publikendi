const salesforceServices = require('../services/salesforceServices');

function getSalesforceSession(req) {
  const sf = req.session?.salesforce;
  if (!sf?.accessToken || !sf?.instanceUrl) return null;
  return sf;
}

/**
 * GET /api/servizi/products
 */
exports.getProducts = async (req, res) => {
  try {
    const sf = getSalesforceSession(req);
    if (!sf) return res.status(401).json({ error: 'Not authenticated with Salesforce' });

    const apiVersion = process.env.SALESFORCE_API_VERSION || '59.0';
    const pricebookName = process.env.SALESFORCE_PRICEBOOK_NAME || 'Listino Prezzi';

    const records = await salesforceServices.fetchProductsForPricebook({
      instanceUrl: sf.instanceUrl,
      accessToken: sf.accessToken,
      apiVersion,
      pricebookName,
    });

    return res.json({ records });
  } catch (err) {
    console.error('[salesforcesService.getProducts] failed', {
      message: err.message,
      status: err.status,
      details: err.details,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};