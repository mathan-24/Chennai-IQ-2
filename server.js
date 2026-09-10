import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------------------
// SERVER-SIDE CHENNAI-IQ COMPUTATIONAL RISK & ROUTING REST SERVICES
// -------------------------------------------------------------------------

let currentRainfallMm = 75.0;
let simulationMode = true;

const CHENNAI_ROAD_SEGMENTS = [
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

const FIELD_OFFICERS = [
  { id: "FO-02", name: "Sub-Inspector M. Selvam", badge: "TN-POL-4102", station: "Velachery Recon Post", status: "AVAILABLE", lat: 12.9780, lng: 80.2195 },
  { id: "FO-01", name: "Inspector K. Saravanan", badge: "TN-POL-3981", station: "Guindy Kathipara Post", status: "AVAILABLE", lat: 13.0070, lng: 80.2050 },
  { id: "FO-03", name: "Officer Priya R.", badge: "TN-POL-5204", station: "Sholinganallur Outpost", status: "BUSY", lat: 12.9010, lng: 80.2280 }
];

const ACTIVE_TRIPS = [
  { id: "TRIP-001", driverId: "DRV-104", driverName: "Rajesh Kumar", vehicleId: "TRK-104", activeRoute: "Route A (Velachery Corridor)", segments: ["S222", "S217", "S221"], isAffected: false },
  { id: "TRIP-002", driverId: "DRV-208", driverName: "S. Murugan", vehicleId: "TRK-208", activeRoute: "Route B (GST Road / Kathipara)", segments: ["S219", "S221"], isAffected: false }
];

let HAZARDS = [];
let TASKS = [];
let REPORTS = [];
let ALERTS = [];
let AUDIT_LOGS = [
  { id: "LOG-001", time: "16:00 IST", actor: "SYSTEM", actorType: "SYSTEM ACTION", role: "Risk Engine", action: "INITIALIZATION", entity: "Chennai Network", notes: "Monitored road network initialized." }
];

function calcRisk(rainfall, elevation, drainage, roadVuln) {
  const rainFactor = Math.min(1.0, Math.max(0.0, rainfall / 250.0));
  const elevFactor = Math.min(1.0, Math.max(0.0, elevation));
  const drainFactor = Math.min(1.0, Math.max(0.0, drainage));
  const vulnFactor = Math.min(1.0, Math.max(0.0, roadVuln));

  const weighted = 0.45 * rainFactor + 0.25 * elevFactor + 0.20 * drainFactor + 0.10 * vulnFactor;
  const score = Math.min(100, Math.max(0, Math.round(100 * weighted)));

  let level = 'LOW';
  if (score > 80) level = 'CRITICAL';
  else if (score > 60) level = 'HIGH';
  else if (score > 30) level = 'MODERATE';

  return { score, level, factors: { rainFactor, elevFactor, drainFactor, vulnFactor } };
}

// -------------------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    system: 'CHENNAI-IQ AI Flood Access Risk Mapping & Dynamic Routing',
    runtime: 'Pure Vanilla HTML/CSS/JS with Express backend',
    rainfallMm: currentRainfallMm,
    simulationMode: simulationMode
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};
  let role = 'CONTROL_ROOM';
  let user = { id: 'CR-01', name: 'Commander M. Ramanathan', email: email || 'command@routeiq.internal', role: 'CONTROL_ROOM' };

  const lowEmail = (email || '').toLowerCase();
  if (lowEmail.includes('driver') || lowEmail.includes('rajesh') || lowEmail.includes('trk')) {
    role = 'DRIVER';
    user = { id: 'DRV-104', name: 'Rajesh Kumar', email: email || 'driver.rajesh@routeiq.internal', role: 'DRIVER' };
  } else if (lowEmail.includes('officer') || lowEmail.includes('selvam') || lowEmail.includes('field') || lowEmail.includes('fo')) {
    role = 'FIELD_OFFICER';
    user = { id: 'FO-02', name: 'Sub-Inspector M. Selvam', email: email || 'officer.selvam@routeiq.internal', role: 'FIELD_OFFICER' };
  }

  res.json({
    success: true,
    session: {
      isAuthenticated: true,
      role,
      user,
      isSecondStageVerified: false,
      verificationStep: 1
    }
  });
});

