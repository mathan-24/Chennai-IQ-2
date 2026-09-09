-- CHENNAI-IQ Primary Database Schema
-- AI-Assisted Flood Access Risk Mapping & Dynamic Routing for Chennai
-- Spatial operations powered by PostgreSQL / PostGIS

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users & RBAC (Driver, Field Officer, Control Room)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL, -- 'DRIVER' | 'FIELD_OFFICER' | 'CONTROL_ROOM'
    unit VARCHAR(128),
    clearance_level VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Road Segments (Main Monitoring Unit)
CREATE TABLE IF NOT EXISTS road_segments (
    segment_id VARCHAR(32) PRIMARY KEY, -- e.g. 'S217'
    road_name VARCHAR(255) NOT NULL,
    road_type VARCHAR(64) NOT NULL,
    zone VARCHAR(128),
    elevation_susceptibility NUMERIC(4,3) NOT NULL CHECK (elevation_susceptibility BETWEEN 0 AND 1),
    drainage_susceptibility NUMERIC(4,3) NOT NULL CHECK (drainage_susceptibility BETWEEN 0 AND 1),
    road_vulnerability NUMERIC(4,3) NOT NULL CHECK (road_vulnerability BETWEEN 0 AND 1),
    current_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (current_risk_score BETWEEN 0 AND 100),
    current_risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW', -- 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    operational_status VARCHAR(64) NOT NULL DEFAULT 'NORMAL', -- 'NORMAL' | 'AT RISK' | 'WATERLOGGED' | 'PARTIALLY BLOCKED' | 'BLOCKED' | 'CONFLICTING' | 'UNDER VERIFICATION'
    historical_disruptions TEXT,
    geom GEOMETRY(LineString, 4326),
    last_risk_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verified_update TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON road_segments USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_road_segments_status ON road_segments(operational_status);
CREATE INDEX IF NOT EXISTS idx_road_segments_risk_level ON road_segments(current_risk_level);

-- 3. Rainfall Observations (Continuous Monitoring Ingest)
CREATE TABLE IF NOT EXISTS rainfall_observations (
    id SERIAL PRIMARY KEY,
    rainfall_mm NUMERIC(6,2) NOT NULL,
    rate_mm_h NUMERIC(5,2),
    source_type VARCHAR(64) DEFAULT 'SIMULATION_MODE', -- 'SIMULATION_MODE' | 'LIVE_STATION_INGEST'
    freshness VARCHAR(32) DEFAULT 'LIVE',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Hazard Events (Detected Transitions in Segment Risk)
CREATE TABLE IF NOT EXISTS hazard_events (
    id VARCHAR(64) PRIMARY KEY,
    segment_id VARCHAR(32) REFERENCES road_segments(segment_id),
    hazard_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL, -- 'HIGH' | 'CRITICAL'
    previous_risk VARCHAR(64),
    current_risk VARCHAR(64),
    reason TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE_UNVERIFIED', -- 'ACTIVE_UNVERIFIED' | 'ASSIGNED_INSPECTION' | 'VERIFIED_CONFIRMED' | 'RESOLVED'
    geom GEOMETRY(Point, 4326),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hazard_events_geom ON hazard_events USING GIST(geom);

-- 5. Field Officers
CREATE TABLE IF NOT EXISTS field_officers (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'FO-02'
    user_id VARCHAR(64) REFERENCES users(id),
    full_name VARCHAR(128) NOT NULL,
    badge_number VARCHAR(64) NOT NULL,
    station VARCHAR(128),
    sector VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE' | 'ON_PATROL' | 'BUSY' | 'OFFLINE'
    contact VARCHAR(64),
    current_location GEOMETRY(Point, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_field_officers_geom ON field_officers USING GIST(current_location);

-- 6. Inspection Tasks (Automated Assignment to Nearest Available Officer)
CREATE TABLE IF NOT EXISTS inspection_tasks (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'TASK-104'
    hazard_id VARCHAR(64) REFERENCES hazard_events(id),
    segment_id VARCHAR(32) REFERENCES road_segments(segment_id),
    assigned_officer_id VARCHAR(32) REFERENCES field_officers(id),
    priority VARCHAR(32) NOT NULL, -- 'HIGH' | 'CRITICAL'
    status VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED', -- 'ASSIGNED' | 'ACCEPTED' | 'ON_SITE' | 'VERIFIED' | 'CANCELLED'
    distance_km NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    on_site_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Field Reports & Verification Confidence
CREATE TABLE IF NOT EXISTS field_reports (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) REFERENCES inspection_tasks(id),
    officer_id VARCHAR(32) REFERENCES field_officers(id),
    segment_id VARCHAR(32) REFERENCES road_segments(segment_id),
    condition_type VARCHAR(64) NOT NULL, -- 'waterlogging' | 'flooding' | 'partial blockage' | 'complete blockage' | 'unsafe passage' | 'debris'
    severity VARCHAR(32) NOT NULL,
    description TEXT,
    evidence_photos TEXT[],
    confidence VARCHAR(64) NOT NULL, -- 'HIGH CONFIDENCE' | 'MEDIUM CONFIDENCE' | 'LOW CONFIDENCE' | 'CONFLICTING'
    confidence_score INTEGER,
    confidence_reasons TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'UNDER_VERIFICATION', -- 'AUTO_PROCESSED' | 'SENT_TO_CONTROL_ROOM' | 'VERIFIED' | 'REJECTED'
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Active Trips (Real-time Fleet Tracking & Impact Analysis)
CREATE TABLE IF NOT EXISTS active_trips (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'TRIP-001'
    driver_id VARCHAR(64) REFERENCES users(id),
    vehicle_id VARCHAR(64) NOT NULL,
    active_route_name VARCHAR(128) NOT NULL,
    origin VARCHAR(128) NOT NULL,
    destination VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'REROUTED' | 'COMPLETED'
    current_location GEOMETRY(Point, 4326),
    route_geom GEOMETRY(LineString, 4326),
    last_telemetry TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_active_trips_geom ON active_trips USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_active_trips_route ON active_trips USING GIST(route_geom);

-- 9. Candidate Route Evaluations (Flood-Aware Balancing)
CREATE TABLE IF NOT EXISTS route_evaluations (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(128) NOT NULL,
    distance_km NUMERIC(6,2) NOT NULL,
    est_minutes INTEGER NOT NULL,
    flood_risk_score INTEGER NOT NULL,
    max_segment_risk INTEGER NOT NULL,
    high_risk_pct INTEGER NOT NULL,
    has_blocked_segment BOOLEAN NOT NULL DEFAULT FALSE,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    recommendation_note TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Targeted Driver Alerts (Sent ONLY to affected drivers)
CREATE TABLE IF NOT EXISTS driver_alerts (
    id VARCHAR(64) PRIMARY KEY,
    trip_id VARCHAR(64) REFERENCES active_trips(id),
    driver_id VARCHAR(64) REFERENCES users(id),
    vehicle_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recommended_route VARCHAR(128),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Immutable Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(128) NOT NULL,
    actor_type VARCHAR(64) NOT NULL, -- 'HUMAN ACTION' | 'SYSTEM ACTION'
    role VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    entity VARCHAR(128),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(timestamp DESC);
