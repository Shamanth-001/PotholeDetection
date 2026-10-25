-- Points are awarded only by the API. Earlier versions of these triggers also
-- added points, which double-counted upvotes (+6) and certificates (+150).
-- Safe to re-run on an existing database.

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
    UPDATE users SET upvotes_given = upvotes_given + 1 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_user_certificates()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET certificates_earned = certificates_earned + 1 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
