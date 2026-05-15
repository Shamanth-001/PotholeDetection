-- ============================================================
-- CivicLens AI — Complete PostGIS Database Schema
-- Single-transaction migration for docker-entrypoint-initdb.d
-- ============================================================

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- Custom Types
-- ============================================================
CREATE TYPE user_role AS ENUM ('citizen', 'volunteer', 'admin');
CREATE TYPE issue_type AS ENUM (
    'pothole', 'garbage'
);
CREATE TYPE report_status AS ENUM (
    'pending', 'ai_verified', 'ai_rejected', 'under_review',
    'confirmed', 'in_progress', 'volunteer_assigned', 'resolved', 'closed'
);
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE drive_status AS ENUM (
    'planned', 'open_for_registration', 'full', 'in_progress', 'completed', 'cancelled'
);

-- ============================================================
-- Utility: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    full_name VARCHAR(150) NOT NULL,
    display_name VARCHAR(50),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    role user_role DEFAULT 'citizen' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    reports_submitted INTEGER DEFAULT 0,
    reports_verified INTEGER DEFAULT 0,
    upvotes_given INTEGER DEFAULT 0,
    certificates_earned INTEGER DEFAULT 0,
    volunteer_hours DECIMAL(10, 2) DEFAULT 0,
    home_location GEOMETRY(Point, 4326),
    notification_radius_meters INTEGER DEFAULT 500,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_users_home_location ON users USING GIST(home_location);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOMETRY(Point, 4326) NOT NULL,
    address_text VARCHAR(500),
    ward_number VARCHAR(20),
    issue_type issue_type NOT NULL,
    description TEXT,
    urgency urgency_level DEFAULT 'medium',
    image_url VARCHAR(500) NOT NULL,
    image_thumbnail_url VARCHAR(500),
    additional_images TEXT[],
    ai_detected_class VARCHAR(100),
    ai_confidence DECIMAL(4, 3) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    ai_bounding_boxes JSONB,
    ai_verification_status VARCHAR(50) DEFAULT 'pending',
    ai_processed_at TIMESTAMP WITH TIME ZONE,
    priority_score INTEGER DEFAULT 1 CHECK (priority_score >= 1),
    upvote_count INTEGER DEFAULT 0 CHECK (upvote_count >= 0),
    comment_count INTEGER DEFAULT 0,
    status report_status DEFAULT 'pending' NOT NULL,
    status_history JSONB DEFAULT '[]'::JSONB,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_image_url VARCHAR(500),
    resolution_notes TEXT,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    resolved_by UUID REFERENCES users(id),
    volunteer_drive_id UUID,
    source VARCHAR(50) DEFAULT 'web',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical spatial index for ST_DWithin duplicate detection
CREATE INDEX idx_reports_location_gist ON reports USING GIST(location);
-- Partial index: only active reports (most common spatial query)
CREATE INDEX idx_reports_active_spatial ON reports USING GIST(location)
    WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_issue_type ON reports(issue_type);
CREATE INDEX idx_reports_reported_by ON reports(reported_by);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_priority ON reports(priority_score DESC);
CREATE INDEX idx_reports_urgency ON reports(urgency);
CREATE INDEX idx_reports_status_type_date ON reports(status, issue_type, created_at DESC);

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VOLUNTEER DRIVES
-- ============================================================
CREATE TABLE volunteer_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    address_text VARCHAR(500),
    meeting_point_description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    estimated_duration_hours DECIMAL(4, 2) DEFAULT 2.0,
    max_volunteers INTEGER NOT NULL DEFAULT 20,
    current_volunteers INTEGER DEFAULT 0 CHECK (current_volunteers >= 0),
    min_volunteers INTEGER DEFAULT 3,
    status drive_status DEFAULT 'planned' NOT NULL,
    linked_report_ids UUID[] DEFAULT '{}',
    target_issue_type issue_type,
    area_radius_meters INTEGER DEFAULT 100,
    organized_by UUID NOT NULL REFERENCES users(id),
    completion_notes TEXT,
    before_image_url VARCHAR(500),
    after_image_url VARCHAR(500),
    area_cleaned_sqm DECIMAL(10, 2),
    bags_collected INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drives_location ON volunteer_drives USING GIST(location);
