/* ============================================
   Aeris Motorsport — Championships Page
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchJSON('data/championships.json');
  const currentContainer = document.getElementById('current-championships');
  const trophyContainer = document.getElementById('trophy-cabinet');

  if (!data) {
    currentContainer.innerHTML =
      '<p class="text-secondary">Could not load championship data.</p>';
    trophyContainer.innerHTML =
      '<p class="text-secondary">Could not load championship data.</p>';
    return;
  }

  // Current standings
  if (data.current && data.current.length > 0) {
    const header = currentContainer.querySelector('.section-header');
    currentContainer.innerHTML = '';
    currentContainer.appendChild(header);

    data.current.forEach(champ => {
      const section = document.createElement('div');
      section.className = 'championship-card';
      section.innerHTML = `
        <div class="card">
          <h3>${escapeHTML(champ.season)}</h3>
          <p class="series-name">${escapeHTML(champ.series)}${champ.split ? ' — ' + escapeHTML(champ.split) : ''}</p>
          <div class="championship-standing">
            <span class="position-badge ${champ.position <= 3 ? 'top3' : 'top10'}">P${parseInt(champ.position, 10)}</span>
            <span class="championship-points">${parseInt(champ.points, 10)} points</span>
          </div>
        </div>
      `;
      currentContainer.appendChild(section);
    });
  } else {
    currentContainer.querySelector('p').textContent = 'No active championship campaigns.';
  }

  // Trophy cabinet
  if (data.won && data.won.length > 0) {
    const header = trophyContainer.querySelector('.section-header');
    trophyContainer.innerHTML = '';
    trophyContainer.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'trophy-grid';
    grid.innerHTML = data.won.map(t => `
      <div class="card trophy-card">
        <div class="trophy-icon">&#127942;</div>
        <h4>${escapeHTML(t.season)}</h4>
        <p class="trophy-series">${escapeHTML(t.series)}${t.split ? ' — ' + escapeHTML(t.split) : ''}</p>
        <p class="trophy-winner">P${parseInt(t.position, 10)}</p>
        <p class="trophy-points">${parseInt(t.finalPoints, 10)} points</p>
      </div>
    `).join('');
    trophyContainer.appendChild(grid);
  } else {
    trophyContainer.querySelector('p').textContent = 'No championships won yet — but we\'re working on it!';
  }
});
