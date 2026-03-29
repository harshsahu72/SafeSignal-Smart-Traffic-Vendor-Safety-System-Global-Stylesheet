// ===================================================
//  SafeSignal — Central Data Store
// ===================================================

const INTERSECTIONS = [
  // ── Bhopal ──
  { id: 'INT-01', name: 'MG Road Junction',      city: 'Bhopal', lat: 23.2599, lng: 77.4126, riskScore: 78 },
  { id: 'INT-02', name: 'Nehru Nagar Chowk',     city: 'Bhopal', lat: 23.2470, lng: 77.4000, riskScore: 55 },
  { id: 'INT-03', name: 'Rajiv Chowk',           city: 'Bhopal', lat: 23.2300, lng: 77.3900, riskScore: 90 },
  { id: 'INT-04', name: 'Laxmi Chowk',           city: 'Bhopal', lat: 23.2650, lng: 77.4200, riskScore: 42 },
  { id: 'INT-05', name: 'Sarojini Market Cross',  city: 'Bhopal', lat: 23.2530, lng: 77.4050, riskScore: 66 },
  { id: 'INT-06', name: 'Bus Stand Signal',       city: 'Bhopal', lat: 23.2580, lng: 77.3970, riskScore: 30 },

  // ── Delhi ──
  { id: 'INT-07', name: 'Connaught Place',        city: 'Delhi',  lat: 28.6315, lng: 77.2167, riskScore: 85 },
  { id: 'INT-08', name: 'India Gate Cross',       city: 'Delhi',  lat: 28.6129, lng: 77.2295, riskScore: 72 },
  { id: 'INT-09', name: 'Chandni Chowk Signal',   city: 'Delhi',  lat: 28.6507, lng: 77.2334, riskScore: 95 },
  { id: 'INT-10', name: 'Lajpat Nagar Chowk',    city: 'Delhi',  lat: 28.5677, lng: 77.2431, riskScore: 60 },
  { id: 'INT-11', name: 'Karol Bagh Junction',    city: 'Delhi',  lat: 28.6517, lng: 77.1900, riskScore: 78 },
  { id: 'INT-12', name: 'Sadar Bazaar Cross',     city: 'Delhi',  lat: 28.6602, lng: 77.2100, riskScore: 88 },

  // ── Punjab LASO ──
  { id: 'INT-13', name: 'Golden Temple Cross',    city: 'Punjab', lat: 31.6200, lng: 74.8765, riskScore: 82 },
  { id: 'INT-14', name: 'Ludhiana Clock Tower',   city: 'Punjab', lat: 30.9010, lng: 75.8573, riskScore: 68 },
  { id: 'INT-15', name: 'Jalandhar Bus Stand',    city: 'Punjab', lat: 31.3260, lng: 75.5762, riskScore: 55 },
  { id: 'INT-16', name: 'Patiala Baradari Gate',  city: 'Punjab', lat: 30.3398, lng: 76.3869, riskScore: 44 },

  // ── Ranchi LASO ──
  { id: 'INT-17', name: 'Albert Square Signal',   city: 'Ranchi', lat: 23.3441, lng: 85.3096, riskScore: 76 },
  { id: 'INT-18', name: 'Firayalal Chowk',        city: 'Ranchi', lat: 23.3617, lng: 85.3317, riskScore: 91 },
  { id: 'INT-19', name: 'Ranchi Station Cross',   city: 'Ranchi', lat: 23.3503, lng: 85.3236, riskScore: 63 },
  { id: 'INT-20', name: 'Kanke Road Junction',    city: 'Ranchi', lat: 23.3860, lng: 85.3000, riskScore: 40 },
];

const VENDOR_COLORS = [
  '#6366f1','#22c55e','#f97316','#a855f7',
  '#3b82f6','#ec4899','#14b8a6','#eab308',
  '#06b6d4','#84cc16','#f43f5e','#8b5cf6',
];

