CREATE TABLE notifications_next (
  id TEXT PRIMARY KEY,
  recipient_name TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  verb TEXT NOT NULL CHECK (verb IN ('taskAssigned', 'ticketAssigned', 'taskCommented', 'projectJoinRequested', 'orgAdminAssigned', 'taskStatusChanged', 'projectCreated', 'orgMemberAdded')),
  target_type TEXT NOT NULL CHECK (target_type IN ('task', 'ticket', 'project', 'organization')),
  target_id TEXT NOT NULL,
  target_label TEXT NOT NULL,
  project_id TEXT,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TEXT NOT NULL
);

INSERT INTO notifications_next (id, recipient_name, actor_id, actor_name, verb, target_type, target_id, target_label, project_id, status, created_at)
SELECT id, recipient_name, actor_id, actor_name, verb, target_type, target_id, target_label, project_id, status, created_at
FROM notifications;

DROP TABLE notifications;
ALTER TABLE notifications_next RENAME TO notifications;
CREATE INDEX notifications_recipient_created_idx ON notifications(recipient_name, created_at, id);
