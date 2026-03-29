// ===================================================
//  SafeSignal — Intersection Map (SVG Canvas)
// ===================================================

function initMap() {
  renderIntersectionMap();
  renderIntersectionList();
}

function renderIntersectionMap() {
  const container = document.getElementById('intersection-map');
  if (!container) return;

  const W = container.clientWidth || 700;
  const H = container.clientHeight || 500;
  const colorMap = { red: '#ef4444', green: '#22c55e', yellow: '#eab308' };

  // City colors for zone labels
  const cityColors = {
    Bhopal: '#22c55e', Delhi: '#6366f1', Mumbai: '#f97316',
    Bengaluru: '#a855f7', Hyderabad: '#3b82f6', Chennai: '#ec4899',
    Kolkata: '#14b8a6', Pune: '#eab308', Jaipur: '#f43f5e',
    Punjab: '#eab308', Ranchi: '#ec4899',
  };

  // Group signals by city
  const cities = [...new Set(SIGNALS.map(s => s.city))];
  const cityCount = cities.length;

  // Divide canvas into a grid of zones, one per city
  const cols = Math.ceil(Math.sqrt(cityCount));
  const rows = Math.ceil(cityCount / cols);
  const zoneW = W / cols;
  const zoneH = H / rows;

  // Assign each signal a position within its city zone
  const nodes = [];
  cities.forEach((city, ci) => {
    const col = ci % cols;
    const row = Math.floor(ci / cols);
    const zoneX = col * zoneW;
    const zoneY = row * zoneH;
    const sigs = SIGNALS.filter(s => s.city === city);
    const n = sigs.length;

    sigs.forEach((sig, j) => {
      let cx, cy;
      if (n === 1) {
        cx = zoneX + zoneW / 2;
        cy = zoneY + zoneH / 2;
      } else {
        // Arrange in an ellipse inside the zone
        const angle = (2 * Math.PI * j) / n - Math.PI / 2;
        const rx = zoneW * 0.32;
        const ry = zoneH * 0.32;
        cx = zoneX + zoneW / 2 + rx * Math.cos(angle);
        cy = zoneY + zoneH / 2 + ry * Math.sin(angle);
      }
      nodes.push({ ...sig, cx, cy, zoneX, zoneY, zoneW, zoneH, city });
    });
  });

  // Build inter-city roads (connect nodes in same zone)
  const roads = [];
  cities.forEach(city => {
    const cityNodes = nodes.filter(n => n.city === city);
    for (let i = 0; i < cityNodes.length - 1; i++) {
      roads.push([cityNodes[i], cityNodes[i + 1]]);
    }
    if (cityNodes.length > 2) roads.push([cityNodes[cityNodes.length - 1], cityNodes[0]]);
  });

  // Vendor dots (positioned near their signal node)
  const rng = (seed) => { let x = Math.sin(seed * 9301 + 49297) % 1; return x - Math.floor(x); };
  const vendorDots = VENDORS.map((v, vi) => {
    const node = nodes.find(n => n.name === v.intersection);
    if (!node) return null;
    const angle = rng(vi) * 2 * Math.PI;
    const dist = 22 + rng(vi + 50) * 18;
    return {
      name: v.name, status: v.status,
      cx: node.cx + dist * Math.cos(angle),
      cy: node.cy + dist * Math.sin(angle),
    };
  }).filter(Boolean);

  const citySummary = getCities().slice(1).map(c => `${c}: ${SIGNALS.filter(s=>s.city===c).length}`).join(' · ');

  const svg = `
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="${W}" height="${H}" fill="#0a0e1a"/>
    <rect width="${W}" height="${H}" fill="url(#grid)"/>

    <!-- City zone separators -->
    ${cities.map((city, ci) => {
      const col = ci % cols;
      const row = Math.floor(ci / cols);
      const zX = col * zoneW;
      const zY = row * zoneH;
      const cc = cityColors[city] || '#6366f1';
      return `
      <rect x="${zX + 4}" y="${zY + 4}" width="${zoneW - 8}" height="${zoneH - 8}"
        rx="12" fill="none" stroke="${cc}" stroke-width="1" opacity="0.12"/>
      <text x="${zX + 14}" y="${zY + 22}"
        fill="${cc}" font-family="Space Grotesk" font-size="11" font-weight="700" opacity="0.8">
        📍 ${city}
      </text>`;
    }).join('')}

    <!-- Road network within city zones -->
    ${roads.map(([a, b]) => `
      <line x1="${a.cx}" y1="${a.cy}" x2="${b.cx}" y2="${b.cy}"
        stroke="#1e2d45" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
      <line x1="${a.cx}" y1="${a.cy}" x2="${b.cx}" y2="${b.cy}"
        stroke="#2a3d5a" stroke-width="2" stroke-dasharray="8,8" opacity="0.35"
        stroke-linecap="round"/>
    `).join('')}

    <!-- Vendor dots -->
    ${vendorDots.map(v => `
      <circle cx="${v.cx}" cy="${v.cy}" r="5"
        fill="${v.status === 'active' ? '#3b82f6' : '#6b7280'}"
        opacity="0.85" filter="url(#glow)"/>
      <circle cx="${v.cx}" cy="${v.cy}" r="2.5" fill="white" opacity="0.9"/>
    `).join('')}

    <!-- Signal nodes -->
    ${nodes.map(node => {
      const sigColor = colorMap[node.phase] || '#6366f1';
      const vendors = VENDORS.filter(v => v.intersection === node.name);
      return `
      <g class="map-node" data-id="${node.id}">
        <circle cx="${node.cx}" cy="${node.cy}" r="26" fill="${sigColor}" opacity="0.07"/>
        <circle cx="${node.cx}" cy="${node.cy}" r="20" fill="${sigColor}" opacity="0.1"/>
        <circle cx="${node.cx}" cy="${node.cy}" r="14"
          fill="#1a2235" stroke="${sigColor}" stroke-width="2.5" filter="url(#glow)"/>
        <circle cx="${node.cx}" cy="${node.cy - 5}" r="2.5"
          fill="${node.phase === 'red' ? '#ef4444' : '#ef444433'}"/>
        <circle cx="${node.cx}" cy="${node.cy}" r="2.5"
          fill="${node.phase === 'yellow' ? '#eab308' : '#eab30833'}"/>
        <circle cx="${node.cx}" cy="${node.cy + 5}" r="2.5"
          fill="${node.phase === 'green' ? '#22c55e' : '#22c55e33'}"/>
        <rect x="${node.cx - 44}" y="${node.cy + 18}" width="88" height="24"
          rx="5" fill="#111827" stroke="rgba(255,255,255,0.08)" stroke-width="1" opacity="0.9"/>
        <text x="${node.cx}" y="${node.cy + 30}"
          text-anchor="middle" fill="#f1f5f9" font-family="Inter" font-size="8" font-weight="600">
          ${node.name.split(' ').slice(0,2).join(' ')}
        </text>
        <text x="${node.cx}" y="${node.cy + 39}"
          text-anchor="middle" fill="${sigColor}" font-family="Inter" font-size="7" font-weight="700">
          ${node.phase.toUpperCase()} · ${vendors.length}v
        </text>
      </g>`;
    }).join('')}

    <!-- Title -->
    <text x="16" y="${H - 18}" fill="#f1f5f9" font-family="Space Grotesk" font-size="13" font-weight="700">
      SafeSignal — Multi-City Network
    </text>
    <text x="16" y="${H - 6}" fill="#5a6a85" font-family="Inter" font-size="10">
      ${SIGNALS.length} signals · ${VENDORS.length} vendors · ${citySummary}
    </text>
  </svg>`;

  container.innerHTML = svg;
}

