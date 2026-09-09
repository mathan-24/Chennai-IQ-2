/**
 * CHENNAI-IQ — Road Segments Data Model & Baseline Environmental Attributes
 * Monitoring Unit: Individual Chennai Road Segments.
 * 
 * Environmental Factors:
 * - elevationSusceptibility (0-1): Lower elevation & natural depression areas have higher susceptibility.
 * - drainageSusceptibility (0-1): Poor drainage / storm canal catchment backwater risk.
 * - roadVulnerability (0-1): Pavement type, embankment height, culvert bottlenecks.
 * 
 * Prototype Risk Formula:
 * risk_score = 100 * (0.45 * rainfall_factor + 0.25 * elevation_factor + 0.20 * drainage_factor + 0.10 * road_vulnerability_factor)
 */

export const CHENNAI_ROAD_SEGMENTS = [
  {
    segmentId: 'S217',
    roadName: 'Velachery Main Road (Vijayanagar - Lake Inflow Stretch)',
    roadType: 'Primary Arterial',
    zone: 'Zone 13 - South Chennai (Adyar / Velachery Basin)',
    geometry: [
      [12.9815, 80.2180],
      [12.9772, 80.2215],
      [12.9710, 80.2235],
      [12.9640, 80.2210]
    ],
    elevationSusceptibility: 0.90, // Low-lying basin adjoining Velachery lake overflow
    drainageSusceptibility: 0.85,  // Canal choke point / backflow from Pallikaranai marsh
    roadVulnerability: 0.70,       // Dense commercial margins, grade bottlenecks
    operationalStatus: 'NORMAL',   // NORMAL | AT RISK | WATERLOGGED | PARTIALLY BLOCKED | BLOCKED | CONFLICTING | UNDER VERIFICATION
    baseRiskScore: 60,
    currentRiskScore: 60,
    currentRiskLevel: 'MODERATE',  // LOW (0-30), MODERATE (31-60), HIGH (61-80), CRITICAL (81-100)
    historicalDisruptions: 'Flooded in 2015, 2021, 2023 Michaung (Submerged up to 1.2m)',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  },
  {
    segmentId: 'S218',
    roadName: 'Rajiv Gandhi Salai / OMR IT Expressway (Perungudi - SRP)',
    roadType: 'Major Dual-Carriageway Expressway',
    zone: 'Zone 14 - OMR IT Corridor',
    geometry: [
      [12.9660, 80.2450],
      [12.9550, 80.2465],
      [12.9420, 80.2440],
      [12.9310, 80.2415]
    ],
    elevationSusceptibility: 0.65,
    drainageSusceptibility: 0.60,
    roadVulnerability: 0.45,
    operationalStatus: 'NORMAL',
    baseRiskScore: 48,
    currentRiskScore: 48,
    currentRiskLevel: 'MODERATE',
    historicalDisruptions: 'Localized service lane flooding at Perungudi toll section',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  },
  {
    segmentId: 'S219',
    roadName: 'Grand Southern Trunk (GST) Road (Kathipara - Guindy Flyover)',
    roadType: 'National Highway Grade Expressway',
    zone: 'Zone 12 - Alandur / Guindy Hub',
    geometry: [
      [12.9960, 80.1980],
      [13.0030, 80.2035],
      [13.0085, 80.2110],
      [13.0130, 80.2185]
    ],
    elevationSusceptibility: 0.25, // Elevated flyover & graded macadam highway
    drainageSusceptibility: 0.30,  // High-capacity stormwater outfalls to Adyar river
    roadVulnerability: 0.30,       // Heavy-duty roadbed, wide road clearance
    operationalStatus: 'NORMAL',
    baseRiskScore: 28,
    currentRiskScore: 28,
    currentRiskLevel: 'LOW',
    historicalDisruptions: 'Main flyover carriageway clear; minor ramp ponding in extreme rain',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  },
  {
    segmentId: 'S220',
    roadName: 'Poonamallee High Road (Koyambedu - Maduravoyal Stretch)',
    roadType: 'Primary Arterial Corridor',
    zone: 'Zone 10 - Koyambedu Logistics Hub',
    geometry: [
      [13.0680, 80.1920],
      [13.0695, 80.2050],
      [13.0720, 80.2180],
      [13.0745, 80.2310]
    ],
    elevationSusceptibility: 0.55,
    drainageSusceptibility: 0.50,
    roadVulnerability: 0.40,
    operationalStatus: 'NORMAL',
    baseRiskScore: 42,
    currentRiskScore: 42,
    currentRiskLevel: 'MODERATE',
    historicalDisruptions: 'Waterlogging near Koyambedu market subway underpass',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  },
  {
    segmentId: 'S221',
    roadName: 'Anna Salai / Mount Road (Saidapet - Adyar River Bridge Section)',
    roadType: 'Major Metro Arterial',
    zone: 'Zone 9 - Saidapet / T. Nagar',
    geometry: [
      [13.0180, 80.2220],
      [13.0235, 80.2280],
      [13.0310, 80.2340],
      [13.0400, 80.2410]
    ],
    elevationSusceptibility: 0.45,
    drainageSusceptibility: 0.40,
    roadVulnerability: 0.35,
    operationalStatus: 'NORMAL',
    baseRiskScore: 36,
    currentRiskScore: 36,
    currentRiskLevel: 'MODERATE',
    historicalDisruptions: 'Approaches to Maraimalai Adigal bridge slow during peak river surge',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  },
  {
    segmentId: 'S222',
    roadName: '200 Feet Radial Road (Pallavaram - Thoraipakkam Link)',
    roadType: 'Arterial Link Road',
    zone: 'Zone 14 - Pallikaranai Basin Perimeter',
    geometry: [
      [12.9550, 80.1650],
      [12.9520, 80.1850],
      [12.9490, 80.2050],
      [12.9460, 80.2250]
    ],
    elevationSusceptibility: 0.78, // Traverses edge of Pallikaranai wetland
    drainageSusceptibility: 0.75,  // Culverts overflow during monsoonal runoff
    roadVulnerability: 0.60,
    operationalStatus: 'NORMAL',
    baseRiskScore: 54,
    currentRiskScore: 54,
    currentRiskLevel: 'MODERATE',
    historicalDisruptions: 'Water levels reach 0.5m across causeway sections',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  },
  {
    segmentId: 'S223',
    roadName: 'Inner Ring Road / Jawaharlal Nehru Road (Ekkattuthangal - Ashok Nagar)',
    roadType: 'Divided Urban Arterial',
    zone: 'Zone 11 - Ekkattuthangal Industrial Estate',
    geometry: [
      [13.0200, 80.2040],
      [13.0290, 80.2070],
      [13.0380, 80.2100],
      [13.0480, 80.2115]
    ],
    elevationSusceptibility: 0.70, // Adyar river basin backflow zone
    drainageSusceptibility: 0.65,
    roadVulnerability: 0.50,
    operationalStatus: 'NORMAL',
    baseRiskScore: 50,
    currentRiskScore: 50,
    currentRiskLevel: 'MODERATE',
    historicalDisruptions: 'Industrial estate access waterlogged in heavy downpours',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  },
  {
    segmentId: 'S224',
    roadName: 'East Coast Road (ECR) (Thiruvanmiyur - Akkarai Coastal Stretch)',
    roadType: 'Coastal Highway Corridor',
    zone: 'Zone 15 - Coastal South',
    geometry: [
      [12.9800, 80.2600],
      [12.9600, 80.2580],
      [12.9400, 80.2550],
      [12.9100, 80.2510]
    ],
    elevationSusceptibility: 0.40,
    drainageSusceptibility: 0.45,
    roadVulnerability: 0.35,
    operationalStatus: 'NORMAL',
    baseRiskScore: 35,
    currentRiskScore: 35,
    currentRiskLevel: 'MODERATE',
    historicalDisruptions: 'Sandy soil drains quickly; localized beach road dips pond temporarily',
    lastRiskUpdate: new Date().toLocaleTimeString(),
    lastVerifiedUpdate: 'None recorded'
  }
];
