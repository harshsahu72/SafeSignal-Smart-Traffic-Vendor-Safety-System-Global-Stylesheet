// ===================================================
//  SafeSignal — Chart Engine (Canvas-based, no lib)
// ===================================================

let trafficHistory = {};
let chartInterval = null;

function initCharts() {
  // Initialize traffic history per intersection
  INTERSECTIONS.forEach(int => {
    trafficHistory[int.name] = Array.from({length: 60}, () => Math.floor(Math.random() * 80 + 10));
  });
  populateChartFilter();
  drawTrafficChart();
  drawBarChart();
  drawDonutChart();
  drawHourlyChart();
  renderRiskList();
  renderPerfStats();

  chartInterval = setInterval(() => {
    INTERSECTIONS.forEach(int => {
      trafficHistory[int.name].push(Math.floor(Math.random() * 80 + 10));
      if (trafficHistory[int.name].length > 60) trafficHistory[int.name].shift();
    });
    drawTrafficChart();
  }, 2000);
}

/* ---- Populate Chart Filter Dropdown ---- */
function populateChartFilter() {
  const sel = document.getElementById('chart-filter');
  if (!sel) return;
  const cities = [...new Set(INTERSECTIONS.map(i => i.city))];
  sel.innerHTML = `<option value="all">All Intersections</option>` +
    cities.map(city => `
      <optgroup label="📍 ${city}">
        ${INTERSECTIONS.filter(i => i.city === city).map(i =>
          `<option value="${i.name}">${i.name}</option>`
        ).join('')}
      </optgroup>`
    ).join('');
}

