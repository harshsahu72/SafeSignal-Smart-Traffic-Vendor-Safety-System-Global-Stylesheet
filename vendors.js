// ===================================================
//  SafeSignal — Vendor Management
// ===================================================

function renderVendorTable(filter = '') {
  const tbody = document.getElementById('vendor-tbody');
  if (!tbody) return;

  const filtered = filter
    ? VENDORS.filter(v =>
        v.name.toLowerCase().includes(filter) ||
        v.intersection.toLowerCase().includes(filter) ||
        v.stall.toLowerCase().includes(filter))
    : VENDORS;

  tbody.innerHTML = filtered.map(v => {
    const initials = v.name.split(' ').map(w=>w[0]).join('').slice(0,2);
    const color = VENDOR_COLORS[VENDORS.indexOf(v) % VENDOR_COLORS.length];
    return `
    <tr>
      <td class="v-id">${v.id}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0">${initials}</div>
          <div class="v-name">${v.name}<span>${v.stall}</span></div>
        </div>
      </td>
      <td>
        <div style="font-size:0.82rem">${v.intersection}</div>
        <div style="font-size:0.7rem;color:var(--text-muted)">${v.hours}</div>
      </td>
      <td>
        <div style="font-family:monospace;font-size:0.78rem;color:var(--accent)">${v.device}</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">Active</div>
      </td>
      <td><span class="tag tag-${v.status==='active'?'active':'offline'}">${v.status==='active'?'● Online':'○ Offline'}</span></td>
      <td><span class="tag tag-${v.riskLevel}">${v.riskLevel.charAt(0).toUpperCase()+v.riskLevel.slice(1)}</span></td>
      <td>
        <span style="font-family:var(--font-display);font-weight:700;color:${v.alertsToday>10?'var(--red)':v.alertsToday>5?'var(--yellow)':'var(--green)'}">
          ${v.alertsToday}
        </span>
      </td>
      <td>
        <button class="btn-action" onclick="alertVendorById('${v.id}')">Alert Now</button>
      </td>
    </tr>`;
  }).join('');

  // Update active count
  const activeEl = document.getElementById('active-count');
  if (activeEl) activeEl.textContent = VENDORS.filter(v=>v.status==='active').length;
}

function renderVendorSafetyList() {
  const list = document.getElementById('vendor-safety-list');
  if (!list) return;

  const sorted = [...VENDORS].sort((a,b) => a.safetyScore - b.safetyScore);
  list.innerHTML = sorted.map(v => {
    const idx = VENDORS.indexOf(v);
    const color = VENDOR_COLORS[idx % VENDOR_COLORS.length];
    const initials = v.name.split(' ').map(w=>w[0]).join('').slice(0,2);
    const scoreColor = v.safetyScore >= 70 ? 'var(--green)' : v.safetyScore >= 40 ? 'var(--yellow)' : 'var(--red)';
    return `
    <div class="vsafe-item">
      <div class="vsafe-avatar" style="background:${color}22;color:${color}">${initials}</div>
      <div class="vsafe-name">${v.name.split(' ')[0]}</div>
      <div class="vsafe-bar-wrap">
        <div class="vsafe-bar" style="width:${v.safetyScore}%;background:${scoreColor}"></div>
      </div>
      <div class="vsafe-score" style="color:${scoreColor}">${v.safetyScore}%</div>
    </div>`;
  }).join('');
}

function populateWearableVendorSelect() {
  const sel = document.getElementById('w-vendor-select');
  if (!sel) return;
  sel.innerHTML = `<option value="all">— All Active Vendors —</option>` +
    VENDORS.filter(v=>v.status==='active').map(v =>
      `<option value="${v.id}">${v.name} (${v.intersection.split(' ')[0]})</option>`
    ).join('');
}

function alertVendorById(id) {
  const vendor = VENDORS.find(v => v.id === id);
  if (!vendor) return;
  const msg = `Manual safety alert sent to ${vendor.name} at ${vendor.intersection}`;
  addAlertToFeed({ type:'warning', icon:'📲', title:`Manual Alert → ${vendor.name}`, body: msg, time: new Date() });
  showToast('📲', 'Alert Sent!', `${vendor.name}'s wearable notified`, 'info');
  vendor.alertsToday++;
  STATS.alertsToday++;
  updateSummaryCards();
}

function addVendor(data) {
  const id = nextVendorId();
  const device = `WD-${Math.random().toString(36).toUpperCase().slice(2,6)}`;
  const newVendor = { ...data, id, device, status: 'active', riskLevel: 'low', alertsToday: 0, safetyScore: 85 };
  VENDORS.push(newVendor);

  // Add to relevant signal's vendorsNearby
  const sig = SIGNALS.find(s => s.name === data.intersection);
  if (sig) sig.vendorsNearby.push(data.name);

  renderVendorTable();
  renderVendorSafetyList();
  populateWearableVendorSelect();
  showToast('✅', 'Vendor Registered!', `${data.name} added to the safety network`, 'success');
  return newVendor;
}

function initVendors() {
  renderVendorTable();
  renderVendorSafetyList();
  populateWearableVendorSelect();

  // Search
  const searchEl = document.getElementById('vendor-search');
  if (searchEl) {
    searchEl.addEventListener('input', e => renderVendorTable(e.target.value.toLowerCase().trim()));
  }
}

function updateSummaryCards() {
  const safeEl = document.getElementById('safe-vendors');
  const alertsEl = document.getElementById('alerts-today');
  const preventEl = document.getElementById('accidents-prevented');
  const respEl = document.getElementById('response-time');

  if (safeEl)   safeEl.textContent   = VENDORS.filter(v=>v.riskLevel==='low'&&v.status==='active').length;
  if (alertsEl) alertsEl.textContent  = STATS.alertsToday;
  if (preventEl) preventEl.textContent = STATS.accidentsPrevented;
  if (respEl)   respEl.textContent    = STATS.avgResponseMs ? STATS.avgResponseMs + 'ms' : '142ms';
}
