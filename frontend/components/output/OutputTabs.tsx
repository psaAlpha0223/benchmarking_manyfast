import type { OutputType } from "@/lib/api";
import { OUTPUT_ORDER } from "@/hooks/useGenerationFlow";
import PrdView from "./PrdView";
import SpecView from "./SpecView";
import UserFlowView from "./UserFlowView";
import WireframeView from "./WireframeView";
import SkeletonLoader from "@/components/common/SkeletonLoader";

const LABELS: Record<OutputType, string> = {
  prd: "PRD",
  spec: "기능명세서",
  userflow: "유저플로우",
  wireframe: "와이어프레임",
};

export interface OutputState {
  status: "pending" | "streaming" | "done" | "error";
  content: string;
}

export default function OutputTabs({
  outputs,
  activeTab,
  onTabChange,
  onRegenerate,
  generating,
}: {
  outputs: Partial<Record<OutputType, OutputState>>;
  activeTab: OutputType;
  onTabChange: (type: OutputType) => void;
  onRegenerate: (type: OutputType) => void;
  generating: boolean;
}) {
  const available = OUTPUT_ORDER.filter((type) => outputs[type]);
  const current = outputs[activeTab];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-2">
          {available.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onTabChange(type)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                type === activeTab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {LABELS[type]}
              {outputs[type]?.status === "streaming" && " ..."}
            </button>
          ))}
        </div>
        {current && (current.status === "done" || current.status === "error") && (
          <button
            type="button"
            disabled={generating}
            onClick={() => onRegenerate(activeTab)}
            className="mb-2 text-xs text-gray-500 underline disabled:opacity-40"
          >
            {LABELS[activeTab]} 다시 생성
          </button>
        )}
      </div>

      <div>
        {!current && <p className="text-sm text-gray-400">아직 생성되지 않았습니다.</p>}
        {(current?.status === "pending" || current?.status === "streaming") && (
          <SkeletonLoader label={`${LABELS[activeTab]} 생성 중...`} />
        )}
        {current?.status === "error" && (
          <p className="text-sm text-red-600">생성에 실패했습니다.</p>
        )}
        {current?.status === "done" && activeTab === "prd" && <PrdView content={current.content} />}
        {current?.status === "done" && activeTab === "spec" && <SpecView content={current.content} />}
        {current?.status === "done" && activeTab === "userflow" && (
          <UserFlowView content={current.content} />
        )}
        {current?.status === "done" && activeTab === "wireframe" && (
          <WireframeView content={current.content} />
        )}
      </div>
    </div>
  );
}
