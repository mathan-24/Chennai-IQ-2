/**
 * CHENNAI-IQ — Control Room Command Center Engine
 * 
 * Features:
 * - Citywide Road Segments Real-Time Risk Monitoring
 * - Monsoonal Rainfall Simulator & Continuous Risk Recalculation
 * - Automated Inspection Dispatch & Field Officer Tracking
 * - Control Room Exception Queue (Uncertain / Conflicting Reports Review)
 * - Dynamic Flood-Aware Route Evaluation & Targeted Driver Alerting
 * - Full End-to-End Simulation Scenario Runner
 * - Immutable Audit Trail
 * 
 * Pure Vanilla JavaScript (No React / No Vite).
 */

import { store, INCIDENT_PHOTO_PRESETS } from '../shared/js/store.js';
import { RouteIQMap } from '../shared/js/map.js';
import { dialog } from '../shared/js/dialog.js';

let controlMap = null;
let currentTab = 'tab-overview';
let activeFilter = 'ALL';
let searchQuery = '';

export const initControlRoomView = initControlRoom;
export const openIncidentDetails = openSegmentDetails;

export function getControlMap() {
  return controlMap;
}

export function initControlRoom() {
  const mapContainer = document.getElementById('cr-map-container');
  if (mapContainer && !controlMap) {
    controlMap = new RouteIQMap('cr-map-container', {
      center: [13.0080, 80.2150],
      zoom: 13,
      interactive: true,
      basemap: 'streets'
    });
  } else if (controlMap && controlMap.map) {
    setTimeout(() => {
      controlMap.map.invalidateSize();
      controlMap.renderFeatures();
    }, 150);
  }

  setupEventListeners();
  renderControlRoomData();

  store.subscribe((state) => {
    renderControlRoomData();
    if (controlMap) {
      controlMap.renderFeatures();
    }
  });
}

function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.side-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      if (tabId) switchControlRoomTab(tabId);
    });
  });

  // Rainfall Quick Buttons (if present in DOM)
  setupRainfallControls();

  // Modal Close Buttons
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('btn-close-modal')) {
        modal.classList.remove('open');
      }
    });
  });

  // Exception Review Action Buttons in Modal
  const btnApproveException = document.getElementById('btn-approve-exception');
  if (btnApproveException) {
    btnApproveException.addEventListener('click', () => {
      const repId = btnApproveException.getAttribute('data-report-id');
      if (repId) {
        store.controlRoomResolveException(repId, true, 'Control Room confirmed physical road blockage based on evidence.');
        document.getElementById('modal-exception-review')?.classList.remove('open');
        dialog.toast('Report approved: Road officially marked BLOCKED. Affected drivers alerted.', 'success');
      }
    });
  }

  const btnRejectException = document.getElementById('btn-reject-exception');
  if (btnRejectException) {
    btnRejectException.addEventListener('click', () => {
      const repId = btnRejectException.getAttribute('data-report-id');
      if (repId) {
        store.controlRoomResolveException(repId, false, 'Control Room rejected closure: road remains passable.');
        document.getElementById('modal-exception-review')?.classList.remove('open');
        dialog.toast('Report rejected. Road remains OPEN.', 'info');
      }
    });
  }

  // End-to-End Simulation Runner
  const btnRunScenario = document.getElementById('btn-run-full-scenario');
  if (btnRunScenario) {
    btnRunScenario.addEventListener('click', () => {
      runFullEndToEndScenario();
    });
  }
}

export function setupRainfallControls() {
  const slider = document.getElementById('cr-rainfall-slider');
  const rainValueDisplay = document.getElementById('cr-rainfall-val-display');

  if (slider) {
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (rainValueDisplay) rainValueDisplay.textContent = `${val} mm`;
      store.setRainfall(val);
    });
  }

  document.querySelectorAll('.btn-rain-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const mm = parseFloat(btn.getAttribute('data-rain'));
      if (!isNaN(mm)) {
        if (slider) slider.value = mm;
        if (rainValueDisplay) rainValueDisplay.textContent = `${mm} mm`;
        store.setRainfall(mm);
        dialog.toast(`Rainfall updated to ${mm} mm. Citywide road segment risk recalculated.`, 'info');
      }
    });
  });
}