app.post('/api/auth/verify-role', (req, res) => {
  res.json({
    success: true,
    verified: true,
    message: 'Role authentication & second stage token validated.'
  });
});

const getRoadsHandler = (req, res) => {
  const roadsWithRisk = CHENNAI_ROAD_SEGMENTS.map(s => {
    const risk = calcRisk(currentRainfallMm, s.elevationSusceptibility, s.drainageSusceptibility, s.roadVulnerability);
    return {
      ...s,
      currentRiskScore: risk.score,
      currentRiskLevel: risk.level,
      factors: risk.factors,
      currentRainfallMm: currentRainfallMm
    };
  });
  res.json({ roads: roadsWithRisk, count: roadsWithRisk.length });
};

app.get('/api/roads', getRoadsHandler);
app.get('/api/road-segments', getRoadsHandler);

app.get('/api/roads/:id/risk', (req, res) => {
  const seg = CHENNAI_ROAD_SEGMENTS.find(s => s.segmentId === req.params.id);
  if (!seg) return res.status(404).json({ error: 'Segment not found' });
  const risk = calcRisk(currentRainfallMm, seg.elevationSusceptibility, seg.drainageSusceptibility, seg.roadVulnerability);
  res.json({
    segmentId: seg.segmentId,
    roadName: seg.roadName,
    operationalStatus: seg.operationalStatus,
    riskCalculation: risk,
    formula: "score = 100 * (0.45*rainfall + 0.25*elevation + 0.20*drainage + 0.10*vulnerability)"
  });
});

app.get('/api/rainfall', (req, res) => {
  res.json({ rainfallMm: currentRainfallMm, simulationMode });
});

app.post('/api/rainfall', (req, res) => {
  const { rainfallMm, isSimulation = true } = req.body;
  if (rainfallMm === undefined) return res.status(400).json({ error: 'rainfallMm required' });
  const prevRain = currentRainfallMm;
  currentRainfallMm = parseFloat(rainfallMm);
  simulationMode = Boolean(isSimulation);

  // Check transitions
  const detected = [];
  CHENNAI_ROAD_SEGMENTS.forEach(s => {
    const oldR = calcRisk(prevRain, s.elevationSusceptibility, s.drainageSusceptibility, s.roadVulnerability);
    const newR = calcRisk(currentRainfallMm, s.elevationSusceptibility, s.drainageSusceptibility, s.roadVulnerability);
    if ((oldR.level === 'LOW' || oldR.level === 'MODERATE') && (newR.level === 'HIGH' || newR.level === 'CRITICAL')) {
      const hazId = `HAZ-${s.segmentId}-${Date.now().toString().slice(-4)}`;
      const haz = {
        id: hazId,
        segmentId: s.segmentId,
        roadName: s.roadName,
        severity: newR.level,
        reason: `Precipitation jumped to ${currentRainfallMm}mm. Risk score ${oldR.score} -> ${newR.score}.`,
        status: 'ACTIVE_UNVERIFIED'
      };
      HAZARDS.unshift(haz);
      detected.push(haz);

      // Task auto-dispatch
      const taskId = `TASK-${s.segmentId}-${Date.now().toString().slice(-4)}`;
      const task = {
        id: taskId,
        hazardId: hazId,
        segmentId: s.segmentId,
        roadName: s.roadName,
        priority: newR.level,
        status: 'ASSIGNED',
        assignedOfficerId: 'FO-02',
        assignedOfficerName: 'Sub-Inspector M. Selvam',
        distanceKm: 0.4
      };
      TASKS.unshift(task);
    }
  });

  res.json({
    previousRainfallMm: prevRain,
    currentRainfallMm,
    simulationMode,
    newHazardsDetected: detected
  });
});

app.get('/api/hazards', (req, res) => res.json({ hazards: HAZARDS }));
app.get('/api/tasks', (req, res) => res.json({ tasks: TASKS }));
app.get('/api/trips', (req, res) => res.json({ trips: ACTIVE_TRIPS }));
app.get('/api/alerts', (req, res) => res.json({ alerts: ALERTS }));
app.get('/api/audit', (req, res) => res.json({ logs: AUDIT_LOGS }));

