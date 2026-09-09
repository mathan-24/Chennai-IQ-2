/**
 * ROUTE-IQ — Control Room Settings & Calibration Module
 */
import { store } from '../../shared/js/store.js';

export function renderSettings() {
  const container = document.getElementById('settings-container');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = `
    <div class="glass-panel" style="padding: 20px;">
      <h2 style="font-size: 16px; margin-bottom: 12px; color: #FFF;">RISK ENGINE TUNING</h2>
      <p style="color: var(--text-on-surface-variant); font-size: 13px;">Rainfall Weight: ${state.riskWeights?.rainfallWeightPercent || 40}%</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderSettings();
});
