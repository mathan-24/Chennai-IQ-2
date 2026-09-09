# System Architecture

ROUTE-IQ is structured into three coordinated operational tiers:

```
[Control Room (Command)] <==== WebSocket / Mesh API ====> [Dynamic Risk Engine]
           ▲                                                      ▲
           │                                                      │
[Field Recon Officer] ────── (Geotagged Evidence) ───────────────┘
           │
           ▼
[Driver Tactical In-Cab] <─── (Bypass Dispatch & Nav) ────────────┘
```

1. **Presentation Layer**: Responsive tactical HUD built with vanilla ES modules, Leaflet GIS mapping, and high-contrast night-vision UI.
2. **Application Tier**: FastAPI services handling hazard reporting, incident verification state machines, and live telemetry feeds.
3. **Analytics Tier**: Continuous Doppler and slope risk calculation matrices.
4. **Data Tier**: PostgreSQL with PostGIS extension for spatial corridor graph traversal.
