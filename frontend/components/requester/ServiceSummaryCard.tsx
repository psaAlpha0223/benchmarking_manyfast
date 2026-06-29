import { useState } from "react";
import type { SummaryCard } from "@/lib/api";

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ServiceSummaryCard({
  card,
  editable,
  onChange,
}: {
  card: SummaryCard;
  editable?: boolean;
  onChange?: (card: SummaryCard) => void;
}) {
  const [draftFeature, setDraftFeature] = useState("");

  if (!editable || !onChange) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-6">
        <h2 className="text-lg font-semibold text-gray-900">{card.service_name}</h2>
        <p className="mt-2 text-sm text-gray-700">{card.purpose}</p>

        <p className="mt-4 text-xs font-medium text-gray-500">주요 사용자</p>
        <p className="mt-1 text-sm text-gray-700">{card.target_users}</p>

        <p className="mt-4 text-xs font-medium text-gray-500">핵심 기능</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {card.key_features.map((feature) => (
            <li
              key={feature}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {feature}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function removeFeature(feature: string) {
    onChange!({ ...card, key_features: card.key_features.filter((f) => f !== feature) });
  }

  function addFeature() {
    const value = draftFeature.trim();
    if (!value) return;
    onChange!({ ...card, key_features: [...card.key_features, value] });
    setDraftFeature("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-6">
      <div>
        <label className="text-xs font-medium text-gray-500">서비스 이름</label>
        <input
          value={card.service_name}
          onChange={(e) => onChange({ ...card, service_name: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">서비스 목적</label>
        <textarea
          value={card.purpose}
          onChange={(e) => onChange({ ...card, purpose: e.target.value })}
          rows={2}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">주요 사용자</label>
        <input
          value={card.target_users}
          onChange={(e) => onChange({ ...card, target_users: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">핵심 기능</label>
        <ul className="mt-1 flex flex-wrap gap-2">
          {card.key_features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {feature}
              <button type="button" onClick={() => removeFeature(feature)} className="text-blue-400 hover:text-blue-700">
                ×
              </button>
            </li>
          ))}
        </ul>
        <input
          value={draftFeature}
          onChange={(e) => setDraftFeature(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addFeature();
            }
          }}
          placeholder="핵심 기능 입력 후 Enter"
          className={`${INPUT_CLASS} mt-2`}
        />
      </div>
    </div>
  );
}
