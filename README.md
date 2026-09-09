# ROUTE-IQ / CHENNAI-IQ

> **AI-Assisted Flood Access Risk Mapping & Dynamic Routing for Chennai**

ROUTE-IQ is a mission-critical tactical logistics, corridor risk intelligence, and dynamic emergency routing platform built for disaster-prone urban corridors during monsoon floods and extreme weather events.

---

## 🌟 Overview & Key Roles

ROUTE-IQ provides unified, real-time command, field-reconnaissance, and in-cab tactical vehicle navigation across three distinct roles:

1. **Control Room Operations (CR-01)**:
   - Central command dashboard monitoring Chennai arterial corridors (Velachery Main Road, OMR IT Corridor, GST Road, Inner Ring Road, Mount-Poonamallee).
   - Real-time rainfall simulation & Doppler weather ingestion (0–250 mm).
   - Dynamic route recalculation and corridor vulnerability analysis.
   - Ground recon task dispatching and emergency hazard resolution.

2. **Emergency Driver In-Cab HUD (TRK-104)**:
   - High-contrast tactical navigation interface tailored for heavy-rescue vehicles (e.g., Ashok Leyland 4x4).
   - Live turn-by-turn route telemetry, water-wading depth thresholds, and bypass alerts.
   - One-tap route acknowledgment and direct ground-level condition reporting.

3. **Field Reconnaissance Officer (FO-02)**:
   - Mobile-first reconnaissance console for on-ground police and civil defense personnel.
   - GPS-geotagged hazard logging with photographic evidence upload (water-logging, debris, fallen trees).
   - Water depth gauge calibration and barrier breach reporting.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Pure Vanilla HTML5, modern CSS3 (`@import "tailwindcss";`), and ES Modules. Zero heavy client frameworks; fast, lightweight, and offline-resilient.
- **Mapping & Geodata**: Leaflet.js with Dark Matter cartography and custom SVG flood risk polylines.
- **Backend**: Node.js & Express REST API providing real-time flood risk calculation, road segment geometries, and session authentication.
- **Storage & State**: Unified reactive client store with LocalStorage persistence and offline event buffering.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/route-iq.git
   cd route-iq
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment (optional)**:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

### Production Build

To package the static distribution:
```bash
npm run build
```
Compiled assets will be written to the `dist/` directory.

---

## 📂 Project Structure

```
├── frontend/                     # Pure Vanilla Web Application
│   ├── index.html                # Application main view layout
│   ├── auth/                     # Authentication & 2FA handlers
│   ├── control-room/             # Control Room Command views & modules
│   ├── driver/                   # Driver In-Cab HUD views & modules
│   ├── field-officer/            # Field Recon views & incident reporting
│   └── shared/                   # Shared UI, Store, API, and Leaflet map engine
├── server.js                     # Express server & computational risk REST endpoints
├── build.js                      # Automated distribution build script
├── metadata.json                 # AI Studio application manifest
├── package.json                  # Project manifest and scripts
├── .env.example                  # Environment configuration template
└── README.md                     # Documentation
```

---

## 🔐 Authentication & Quick Roles

- **Control Room Command**: `command@routeiq.internal` (ID: `CR-01`)
- **Emergency Driver**: `driver.rajesh@routeiq.internal` (Vehicle: `TRK-104`)
- **Field Recon Officer**: `officer.selvam@routeiq.internal` (Officer ID: `FO-02`)

Use the docked **Quick Nav Bar** at the bottom of the interface to instantly jump between consoles or trigger the automated monsoon flood simulation scenario.

