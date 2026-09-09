/**
 * ROUTE-IQ — Control Room Reports Module
 */
import { store } from '../../shared/js/store.js';

export function renderReports() {
  const container = document.getElementById('reports-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">FIELD OBSERVATION LOGS</h2>
      <p style="color: var(--text-on-surface-variant); font-size: 13px;">Logged recon reports: ${state.incidents.length}</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderReports();
});
