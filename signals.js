// ===================================================
//  SafeSignal — Traffic Signal Engine (with Manual Control)
// ===================================================

const PHASE_ORDER    = { red: 'green', green: 'yellow', yellow: 'red' };
const PHASE_DURATION = { red: 42, green: 32, yellow: 7 };
const PHASE_COLORS   = { red: '#ef4444', green: '#22c55e', yellow: '#eab308' };

// Tracks which signals are under manual override
const MANUAL_OVERRIDE = {}; // { 'INT-01': true, ... }

let signalIntervalId = null;

/* ============================================================
   CITY FILTER TABS
   ============================================================ */
function renderCityFilterTabs() {
  const container = document.getElementById('city-filter-tabs');
  if (!container) return;

  const cities = getCities(); // from data.js: ['all', 'Bhopal', 'Delhi', ...]
  container.innerHTML = cities.map(city => {
    const count = city === 'all'
      ? SIGNALS.length
      : SIGNALS.filter(s => s.city === city).length;
    const isActive = ACTIVE_CITY_FILTER === city;
    const cityColors = { Delhi:'#6366f1', Bhopal:'#22c55e', Mumbai:'#f97316', Bengaluru:'#a855f7', Hyderabad:'#3b82f6', Punjab:'#eab308', Ranchi:'#ec4899', all:'var(--text-primary)' };
    const c = cityColors[city] || '#ec4899';
    return `<button
      class="city-tab ${isActive ? 'city-tab-active' : ''}"
      style="${isActive ? `border-color:${c};color:${c};background:${c}18` : ''}"
      onclick="setCityFilter('${city}')">
      ${city === 'all' ? '🌐 All' : `📍 ${city}`}
      <span class="city-tab-count">${count}</span>
    </button>`;
  }).join('');
}

function setCityFilter(city) {
  ACTIVE_CITY_FILTER = city;
  renderCityFilterTabs();
  renderSignalMonitor();
  renderSignalCitySummary();
}

function renderSignalCitySummary() {
  const el = document.getElementById('signal-city-summary');
  if (!el) return;

  const filtered = ACTIVE_CITY_FILTER === 'all'
    ? SIGNALS
    : SIGNALS.filter(s => s.city === ACTIVE_CITY_FILTER);

  const redCount    = filtered.filter(s => s.phase === 'red').length;
  const greenCount  = filtered.filter(s => s.phase === 'green').length;
  const yellowCount = filtered.filter(s => s.phase === 'yellow').length;
  const manualCount = filtered.filter(s => MANUAL_OVERRIDE[s.id]).length;

  el.innerHTML = `
    <div class="city-sum-item">
      <div class="csit-dot" style="background:var(--red)"></div>
      <span>🔴 RED</span><strong>${redCount}</strong>
    </div>
    <div class="city-sum-item">
      <div class="csit-dot" style="background:var(--green)"></div>
      <span>🟢 GREEN</span><strong>${greenCount}</strong>
    </div>
    <div class="city-sum-item">
      <div class="csit-dot" style="background:var(--yellow)"></div>
      <span>🟡 YELLOW</span><strong>${yellowCount}</strong>
    </div>
    <div class="city-sum-sep"></div>
    <div class="city-sum-item">
      <span>🎛️ Manual Override</span><strong style="color:var(--yellow)">${manualCount}</strong>
    </div>
    <div class="city-sum-item">
      <span>Total Showing</span><strong style="color:var(--accent)">${filtered.length}</strong>
    </div>
  `;
}

/* ============================================================
   ADD NEW SIGNAL
   ============================================================ */
