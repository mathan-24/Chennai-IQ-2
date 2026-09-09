/**
 * ROUTE-IQ — Seed Data: Operational Audit Trail
 */
export const seedAuditLogs = [
  {
    id: 'LOG-001',
    time: '14:22:04 IST',
    actor: 'FO-104 Vikram Singh',
    actorType: 'HUMAN ACTION',
    role: 'Field Recon Officer',
    action: 'HAZARD_REPORTED',
    entity: 'INC-1024',
    notes: 'Landslide observed at Milestone 14.2 with boulder obstruction.'
  },
  {
    id: 'LOG-002',
    time: '14:25:10 IST',
    actor: 'CR-01 Ananya Sharma',
    actorType: 'HUMAN ACTION',
    role: 'Control Room Dispatcher',
    action: 'INCIDENT_VERIFIED',
    entity: 'INC-1024',
    notes: 'Physical road blockage confirmed. Segment closed to heavy transports.'
  }
];
