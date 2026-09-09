/**
 * ROUTE-IQ — Control Room Users Module
 */
import { store } from '../../shared/js/store.js';

export function renderUsers() {
  const container = document.getElementById('users-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">ACTIVE OPERATOR ROSTER</h2>
      <p style="color: var(--text-on-surface-variant); font-size: 13px;">Session User: ${state.session.user?.name || 'Authenticated Operator'} (${state.session.role})</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderUsers();
});
