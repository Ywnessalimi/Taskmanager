ALTER TABLE organizations ADD COLUMN slug TEXT;
ALTER TABLE organizations ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE organizations ADD COLUMN image_data_url TEXT;
ALTER TABLE organizations ADD COLUMN preferences_json TEXT NOT NULL DEFAULT '{}';
UPDATE organizations
SET slug = lower(replace(replace(trim(name), ' ', '-'), '_', '-')) || '-' || substr(id, 1, 8)
WHERE slug IS NULL OR slug = '';
CREATE UNIQUE INDEX organizations_slug_idx ON organizations(slug);

ALTER TABLE projects ADD COLUMN slug TEXT;
UPDATE projects
SET slug = lower(replace(replace(trim(name), ' ', '-'), '_', '-')) || '-' || substr(id, 1, 8)
WHERE slug IS NULL OR slug = '';
CREATE UNIQUE INDEX projects_organization_slug_idx ON projects(organization_id, slug);

CREATE TABLE organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'custom')),
  permissions TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE (organization_id, user_id)
);

CREATE UNIQUE INDEX organization_members_single_owner_idx
  ON organization_members(organization_id) WHERE role = 'owner';
CREATE INDEX organization_members_user_idx ON organization_members(user_id, organization_id);

INSERT INTO organization_members (id, organization_id, user_id, role, permissions, created_at)
SELECT lower(hex(randomblob(16))), id, owner_user_id, 'owner', '{}', created_at
FROM organizations
WHERE owner_user_id IS NOT NULL;
