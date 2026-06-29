-- UP
-- 요청자가 로그인 없이 파일을 첨부할 수 있도록 request-files 버킷 정책에 anon 역할 추가
ALTER POLICY request_files_insert ON storage.objects TO authenticated, anon;
ALTER POLICY request_files_select ON storage.objects TO authenticated, anon;
ALTER POLICY request_files_delete ON storage.objects TO authenticated, anon;

-- DOWN
ALTER POLICY request_files_insert ON storage.objects TO authenticated;
ALTER POLICY request_files_select ON storage.objects TO authenticated;
ALTER POLICY request_files_delete ON storage.objects TO authenticated;
