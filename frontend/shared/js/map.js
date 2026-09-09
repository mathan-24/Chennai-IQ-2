/**
 * CHENNAI-IQ — Interactive Leaflet & Flood Risk Map Engine
 * 
 * Renders:
 * - Chennai Road Segments as the primary monitoring unit (colored by risk score: LOW, MODERATE, HIGH, CRITICAL, BLOCKED)
 * - Interactive road segment inspection cards with physical & environmental factors
 * - Candidate routes (Route A via Velachery S217, Route B via GST Kathipara Elevated Bypass)
 * - Fleet vehicles with live driver telemetry & cargo manifests
 * - Field Officer patrol locations
 * - Active flood hazards & automated inspection markers
 * - Origin & Destination Emergency Logistics Hubs
 * 
 * Pure Vanilla JavaScript & Leaflet.
 */

import { store } from './store.js';

export class RouteIQMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = Object.assign({
      center: [13.0150, 80.2200], // Chennai Metropolitan Corridor
      zoom: 12,
      interactive: true,
      showLegend: true,
      focusVehicle: null
    }, options);

    this.map = null;
    this.layers = {
      roadSegments: null,
      routes: null,
      hazards: null,
      vehicles: null,
      officers: null,
      destinations: null
    };
    
    this.init();
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (typeof L === 'undefined') {
      this.renderFallbackGrid(container);
      return;
    }

    try {
      this.map = L.map(this.containerId, {
        zoomControl: false,
        attributionControl: false
      }).setView(this.options.center, this.options.zoom);

      // CartoDB Dark Matter Basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(this.map);

      // Layer groups
      this.layers.roadSegments = L.layerGroup().addTo(this.map);
      this.layers.routes = L.layerGroup().addTo(this.map);
      this.layers.hazards = L.layerGroup().addTo(this.map);
      this.layers.vehicles = L.layerGroup().addTo(this.map);
      this.layers.officers = L.layerGroup().addTo(this.map);
      this.layers.destinations = L.layerGroup().addTo(this.map);

      L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      this.renderFeatures();
    } catch (e) {
      console.warn('[CHENNAI-IQ Map] Leaflet init error, using fallback:', e);
      this.renderFallbackGrid(container);
    }
  }

  getRiskColor(level, status) {
    if (status === 'BLOCKED') return '#FF3B30'; // Red
    if (level === 'CRITICAL') return '#FF453A';
    if (level === 'HIGH') return '#FF7043';
    if (level === 'MODERATE') return '#FFA54A';
    return '#38E54D'; // LOW
  }

  renderFeatures() {
    if (!this.map) return;

    const state = store.getState();

    // Clear previous layers
    this.layers.roadSegments.clearLayers();
    this.layers.routes.clearLayers();
    this.layers.hazards.clearLayers();
    this.layers.vehicles.clearLayers();
    this.layers.officers.clearLayers();
    this.layers.destinations.clearLayers();

    // 1. Render Road Segments (Primary Monitoring Units)
    (state.roadSegments || []).forEach(segment => {
      if (!segment.geometry || segment.geometry.length < 2) return;

      const isBlocked = (segment.operationalStatus === 'BLOCKED');
      const isCritical = (segment.currentRiskLevel === 'CRITICAL');
      const color = this.getRiskColor(segment.currentRiskLevel, segment.operationalStatus);
      const weight = isBlocked || isCritical ? 7 : 5;
      const opacity = isBlocked ? 0.95 : 0.85;
      const dashArray = isBlocked ? '6, 6' : null;

      const poly = L.polyline(segment.geometry, {
        color: color,
        weight: weight,
        opacity: opacity,
        dashArray: dashArray,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.layers.roadSegments);

      // Segment interactive detail popup
      poly.bindPopup(`
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #E1E7E6; background: #0B0E14; padding: 12px; border: 1px solid ${color}; border-radius: 8px; min-width: 250px; box-shadow: 0 4px 16px rgba(0,0,0,0.8);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="color: ${color}; font-size: 13px;">SEGMENT ${segment.segmentId}</strong>
            <span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; color: ${color};">
              ${segment.currentRiskLevel} (${segment.currentRiskScore}/100)
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #FFF; margin-bottom: 6px;">${segment.roadName}</div>
          <div style="font-size: 10px; color: #8C9E9D; margin-bottom: 4px;">Zone: ${segment.zone} • Type: ${segment.roadType}</div>
          
          <div style="margin-top: 8px; padding: 6px; background: rgba(0,0,0,0.4); border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Operational Status:</span>
              <strong style="color: ${isBlocked ? '#FF453A' : '#00CED1'};">${segment.operationalStatus}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Current Rainfall:</span>
              <strong style="color: #60A5FA;">${state.weather.rainfallMm24h} mm</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Elev. Susceptibility:</span>
              <span>${(segment.elevationSusceptibility * 100).toFixed(0)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Drainage Susceptibility:</span>
              <span>${(segment.drainageSusceptibility * 100).toFixed(0)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Roadbed Vulnerability:</span>
              <span>${(segment.roadVulnerability * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div style="margin-top: 6px; font-size: 9px; color: #859493;">
            Last risk update: ${segment.lastRiskUpdate}<br>
            Verification: ${segment.lastVerifiedUpdate || 'None'}
          </div>
        </div>
      `);
    });

    // 2. Render Candidate Corridors / Routes
    (state.routes || []).forEach(route => {
      if (!route.points || route.points.length < 2) return;
      const isRec = route.status === 'RECOMMENDED' || route.isRecommended;
      const isBlocked = route.status === 'BLOCKED' || route.isBlocked;
      const routeColor = isBlocked ? '#FF3B30' : (isRec ? '#00CED1' : '#FFA54A');
      const routeDash = isBlocked ? '5, 8' : (isRec ? null : '6, 6');
      const routeWeight = isRec ? 5.5 : 3.5;
      const routeOpacity = isRec ? 0.9 : 0.6;

      L.polyline(route.points, {
        color: routeColor,
        weight: routeWeight,
        opacity: routeOpacity,
        dashArray: routeDash
      }).addTo(this.layers.routes).bindPopup(`
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FFF; background: #0B0E14; padding: 10px; border: 1px solid ${routeColor}; border-radius: 6px; min-width: 220px;">
          <div style="font-size: 12px; font-weight: bold; color: ${routeColor}; margin-bottom: 4px;">${route.name}</div>
          <div>Status: <strong>${route.status}</strong></div>
          <div>Estimated Time: <strong>${route.estMinutes} min</strong> (${route.distanceKm} km)</div>
          <div>Flood-Access Risk: <strong>${route.riskScore}/100</strong></div>
          <div style="margin-top: 6px; font-size: 10px; color: #8C9E9D;">${route.floodExposureSummary || ''}</div>
        </div>
      `);
    });

    // 3. Render Fleet Vehicles (TRK-104 & TRK-208)
    (state.vehicles || []).forEach(v => {
      if (!v.location) return;
      const isPrimary = (v.id === 'TRK-104');
      const markerColor = isPrimary ? '#00CED1' : '#38E54D';

      const vehicleHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 32px; height: 32px; background: rgba(11,14,20,0.9); border: 2px solid ${markerColor}; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${markerColor};">
            <span class="material-symbols-outlined" style="color: ${markerColor}; font-size: 18px;">local_shipping</span>
          </div>
          <div style="margin-top: 3px; background: #0B0E14; border: 1px solid ${markerColor}; color: ${markerColor}; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: bold; padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
            ${v.id}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: vehicleHtml,
        className: 'custom-vehicle-marker',
        iconSize: [36, 46],
        iconAnchor: [18, 23]
      });

      L.marker([v.location.lat, v.location.lng], { icon }).addTo(this.layers.vehicles)
        .bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #DDE4E3; background: #0B0E14; padding: 10px; border: 1px solid ${markerColor}; border-radius: 6px; min-width: 230px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 6px;">
              <strong style="color: ${markerColor}; font-size: 13px;">${v.id} (${v.plateNumber})</strong>
              <span style="background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 3px; font-size: 9px; color: #FFF;">${v.status}</span>
            </div>
            <div><strong>Driver:</strong> ${v.driverName}</div>
            <div><strong>Cargo:</strong> ${v.cargo}</div>
            <div><strong>Route:</strong> ${v.currentRoute}</div>
            <div><strong>Speed:</strong> ${v.speed} • ETA: ${v.eta}</div>
            <div style="color: #38E54D;"><strong>Cold Chain:</strong> ${v.coldChainTemp} (${v.coldChainStatus})</div>
          </div>
        `);
    });

    // 4. Render Field Officers
    (state.fieldOfficers || []).forEach(officer => {
      if (!officer.location) return;
      const isAvailable = (officer.status === 'AVAILABLE' || officer.status === 'ON_PATROL');
      const offColor = isAvailable ? '#38E54D' : '#FFA54A';

      const offHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 28px; height: 28px; background: rgba(11,14,20,0.9); border: 2px solid ${offColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${offColor};">
            <span class="material-symbols-outlined" style="color: ${offColor}; font-size: 16px;">security</span>
          </div>
          <div style="margin-top: 2px; background: #0B0E14; border: 1px solid ${offColor}; color: ${offColor}; font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
            ${officer.id}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: offHtml,
        className: 'custom-officer-marker',
        iconSize: [32, 42],
        iconAnchor: [16, 21]
      });

      L.marker([officer.location.lat, officer.location.lng], { icon }).addTo(this.layers.officers)
        .bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FFF; background: #0B0E14; padding: 8px; border: 1px solid ${offColor}; border-radius: 6px;">
            <strong style="color: ${offColor};">${officer.id}: ${officer.name}</strong><br>
            Station: ${officer.station}<br>
            Status: <strong>${officer.status}</strong><br>
            Contact: ${officer.contact}
          </div>
        `);
    });

    // 5. Render Active Hazards & Inspections
    (state.hazards || []).forEach(haz => {
      if (!haz.coordinates) return;
      const hazColor = haz.severity === 'CRITICAL' ? '#FF3B30' : '#FFA54A';

      const hazHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 32px; height: 32px; background: rgba(11,14,20,0.95); border: 2px solid ${hazColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${hazColor}; animation: pulse 2s infinite;">
            <span class="material-symbols-outlined" style="color: ${hazColor}; font-size: 18px;">flood</span>
          </div>
          <div style="margin-top: 2px; background: #0B0E14; border: 1px solid ${hazColor}; color: ${hazColor}; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: bold; padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
            ${haz.id}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: hazHtml,
        className: 'custom-haz-marker',
        iconSize: [36, 46],
        iconAnchor: [18, 23]
      });

      L.marker(haz.coordinates, { icon }).addTo(this.layers.hazards)
        .bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FFF; background: #0B0E14; padding: 10px; border: 1px solid ${hazColor}; border-radius: 6px;">
            <strong style="color: ${hazColor};">${haz.id} (${haz.severity})</strong><br>
            <strong>Road:</strong> ${haz.roadName}<br>
            <strong>Reason:</strong> ${haz.reason}<br>
            <strong>Detected:</strong> ${haz.detectedAt}
          </div>
        `);
    });

    // 6. Render Origin & Destination Emergency Hubs
    const origin = [12.9249, 80.1000]; // Tambaram Base
    const dest = [13.0827, 80.2750];   // Ripon Building Central Hub

    const originHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 28px; height: 28px; background: rgba(0,206,209,0.2); border: 2px solid #00CED1; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px #00CED1;">
          <span class="material-symbols-outlined" style="color: #00CED1; font-size: 16px;">warehouse</span>
        </div>
        <div style="margin-top: 2px; background: #0B0E14; border: 1px solid #00CED1; color: #00CED1; font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
          TAMBARAM BASE
        </div>
      </div>
    `;

    const destHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 30px; height: 30px; background: rgba(56,229,77,0.2); border: 2px solid #38E54D; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #38E54D;">
          <span class="material-symbols-outlined" style="color: #38E54D; font-size: 18px;">domain</span>
        </div>
        <div style="margin-top: 2px; background: #0B0E14; border: 1px solid #38E54D; color: #38E54D; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: bold; padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
          RIPON EMERGENCY HUB
        </div>
      </div>
    `;

    L.marker(origin, {
      icon: L.divIcon({ html: originHtml, className: 'custom-hub-marker', iconSize: [32, 42], iconAnchor: [16, 21] })
    }).addTo(this.layers.destinations).bindPopup(`
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FFF; background: #0B0E14; padding: 8px; border: 1px solid #00CED1; border-radius: 6px;">
        <strong style="color: #00CED1;">ORIGIN: Tambaram Disaster Relief Base</strong><br>
        South Chennai Dispatch Staging Terminal
      </div>
    `);

    L.marker(dest, {
      icon: L.divIcon({ html: destHtml, className: 'custom-dest-marker', iconSize: [36, 46], iconAnchor: [18, 23] })
    }).addTo(this.layers.destinations).bindPopup(`
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FFF; background: #0B0E14; padding: 8px; border: 1px solid #38E54D; border-radius: 6px;">
        <strong style="color: #38E54D;">DESTINATION: Chennai Central Emergency Hub</strong><br>
        Ripon Building / Port Logistics Staging Area
      </div>
    `);
  }

  renderFallbackGrid(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #8C9E9D; font-family: 'JetBrains Mono', monospace;">
        <span class="material-symbols-outlined" style="font-size: 48px; color: #00CED1; margin-bottom: 8px;">map</span>
        <div style="font-size: 14px; font-weight: bold; color: #FFF;">CHENNAI-IQ FLOOD ACCESS RISK MAP</div>
        <div style="font-size: 11px; margin-top: 4px;">Sector North to Central Corridor • Leaflet Initializing...</div>
      </div>
    `;
  }
}
