/* ============================================
   Aeris Motorsport — Results Page
   ============================================ */

let allResults = [];

function populateFilters(results) {
  const seasonSelect = document.getElementById('filter-season');
  const seriesSelect = document.getElementById('filter-series');

  const seasons = [...new Set(results.map(r => r.season))].sort().reverse();
  const seriesList = [...new Set(results.map(r => r.series))].sort();

  seasons.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    seasonSelect.appendChild(opt);
  });

  seriesList.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    seriesSelect.appendChild(opt);
  });

  seasonSelect.addEventListener('change', renderResults);
  seriesSelect.addEventListener('change', renderResults);
}

function getFilteredResults() {
  const season = document.getElementById('filter-season').value;
  const series = document.getElementById('filter-series').value;

  return allResults.filter(r => {
    if (season !== 'all' && r.season !== season) return false;
    if (series !== 'all' && r.series !== series) return false;
    return true;
  });
}

function renderResults() {
  const container = document.getElementById('results-list');
  const filtered = getFilteredResults();

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results"><p>No results match your filters.</p></div>';
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map(r => {
    const dateStr = new Date(r.date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    return `
      <div class="card result-card">
        <h3>${r.track}</h3>
        <div class="result-meta">
          <span>${dateStr}</span>
          <span>${r.season}</span>
          <span>${r.series}</span>
          <span>${r.car}</span>
        </div>
        <div class="result-positions">
          <div class="result-team-row">
            <div class="result-team-position">
              <span class="text-secondary" style="font-size:0.85rem;">P${r.startPos} &rarr;</span>
              <span class="position-badge ${r.finishPos <= 3 ? 'top3' : r.finishPos <= 10 ? 'top10' : ''}">P${r.finishPos}</span>
            </div>
            <div class="result-team-drivers">${r.drivers.join(', ')}</div>
          </div>
        </div>
        ${r.notes ? `<p class="result-notes">"${r.notes}"</p>` : ''}
        <div class="result-images">
          <div class="result-image-placeholder">Race Screenshot</div>
          <div class="result-image-placeholder">Car Photo</div>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchJSON('data/results.json');
  if (!data) {
    document.getElementById('results-list').innerHTML =
      '<div class="no-results"><p>Could not load results data.</p></div>';
    return;
  }

  allResults = data;
  populateFilters(allResults);
  renderResults();
});
