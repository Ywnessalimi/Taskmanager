CREATE TABLE ticket_comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL CHECK (length(trim(ticket_id)) > 0),
  author_id TEXT NOT NULL CHECK (length(trim(author_id)) > 0),
  author_name TEXT NOT NULL CHECK (length(trim(author_name)) > 0),
  author_avatar_url TEXT,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at TEXT NOT NULL
);

CREATE INDEX ticket_comments_ticket_created_idx
  ON ticket_comments (ticket_id, created_at);
