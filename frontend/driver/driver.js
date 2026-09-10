/**
 * CHENNAI-IQ — Driver Navigation Console View Module
 * 
 * Features:
 * - Real-time Chennai Metro Tactical Navigation
 * - Citywide Chennai overview before destination entry
 * - Route-centric navigation corridor after origin + destination submission
 * - OSRM integration with flood-risk corridor analysis
 * - Automatic Leaflet fitBounds() centering and panning to the active route
 * - Selective rendering of relevant flood-risk road segments and blocked hazards
 * - Real-time auto-refit if route is disrupted
 * - Pure Vanilla JavaScript (No React / No Vite)
 */

import { store } from '../shared/js/store.js';
import { RouteIQMap } from '../shared/js/map.js';
import { setupImageUploader } from '../shared/js/image-upload.js';
import { dialog } from '../shared/js/dialog.js';

let driverMap = null;
let driverUploader = null;

// Preset Staging & Emergency Outpost Coordinates in Chennai
const PRESET_LOCATIONS = {
  GUINDY: { id: 'GUINDY', name: 'Guindy Central Logistics Hub', lat: 13.0067, lng: 80.2025 },
  TAMBARAM: { id: 'TAMBARAM', name: 'Tambaram Base Depot', lat: 12.9249, lng: 80.1000 },
  KOYAMBEDU: { id: 'KOYAMBEDU', name: 'Koyambedu Wholesale Transport Hub', lat: 13.0694, lng: 80.1948 },
  SAIDAPET: { id: 'SAIDAPET', name: 'Saidapet Recon Base', lat: 13.0210, lng: 80.2230 },
  GPS: { id: 'GPS', name: 'Current GPS Fix (TRK-104)', lat: 13.0067, lng: 80.2025 },
  VELACHERY: { id: 'VELACHERY', name: 'Velachery Emergency Center', lat: 12.9815, lng: 80.2180 },
  RIPON: { id: 'RIPON', name: 'Ripon Building Central Command', lat: 13.0827, lng: 80.2750 },
  PERUNGUDI: { id: 'PERUNGUDI', name: 'Perungudi OMR Relief Post', lat: 12.9660, lng: 80.2450 },
  HOSPITAL: { id: 'HOSPITAL', name: 'Saidapet Emergency Hospital', lat: 13.0210, lng: 80.2230 },
  SHOLINGANALLUR: { id: 'SHOLINGANALLUR', name: 'Sholinganallur Flood Center', lat: 12.9010, lng: 80.2280 }
};

let driverRouteSession = {
  hasSubmitted: false,
  origin: PRESET_LOCATIONS.GUINDY,
  destination: PRESET_LOCATIONS.VELACHERY,
  routes: [],
  recommendedRouteId: null,
  activeRouteId: null,
  relevantSegmentIds: []
};

export function getDriverMap() {
  return driverMap;
}

export function getDriverRouteSession() {
  return driverRouteSession;
}

