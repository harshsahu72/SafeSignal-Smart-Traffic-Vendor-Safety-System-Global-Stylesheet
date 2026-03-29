// ===================================================
//  SafeSignal — Wearable Alert System
// ===================================================

let wearableAlertCount = 0;
const ALERT_ICONS = {
  signal_change: '🚦',
  traffic_surge: '🚗',
  emergency:     '🚨',
  safe_zone:     '✅',
  shift_remind:  '⏰',
};

function initWearable() {
  updateBandClock();
  setInterval(updateBandClock, 1000);

  document.getElementById('send-alert-btn')?.addEventListener('click', sendManualAlert);
  document.getElementById('broadcast-btn')?.addEventListener('click', broadcastToAll);
}

function updateBandClock() {
  const el = document.getElementById('band-time');
  if (!el) return;
  const now = new Date();
  el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function triggerWearableAlert(type, message) {
  const band = document.getElementById('smart-band');
  const statusEl = document.getElementById('band-status');
  const msgEl = document.getElementById('band-message');
  const miniLights = document.querySelectorAll('.band-signal-icon .mini-light');
  const vibDemo = document.getElementById('vibration-demo');
  const dstatAlerts = document.getElementById('dstat-alerts');
  const dstatLast = document.getElementById('dstat-last');

  if (!band) return;

  wearableAlertCount++;

  // Update band UI
  if (statusEl) {
    statusEl.textContent = type === 'emergency' ? 'DANGER!' : 'ALERT!';
    statusEl.style.color = type === 'emergency' ? '#ef4444' : '#eab308';
  }
  if (msgEl) {
    msgEl.textContent = message.slice(0, 50);
    msgEl.style.color = type === 'emergency' ? '#ef4444' : '#eab308';
  }

  // Mini signal lights
  if (miniLights.length >= 3) {
    miniLights.forEach(l => l.classList.remove('active'));
    if (type === 'emergency' || type === 'signal_change') {
      miniLights[0].classList.add('active'); // red
    } else if (type === 'safe_zone') {
      miniLights[2].classList.add('active'); // green
    } else {
      miniLights[1].classList.add('active'); // yellow
    }
  }

  // Shake animation
  band.classList.remove('shake');
  requestAnimationFrame(() => band.classList.add('shake'));
  band.addEventListener('animationend', () => band.classList.remove('shake'), { once: true });

  // Vibration demo overlay
  if (vibDemo) {
    vibDemo.classList.add('active');
    setTimeout(() => vibDemo.classList.remove('active'), 2500);
  }

  // Stats
  if (dstatAlerts) dstatAlerts.textContent = wearableAlertCount;
  if (dstatLast) {
    const now = new Date();
    dstatLast.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }

  // Reset band after 4s
  setTimeout(() => {
    if (statusEl) { statusEl.textContent = 'MONITORING'; statusEl.style.color = ''; }
    if (msgEl)    { msgEl.textContent = 'System Ready'; msgEl.style.color = ''; }
    if (miniLights.length >= 3) miniLights.forEach(l => l.classList.remove('active'));
  }, 4000);
}

function sendManualAlert() {
  const vendorId  = document.getElementById('w-vendor-select')?.value;
  const alertType = document.getElementById('w-alert-type')?.value;
  const vibration = document.getElementById('w-vibration')?.value;
  const message   = document.getElementById('w-message')?.value || 'Safety alert!';

  const icon = ALERT_ICONS[alertType] || '⚠️';

  if (vendorId === 'all') {
    broadcastToAll();
    return;
  }

  const vendor = VENDORS.find(v => v.id === vendorId);
  if (!vendor) { showToast('❌','Error','Select a vendor first','danger'); return; }

  triggerWearableAlert(alertType, message);
  addDeliveryLog(vendor.name, alertType, vibration, icon);
  addAlertToFeed({
    type: alertType === 'emergency' ? 'danger' : 'info',
    icon, title: `${icon} Wearable Alert → ${vendor.name}`,
    body: message, time: new Date(),
  });
  vendor.alertsToday++;
  STATS.alertsToday++;
  updateSummaryCards();
  showToast(icon, 'Alert Delivered!', `${vendor.name}'s wearable vibrated (${vibration})`, 'success');
}

function broadcastToAll() {
  const alertType = document.getElementById('w-alert-type')?.value || 'emergency';
  const message   = document.getElementById('w-message')?.value || 'Emergency broadcast!';
  const icon = ALERT_ICONS[alertType] || '🚨';

  const activeVendors = VENDORS.filter(v => v.status === 'active');
  activeVendors.forEach(v => {
    addDeliveryLog(v.name, alertType, 'sos', icon);
    v.alertsToday++;
  });
  STATS.alertsToday += activeVendors.length;

  triggerWearableAlert(alertType, message);
  addAlertToFeed({
    type: 'danger', icon: '📡',
    title: `📡 Emergency Broadcast to ALL ${activeVendors.length} Vendors`,
    body: message, time: new Date(),
  });
  updateSummaryCards();
  showToast('📡', 'Broadcast Sent!', `All ${activeVendors.length} active vendors notified`, 'danger');
}

function addDeliveryLog(vendorName, type, vibration, icon) {
  const log = document.getElementById('delivery-log');
  if (!log) return;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="log-time">${time}</span>
    ${icon} <span class="log-vendor">${vendorName}</span>
    — ${type.replace('_',' ')} · ${vibration} vibration ✓`;
  log.prepend(entry);

  // Trim to 20 entries
  while (log.children.length > 20) log.removeChild(log.lastChild);
}
