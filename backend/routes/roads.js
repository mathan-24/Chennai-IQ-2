import express from 'express';
import { calculateSegmentRisk } from '../services/risk-calculator.js';

const router = express.Router();

export const CHENNAI_ROAD_SEGMENTS = [
  {
    segmentId: "S217",
    roadName: "Velachery Main Road (Vijayanagar - Lake Section)",
    roadType: "Primary Arterial",
    zone: "Zone 13 - South Chennai",
    elevationSusceptibility: 0.90,
    drainageSusceptibility: 0.85,
    roadVulnerability: 0.70,
    operationalStatus: "NORMAL",
    geometry: [[12.9815, 80.2180], [12.9772, 80.2215], [12.9710, 80.2235], [12.9640, 80.2210]]
  },
  {
    segmentId: "S218",
    roadName: "OMR IT Expressway (Perungudi - SRP)",
    roadType: "Major Dual-Carriageway Expressway",
    zone: "Zone 14 - OMR IT Corridor",
    elevationSusceptibility: 0.65,
    drainageSusceptibility: 0.60,
    roadVulnerability: 0.45,
    operationalStatus: "NORMAL",
    geometry: [[12.9660, 80.2450], [12.9550, 80.2465], [12.9420, 80.2440], [12.9310, 80.2415]]
  },
  {
    segmentId: "S219",
    roadName: "GST Road (Kathipara - Guindy Flyover)",
    roadType: "National Highway Grade Expressway",
    zone: "Zone 12 - Guindy Hub",
    elevationSusceptibility: 0.25,
    drainageSusceptibility: 0.30,
    roadVulnerability: 0.30,
    operationalStatus: "NORMAL",
    geometry: [[12.9960, 80.1980], [13.0030, 80.2035], [13.0085, 80.2110], [13.0130, 80.2185]]
  },
  {
    segmentId: "S220",
    roadName: "Poonamallee High Road (Koyambedu Stretch)",
    roadType: "Primary Arterial Corridor",
    zone: "Zone 10 - Koyambedu",
    elevationSusceptibility: 0.55,
    drainageSusceptibility: 0.50,
    roadVulnerability: 0.40,
    operationalStatus: "NORMAL",
    geometry: [[13.0680, 80.1920], [13.0695, 80.2050], [13.0720, 80.2180], [13.0745, 80.2310]]
  },
  {
    segmentId: "S221",
    roadName: "Anna Salai (Saidapet Adyar River Bridge)",
    roadType: "Major Metro Arterial",
    zone: "Zone 9 - Saidapet",
    elevationSusceptibility: 0.45,
    drainageSusceptibility: 0.40,
    roadVulnerability: 0.35,
    operationalStatus: "NORMAL",
    geometry: [[13.0180, 80.2220], [13.0235, 80.2280], [13.0310, 80.2340], [13.0400, 80.2410]]
  },
  {
    segmentId: "S222",
    roadName: "200 Feet Radial Road (Pallavaram - Thoraipakkam)",
    roadType: "Arterial Link Road",
    zone: "Zone 14 - Pallikaranai Perimeter",
    elevationSusceptibility: 0.78,
    drainageSusceptibility: 0.75,
    roadVulnerability: 0.60,
    operationalStatus: "NORMAL",
    geometry: [[12.9550, 80.1650], [12.9520, 80.1850], [12.9490, 80.2050], [12.9460, 80.2250]]
  }
];

export function createRoadsRouter(getCurrentRainfall) {
  router.get('/', (req, res) => {
    const rainfall = getCurrentRainfall ? getCurrentRainfall() : 75.0;
    const computed = CHENNAI_ROAD_SEGMENTS.map(s => {
      const calc = calculateSegmentRisk(
        rainfall,
        s.elevationSusceptibility,
        s.drainageSusceptibility,
        s.roadVulnerability
      );
      return {
        ...s,
        currentRiskScore: calc.score,
        currentRiskLevel: calc.level,
        riskFactors: calc.factors,
        currentRainfallMm: rainfall
      };
    });
    res.json({ roads: computed, count: computed.length });
  });

  router.get('/:segmentId/risk', (req, res) => {
    const segment = CHENNAI_ROAD_SEGMENTS.find(s => s.segmentId === req.params.segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    const rainfall = getCurrentRainfall ? getCurrentRainfall() : 75.0;
    const calc = calculateSegmentRisk(
      rainfall,
      segment.elevationSusceptibility,
      segment.drainageSusceptibility,
      segment.roadVulnerability
    );
    res.json({
      segmentId: segment.segmentId,
      roadName: segment.roadName,
      operationalStatus: segment.operationalStatus,
      riskCalculation: calc
    });
  });

  return router;
}

export default createRoadsRouter;
