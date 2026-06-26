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
  onSaveSummary,
  forceReadOnly,
}: {
  summary: SummaryContent;
  status: string;
  onConfirm: (confirmedFeatures: string[]) => Promise<void>;
  onEdit: () => void;
  onSaveSummary?: (content: SummaryContent) => Promise<void>;
  forceReadOnly?: boolean;
}) {
  const [items, setItems] = useState<FeatureChecklistItem[]>(summary.feature_checklist);
  const [card, setCard] = useState(summary.summary_card);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [saving, setSaving] = useState(false);

  const readOnly = forceReadOnly || status !== "drafting";

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

  async function handleSaveSummary() {
    if (!onSaveSummary) return;
    setSaving(true);
    setError(null);
    try {
      await onSaveSummary({ summary_card: card, feature_checklist: items });
      setEditingSummary(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요약 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEditSummary() {
    setCard(summary.summary_card);
    setItems(summary.feature_checklist);
    setEditingSummary(false);
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <ServiceSummaryCard card={card} editable={editingSummary} onChange={setCard} />
      <FeatureChecklist
        items={items}
        onChange={setItems}
        disabled={readOnly && !editingSummary}
        editableText={editingSummary}
      />
      {error && <ErrorMessage message={error} />}
      {readOnly ? (
        <p className="text-sm text-gray-500">
          확정 완료된 요청입니다. 인텔리전스팀이 검토 중이거나 검토를 마쳤습니다.
        </p>
      ) : editingSummary ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancelEditSummary}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveSummary}
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "요약 저장"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {onSaveSummary && (
            <button
              type="button"
              onClick={() => setEditingSummary(true)}
              disabled={confirming}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              요약 내용 수정
            </button>
          )}
          <ConfirmActions onConfirm={handleConfirm} onEdit={onEdit} confirming={confirming} />
        </div>
      )}
    </div>
  );
}
