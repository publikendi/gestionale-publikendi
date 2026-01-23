(function () {
  const statusEl = document.getElementById('accounts-status');
  const tableWrapper = document.getElementById('table-gridjs');
  
  let rowsById = new Map();

  if (!tableWrapper) return;

  // 1. CONFIGURAZIONE MODAL
  const modalEl = document.getElementById('accountDetailsModal');
  let bsModal = null;
  if (modalEl && window.bootstrap) {
    bsModal = new window.bootstrap.Modal(modalEl);
  }

  // 2. GESTIONE CLICK 
  tableWrapper.addEventListener('click', function(e) {
    const tr = e.target.closest('tr');
    if (!tr) return;

    const cells = tr.querySelectorAll('td');
    
    if (cells.length < 2) return; 

    const id = cells[0].textContent.trim();
    const record = rowsById.get(name);

    if (record) {
      openModal(record);
    }
  });

  function openModal(data) {
    if (!bsModal) return;

    document.getElementById('m-name').textContent = data.name || "-";
    document.getElementById('m-telefono').textContent = data.phone || "-"; 
    document.getElementById('m-industry').textContent = data.industry || "-"; 
    bsModal.show();
  }

  // 3. INIT & FETCH DATI
  async function init() {
    if (statusEl) statusEl.textContent = "Caricamento Account...";

    try {
      const response = await fetch('/api/accounts/all');
      if (!response.ok) throw new Error('Errore nel caricamento');
      
      const data = await response.json();
      const records = data.records || [];

      if (!records.length) {
        if (statusEl) statusEl.textContent = "Nessun Account trovato.";
        return;
      }

      rowsById.clear();
      records.forEach(r => {
        if(r.name) rowsById.set(r.name, r);
      });

      if (statusEl) statusEl.textContent = `${records.length} account trovati`;

      new gridjs.Grid({
        columns: [
          { name: 'Nome Account' },
          { name: 'Telefono', width: '100px' },
          { name: 'Settore', width: '200px' }
        ],
        data: records.map(row => [
          row.name,
          row.phone,
          row.industry
        ]),
        pagination: { limit: 10 },
        search: true,
        sort: true,
        className: { 
            table: "table table-hover align-middle mb-0",
            tr: "cursor-pointer" 
        },
        language: {
          search: { placeholder: "Cerca Account..." },
          pagination: { previous: "Prec", next: "Succ", showing: "Mostro", results: () => "risultati" }
        }
      }).render(tableWrapper);

      const style = document.createElement('style');
      style.innerHTML = `
        .cursor-pointer:hover { cursor: pointer; background-color: #f8f9fa; transition: background-color 0.2s; }
      `;
      document.head.appendChild(style);

    } catch (error) {
      if (statusEl) statusEl.textContent = 'Errore nel caricamento';
      console.error(error);
    }
  }

  init();
})();