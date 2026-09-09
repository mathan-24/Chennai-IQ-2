/**
 * ROUTE-IQ — Control Room Routes Module
 */
import { store } from '../../shared/js/store.js';

export function renderRoutes() {
  const container = document.getElementById('routes-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">ACTIVE CORRIDORS</h2>
      <ul style="list-style: none; padding: 0;">
        ${state.routes.map(r => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-outline);">${r.id}: ${r.name} - Risk: ${r.riskScore}/100 (${r.status})</li>`).join('')}
      </ul>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderRoutes();
  store.subscribe(renderRoutes);
});
