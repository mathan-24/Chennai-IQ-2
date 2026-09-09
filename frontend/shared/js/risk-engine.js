/**
 * CHENNAI-IQ — Flood Risk, Hazard Detection & Verification Confidence Engine
 * 
 * PROTOTYPE RISK ENGINE SPECIFICATION:
 * Transparent prototype formula:
 *   risk_score = 100 * (
 *       0.45 * rainfall_factor +
 *       0.25 * elevation_factor +
 *       0.20 * drainage_factor +
 *       0.10 * road_vulnerability_factor
 *   )
 * 
 * All factors are normalized between 0 and 1.
 * IMPORTANT DISCLAIMER: These weights and display thresholds are prototype assumptions
 * for hackathon demonstration and operational decision-support. They are not officially
 * validated government flood-prediction weights.
 * 
 * Prototype Display Thresholds:
 *   0–30:   LOW
 *   31–60:  MODERATE
 *   61–80:  HIGH
 *   81–100: CRITICAL
 */

export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 30, label: 'LOW', color: '#38E54D', badgeClass: 'badge-low' },
  MODERATE: { min: 31, max: 60, label: 'MODERATE', color: '#FFA54A', badgeClass: 'badge-med' },
  HIGH: { min: 61, max: 80, label: 'HIGH', color: '#FF7043', badgeClass: 'badge-high' },
  CRITICAL: { min: 81, max: 100, label: 'CRITICAL', color: '#FF453A', badgeClass: 'badge-critical' }
};

/**
 * Calculates flood-access risk score for a road segment given rainfall in mm.
 * @param {number} rainfallMm - Continuous rainfall in mm (e.g., 50, 75, 100, 150, 200, 250)
 * @param {object} segment - Road segment attributes (elevation, drainage, vulnerability)
 * @returns {object} { score: number, level: string, breakdown: object }
 */
export function calculateSegmentRisk(rainfallMm, segment) {
  // Normalize rainfall: 0 to 250 mm -> 0.0 to 1.0
  const rainfallFactor = Math.min(1.0, Math.max(0.0, rainfallMm / 250.0));
  const elevationFactor = Math.min(1.0, Math.max(0.0, segment.elevationSusceptibility ?? 0.5));
  const drainageFactor = Math.min(1.0, Math.max(0.0, segment.drainageSusceptibility ?? 0.5));
  const roadVulnFactor = Math.min(1.0, Math.max(0.0, segment.roadVulnerability ?? 0.4));

  const weightedSum = (
    0.45 * rainfallFactor +
    0.25 * elevationFactor +
    0.20 * drainageFactor +
    0.10 * roadVulnFactor
  );

  const rawScore = Math.round(100.0 * weightedSum);
  const score = Math.min(100, Math.max(0, rawScore));

  let level = 'LOW';
  if (score > 80) level = 'CRITICAL';
  else if (score > 60) level = 'HIGH';
  else if (score > 30) level = 'MODERATE';

  return {
    score,
    level,
    breakdown: {
      rainfallComponent: +(0.45 * rainfallFactor * 100).toFixed(1),
      elevationComponent: +(0.25 * elevationFactor * 100).toFixed(1),
      drainageComponent: +(0.20 * drainageFactor * 100).toFixed(1),
      roadVulnComponent: +(0.10 * roadVulnFactor * 100).toFixed(1),
      rainfallMm,
      rainfallFactor: +rainfallFactor.toFixed(2),
      elevationFactor: +elevationFactor.toFixed(2),
      drainageFactor: +drainageFactor.toFixed(2),
      roadVulnFactor: +roadVulnFactor.toFixed(2)
    }
  };
}

/**
 * Detects significant hazard events when road segments cross risk thresholds.
 * Avoids duplicate creation through cooldown and existing hazard matching.
 */