CREATE INDEX idx_drives_status ON volunteer_drives(status);
CREATE INDEX idx_drives_date ON volunteer_drives(scheduled_date);

ALTER TABLE reports
    ADD CONSTRAINT fk_reports_volunteer_drive
    FOREIGN KEY (volunteer_drive_id) REFERENCES volunteer_drives(id) ON DELETE SET NULL;

CREATE TRIGGER update_drives_updated_at
    BEFORE UPDATE ON volunteer_drives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DRIVE VOLUNTEERS (junction table)
-- ============================================================
CREATE TABLE drive_volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id UUID NOT NULL REFERENCES volunteer_drives(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    hours_contributed DECIMAL(4, 2),
    UNIQUE(drive_id, user_id)
);

CREATE INDEX idx_drive_volunteers_drive ON drive_volunteers(drive_id);
CREATE INDEX idx_drive_volunteers_user ON drive_volunteers(user_id);

-- ============================================================
-- UPVOTES
-- ============================================================
CREATE TABLE upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_location GEOMETRY(Point, 4326),
    distance_from_report DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

CREATE INDEX idx_upvotes_report ON upvotes(report_id);
CREATE INDEX idx_upvotes_user ON upvotes(user_id);

-- Trigger: auto-increment report priority on upvote
CREATE OR REPLACE FUNCTION increment_report_priority()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reports SET
        priority_score = priority_score + 1,
        upvote_count = upvote_count + 1,
        urgency = CASE
            WHEN upvote_count + 1 >= 50 THEN 'critical'::urgency_level
            WHEN upvote_count + 1 >= 20 THEN 'high'::urgency_level
            WHEN upvote_count + 1 >= 5 THEN 'medium'::urgency_level
            ELSE urgency
        END
    WHERE id = NEW.report_id;
    UPDATE users SET points = points + 1, upvotes_given = upvotes_given + 1 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_priority
    AFTER INSERT ON upvotes FOR EACH ROW EXECUTE FUNCTION increment_report_priority();

CREATE OR REPLACE FUNCTION decrement_report_priority()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reports SET
        priority_score = GREATEST(priority_score - 1, 1),
        upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = OLD.report_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_priority
    AFTER DELETE ON upvotes FOR EACH ROW EXECUTE FUNCTION decrement_report_priority();

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number VARCHAR(50) UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    drive_id UUID REFERENCES volunteer_drives(id) ON DELETE SET NULL,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    title VARCHAR(255) DEFAULT 'Certificate of Social Responsibility',
    issue_addressed VARCHAR(255),
    location_text VARCHAR(500),
    activity_date DATE NOT NULL,
    hours_contributed DECIMAL(4, 2),
    verified_by_ai BOOLEAN DEFAULT FALSE,
    solution_image_url VARCHAR(500),
    ai_verification_confidence DECIMAL(4, 3),
    pdf_url VARCHAR(500),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_reason TEXT
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

