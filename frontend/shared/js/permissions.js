/**
 * ROUTE-IQ — Role-Based Permissions & Clearance Enforcement
 */
export const ROLES = {
  CONTROL_ROOM: 'CONTROL_ROOM',
  FIELD_OFFICER: 'FIELD_OFFICER',
  DRIVER: 'DRIVER'
};

export const PERMISSIONS = {
  VERIFY_INCIDENT: ['CONTROL_ROOM'],
  TRANSMIT_REROUTE: ['CONTROL_ROOM'],
  SUBMIT_HAZARD: ['FIELD_OFFICER', 'CONTROL_ROOM'],
  ACCEPT_MISSION: ['DRIVER'],
  CALIBRATE_RISK: ['CONTROL_ROOM']
};

export function hasPermission(role, permissionKey) {
  const allowed = PERMISSIONS[permissionKey] || [];
  return allowed.includes(role);
}
