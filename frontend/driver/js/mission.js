/**
 * ROUTE-IQ — Driver Mission Module
 */
import { store } from '../../shared/js/store.js';

export function renderMission() {
  const container = document.getElementById('driver-mission-container');
  if (!container) return;
  const delivery = store.getState().deliveries[0] || {};
  container.innerHTML = `
    <div class="glass-panel" style="padding: 16px;">
      <h2 style="color: #FFF; font-size: 15px;">ASSIGNED MANIFEST: ${delivery.id || 'MED-EXP-8801'}</h2>
      <p style="color: var(--text-on-surface-variant); font-size: 12px; margin-top: 6px;">Cargo: ${delivery.cargo || 'Emergency Vaccines'}</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderMission();
});
