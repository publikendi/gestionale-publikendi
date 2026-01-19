(function () {
  const statusEl = document.getElementById('servizi-status');
  const tbodyEl = document.getElementById('servizi-tbody');

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function rowHtml(p) {
  // Supporto sia formato "flattened" sia formato "raw Salesforce"
  const name = p.name ?? p.Product2?.Name ?? '';
  const productCode = p.productCode ?? p.Product2?.ProductCode ?? '';
  const family = p.family ?? p.Product2?.Family ?? '';
  const isActive = (p.isActive ?? p.Product2?.IsActive) ? true : false;

  const createdRaw = p.createdDate ?? p.Product2?.CreatedDate ?? null;
  const created = createdRaw ? new Date(createdRaw).toLocaleString() : '';

  const unitPriceRaw = p.unitPrice ?? p.UnitPrice ?? null;
  const price =
    unitPriceRaw === null || typeof unitPriceRaw === 'undefined'
      ? ''
      : Number(unitPriceRaw).toFixed(2);

  return `
    <tr>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(productCode)}</td>
      <td>${escapeHtml(family)}</td>
      <td class="text-end">${escapeHtml(price)}</td>
      <td>${isActive ? 'Sì' : 'No'}</td>
      <td>${escapeHtml(created)}</td>
    </tr>
  `;
}

  async function init() {
    statusEl.textContent = 'Caricamento prodotti...';

    const res = await fetch('/api/servizi/products', {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      statusEl.textContent = 'Errore nel caricamento prodotti.';
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    const records = data.records || [];

    if (!records.length) {
      statusEl.textContent = 'Nessun prodotto trovato nel listino.';
      tbodyEl.innerHTML = '';
      return;
    }

    statusEl.textContent = `Prodotti caricati: ${records.length}`;
    tbodyEl.innerHTML = records.map(rowHtml).join('');
  }

  init().catch((err) => {
    statusEl.textContent = 'Errore imprevisto.';
    console.error(err);
  });
})();