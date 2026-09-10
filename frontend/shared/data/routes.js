/**
 * CHENNAI-IQ — Candidate Corridors & Route Alternatives
 * Corridor: Guindy Hub (Chennai) -> Velachery Emergency Relief Center
 */
export const seedRoutes = [
  {
    id: 'ROUTE-A',
    name: 'Route A (Original route via Velachery Main Road S217)',
    distanceKm: 14.3,
    estMinutes: 29,
    baseRiskScore: 82,
    riskScore: 82,
    status: 'BLOCKED', // ACTIVE | BLOCKED | ALTERNATIVE | RECOMMENDED
    roadType: 'Direct Urban Arterial (Traverses Low-Lying Velachery Basin)',
    segmentIds: ['S217', 'S222'],
    points: [
      [13.0067, 80.2025], // Guindy Hub
      [12.9910, 80.2110], // Checkpost Junction
      [12.9772, 80.2215], // Velachery Main Rd (S217 - Inundation Zone)
      [12.9815, 80.2180]  // Velachery Emergency Center
    ],
    floodExposureSummary: 'Direct route traversing Velachery micro-basin (S217). Severe stormwater inundation and waterlogging make passage hazardous.'
  },
  {
    id: 'ROUTE-B',
    name: 'Route B (Recommended route via GST Road / Kathipara Elevated Flyover)',
    distanceKm: 17.1,
    estMinutes: 34,
    baseRiskScore: 38,
    riskScore: 38,
    status: 'RECOMMENDED',
    roadType: 'Reinforced Grade-Separated Highway & Elevated Flyover Corridor',
    segmentIds: ['S219', 'S221'],
    points: [
      [13.0067, 80.2025], // Guindy Hub
      [13.0080, 80.2080], // Kathipara Elevated Flyover (High clearance)
      [12.9950, 80.2150], // GST Road Elevated Span
      [12.9850, 80.2200], // Phoenix Marketcity Link Elevated
      [12.9815, 80.2180]  // Velachery Emergency Center
    ],
    floodExposureSummary: 'RECOMMENDED ROUTE: Lower estimated flood-access risk with a small travel-time increase (+5 min). Avoids low-lying stormwater stagnation points.'
  },
  {
    id: 'ROUTE-C',
    name: 'Route C (Alternative via Inner Ring Road)',
    distanceKm: 18.0,
    estMinutes: 36,
    baseRiskScore: 54,
    riskScore: 54,
    status: 'ALTERNATIVE',
    roadType: 'Secondary Ring Road Corridor',
    segmentIds: ['S223'],
    points: [
      [13.0067, 80.2025], // Guindy Hub
      [13.0180, 80.2080], // Guindy Link
      [13.0050, 80.2260], // Inner Ring Road (S223)
      [12.9880, 80.2250], // Taramani Link
      [12.9815, 80.2180]  // Velachery Emergency Center
    ],
    floodExposureSummary: 'Alternative bypass via Inner Ring Road. Moderate risk due to localized shoulder waterlogging.'
  },
  {
    id: 'ROUTE-D',
    name: 'Route D (Emergency Bypass Corridor)',
    distanceKm: 21.5,
    estMinutes: 42,
    baseRiskScore: 28,
    riskScore: 28,
    status: 'ALTERNATIVE',
    roadType: 'Outer Perimeter Heavy Convoy Route',
    segmentIds: ['S220', 'S222'],
    points: [
      [13.0067, 80.2025], // Guindy Hub
      [13.0120, 80.1850], // St Thomas Mount Outer
      [12.9750, 80.1950], // Medavakkam Link
      [12.9815, 80.2180]  // Velachery Emergency Center
    ],
    floodExposureSummary: 'Longer perimeter routing reserved for auxiliary emergency support.'
  }
];