export function initDriverView() {
  renderDriverData();

  // Initialize Map in Driver Mode
  if (!driverMap) {
    driverMap = new RouteIQMap('driver-map-container', {
      center: [13.0080, 80.2150],
      zoom: 12,
      mode: 'driver',
      focusVehicle: 'TRK-104',
      basemap: 'streets'
    });
  } else if (driverMap && driverMap.map) {
    setTimeout(() => {
      driverMap.map.invalidateSize();
      driverMap.renderFeatures();
    }, 150);
  }

  // Expose global helper actions for UI buttons
  window.RouteIQ = window.RouteIQ || {};
  window.RouteIQ.getDriverMap = getDriverMap;
  window.RouteIQ.fitDriverRouteCorridor = () => {
    if (driverMap) {
      driverMap.fitRouteBounds();
      dialog.toast('Re-centered view on active navigation corridor.', 'info', 2000);
    }
  };
  window.RouteIQ.replanDriverTrip = () => {
    replanTrip();
  };
  window.RouteIQ.selectDriverRoute = (routeId) => {
    selectCandidateRoute(routeId);
  };
  window.RouteIQ.centerDriverVehicle = () => {
    if (driverMap) {
      driverMap.centerVehicle('TRK-104');
    }
  };
  window.RouteIQ.setDriverMapBasemap = (type) => {
    if (driverMap) {
      driverMap.setBasemap(type);
      ['driver-btn-streets', 'driver-btn-satellite', 'driver-btn-dark'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.background = 'transparent';
          el.style.color = 'var(--text-muted)';
        }
      });
      const activeBtn = document.getElementById(`driver-btn-${type}`);
      if (activeBtn) {
        activeBtn.style.background = 'rgba(0,206,209,0.25)';
        activeBtn.style.color = '#00CED1';
      }
    }
  };

  // Bind Submit Trip Button
  const submitTripBtn = document.getElementById('btn-driver-submit-trip');
  if (submitTripBtn) {
    submitTripBtn.addEventListener('click', () => {
      const origKey = document.getElementById('driver-origin-select')?.value || 'GUINDY';
      const destKey = document.getElementById('driver-dest-select')?.value || 'VELACHERY';
      calculateDriverRoutes(origKey, destKey);
    });
  }

  // Subscribe to state updates
  store.subscribe((state) => {
    updateDriverAlerts(state);
    renderDriverData();

    // Auto-reroute if current active route becomes compromised
    if (driverRouteSession.hasSubmitted && driverRouteSession.routes.length > 0) {
      const activeTrip = (state.activeTrips || []).find(t => t.driverId === 'DRV-104');
      const isCompromised = (activeTrip && activeTrip.isAffected) || state.driverDisruptionAlertActive;

      // If active route is Route A and it is blocked, auto-switch to recommended safe route (Route B)
      if (isCompromised && driverRouteSession.activeRouteId === 'ROUTE-A' && driverRouteSession.recommendedRouteId === 'ROUTE-B') {
        driverRouteSession.activeRouteId = 'ROUTE-B';
        if (driverMap) {
          driverMap.setDriverRouteSession(driverRouteSession);
        }
        updateDriverTripUI();
        dialog.toast('Active Route compromised by stormwater! Auto-switched to Route B (Elevated Bypass).', 'warning', 4500);
      }
    }

    if (driverMap) {
      driverMap.renderFeatures();
    }
  });

  // Action: Acknowledge & Navigate Route B
  const navRouteBBtn = document.getElementById('btn-driver-navigate-b');
  if (navRouteBBtn) {
    navRouteBBtn.addEventListener('click', () => {
      dialog.confirm({
        title: 'ENGAGE ROUTE B (GST / KATHIPARA ELEVATED BYPASS)',
        message: 'Acknowledge reroute to Route B?\n• Disruption: S217 (Velachery Main Road) confirmed BLOCKED by deep stormwater\n• Recommended: Route B via Kathipara Elevated Flyover (+6 min, Risk 32 LOW)\n• GPS and Cold-Chain vaccine telemetry remain active.',
        confirmText: 'CONFIRM & ENGAGE ROUTE B',
        icon: 'navigation',
        onConfirm: () => {
          store.acknowledgeDriverRoute('DRV-104', 'ROUTE-B');
          if (driverRouteSession.hasSubmitted) {
            selectCandidateRoute('ROUTE-B');
          }
          dialog.toast('Route B Elevated Navigation Engaged. Telemetry streaming to Control Room.', 'success', 4000);
        }
      });
    });
  }

  // Action: View Disruption Report Modal
  const viewDisruptionBtn = document.getElementById('btn-view-disruption');
  const disruptionModal = document.getElementById('modal-disruption-report');
  const closeDisruptionBtn = document.getElementById('btn-close-disruption-modal');

  if (viewDisruptionBtn && disruptionModal) {
    viewDisruptionBtn.addEventListener('click', () => {
      disruptionModal.classList.add('open');
    });
  }

  if (closeDisruptionBtn && disruptionModal) {
    closeDisruptionBtn.addEventListener('click', () => {
      disruptionModal.classList.remove('open');
    });
  }

  // Action: Driver Report Hazard Modal with Image Uploader
  const openHazardBtn = document.getElementById('btn-driver-report-hazard');
  const hazardModal = document.getElementById('modal-driver-hazard');
  const closeHazardBtn = document.getElementById('btn-close-driver-hazard');
  const hazardForm = document.getElementById('form-driver-hazard');

  if (openHazardBtn && hazardModal) {
    openHazardBtn.addEventListener('click', () => {
      hazardModal.classList.add('open');
      if (!driverUploader) {
        driverUploader = setupImageUploader({
          dropzoneEl: document.getElementById('driver-dropzone'),
          fileInputEl: document.getElementById('driver-hazard-file'),
          previewContainerEl: document.getElementById('driver-photo-preview'),
          presetsContainerEl: document.getElementById('driver-photo-presets')
        });
      }
    });
  }

  if (closeHazardBtn && hazardModal) {
    closeHazardBtn.addEventListener('click', () => {
      hazardModal.classList.remove('open');
    });
  }

  if (hazardForm) {
    hazardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('driver-hazard-type').value;
      const desc = document.getElementById('driver-hazard-desc').value;
      const attachedImage = driverUploader ? driverUploader.getImage() : null;
      const isRealUpload = driverUploader ? driverUploader.isUserUploaded() : false;

      const report = store.submitFieldReport({
        officerId: 'DRV-104',
        segmentId: 'S217',
        conditionType: type.toLowerCase(),
        severity: 'CRITICAL',
        description: desc || 'Driver line-of-sight observation: severe flood water across highway lanes.',
        coordinates: { lat: 12.9772, lng: 80.2215, accuracy: '±10 m' },
        evidencePhotos: attachedImage ? [attachedImage] : [],
        isUserUpload: isRealUpload
      });

      if (hazardModal) hazardModal.classList.remove('open');
      if (driverUploader) driverUploader.clearImage();
      hazardForm.reset();
      
      dialog.toast(`Driver Hazard Observation Transmitted (${report.id}). AI verification running.`, 'success', 4000);
    });
  }
}

