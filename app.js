// ===================================================
//  SafeSignal — Main Application Controller
// ===================================================

/* ============ INIT ============ */
window.addEventListener('DOMContentLoaded', () => {
  runLoadingSequence();
});

function runLoadingSequence() {
  const loading = document.getElementById('loading-screen');
  const lights  = loading.querySelectorAll('.signal-light');
  let i = 0;
  const cycle = setInterval(() => {
    lights.forEach(l => l.classList.remove('active'));
    lights[i % 3].classList.add('active');
    i++;
  }, 400);

  setTimeout(() => {
    clearInterval(cycle);
    loading.classList.add('hidden');
    initApp();
  }, 2400);
}

function initApp() {
  initSignals();
  initVendors();
  initCharts();
  initWearable();
  initMap();
  initNavigation();
  initModals();
  initEmergency();

  updateSummaryCards();
  startSignalEngine();
  startClock();

  // Randomize initial stats
  STATS.alertsToday = Math.floor(Math.random() * 30 + 20);
  STATS.accidentsPrevented = 47;
  STATS.avgResponseMs = 142;
  updateSummaryCards();

  // Show initial toast
  setTimeout(() => showToast('🛡️', 'SafeSignal Active', `${SIGNALS.length} intersections across ${getCities().length-1} cities connected`, 'success'), 500);
}


/* ============ NAVIGATION ============ */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      switchTab(tab);
    });
  });

  // Menu toggle (mobile)
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('mobile-open');
  });
}

function switchTab(tabId) {
  // Update nav active
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + tabId)?.classList.add('active');

  // Update sections
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + tabId)?.classList.add('active');

  // Update breadcrumb
  const titles = { dashboard: 'Dashboard', signals: 'Signal Monitor', vendors: 'Vendor Registry', wearable: 'Wearable Alerts', analytics: 'Analytics', map: 'Intersection Map' };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[tabId] || tabId;

  // Re-render tab-specific content
  if (tabId === 'signals') { renderCityFilterTabs(); renderSignalCitySummary(); renderSignalMonitor(); }
  if (tabId === 'vendors') { renderVendorTable(); renderVendorSafetyList(); }
  if (tabId === 'analytics') { drawBarChart(); drawDonutChart(); drawHourlyChart(); renderRiskList(); renderPerfStats(); }
  if (tabId === 'map') renderIntersectionMap();
  if (tabId === 'wearable') populateWearableVendorSelect();
}


/* ============ ALERT FEED ============ */
function addAlertToFeed(alert) {
  ALERT_LOG.unshift(alert);
  if (ALERT_LOG.length > 50) ALERT_LOG.pop();
  renderAlertFeed();
}

function renderAlertFeed() {
  const feed = document.getElementById('alerts-feed');
  if (!feed) return;

  if (ALERT_LOG.length === 0) {
    feed.innerHTML = `<div class="empty-feed">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <p>No alerts yet. Monitoring active...</p>
    </div>`;
    return;
  }

  feed.innerHTML = ALERT_LOG.slice(0, 20).map(a => {
    const timeStr = formatTime(a.time);
    return `<div class="alert-item ${a.type}">
      <div class="alert-icon">${a.icon}</div>
      <div class="alert-body">
        <strong>${a.title}</strong>
        <span>${a.body}</span>
      </div>
      <div class="alert-time">${timeStr}</div>
    </div>`;
  }).join('');
}

function updateBadge() {
  const badge = document.getElementById('badge-count');
  if (!badge) return;
  const count = Math.min(99, ALERT_LOG.filter(a => a.type === 'danger' || a.type === 'warning').length);
  badge.textContent = count > 99 ? '99+' : count;
  badge.classList.toggle('show', count > 0);
}

document.getElementById('clear-alerts')?.addEventListener('click', () => {
  ALERT_LOG.length = 0;
  renderAlertFeed();
  updateBadge();
});


