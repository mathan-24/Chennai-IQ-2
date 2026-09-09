/**
 * ROUTE-IQ — Field Officer Tasks Module
 */
import { store } from '../../shared/js/store.js';

export function renderTasks() {
  const container = document.getElementById('field-tasks-list');
  if (!container) return;
  const tasks = store.getState().fieldTasks || [];
  container.innerHTML = tasks.map(t => `
    <div class="glass-panel" style="padding: 12px; margin-bottom: 8px;">
      <div style="font-weight: bold; color: #FFF;">${t.id}: ${t.title}</div>
      <div style="font-size: 12px; color: var(--color-primary-bright);">Location: ${t.targetLocation} · Priority: ${t.priority}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
});
