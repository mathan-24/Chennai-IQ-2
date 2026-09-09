/**
 * CHENNAI-IQ — Central Reactive State Store & Business Logic Engine
 * 
 * Core Workflow:
 * Environmental Data (Rainfall) → Flood Risk Engine → Road-Segment Risk → Hazard Detection
 * → Automatic Inspection Task → Nearest Available Field Officer → Field Verification
 * → Verification / Confidence Engine → High-Confidence Automatic Processing OR Control Room Review
 * → Verified Road Condition → Active Trip Impact Analysis → OSRM Candidate Routes
 * → Flood-Aware Route Evaluation → Safer Practical Route → Targeted Driver Alert
 * 
 * Pure Vanilla JavaScript (No React / No Vite).
 */

import { CHENNAI_ROAD_SEGMENTS } from '../data/chennai-roads.js';
import { seedRoutes } from '../data/routes.js';
import { seedFieldOfficers } from '../data/field-officers.js';
import { seedVehicles } from '../data/vehicles.js';
import {
  calculateSegmentRisk,
  detectHazards,
  assignNearestFieldOfficer,
  evaluateVerificationConfidence,
  analyzeTripImpact,
  evaluateCandidateRoutes
} from './risk-engine.js';

const STORAGE_KEY = 'chennai_iq_state_v1';

// Realistic Incident & Flood Photo Presets for Chennai
export const INCIDENT_PHOTO_PRESETS = [
  {
    id: 'preset-velachery-flood',
    title: 'Velachery S217 Lake Basin Submersion (0.8m Depth)',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80',
    type: 'FLOODING',
    thumb: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'preset-omr-waterlogging',
    title: 'OMR S218 Perungudi Inundated Service Lane',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    type: 'WATERLOGGING',
    thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'preset-radial-causeway',
    title: '200ft Radial Road S222 Marsh Causeway Overflow',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    type: 'UNSAFE_PASSAGE',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'preset-tree-block',
    title: 'Anna Salai Fallen Tree Across Dual Lanes',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    type: 'DEBRIS_OBSTRUCTION',
    thumb: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=200&q=80'
  }
];

