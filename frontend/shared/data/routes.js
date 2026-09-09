/**
 * CHENNAI-IQ — Candidate Corridors & Route Alternatives
 * Origin: Tambaram Disaster Relief Logistics Base [12.9249, 80.1000]
 * Destination: Chennai Central Emergency Hub (Ripon Building) [13.0827, 80.2750]
 */
export const seedRoutes = [
  {
    id: 'ROUTE-A',
    name: 'Route A (Velachery Arterial Corridor via S217)',
    distanceKm: 24.2,
    estMinutes: 46,
    baseRiskScore: 68,
    riskScore: 68,
    status: 'ACTIVE', // ACTIVE | BLOCKED | ALTERNATIVE | RECOMMENDED
    roadType: 'Direct Urban Arterial (Traverses Low-Lying Velachery Basin)',
    segmentIds: ['S222', 'S217', 'S221'],
    points: [
      [12.9249, 80.1000], // Tambaram Base
      [12.9550, 80.1650], // Pallavaram 200ft Radial Rd (S222)
      [12.9772, 80.2215], // Velachery Main Rd (S217 - Deep Flood Hazard Zone)
      [13.0180, 80.2220], // Saidapet Anna Salai (S221)
      [13.0450, 80.2520], // Gemini Flyover
      [13.0827, 80.2750]  // Ripon Building Central Hub
    ],
    floodExposureSummary: 'Traverses Velachery basin S217 (Elev. 4.2m MSL). Severe inundation risk during monsoonal cloudbursts.'
  },
  {
    id: 'ROUTE-B',
    name: 'Route B (GST Road / Kathipara Elevated Bypass)',
    distanceKm: 27.6,
    estMinutes: 52,
    baseRiskScore: 32,
    riskScore: 32,
    status: 'RECOMMENDED',
    roadType: 'Reinforced Grade-Separated Highway & Elevated Flyovers',
    segmentIds: ['S219', 'S221'],
    points: [
      [12.9249, 80.1000], // Tambaram Base
      [12.9650, 80.1420], // Chromepet Flyover
      [12.9960, 80.1980], // Kathipara Grade Junction (S219 - High clearance)
      [13.0130, 80.2185], // Guindy / Maraimalai Adigal Bridge
      [13.0450, 80.2520], // Mount Road / Anna Salai
      [13.0827, 80.2750]  // Ripon Building Central Hub
    ],
    floodExposureSummary: 'Grade-separated macadam highway avoiding low micro-basins. High drainage clearance via Adyar storm culverts. RECOMMENDED practical route.'
  },
  {
    id: 'ROUTE-C',
    name: 'Route C (Inner Ring Road / Koyambedu Bypass)',
    distanceKm: 31.4,
    estMinutes: 60,
    baseRiskScore: 48,
    riskScore: 48,
    status: 'ALTERNATIVE',
    roadType: 'Outer Bypass Arterial Corridor',
    segmentIds: ['S223', 'S220'],
    points: [
      [12.9249, 80.1000], // Tambaram Base
      [13.0020, 80.1700], // Porur Bypass
      [13.0380, 80.2100], // Inner Ring Road (S223)
      [13.0695, 80.2050], // Koyambedu PH Road (S220)
      [13.0827, 80.2750]  // Ripon Building Central Hub
    ],
    floodExposureSummary: 'Longer perimeter routing. Elevated flyover segments with localized waterlogging near market subways.'
  }
];