function addSignal(data) {
  const newId = nextIntId();
  const newInt = {
    id: newId,
    name: data.name,
    city: data.city,
    lat: 0, lng: 0,
    riskScore: data.riskScore,
  };
  INTERSECTIONS.push(newInt);

  const newSig = {
    ...newInt,
    phase: data.phase,
    timer: PHASE_DURATION[data.phase],
    maxTimer: { ...PHASE_DURATION },
    vehicleCount: data.density === 'high' ? 70 : data.density === 'medium' ? 40 : 15,
    peakHour: false,
    vendorsNearby: [],
  };
  SIGNALS.push(newSig);
  MANUAL_OVERRIDE[newId] = false;

  // Update traffic history for new signal
  if (typeof trafficHistory !== 'undefined') {
    trafficHistory[data.name] = Array.from({length: 60}, () => Math.floor(Math.random() * 60 + 10));
  }

  renderCityFilterTabs();
  renderSignalCitySummary();
  renderSignalMonitor();
  renderDashboardSignals();

  // Also refresh vendor intersection dropdown and charts
  populateIntersectionDropdown();
  if (typeof populateChartFilter === 'function') populateChartFilter();
  if (typeof drawBarChart === 'function') { drawBarChart(); renderRiskList(); }

  showToast('🚦', 'Signal Added!', `${data.name} (${data.city}) added to the network as ${newId}`, 'success');
  addAlertToFeed({
    type: 'info', icon: '🚦',
    title: `New Signal: ${data.name} [${newId}]`,
    body: `${data.city} · Risk ${data.riskScore} · Phase: ${data.phase.toUpperCase()}`,
    time: new Date(),
  });
  return newSig;
}



/* ============================================================
   INIT
   ============================================================ */
function initSignals() {
  SIGNALS.forEach(sig => {
    sig.timer    = PHASE_DURATION[sig.phase];
    sig.maxTimer = { ...PHASE_DURATION };
    MANUAL_OVERRIDE[sig.id] = false;
  });
  renderCityFilterTabs();
  renderSignalCitySummary();
  renderDashboardSignals();
  renderSignalMonitor();
}

/* ============================================================
   TICK — runs every second for auto signals
   ============================================================ */
function tickSignals() {
  SIGNALS.forEach(sig => {
    // Do NOT auto-tick if this signal is under manual override
    if (MANUAL_OVERRIDE[sig.id]) return;

    sig.timer--;
    // Simulate vehicle count fluctuation
    sig.vehicleCount = Math.max(5, sig.vehicleCount + Math.floor(Math.random() * 10 - 5));

    if (sig.timer <= 0) {
      const prevPhase = sig.phase;
      sig.phase = PHASE_ORDER[sig.phase];
      sig.timer = PHASE_DURATION[sig.phase];

      // Fire alert on dangerous transitions
      if ((prevPhase === 'green' && sig.phase === 'yellow') ||
          (prevPhase === 'yellow' && sig.phase === 'red')) {
        fireSignalAlert(sig, prevPhase);
      }
    }
  });

  renderDashboardSignals();
  renderSignalMonitor();
}

/* ============================================================
   MANUAL CONTROL — force a specific phase
   ============================================================ */
function setSignalPhase(sigId, newPhase) {
  const sig = SIGNALS.find(s => s.id === sigId);
  if (!sig) return;

  const prevPhase = sig.phase;
  sig.phase = newPhase;
  sig.timer = PHASE_DURATION[newPhase];
  MANUAL_OVERRIDE[sigId] = true;

  // Fire alert if forced to RED or YELLOW
  if (newPhase === 'red' || newPhase === 'yellow') {
    fireSignalAlert(sig, prevPhase);
  } else if (newPhase === 'green') {
    // Safe zone cleared
    const vendors = sig.vendorsNearby;
    if (vendors.length > 0) {
      addAlertToFeed({
        type: 'success', icon: '✅',
        title: `${sig.name} — GREEN Override`,
        body: `Signal manually set to GREEN. ${vendors.length} vendor(s) notified: safe to trade.`,
        time: new Date(),
      });
      showToast('✅', 'Green Signal Forced', `${sig.name} — vendors cleared as safe`, 'success');
    }
  }

  renderDashboardSignals();
  renderSignalMonitor();
  updateSummaryCards();
}

/* ============================================================
   TOGGLE MANUAL OVERRIDE
   ============================================================ */
function toggleOverride(sigId) {
  const isOverride = MANUAL_OVERRIDE[sigId];
  MANUAL_OVERRIDE[sigId] = !isOverride;

  if (!MANUAL_OVERRIDE[sigId]) {
    // Resuming auto — reset timer cleanly
    const sig = SIGNALS.find(s => s.id === sigId);
    if (sig) sig.timer = PHASE_DURATION[sig.phase];
    showToast('🔄', 'Auto Mode Restored', `${SIGNALS.find(s=>s.id===sigId)?.name} back to automatic`, 'info');
  } else {
    showToast('🎛️', 'Manual Control ON', `${SIGNALS.find(s=>s.id===sigId)?.name} under manual override`, 'warning');
  }

  renderSignalMonitor();
}

