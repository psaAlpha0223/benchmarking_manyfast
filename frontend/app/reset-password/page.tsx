"use client";

import { useEffect, useState } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<"request" | "update">("request");

  useEffect(() => {
    const supabase = createClient();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      {mode === "request" ? (
        <ResetPasswordForm />
      ) : (
        <ChangePasswordForm
          title="새 비밀번호 설정"
          description="재설정 링크로 접속하셨습니다. 새 비밀번호를 입력해주세요."
        />
      )}
    </main>
  );
}
