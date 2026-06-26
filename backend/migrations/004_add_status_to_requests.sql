-- UP
ALTER TABLE requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'drafting';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS confirmed_features TEXT[];

-- v1.12 도입 이전에 이미 어드민 뷰 Output(PRD/기능명세서/유저플로우/와이어프레임)까지
-- 생성된 요청은 사실상 확정된 상태였으므로 confirmed로 백필한다.
-- (status='drafting' 조건이 아닌 outputs 존재 여부로 판단해야 재실행 시에도 안전함)
UPDATE requests SET status = 'confirmed'
WHERE id IN (SELECT DISTINCT request_id FROM outputs WHERE type IN ('prd', 'spec', 'userflow', 'wireframe'));

-- DOWN
ALTER TABLE requests DROP COLUMN IF EXISTS confirmed_features;
ALTER TABLE requests DROP COLUMN IF EXISTS status;
