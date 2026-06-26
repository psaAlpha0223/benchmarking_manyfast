"use client";

import { useState } from "react";
import ServiceSummaryCard from "./ServiceSummaryCard";
import FeatureChecklist from "./FeatureChecklist";
import ConfirmActions from "./ConfirmActions";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { FeatureChecklistItem, SummaryContent } from "@/lib/api";

export default function RequesterOutputView({
  summary,
  status,
  onConfirm,
  onEdit,
}: {
  summary: SummaryContent;
  status: string;
  onConfirm: (confirmedFeatures: string[]) => Promise<void>;
  onEdit: () => void;
}) {
  const [items, setItems] = useState<FeatureChecklistItem[]>(summary.feature_checklist);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readOnly = status !== "drafting";

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await onConfirm(items.filter((item) => item.checked).map((item) => item.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "확정 처리에 실패했습니다.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <ServiceSummaryCard card={summary.summary_card} />
      <FeatureChecklist items={items} onChange={setItems} disabled={readOnly} />
      {error && <ErrorMessage message={error} />}
      {readOnly ? (
        <p className="text-sm text-gray-500">
          확정 완료된 요청입니다. 인텔리전스팀이 검토 중이거나 검토를 마쳤습니다.
        </p>
      ) : (
        <ConfirmActions onConfirm={handleConfirm} onEdit={onEdit} confirming={confirming} />
      )}
    </div>
  );
}
