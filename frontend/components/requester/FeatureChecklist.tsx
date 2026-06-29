"use client";

import { useState } from "react";
import type { FeatureChecklistItem } from "@/lib/api";

export default function FeatureChecklist({
  items,
  onChange,
  disabled,
  editableText,
}: {
  items: FeatureChecklistItem[];
  onChange: (items: FeatureChecklistItem[]) => void;
  disabled?: boolean;
  editableText?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function toggle(id: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  }

  function updateText(id: string, field: "name" | "description", value: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function add() {
    const name = draft.trim();
    if (!name) return;
    onChange([
      ...items,
      {
        id: `FC-custom-${Date.now()}`,
        name,
        description: "요청자가 직접 추가한 기능입니다.",
        checked: true,
      },
    ]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-700">기능 체크리스트</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              item.checked ? "border-blue-200 bg-blue-50/40" : "border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              checked={item.checked}
              disabled={disabled}
              onChange={() => toggle(item.id)}
              className="mt-1 h-4 w-4 accent-blue-600"
            />
            <div className="flex-1">
              {editableText ? (
                <div className="flex flex-col gap-1">
                  <input
                    value={item.name}
                    onChange={(e) => updateText(item.id, "name", e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    value={item.description}
                    onChange={(e) => updateText(item.id, "description", e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="빠진 기능을 입력 후 Enter"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      )}
    </div>
  );
}
