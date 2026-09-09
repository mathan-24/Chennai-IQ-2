/**
 * ROUTE-IQ — Driver Dashboard Module
 */
import { store } from '../../shared/js/store.js';

export function initDriverDashboard() {
  console.info('[Driver] In-cab terminal initialized:', store.getState().session.user);
}

document.addEventListener('DOMContentLoaded', () => {
  initDriverDashboard();
});
