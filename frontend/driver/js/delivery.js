/**
 * ROUTE-IQ — Driver Cargo & Cold-Chain Module
 */
import { store } from '../../shared/js/store.js';

export function renderDelivery() {
  const container = document.getElementById('driver-delivery-container');
  if (!container) return;
  const v = store.getState().vehicles.find(veh => veh.id === 'TRK-104') || {};
  container.innerHTML = `
    <div class="glass-panel" style="padding: 16px;">
      <h3 style="color: #FFF;">COLD CHAIN: <span style="color: var(--color-success);">${v.coldChainTemp || '+3.8°C'}</span></h3>
      <p style="color: var(--text-on-surface-variant); font-size: 12px; margin-top: 4px;">Refrigeration System Status: ACTIVE · Safe Range: +2°C to +8°C</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderDelivery();
});
