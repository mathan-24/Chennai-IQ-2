# Database Schema Documentation

## Core Tables
- `users`: Operator, officer, and driver credentials, role assignments, and security clearances.
- `vehicles`: Fleet vehicles, license plates, assigned driver, GPS coordinates, speed, cold-chain status.
- `incidents`: Real-time hazard reports, coordinates, severity, status state machine, evidence photos.
- `routes`: Mountain passes, highway segments, distance, travel duration, risk index score.
- `audit_logs`: Immutable chronological log of all operator actions and system risk evaluations.
