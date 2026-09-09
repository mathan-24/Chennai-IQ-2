/**
 * ROUTE-IQ — Driver Navigation Module
 */
import { RouteIQMap } from '../../shared/js/map.js';

let driverMap = null;

export function initNav() {
  const container = document.getElementById('driver-nav-container');
  if (!container) return;
  if (!driverMap) {
    driverMap = new RouteIQMap('driver-nav-container', { isInteractive: true });
    driverMap.init();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
});