function renderIntersectionList() {
  const el = document.getElementById('intersection-list');
  if (!el) return;

  const cityColors = {
    Bhopal: '#22c55e', Delhi: '#6366f1', Mumbai: '#f97316',
    Bengaluru: '#a855f7', Hyderabad: '#3b82f6', Chennai: '#ec4899',
    Punjab: '#eab308', Ranchi: '#ec4899',
  };

  const cities = [...new Set(SIGNALS.map(s => s.city))];
  el.innerHTML = cities.map(city => {
    const citySigs = SIGNALS.filter(s => s.city === city);
    const cc = cityColors[city] || '#6366f1';
    return `
      <div style="font-size:0.72rem;font-weight:700;color:${cc};letter-spacing:0.05em;margin:8px 0 6px;text-transform:uppercase;">📍 ${city}</div>
      ${citySigs.map(sig => {
        const borderColor = sig.phase === 'red' ? 'var(--red)' : sig.phase === 'green' ? 'var(--green)' : 'var(--yellow)';
        const vendors = VENDORS.filter(v => v.intersection === sig.name).length;
        return `
        <div class="int-item" style="border-left-color:${borderColor}">
          <strong>${sig.name}</strong>
          <span>${sig.phase.toUpperCase()} · ${vendors} vendor(s) · Risk: ${sig.riskScore}</span>
        </div>`;
      }).join('')}`;
  }).join('');
}
