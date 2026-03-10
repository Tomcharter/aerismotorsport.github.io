/* ============================================
   Admin Panel — Password Gate
   ============================================ */
const PASS_HASH = 'd0f5fe6b15cee2b54a6a8acb222a35cea48bb69171af2ff42d4049bd067fc1f8';

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function attemptLogin() {
  const input = document.getElementById('login-password').value;
  const hash = await sha256(input);
  if (hash === PASS_HASH) {
    sessionStorage.setItem('admin-auth', '1');
    unlockAdmin();
  } else {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
  }
}

async function unlockAdmin() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('admin-main').style.display = '';
  document.querySelector('.site-footer').style.display = '';
  await loadAdminData();
}

// Allow Enter key to submit
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') attemptLogin();
});

// Check session on load
if (sessionStorage.getItem('admin-auth') === '1') {
  unlockAdmin();
}

/* ============================================
   Admin Panel — Data Management
   ============================================ */

// --- State ---
let driversData = [];
let resultsData = [];
let championshipsData = { current: [], won: [] };
let galleryData = [];
const SITE_DEFAULTS = {
  heroImages: [{url:'',alt:''},{url:'',alt:''},{url:'',alt:''}],
  aboutParagraphs: [
    "Aeris Motorsport are a close-knit group of friends competing together in endurance events in iRacing. In 2024 we joined forces and have since been achieving results in championships primarily in GT3 machinery. The series we compete in include the Nurburgring Endurance Championship, Global Endurance Tour, GT Endurance Championship and special events.",
    "Spending time competing on iRacing is a big hobby of ours, and the key to our team is spending multiple weeks planning, lapping, strategizing, comparing telemetry, all the way up to the race weekend. We are not a professional team in the financial sense, and we\u2019re okay keeping it that way, however we find the most enjoyment from this sim title by maximising our chances of being successful on the virtual track. We are proud of the results and championships we\u2019ve earned so far. Check our \"results\" tab for more information."
  ],
  aboutMission: "Our mission is to continue to build our successful team together as a unit. We lose and win these races and championships together."
};
let siteData = JSON.parse(JSON.stringify(SITE_DEFAULTS));
let isDirty = false;

// --- Tab Switching ---
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// --- Unsaved changes warning ---
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// --- Helpers ---
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function saveAll() {
  localStorage.setItem('admin-drivers', JSON.stringify(driversData));
  localStorage.setItem('admin-results', JSON.stringify(resultsData));
  localStorage.setItem('admin-championships', JSON.stringify(championshipsData));
  localStorage.setItem('admin-gallery', JSON.stringify(galleryData));
  localStorage.setItem('admin-site', JSON.stringify(siteData));
  isDirty = true;
}

// =============================================
//  DRIVERS
// =============================================

function renderDrivers() {
  const list = document.getElementById('drivers-list');
  if (driversData.length === 0) {
    list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">No drivers yet. Click "+ Add Driver" to get started.</p>';
    return;
  }
  list.innerHTML = driversData.map((d, i) => `
    <div class="admin-entry card">
      <div class="admin-entry-header">
        <div>
          <strong>${escapeHTML(d.name)}</strong>
          <span class="text-secondary"> — ${escapeHTML(d.role)}</span>
        </div>
        <div class="admin-entry-actions">
          <button class="btn-sm btn-edit" onclick="moveDriver(${i},-1)" ${i === 0 ? 'disabled' : ''} title="Move up">&#9650;</button>
          <button class="btn-sm btn-edit" onclick="moveDriver(${i},1)" ${i === driversData.length - 1 ? 'disabled' : ''} title="Move down">&#9660;</button>
          <button class="btn-sm btn-edit" onclick="editDriver(${i})">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteDriver(${i})">Delete</button>
        </div>
      </div>
      <div class="admin-entry-details">
        <span>iRating: ${escapeHTML(d.irating || '—')}</span>
        <span>Car: ${escapeHTML(d.favouriteCar || '—')}</span>
        <span>Track: ${escapeHTML(d.favouriteTrack || '—')}</span>
      </div>
    </div>
  `).join('');
}

function driverForm(driver, onSave, onCancel) {
  const d = driver || { name: '', role: '', irating: '', favouriteCar: '', favouriteTrack: '', bio: '', photo: '', initials: '' };
  return `
    <div class="admin-form card">
      <h4>${driver ? 'Edit Driver' : 'Add New Driver'}</h4>
      <div class="form-grid">
        <div class="form-group">
          <label>Name *</label>
          <input type="text" id="df-name" value="${escapeHTML(d.name)}" required>
        </div>
        <div class="form-group">
          <label>Role *</label>
          <input type="text" id="df-role" value="${escapeHTML(d.role)}" placeholder="e.g. Driver, Team Owner & Driver">
        </div>
        <div class="form-group">
          <label>iRating</label>
          <input type="text" id="df-iracing" value="${escapeHTML(d.irating || '')}">
        </div>
        <div class="form-group">
          <label>Favourite Car</label>
          <input type="text" id="df-car" value="${escapeHTML(d.favouriteCar || '')}">
        </div>
        <div class="form-group">
          <label>Favourite Track</label>
          <input type="text" id="df-track" value="${escapeHTML(d.favouriteTrack || '')}">
        </div>
        <div class="form-group form-full">
          <label>Photo URL</label>
          <div style="display:flex;gap:0.5rem;">
            <input type="text" id="df-photo" value="${escapeHTML(d.photo || '')}" placeholder="URL or upload" style="flex:1;">
            <button class="btn-sm btn-edit" type="button" onclick="pickImage('df-photo')">Upload</button>
          </div>
        </div>
        <div class="form-group">
          <label>Initials (no photo)</label>
          <input type="text" id="df-initials" value="${escapeHTML(d.initials || '')}" placeholder="Auto from name" maxlength="4">
        </div>
        <div class="form-group form-full">
          <label>Bio</label>
          <textarea id="df-bio" rows="3">${escapeHTML(d.bio || '')}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="${onSave}">Save</button>
        <button class="btn btn-outline" onclick="${onCancel}">Cancel</button>
      </div>
    </div>
  `;
}

