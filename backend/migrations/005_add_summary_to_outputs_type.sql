-- UP
ALTER TABLE outputs DROP CONSTRAINT IF EXISTS outputs_type_check;
ALTER TABLE outputs ADD CONSTRAINT outputs_type_check
    CHECK (type IN ('summary', 'prd', 'spec', 'userflow', 'wireframe'));

-- DOWN
ALTER TABLE outputs DROP CONSTRAINT IF EXISTS outputs_type_check;
ALTER TABLE outputs ADD CONSTRAINT outputs_type_check
    CHECK (type IN ('prd', 'spec', 'userflow', 'wireframe'));
