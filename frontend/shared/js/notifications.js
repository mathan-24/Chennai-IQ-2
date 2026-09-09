/**
 * ROUTE-IQ — Shared Notifications System
 */
import { store } from './store.js';
import { dialog } from './dialog.js';

export function notifyAlert(alert) {
  dialog.toast(`[ALERT] ${alert.title}`, alert.category === 'CRITICAL' ? 'critical' : 'warning');
}
