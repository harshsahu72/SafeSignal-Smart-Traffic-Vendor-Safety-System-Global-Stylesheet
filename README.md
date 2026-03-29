# 🚦 SafeSignal — Smart Traffic Vendor Safety System

> **v2.1.0** · AI-powered real-time traffic signal safety platform for street vendors across India

SafeSignal is a fully browser-based dashboard that monitors live traffic signals, alerts registered street vendors through wearable devices, and prevents road accidents at busy intersections — across multiple Indian cities.

---

## 📸 Features at a Glance

| Feature | Description |
|---|---|
| 🟢 Live Signal Monitor | Real-time traffic light phases with auto/manual control |
| 📲 Wearable Alerts | Simulate vibration + alert delivery to vendor wearables |
| 👩‍💼 Vendor Registry | Register, search, and manage street vendors |
| 📊 Safety Analytics | Charts for alerts, risk scores, and system performance |
| 🗺️ Intersection Map | Multi-city SVG map with vendor dot overlays |
| 🚨 Emergency Broadcast | One-click alert to all active vendors instantly |
| 🏙️ Multi-City Support | Bhopal · Delhi · Punjab LASO · Ranchi LASO (+ more) |
| ➕ Add Signal / Vendor | Dynamically register new intersections and vendors |

---

## 🗂️ Project Structure

```
4.01/
├── index.html       # Main app shell — all tabs, modals, and layout
├── style.css        # Full dark-mode design system (CSS variables + components)
├── data.js          # Central data store — INTERSECTIONS, VENDORS, SIGNALS, STATS
├── signals.js       # Signal engine — tick loop, manual override, city filter tabs
├── vendors.js       # Vendor table, safety list, add/alert vendor logic
├── charts.js        # Canvas-based charts — traffic line, bar, donut, hourly
├── wearable.js      # Wearable alert simulator — smart band preview, vibration demo
├── map.js           # SVG intersection map — multi-city zone layout
└── app.js           # App init, navigation, modals, toasts, emergency broadcast
```

> **Flat structure** — no subfolders. All files live in the same directory. Just open `index.html` in a browser.

---

## 🚀 Getting Started

No build step. No dependencies. No server required.

```bash
# Clone or download the project
# Then simply open:
index.html
```

Or serve it locally for full feature access:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

---

## 🏙️ Cities & Intersections

| City | Intersections | LASO |
|---|---|---|
| **Bhopal** | MG Road Junction, Nehru Nagar Chowk, Rajiv Chowk, Laxmi Chowk, Sarojini Market Cross, Bus Stand Signal | — |
| **Delhi** | Connaught Place, India Gate Cross, Chandni Chowk Signal, Lajpat Nagar Chowk, Karol Bagh Junction, Sadar Bazaar Cross | — |
| **Punjab** | Golden Temple Cross, Ludhiana Clock Tower, Jalandhar Bus Stand, Patiala Baradari Gate | ✅ LASO |
| **Ranchi** | Albert Square Signal, Firayalal Chowk, Ranchi Station Cross, Kanke Road Junction | ✅ LASO |

> New intersections can be added at runtime via the **Add Signal** button in the Signal Monitor tab.

---

## 📋 Tab Overview

### 1. Dashboard
- **4 KPI cards** — Vendors Safe, Alerts Today, Accidents Prevented, Avg Response Time
- **Live Signal Status** — mini cards for the first 4 intersections, updating every second
- **Alert Feed** — real-time log of all signal change and emergency alerts
- **Traffic Flow Chart** — 60-second rolling line chart, filterable by intersection
- **Vendor Safety Score** — ranked progress bar list of all vendors by safety score

### 2. Signal Monitor
- Full grid of all signal cards (3 columns)
- Each card shows: phase (RED/YELLOW/GREEN), countdown timer, vehicle count, risk score, nearby vendors
- **City filter tabs** — filter view by city instantly
- **Manual Control** — force any signal to any phase; toggle auto/manual mode
- **Add Signal** modal — register new intersections with live preview

### 3. Vendor Registry
- Searchable table of all registered vendors
- Columns: ID, Name/Stall, Intersection, Wearable Device, Status, Risk Level, Alerts Today, Actions
- **Add Vendor** modal — register new vendors linked to any intersection
- **Alert Now** button per vendor — sends instant alert

### 4. Wearable Alerts
- Select vendor, alert type, vibration pattern, custom message
- **Send Alert** to individual vendor or **Broadcast to All**
- **Smart Band Preview** — animated OLED-style wearable display with shake animation
- **Delivery Log** — timestamped log of all dispatched alerts

### 5. Analytics
- **Bar Chart** — Alerts by intersection over 7 days
- **Donut Chart** — Alert type distribution (Signal Change / Traffic Surge / Emergency / Safe Zone)
- **Hourly Chart** — Today's safety events by hour with peak-hour highlighting
- **Top Risk Intersections** — ranked list with color-coded scores
- **System Performance** — uptime, response time, battery avg, false alert rate

### 6. Intersection Map
- SVG canvas map divided into **city zones**
- Each signal shown as a glowing node with live phase color
- Blue vendor dots scattered near their intersection
- Sidebar legend + grouped intersection list (by city)

---

## ⚙️ How It Works

```
data.js          → Single source of truth for all INTERSECTIONS, VENDORS, SIGNALS, STATS
    ↓
signals.js       → setInterval every 1s → tickSignals() → auto phase transitions → fireSignalAlert()
    ↓
app.js           → renderAlertFeed() + updateSummaryCards() + showToast()
    ↓
wearable.js      → triggerWearableAlert() → band shake + vibration ring animation
    ↓
charts.js        → drawTrafficChart() every 2s → canvas re-draw
    ↓
map.js           → renderIntersectionMap() on tab switch → fresh SVG generation
```

---

## 🎨 Design System

Built with pure **Vanilla CSS** — no Tailwind, no framework.

| Token | Value |
|---|---|
| Background | `#0a0e1a` (deep navy) |
| Surface | `#111827` |
| Card | `#1a2235` |
| Accent | `#6366f1` (indigo) |
| Green | `#22c55e` |
| Red | `#ef4444` |
| Yellow | `#eab308` |
| Font Main | Inter |
| Font Display | Space Grotesk |

All colors are CSS custom properties (`var(--green)`, `var(--accent)`, etc.) defined in `:root`.

---

## 🧩 Adding a New City

1. Add intersections to `INTERSECTIONS` array in `data.js` with a new `city` value
2. Add vendors to `VENDORS` array referencing the intersection names
3. Add the city color to `cityColors` objects in `signals.js` and `map.js`
4. Add `<option>` to the city `<select>` in `index.html` (Add Signal modal)

The city filter tab, map zone, and intersection list update **automatically**.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic) |
| Styling | Vanilla CSS3 (CSS variables, Grid, Flexbox, animations) |
| Logic | Vanilla JavaScript (ES6+, no frameworks) |
| Charts | Canvas 2D API (no Chart.js) |
| Map | SVG (dynamically generated) |
| Fonts | Google Fonts — Inter + Space Grotesk |

**Zero npm. Zero build tools. Zero dependencies.**

---

## 👨‍💻 Author
**Harsh Kumar**
Frontend Developer | Student


---

## 📄 License

This project is for educational and demonstration purposes.
