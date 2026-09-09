/**
 * CHENNAI-IQ — Seed Data: Emergency & Relief Fleet Vehicles
 * Active Logistics & Transport Units in Chennai Metropolitan Area.
 */
export const seedVehicles = [
  {
    id: 'TRK-104',
    plateNumber: 'TN-09-CB-4812',
    driverId: 'DRV-104',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98401-22459',
    status: 'ACTIVE',
    coldChainStatus: 'STABLE',
    coldChainTemp: '+3.8°C',
    cargo: 'Pediatric Vaccines & Critical Emergency Consignment',
    cargoWeightKg: 1250,
    currentRoute: 'Route A (Velachery Corridor)',
    speed: '44 km/h',
    fuel: '78%',
    location: { lat: 12.9560, lng: 80.1750 }, // Approaching Pallavaram / Radial Rd toward Velachery
    origin: 'Tambaram Disaster Relief Logistics Base',
    destination: 'Chennai Central Emergency Hub (Ripon Building)',
    eta: '18:15 IST',
    lastTelemetry: '10s ago',
    gpsAccuracy: '±4 m'
  },
  {
    id: 'TRK-208',
    plateNumber: 'TN-01-AX-9931',
    driverId: 'DRV-208',
    driverName: 'S. Murugan',
    driverPhone: '+91 98405-33102',
    status: 'ACTIVE',
    coldChainStatus: 'STABLE',
    coldChainTemp: 'Ambient',
    cargo: 'Emergency Potable Water Purification Unit',
    cargoWeightKg: 4200,
    currentRoute: 'Route B (GST / Anna Salai Corridor)', // Not on S217 - will NOT be alerted!
    speed: '52 km/h',
    fuel: '84%',
    location: { lat: 13.0080, lng: 80.2080 }, // Near Kathipara on GST Road
    origin: 'Tambaram Logistics Base',
    destination: 'Chennai Port Logistics Depot',
    eta: '17:50 IST',
    lastTelemetry: '25s ago',
    gpsAccuracy: '±5 m'
  }
];
