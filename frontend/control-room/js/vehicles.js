/**
 * ROUTE-IQ — Control Room Vehicles & Telemetry Module
 */
import { store } from '../../shared/js/store.js';

export function renderVehicles() {
  const container = document.getElementById('vehicles-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">ACTIVE FLEET TELEMETRY (${state.vehicles.length})</h2>
      <ul style="list-style: none; padding: 0;">
        ${state.vehicles.map(v => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-outline);">${v.id} (${v.plate}) - ${v.driverName} [${v.status}]</li>`).join('')}
      </ul>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderVehicles();
  store.subscribe(renderVehicles);
});
