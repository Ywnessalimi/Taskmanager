CREATE TABLE task_display_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_value INTEGER NOT NULL CHECK (last_value >= 0)
);

INSERT INTO task_display_sequence (id, last_value)
SELECT 1, COALESCE(max(CAST(substr(display_id, 2) AS INTEGER)), 300)
FROM tasks;