/* ---- Traffic Flow Line Chart ---- */
function drawTrafficChart() {
  const canvas = document.getElementById('traffic-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = (canvas.parentElement.dataset.height ? parseInt(canvas.parentElement.dataset.height) : 180) * dpr;
  canvas.style.width  = rect.width + 'px';
  canvas.style.height = '180px';
  ctx.scale(dpr, dpr);

  const W = rect.width, H = 180;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (iH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#5a6a85';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(100 - i * 25)), pad.left - 6, y + 4);
  }

  const filter = document.getElementById('chart-filter')?.value || 'all';
  const intNames = filter === 'all' ? INTERSECTIONS.slice(0,3).map(i=>i.name) : [filter];
  const colors = ['#6366f1','#22c55e','#f97316'];
  const lineW = 2;

  intNames.forEach((name, ci) => {
    const data = trafficHistory[name] || [];
    if (data.length < 2) return;
    const maxVal = 120;
    const step = iW / (data.length - 1);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, H);
    grad.addColorStop(0, colors[ci] + '44');
    grad.addColorStop(1, colors[ci] + '00');

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + i * step;
      const y = pad.top + iH * (1 - v / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + (data.length - 1) * step, H - pad.bottom);
    ctx.lineTo(pad.left, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = colors[ci];
    ctx.lineWidth = lineW;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = pad.left + i * step;
      const y = pad.top + iH * (1 - v / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Legend
    ctx.fillStyle = colors[ci];
    ctx.beginPath(); ctx.arc(pad.left + ci * 80, H - 8, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8b9dbf';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(name.split(' ')[0], pad.left + ci * 80 + 10, H - 4);
  });
}

/* ---- Bar Chart: Alerts by Intersection ---- */
function drawBarChart() {
  const canvas = document.getElementById('bar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = (rect.width || 400) * dpr;
  canvas.height = 200 * dpr;
  canvas.style.width = (rect.width || 400) + 'px';
  canvas.style.height = '200px';
  ctx.scale(dpr, dpr);

  const W = rect.width || 400, H = 200;
  const pad = { top: 16, right: 16, bottom: 48, left: 40 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  // Mock 7-day data per intersection
  const data = INTERSECTIONS.map(int => ({
    name: int.name.split(' ')[0],
    value: Math.floor(Math.random() * 60 + 10),
    color: int.riskScore > 70 ? '#ef4444' : int.riskScore > 45 ? '#eab308' : '#22c55e',
  }));

  const maxVal = Math.max(...data.map(d=>d.value));
  const barW = Math.min(40, iW / data.length - 12);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (iH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#5a6a85';
    ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal * (1 - i/4)), pad.left - 6, y + 4);
  }

  data.forEach((d, i) => {
    const x = pad.left + (i / data.length) * iW + (iW / data.length - barW) / 2;
    const barH = (d.value / maxVal) * iH;
    const y = pad.top + iH - barH;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, d.color);
    grad.addColorStop(1, d.color + '66');

    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    // Value label
    ctx.fillStyle = d.color;
    ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(d.value, x + barW / 2, y - 6);

    // X label
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px Inter';
    ctx.fillText(d.name, x + barW / 2, H - pad.bottom + 14);
  });
}

/* ---- Donut Chart: Alert Types ---- */
function drawDonutChart() {
  const canvas = document.getElementById('donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = Math.min(canvas.parentElement.clientWidth || 300, 200);
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2, r = size * 0.36, innerR = size * 0.22;
  const segments = [
    { label: 'Signal Change',  value: 42, color: '#6366f1' },
    { label: 'Traffic Surge',  value: 28, color: '#f97316' },
    { label: 'Emergency',      value: 12, color: '#ef4444' },
    { label: 'Safe Zone',      value: 18, color: '#22c55e' },
  ];
  const total = segments.reduce((s, d) => s + d.value, 0);
  let startAngle = -Math.PI / 2;

  segments.forEach(seg => {
    const angle = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += angle;
  });

  // Inner circle (donut hole)
  ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#1a2235'; ctx.fill();

  // Center text
  ctx.fillStyle = '#f1f5f9'; ctx.font = `bold ${size * 0.12}px Space Grotesk`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 6);
  ctx.fillStyle = '#5a6a85'; ctx.font = `${size * 0.07}px Inter`;
  ctx.fillText('alerts', cx, cy + 10);

  // Legend
  const legendEl = document.getElementById('donut-legend');
  if (legendEl) {
    legendEl.innerHTML = segments.map(s => `
      <div class="legend-entry">
        <div class="legend-dot-sm" style="background:${s.color}"></div>
        ${s.label} (${Math.round(s.value/total*100)}%)
      </div>`).join('');
  }
}

/* ---- Hourly Chart ---- */
function drawHourlyChart() {
  const canvas = document.getElementById('hourly-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = (rect.width || 600) * dpr;
  canvas.height = 160 * dpr;
  canvas.style.width = (rect.width || 600) + 'px';
  canvas.style.height = '160px';
  ctx.scale(dpr, dpr);

  const W = rect.width || 600, H = 160;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  ctx.clearRect(0, 0, W, H);

  const hours = Array.from({length: 24}, (_, i) => i);
  const now = new Date().getHours();
  const data = hours.map(h => {
    // Peak hours 7-10, 16-20
    const isPeak = (h >= 7 && h <= 10) || (h >= 16 && h <= 20);
    const isFuture = h > now;
    return isFuture ? 0 : Math.floor((isPeak ? 15 : 5) + Math.random() * (isPeak ? 20 : 8));
  });
  const maxVal = Math.max(...data, 1);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = pad.top + (iH / 3) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
  }

  const step = iW / (hours.length - 1);
  const grad = ctx.createLinearGradient(0, pad.top, 0, H);
  grad.addColorStop(0, '#a855f744');
  grad.addColorStop(1, '#a855f700');

  // Fill
  ctx.beginPath();
  hours.forEach((h, i) => {
    const x = pad.left + i * step;
    const y = pad.top + iH * (1 - data[i] / maxVal);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(pad.left + (hours.length - 1) * step, H - pad.bottom);
  ctx.lineTo(pad.left, H - pad.bottom); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath(); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  hours.forEach((h, i) => {
    const x = pad.left + i * step;
    const y = pad.top + iH * (1 - data[i] / maxVal);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // X labels
  [0, 6, 12, 18, 23].forEach(h => {
    const x = pad.left + h * step;
    ctx.fillStyle = '#5a6a85'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`${h}:00`, x, H - pad.bottom + 14);
  });

  // Current time marker
  const nowX = pad.left + now * step;
  ctx.beginPath(); ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.moveTo(nowX, pad.top); ctx.lineTo(nowX, H - pad.bottom); ctx.stroke();
  ctx.setLineDash([]);
}

/* ---- Risk List ---- */
function renderRiskList() {
  const el = document.getElementById('risk-list');
  if (!el) return;
  const sorted = [...INTERSECTIONS].sort((a,b) => b.riskScore - a.riskScore);
  el.innerHTML = sorted.map((int, i) => {
    const color = int.riskScore > 70 ? 'var(--red)' : int.riskScore > 45 ? 'var(--yellow)' : 'var(--green)';
    const bgColor = int.riskScore > 70 ? 'rgba(239,68,68,0.12)' : int.riskScore > 45 ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)';
    return `
    <div class="risk-item">
      <div class="risk-rank">${i+1}</div>
      <div class="risk-name">${int.name}</div>
      <div class="risk-score" style="background:${bgColor};color:${color}">${int.riskScore}</div>
    </div>`;
  }).join('');
}

/* ---- Performance Stats ---- */
function renderPerfStats() {
  const el = document.getElementById('perf-stats');
  if (!el) return;
  const stats = [
    { label: 'Alert Delivery Rate',  value: '99.2%',   pct: 99,  color: 'var(--green)' },
    { label: 'Avg Response Time',    value: '142ms',    pct: 80,  color: 'var(--blue)' },
    { label: 'Network Uptime',       value: '99.97%',   pct: 99,  color: 'var(--green)' },
    { label: 'Wearable Battery Avg', value: '76%',      pct: 76,  color: 'var(--yellow)' },
    { label: 'False Alert Rate',     value: '1.8%',     pct: 18,  color: 'var(--red)' },
  ];
  el.innerHTML = stats.map(s => `
    <div class="perf-row">
      <div class="perf-label">${s.label}</div>
      <div class="perf-bar"><div class="perf-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
      <div class="perf-value" style="color:${s.color}">${s.value}</div>
    </div>`).join('');
}

/* ---- Helpers ---- */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
