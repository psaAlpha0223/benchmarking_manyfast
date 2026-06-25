"use client";

import { useState } from "react";

const MAX_TAGS = 3;

export default function FeatureTagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);

  function addTag(raw: string) {
    const value = raw.trim();
    if (!value || tags.length >= MAX_TAGS || tags.includes(value)) return;
    onChange([...tags, value]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // 한글 등 IME 조합 중 Enter는 조합 완료용이라 무시해야 함 (그렇지 않으면 조합 중인 글자가 잘려서 태그로 들어감)
      if (composing || e.nativeEvent.isComposing) return;
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        주요 기능 태그 ({tags.length}/{MAX_TAGS}, 필수)
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            placeholder="예: 회의록 요약 (Enter로 추가)"
            className="min-w-[160px] flex-1 text-sm outline-none"
          />
        )}
      </div>
    </div>
  );
}
