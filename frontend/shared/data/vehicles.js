/**
 * CHENNAI-IQ — Seed Data: Emergency & Relief Fleet Vehicles
 * Active Logistics & Response Units in Chennai Metropolitan Area.
 */
export const seedVehicles = [
  {
    id: 'TN-01-AB-1042',
    aliasId: 'TRK-104',
    plateNumber: 'TN-01-AB-1042',
    driverId: 'DRV-104',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98401-22459',
    vehicleType: 'Ashok Leyland 4x4 High-Clearance Response Truck',
    status: 'ACTIVE',
    tripStatus: 'ACTIVE',
    cargo: 'Emergency Flood Relief Supplies & Dewatering Gear',
    cargoWeightKg: 1850,
    currentRoute: 'Route A (Velachery Main Road via S217)',
    speed: '42 km/h',
    fuel: '82%',
    location: { lat: 13.0067, lng: 80.2025 }, // Guindy Hub, Chennai
    origin: 'Guindy Central Logistics Hub',
    destination: 'Velachery Emergency Relief Center',
    eta: '34 min',
    lastTelemetry: '10s ago (SIMULATED)',
    gpsAccuracy: '±4 m'
  },
  {
    id: 'TN-09-AX-2088',
    aliasId: 'TRK-208',
    plateNumber: 'TN-09-AX-2088',
    driverId: 'DRV-208',
    driverName: 'S. Murugan',
    driverPhone: '+91 98405-33102',
    vehicleType: 'Heavy Emergency Convoy Carrier',
    status: 'ACTIVE',
    tripStatus: 'ACTIVE',
    cargo: 'High-Capacity Mobile Water Pump Unit',
    cargoWeightKg: 4200,
    currentRoute: 'Route B (GST Road / Kathipara Elevated Flyover)',
    speed: '50 km/h',
    fuel: '86%',
    location: { lat: 13.0080, lng: 80.2080 }, // Near Kathipara
    origin: 'Tambaram Disaster Base',
    destination: 'Chennai Central Operations Depot',
    eta: '28 min',
    lastTelemetry: '20s ago (SIMULATED)',
    gpsAccuracy: '±5 m'
  }
];
