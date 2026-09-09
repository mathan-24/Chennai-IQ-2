/**
 * ROUTE-IQ — Control Room Maps Module
 */
import { RouteIQMap } from '../../shared/js/map.js';

let mapInstance = null;

export function initMap() {
  const container = document.getElementById('maps-container');
  if (!container) return;
  if (!mapInstance) {
    mapInstance = new RouteIQMap('maps-container', { isInteractive: true });
    mapInstance.init();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});
