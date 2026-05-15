-- CivicLens AI — Seed Data (Bangalore, India)
-- Only user accounts: Admin and Citizen. No separate volunteer role.

-- Password for all test users: "password123" (bcrypt hash)
INSERT INTO users (id, email, password_hash, full_name, display_name, role, points, home_location) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@civiclens.io', '$2a$12$6E.eFugkkrsbbA0D4eAL9ehzOQ5V3OGJJinqPCH0seltNVR/vy0Vu', 'Admin User', 'Admin', 'admin', 0, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'citizen@civiclens.io', '$2a$12$6E.eFugkkrsbbA0D4eAL9ehzOQ5V3OGJJinqPCH0seltNVR/vy0Vu', 'Citizen User', 'Citizen', 'citizen', 0, ST_SetSRID(ST_MakePoint(77.5650, 12.9352), 4326))
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Refresh materialized views (use CONCURRENTLY-safe approach)
REFRESH MATERIALIZED VIEW mv_report_analytics;
