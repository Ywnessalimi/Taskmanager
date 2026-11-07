ALTER TABLE users ADD COLUMN job_title TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN skills TEXT NOT NULL DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN assignee_ids TEXT NOT NULL DEFAULT '[]';
ALTER TABLE notifications ADD COLUMN recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE;

UPDATE tasks SET assignee_ids = COALESCE((
  SELECT json_group_array(u.id) FROM users u
  JOIN organization_members m ON m.user_id = u.id
  JOIN projects p ON p.organization_id = m.organization_id
  WHERE p.id = tasks.project_id AND u.name IN (SELECT value FROM json_each(tasks.assignee_names))
  AND (SELECT count(*) FROM users other JOIN organization_members om ON om.user_id = other.id
    WHERE om.organization_id = p.organization_id AND other.name = u.name) = 1
), '[]');
UPDATE notifications SET recipient_id = (SELECT id FROM users WHERE name = recipient_name)
WHERE (SELECT count(*) FROM users WHERE name = recipient_name) = 1;
CREATE INDEX notifications_recipient_id ON notifications(recipient_id, created_at);

CREATE TABLE assistant_previews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','confirmed','cancelled')),
  selection TEXT,
  result TEXT
);
CREATE INDEX assistant_previews_owner ON assistant_previews(user_id, created_at);
CREATE TABLE assistant_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE assistant_audit (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE integration_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  project_ids TEXT NOT NULL,
  scopes TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE integration_requests (
  token_id TEXT NOT NULL REFERENCES integration_tokens(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  result TEXT NOT NULL,
  PRIMARY KEY(token_id, request_id)
);
