/**
 * CHENNAI-IQ — Seed Data: Field Officers
 * Positioned across Chennai metropolitan patrol sectors with real GPS coordinates.
 */
export const seedFieldOfficers = [
  {
    id: 'FO-02',
    name: 'Sub-Inspector M. Selvam',
    badge: 'TN-POL-4102',
    station: 'Velachery Traffic & Recon Post (100ft Rd Jn)',
    vehicle: 'Recon Patrol Gypsy TN-09-G-1412',
    status: 'AVAILABLE',
    contact: '+91 94440-12841',
    sector: 'Zone 13 - South Chennai',
    location: { lat: 12.9780, lng: 80.2195 } // ~350m from Velachery Main Road S217!
  },
  {
    id: 'FO-01',
    name: 'Inspector K. Saravanan',
    badge: 'TN-POL-3981',
    station: 'Guindy Traffic Control Outpost (Kathipara)',
    vehicle: 'Rapid Response Unit TN-01-G-7740',
    status: 'AVAILABLE',
    contact: '+91 94440-88210',
    sector: 'Zone 12 - Guindy / Alandur',
    location: { lat: 13.0070, lng: 80.2050 } // ~4.2 km from Velachery S217
  },
  {
    id: 'FO-03',
    name: 'Officer Priya R.',
    badge: 'TN-POL-5204',
    station: 'Sholinganallur Junction Outpost',
    vehicle: 'OMR Sector Patrol-3',
    status: 'BUSY',
    busyReason: 'Monitoring Tidel Park stormwater canal discharge',
    contact: '+91 94440-99432',
    sector: 'Zone 14 - OMR IT Corridor',
    location: { lat: 12.9010, lng: 80.2280 }
  }
];
