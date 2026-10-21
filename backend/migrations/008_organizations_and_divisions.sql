CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  owner_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE divisions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  created_at TEXT NOT NULL,
  UNIQUE (organization_id, name)
);

CREATE INDEX organizations_owner_idx ON organizations(owner_user_id, created_at);
CREATE INDEX divisions_organization_idx ON divisions(organization_id, created_at);

CREATE TRIGGER projects_validate_hierarchy_insert
BEFORE INSERT ON projects
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM divisions d
    JOIN organizations o ON o.id = d.organization_id
    WHERE d.id = NEW.division_id AND d.organization_id = NEW.organization_id
      AND o.id IS NOT NULL
  ) THEN RAISE(ABORT, 'invalid_project_hierarchy') END;
END;

CREATE TRIGGER projects_validate_hierarchy_update
BEFORE UPDATE OF organization_id, division_id ON projects
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM divisions d
    JOIN organizations o ON o.id = d.organization_id
    WHERE d.id = NEW.division_id AND d.organization_id = NEW.organization_id
      AND o.id IS NOT NULL
  ) THEN RAISE(ABORT, 'invalid_project_hierarchy') END;
END;