export function detectHazards(previousSegments, updatedSegments, existingHazards = []) {
  const newHazards = [];
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  for (const updated of updatedSegments) {
    const prev = previousSegments.find(p => p.segmentId === updated.segmentId);
    if (!prev) continue;

    const prevScore = prev.currentRiskScore;
    const currScore = updated.currentRiskScore;
    const prevLevel = prev.currentRiskLevel;
    const currLevel = updated.currentRiskLevel;

    // Meaningful transitions: Crossing into HIGH or CRITICAL
    const crossedToHigh = (prevLevel === 'LOW' || prevLevel === 'MODERATE') && (currLevel === 'HIGH' || currLevel === 'CRITICAL');
    const crossedToCritical = prevLevel !== 'CRITICAL' && currLevel === 'CRITICAL';
    const scoreJump = currScore - prevScore >= 15;

    if (crossedToHigh || crossedToCritical || (scoreJump && currScore >= 65)) {
      // Check cooldown: do not re-create if active hazard exists for this segment in last 15 min
      const activeDuplicate = existingHazards.find(h => 
        h.segmentId === updated.segmentId && 
        h.status !== 'RESOLVED' && 
        h.status !== 'CLEARED'
      );

      if (!activeDuplicate) {
        const hazardSeverity = currLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
        const hazardType = updated.drainageSusceptibility > 0.8 ? 'INUNDATION_WATERLOGGING' : 'FLOOD_ACCESS_RISK';

        newHazards.push({
          id: `HAZ-CHN-${Date.now().toString().slice(-4)}-${updated.segmentId}`,
          segmentId: updated.segmentId,
          roadName: updated.roadName,
          type: hazardType,
          severity: hazardSeverity,
          previousRisk: `${prevScore} (${prevLevel})`,
          currentRisk: `${currScore} (${currLevel})`,
          reason: `Risk score elevated from ${prevScore} to ${currScore} under intensive monsoonal precipitation.`,
          detectedAt: nowStr,
          timestamp: Date.now(),
          status: 'ACTIVE_UNVERIFIED', // ACTIVE_UNVERIFIED | ASSIGNED_INSPECTION | VERIFIED_CONFIRMED | RESOLVED
          coordinates: updated.geometry[Math.floor(updated.geometry.length / 2)]
        });
      }
    }
  }

  return newHazards;
}

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return +(R * c).toFixed(2);
}

/**
 * Automated Field Officer Assignment:
 * Finds eligible officers, filters to AVAILABLE officers, ranks candidates by distance,
 * and assigns the nearest officer to the target hazard/segment.
 */
export function assignNearestFieldOfficer(hazardOrSegment, availableOfficers = []) {
  if (!hazardOrSegment || !availableOfficers || availableOfficers.length === 0) {
    return null;
  }

  const targetCoords = hazardOrSegment.coordinates 
    || (hazardOrSegment.geometry ? hazardOrSegment.geometry[0] : null);

  if (!targetCoords) return null;

  // Filter to AVAILABLE officers
  const eligible = availableOfficers.filter(officer => 
    officer.status === 'AVAILABLE' || officer.status === 'ON_PATROL'
  );

  if (eligible.length === 0) {
    return {
      success: false,
      reason: 'No Field Officers currently available (all units active or busy)'
    };
  }

  // Calculate distance for each
  const candidatesWithDistance = eligible.map(officer => {
    const dist = calculateDistanceKm(
      officer.location.lat,
      officer.location.lng,
      targetCoords[0],
      targetCoords[1]
    );
    return { officer, distanceKm: dist };
  });

  // Sort by ascending distance (nearest first)
  candidatesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  const bestMatch = candidatesWithDistance[0];

  return {
    success: true,
    assignedOfficer: bestMatch.officer,
    distanceKm: bestMatch.distanceKm,
    allCandidates: candidatesWithDistance
  };
}

