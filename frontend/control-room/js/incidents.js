/**
 * ROUTE-IQ — Control Room Incidents Module
 */
import { store } from '../../shared/js/store.js';

export function renderIncidents() {
  const container = document.getElementById('incidents-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">ACTIVE INCIDENT QUEUE (${state.incidents.length})</h2>
      <ul style="list-style: none; padding: 0;">
        ${state.incidents.map(i => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-outline);">${i.id} - ${i.type} (${i.status})</li>`).join('')}
      </ul>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderIncidents();
  store.subscribe(renderIncidents);
});
