-- UP
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    text TEXT,
    features TEXT[] NOT NULL,
    interview_answers JSONB,
    file_paths TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DOWN
DROP TABLE IF EXISTS requests;