function addDriver() {
  const area = document.getElementById('drivers-form-area');
  area.innerHTML = driverForm(null, 'saveNewDriver()', 'cancelDriverForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function cancelDriverForm() {
  document.getElementById('drivers-form-area').innerHTML = '';
}

function saveNewDriver() {
  const name = document.getElementById('df-name').value.trim();
  if (!name) { alert('Name is required.'); return; }
  const id = 'driver-' + slugify(name);
  driversData.push({
    id,
    name,
    role: document.getElementById('df-role').value.trim(),
    irating: document.getElementById('df-iracing').value.trim(),
    bio: document.getElementById('df-bio').value.trim(),
    favouriteCar: document.getElementById('df-car').value.trim(),
    favouriteTrack: document.getElementById('df-track').value.trim(),
    photo: document.getElementById('df-photo').value.trim(),
    initials: document.getElementById('df-initials').value.trim()
  });
  cancelDriverForm();
  renderDrivers();
  saveAll();
}

function editDriver(index) {
  const d = driversData[index];
  const area = document.getElementById('drivers-form-area');
  area.innerHTML = driverForm(d, `saveEditDriver(${index})`, 'cancelDriverForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function saveEditDriver(index) {
  const name = document.getElementById('df-name').value.trim();
  if (!name) { alert('Name is required.'); return; }
  driversData[index] = {
    id: driversData[index].id,
    name,
    role: document.getElementById('df-role').value.trim(),
    irating: document.getElementById('df-iracing').value.trim(),
    bio: document.getElementById('df-bio').value.trim(),
    favouriteCar: document.getElementById('df-car').value.trim(),
    favouriteTrack: document.getElementById('df-track').value.trim(),
    photo: document.getElementById('df-photo').value.trim(),
    initials: document.getElementById('df-initials').value.trim()
  };
  cancelDriverForm();
  renderDrivers();
  saveAll();
}

function deleteDriver(index) {
  if (!confirm(`Delete "${driversData[index].name}"?`)) return;
  driversData.splice(index, 1);
  renderDrivers();
  saveAll();
}

function moveDriver(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= driversData.length) return;
  const temp = driversData[index];
  driversData[index] = driversData[newIndex];
  driversData[newIndex] = temp;
  renderDrivers();
  saveAll();
}

// =============================================
//  RESULTS
// =============================================

function renderResults() {
  const list = document.getElementById('results-list');
  if (resultsData.length === 0) {
    list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">No results yet. Click "+ Add Result" to get started.</p>';
    return;
  }
  // Sort by date descending for display
  const sorted = resultsData.map((r, i) => ({ ...r, _idx: i })).sort((a, b) => new Date(b.date) - new Date(a.date));
  list.innerHTML = sorted.map(r => {
    const dateStr = new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <div class="admin-entry card">
        <div class="admin-entry-header">
          <div>
            <strong>${escapeHTML(r.track)}</strong>
            <span class="text-secondary"> — ${dateStr}</span>
          </div>
          <div class="admin-entry-actions">
            <button class="btn-sm btn-edit" onclick="editResult(${r._idx})">Edit</button>
            <button class="btn-sm btn-delete" onclick="deleteResult(${r._idx})">Delete</button>
          </div>
        </div>
        <div class="admin-entry-details">
          <span>${escapeHTML(r.season)}</span>
          <span>${escapeHTML(r.series)}</span>
          <span>${escapeHTML(r.car)}</span>
          <span>P${r.startPos} &rarr; P${r.finishPos}</span>
          <span>${r.drivers.map(escapeHTML).join(', ')}</span>
        </div>
      </div>
    `;
  }).join('');
}

function resultForm(result, onSave, onCancel) {
  const r = result || { date: '', season: '', series: '', track: '', car: '', startPos: '', finishPos: '', drivers: [], notes: '', images: [] };
  const driversStr = Array.isArray(r.drivers) ? r.drivers.join(', ') : '';
  const images = Array.isArray(r.images) ? r.images : [];
  const imageRowsHTML = images.map((url, i) => `
    <div class="image-row">
      <input type="text" class="rf-image-url" value="${escapeHTML(url)}" placeholder="URL or upload">
      <button class="btn-sm btn-edit" type="button" onclick="pickImageForInput(this)">Upload</button>
      <button class="btn-sm btn-delete" type="button" onclick="this.parentElement.remove()">Remove</button>
    </div>
  `).join('');
  return `
    <div class="admin-form card">
      <h4>${result ? 'Edit Result' : 'Add New Result'}</h4>
      <div class="form-grid">
        <div class="form-group">
          <label>Date *</label>
          <input type="date" id="rf-date" value="${r.date}">
        </div>
        <div class="form-group">
          <label>Season *</label>
          <input type="text" id="rf-season" value="${escapeHTML(r.season)}" placeholder="e.g. 2025 S1">
        </div>
        <div class="form-group">
          <label>Series *</label>
          <input type="text" id="rf-series" value="${escapeHTML(r.series)}" placeholder="e.g. GT3 Sprint Series">
        </div>
        <div class="form-group">
          <label>Track *</label>
          <input type="text" id="rf-track" value="${escapeHTML(r.track)}">
        </div>
        <div class="form-group">
          <label>Car *</label>
          <input type="text" id="rf-car" value="${escapeHTML(r.car)}">
        </div>
        <div class="form-group">
          <label>Start Position</label>
          <input type="number" id="rf-startpos" min="1" value="${r.startPos}">
        </div>
        <div class="form-group">
          <label>Finish Position</label>
          <input type="number" id="rf-finishpos" min="1" value="${r.finishPos}">
        </div>
        <div class="form-group">
          <label>Drivers</label>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <input type="text" id="rf-drivers" value="${escapeHTML(driversStr)}" placeholder="Select or type driver names" style="flex:1;" readonly>
            <button class="btn-sm btn-edit" type="button" onclick="openDriverPicker()">Select</button>
          </div>
        </div>
        <div class="form-group form-full">
          <label>Notes</label>
          <textarea id="rf-notes" rows="2">${escapeHTML(r.notes || '')}</textarea>
        </div>
        <div class="form-group form-full">
          <label>Images</label>
          <div id="rf-images-list">${imageRowsHTML}</div>
          <button class="btn-sm btn-edit" type="button" onclick="addResultImageRow()" style="margin-top:0.5rem;">+ Add Image</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="${onSave}">Save</button>
        <button class="btn btn-outline" onclick="${onCancel}">Cancel</button>
      </div>
    </div>
  `;
}

function addResultImageRow() {
  const list = document.getElementById('rf-images-list');
  const row = document.createElement('div');
  row.className = 'image-row';
  row.innerHTML = `
    <input type="text" class="rf-image-url" placeholder="URL or upload">
    <button class="btn-sm btn-edit" type="button" onclick="pickImageForInput(this)">Upload</button>
    <button class="btn-sm btn-delete" type="button" onclick="this.parentElement.remove()">Remove</button>
  `;
  list.appendChild(row);
}

function openDriverPicker() {
  const currentDrivers = document.getElementById('rf-drivers').value
    .split(',').map(s => s.trim()).filter(Boolean);

  // Build modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'driver-picker-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:4000;display:flex;align-items:center;justify-content:center;padding:1.5rem;';

  const driverList = driversData.length > 0
    ? driversData.map(d => {
        const checked = currentDrivers.includes(d.name) ? 'checked' : '';
        return `
          <label style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.75rem;border-radius:var(--radius-sm);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='var(--color-surface-light)'" onmouseout="this.style.background='transparent'">
            <input type="checkbox" class="dp-checkbox" value="${escapeHTML(d.name)}" ${checked} style="width:18px;height:18px;accent-color:var(--color-accent);">
            <span>${escapeHTML(d.name)}</span>
            <span class="text-secondary" style="font-size:0.8rem;margin-left:auto;">${escapeHTML(d.role || '')}</span>
          </label>`;
      }).join('')
    : '<p class="text-secondary" style="padding:1rem;">No drivers added yet. Add drivers in the Drivers tab first.</p>';

  overlay.innerHTML = `
    <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:1.5rem;width:100%;max-width:420px;max-height:80vh;display:flex;flex-direction:column;">
      <h4 style="margin-bottom:1rem;color:var(--color-accent);">Select Drivers</h4>
      <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:1rem;">
        ${driverList}
      </div>
      <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
        <button class="btn btn-outline" onclick="closeDriverPicker()">Cancel</button>
        <button class="btn btn-primary" onclick="confirmDriverPicker()">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDriverPicker();
  });
}

function closeDriverPicker() {
  const overlay = document.getElementById('driver-picker-overlay');
  if (overlay) overlay.remove();
}

function confirmDriverPicker() {
  const checkboxes = document.querySelectorAll('#driver-picker-overlay .dp-checkbox:checked');
  const selected = Array.from(checkboxes).map(cb => cb.value);
  document.getElementById('rf-drivers').value = selected.join(', ');
  closeDriverPicker();
}

function addResult() {
  const area = document.getElementById('results-form-area');
  area.innerHTML = resultForm(null, 'saveNewResult()', 'cancelResultForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function cancelResultForm() {
  document.getElementById('results-form-area').innerHTML = '';
}

function nextResultId() {
  let max = 0;
  resultsData.forEach(r => {
    const n = parseInt(r.id.replace('race-', ''), 10);
    if (n > max) max = n;
  });
  return 'race-' + (max + 1);
}

function collectResultFields() {
  const date = document.getElementById('rf-date').value;
  const track = document.getElementById('rf-track').value.trim();
  if (!date || !track) { alert('Date and Track are required.'); return null; }
  const imageInputs = document.querySelectorAll('#rf-images-list .rf-image-url');
  const images = Array.from(imageInputs).map(input => input.value.trim()).filter(Boolean);
  return {
    date,
    season: document.getElementById('rf-season').value.trim(),
    series: document.getElementById('rf-series').value.trim(),
    track,
    car: document.getElementById('rf-car').value.trim(),
    startPos: parseInt(document.getElementById('rf-startpos').value, 10) || 0,
    finishPos: parseInt(document.getElementById('rf-finishpos').value, 10) || 0,
    drivers: document.getElementById('rf-drivers').value.split(',').map(s => s.trim()).filter(Boolean),
    notes: document.getElementById('rf-notes').value.trim(),
    images
  };
}

function saveNewResult() {
  const fields = collectResultFields();
  if (!fields) return;
  fields.id = nextResultId();
  resultsData.push(fields);
  cancelResultForm();
  renderResults();
  saveAll();
}

function editResult(index) {
  const r = resultsData[index];
  const area = document.getElementById('results-form-area');
  area.innerHTML = resultForm(r, `saveEditResult(${index})`, 'cancelResultForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function saveEditResult(index) {
  const fields = collectResultFields();
  if (!fields) return;
  fields.id = resultsData[index].id;
  resultsData[index] = fields;
  cancelResultForm();
  renderResults();
  saveAll();
}

function deleteResult(index) {
  const r = resultsData[index];
  if (!confirm(`Delete result at "${r.track}" on ${r.date}?`)) return;
  resultsData.splice(index, 1);
  renderResults();
  saveAll();
}

// =============================================
//  CHAMPIONSHIPS — Current Standings
// =============================================

function renderCurrentChampionships() {
  const list = document.getElementById('current-list');
  const current = championshipsData.current;
  if (current.length === 0) {
    list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">No current championships.</p>';
    return;
  }
  list.innerHTML = current.map((c, i) => `
    <div class="admin-entry card">
      <div class="admin-entry-header">
        <div>
          <strong>${escapeHTML(c.season)}</strong>
          <span class="text-secondary"> — ${escapeHTML(c.series)}</span>
        </div>
        <div class="admin-entry-actions">
          <button class="btn-sm btn-edit" onclick="editCurrentChampionship(${i})">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteCurrentChampionship(${i})">Delete</button>
        </div>
      </div>
      <div class="admin-entry-details">
        <span>Team Position: <strong class="text-accent">P${c.position}</strong></span>
        <span>Points: ${c.points}</span>
        ${c.split ? `<span>Split: ${escapeHTML(c.split)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function currentChampionshipForm(champ, onSave, onCancel) {
  const c = champ || { season: '', series: '', position: '', points: '', split: '' };
  return `
    <div class="admin-form card">
      <h4>${champ ? 'Edit Championship' : 'Add Current Championship'}</h4>
      <div class="form-grid">
        <div class="form-group">
          <label>Season *</label>
          <input type="text" id="cf-season" value="${escapeHTML(c.season)}" placeholder="e.g. 2025 S1">
        </div>
        <div class="form-group">
          <label>Series *</label>
          <input type="text" id="cf-series" value="${escapeHTML(c.series)}">
        </div>
        <div class="form-group">
          <label>Team Position *</label>
          <input type="number" id="cf-position" min="1" value="${c.position}">
        </div>
        <div class="form-group">
          <label>Points *</label>
          <input type="number" id="cf-points" min="0" value="${c.points}">
        </div>
        <div class="form-group">
          <label>Split</label>
          <input type="text" id="cf-split" value="${escapeHTML(c.split || '')}" placeholder="Optional, e.g. Top Split">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="${onSave}">Save</button>
        <button class="btn btn-outline" onclick="${onCancel}">Cancel</button>
      </div>
    </div>
  `;
}

function addCurrentChampionship() {
  const area = document.getElementById('current-form-area');
  area.innerHTML = currentChampionshipForm(null, 'saveNewCurrentChampionship()', 'cancelCurrentForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function cancelCurrentForm() {
  document.getElementById('current-form-area').innerHTML = '';
}

function collectCurrentFields() {
  const season = document.getElementById('cf-season').value.trim();
  const series = document.getElementById('cf-series').value.trim();
  const position = parseInt(document.getElementById('cf-position').value, 10);
  const points = parseInt(document.getElementById('cf-points').value, 10);
  if (!season || !series || !position) { alert('Season, Series, and Position are required.'); return null; }
  return {
    season, series,
    position,
    points: points || 0,
    split: document.getElementById('cf-split').value.trim()
  };
}

function saveNewCurrentChampionship() {
  const fields = collectCurrentFields();
  if (!fields) return;
  championshipsData.current.push(fields);
  cancelCurrentForm();
  renderCurrentChampionships();
  saveAll();
}

function editCurrentChampionship(index) {
  const c = championshipsData.current[index];
  const area = document.getElementById('current-form-area');
  area.innerHTML = currentChampionshipForm(c, `saveEditCurrentChampionship(${index})`, 'cancelCurrentForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function saveEditCurrentChampionship(index) {
  const fields = collectCurrentFields();
  if (!fields) return;
  championshipsData.current[index] = fields;
  cancelCurrentForm();
  renderCurrentChampionships();
  saveAll();
}

function deleteCurrentChampionship(index) {
  const c = championshipsData.current[index];
  if (!confirm(`Delete "${c.season} — ${c.series}"?`)) return;
  championshipsData.current.splice(index, 1);
  renderCurrentChampionships();
  saveAll();
}

// =============================================
//  CHAMPIONSHIPS — Past Wins
// =============================================

function renderPastWins() {
  const list = document.getElementById('won-list');
  const won = championshipsData.won;
  if (won.length === 0) {
    list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">No past wins recorded.</p>';
    return;
  }
  list.innerHTML = won.map((w, i) => `
    <div class="admin-entry card">
      <div class="admin-entry-header">
        <div>
          <strong>${escapeHTML(w.season)}</strong>
          <span class="text-secondary"> — ${escapeHTML(w.series)}</span>
        </div>
        <div class="admin-entry-actions">
          <button class="btn-sm btn-edit" onclick="editPastWin(${i})">Edit</button>
          <button class="btn-sm btn-delete" onclick="deletePastWin(${i})">Delete</button>
        </div>
      </div>
      <div class="admin-entry-details">
        <span>Position: <strong class="text-accent">P${w.position}</strong></span>
        <span>Points: ${w.finalPoints}</span>
        ${w.split ? `<span>Split: ${escapeHTML(w.split)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function pastWinForm(win, onSave, onCancel) {
  const w = win || { season: '', series: '', position: 1, finalPoints: '', split: '' };
  return `
    <div class="admin-form card">
      <h4>${win ? 'Edit Past Win' : 'Add Past Win'}</h4>
      <div class="form-grid">
        <div class="form-group">
          <label>Season *</label>
          <input type="text" id="wf-season" value="${escapeHTML(w.season)}" placeholder="e.g. 2024 S4">
        </div>
        <div class="form-group">
          <label>Series *</label>
          <input type="text" id="wf-series" value="${escapeHTML(w.series)}">
        </div>
        <div class="form-group">
          <label>Team Position *</label>
          <input type="number" id="wf-position" min="1" value="${w.position}">
        </div>
        <div class="form-group">
          <label>Final Points</label>
          <input type="number" id="wf-points" value="${w.finalPoints}" min="0">
        </div>
        <div class="form-group">
          <label>Split</label>
          <input type="text" id="wf-split" value="${escapeHTML(w.split || '')}" placeholder="Optional, e.g. Top Split">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="${onSave}">Save</button>
        <button class="btn btn-outline" onclick="${onCancel}">Cancel</button>
      </div>
    </div>
  `;
}

function addPastWin() {
  const area = document.getElementById('won-form-area');
  area.innerHTML = pastWinForm(null, 'saveNewPastWin()', 'cancelWonForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function cancelWonForm() {
  document.getElementById('won-form-area').innerHTML = '';
}

function saveNewPastWin() {
  const season = document.getElementById('wf-season').value.trim();
  const series = document.getElementById('wf-series').value.trim();
  const position = parseInt(document.getElementById('wf-position').value, 10);
  if (!season || !series || !position) { alert('Season, Series, and Position are required.'); return; }
  championshipsData.won.push({
    season, series,
    position,
    finalPoints: parseInt(document.getElementById('wf-points').value, 10) || 0,
    split: document.getElementById('wf-split').value.trim()
  });
  cancelWonForm();
  renderPastWins();
  saveAll();
}

function editPastWin(index) {
  const area = document.getElementById('won-form-area');
  area.innerHTML = pastWinForm(championshipsData.won[index], `saveEditPastWin(${index})`, 'cancelWonForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function saveEditPastWin(index) {
  const season = document.getElementById('wf-season').value.trim();
  const series = document.getElementById('wf-series').value.trim();
  const position = parseInt(document.getElementById('wf-position').value, 10);
  if (!season || !series || !position) { alert('Season, Series, and Position are required.'); return; }
  championshipsData.won[index] = {
    season, series,
    position,
    finalPoints: parseInt(document.getElementById('wf-points').value, 10) || 0,
    split: document.getElementById('wf-split').value.trim()
  };
  cancelWonForm();
  renderPastWins();
  saveAll();
}

function deletePastWin(index) {
  const w = championshipsData.won[index];
  if (!confirm(`Delete "${w.season} — ${w.series}"?`)) return;
  championshipsData.won.splice(index, 1);
  renderPastWins();
  saveAll();
}

// =============================================
//  GALLERY
// =============================================

function renderGalleryAdmin() {
  const list = document.getElementById('gallery-list');
  if (galleryData.length === 0) {
    list.innerHTML = '<p class="text-secondary" style="text-align:center;padding:2rem;">No gallery items yet. Click "+ Add Gallery Item" to get started.</p>';
    return;
  }
  list.innerHTML = galleryData.map((g, i) => `
    <div class="admin-entry card">
      <div class="admin-entry-header">
        <div>
          <strong>${escapeHTML(g.label)}</strong>
          <span class="text-secondary"> — ${escapeHTML(g.category)}</span>
        </div>
        <div class="admin-entry-actions">
          <button class="btn-sm btn-edit" onclick="editGalleryItem(${i})">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteGalleryItem(${i})">Delete</button>
        </div>
      </div>
      <div class="admin-entry-details">
        ${g.image ? `<span>Image: ${escapeHTML(g.image.substring(0, 50))}${g.image.length > 50 ? '...' : ''}</span>` : '<span>No image</span>'}
      </div>
    </div>
  `).join('');
}

function galleryForm(item, onSave, onCancel) {
  const g = item || { category: 'liveries', label: '', image: '', color: '' };
  return `
    <div class="admin-form card">
      <h4>${item ? 'Edit Gallery Item' : 'Add Gallery Item'}</h4>
      <div class="form-grid">
        <div class="form-group">
          <label>Category *</label>
          <select id="gf-category">
            <option value="liveries" ${g.category === 'liveries' ? 'selected' : ''}>Car Liveries</option>
            <option value="screenshots" ${g.category === 'screenshots' ? 'selected' : ''}>Race Screenshots</option>
            <option value="results" ${g.category === 'results' ? 'selected' : ''}>Results</option>
          </select>
        </div>
        <div class="form-group">
          <label>Label *</label>
          <input type="text" id="gf-label" value="${escapeHTML(g.label)}" placeholder="e.g. Spa Battle — Eau Rouge">
        </div>
        <div class="form-group">
          <label>Image URL</label>
          <div style="display:flex;gap:0.5rem;">
            <input type="text" id="gf-image" value="${escapeHTML(g.image || '')}" placeholder="URL or upload" style="flex:1;">
            <button class="btn-sm btn-edit" type="button" onclick="pickImage('gf-image')">Upload</button>
          </div>
        </div>
        <div class="form-group">
          <label>Placeholder Color</label>
          <input type="text" id="gf-color" value="${escapeHTML(g.color || '')}" placeholder="#1a5c2a (used if no image)">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="${onSave}">Save</button>
        <button class="btn btn-outline" onclick="${onCancel}">Cancel</button>
      </div>
    </div>
  `;
}

function addGalleryItem() {
  const area = document.getElementById('gallery-form-area');
  area.innerHTML = galleryForm(null, 'saveNewGalleryItem()', 'cancelGalleryForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function cancelGalleryForm() {
  document.getElementById('gallery-form-area').innerHTML = '';
}

function nextGalleryId() {
  let max = 0;
  galleryData.forEach(g => {
    const num = typeof g.id === 'number' ? g.id : parseInt(g.id, 10) || 0;
    if (num > max) max = num;
  });
  return max + 1;
}

function collectGalleryFields() {
  const label = document.getElementById('gf-label').value.trim();
  const category = document.getElementById('gf-category').value;
  if (!label || !category) { alert('Category and Label are required.'); return null; }
  return {
    category,
    label,
    image: document.getElementById('gf-image').value.trim(),
    color: document.getElementById('gf-color').value.trim()
  };
}

function saveNewGalleryItem() {
  const fields = collectGalleryFields();
  if (!fields) return;
  fields.id = nextGalleryId();
  galleryData.push(fields);
  cancelGalleryForm();
  renderGalleryAdmin();
  saveAll();
}

function editGalleryItem(index) {
  const g = galleryData[index];
  const area = document.getElementById('gallery-form-area');
  area.innerHTML = galleryForm(g, `saveEditGalleryItem(${index})`, 'cancelGalleryForm()');
  area.scrollIntoView({ behavior: 'smooth' });
}

function saveEditGalleryItem(index) {
  const fields = collectGalleryFields();
  if (!fields) return;
  fields.id = galleryData[index].id;
  galleryData[index] = fields;
  cancelGalleryForm();
  renderGalleryAdmin();
  saveAll();
}

function deleteGalleryItem(index) {
  const g = galleryData[index];
  if (!confirm(`Delete "${g.label}"?`)) return;
  galleryData.splice(index, 1);
  renderGalleryAdmin();
  saveAll();
}

// =============================================
//  SITE CONTENT
// =============================================

function renderSiteContent() {
  // Hero images
  const imgs = siteData.heroImages || [{url:'',alt:''},{url:'',alt:''},{url:'',alt:''}];
  for (let i = 0; i < 3; i++) {
    const img = imgs[i] || {url:'',alt:''};
    document.getElementById(`si-hero${i+1}-url`).value = img.url || '';
    document.getElementById(`si-hero${i+1}-alt`).value = img.alt || '';
  }
  // About text
  const paras = siteData.aboutParagraphs || ['',''];
  document.getElementById('si-about-p1').value = paras[0] || '';
  document.getElementById('si-about-p2').value = paras[1] || '';
  document.getElementById('si-about-mission').value = siteData.aboutMission || '';
}

function saveSiteContent() {
  siteData.heroImages = [
    { url: document.getElementById('si-hero1-url').value.trim(), alt: document.getElementById('si-hero1-alt').value.trim() },
    { url: document.getElementById('si-hero2-url').value.trim(), alt: document.getElementById('si-hero2-alt').value.trim() },
    { url: document.getElementById('si-hero3-url').value.trim(), alt: document.getElementById('si-hero3-alt').value.trim() },
  ];
  siteData.aboutParagraphs = [
    document.getElementById('si-about-p1').value.trim(),
    document.getElementById('si-about-p2').value.trim(),
  ].filter(Boolean);
  siteData.aboutMission = document.getElementById('si-about-mission').value.trim();
  saveAll();
  showStatus('Site content saved locally. Click "Publish Changes" to push live.', 'success');
}

// =============================================
//  INIT — Load existing data (deferred until auth)
// =============================================

async function loadAdminData() {
  // Check if there are unpublished draft edits in localStorage
  const hasDraft = localStorage.getItem('admin-drivers') !== null;

  if (hasDraft) {
    // Restore unpublished work from localStorage
    try {
      driversData = JSON.parse(localStorage.getItem('admin-drivers')) || [];
      resultsData = JSON.parse(localStorage.getItem('admin-results')) || [];
      championshipsData = JSON.parse(localStorage.getItem('admin-championships')) || { current: [], won: [] };
      galleryData = JSON.parse(localStorage.getItem('admin-gallery')) || [];
      const savedSite = localStorage.getItem('admin-site');
      if (savedSite) siteData = JSON.parse(savedSite);
    } catch (e) {
      console.error('Failed to parse localStorage draft, falling back to server data', e);
      localStorage.removeItem('admin-drivers');
      localStorage.removeItem('admin-results');
      localStorage.removeItem('admin-championships');
      localStorage.removeItem('admin-gallery');
      localStorage.removeItem('admin-site');
      return loadAdminData();
    }
    isDirty = true;
    showStatus('You have unpublished changes from a previous session.', 'info');
  } else {
    // No draft — fetch the latest from JSON files (source of truth)
    const [drivers, results, championships, gallery, site] = await Promise.all([
      fetchJSON('data/drivers.json'),
      fetchJSON('data/results.json'),
      fetchJSON('data/championships.json'),
      fetchJSON('data/gallery.json'),
      fetchJSON('data/site.json'),
    ]);

    if (drivers) driversData = drivers;
    if (results) resultsData = results;
    if (championships) {
      championshipsData = {
        current: championships.current || [],
        won: championships.won || []
      };
    }
    if (gallery) galleryData = gallery;
    if (site) siteData = site;
    isDirty = false;
  }

  renderDrivers();
  renderResults();
  renderCurrentChampionships();
  renderPastWins();
  renderGalleryAdmin();
  renderSiteContent();

  // Restore saved token
  const savedToken = sessionStorage.getItem('gh-token');
  if (savedToken) {
    document.getElementById('gh-token').value = savedToken;
  }
}

// =============================================
//  IMAGE UPLOAD HELPERS
// =============================================

const IMG_MAX_WIDTH = 1920;
const IMG_MAX_HEIGHT = 1080;
const IMG_QUALITY = 0.85;

function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Only downscale, never upscale
      if (width > IMG_MAX_WIDTH || height > IMG_MAX_HEIGHT) {
        const ratio = Math.min(IMG_MAX_WIDTH / width, IMG_MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG for photos (smaller), keep PNG if the original was PNG with transparency
      const isPng = file.type === 'image/png';
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const quality = isPng ? undefined : IMG_QUALITY;
      resolve(canvas.toDataURL(mimeType, quality));
    };
    img.src = url;
  });
}

function pickImage(targetInputId) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const target = document.getElementById(targetInputId);
    if (target) {
      target.value = 'Resizing...';
      target.value = await resizeImage(file);
    }
  });
  fileInput.click();
}

// For image rows that don't have a fixed ID (result images)
function pickImageForInput(btn) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const urlInput = btn.parentElement.querySelector('input[type="text"]');
    if (urlInput) {
      urlInput.value = 'Resizing...';
      urlInput.value = await resizeImage(file);
    }
  });
  fileInput.click();
}

function generateUploadPath(prefix) {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `images/uploads/${prefix}-${timestamp}-${rand}`;
}

async function pushImageFile(token, repoPath, base64Data) {
  // base64Data is a data URI like "data:image/png;base64,iVBOR..."
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const rawBase64 = match[2];
  const fullPath = repoPath + '.' + ext;

  const getRes = await fetch(`${GH_API}/repos/${GH_REPO}/contents/${fullPath}`, {
    headers: { 'Authorization': `token ${token}` }
  });
  let sha = null;
  if (getRes.ok) {
    sha = (await getRes.json()).sha;
  }

  const body = {
    message: `Upload ${fullPath} via admin panel`,
    content: rawBase64,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(`${GH_API}/repos/${GH_REPO}/contents/${fullPath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || `Failed to upload ${fullPath}`);
  }

  return fullPath;
}

// Scan all data for data URIs, upload them, and replace with real URLs
async function uploadPendingImages(token, statusFn) {
  const GH_PAGES_BASE = '';  // relative URLs work on same domain

  async function processUrl(url, prefix) {
    if (!url || !url.startsWith('data:image/')) return url;
    const repoPath = generateUploadPath(prefix);
    statusFn(`Uploading image...`);
    const fullPath = await pushImageFile(token, repoPath, url);
    return fullPath;
  }

  // Drivers
  for (let i = 0; i < driversData.length; i++) {
    driversData[i].photo = await processUrl(driversData[i].photo, 'driver');
  }

  // Results
  for (let i = 0; i < resultsData.length; i++) {
    if (Array.isArray(resultsData[i].images)) {
      for (let j = 0; j < resultsData[i].images.length; j++) {
        resultsData[i].images[j] = await processUrl(resultsData[i].images[j], 'result');
      }
    }
  }

  // Gallery
  for (let i = 0; i < galleryData.length; i++) {
    galleryData[i].image = await processUrl(galleryData[i].image, 'gallery');
  }

  // Site hero images
  if (siteData.heroImages) {
    for (let i = 0; i < siteData.heroImages.length; i++) {
      siteData.heroImages[i].url = await processUrl(siteData.heroImages[i].url, 'hero');
    }
  }
}

// =============================================
//  PUBLISH — GitHub API
// =============================================

const GH_REPO = 'Tomcharter/aerismotorsport.github.io';
const GH_API = 'https://api.github.com';

function saveToken() {
  const token = document.getElementById('gh-token').value.trim();
  if (!token) { alert('Please enter a token.'); return; }
  sessionStorage.setItem('gh-token', token);
  showStatus('Token saved for this session.', 'success');
}

function getToken() {
  return (document.getElementById('gh-token').value.trim()) ||
         sessionStorage.getItem('gh-token') || '';
}

function showStatus(msg, type) {
  const el = document.getElementById('publish-status');
  const color = type === 'success' ? 'var(--color-success)' :
                type === 'error' ? 'var(--color-danger)' :
                'var(--color-text-secondary)';
  el.innerHTML = `<p style="color:${color};font-size:0.9rem;">${escapeHTML(msg)}</p>`;
}

function textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function pushFile(token, path, content) {
  // Get current file SHA
  const getRes = await fetch(`${GH_API}/repos/${GH_REPO}/contents/${path}`, {
    headers: { 'Authorization': `token ${token}` }
  });

  let sha = null;
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  // Push updated content
  const body = {
    message: `Update ${path} via admin panel`,
    content: textToBase64(JSON.stringify(content, null, 2) + '\n'),
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(`${GH_API}/repos/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || `Failed to update ${path}`);
  }
}

async function discardDrafts() {
  if (!confirm('Discard all unpublished changes and reload from the live site?')) return;
  localStorage.removeItem('admin-drivers');
  localStorage.removeItem('admin-results');
  localStorage.removeItem('admin-championships');
  localStorage.removeItem('admin-gallery');
  localStorage.removeItem('admin-site');
  isDirty = false;

  const [drivers, results, championships, gallery, site] = await Promise.all([
    fetchJSON('data/drivers.json'),
    fetchJSON('data/results.json'),
    fetchJSON('data/championships.json'),
    fetchJSON('data/gallery.json'),
    fetchJSON('data/site.json'),
  ]);

  if (drivers) driversData = drivers;
  if (results) resultsData = results;
  if (championships) {
    championshipsData = {
      current: championships.current || [],
      won: championships.won || []
    };
  }
  if (gallery) galleryData = gallery;
  if (site) siteData = site;

  renderDrivers();
  renderResults();
  renderCurrentChampionships();
  renderPastWins();
  renderGalleryAdmin();
  renderSiteContent();
  showStatus('Reloaded data from the live site.', 'success');
}

async function publishAll() {
  const token = getToken();
  if (!token) {
    showStatus('Please enter your GitHub token first.', 'error');
    return;
  }

  const btn = document.getElementById('publish-btn');
  btn.disabled = true;

  // Upload any images selected from file picker before publishing JSON
  try {
    btn.textContent = 'Uploading images...';
    await uploadPendingImages(token, (msg) => showStatus(msg, 'info'));
  } catch (err) {
    showStatus('Image upload failed: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Publish Changes';
    return;
  }

  const files = [
    { path: 'data/drivers.json', data: driversData, label: 'drivers' },
    { path: 'data/results.json', data: resultsData, label: 'results' },
    { path: 'data/championships.json', data: championshipsData, label: 'championships' },
    { path: 'data/gallery.json', data: galleryData, label: 'gallery' },
    { path: 'data/site.json', data: siteData, label: 'site content' },
  ];

  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    btn.textContent = `Publishing ${file.label} (${i + 1}/${files.length})...`;
    showStatus(`Pushing ${file.label} (${i + 1}/${files.length})...`, 'info');
    try {
      await pushFile(token, file.path, file.data);
    } catch (err) {
      errors.push(`${file.label}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    showStatus('Errors: ' + errors.join('; '), 'error');
  } else {
    // Clear localStorage and dirty flag on success
    localStorage.removeItem('admin-drivers');
    localStorage.removeItem('admin-results');
    localStorage.removeItem('admin-championships');
    localStorage.removeItem('admin-gallery');
    localStorage.removeItem('admin-site');
    isDirty = false;
    showStatus('Published! Site will redeploy in 1–2 minutes.', 'success');
  }

  btn.disabled = false;
  btn.textContent = 'Publish Changes';
}
