CREATE TABLE division_members (
  division_id TEXT NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  organization_member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (division_id, organization_member_id)
);

CREATE INDEX division_members_membership_idx ON division_members(organization_member_id, division_id);

INSERT INTO division_members (division_id, organization_member_id, created_at)
SELECT d.id, om.id, d.created_at
FROM divisions d
JOIN organization_members om ON om.organization_id = d.organization_id;