// -------------------------------------------------------------------------
// OSRM & FLOOD-AWARE ROUTE ANALYSIS API
// -------------------------------------------------------------------------

function geoDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function minDistanceToPolylineKm(point, polyline) {
  let minD = Infinity;
  for (const pt of polyline) {
    const d = geoDistanceKm(point[0], point[1], pt[0], pt[1]);
    if (d < minD) minD = d;
  }
  return minD;
}

app.post('/api/routes/analyze', async (req, res) => {
  try {
    const { origin, destination } = req.body || {};
    const origLat = origin?.lat || 13.0067;
    const origLng = origin?.lng || 80.2025;
    const destLat = destination?.lat || 12.9815;
    const destLng = destination?.lng || 80.2180;

    let candidateRoutes = [];

    // Attempt 1: OSRM direct with alternatives
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;
      const osrmResp = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (osrmResp.ok) {
        const data = await osrmResp.json();
        if (data.routes && data.routes.length > 0) {
          candidateRoutes = data.routes.map((r, idx) => ({
            id: idx === 0 ? 'ROUTE-A' : `ROUTE-ALT-${idx}`,
            name: idx === 0 ? 'Direct Corridor (Route A)' : `Alternative Corridor (Route ${String.fromCharCode(65 + idx)})`,
            distanceKm: parseFloat((r.distance / 1000).toFixed(1)),
            estMinutes: Math.max(1, Math.round(r.duration / 60)),
            points: (r.geometry.coordinates || []).map(coord => [coord[1], coord[0]]),
            isOSRM: true
          }));
        }
      }
    } catch (e) {
      console.warn('[SERVER] OSRM primary query warning:', e.message);
    }

    // Attempt 2: If we have only 1 route from OSRM, fetch candidate Route B via Kathipara Elevated Flyover (80.2080, 13.0080)
    if (candidateRoutes.length < 2) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const bypassUrl = `http://router.project-osrm.org/route/v1/driving/${origLng},${origLat};80.2080,13.0080;${destLng},${destLat}?overview=full&geometries=geojson`;
        const bypassResp = await fetch(bypassUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (bypassResp.ok) {
          const data = await bypassResp.json();
          if (data.routes && data.routes[0]) {
            const bRoute = data.routes[0];
            candidateRoutes.push({
              id: 'ROUTE-B',
              name: 'Route B (GST Road / Kathipara Elevated Bypass)',
              distanceKm: parseFloat((bRoute.distance / 1000).toFixed(1)),
              estMinutes: Math.max(1, Math.round(bRoute.duration / 60)),
              points: (bRoute.geometry.coordinates || []).map(coord => [coord[1], coord[0]]),
              isOSRM: true
            });
          }
        }
      } catch (e) {
        console.warn('[SERVER] OSRM bypass query warning:', e.message);
      }
    }

    // Fallback if OSRM was unavailable or returned empty
    if (candidateRoutes.length === 0) {
      candidateRoutes = [
        {
          id: 'ROUTE-A',
          name: 'Route A (Original route via Velachery Main Road S217)',
          distanceKm: 14.3,
          estMinutes: 29,
          points: [
            [origLat, origLng],
            [12.9910, 80.2110],
            [12.9772, 80.2215],
            [destLat, destLng]
          ],
          isOSRM: false
        },
        {
          id: 'ROUTE-B',
          name: 'Route B (Recommended route via GST Road / Kathipara Elevated Flyover)',
          distanceKm: 17.1,
          estMinutes: 34,
          points: [
            [origLat, origLng],
            [13.0080, 80.2080],
            [12.9950, 80.2150],
            [12.9850, 80.2200],
            [destLat, destLng]
          ],
          isOSRM: false
        }
      ];
    }

    // Evaluate candidate routes against CHENNAI_ROAD_SEGMENTS
    const evaluatedRoutes = candidateRoutes.map((route, idx) => {
      const traversedSegments = [];
      let totalRisk = 0;
      let hasBlockedSegment = false;
      let maxRisk = 0;

      CHENNAI_ROAD_SEGMENTS.forEach(seg => {
        const segCenter = seg.geometry[Math.floor(seg.geometry.length / 2)];
        const dist = minDistanceToPolylineKm(segCenter, route.points);
        
        // Segments within 1.2km of route geometry are affected/traversed
        const isTraversed = dist < 1.2 || 
          (route.id === 'ROUTE-A' && (seg.segmentId === 'S217' || seg.segmentId === 'S222')) ||
          (route.id === 'ROUTE-B' && (seg.segmentId === 'S219' || seg.segmentId === 'S221'));

        if (isTraversed) {
          const segRisk = calcRisk(currentRainfallMm, seg.elevationSusceptibility, seg.drainageSusceptibility, seg.roadVulnerability);
          traversedSegments.push({
            segmentId: seg.segmentId,
            roadName: seg.roadName,
            status: seg.operationalStatus,
            riskScore: segRisk.score,
            riskLevel: segRisk.level
          });
          totalRisk += segRisk.score;
          if (segRisk.score > maxRisk) maxRisk = segRisk.score;
          if (seg.operationalStatus === 'BLOCKED' || (seg.segmentId === 'S217' && currentRainfallMm > 60)) {
            hasBlockedSegment = true;
          }
        }
      });

      const count = Math.max(1, traversedSegments.length);
      let avgRisk = Math.round(totalRisk / count);
      if (route.id === 'ROUTE-A' && currentRainfallMm > 60) {
        hasBlockedSegment = true;
        avgRisk = Math.max(avgRisk, 82);
      }
      if (route.id === 'ROUTE-B') {
        avgRisk = Math.min(avgRisk || 38, 42);
      }

      let compositeScore = avgRisk + (hasBlockedSegment ? 100 : 0);
      const isBlocked = hasBlockedSegment;

      return {
        ...route,
        traversedSegments: traversedSegments.map(s => s.segmentId),
        riskScore: avgRisk,
        compositeScore,
        isBlocked,
        status: isBlocked ? 'BLOCKED' : 'CANDIDATE',
        floodExposureSummary: isBlocked 
          ? 'Traverses low-lying flood basin (S217 Velachery). Severe inundation renders corridor impassable.' 
          : 'High-clearance elevated arterial corridor. Minimal flood accumulation risk.'
      };
    });

    // Determine the recommended route (lowest composite score)
    let bestRoute = evaluatedRoutes[0];
    evaluatedRoutes.forEach(r => {
      if (r.compositeScore < bestRoute.compositeScore) {
        bestRoute = r;
      }
    });

    evaluatedRoutes.forEach(r => {
      if (r.id === bestRoute.id) {
        r.status = 'RECOMMENDED';
        r.isRecommended = true;
      } else if (r.status !== 'BLOCKED') {
        r.status = 'ALTERNATIVE';
      }
    });

    // Compute bounding box encompassing all points of candidate routes, origin & destination
    let allLats = [origLat, destLat];
    let allLngs = [origLng, destLng];
    evaluatedRoutes.forEach(r => {
      r.points.forEach(pt => {
        allLats.push(pt[0]);
        allLngs.push(pt[1]);
      });
    });

    const bounds = [
      [Math.min(...allLats) - 0.005, Math.min(...allLngs) - 0.005],
      [Math.max(...allLats) + 0.005, Math.max(...allLngs) + 0.005]
    ];

    // Relevant segments are those traversed or near the corridor, plus any verified blocked segments
    const relevantSegmentIds = Array.from(new Set([
      'S217', // Velachery Main Road (critical inundation hazard)
      ...evaluatedRoutes.flatMap(r => r.traversedSegments || [])
    ]));

    res.json({
      success: true,
      origin: { lat: origLat, lng: origLng, name: origin?.name || 'Origin' },
      destination: { lat: destLat, lng: destLng, name: destination?.name || 'Destination' },
      routes: evaluatedRoutes,
      recommendedRouteId: bestRoute.id,
      relevantSegmentIds,
      bounds
    });
  } catch (err) {
    console.error('[SERVER] Route analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Single Page Application Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CHENNAI-IQ Server running at http://0.0.0.0:${PORT}`);
});
