ALTER TABLE sessions ADD COLUMN session_id TEXT;
ALTER TABLE sessions ADD COLUMN user_agent TEXT NOT NULL DEFAULT '';
ALTER TABLE sessions ADD COLUMN last_seen_at TEXT NOT NULL DEFAULT '';

UPDATE sessions
SET session_id = lower(hex(randomblob(16))),
    last_seen_at = created_at
WHERE session_id IS NULL;

CREATE UNIQUE INDEX sessions_public_id_idx ON sessions(session_id);
