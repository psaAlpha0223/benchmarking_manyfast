-- UP
-- 어드민/로그인 시스템 전체 제거에 따라 profiles 테이블 및 requests.user_id 제거.
-- 요청자는 더 이상 어떤 형태로도 로그인하지 않으므로 user_id는 항상 NULL이었음.
ALTER TABLE requests DROP COLUMN IF EXISTS user_id;
DROP TABLE IF EXISTS profiles;

-- Step 1을 Pain Point 구조화 양식으로 전면 교체함에 따라 답변 전체를 JSONB로 저장.
ALTER TABLE requests ADD COLUMN IF NOT EXISTS pain_point JSONB;

-- DOWN
ALTER TABLE requests DROP COLUMN IF EXISTS pain_point;

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    department TEXT,
    job_title TEXT,
    contact TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE requests ADD COLUMN IF NOT EXISTS user_id UUID;
