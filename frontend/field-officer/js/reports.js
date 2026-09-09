/**
 * ROUTE-IQ — Field Officer Reports Module
 */
import { store } from '../../shared/js/store.js';

export function renderFieldReports() {
  const container = document.getElementById('field-reports-list');
  if (!container) return;
  const incidents = store.getState().incidents;
  container.innerHTML = incidents.map(inc => `
    <div class="glass-panel" style="padding: 12px; margin-bottom: 8px;">
      <div style="font-weight: bold; color: #FFF;">${inc.id} — ${inc.type}</div>
      <div style="font-size: 12px; color: var(--text-on-surface-variant);">${inc.roadSegment} · ${inc.status}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderFieldReports();
});
