/**
 * CHENNAI-IQ Empirical Flood Risk Calculation Engine (Node.js)
 */
export function calculateSegmentRisk(rainfallMm, elevation, drainage, roadVuln) {
  const rainfallFactor = Math.min(1.0, Math.max(0.0, rainfallMm / 250.0));
  const elevationFactor = Math.min(1.0, Math.max(0.0, elevation));
  const drainageFactor = Math.min(1.0, Math.max(0.0, drainage));
  const roadVulnFactor = Math.min(1.0, Math.max(0.0, roadVuln));

  const weighted = (
    0.45 * rainfallFactor +
    0.25 * elevationFactor +
    0.20 * drainageFactor +
    0.10 * roadVulnFactor
  );

  let score = Math.round(100.0 * weighted);
  score = Math.max(0, Math.min(100, score));

  let level = 'LOW';
  if (score > 80) level = 'CRITICAL';
  else if (score > 60) level = 'HIGH';
  else if (score > 30) level = 'MODERATE';

  return {
    score,
    level,
    factors: {
      rainfallFactor: Number(rainfallFactor.toFixed(2)),
      elevationFactor: Number(elevationFactor.toFixed(2)),
      drainageFactor: Number(drainageFactor.toFixed(2)),
      roadVulnFactor: Number(roadVulnFactor.toFixed(2))
    }
  };
}
