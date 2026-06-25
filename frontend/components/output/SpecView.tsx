"use client";

import { useState } from "react";
import TreeView from "./spec/TreeView";
import DirectoryView from "./spec/DirectoryView";
import DocumentView from "./spec/DocumentView";
import { parseSpecContent } from "@/types/output";

const TABS = [
  { key: "tree", label: "트리뷰" },
  { key: "directory", label: "디렉토리뷰" },
  { key: "document", label: "도큐먼트뷰" },
] as const;

export default function SpecView({ content }: { content: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("tree");

  let spec;
  try {
    spec = parseSpecContent(content);
  } catch {
    return <p className="text-sm text-red-600">기능명세서 JSON을 해석할 수 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              tab === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "tree" && <TreeView spec={spec} />}
      {tab === "directory" && <DirectoryView spec={spec} />}
      {tab === "document" && <DocumentView spec={spec} />}
    </div>
  );
}
