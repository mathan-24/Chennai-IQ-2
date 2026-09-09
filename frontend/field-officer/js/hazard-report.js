/**
 * ROUTE-IQ — Field Officer Hazard Report Module
 */
import { store } from '../../shared/js/store.js';

export function submitHazardReport(data) {
  return store.reportIncident(data);
}
