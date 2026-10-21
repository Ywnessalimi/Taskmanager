CREATE TABLE project_pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('document', 'chat')),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  UNIQUE (project_id, kind)
);

CREATE TABLE project_chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL CHECK (length(trim(author_name)) > 0),
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at TEXT NOT NULL
);

CREATE INDEX project_chat_messages_project_created_idx ON project_chat_messages(project_id, created_at, id);
