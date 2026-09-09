/**
 * ROUTE-IQ — Driver Alerts Module
 */
import { store } from '../../shared/js/store.js';

export function renderDriverAlerts() {
  const container = document.getElementById('driver-alerts-container');
  if (!container) return;
  const alerts = store.getState().alerts || [];
  container.innerHTML = alerts.map(a => `
    <div class="glass-panel" style="padding: 12px; margin-bottom: 8px; border-left: 3px solid var(--color-critical);">
      <div style="font-weight: bold; color: #FFF;">${a.title}</div>
      <div style="font-size: 11px; color: var(--text-on-surface-variant);">${a.affected} · ${a.time}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderDriverAlerts();
});
