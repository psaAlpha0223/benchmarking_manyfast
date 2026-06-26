"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import ErrorMessage from "@/components/common/ErrorMessage";
import { createClient } from "@/lib/supabase";
import { deleteRequest, fetchRequests, type RequestSummary, type OutputType } from "@/lib/api";

const OUTPUT_LABELS: Record<OutputType, string> = {
  summary: "요약",
  prd: "PRD",
  spec: "기능명세서",
  userflow: "유저플로우",
  wireframe: "와이어프레임",
};
const OUTPUT_ORDER: OutputType[] = ["summary", "prd", "spec", "userflow", "wireframe"];

const STATUS_LABELS: Record<string, string> = {
  drafting: "수정 중",
  confirmed: "확정됨",
  in_review: "검토 중",
  completed: "완료",
};

export default function RequestsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    fetchRequests()
      .then(setRequests)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "요청 이력을 불러오지 못했습니다.")
      );
  }, []);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("이 요청과 생성된 모든 Output을 삭제합니다. 계속할까요?")) return;
    try {
      await deleteRequest(id);
      setRequests((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  return (
    <div className="min-h-screen">
      <Header email={email} />
      <main className="flex flex-col items-center gap-6 px-4 py-12">
        <div className="flex w-full max-w-4xl flex-col gap-4">
          <h1 className="text-lg font-semibold text-gray-900">요청 이력</h1>

          {error && <ErrorMessage message={error} />}
          {!requests && !error && <SkeletonLoader label="요청 이력을 불러오는 중..." />}
          {requests && requests.length === 0 && (
            <p className="text-sm text-gray-400">아직 요청 이력이 없습니다.</p>
          )}

          {requests?.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="flex flex-col gap-2 rounded-md border border-gray-200 p-4 hover:border-gray-400"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="line-clamp-2 text-sm text-gray-800">
                  {req.text || "(텍스트 입력 없음)"}
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleString("ko-KR")}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, req.id)}
                    className="text-xs text-red-500 underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {req.features.map((f) => (
                  <span
                    key={f}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                {OUTPUT_ORDER.map((type) => (
                  <span
                    key={type}
                    className={`rounded px-2 py-0.5 text-xs ${
                      req.completed_outputs.includes(type)
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {OUTPUT_LABELS[type]}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