function createDefaultState() {
  const initialRain = 75; // 75 mm moderate monsoon rain
  
  // Calculate initial risk for each road segment
  const roads = CHENNAI_ROAD_SEGMENTS.map(s => {
    const risk = calculateSegmentRisk(initialRain, s);
    return {
      ...s,
      currentRiskScore: risk.score,
      currentRiskLevel: risk.level,
      riskBreakdown: risk.breakdown,
      lastRiskUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
    };
  });

  return {
    session: {
      isAuthenticated: false,
      role: null, // 'DRIVER' | 'FIELD_OFFICER' | 'CONTROL_ROOM'
      user: null,
      isSecondStageVerified: false,
      verificationStep: 0,
    },

    connectivity: {
      status: 'ONLINE',
      realtime: 'REALTIME CONNECTED',
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      satelliteLatency: '42ms',
      meshNodesActive: 24,
      pendingQueueCount: 0,
      pendingQueue: []
    },

    weather: {
      status: 'LIVE',
      condition: 'Northeast Monsoonal Rainfall (Intensifying Depressions)',
      rainfallMm24h: initialRain,
      rainfallRateMmH: 18.5,
      simulationMode: true,
      simulationLabel: 'SIMULATION MODE (Continuous Variable)',
      tempC: 28,
      humidity: 92,
      windKmh: 38,
      visibilityKm: 4.5,
      barometricHpa: 998,
      lastUpdatedText: 'Updated just now',
      sourceNote: 'IMD Coastal Doppler & Citywide Gauge Ingest (Simulation Active)',
      freshness: 'LIVE'
    },

    systemHealth: {
      operationalApi: 'OPERATIONAL',
      weatherService: 'OPERATIONAL',
      riskEngine: 'OPERATIONAL',
      routingService: 'OPERATIONAL',
      telemetryMesh: 'OPERATIONAL',
      realtimeSync: 'OPERATIONAL'
    },

    roadSegments: roads,
    routes: seedRoutes.map(r => ({ ...r })),
    vehicles: seedVehicles.map(v => ({ ...v })),
    fieldOfficers: seedFieldOfficers.map(o => ({ ...o })),

    activeTrips: [
      {
        id: 'TRIP-001',
        driverId: 'DRV-104',
        driverName: 'Rajesh Kumar',
        vehicleId: 'TRK-104',
        activeRouteId: 'ROUTE-A',
        activeRouteName: 'Route A (Velachery Arterial Corridor via S217)',
        origin: 'Tambaram Disaster Relief Logistics Base',
        destination: 'Chennai Central Emergency Hub (Ripon Building)',
        status: 'ACTIVE',
        isAffected: false
      },
      {
        id: 'TRIP-002',
        driverId: 'DRV-208',
        driverName: 'S. Murugan',
        vehicleId: 'TRK-208',
        activeRouteId: 'ROUTE-B',
        activeRouteName: 'Route B (GST Road / Kathipara Elevated Bypass)',
        origin: 'Tambaram Logistics Base',
        destination: 'Chennai Port Logistics Depot',
        status: 'ACTIVE',
        isAffected: false
      }
    ],

    // Inspection tasks generated automatically on hazard detection
    fieldTasks: [
      {
        id: 'TASK-101',
        hazardId: 'HAZ-INIT-S218',
        segmentId: 'S218',
        roadName: 'OMR IT Expressway (Perungudi)',
        priority: 'MODERATE',
        status: 'COMPLETED',
        assignedOfficerId: 'FO-03',
        assignedOfficerName: 'Officer Priya R.',
        distanceKm: 2.1,
        reason: 'Periodic pre-monsoon storm drain culvert check',
        createdAt: '16:30 IST',
        completedAt: '17:15 IST'
      }
    ],

    networkStatus: 'ONLINE',
    hazards: [],
    fieldReports: [],
    controlRoomExceptions: [], // Uncertain / Conflicting reports requiring review
    alerts: [],
    driverDisruptionAlertActive: false,
    driverPendingDispatch: null,

    // Deliveries & Shipments (reused from Route-IQ for manifest & cold chain display)
    deliveries: [
      {
        id: 'MED-EXP-8801',
        manifestTitle: 'Emergency Pediatric Vaccines & Antivenom (Batch #CHN-42)',
        cargo: 'Life-saving vaccines & cold-chain trauma packages',
        netWeightKg: 1250,
        totalUnits: 950,
        priority: 'CRITICAL',
        vehicleId: 'TRK-104',
        vehiclePlate: 'TN-09-CB-4812',
        driverId: 'DRV-104',
        driverName: 'Rajesh Kumar (Emergency Transport Specialist)',
        origin: 'Tambaram Disaster Relief Logistics Base',
        destination: 'Chennai Central Emergency Hub (Ripon Building)',
        eta: '18:15 IST',
        currentRoute: 'Route A (Velachery Arterial Corridor via S217)',
        status: 'ACTIVE',
        riskReason: 'Monitoring Velachery basin flood susceptibility under monsoonal rainfall.',
        coldChain: {
          temp: '+3.8°C',
          safeRange: '+2.0°C to +8.0°C',
          status: 'NORMAL',
          sensorHealth: 'Nominal (Sensirion SHT35 Digital IoT Probe)',
          lastUpdated: 'Updated 10 sec ago',
          freshness: 'LIVE'
        }
      }
    ],

    auditLogs: [
      {
        id: 'LOG-001',
        time: '16:00 IST',
        actor: 'SYSTEM',
        actorType: 'SYSTEM ACTION',
        role: 'Risk Engine',
        action: 'INITIALIZATION',
        entity: 'Chennai Road Segments',
        notes: 'Chennai-IQ Flood Risk & Road Segment monitoring initialized with 8 baseline sectors.'
      }
    ]
  };
}

