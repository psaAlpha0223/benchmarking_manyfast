"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import ErrorMessage from "@/components/common/ErrorMessage";
import { createClient } from "@/lib/supabase";
import { fetchRequestDetail, type RequestDetail } from "@/lib/api";
import RequestDetailView from "./RequestDetailView";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    fetchRequestDetail(params.id).then(setDetail).catch((err) =>
      setError(err instanceof Error ? err.message : "요청을 불러오지 못했습니다.")
    );
  }, [params.id]);

  function handleUpdated(updated: RequestDetail) {
    setDetail(updated);
    setVersion((v) => v + 1);
  }

  return (
    <div className="min-h-screen">
      <Header email={email} />
      <main className="flex flex-col items-center gap-6 px-4 py-12">
        {error && <ErrorMessage message={error} />}
        {!detail && !error && <SkeletonLoader label="요청을 불러오는 중..." />}
        {detail && (
          <RequestDetailView
            key={version}
            detail={detail}
            userId={userId}
            onUpdated={handleUpdated}
          />
        )}
      </main>
    </div>
  );
}
