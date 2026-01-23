(function () {
  const statusEl = document.getElementById("servizi-status");
  const tableWrapper = document.getElementById("table-gridjs"); 

  let rowsByCode = new Map();

  if (!tableWrapper) return;

  // 1. CONFIGURAZIONE MODAL
  const modalEl = document.getElementById("serviceDetailsModal");
  let bsModal = null;
  if (modalEl && window.bootstrap) {
    bsModal = new window.bootstrap.Modal(modalEl);
  }

  function formatPrice(value) {
    if (value === null || value === undefined) return "";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  // 2. GESTIONE CLICK 
  tableWrapper.addEventListener('click', function(e) {
    const tr = e.target.closest('tr');
    if (!tr) return; 

    const firstCell = tr.querySelector('td'); 
    if(!firstCell) return;
    
    const code = firstCell.textContent.trim();
    const record = rowsByCode.get(code);

    if (record) {
      openModal(record);
    }
  });

  function openModal(p) {
    if (!bsModal) return;
    document.getElementById("m-codice").textContent = p.productCode || "-";
    document.getElementById("m-nome").textContent = p.name || "-";
    document.getElementById("m-famiglia").textContent = p.family || "-";
    document.getElementById("m-descrizione").textContent = p.description || "-";
    document.getElementById("m-prezzo").textContent = formatPrice(p.unitPrice);
    document.getElementById("m-obiettivo").textContent = p.obiettivo || "-";
    document.getElementById("m-servizio").textContent = p.servizio || "-";
    document.getElementById("m-vantaggi").textContent = p.vantaggi || "-";
    bsModal.show();
  }

  // 3. INIT
  async function init() {
    if (statusEl) statusEl.textContent = "Caricamento prodotti...";

    try {
      const res = await fetch("/api/servizi/products");
      if (!res.ok) throw new Error("Errore API");
      
      const data = await res.json();
      const records = data.records || [];

      if (!records.length) {
        if (statusEl) statusEl.textContent = "Nessun prodotto trovato.";
        return;
      }

      // Popola la mappa per il click
      rowsByCode.clear();
      records.forEach(r => {
        if(r.productCode) rowsByCode.set(r.productCode, r);
      });

      if (statusEl) statusEl.textContent = ""; 

      // Configura Grid.js
      new gridjs.Grid({
        columns: [
          { name: "Codice", width: "100px" }, 
          { name: "Nome" },
          { name: "Famiglia" },
          { 
            name: "Prezzo", 
            formatter: (cell) => formatPrice(cell) 
          },
        ],
        data: records.map(p => [
          p.productCode,
          p.name,
          p.family,
          p.unitPrice
        ]),
        search: true,
        sort: true,
        pagination: { limit: 20 },
        className: { 
            table: "table table-hover align-middle mb-0",
            tr: "cursor-pointer" 
        },
        language: {
          search: { placeholder: "Cerca..." },
          pagination: { previous: "Prec", next: "Succ", showing: "Mostro", results: () => "risultati" }
        }
      }).render(tableWrapper);

      // Aggiungiamo stile CSS dinamicamente per il cursore
      const style = document.createElement('style');
      style.innerHTML = `
        .cursor-pointer:hover { cursor: pointer; background-color: #f8f9fa; }
      `;
      document.head.appendChild(style);

    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "Errore caricamento dati.";
    }
  }

  init();
})();