export class RouteIQStore {
  constructor() {
    this.subscribers = [];
    this.state = this.loadState();
    this.monitoringTimer = null;
    this.startBackgroundMonitoring();
  }

  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        // Ensure road segments exist
        if (!parsed.roadSegments || parsed.roadSegments.length === 0) {
          return createDefaultState();
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[CHENNAI-IQ] Failed to load cached state, using default:', e);
    }
    return createDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('[CHENNAI-IQ] Failed to persist state:', e);
    }
    this.notify();
  }

  resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = createDefaultState();
    this.saveState();
  }

  getState() {
    return this.state;
  }

  setNetworkStatus(status) {
    if (!this.state) return;
    this.state.networkStatus = status;
    const badge = document.getElementById('network-status-indicator');
    if (badge) {
      badge.textContent = status;
      badge.className = status === 'ONLINE' ? 'badge-status badge-approved' : 'badge-status badge-critical';
    }
    this.notify();
  }

  subscribe(listener) {
    this.subscribers.push(listener);
    return () => {
      this.subscribers = this.subscribers.filter(l => l !== listener);
    };
  }

  notify() {
    this.subscribers.forEach(listener => {
      try {
        listener(this.state);
      } catch (e) {
        console.error('[CHENNAI-IQ] Subscriber execution error:', e);
      }
    });
  }

  // --- Background Monitoring Cycle (Configurable e.g. every 10 min, or faster for demo) ---
  startBackgroundMonitoring(intervalMs = 60000) {
    if (this.monitoringTimer) clearInterval(this.monitoringTimer);
    this.monitoringTimer = setInterval(() => {
      // Background monitoring check: recalculate risk on current rainfall, check transitions
      this.runMonitoringCycle();
    }, intervalMs);
  }

  runMonitoringCycle() {
    const rainfall = this.state.weather.rainfallMm24h;
    const prevRoads = this.state.roadSegments.map(r => ({ ...r }));
    
    // Recalculate
    const updatedRoads = this.state.roadSegments.map(s => {
      const risk = calculateSegmentRisk(rainfall, s);
      return {
        ...s,
        currentRiskScore: risk.score,
        currentRiskLevel: risk.level,
        riskBreakdown: risk.breakdown,
        lastRiskUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
      };
    });

    const newHazards = detectHazards(prevRoads, updatedRoads, this.state.hazards);
    if (newHazards.length > 0) {
      this.handleDetectedHazards(newHazards);
    }

    this.state.roadSegments = updatedRoads;
    this.saveState();
  }

  // --- Rainfall Continuous Adaptation ---
  setRainfall(newMm) {
    const prevMm = this.state.weather.rainfallMm24h;
    const mm = Math.max(0, Math.min(500, Number(newMm)));
    this.state.weather.rainfallMm24h = mm;
    this.state.weather.lastUpdatedText = 'Recalculated just now';
    this.state.weather.lastTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';

    const prevRoads = this.state.roadSegments.map(r => ({ ...r }));

    // Recalculate all road segments
    const updatedRoads = this.state.roadSegments.map(s => {
      const risk = calculateSegmentRisk(mm, s);
      return {
        ...s,
        currentRiskScore: risk.score,
        currentRiskLevel: risk.level,
        riskBreakdown: risk.breakdown,
        lastRiskUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
      };
    });

    // Detect hazard events on meaningful transitions
    const newHazards = detectHazards(prevRoads, updatedRoads, this.state.hazards);

    this.state.roadSegments = updatedRoads;

    this.addAuditLog(
      'Rainfall Gauge',
      'SYSTEM ACTION',
      'Meteorological Feed',
      'PRECIPITATION RECALCULATED',
      `${prevMm} mm → ${mm} mm`,
      `Continuous rainfall updated to ${mm} mm. Citywide road-segment risk dynamically recalculated.`
    );

    if (newHazards.length > 0) {
      this.handleDetectedHazards(newHazards);
    }

    // Re-evaluate routes
    this.reevaluateRoutes();

    this.saveState();
  }

  handleDetectedHazards(hazards) {
    hazards.forEach(h => {
      this.state.hazards.unshift(h);
      
      this.addAuditLog(
        'Hazard Engine',
        'SYSTEM ACTION',
        'Hazard Detection',
        'HAZARD DETECTED',
        h.id,
        `${h.roadName} crossed into ${h.severity}. ${h.reason}`
      );

      // Create Inspection Task
      const taskId = `TASK-${h.segmentId}-${Date.now().toString().slice(-4)}`;
      const task = {
        id: taskId,
        hazardId: h.id,
        segmentId: h.segmentId,
        roadName: h.roadName,
        priority: h.severity,
        status: 'ASSIGNED',
        reason: `Automated dispatch: ${h.roadName} crossed risk threshold to ${h.currentRisk}. On-site physical verification required.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        assignedOfficerId: null,
        assignedOfficerName: null,
        distanceKm: null
      };

      // Assign nearest available Field Officer
      const assignment = assignNearestFieldOfficer(h, this.state.fieldOfficers);
      if (assignment && assignment.success) {
        task.assignedOfficerId = assignment.assignedOfficer.id;
        task.assignedOfficerName = assignment.assignedOfficer.name;
        task.distanceKm = assignment.distanceKm;
        
        // Update officer status
        const off = this.state.fieldOfficers.find(o => o.id === assignment.assignedOfficer.id);
        if (off) off.status = 'ASSIGNED_TASK';

        this.addAuditLog(
          'Dispatch Engine',
          'SYSTEM ACTION',
          'Automated Dispatch',
          'TASK AUTO-ASSIGNED',
          taskId,
          `Assigned nearest available officer ${assignment.assignedOfficer.id} (${assignment.assignedOfficer.name}) located ${assignment.distanceKm} km away.`
        );
      } else {
        this.addAuditLog(
          'Dispatch Engine',
          'SYSTEM ACTION',
          'Automated Dispatch',
          'TASK QUEUED',
          taskId,
          `No officers currently available. Task queued for manual Control Room assignment.`
        );
      }

      this.state.fieldTasks.unshift(task);
      h.status = 'ASSIGNED_INSPECTION';
    });
  }

  // --- Field Officer Workflow Actions ---
  acceptTask(taskId) {
    const task = this.state.fieldTasks.find(t => t.id === taskId);
    if (!task) return false;
    task.status = 'ACCEPTED';
    task.acceptedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
    
    this.addAuditLog(
      task.assignedOfficerId || 'FO-02',
      'HUMAN ACTION',
      'Field Recon Officer',
      'TASK ACCEPTED',
      taskId,
      `Officer confirmed dispatch to ${task.roadName}. Proceeding to site.`
    );
    this.saveState();
    return true;
  }

  arriveOnSite(taskId) {
    const task = this.state.fieldTasks.find(t => t.id === taskId);
    if (!task) return false;
    task.status = 'ON_SITE';
    task.onSiteAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
    
    this.addAuditLog(
      task.assignedOfficerId || 'FO-02',
      'HUMAN ACTION',
      'Field Recon Officer',
      'ARRIVED ON SITE',
      taskId,
      `Officer on location at ${task.roadName}. Commencing flood & passability assessment.`
    );
    this.saveState();
    return true;
  }

  submitFieldReport(reportData) {
    const repId = 'REP-' + Date.now().toString().slice(-5);
    const officerId = reportData.officerId || 'FO-02';
    const segmentId = reportData.segmentId || 'S217';
    const segment = this.state.roadSegments.find(s => s.segmentId === segmentId) || this.state.roadSegments[0];

    const report = {
      id: repId,
      taskId: reportData.taskId || null,
      officerId: officerId,
      reportedBy: `${officerId} (Sub-Inspector M. Selvam - Field Recon)`,
      roadSegment: segment.roadName,
      segmentId: segmentId,
      conditionType: reportData.conditionType || 'flooding',
      severity: reportData.severity || 'CRITICAL',
      description: reportData.description || 'Observed deep stormwater accumulation from lake overflow; impassable for normal road vehicles.',
      coordinates: reportData.coordinates || { lat: 12.9772, lng: 80.2215, accuracy: '±5 m' },
      timestamp: Date.now(),
      reportedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      evidencePhotos: reportData.evidencePhotos && reportData.evidencePhotos.length > 0
        ? reportData.evidencePhotos
        : ['https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80'],
      isUserUpload: Boolean(reportData.isUserUpload)
    };

    // Run AI-Assisted Verification / Confidence Engine
    const verification = evaluateVerificationConfidence(
      report,
      segment,
      this.state.weather.rainfallMm24h,
      this.state.fieldReports
    );

    report.confidence = verification.confidence;
    report.confidenceScore = verification.confidenceScore;
    report.reasons = verification.reasons;
    report.requiresControlRoomReview = verification.requiresControlRoomReview;
    report.suggestedRoadStatus = verification.suggestedRoadStatus;

    this.state.fieldReports.unshift(report);

    // Complete inspection task if associated
    if (reportData.taskId) {
      const t = this.state.fieldTasks.find(task => task.id === reportData.taskId);
      if (t) {
        t.status = 'VERIFIED';
        t.completedAt = report.reportedTime;
      }
    }

    // Reset officer status to AVAILABLE
    const off = this.state.fieldOfficers.find(o => o.id === officerId);
    if (off) off.status = 'AVAILABLE';

    if (!verification.requiresControlRoomReview) {
      // HIGH CONFIDENCE: Automatically process according to policy!
      segment.operationalStatus = verification.suggestedRoadStatus;
      segment.lastVerifiedUpdate = report.reportedTime;
      report.status = 'AUTO_PROCESSED';

      this.addAuditLog(
        'Verification Engine',
        'SYSTEM ACTION',
        'Confidence Engine',
        'HIGH-CONFIDENCE AUTO-VERIFIED',
        segment.segmentId,
        `Report ${repId} validated (${verification.confidenceScore}/100 score). Road operational status set to ${verification.suggestedRoadStatus}.`
      );

      // Trigger Active Trip Impact Analysis & Dynamic Rerouting!
      this.processRoadStatusChange(segment.segmentId, verification.suggestedRoadStatus);

    } else {
      // UNCERTAIN OR CONFLICTING: Send to Control Room Review Queue
      report.status = 'SENT_TO_CONTROL_ROOM';
      segment.operationalStatus = verification.suggestedRoadStatus; // e.g. CONFLICTING or UNDER VERIFICATION
      this.state.controlRoomExceptions.unshift(report);

      this.addAuditLog(
        'Verification Engine',
        'SYSTEM ACTION',
        'Confidence Engine',
        'SENT TO CONTROL ROOM REVIEW',
        repId,
        `Verification flagged as ${verification.confidence}. Forwarded to Control Room operator review queue.`
      );
    }

    this.saveState();
    return report;
  }

  // --- Road Status Change & Dynamic Trip Impact Analysis ---
  processRoadStatusChange(segmentId, newStatus) {
    const isBlocked = (newStatus === 'BLOCKED' || newStatus === 'PARTIALLY BLOCKED');

    // 1. Identify Affected Active Trips
    const affected = analyzeTripImpact(segmentId, this.state.activeTrips, this.state.routes);

    if (isBlocked) {
      // Mark Route A as BLOCKED
      const routeA = this.state.routes.find(r => r.id === 'ROUTE-A' || r.name.includes('Route A'));
      if (routeA) {
        routeA.status = 'BLOCKED';
        routeA.riskScore = 92;
        routeA.hasBlockedSegment = true;
      }

      // Mark Route B as RECOMMENDED
      const routeB = this.state.routes.find(r => r.id === 'ROUTE-B' || r.name.includes('Route B'));
      if (routeB) {
        routeB.status = 'RECOMMENDED';
        routeB.isRecommended = true;
      }

      // Send Targeted Driver Alert ONLY to affected trips
      affected.forEach(aff => {
        const trip = this.state.activeTrips.find(t => t.id === aff.tripId);
        if (trip) trip.isAffected = true;

        const alertId = 'ALT-' + Date.now().toString().slice(-4);
        const alertRecord = {
          id: alertId,
          tripId: aff.tripId,
          driverId: aff.driverId,
          vehicleId: aff.vehicleId,
          title: `YOUR ROUTE IS AFFECTED: Road Segment ${segmentId} confirmed BLOCKED`,
          message: `Flooding at ${segmentId} (Velachery Main Road). Route A impassable. Safer Route B (GST / Kathipara Elevated Bypass) is RECOMMENDED (+6 min, Risk 32 LOW).`,
          category: 'CRITICAL',
          recommendedRoute: 'Route B',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
          acknowledged: false
        };

        this.state.alerts.unshift(alertRecord);
        this.state.driverDisruptionAlertActive = true;
        this.state.driverPendingDispatch = {
          routeId: 'ROUTE-B',
          routeName: 'Route B (GST Road / Kathipara Elevated Bypass)',
          reason: `Physical blockage on Velachery S217. Route B provides safe elevated passage (Risk 32 LOW).`,
          transmittedTime: alertRecord.time
        };

        // Update vehicle status
        const veh = this.state.vehicles.find(v => v.id === aff.vehicleId);
        if (veh) {
          veh.status = 'REROUTE_PENDING';
          veh.currentIncident = `Hazard on ${segmentId} (Confirmed ${newStatus})`;
        }

        this.addAuditLog(
          'Targeted Alert Engine',
          'SYSTEM ACTION',
          'Driver Alert Service',
          'TARGETED DRIVER ALERT TRANSMITTED',
          aff.vehicleId,
          `Alert sent to driver ${aff.driverName} (${aff.driverId}) on trip ${aff.tripId}. Non-affected drivers not alerted.`
        );
      });
    }

    this.reevaluateRoutes();
    this.saveState();
  }

  reevaluateRoutes() {
    this.state.routes = evaluateCandidateRoutes(this.state.routes, this.state.roadSegments);
  }

  // --- Control Room Actions ---
  controlRoomResolveException(reportId, approved = true, notes = '') {
    const report = this.state.fieldReports.find(r => r.id === reportId);
    if (!report) return false;

    const actor = this.state.session.user?.id || 'CR-01 (Commander M. Ramanathan)';

    if (approved) {
      report.status = 'VERIFIED_BY_CONTROL_ROOM';
      const segment = this.state.roadSegments.find(s => s.segmentId === report.segmentId);
      if (segment) {
        segment.operationalStatus = (report.severity === 'CRITICAL' || report.conditionType === 'complete blockage') 
          ? 'BLOCKED' 
          : 'WATERLOGGED';
        segment.lastVerifiedUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
        this.processRoadStatusChange(segment.segmentId, segment.operationalStatus);
      }

      this.addAuditLog(
        actor,
        'HUMAN ACTION',
        'Control Room Supervisor',
        'EXCEPTION RESOLVED & APPROVED',
        report.id,
        notes || `Operator approved physical closure on ${report.roadSegment}. Reroute alert dispatched.`
      );
    } else {
      report.status = 'REJECTED_BY_CONTROL_ROOM';
      const segment = this.state.roadSegments.find(s => s.segmentId === report.segmentId);
      if (segment) {
        segment.operationalStatus = 'NORMAL';
      }

      this.addAuditLog(
        actor,
        'HUMAN ACTION',
        'Control Room Supervisor',
        'EXCEPTION REJECTED',
        report.id,
        notes || 'Insufficient physical evidence for roadway closure. Road remains open.'
      );
    }

    // Remove from pending exceptions
    this.state.controlRoomExceptions = this.state.controlRoomExceptions.filter(e => e.id !== reportId);
    this.saveState();
    return true;
  }

  // --- Driver Actions ---
  acknowledgeDriverRoute(driverId, routeId) {
    const vehicle = this.state.vehicles.find(v => v.driverId === driverId || v.id === 'TRK-104');
    if (vehicle) {
      vehicle.currentRoute = 'Route B (GST Road / Kathipara Elevated Bypass)';
      vehicle.status = 'ACTIVE';
      vehicle.pendingDispatch = null;
    }

    const trip = this.state.activeTrips.find(t => t.driverId === driverId || t.vehicleId === 'TRK-104');
    if (trip) {
      trip.activeRouteId = 'ROUTE-B';
      trip.activeRouteName = 'Route B (GST Road / Kathipara Elevated Bypass)';
      trip.isAffected = false;
      trip.status = 'REROUTED_ACTIVE';
    }

    this.state.driverDisruptionAlertActive = false;
    this.state.driverPendingDispatch = null;

    // Acknowledge alerts
    this.state.alerts.forEach(a => {
      if (a.driverId === driverId || a.vehicleId === 'TRK-104') {
        a.acknowledged = true;
        a.status = 'ACKNOWLEDGED';
      }
    });

    this.addAuditLog(
      driverId || 'DRV-104',
      'HUMAN ACTION',
      'Driver',
      'REROUTE ENGAGED',
      routeId || 'ROUTE-B',
      'Driver Rajesh Kumar acknowledged disruption alert and engaged active navigation on Route B.'
    );

    this.saveState();
    return true;
  }

  // Auth / Session helpers
  login(email, password) {
    let role = 'CONTROL_ROOM';
    let user = { id: 'CR-01', name: 'Commander M. Ramanathan', email, role: 'CONTROL_ROOM' };

    if (email.includes('driver') || email.includes('rajesh')) {
      role = 'DRIVER';
      user = { id: 'DRV-104', name: 'Rajesh Kumar', email, role: 'DRIVER' };
    } else if (email.includes('officer') || email.includes('selvam') || email.includes('field')) {
      role = 'FIELD_OFFICER';
      user = { id: 'FO-02', name: 'Sub-Inspector M. Selvam', email, role: 'FIELD_OFFICER' };
    }

    this.state.session = {
      isAuthenticated: true,
      role: role,
      user: user,
      isSecondStageVerified: true,
      verificationStep: 2
    };

    this.addAuditLog(user.id, 'HUMAN ACTION', role, 'TERMINAL LOGIN', user.id, `User logged in to ${role} console.`);
    this.saveState();
    return this.state.session;
  }

  verifySecondStage(payload = {}) {
    if (!this.state.session) {
      this.state.session = { isAuthenticated: true, role: 'CONTROL_ROOM', user: { id: 'CR-01', name: 'Command Officer', role: 'CONTROL_ROOM' } };
    }
    this.state.session.isAuthenticated = true;
    this.state.session.isSecondStageVerified = true;
    this.state.session.verificationStep = 2;

    const role = this.state.session.role || 'CONTROL_ROOM';
    const actor = this.state.session.user?.id || (role === 'DRIVER' ? 'DRV-104' : role === 'FIELD_OFFICER' ? 'FO-02' : 'CR-01');

    this.addAuditLog(
      actor,
      'HUMAN ACTION',
      role,
      'SECOND-STAGE VERIFICATION COMPLETED',
      actor,
      `Two-factor role credentials verified for ${role}. Terminal unlocked.`
    );

    this.saveState();
    return true;
  }

  logout() {
    this.state.session = {
      isAuthenticated: false,
      role: null,
      user: null,
      isSecondStageVerified: false,
      verificationStep: 0
    };
    this.saveState();
  }

  addAuditLog(actor, actorType, role, action, entity, notes) {
    const log = {
      id: 'LOG-' + (this.state.auditLogs.length + 1).toString().padStart(3, '0'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
      actor: actor,
      actorType: actorType || 'HUMAN ACTION',
      role: role,
      action: action,
      entity: entity,
      notes: notes
    };
    this.state.auditLogs.unshift(log);
  }

  // Legacy method compatibility
  reportIncident(data) {
    return this.submitFieldReport(data);
  }

  verifyIncident(incId, approved = true) {
    return this.controlRoomResolveException(incId, approved);
  }

  transmitRouteDispatch(vehicleId, routeId) {
    return this.processRoadStatusChange('S217', 'BLOCKED');
  }
}

export const store = new RouteIQStore();