let VENDORS = [
  // Bhopal vendors
  { id:'V-001', name:'Ramesh Patel',     phone:'9876543210', intersection:'MG Road Junction',      city:'Bhopal', stall:'Vegetable/Fruit',    device:'WD-A1F2', hours:'6AM-8PM',  status:'active',  riskLevel:'high',   alertsToday:14, safetyScore:38 },
  { id:'V-002', name:'Sunita Devi',      phone:'9812345678', intersection:'Nehru Nagar Chowk',     city:'Bhopal', stall:'Tea/Snacks',          device:'WD-B3C4', hours:'7AM-9PM',  status:'active',  riskLevel:'medium', alertsToday:6,  safetyScore:72 },
  { id:'V-003', name:'Mohan Yadav',      phone:'9900112233', intersection:'Rajiv Chowk',           city:'Bhopal', stall:'Flower Garlands',     device:'WD-D5E6', hours:'5AM-10PM', status:'active',  riskLevel:'high',   alertsToday:21, safetyScore:22 },
  { id:'V-004', name:'Anita Sharma',     phone:'9988776655', intersection:'Laxmi Chowk',           city:'Bhopal', stall:'Newspaper/Books',     device:'WD-F7G8', hours:'6AM-7PM',  status:'active',  riskLevel:'low',    alertsToday:2,  safetyScore:91 },
  { id:'V-005', name:'Suresh Kumar',     phone:'8899001122', intersection:'Sarojini Market Cross', city:'Bhopal', stall:'Mobile Accessories',  device:'WD-H9I0', hours:'9AM-8PM',  status:'offline', riskLevel:'medium', alertsToday:4,  safetyScore:60 },
  { id:'V-006', name:'Geeta Rajput',     phone:'7700889900', intersection:'Bus Stand Signal',      city:'Bhopal', stall:'Tea/Snacks',          device:'WD-J1K2', hours:'5AM-11PM', status:'active',  riskLevel:'low',    alertsToday:1,  safetyScore:95 },
  { id:'V-007', name:'Karim Ansari',     phone:'9966554433', intersection:'MG Road Junction',      city:'Bhopal', stall:'Vegetable/Fruit',     device:'WD-L3M4', hours:'5AM-9PM',  status:'active',  riskLevel:'high',   alertsToday:18, safetyScore:30 },
  { id:'V-008', name:'Pushpa Bai',       phone:'8811223344', intersection:'Rajiv Chowk',           city:'Bhopal', stall:'Flower Garlands',     device:'WD-N5O6', hours:'6AM-9PM',  status:'active',  riskLevel:'high',   alertsToday:12, safetyScore:44 },

  // Delhi vendors
  { id:'V-009', name:'Rajesh Gupta',     phone:'9111222333', intersection:'Connaught Place',       city:'Delhi',  stall:'Tea/Snacks',          device:'WD-P1Q2', hours:'7AM-10PM', status:'active',  riskLevel:'high',   alertsToday:19, safetyScore:34 },
  { id:'V-010', name:'Meena Kumari',     phone:'9222333444', intersection:'India Gate Cross',      city:'Delhi',  stall:'Flower Garlands',     device:'WD-R3S4', hours:'6AM-9PM',  status:'active',  riskLevel:'medium', alertsToday:7,  safetyScore:68 },
  { id:'V-011', name:'Arjun Saxena',     phone:'9333444555', intersection:'Chandni Chowk Signal',  city:'Delhi',  stall:'Vegetable/Fruit',     device:'WD-T5U6', hours:'5AM-11PM', status:'active',  riskLevel:'high',   alertsToday:25, safetyScore:18 },
  { id:'V-012', name:'Priya Verma',      phone:'9444555666', intersection:'Chandni Chowk Signal',  city:'Delhi',  stall:'Bangles/Jewellery',   device:'WD-V7W8', hours:'9AM-8PM',  status:'active',  riskLevel:'high',   alertsToday:22, safetyScore:26 },
  { id:'V-013', name:'Dinesh Tiwari',    phone:'9555666777', intersection:'Lajpat Nagar Chowk',   city:'Delhi',  stall:'Newspaper/Books',     device:'WD-X9Y0', hours:'6AM-7PM',  status:'active',  riskLevel:'low',    alertsToday:3,  safetyScore:88 },
  { id:'V-014', name:'Suman Lal',        phone:'9666777888', intersection:'Karol Bagh Junction',  city:'Delhi',  stall:'Mobile Accessories',  device:'WD-Z1A2', hours:'10AM-9PM', status:'offline', riskLevel:'medium', alertsToday:5,  safetyScore:55 },
  { id:'V-015', name:'Fatima Begum',     phone:'9777888999', intersection:'Sadar Bazaar Cross',   city:'Delhi',  stall:'Vegetable/Fruit',     device:'WD-B3C4', hours:'5AM-10PM', status:'active',  riskLevel:'high',   alertsToday:28, safetyScore:14 },

  // Punjab LASO vendors
  { id:'V-016', name:'Gurpreet Singh',   phone:'9811001122', intersection:'Golden Temple Cross',  city:'Punjab', stall:'Flower Garlands',     device:'WD-PA01', hours:'4AM-10PM', status:'active',  riskLevel:'high',   alertsToday:17, safetyScore:32 },
  { id:'V-017', name:'Harjinder Kaur',   phone:'9822003344', intersection:'Golden Temple Cross',  city:'Punjab', stall:'Vegetable/Fruit',     device:'WD-PA02', hours:'5AM-9PM',  status:'active',  riskLevel:'high',   alertsToday:11, safetyScore:48 },
  { id:'V-018', name:'Balwant Rai',      phone:'9833004455', intersection:'Ludhiana Clock Tower', city:'Punjab', stall:'Tea/Snacks',           device:'WD-PB01', hours:'6AM-8PM',  status:'active',  riskLevel:'medium', alertsToday:6,  safetyScore:70 },
  { id:'V-019', name:'Paramjit Dhillon', phone:'9844005566', intersection:'Jalandhar Bus Stand',  city:'Punjab', stall:'Newspaper/Books',     device:'WD-PC01', hours:'6AM-7PM',  status:'active',  riskLevel:'low',    alertsToday:2,  safetyScore:90 },

  // Ranchi LASO vendors
  { id:'V-020', name:'Rahul Oraon',      phone:'9611223344', intersection:'Albert Square Signal', city:'Ranchi', stall:'Vegetable/Fruit',     device:'WD-RA01', hours:'6AM-9PM',  status:'active',  riskLevel:'high',   alertsToday:15, safetyScore:40 },
  { id:'V-021', name:'Savita Topno',     phone:'9622334455', intersection:'Firayalal Chowk',     city:'Ranchi', stall:'Flower Garlands',     device:'WD-RB01', hours:'7AM-10PM', status:'active',  riskLevel:'high',   alertsToday:20, safetyScore:28 },
  { id:'V-022', name:'Deepak Mahato',    phone:'9633445566', intersection:'Firayalal Chowk',     city:'Ranchi', stall:'Tea/Snacks',           device:'WD-RB02', hours:'5AM-11PM', status:'offline', riskLevel:'medium', alertsToday:4,  safetyScore:65 },
  { id:'V-023', name:'Anita Tirkey',     phone:'9644556677', intersection:'Ranchi Station Cross', city:'Ranchi', stall:'Bangles/Jewellery',   device:'WD-RC01', hours:'8AM-8PM',  status:'active',  riskLevel:'low',    alertsToday:1,  safetyScore:88 },
];

