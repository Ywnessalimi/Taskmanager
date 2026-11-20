CREATE TABLE project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (project_id, organization_member_id)
);

CREATE INDEX project_members_membership_idx ON project_members(organization_member_id, project_id);

INSERT INTO project_members (project_id, organization_member_id, created_at)
SELECT p.id, m.id, m.created_at
FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id;

CREATE TRIGGER project_members_validate_insert BEFORE INSERT ON project_members
WHEN NOT EXISTS (
  SELECT 1 FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id
  WHERE p.id = NEW.project_id AND m.id = NEW.organization_member_id
)
BEGIN SELECT RAISE(ABORT, 'project_member_wrong_organization'); END;

CREATE TRIGGER project_members_validate_update BEFORE UPDATE OF project_id, organization_member_id ON project_members
WHEN NOT EXISTS (
  SELECT 1 FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id
  WHERE p.id = NEW.project_id AND m.id = NEW.organization_member_id
)
BEGIN SELECT RAISE(ABORT, 'project_member_wrong_organization'); END;

CREATE TRIGGER projects_validate_project_members BEFORE UPDATE OF organization_id ON projects
WHEN EXISTS (
  SELECT 1 FROM project_members pm JOIN organization_members m ON m.id = pm.organization_member_id
  WHERE pm.project_id = OLD.id AND m.organization_id <> NEW.organization_id
)
BEGIN SELECT RAISE(ABORT, 'project_member_wrong_organization'); END;
