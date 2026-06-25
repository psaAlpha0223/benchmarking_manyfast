"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError("재설정 링크 발송에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="max-w-sm text-center text-sm text-gray-600">
        입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일을 확인해주세요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">비밀번호 재설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          등록된 이메일로 재설정 링크를 보내드립니다.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "전송 중..." : "재설정 링크 받기"}
      </button>

      <a href="/login" className="text-center text-sm text-gray-500 underline">
        로그인으로 돌아가기
      </a>
    </form>
  );
}
