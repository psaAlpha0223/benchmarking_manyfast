"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TextEditor from "@/components/input/TextEditor";
import FeatureTagInput from "@/components/input/FeatureTagInput";
import FileUploader, { type UploadedFile } from "@/components/input/FileUploader";
import ErrorMessage from "@/components/common/ErrorMessage";
import GenerationPanel from "@/components/output/GenerationPanel";
import { useGenerationFlow, type OutputState } from "@/hooks/useGenerationFlow";
import { deleteRequest, updateRequest, type RequestDetail, type OutputType } from "@/lib/api";

function deriveFileName(path: string): string {
  const last = path.split("/").pop() ?? path;
  return last.replace(/^\d+-/, "");
}

export default function RequestDetailView({
  detail,
  userId,
  onUpdated,
}: {
  detail: RequestDetail;
  userId: string | null;
  onUpdated: (detail: RequestDetail) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(detail.text ?? "");
  const [features, setFeatures] = useState<string[]>(detail.features);
  const [files, setFiles] = useState<UploadedFile[]>(
    (detail.file_paths ?? []).map((path) => ({ name: deriveFileName(path), path, size: 0 }))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const initialOutputsState: Partial<Record<OutputType, OutputState>> = {};
  detail.outputs.forEach((o) => {
    initialOutputsState[o.type] = { status: "done", content: o.content.content };
  });

  const {
    outputsState,
    activeOutputTab,
    setActiveOutputTab,
    generating,
    generateError,
    runGenerate,
    nextOutputType,
  } = useGenerationFlow(
    {
      text: detail.text ?? "",
      features: detail.features,
      filePaths: detail.file_paths ?? [],
      interviewAnswers: detail.interview_answers ?? [],
    },
    { requestId: detail.id, outputsState: initialOutputsState }
  );

  // useGenerationFlow의 nextOutputType은 "이미 뭔가 done"인 경우에만 다음 단계를 알려준다.
  // 이 화면은 수정 직후 outputs가 모두 비워질 수 있으므로, 비어있을 때는 PRD부터 시작하도록 보정한다.
  const effectiveNextOutputType: OutputType | null =
    nextOutputType ?? (Object.keys(outputsState).length === 0 ? "prd" : null);

  async function handleSave() {
    if (features.length === 0) {
      setSaveError("주요 기능 태그를 1개 이상 입력해주세요.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateRequest(detail.id, {
        text,
        features,
        file_paths: files.map((f) => f.path),
        interview_answers: detail.interview_answers ?? [],
      });
      setEditing(false);
      onUpdated(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("이 요청과 생성된 모든 Output을 삭제합니다. 계속할까요?")) return;
    setDeleting(true);
    try {
      await deleteRequest(detail.id);
      router.push("/requests");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      <div className="rounded-md border border-gray-200 p-4">
        {!editing ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs text-gray-400">
                {new Date(detail.created_at).toLocaleString("ko-KR")}
              </p>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-gray-500 underline"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-500 underline disabled:opacity-40"
                >
                  삭제
                </button>
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{detail.text}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {detail.features.map((f) => (
                <span key={f} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {f}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <TextEditor value={text} onChange={setText} />
            <FeatureTagInput tags={features} onChange={setFeatures} />
            {userId && <FileUploader userId={userId} files={files} onChange={setFiles} />}
            {saveError && <ErrorMessage message={saveError} />}
            <p className="text-xs text-gray-400">
              저장하면 이 요청에 이미 생성된 기능명세서/유저플로우/와이어프레임은 모두 삭제되고 PRD부터 다시 생성해야 합니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <GenerationPanel
          outputsState={outputsState}
          activeOutputTab={activeOutputTab}
          setActiveOutputTab={setActiveOutputTab}
          generating={generating}
          generateError={generateError}
          nextOutputType={effectiveNextOutputType}
          runGenerate={runGenerate}
        />
      )}
    </div>
  );
}
