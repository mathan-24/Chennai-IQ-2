/**
 * ROUTE-IQ — Control Room Deliveries Module
 */
import { store } from '../../shared/js/store.js';

export function renderDeliveries() {
  const container = document.getElementById('deliveries-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">CARGO EXPEDITIONS</h2>
      <ul style="list-style: none; padding: 0;">
        ${state.deliveries.map(d => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-outline);">${d.id}: ${d.manifestTitle} - ${d.cargo}</li>`).join('')}
      </ul>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderDeliveries();
  store.subscribe(renderDeliveries);
});
