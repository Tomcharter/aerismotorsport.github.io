/* ============================================
   Aeris Motorsport — Championships Page
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchJSON('data/championships.json');

  if (!data) {
    document.getElementById('current-championships').innerHTML +=
      '<p class="text-secondary">Could not load championship data.</p>';
    return;
  }

  // Current standings
  const currentContainer = document.getElementById('current-championships');
  if (data.current && data.current.length > 0) {
    const header = currentContainer.querySelector('.section-header');
    currentContainer.innerHTML = '';
    currentContainer.appendChild(header);

    data.current.forEach(champ => {
      const section = document.createElement('div');
      section.className = 'championship-card';
      section.innerHTML = `
        <div class="card">
          <h3>${champ.season}</h3>
          <p class="series-name">${champ.series}${champ.split ? ' — ' + champ.split : ''}</p>
          <div class="championship-standing">
            <span class="position-badge ${champ.position <= 3 ? 'top3' : 'top10'}">P${champ.position}</span>
            <span class="championship-points">${champ.points} points</span>
          </div>
        </div>
      `;
      currentContainer.appendChild(section);
    });
  } else {
    currentContainer.querySelector('p').textContent = 'No active championship campaigns.';
  }

  // Trophy cabinet
  const trophyContainer = document.getElementById('trophy-cabinet');
  if (data.won && data.won.length > 0) {
    const header = trophyContainer.querySelector('.section-header');
    trophyContainer.innerHTML = '';
    trophyContainer.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'trophy-grid';
    grid.innerHTML = data.won.map(t => `
      <div class="card trophy-card">
        <div class="trophy-icon">&#127942;</div>
        <h4>${t.season}</h4>
        <p class="trophy-series">${t.series}${t.split ? ' — ' + t.split : ''}</p>
        <p class="trophy-winner">P${t.position}</p>
        <p class="trophy-points">${t.finalPoints} points</p>
      </div>
    `).join('');
    trophyContainer.appendChild(grid);
  } else {
    trophyContainer.querySelector('p').textContent = 'No championships won yet — but we\'re working on it!';
  }
});