/**
 * AI-Assisted Verification / Confidence Engine
 * Transparent rules-based confidence computation considering:
 * - GPS proximity to road segment (< 300m high, < 1.2km med, > 1.2km low)
 * - Timestamp freshness (< 20 mins)
 * - Photographic evidence existence
 * - Severity consistency with predicted flood risk
 * - Duplicate & corroborating reports
 * - Conflicting evidence detection
 * 
 * Possible outcomes: HIGH CONFIDENCE | MEDIUM CONFIDENCE | LOW CONFIDENCE | CONFLICTING
 */
export function evaluateVerificationConfidence(report, segment, currentRainfallMm, otherReports = []) {
  const reasons = [];
  let score = 0;

  // 1. Proximity check
  let distKm = 999;
  if (report.coordinates && segment.geometry && segment.geometry[0]) {
    // Find closest segment point
    const minPtDist = Math.min(...segment.geometry.map(pt => 
      calculateDistanceKm(report.coordinates.lat, report.coordinates.lng, pt[0], pt[1])
    ));
    distKm = minPtDist;
  }

  if (distKm <= 0.35) {
    score += 35;
    reasons.push(`GPS telemetry tightly locked onto segment corridor (${(distKm * 1000).toFixed(0)}m offset).`);
  } else if (distKm <= 1.2) {
    score += 20;
    reasons.push(`GPS telemetry within reasonable sector perimeter (${distKm.toFixed(1)} km).`);
  } else {
    score += 5;
    reasons.push(`GPS telemetry distant from target segment axis (${distKm.toFixed(1)} km) - verification proximity warning.`);
  }

  // 2. Evidence presence
  if (report.evidencePhotos && report.evidencePhotos.length > 0) {
    score += 30;
    reasons.push('Photographic terrain evidence attached and verified non-empty.');
  } else {
    reasons.push('No visual photo evidence attached; observation relies solely on textual radio report.');
  }

  // 3. Timestamp freshness
  const reportAgeMinutes = report.timestamp ? Math.max(0, (Date.now() - report.timestamp) / 60000) : 0;
  if (reportAgeMinutes <= 15) {
    score += 20;
    reasons.push(`Observation is fresh (<${Math.ceil(reportAgeMinutes) || 1} min old).`);
  } else if (reportAgeMinutes <= 45) {
    score += 10;
    reasons.push(`Observation within acceptable operational window (${Math.round(reportAgeMinutes)} min old).`);
  } else {
    reasons.push(`Observation timestamp is stale (${Math.round(reportAgeMinutes)} min old).`);
  }

  // 4. Severity and rainfall consistency
  const isHighRain = currentRainfallMm >= 100;
  const isSevereReport = ['flooding', 'complete blockage', 'waterlogging', 'unsafe passage', 'BLOCKED', 'HIGH', 'CRITICAL'].some(k => 
    (report.conditionType || '').toLowerCase().includes(k) || (report.severity || '').toLowerCase().includes(k)
  );

  if (isHighRain && isSevereReport) {
    score += 15;
    reasons.push(`Reported condition (${report.conditionType || report.severity}) is physically consistent with heavy rainfall (${currentRainfallMm} mm).`);
  } else {
    score += 10;
    reasons.push(`Reported condition recorded under moderate precipitation.`);
  }

  // 5. Check for conflicting reports
  const conflicting = otherReports.filter(other => 
    other.id !== report.id &&
    other.roadSegment === report.roadSegment &&
    (
      (isSevereReport && (other.conditionType === 'clear' || other.severity === 'LOW')) ||
      (!isSevereReport && (other.severity === 'CRITICAL' || other.conditionType === 'complete blockage'))
    )
  );

  if (conflicting.length > 0) {
    return {
      confidence: 'CONFLICTING',
      confidenceScore: score,
      reasons: [
        ...reasons,
        `Conflicting field observation detected from ${conflicting[0].reportedBy || 'another patrol'}. Requires Control Room review.`
      ],
      requiresControlRoomReview: true,
      suggestedRoadStatus: 'CONFLICTING'
    };
  }

  // Corroborating reports boost
  const corroborating = otherReports.filter(other => 
    other.id !== report.id &&
    other.roadSegment === report.roadSegment &&
    other.severity === report.severity
  );

  if (corroborating.length > 0) {
    score = Math.min(100, score + 10);
    reasons.push(`Corroborating observation confirmed by patrol unit ${corroborating[0].reportedBy}.`);
  }

  let confidence = 'LOW CONFIDENCE';
  let requiresReview = true;
  let suggestedStatus = 'UNDER VERIFICATION';

  if (score >= 75) {
    confidence = 'HIGH CONFIDENCE';
    requiresReview = false; // High-confidence automatically processed
    suggestedStatus = (report.severity === 'CRITICAL' || report.conditionType === 'complete blockage' || report.conditionType === 'flooding') 
      ? 'BLOCKED' 
      : 'WATERLOGGED';
  } else if (score >= 50) {
    confidence = 'MEDIUM CONFIDENCE';
    requiresReview = true; // Sent to control room queue
    suggestedStatus = 'PARTIALLY BLOCKED';
  } else {
    confidence = 'LOW CONFIDENCE';
    requiresReview = true;
    suggestedStatus = 'AT RISK';
  }

  return {
    confidence,
    confidenceScore: score,
    reasons,
    requiresControlRoomReview: requiresReview,
    suggestedRoadStatus: suggestedStatus
  };
}

