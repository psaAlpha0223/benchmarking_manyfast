import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <ChangePasswordForm description="최초 로그인입니다. 비밀번호를 변경해주세요." />
    </main>
  );
}
