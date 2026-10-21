CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ticket_activity (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_avatar_url TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('created', 'updated', 'assigned', 'status_changed', 'following', 'favorite', 'comment')),
  details TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX ticket_activity_ticket_created_idx ON ticket_activity (ticket_id, created_at);