/* ============================================================
   FIRE ALERT
   ============================================================ */
function fireSignalAlert(sig, prevPhase) {
  const vendors = sig.vendorsNearby;
  if (vendors.length === 0) return;

  const isEmergency = sig.phase === 'red';
  const alertType   = isEmergency ? 'danger' : 'warning';
  const icon        = isEmergency ? '🚨' : '⚠️';
  const msg         = isEmergency
    ? `Signal turning RED at ${sig.name}! Clear the road NOW.`
    : `Signal turning YELLOW at ${sig.name}. Prepare to move.`;

  ALERT_LOG.unshift({
    id: Date.now(), type: alertType, icon,
    title: `${sig.name} — ${isEmergency ? 'RED Alert' : 'Yellow Warning'}`,
    body:  `${vendors.length} vendor(s): ${vendors.slice(0,2).join(', ')}${vendors.length > 2 ? ' +more' : ''}`,
    time:  new Date(),
  });
  STATS.alertsToday++;
  STATS.totalAlerts++;
  STATS.avgResponseMs = Math.floor(Math.random() * 60) + 120;

  VENDORS.forEach(v => {
    if (v.intersection === sig.name) {
      v.alertsToday++;
      if (isEmergency) v.safetyScore = Math.max(10, v.safetyScore - 2);
    }
  });
  STATS.accidentsPrevented = Math.max(STATS.accidentsPrevented, STATS.totalAlerts - 3);

  renderAlertFeed();
  updateSummaryCards();
  updateBadge();
  showToast(icon, isEmergency ? 'Emergency Alert Sent!' : 'Warning Alert Sent!', msg, alertType);

  if (vendors.length > 0) {
    triggerWearableAlert(isEmergency ? 'emergency' : 'signal_change', msg);
  }
}

/* ============================================================
   RENDER — Dashboard mini cards
   ============================================================ */
