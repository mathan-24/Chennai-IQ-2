/**
 * CHENNAI-IQ — Driver Navigation Console View Module
 * 
 * Features:
 * - Real-time Chennai Metro Tactical Navigation
 * - Active Mission Information (Tambaram Base -> Ripon Building Central Hub)
 * - Live Northeast Monsoon Rainfall & Doppler Weather Conditions
 * - Targeted Disruption Alerts (Triggered exclusively when active route is affected)
 * - Dynamic Safer Route Recommendation (Route B via Kathipara Elevated Flyover)
 * - Reroute Acknowledgment & Navigation Engagement
 * - Driver Field Hazard Observation Reporting
 * 
 * Pure Vanilla JavaScript (No React / No Vite).
 */

import { store } from '../shared/js/store.js';
import { RouteIQMap } from '../shared/js/map.js';
import { setupImageUploader } from '../shared/js/image-upload.js';
import { dialog } from '../shared/js/dialog.js';

let driverMap = null;
let driverUploader = null;

export function initDriverView() {
  renderDriverData();

  // Initialize Map centered on Chennai Corridor
  if (!driverMap) {
    driverMap = new RouteIQMap('driver-map-container', {
      center: [13.0150, 80.2200],
      zoom: 12,
      focusVehicle: 'TRK-104'
    });
  }

  // Subscribe to state updates
  store.subscribe((state) => {
    updateDriverAlerts(state);
    renderDriverData();
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
