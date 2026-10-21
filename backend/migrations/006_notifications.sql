CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  recipient_name TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  verb TEXT NOT NULL CHECK (verb IN ('taskAssigned')),
  target_type TEXT NOT NULL CHECK (target_type = 'task'),
  target_id TEXT NOT NULL,
  target_label TEXT NOT NULL,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TEXT NOT NULL
);

CREATE INDEX notifications_recipient_created_idx ON notifications(recipient_name, created_at, id);
