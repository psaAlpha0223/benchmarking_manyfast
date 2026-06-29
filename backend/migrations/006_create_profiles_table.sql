-- UP
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    department TEXT,
    job_title TEXT,
    contact TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존에 auth.users의 user_metadata(is_admin, team)에 저장돼 있던 값을 백필.
-- 비밀번호는 그대로 auth.users가 관리하며 이 테이블로 옮기지 않는다.
INSERT INTO profiles (id, email, department, is_admin)
SELECT id, email, raw_user_meta_data->>'team', COALESCE((raw_user_meta_data->>'is_admin')::boolean, false)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- DOWN
DROP TABLE IF EXISTS profiles;
