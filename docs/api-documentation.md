# REST & Real-Time API Documentation

## Auth Endpoints
- `POST /api/auth/login`: Authenticate operator/driver with email and access key.
- `POST /api/auth/verify`: Role clearance verification.

## Incidents & Hazard Recon
- `GET /api/incidents`: Fetch active and historical incident list.
- `POST /api/incidents`: Submit new field hazard report with multipart evidence.
- `PATCH /api/incidents/{id}/verify`: Verify physical road obstruction or reject false alarm.

## Corridor Routing & Risk
- `GET /api/routes`: List monitored highway corridors with real-time risk scores.
- `POST /api/routes/dispatch`: Transmit mandatory reroute instruction to active vehicles.

## Fleet & Cargo Telemetry
- `GET /api/vehicles`: Get live fleet coordinates, speeds, and cold-chain status.
- `GET /api/deliveries`: Active cargo manifests and expedition progress.
