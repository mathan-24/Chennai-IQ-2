# CHENNAI-IQ / ROUTE-IQ Backend Architecture

This directory houses the complete analytical and REST API backend for CHENNAI-IQ. It provides two interchangeable runtime implementations:

1. **Node.js / Express Server** (`server.js` & `backend/routes/`) — Preconfigured for instant execution with the live web application on port 3000.
2. **Python / FastAPI Microservices** (`backend/app/`) — High-performance asynchronous spatial analytical engine with PostGIS schemas and Pydantic validation.

---

## 📂 Backend Directory Structure

```
backend/
├── app/                              # Python FastAPI Analytical Microservice
│   ├── api/                          # Modular API Route Controllers
│   │   ├── auth.py                   # Role credentials & clearance verification
│   │   ├── hazards.py                # Hazard event logs & inspection task dispatch
│   │   ├── reports.py                # Field reconnaissance submissions & AI confidence scoring
│   │   └── roads.py                  # Chennai arterial segments & spatial telemetry
│   ├── models/                       # Pydantic Schemas & Data Transfer Objects
│   │   └── schemas.py                # Request/response validation schemas
│   ├── services/                     # Computational Business Logic
│   │   └── risk_engine.py            # Haversine distance & multi-factor flood risk calculations
│   └── main.py                       # FastAPI application entry point & CORS configuration
├── routes/                           # Node.js / Express REST API Routers
│   ├── auth.js                       # Express authentication endpoints (/api/auth/*)
│   ├── health.js                     # System telemetry health check (/api/health)
│   ├── roads.js                      # Monitored road segment queries (/api/roads/*)
│   └── simulation.js                 # Rainfall simulation controls (/api/rainfall)
├── services/                         # Node.js Computational Services
│   └── risk-calculator.js            # Empirical risk formula module
├── .env.example                      # Backend environment template
├── README.md                         # This documentation file
└── requirements.txt                  # Python dependencies (fastapi, uvicorn, pydantic)
```

---

## 🚀 Running the Python FastAPI Microservice

To run the Python service independently:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the FastAPI server on port 8000
uvicorn app.main:app --reload --port 8000
```

Once started, interactive API documentation is available at `http://localhost:8000/docs`.

---

## ⚡ Running the Node.js Express Server

The Node.js Express server runs automatically with `npm start` or `npm run dev` at the project root:

```bash
npm run dev
```

It serves the static frontend application and exposes `/api/*` endpoints on port 3000.

