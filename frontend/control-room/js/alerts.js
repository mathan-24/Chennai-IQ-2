/**
 * ROUTE-IQ — Control Room Alerts Module
 */
import { store } from '../../shared/js/store.js';

export function renderAlerts() {
  const container = document.getElementById('alerts-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">ACTIVE CORRIDOR ALERTS (${state.alerts.length})</h2>
      <ul style="list-style: none; padding: 0;">
        ${state.alerts.map(a => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-outline);">${a.title} - ${a.category}</li>`).join('')}
      </ul>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderAlerts();
  store.subscribe(renderAlerts);
});
