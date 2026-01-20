(function () {
  const statusEl = document.getElementById("servizi-status");
  const tableEl = document.getElementById("table-gridjs");

  if (!tableEl) {
    console.warn("[apps-service] #table-gridjs non trovato nella pagina");
    return;
  }

  let rowsByCode = new Map();
  let rowClickBound = false;

  function formatPrice(value) {
    if (value === null || typeof value === "undefined" || value === "") return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }

  function text(v) {
    return String(v ?? "");
  }

  function normalizeRecord(p) {
    // Backend già normalizza e ripulisce i campi HTML
    return {
      productCode: String(p.productCode ?? "").trim(),
      name: p.name ?? "",
      family: p.family ?? "",
      description: p.description ?? "",
      unitPrice: p.unitPrice ?? null,
      obiettivo: p.obiettivo ?? "",
      servizio: p.servizio ?? "",
      vantaggi: p.vantaggi ?? "",
    };
  }

  function setModalText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = text(value);
  }

  function openServiceModalByCode(productCode) {
    const key = String(productCode || "");
    const r = rowsByCode.get(key);
    if (!r) return;

    setModalText("m-codice", r.productCode);
    setModalText("m-nome", r.name);
    setModalText("m-famiglia", r.family);
    setModalText("m-descrizione", r.description);
    setModalText("m-prezzo", formatPrice(r.unitPrice));
    setModalText("m-obiettivo", r.obiettivo);
    setModalText("m-servizio", r.servizio);
    setModalText("m-vantaggi", r.vantaggi);

    const modalEl = document.getElementById("serviceDetailsModal");
    if (!modalEl) {
      console.warn("[apps-service] modal #serviceDetailsModal non trovato");
      return;
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function bindRowClickOnce() {
    if (rowClickBound) return;
    rowClickBound = true;

    tableEl.addEventListener("click", (e) => {
      const tr = e.target?.closest?.("tbody tr");
      if (!tr) return;

      const firstCell = tr.querySelector("td");
      const code = String(firstCell?.textContent ?? "").trim();
      if (!code) return;

      openServiceModalByCode(code);
    });
  }

  function applyRowHoverCursorOnce() {
    if (document.getElementById("apps-service-grid-style")) return;

    const style = document.createElement("style");
    style.id = "apps-service-grid-style";
    style.textContent = `
      #table-gridjs tbody tr { cursor: pointer; }
      #table-gridjs tbody tr:hover { background-color: rgba(0, 0, 0, 0.03); }
      #table-gridjs tbody tr td { user-select: none; }
      #table-gridjs tbody tr td:nth-child(4) { user-select: text; }
    `;
    document.head.appendChild(style);
  }

  function renderTable(rows) {
    tableEl.innerHTML = "";
    rowsByCode = new Map(rows.map((r) => [r.productCode, r]));

    const { Grid, html } = window.gridjs;

    new Grid({
      columns: [
        { name: "Codice" },
        {
          name: "Nome",
          formatter: (cell) => html(`<span class="fw-semibold">${escapeHtml(cell)}</span>`),
        },
        { name: "Famiglia" },
        { name: "Descrizione" },
        {
          name: "Prezzo",
          formatter: (cell) => html(`<div class="text-end">${formatPrice(cell)}</div>`),
        },
      ],
      data: rows.map((r) => [r.productCode, r.name, r.family, r.description, r.unitPrice]),
      search: true,
      sort: true,
      pagination: { limit: 25, summary: true },
      className: { table: "table table-hover align-middle mb-0" },
      language: {
        search: { placeholder: "Cerca..." },
        pagination: {
          previous: "Precedente",
          next: "Successivo",
          showing: "Mostro",
          results: () => "righe",
          to: "a",
          of: "di",
        },
      },
    }).render(tableEl);

    bindRowClickOnce();
    applyRowHoverCursorOnce();
  }

  async function init() {
    if (statusEl) statusEl.textContent = "Caricamento prodotti...";

    const res = await fetch("/api/servizi/products", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      if (statusEl) statusEl.textContent = "Errore nel caricamento prodotti.";
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    const records = Array.isArray(data.records) ? data.records : [];

    if (!records.length) {
      if (statusEl) statusEl.textContent = "Nessun prodotto trovato nel listino.";
      tableEl.innerHTML = "";
      return;
    }

    const rows = records.map(normalizeRecord);
    if (statusEl) statusEl.textContent = `Prodotti caricati: ${rows.length}`;
    renderTable(rows);
  }

  init().catch((err) => {
    if (statusEl) statusEl.textContent = "Errore imprevisto.";
    console.error(err);
  });
})();