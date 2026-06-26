import OutputTabs from "@/components/output/OutputTabs";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { OutputType } from "@/lib/api";
import type { OutputState } from "@/hooks/useGenerationFlow";

const NEXT_BUTTON_LABEL: Record<OutputType, string> = {
  summary: "요약 생성하기",
  prd: "PRD 생성하기",
  spec: "기능명세서 생성하기",
  userflow: "유저플로우 생성하기",
  wireframe: "와이어프레임 생성하기",
};

export default function GenerationPanel({
  outputsState,
  activeOutputTab,
  setActiveOutputTab,
  generating,
  generateError,
  nextOutputType,
  runGenerate,
}: {
  outputsState: Partial<Record<OutputType, OutputState>>;
  activeOutputTab: OutputType;
  setActiveOutputTab: (type: OutputType) => void;
  generating: boolean;
  generateError: string | null;
  nextOutputType: OutputType | null;
  runGenerate: (type: OutputType) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {generateError && <ErrorMessage message={generateError} />}

      <OutputTabs
        outputs={outputsState}
        activeTab={activeOutputTab}
        onTabChange={setActiveOutputTab}
        onRegenerate={runGenerate}
        generating={generating}
      />

      {!generating && nextOutputType && (
        <button
          type="button"
          onClick={() => runGenerate(nextOutputType)}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          {NEXT_BUTTON_LABEL[nextOutputType]}
        </button>
      )}
    </div>
  );
}
