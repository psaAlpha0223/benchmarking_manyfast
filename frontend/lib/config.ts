// MVP 배포 단계에서는 와이어프레임 생성이 시간이 오래 걸려 서버리스 함수 타임아웃 위험이 있어
// 기능은 그대로 두고 노출만 끈다. .env에서 NEXT_PUBLIC_ENABLE_WIREFRAME=false로 설정.
export const WIREFRAME_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WIREFRAME !== "false";