CREATE SEQUENCE certificate_number_seq START WITH 1000;

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.certificate_number := 'CL-' || EXTRACT(YEAR FROM NOW()) || '-' ||
                               LPAD(nextval('certificate_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_certificate_number
    BEFORE INSERT ON certificates FOR EACH ROW
    WHEN (NEW.certificate_number IS NULL)
    EXECUTE FUNCTION generate_certificate_number();

CREATE OR REPLACE FUNCTION increment_user_certificates()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET certificates_earned = certificates_earned + 1, points = points + 50 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_certificates
    AFTER INSERT ON certificates FOR EACH ROW EXECUTE FUNCTION increment_user_certificates();

-- ============================================================
-- SPATIAL UTILITY FUNCTIONS
-- ============================================================

-- Core duplicate detection
CREATE OR REPLACE FUNCTION find_nearby_reports(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 10.0,
    p_issue_type issue_type DEFAULT NULL
)
RETURNS TABLE (
    report_id UUID,
    distance_meters DOUBLE PRECISION,
    r_issue_type issue_type,
    r_description TEXT,
    r_status report_status,
    r_priority_score INTEGER,
    r_upvote_count INTEGER,
    r_image_url VARCHAR,
    r_created_at TIMESTAMP WITH TIME ZONE,
    reported_by_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        ST_Distance(r.location::geography, ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography),
        r.issue_type,
        r.description,
        r.status,
        r.priority_score,
        r.upvote_count,
        r.image_url,
        r.created_at,
        u.full_name
    FROM reports r
    LEFT JOIN users u ON r.reported_by = u.id
    WHERE
        ST_DWithin(r.location::geography, ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography, p_radius_meters)
        AND r.status NOT IN ('resolved', 'closed')
        AND (p_issue_type IS NULL OR r.issue_type = p_issue_type)
    ORDER BY ST_Distance(r.location::geography, ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography) ASC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- Heatmap data
CREATE OR REPLACE FUNCTION get_heatmap_data(
    p_days_back INTEGER DEFAULT 30,
    p_issue_type issue_type DEFAULT NULL
)
RETURNS TABLE (
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    intensity DOUBLE PRECISION,
    report_count BIGINT
) AS $$
DECLARE
    max_priority DOUBLE PRECISION;
BEGIN
    SELECT COALESCE(MAX(priority_score), 1)::DOUBLE PRECISION INTO max_priority
    FROM reports WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL;

    RETURN QUERY
    SELECT
        ST_Y(r.location),
        ST_X(r.location),
        (r.priority_score::DOUBLE PRECISION / max_priority),
        COUNT(*) OVER (PARTITION BY ST_SnapToGrid(r.location, 0.0001))
    FROM reports r
    WHERE
        r.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
        AND r.status != 'closed'
        AND (p_issue_type IS NULL OR r.issue_type = p_issue_type)
    ORDER BY r.priority_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Users near a report (for notifications)
CREATE OR REPLACE FUNCTION find_users_near_report(p_report_location GEOMETRY(Point, 4326))
RETURNS TABLE (user_id UUID, user_email VARCHAR, distance_meters DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email,
        ST_Distance(u.home_location::geography, p_report_location::geography)
    FROM users u
    WHERE u.home_location IS NOT NULL AND u.is_active = TRUE
        AND ST_DWithin(u.home_location::geography, p_report_location::geography, u.notification_radius_meters)
    ORDER BY ST_Distance(u.home_location::geography, p_report_location::geography) ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Materialized View for Analytics
-- ============================================================
CREATE MATERIALIZED VIEW mv_report_analytics AS
SELECT
    date_trunc('day', created_at) AS report_date,
    issue_type, status, urgency,
    COUNT(*) AS report_count,
    AVG(priority_score) AS avg_priority,
    SUM(upvote_count) AS total_upvotes,
    AVG(ai_confidence) AS avg_ai_confidence
FROM reports
GROUP BY date_trunc('day', created_at), issue_type, status, urgency
ORDER BY report_date DESC;

CREATE UNIQUE INDEX idx_mv_analytics
    ON mv_report_analytics(report_date, issue_type, status, urgency);

CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_report_analytics;
END;
$$ LANGUAGE plpgsql;

-- Ward statistics view
CREATE VIEW vw_ward_statistics AS
SELECT
    ward_number,
    COUNT(*) AS total_reports,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
    AVG(priority_score) AS avg_priority
FROM reports WHERE ward_number IS NOT NULL
GROUP BY ward_number;

COMMIT;
