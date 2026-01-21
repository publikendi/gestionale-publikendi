document.addEventListener('DOMContentLoaded', function() {
  const statusEl = document.getElementById('leads-status');
  const tableEl = document.getElementById('table-gridjs');

  // Funzione per caricare i lead
  async function loadLeads() {
    try {
      const response = await fetch('/api/leads/all');
      if (!response.ok) throw new Error('Errore nel caricamento');
      const data = await response.json();

      statusEl.textContent = `${data.records.length} lead trovati`;

      // Crea la tabella con Grid.js
      new gridjs.Grid({
        columns: [
          { name: 'Nome', data: row => row.name },
          { name: 'Email', data: row => row.email },
          { name: 'Azienda', data: row => row.company },
          { name: 'Stato', data: row => row.status },
          { name: 'Data Creazione', data: row => new Date(row.createdDate).toLocaleDateString() },
          {
            name: 'Azioni',
            formatter: (cell, row) => gridjs.html(`
              <button class="btn btn-sm btn-primary" onclick="showLeadDetails('${row.cells[0].data}', '${row.cells[1].data}', '${row.cells[2].data}', '${row.cells[3].data}', '${row.cells[4].data}')">Dettagli</button>
            `)
          }
        ],
        data: data.records,
        pagination: { limit: 10 },
        search: true,
      }).render(tableEl);
    } catch (error) {
      statusEl.textContent = 'Errore nel caricamento';
      console.error(error);
    }
  }

  // Funzione per mostrare i dettagli nel modal
  window.showLeadDetails = function(name, email, company, status, createdDate) {
    document.getElementById('m-nome').textContent = name;
    document.getElementById('m-email').textContent = email;
    document.getElementById('m-azienda').textContent = company;
    document.getElementById('m-stato').textContent = status;
    document.getElementById('m-data-creazione').textContent = new Date(createdDate).toLocaleString();
    
    new bootstrap.Modal(document.getElementById('leadDetailsModal')).show();
  };

  loadLeads();
});