/**
 * ROUTE-IQ — Central API Client
 * Provides RESTful communication with backend services, with explicit distinction
 * between REAL API RESPONSES and LOCAL STORE / MOCK FALLBACKS.
 */

import { store } from './store.js';

export const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
  ? window.API_BASE_URL
  : '/api';

class RouteIQApiClient {
  constructor() {
    this.isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    this.lastSource = 'mock'; // 'api' or 'mock'
    this.apiAvailable = null; // true, false, or null (unknown)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOffline = false;
        if (typeof store.setNetworkStatus === 'function') {
          store.setNetworkStatus('ONLINE');
        }
      });
      window.addEventListener('offline', () => {
        this.isOffline = true;
        if (typeof store.setNetworkStatus === 'function') {
          store.setNetworkStatus('OFFLINE');
        }
      });
    }
  }

  getLastDataSource() {
    return this.lastSource;
  }

  isLiveApiConnected() {
    return this.apiAvailable === true;
  }

  async request(endpoint, options = {}) {
    if (this.isOffline) {
      this.lastSource = 'mock';
      return { data: null, source: 'mock', isFallback: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 3000);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      this.apiAvailable = true;
      this.lastSource = 'api';
      return { data: json, source: 'api', isFallback: false };
    } catch (err) {
      this.apiAvailable = false;
      this.lastSource = 'mock';
      console.info(`[API CLIENT INFO] Endpoint ${endpoint} unreachable (${err.message}). Using local store fallback.`);
      return { data: null, source: 'mock', isFallback: true, error: err.message };
    }
  }

  // Auth
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.data && res.data.session) {
      return res.data.session;
    }
    return store.login(email, password);
  }

  async verifySecondStage(payload) {
    const res = await this.request('/auth/verify-role', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    // Always sync store state
    store.verifySecondStage(payload);
    if (res.data && res.data.success !== undefined) {
      return res.data.success;
    }
    return true;
  }

  // Incidents
  async getIncidents() {
    const res = await this.request('/incidents');
    return res.data || store.getState().incidents;
  }

  async reportIncident(incidentData) {
    const res = await this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData)
    });
    return res.data || store.reportIncident(incidentData);
  }

  async verifyIncident(incidentId, approved = true) {
    const res = await this.request(`/incidents/${incidentId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approved })
    });
    return res.data || store.verifyIncident(incidentId, approved);
  }

  // Dispatches
  async transmitDispatch(vehicleId, routeId) {
    const res = await this.request('/dispatches', {
      method: 'POST',
      body: JSON.stringify({ vehicle_id: vehicleId, route_id: routeId })
    });
    return res.data || store.transmitRouteDispatch(vehicleId, routeId);
  }

  async acknowledgeRoute(driverId, routeId) {
    const res = await this.request('/dispatches/acknowledge', {
      method: 'POST',
      body: JSON.stringify({ driver_id: driverId, route_id: routeId })
    });
    return res.data || store.acknowledgeDriverRoute(driverId, routeId);
  }

  // Weather & Risk
  async getWeather() {
    const res = await this.request('/weather');
    return res.data || store.getState().weather;
  }

  async computeRisk(payload) {
    const res = await this.request('/risk/compute', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data || store.getState().riskFactorsRouteB;
  }
}

export const api = new RouteIQApiClient();

