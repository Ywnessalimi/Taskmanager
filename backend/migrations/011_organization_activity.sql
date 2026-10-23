CREATE TABLE organization_activity (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_avatar_url TEXT,
  task_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('task_created', 'task_status_changed', 'comment')),
  details TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX organization_activity_feed_idx
  ON organization_activity (organization_id);
