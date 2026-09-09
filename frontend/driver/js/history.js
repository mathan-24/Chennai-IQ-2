/**
 * ROUTE-IQ — Driver History Module
 */
import { store } from '../../shared/js/store.js';

export function renderHistory() {
  const container = document.getElementById('driver-history-container');
  if (!container) return;
  container.innerHTML = `
    <div class="glass-panel" style="padding: 16px;">
      <h3 style="color: #FFF;">PREVIOUS EXPEDITIONS</h3>
      <p style="color: var(--text-on-surface-variant); font-size: 12px; margin-top: 4px;">Completed Runs: 42 Corridors Traversals · Safety Rating: 99.4%</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
});