// Signal state machine: each signal cycles through phases
let SIGNALS = INTERSECTIONS.map((int, i) => ({
  ...int,
  phase: ['red','green','yellow','red','green','red','yellow','green','red','yellow','green','red'][i % 12],
  timer: Math.floor(Math.random() * 30) + 10,
  maxTimer: { red: 45, green: 35, yellow: 8 },
  vehicleCount: Math.floor(Math.random() * 80) + 20,
  peakHour: Math.random() > 0.5,
  vendorsNearby: VENDORS.filter(v => v.intersection === int.name).map(v => v.name),
}));

// Live stats
let STATS = {
  alertsToday: 0,
  accidentsPrevented: 47,
  avgResponseMs: 0,
  totalAlerts: 0,
};

// Alert log
let ALERT_LOG = [];
let DELIVERY_LOG = [];

// Currently selected city filter for Signal Monitor
let ACTIVE_CITY_FILTER = 'all';

// Helper: get unique cities list
function getCities() {
  return ['all', ...new Set(INTERSECTIONS.map(i => i.city))];
}

// Helper: get next INT id
function nextIntId() {
  const nums = INTERSECTIONS.map(i => parseInt(i.id.replace('INT-', '')));
  return 'INT-' + String(Math.max(...nums) + 1).padStart(2, '0');
}

// Helper: get next vendor id
function nextVendorId() {
  const nums = VENDORS.map(v => parseInt(v.id.replace('V-', '')));
  return 'V-' + String(Math.max(...nums) + 1).padStart(3, '0');
}
