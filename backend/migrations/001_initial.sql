CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  division_id TEXT NOT NULL,
  division_name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  description TEXT
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  assignee_names TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(assignee_names)),
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed')),
  start_date TEXT,
  due_date TEXT,
  repeat TEXT CHECK (repeat IS NULL OR repeat IN ('none', 'daily', 'weekly', 'monthly')),
  recurrence TEXT CHECK (recurrence IS NULL OR json_valid(recurrence)),
  tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
  description TEXT,
  subtasks TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(subtasks)),
  followers TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(followers)),
  is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
  time_spent_minutes INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_minutes >= 0),
  activity_log TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(activity_log)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX tasks_project_id_idx ON tasks(project_id);
CREATE INDEX tasks_status_idx ON tasks(status);
