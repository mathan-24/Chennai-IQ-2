/**
 * ROUTE-IQ — Control Room Overview Module
 */
import { store } from '../../shared/js/store.js';

export function initOverview() {
  const state = store.getState();
  console.info('[Control Room] Overview module initialized with state:', state.session);
}

document.addEventListener('DOMContentLoaded', () => {
  initOverview();
});
