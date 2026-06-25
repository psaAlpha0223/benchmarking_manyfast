-- UP
CREATE TABLE IF NOT EXISTS outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id),
    type TEXT NOT NULL CHECK (type IN ('prd', 'spec', 'userflow', 'wireframe')),
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DOWN
DROP TABLE IF EXISTS outputs;
