/**
 * ROUTE-IQ — Field Officer Dashboard JS
 */
import { store } from '../../shared/js/store.js';

export function initFieldDashboard() {
  console.info('[Field Officer] Dashboard initialized for:', store.getState().session.user);
}

document.addEventListener('DOMContentLoaded', () => {
  initFieldDashboard();
});