export function switchControlRoomTab(tabId) {
  currentTab = tabId;

  document.querySelectorAll('.side-nav .nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('.cr-tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });

  const target = document.getElementById(tabId);
  if (target) {
    target.style.display = 'flex';
  }

  if (tabId === 'tab-overview' && controlMap && controlMap.map) {
    setTimeout(() => controlMap.map.invalidateSize(), 200);
  }

  renderControlRoomData();
}

export function renderControlRoomData() {
  const state = store.getState();

  // 1. Update Header Rainfall & Mode
  const rainIndicator = document.getElementById('cr-rainfall-badge');
  if (rainIndicator) {
    rainIndicator.innerHTML = `
      <span class="pulse-circle" style="width: 7px; height: 7px; background: #60A5FA;"></span>
      <strong style="color: #FFF;">${state.weather.rainfallMm24h} mm</strong> (SIMULATION MODE)
    `;
  }

  // 2. KPIs
  const highRiskCount = (state.roadSegments || []).filter(s => s.currentRiskLevel === 'HIGH' || s.currentRiskLevel === 'CRITICAL').length;
  const blockedCount = (state.roadSegments || []).filter(s => s.operationalStatus === 'BLOCKED' || s.operationalStatus === 'PARTIALLY BLOCKED').length;
  const taskCount = (state.fieldTasks || []).filter(t => t.status === 'ASSIGNED' || t.status === 'ACCEPTED' || t.status === 'ON_SITE').length;
  const exceptionCount = (state.controlRoomExceptions || []).length;
  const affectedTripsCount = (state.activeTrips || []).filter(t => t.isAffected).length;

  const elActive = document.getElementById('kpi-active-incidents');
  if (elActive) elActive.textContent = highRiskCount;

  const elPending = document.getElementById('kpi-pending-verification');
  if (elPending) elPending.textContent = exceptionCount + taskCount;

  const elAffectedVehicles = document.getElementById('kpi-affected-vehicles');
  if (elAffectedVehicles) elAffectedVehicles.textContent = affectedTripsCount;

  const elCriticalRoads = document.getElementById('kpi-critical-roads');
  if (elCriticalRoads) elCriticalRoads.textContent = (state.roadSegments || []).length;

  // 3. Render Road Segments Feed on Overview
  renderOverviewSegmentsFeed(state);

  // 4. Render Tab-specific tables
  renderRoadSegmentsTable(state);
  renderTasksTable(state);
  renderExceptionsQueue(state);
  renderVehiclesTable(state);
  renderRoutesTable(state);
  renderDeliveriesTable(state);
  renderAlertsList(state);
  renderAuditLogs(state);
}

