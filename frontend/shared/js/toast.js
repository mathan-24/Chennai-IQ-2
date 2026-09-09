/**
 * ROUTE-IQ — Shared Toast Notifications
 */
import { dialog } from './dialog.js';

export function showToast(message, type = 'info', duration = 3500) {
  dialog.toast(message, type, duration);
}