function renderDashboardSignals() {
  const container = document.getElementById('signals-overview');
  if (!container) return;
  container.innerHTML = SIGNALS.slice(0, 4).map(sig => `
    <div class="signal-mini">
      <div class="signal-pillar">
        <div class="signal-dot r ${sig.phase==='red'   ?'active':''}"></div>
        <div class="signal-dot y ${sig.phase==='yellow'?'active':''}"></div>
        <div class="signal-dot g ${sig.phase==='green' ?'active':''}"></div>
      </div>
      <div class="signal-info">
        <strong>${sig.name}</strong>
        <span style="font-size:0.68rem;color:var(--text-muted)">${sig.city} · ${sig.id}</span>
        <span class="signal-phase phase-${sig.phase}">${sig.phase.toUpperCase()} — ${sig.timer}s
          ${MANUAL_OVERRIDE[sig.id] ? '<span style="font-size:0.6rem;margin-left:4px">🎛️ MANUAL</span>' : ''}
        </span>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   RENDER — Full Signal Monitor cards with controls
   ============================================================ */
function renderSignalMonitor() {
  const grid = document.getElementById('signals-grid');
  if (!grid) return;

  const visibleSignals = ACTIVE_CITY_FILTER === 'all'
    ? SIGNALS
    : SIGNALS.filter(s => s.city === ACTIVE_CITY_FILTER);

  if (visibleSignals.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">
      <div style="font-size:3rem;margin-bottom:12px">📭</div>
      <div style="font-size:1rem;font-weight:600">No signals found for this city</div>
      <div style="font-size:0.85rem;margin-top:6px">Click <strong>Add Signal</strong> to register one</div>
    </div>`;
    return;
  }

  grid.innerHTML = visibleSignals.map(sig => {
    const pct       = Math.round((sig.timer / PHASE_DURATION[sig.phase]) * 100);
    const vendors   = sig.vendorsNearby;
    const isManual  = MANUAL_OVERRIDE[sig.id];
    const phaseColor = PHASE_COLORS[sig.phase];
    const riskColor  = sig.riskScore > 70 ? '#ef4444' : sig.riskScore > 45 ? '#eab308' : '#22c55e';

    return `
    <div class="signal-card ${isManual ? 'manual-mode' : ''}" id="card-${sig.id}">

      <!-- ── Header: Name + Location ── -->
      <div class="signal-card-header">
        <div class="signal-name-block">
          <div class="signal-card-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:${phaseColor};flex-shrink:0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${sig.name}
          </div>
          <div class="signal-location-row">
            <span class="loc-badge">${sig.id}</span>
            <span class="loc-city">📍 ${sig.city}</span>
            ${isManual ? '<span class="manual-badge">🎛️ MANUAL</span>' : '<span class="auto-badge">🔄 AUTO</span>'}
          </div>
        </div>
        <div class="phase-pill phase-pill-${sig.phase}">${sig.phase.toUpperCase()}</div>
      </div>

      <!-- ── Signal Light ── -->
      <div class="signal-display signal-display-glow-${sig.phase}">
        <div class="signal-bulb r ${sig.phase==='red'   ?'active':''}"></div>
        <div class="signal-bulb y ${sig.phase==='yellow'?'active':''}"></div>
        <div class="signal-bulb g ${sig.phase==='green' ?'active':''}"></div>
      </div>

      <!-- ── Stats Grid ── -->
      <div class="signal-stats">
        <div class="sstat">
          <span>⏱ Phase ends</span>
          <strong style="color:${phaseColor}">${sig.timer}s</strong>
        </div>
        <div class="sstat">
          <span>🚗 Vehicles/min</span>
          <strong>${sig.vehicleCount}</strong>
        </div>
        <div class="sstat">
          <span>⚠️ Risk Score</span>
          <strong style="color:${riskColor}">${sig.riskScore}</strong>
        </div>
        <div class="sstat">
          <span>👨‍💼 Vendors</span>
          <strong style="color:var(--blue)">${vendors.length}</strong>
        </div>
      </div>

      <!-- ── Countdown Bar ── -->
      <div class="countdown-bar">
        <div class="countdown-fill" style="width:${pct}%;background:${phaseColor}"></div>
      </div>
      <div class="phase-timer">
        ${isManual ? '🎛️ Manually controlled' : `Auto: ${sig.timer}s left → Next: <strong>${PHASE_ORDER[sig.phase].toUpperCase()}</strong>`}
      </div>

      <!-- ── Vendors Nearby ── -->
      ${vendors.length > 0 ? `
      <div class="vendor-nearby">
        <div class="label">👥 Nearby Vendors</div>
        <div class="vn-chips">
          ${vendors.map(n => `<span class="vn-chip">${n}</span>`).join('')}
        </div>
      </div>` : '<div class="no-vendor-note">No vendors registered at this signal</div>'}

      <!-- ── MANUAL CONTROL PANEL ── -->
      <div class="control-strip">
        <div class="control-strip-label">Signal Control</div>
        <div class="ctrl-btns">
          <button class="ctrl-btn ctrl-red   ${sig.phase==='red'   ?'ctrl-active':''}"
            onclick="setSignalPhase('${sig.id}','red')"
            title="Force RED — Stop traffic, alert vendors">
            🔴 RED
          </button>
          <button class="ctrl-btn ctrl-yellow ${sig.phase==='yellow'?'ctrl-active':''}"
            onclick="setSignalPhase('${sig.id}','yellow')"
            title="Force YELLOW — Caution warning">
            🟡 YLW
          </button>
          <button class="ctrl-btn ctrl-green  ${sig.phase==='green' ?'ctrl-active':''}"
            onclick="setSignalPhase('${sig.id}','green')"
            title="Force GREEN — Allow traffic, vendors safe">
            🟢 GRN
          </button>
        </div>
        <button class="ctrl-toggle ${isManual ? 'ctrl-resume' : 'ctrl-manual'}"
          onclick="toggleOverride('${sig.id}')">
          ${isManual
            ? '▶ Resume Auto'
            : '🎛️ Manual Mode'}
        </button>
      </div>

    </div>`;
  }).join('');
}

/* ============================================================
   START ENGINE
   ============================================================ */
function startSignalEngine() {
  if (signalIntervalId) clearInterval(signalIntervalId);
  signalIntervalId = setInterval(tickSignals, 1000);
}