function renderOverviewSegmentsFeed(state) {
  const feed = document.getElementById('cr-recent-incidents-feed');
  if (!feed) return;

  const segments = state.roadSegments || [];
  feed.innerHTML = segments.map(s => {
    const isBlocked = s.operationalStatus === 'BLOCKED';
    const color = isBlocked ? '#FF3B30' : (s.currentRiskLevel === 'CRITICAL' ? '#FF453A' : (s.currentRiskLevel === 'HIGH' ? '#FF7043' : (s.currentRiskLevel === 'MODERATE' ? '#FFA54A' : '#38E54D')));
    
    return `
      <div class="glass-panel-subtle interactive-glow" style="padding: 12px; margin-bottom: 8px; cursor: pointer; border-left: 3px solid ${color};" onclick="window.RouteIQ.openSegmentDetails('${s.segmentId}')">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="data-mono" style="color: ${color}; font-weight: bold;">${s.segmentId}</span>
            <span class="badge-status" style="background: rgba(255,255,255,0.1); color: ${color}; font-size: 10px;">${s.currentRiskLevel} (${s.currentRiskScore}/100)</span>
          </div>
          <span class="data-mono" style="font-size: 10px; color: ${isBlocked ? '#FF453A' : '#00CED1'}; font-weight: bold;">${s.operationalStatus}</span>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: #FFF; margin-bottom: 2px;">${s.roadName}</div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #859493;">
          <span>Zone: ${s.zone}</span>
          <span>Rain: ${state.weather.rainfallMm24h} mm</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderRoadSegmentsTable(state) {
  const tableBody = document.getElementById('cr-incidents-table-body');
  if (!tableBody) return;

  const segments = state.roadSegments || [];
  tableBody.innerHTML = segments.map(s => {
    const isBlocked = s.operationalStatus === 'BLOCKED';
    const color = isBlocked ? '#FF3B30' : (s.currentRiskLevel === 'CRITICAL' ? '#FF453A' : (s.currentRiskLevel === 'HIGH' ? '#FF7043' : (s.currentRiskLevel === 'MODERATE' ? '#FFA54A' : '#38E54D')));
    
    return `
      <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.4); font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        <td style="padding: 12px 10px; color: ${color}; font-weight: bold;">${s.segmentId}</td>
        <td style="padding: 12px 10px; color: #FFF; font-weight: 600;">
          ${s.roadName}
          <div style="font-size: 10px; color: #859493;">${s.zone} • ${s.roadType}</div>
        </td>
        <td style="padding: 12px 10px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="badge-status" style="background: rgba(255,255,255,0.08); color: ${color}; font-weight: bold;">
              ${s.currentRiskLevel} (${s.currentRiskScore}/100)
            </span>
          </div>
          <div style="font-size: 9px; color: #859493; margin-top: 2px;">
            Elev: ${(s.elevationSusceptibility*100).toFixed(0)}% • Drain: ${(s.drainageSusceptibility*100).toFixed(0)}%
          </div>
        </td>
        <td style="padding: 12px 10px;">
          <span class="badge-status ${isBlocked ? 'badge-critical' : (s.operationalStatus === 'WATERLOGGED' ? 'badge-warning' : 'badge-verified')}">
            ${s.operationalStatus}
          </span>
        </td>
        <td style="padding: 12px 10px; color: #859493;">${s.lastRiskUpdate}</td>
        <td style="padding: 12px 10px;">
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 10px;" onclick="window.RouteIQ.openSegmentDetails('${s.segmentId}')">
            <span class="material-symbols-outlined" style="font-size: 12px;">visibility</span> INSPECT
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTasksTable(state) {
  const container = document.getElementById('cr-tasks-table-body');
  if (!container) return;

  const tasks = state.fieldTasks || [];
  if (tasks.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 24px; text-align: center; color: #859493; font-family: 'JetBrains Mono', monospace;">
          No automated inspection tasks generated yet. Tasks are triggered when road segments cross risk thresholds.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = tasks.map(t => `
    <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.4); font-family: 'JetBrains Mono', monospace; font-size: 12px;">
      <td style="padding: 10px; color: #00CED1; font-weight: bold;">${t.id}</td>
      <td style="padding: 10px; color: #FFF;">
        ${t.roadName} (${t.segmentId})
        <div style="font-size: 10px; color: #859493;">${t.reason}</div>
      </td>
      <td style="padding: 10px;">
        <span class="badge-status ${t.priority === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}">${t.priority}</span>
      </td>
      <td style="padding: 10px; color: #FFF;">
        ${t.assignedOfficerName || 'Awaiting assignment'}
        ${t.distanceKm ? `<div style="font-size: 10px; color: #00CED1;">${t.distanceKm} km away</div>` : ''}
      </td>
      <td style="padding: 10px;">
        <span class="badge-status ${t.status === 'VERIFIED' ? 'badge-verified' : (t.status === 'ON_SITE' ? 'badge-recommended' : 'badge-under-review')}">
          ${t.status}
        </span>
      </td>
      <td style="padding: 10px; color: #859493;">${t.createdAt}</td>
    </tr>
  `).join('');
}

function renderExceptionsQueue(state) {
  const container = document.getElementById('cr-exceptions-container');
  if (!container) return;

  const exceptions = state.controlRoomExceptions || [];
  if (exceptions.length === 0) {
    container.innerHTML = `
      <div class="glass-panel-subtle" style="padding: 18px; text-align: center; color: #859493; font-family: 'JetBrains Mono', monospace;">
        <span class="material-symbols-outlined" style="font-size: 32px; color: #38E54D; margin-bottom: 6px;">check_circle</span>
        <div style="font-size: 13px; color: #FFF; font-weight: bold;">Exception Review Queue Empty</div>
        <div style="font-size: 11px; margin-top: 4px;">All high-confidence reports were automatically processed. No conflicting or uncertain reports require operator intervention.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = exceptions.map(exc => `
    <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; border: 1px solid #FFA54A;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div>
          <span class="badge-status badge-warning">${exc.confidence} (${exc.confidenceScore}/100 SCORE)</span>
          <h4 style="font-size: 15px; color: #FFF; font-weight: bold; margin-top: 4px;">${exc.roadSegment} (${exc.segmentId})</h4>
        </div>
        <span class="data-mono" style="font-size: 11px; color: #859493;">${exc.reportedTime}</span>
      </div>
      
      <div style="font-size: 12px; color: #DDE4E3; margin-bottom: 8px;">
        ${exc.description}
      </div>

      <div style="font-size: 11px; color: #FFA54A; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px;">
        <strong>Confidence Flags:</strong> ${(exc.reasons || []).join(' • ')}
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="btn-primary" style="padding: 6px 12px; font-size: 11px;" onclick="window.RouteIQ.openExceptionModal('${exc.id}')">
          <span class="material-symbols-outlined" style="font-size: 14px;">gavel</span> REVIEW & DECIDE
        </button>
      </div>
    </div>
  `).join('');
}

function renderVehiclesTable(state) {
  const tableBody = document.getElementById('cr-vehicles-table-body');
  if (!tableBody) return;

  const vehicles = state.vehicles || [];
  tableBody.innerHTML = vehicles.map(v => `
    <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.4); font-family: 'JetBrains Mono', monospace; font-size: 12px;">
      <td style="padding: 12px 10px; color: ${v.id === 'TRK-104' ? '#00CED1' : '#FFF'}; font-weight: bold;">
        ${v.id}
        <div style="font-size: 10px; color: #859493;">${v.plateNumber}</div>
      </td>
      <td style="padding: 12px 10px;">
        <div style="color: #FFF; font-weight: 600;">${v.driverName}</div>
        <div style="font-size: 10px; color: #00CED1;">${v.driverDesignation} • ${v.driverPhone}</div>
      </td>
      <td style="padding: 12px 10px;">
        <div style="color: #FFA54A; font-weight: 600;">${v.cargo}</div>
        <div style="font-size: 10px; color: #859493;">${v.cargoWeightKg} kg • ${v.cargoHazardClass}</div>
      </td>
      <td style="padding: 12px 10px;">
        <span class="badge-status ${v.currentRoute.includes('Route B') ? 'badge-recommended' : 'badge-warning'}">${v.currentRoute}</span>
      </td>
      <td style="padding: 12px 10px; color: #FFF; font-weight: bold;">${v.eta}</td>
      <td style="padding: 12px 10px; color: ${v.coldChainStatus === 'NORMAL' ? '#38E54D' : '#FF453A'}; font-weight: bold;">
        ${v.coldChainTemp}
      </td>
      <td style="padding: 12px 10px;">
        <span class="badge-status ${v.status === 'ACTIVE' ? 'badge-verified' : 'badge-critical'}">${v.status}</span>
      </td>
      <td style="padding: 12px 10px;">
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="window.RouteIQ.openVehicleDetails('${v.id}')">
          <span class="material-symbols-outlined" style="font-size: 12px;">info</span> DETAILS
        </button>
      </td>
    </tr>
  `).join('');
}

function renderRoutesTable(state) {
  const container = document.getElementById('cr-routes-comparison-container');
  if (!container) return;

  const routes = state.routes || [];
  container.innerHTML = routes.map(r => {
    const isRec = r.status === 'RECOMMENDED' || r.isRecommended;
    const isBlocked = r.status === 'BLOCKED' || r.isBlocked;
    const color = isBlocked ? '#FF3B30' : (isRec ? '#00CED1' : '#FFA54A');

    return `
      <div class="glass-panel" style="padding: 18px; margin-bottom: 14px; border: 1px solid ${color};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 style="font-size: 16px; font-weight: bold; color: ${color}; margin: 0;">${r.name}</h3>
            <span class="badge-status ${isBlocked ? 'badge-critical' : (isRec ? 'badge-recommended' : 'badge-warning')}">${r.status}</span>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: bold; color: ${color};">
            ${r.riskScore} <span style="font-size: 11px; color: #859493;">/ 100 RISK</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px;">
          <div>
            <span style="color: #859493; display: block;">DISTANCE</span>
            <strong style="color: #FFF; font-size: 13px;">${r.distanceKm} km</strong>
          </div>
          <div>
            <span style="color: #859493; display: block;">ESTIMATED TIME</span>
            <strong style="color: #FFF; font-size: 13px;">${r.estMinutes} min</strong>
          </div>
          <div>
            <span style="color: #859493; display: block;">MAX SEGMENT RISK</span>
            <strong style="color: ${color}; font-size: 13px;">${r.maxSegmentRisk || r.riskScore}</strong>
          </div>
          <div>
            <span style="color: #859493; display: block;">HIGH RISK EXPOSURE</span>
            <strong style="color: #FFF; font-size: 13px;">${r.highRiskSegmentPercent || 0}%</strong>
          </div>
        </div>

        <div style="margin-top: 10px; font-size: 12px; color: #DDE4E3;">
          ${r.floodExposureSummary || r.notes}
        </div>
      </div>
    `;
  }).join('');
}

function renderDeliveriesTable(state) {
  const container = document.getElementById('cr-deliveries-list');
  if (!container) return;

  const deliveries = state.deliveries || [];
  container.innerHTML = deliveries.map(d => `
    <div class="glass-panel" style="padding: 18px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="label-caps" style="color: #00CED1;">${d.id}</span>
            <span class="badge-status badge-critical">${d.priority} PRIORITY</span>
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #FFF; margin-top: 4px;">${d.manifestTitle}</div>
          <div style="font-size: 13px; color: #859493; margin-top: 2px;">${d.cargo}</div>
          <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #00CED1; margin-top: 4px;">
            Assigned: <strong>${d.vehicleId}</strong> (${d.vehiclePlate}) • Driver: <strong>${d.driverName}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge-status ${d.status === 'NORMAL' ? 'badge-verified' : 'badge-critical'}">${d.status}</span>
          <div class="data-mono" style="font-size: 11px; color: #859493; margin-top: 4px;">ETA: <strong style="color: #FFF;">${d.eta}</strong></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px;">
        <div>
          <span class="label-caps" style="color: #859493; display: block; margin-bottom: 4px;">ORIGIN</span>
          <div style="color: #FFF;">${d.origin}</div>
        </div>
        <div>
          <span class="label-caps" style="color: #859493; display: block; margin-bottom: 4px;">DESTINATION</span>
          <div style="color: #FFF;">${d.destination}</div>
        </div>
        <div>
          <span class="label-caps" style="color: #859493; display: block; margin-bottom: 4px;">COLD CHAIN TELEMETRY</span>
          <div style="font-size: 14px; font-weight: 700; color: #38E54D;">${d.coldChain.temp}</div>
          <div style="color: #859493;">${d.coldChain.safeRange} • ${d.coldChain.sensorHealth}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAlertsList(state) {
  const container = document.getElementById('cr-alerts-container');
  if (!container) return;

  const alerts = state.alerts || [];
  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #859493; font-family: 'JetBrains Mono', monospace;">
        No active targeted alerts. Alerts are transmitted exclusively to drivers traversing affected corridors.
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="glass-panel-subtle" style="padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid ${a.category === 'CRITICAL' ? '#FF3B30' : '#FFA54A'};">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span class="badge-status ${a.category === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}">${a.category}</span>
          <strong style="color: #FFF; font-size: 13px;">${a.title}</strong>
        </div>
        <div style="font-size: 12px; color: #DDE4E3; margin-bottom: 4px;">${a.message}</div>
        <div class="data-mono" style="font-size: 11px; color: #859493;">
          Target Driver: <span style="color: #00CED1; font-weight: bold;">${a.driverId} (${a.vehicleId})</span> • Trip: <span>${a.tripId}</span>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="data-mono" style="font-size: 11px; color: #FFF;">${a.time}</span>
        <div class="data-mono" style="font-size: 10px; color: ${a.acknowledged ? '#38E54D' : '#FFA54A'}; margin-top: 2px;">
          ${a.acknowledged ? '● ACKNOWLEDGED' : '○ PENDING DRIVER ACK'}
        </div>
      </div>
    </div>
  `).join('');
}

function renderAuditLogs(state) {
  const auditContainer = document.getElementById('cr-audit-log-rows');
  if (!auditContainer) return;

  const logs = state.auditLogs || [];
  auditContainer.innerHTML = logs.map(log => `
    <tr style="border-bottom: 1px solid rgba(30, 41, 59, 0.4); font-family: 'JetBrains Mono', monospace; font-size: 12px;">
      <td style="padding: 10px 14px; color: #859493;">${log.time}</td>
      <td style="padding: 10px 14px; color: #00CED1; font-weight: bold;">
        ${log.actor}
        <div style="font-size: 9px; color: #859493; font-family: 'Inter', sans-serif;">${log.role}</div>
      </td>
      <td style="padding: 10px 14px;">
        <span class="badge-status ${log.actorType === 'SYSTEM ACTION' ? 'badge-recommended' : 'badge-warning'}" style="font-size: 9px;">${log.actorType || 'HUMAN ACTION'}</span>
        <div style="font-size: 10px; color: #FFF; margin-top: 2px; font-weight: 600;">${log.action}</div>
      </td>
      <td style="padding: 10px 14px; color: #FFA54A; font-weight: bold;">${log.entity}</td>
      <td style="padding: 10px 14px; color: #DDE4E3; font-family: 'Inter', sans-serif; font-size: 12px;">${log.notes}</td>
    </tr>
  `).join('');
}

export function openSegmentDetails(segmentId) {
  const state = store.getState();
  const seg = (state.roadSegments || []).find(s => s.segmentId === segmentId) || state.roadSegments[0];
  const modal = document.getElementById('modal-incident-details');
  if (!modal || !seg) return;

  document.getElementById('modal-inc-id').textContent = seg.segmentId;
  document.getElementById('modal-inc-type').textContent = `ROAD SEGMENT: ${seg.roadName}`;
  document.getElementById('modal-inc-severity').textContent = `${seg.currentRiskLevel} (${seg.currentRiskScore}/100 RISK)`;
  document.getElementById('modal-inc-status').textContent = seg.operationalStatus;
  document.getElementById('modal-inc-road').textContent = `${seg.zone} • ${seg.roadType}`;
  document.getElementById('modal-inc-reporter').textContent = `Rainfall Model: ${state.weather.rainfallMm24h} mm`;
  document.getElementById('modal-inc-time').textContent = seg.lastRiskUpdate;
  document.getElementById('modal-inc-coords').textContent = `Elev: ${(seg.elevationSusceptibility*100).toFixed(0)}% • Drain: ${(seg.drainageSusceptibility*100).toFixed(0)}% • Vuln: ${(seg.roadVulnerability*100).toFixed(0)}%`;
  document.getElementById('modal-inc-desc').textContent = seg.historicalDisruptions || 'Monitored under Chennai Master Plan flood drainage network.';

  const photoContainer = document.getElementById('modal-inc-photos');
  if (photoContainer) {
    photoContainer.innerHTML = `
      <div style="position: relative; height: 160px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-outline);">
        <img src="https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80" alt="Segment Inundation" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; top: 6px; left: 6px;">
          <span class="badge-status badge-verified" style="font-size: 9px;">CORRIDOR SATELLITE RECON</span>
        </div>
      </div>
    `;
  }

  modal.classList.add('open');
}

export function openVehicleDetails(vehicleId) {
  const state = store.getState();
  const v = (state.vehicles || []).find(item => item.id === vehicleId);
  const modal = document.getElementById('modal-vehicle-details');
  if (!modal || !v) return;

  document.getElementById('modal-veh-id').textContent = `${v.id} • ${v.plateNumber}`;
  document.getElementById('modal-veh-driver').textContent = `${v.driverName} (${v.driverId})`;
  document.getElementById('modal-veh-designation').textContent = v.driverDesignation;
  document.getElementById('modal-veh-phone').textContent = v.driverPhone;
  document.getElementById('modal-veh-comms').textContent = v.driverCommsFreq;
  document.getElementById('modal-veh-type').textContent = v.type;
  document.getElementById('modal-veh-cargo').textContent = `${v.cargo} (${v.cargoWeightKg} kg • ${v.cargoHazardClass})`;
  document.getElementById('modal-veh-route').textContent = `${v.currentRoute} • ETA: ${v.eta}`;
  document.getElementById('modal-veh-speed').textContent = `${v.speed} • RPM: ${v.engineRpm}`;
  document.getElementById('modal-veh-fuel').textContent = `${v.fuel} (Oil: ${v.oilPressureBar} bar)`;
  document.getElementById('modal-veh-temp').textContent = `${v.coldChainTemp} (Safe: ${v.coldChainSafeRange})`;
  document.getElementById('modal-veh-sensor').textContent = v.sensorModel;
  document.getElementById('modal-veh-coords').textContent = `${v.location.lat}° N, ${v.location.lng}° E (${v.gpsAccuracy})`;

  modal.classList.add('open');
}

export function openExceptionModal(reportId) {
  const state = store.getState();
  const exc = (state.controlRoomExceptions || []).find(e => e.id === reportId);
  if (!exc) return;

  const modal = document.getElementById('modal-exception-review');
  if (!modal) return;

  document.getElementById('modal-exc-id').textContent = exc.id;
  document.getElementById('modal-exc-segment').textContent = `${exc.roadSegment} (${exc.segmentId})`;
  document.getElementById('modal-exc-confidence').textContent = `${exc.confidence} (${exc.confidenceScore}/100 Score)`;
  document.getElementById('modal-exc-reasons').textContent = (exc.reasons || []).join('; ');
  document.getElementById('modal-exc-desc').textContent = exc.description;

  const approveBtn = document.getElementById('btn-approve-exception');
  if (approveBtn) approveBtn.setAttribute('data-report-id', exc.id);

  const rejectBtn = document.getElementById('btn-reject-exception');
  if (rejectBtn) rejectBtn.setAttribute('data-report-id', exc.id);

  modal.classList.add('open');
}

// -----------------------------------------------------------------------------
// END-TO-END AUTOMATED SCENARIO RUNNER
// -----------------------------------------------------------------------------
export function runFullEndToEndScenario() {
  dialog.confirm({
    title: 'EXECUTE CHENNAI FLOOD ACCESS SCENARIO',
    message: `Run complete operational scenario (SIMULATION MODE):\n` +
      `1. Monsoonal precipitation surges to 150 mm\n` +
      `2. S217 Velachery risk climbs from MODERATE → HIGH (Risk Score: 78/100)\n` +
      `3. Automated flood hazard event detected\n` +
      `4. Inspection task created automatically (TASK-101)\n` +
      `5. Task assigned to nearest available Field Officer FO-02 (Sub-Inspector Selvam, 1.4 km away)\n` +
      `6. Officer arrives on-site & submits GPS fix + physical photographic evidence\n` +
      `7. Verification confidence evaluated: HIGH (85% Confidence Score)\n` +
      `8. Verification policy executed: Auto-process high-confidence observation → Road S217 updated to VERIFIED WATERLOGGED / BLOCKED\n` +
      `9. Active trips affected by S217 identified (TN-01-AB-1042 / Rajesh Kumar)\n` +
      `10. Candidate routes reevaluated (Route A: 82/100 Blocked vs Route B: 38/100 Open)\n` +
      `11. Lower-risk route recommended: Route B via GST Road / Kathipara Elevated Flyover (+5 min)\n` +
      `12. Affected driver receives targeted in-cab disruption alert!`,
    confirmText: 'RUN FLOOD SCENARIO',
    icon: 'play_arrow',
    onConfirm: () => {
      dialog.toast('Step 1-3/12: Precipitation surging to 150 mm (SIMULATION MODE)... S217 risk escalated to HIGH.', 'info', 3000);
      store.setRainfall(150);

      setTimeout(() => {
        const task = (store.getState().fieldTasks || []).find(t => t.segmentId === 'S217') || store.getState().fieldTasks[0];
        if (task) {
          dialog.toast(`Step 4-5/12: Task ${task.id} auto-assigned to nearest officer FO-02 (1.4 km away). Officer en route to Velachery...`, 'info', 3000);
          store.acceptTask(task.id);
          store.arriveOnSite(task.id);

          setTimeout(() => {
            dialog.toast('Step 6-8/12: Field evidence submitted. Verification Confidence: HIGH. Policy applied: Road S217 marked VERIFIED WATERLOGGED / BLOCKED.', 'warning', 3500);
            store.submitFieldReport({
              taskId: task.id,
              officerId: 'FO-02',
              segmentId: 'S217',
              conditionType: 'flooding',
              severity: 'CRITICAL',
              description: 'Velachery Lake water surged across highway lanes. Deep waterlogging measured at 65cm. Impassable for standard traffic.',
              coordinates: { lat: 12.9772, lng: 80.2215, accuracy: '±5 m' },
              evidencePhotos: [INCIDENT_PHOTO_PRESETS[0].url]
            });

            setTimeout(() => {
              dialog.toast('Step 9-12/12: S217 BLOCKED! Route B RECOMMENDED via GST Road (+5 min, Lower Risk 38/100). Targeted alert dispatched to Driver Rajesh Kumar (TN-01-AB-1042)!', 'success', 6000);
            }, 1800);
          }, 2500);
        }
      }, 2000);
    }
  });
}