/**
 * Executes server-side route analysis via OSRM + Chennai Flood Access Risk evaluation
 */
async function calculateDriverRoutes(originKey, destKey) {
  const origin = PRESET_LOCATIONS[originKey] || PRESET_LOCATIONS.GUINDY;
  const destination = PRESET_LOCATIONS[destKey] || PRESET_LOCATIONS.VELACHERY;

  const submitBtn = document.getElementById('btn-driver-submit-trip');
  const submitText = document.getElementById('btn-driver-submit-text');
  if (submitBtn && submitText) {
    submitBtn.disabled = true;
    submitText.textContent = 'CONNECTING TO OSRM & ANALYZING FLOOD RISK...';
  }

  try {
    const res = await fetch('/api/routes/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
        destination: { lat: destination.lat, lng: destination.lng, name: destination.name }
      })
    });

    if (!res.ok) {
      throw new Error(`Route analysis failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    
    driverRouteSession = {
      hasSubmitted: true,
      origin: { ...origin, ...data.origin },
      destination: { ...destination, ...data.destination },
      routes: data.routes || [],
      recommendedRouteId: data.recommendedRouteId || (data.routes[0] && data.routes[0].id),
      activeRouteId: data.recommendedRouteId || (data.routes[0] && data.routes[0].id),
      relevantSegmentIds: data.relevantSegmentIds || []
    };

    if (driverMap) {
      driverMap.setDriverRouteSession(driverRouteSession);
    }

    updateDriverTripUI();
    dialog.toast(`Corridor calculated via OSRM. Map automatically fitted to ${origin.name} → ${destination.name}.`, 'success', 3500);

  } catch (err) {
    console.error('Failed to calculate driver routes:', err);
    dialog.toast('Error calculating route via OSRM. Check network or retry.', 'danger', 4000);
  } finally {
    if (submitBtn && submitText) {
      submitBtn.disabled = false;
      submitText.textContent = 'RECALCULATE / UPDATE ROUTE (OSRM)';
    }
  }
}

/**
 * Updates driver UI after a route submission
 */
function updateDriverTripUI() {
  if (!driverRouteSession.hasSubmitted) return;

  const origin = driverRouteSession.origin;
  const destination = driverRouteSession.destination;
  const activeRoute = driverRouteSession.routes.find(r => r.id === driverRouteSession.activeRouteId) || driverRouteSession.routes[0];

  // Update Mission Setup Badge
  const planBadge = document.getElementById('driver-plan-badge');
  if (planBadge) {
    planBadge.textContent = 'CORRIDOR ACTIVE';
    planBadge.className = 'badge-status badge-verified';
  }

  // Update Map Overlay Indicator
  const indicatorDot = document.getElementById('driver-indicator-dot');
  const indicatorText = document.getElementById('driver-indicator-text');
  if (indicatorDot && indicatorText) {
    indicatorDot.style.background = '#00CED1';
    indicatorText.textContent = `CORRIDOR FOCUSED: ${origin.name.split(' ')[0]} → ${destination.name.split(' ')[0]}`;
  }

  // Show corridor fit & replan buttons
  const fitBtn = document.getElementById('driver-btn-fit-corridor');
  const replanBtn = document.getElementById('driver-btn-replan');
  if (fitBtn) fitBtn.style.display = 'inline-block';
  if (replanBtn) replanBtn.style.display = 'inline-block';

  // Update Mission Telemetry
  const originDisplay = document.getElementById('driver-origin-display');
  const destDisplay = document.getElementById('driver-dest-display');
  const statusBadge = document.getElementById('driver-trip-status-badge');
  const etaDisplay = document.getElementById('driver-eta-display');
  const distDisplay = document.getElementById('driver-dist-display');

  if (originDisplay) originDisplay.textContent = origin.name;
  if (destDisplay) destDisplay.textContent = destination.name;
  if (statusBadge) {
    statusBadge.textContent = 'CORRIDOR ACTIVE';
    statusBadge.className = 'badge-status badge-verified';
  }
  if (activeRoute) {
    if (etaDisplay) etaDisplay.textContent = `${activeRoute.estMinutes} min`;
    if (distDisplay) distDisplay.textContent = `${activeRoute.distanceKm} km`;
  }

  // Render Candidate Routes
  const routesContainer = document.getElementById('driver-candidate-routes-container');
  const routesCount = document.getElementById('driver-routes-count');
  if (routesCount) {
    routesCount.textContent = `${driverRouteSession.routes.length} ROUTES`;
  }

  if (routesContainer && driverRouteSession.routes.length > 0) {
    routesContainer.innerHTML = driverRouteSession.routes.map(r => {
      const isSelected = r.id === driverRouteSession.activeRouteId;
      const isRec = r.id === driverRouteSession.recommendedRouteId;
      const isBlocked = r.status === 'BLOCKED' || r.riskScore >= 75;

      let cardBorder = 'var(--border-outline)';
      let cardBg = 'rgba(22, 29, 29, 0.7)';
      let riskBadge = `<span style="color: var(--color-primary-bright); font-weight: bold;">${r.riskScore} / 100 RISK</span>`;

      if (isRec) {
        cardBorder = 'var(--color-primary)';
        cardBg = 'rgba(0, 206, 209, 0.15)';
      } else if (isBlocked) {
        cardBorder = 'rgba(255, 180, 171, 0.4)';
        cardBg = 'rgba(147, 0, 10, 0.15)';
        riskBadge = `<span style="color: var(--color-critical); font-weight: bold;">${r.riskScore} / 100 RISK</span>`;
      }

      return `
        <div style="background: ${cardBg}; border: 1px solid ${cardBorder}; padding: 10px; border-radius: var(--radius-sm); ${isSelected ? 'box-shadow: 0 0 10px rgba(0, 206, 209, 0.3);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 11px;">
            <strong style="color: ${isSelected ? '#00CED1' : '#FFF'};">
              ${isSelected ? '▶ ' : ''}${r.name} ${isRec ? '★ RECOMMENDED' : ''}
            </strong>
            ${riskBadge}
          </div>
          <div style="font-size: 11px; color: ${isBlocked ? 'var(--color-critical)' : '#DDE4E3'}; margin-top: 4px;">
            <strong>${r.distanceKm} km · ${r.estMinutes} min</strong> · ${r.summary || ''}
          </div>
          ${r.notes ? `<div style="font-size: 10px; color: ${isRec ? '#00CED1' : 'var(--text-on-surface-variant)'}; margin-top: 3px; font-family: 'JetBrains Mono', monospace;">${r.notes}</div>` : ''}
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="font-size: 10px; font-family: 'JetBrains Mono', monospace; color: var(--text-on-surface-variant);">
              Traverses: ${(r.traversedSegments || []).join(', ') || 'Corridor roads'}
            </span>
            ${isSelected 
              ? `<span style="background: #00CED1; color: #0B0E14; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px; font-family: 'JetBrains Mono', monospace;">ACTIVE NAV</span>`
              : `<button class="btn-secondary" style="font-size: 10px; padding: 2px 8px; border-radius: 3px;" onclick="window.RouteIQ.selectDriverRoute('${r.id}')">SELECT ROUTE</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }
}

/**
 * Resets driver view back to Chennai Citywide Overview
 */
function replanTrip() {
  driverRouteSession.hasSubmitted = false;
  driverRouteSession.routes = [];
  driverRouteSession.activeRouteId = null;
  driverRouteSession.recommendedRouteId = null;
  driverRouteSession.relevantSegmentIds = [];

  if (driverMap) {
    driverMap.clearDriverRouteSession();
  }

  const planBadge = document.getElementById('driver-plan-badge');
  if (planBadge) {
    planBadge.textContent = 'OVERVIEW MODE';
    planBadge.className = 'badge-status badge-caution';
  }

  const indicatorDot = document.getElementById('driver-indicator-dot');
  const indicatorText = document.getElementById('driver-indicator-text');
  if (indicatorDot && indicatorText) {
    indicatorDot.style.background = '#FFA54A';
    indicatorText.textContent = 'CHENNAI OVERVIEW · AWAITING TRIP';
  }

  const fitBtn = document.getElementById('driver-btn-fit-corridor');
  const replanBtn = document.getElementById('driver-btn-replan');
  if (fitBtn) fitBtn.style.display = 'none';
  if (replanBtn) replanBtn.style.display = 'none';

  const statusBadge = document.getElementById('driver-trip-status-badge');
  if (statusBadge) {
    statusBadge.textContent = 'AWAITING SUBMISSION';
    statusBadge.className = 'badge-status badge-caution';
  }

  const etaDisplay = document.getElementById('driver-eta-display');
  const distDisplay = document.getElementById('driver-dist-display');
  if (etaDisplay) etaDisplay.textContent = '-- min';
  if (distDisplay) distDisplay.textContent = '-- km';

  const routesContainer = document.getElementById('driver-candidate-routes-container');
  if (routesContainer) {
    routesContainer.innerHTML = `
      <div style="padding: 12px; border: 1px dashed var(--border-outline); border-radius: var(--radius-sm); text-align: center; color: var(--text-on-surface-variant); font-size: 11px; font-family: 'JetBrains Mono', monospace;">
        Awaiting origin & destination submission.<br>Click "SUBMIT & CALCULATE ROUTE" to analyze candidate corridors.
      </div>
    `;
  }

  const submitText = document.getElementById('btn-driver-submit-text');
  if (submitText) submitText.textContent = 'SUBMIT & CALCULATE ROUTE (OSRM)';
  
  dialog.toast('Map reset to Chennai citywide overview.', 'info', 2500);
}

/**
 * Switches the active route among candidate routes and refits the Leaflet map
 */
function selectCandidateRoute(routeId) {
  const targetRoute = driverRouteSession.routes.find(r => r.id === routeId);
  if (!targetRoute) return;

  driverRouteSession.activeRouteId = routeId;
  if (driverMap) {
    driverMap.setDriverRouteSession(driverRouteSession);
  }
  updateDriverTripUI();
  dialog.toast(`Switched active navigation to ${targetRoute.name}. Map fitted to corridor.`, 'success', 3000);
}

function renderDriverData() {
  const state = store.getState();
  const weather = state.weather;

  // Weather rendering
  const weatherCard = document.getElementById('driver-weather-metrics');
  if (weatherCard && weather) {
    weatherCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <span class="label-caps">RADAR METEOROLOGICAL TELEMETRY</span>
        <span class="badge-status badge-verified">● ${weather.status} (${weather.lastUpdatedText})</span>
      </div>
      <div style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 8px;">${weather.condition}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #859493;">
        <div>Rainfall: <strong style="color: #60A5FA;">${weather.rainfallMm24h} mm</strong></div>
        <div>Rate: <strong style="color: #FFF;">${weather.rainfallRateMmH} mm/h</strong></div>
        <div>Temp: <strong style="color: #FFF;">${weather.tempC}°C</strong></div>
        <div>Wind: <strong style="color: #FFF;">${weather.windKmh} km/h NE</strong></div>
      </div>
    `;
  }

  updateDriverAlerts(state);
}

function updateDriverAlerts(state) {
  const banner = document.getElementById('driver-disruption-banner');
  if (!banner) return;

  const activeTrip = (state.activeTrips || []).find(t => t.driverId === 'DRV-104');
  const isAffected = (activeTrip && activeTrip.isAffected) || state.driverDisruptionAlertActive;

  if (isAffected) {
    banner.style.display = 'block';
    banner.classList.add('pulse-border');
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #FF3B30; margin-bottom: 6px;">
        <span class="material-symbols-outlined" style="font-size: 22px;">flood</span>
        <strong class="font-display" style="font-size: 14px; letter-spacing: -0.01em;">CORRIDOR FLOOD DISRUPTION DETECTED</strong>
      </div>
      <div style="font-size: 12px; color: #FFF; line-height: 1.4;">
        <strong>S217 Velachery Main Road:</strong> Route A is confirmed <span style="color: #FF3B30; font-weight: bold;">BLOCKED</span> ahead by deep stormwater.<br />
        <strong>Route B (GST Elevated Bypass)</strong> is RECOMMENDED: +6 min, Risk 32 LOW.
      </div>
      <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #859493; margin-top: 6px;">
        <span>Status: High-Confidence Verified</span>
        <span>Target: TRK-104 (Rajesh Kumar)</span>
      </div>
      <button id="btn-view-disruption" class="btn-danger" style="margin-top: 8px; width: 100%;" onclick="document.getElementById('modal-disruption-report')?.classList.add('open')">
        INSPECT DISRUPTION DETAILS & REROUTE
      </button>
    `;
  } else {
    // If trip is rerouted and active on Route B
    if (activeTrip && activeTrip.status === 'REROUTED_ACTIVE') {
      banner.style.display = 'block';
      banner.classList.remove('pulse-border');
      banner.style.borderColor = '#00CED1';
      banner.style.background = 'rgba(0, 206, 209, 0.15)';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: #00CED1; margin-bottom: 4px;">
          <span class="material-symbols-outlined" style="font-size: 20px;">navigation</span>
          <strong class="font-display" style="font-size: 13px;">ACTIVE ON ROUTE B (GST ELEVATED BYPASS)</strong>
        </div>
        <div style="font-size: 12px; color: #DDE4E3;">
          Corridor clear of flood hazard. Navigating via Kathipara elevated bridge to Ripon Emergency Hub.
        </div>
      `;
    } else {
      banner.style.display = 'none';
    }
  }
}