/* ============ MODALS ============ */
function initModals() {
  // ── Vendor Modal ──
  const addVBtn   = document.getElementById('add-vendor-btn');
  const vModal    = document.getElementById('vendor-modal');
  const vClose    = document.getElementById('modal-close');
  const vCancel   = document.getElementById('modal-cancel');
  const vSave     = document.getElementById('modal-save');

  populateIntersectionDropdown();

  addVBtn?.addEventListener('click', () => { populateIntersectionDropdown(); vModal?.classList.add('open'); });
  vClose?.addEventListener('click',  () => vModal?.classList.remove('open'));
  vCancel?.addEventListener('click', () => vModal?.classList.remove('open'));
  vModal?.addEventListener('click', e => { if (e.target === vModal) vModal.classList.remove('open'); });

  vSave?.addEventListener('click', () => {
    const name  = document.getElementById('m-name')?.value.trim();
    const phone = document.getElementById('m-phone')?.value.trim();
    const intersection = document.getElementById('m-intersection')?.value;
    const stall = document.getElementById('m-stall')?.value;
    const hours = document.getElementById('m-hours')?.value.trim() || '7AM-8PM';

    if (!name)         { showToast('❌','Validation','Please enter vendor name','danger'); return; }
    if (!intersection) { showToast('❌','Validation','Please select an intersection','danger'); return; }

    addVendor({ name, phone, intersection, stall, hours });
    vModal?.classList.remove('open');
    ['m-name','m-phone','m-hours'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  });

  // ── Add Signal Modal ──
  const addSBtn   = document.getElementById('add-signal-btn');
  const sModal    = document.getElementById('signal-modal');
  const sClose    = document.getElementById('signal-modal-close');
  const sCancel   = document.getElementById('signal-modal-cancel');
  const sSave     = document.getElementById('signal-modal-save');

  addSBtn?.addEventListener('click', () => {
    updateSignalPreview();
    sModal?.classList.add('open');
  });
  sClose?.addEventListener('click',  () => sModal?.classList.remove('open'));
  sCancel?.addEventListener('click', () => sModal?.classList.remove('open'));
  sModal?.addEventListener('click', e => { if (e.target === sModal) sModal.classList.remove('open'); });

  // Live preview update
  ['s-name','s-risk','s-phase'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateSignalPreview);
  });
  document.getElementById('s-city-select')?.addEventListener('change', function() {
    const customInput = document.getElementById('s-city-custom');
    if (customInput) customInput.style.display = this.value === 'other' ? 'block' : 'none';
    updateSignalPreview();
  });

  sSave?.addEventListener('click', () => {
    const name    = document.getElementById('s-name')?.value.trim();
    const cityVal = document.getElementById('s-city-select')?.value;
    const city    = cityVal === 'other'
      ? (document.getElementById('s-city-custom')?.value.trim() || 'Unknown')
      : cityVal;
    const phase   = document.getElementById('s-phase')?.value || 'red';
    const risk    = parseInt(document.getElementById('s-risk')?.value) || 50;
    const density = document.getElementById('s-density')?.value || 'medium';

    if (!name) { showToast('❌','Validation','Please enter intersection name','danger'); return; }
    if (!city) { showToast('❌','Validation','Please select a city','danger'); return; }

    addSignal({ name, city, phase, riskScore: Math.min(100, Math.max(1, risk)), density });
    sModal?.classList.remove('open');
    document.getElementById('s-name').value  = '';
    document.getElementById('s-risk').value  = '50';
  });
}

function updateSignalPreview() {
  const name    = document.getElementById('s-name')?.value.trim() || 'New Signal';
  const cityVal = document.getElementById('s-city-select')?.value;
  const city    = cityVal === 'other'
    ? (document.getElementById('s-city-custom')?.value.trim() || 'City')
    : (cityVal || 'City');
  const phase   = document.getElementById('s-phase')?.value || 'red';
  const risk    = parseInt(document.getElementById('s-risk')?.value) || 50;
  const newId   = nextIntId();
  const riskColor = risk >= 70 ? 'var(--red)' : risk >= 45 ? 'var(--yellow)' : 'var(--green)';

  const nameEl = document.getElementById('sprev-name'); if (nameEl) nameEl.textContent = name;
  const cityEl = document.getElementById('sprev-city'); if (cityEl) cityEl.textContent = `📍 ${city}`;
  const idEl   = document.getElementById('sprev-id');   if (idEl)   idEl.textContent   = newId;
  const rEl    = document.getElementById('sprev-risk'); if (rEl)    { rEl.textContent = `Risk: ${risk}`; rEl.style.color = riskColor; }

  // Update preview bulbs
  ['r','y','g'].forEach(c => {
    const b = document.getElementById(`sprev-${c}`);
    if (!b) return;
    b.classList.toggle('ps-active',
      (c==='r'&&phase==='red') || (c==='y'&&phase==='yellow') || (c==='g'&&phase==='green'));
  });
}

function populateIntersectionDropdown() {
  const sel = document.getElementById('m-intersection');
  if (!sel) return;
  const cities = [...new Set(INTERSECTIONS.map(i => i.city))];
  sel.innerHTML = cities.map(city => `
    <optgroup label="📍 ${city}">
      ${INTERSECTIONS.filter(i => i.city === city).map(i =>
        `<option value="${i.name}">${i.name}</option>`
      ).join('')}
    </optgroup>`
  ).join('');
}


/* ============ EMERGENCY BROADCAST ============ */
function initEmergency() {
  document.getElementById('emergency-btn')?.addEventListener('click', () => {
    const active = VENDORS.filter(v => v.status === 'active');
    active.forEach(v => {
      v.alertsToday++;
      addDeliveryLog(v.name, 'emergency', 'sos', '🚨');
    });
    STATS.alertsToday += active.length;
    triggerWearableAlert('emergency', '🚨 EMERGENCY! Clear all roads immediately!');
    addAlertToFeed({
      type: 'danger', icon: '🚨',
      title: `🚨 EMERGENCY BROADCAST — All ${active.length} Vendors`,
      body: 'Immediate evacuation alert sent to all active wearable devices',
      time: new Date(),
    });
    updateSummaryCards();
    showToast('🚨', 'EMERGENCY BROADCAST!', `All ${active.length} vendors alerted immediately!`, 'danger');
  });
}


/* ============ CLOCK ============ */
function startClock() {
  const el = document.getElementById('live-time');
  const update = () => {
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };
  update();
  setInterval(update, 1000);
}


/* ============ TOAST ============ */
function showToast(icon, title, body, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body"><strong>${title}</strong><span>${body}</span></div>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}


/* ============ HELPERS ============ */
function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// Resize charts on window resize
window.addEventListener('resize', () => {
  drawTrafficChart();
  drawBarChart();
  drawHourlyChart();
  renderIntersectionMap();
});