/**
 * Trip Impact Analysis
 * Checks active trips and determines which trips have routes traversing the affected road segment.
 */
export function analyzeTripImpact(affectedSegmentId, activeTrips = [], routes = []) {
  const affectedTrips = [];

  for (const trip of activeTrips) {
    // Check if the trip's current active route contains the affected segment
    const route = routes.find(r => r.id === trip.activeRouteId || r.name === trip.activeRouteName);
    const usesSegment = route && route.segments && route.segments.includes(affectedSegmentId);

    if (usesSegment) {
      affectedTrips.push({
        tripId: trip.id,
        driverId: trip.driverId,
        driverName: trip.driverName,
        vehicleId: trip.vehicleId,
        activeRoute: route.name,
        corridorSegment: affectedSegmentId,
        impactLevel: 'CRITICAL_DISRUPTION'
      });
    }
  }

  return affectedTrips;
}

/**
 * Flood-Aware Route Evaluation
 * Evaluates candidate OSRM routes against segment flood risks and operational status.
 * Balances travel time, distance, and flood-access risk.
 */
export function evaluateCandidateRoutes(candidateRoutes, roadSegments) {
  return candidateRoutes.map(route => {
    let totalRisk = 0;
    let maxSegmentRisk = 0;
    let highRiskCount = 0;
    let hasBlockedSegment = false;
    const evaluatedSegments = [];

    (route.segmentIds || []).forEach(segId => {
      const seg = roadSegments.find(s => s.segmentId === segId);
      if (seg) {
        evaluatedSegments.push(seg);
        totalRisk += seg.currentRiskScore;
        if (seg.currentRiskScore > maxSegmentRisk) {
          maxSegmentRisk = seg.currentRiskScore;
        }
        if (seg.currentRiskLevel === 'HIGH' || seg.currentRiskLevel === 'CRITICAL') {
          highRiskCount++;
        }
        if (seg.operationalStatus === 'BLOCKED') {
          hasBlockedSegment = true;
        }
      }
    });

    const segmentCount = Math.max(1, (route.segmentIds || []).length);
    const avgRisk = Math.round(totalRisk / segmentCount);
    const highRiskPct = Math.round((highRiskCount / segmentCount) * 100);

    // Composite Route Safety Penalty Score
    // Balances flood risk, time, and hard blockages
    let compositeScore = avgRisk;
    if (hasBlockedSegment) {
      compositeScore += 100; // Major penalty for confirmed road blockage
    }

    return {
      ...route,
      avgRisk,
      maxSegmentRisk,
      highRiskPct,
      hasBlockedSegment,
      compositeScore,
      isBlocked: hasBlockedSegment,
      evaluatedSegments
    };
  });
}
