"use client";

import { useRef, useState } from "react";
import Header from "@/components/layout/Header";
import StepProgressBar from "@/components/common/StepProgressBar";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import ErrorMessage from "@/components/common/ErrorMessage";
import PainPointForm from "@/components/input/PainPointForm";
import type { UploadedFile } from "@/components/input/FileUploader";
import RequesterOutputView from "@/components/requester/RequesterOutputView";
import {
  confirmRequest,
  updateRequest,
  updateSummary,
  EMPTY_PAIN_POINT,
  type PainPoint,
  type SummaryContent,
} from "@/lib/api";
import { useGenerationFlow } from "@/hooks/useGenerationFlow";

function validatePainPoint(painPoint: PainPoint, team: string, submitterName: string): string | null {
  if (team.trim() === "" || submitterName.trim() === "") {
    return "팀과 이름을 입력해주세요.";
  }
  if (painPoint.feature_request.trim() === "") {
    return "1번 질문(어떤 기능을 원하시나요?)을 입력해주세요.";
  }
  if (painPoint.current_process.trim() === "") {
    return "2번 질문(기존 업무 프로세스)을 입력해주세요.";
  }
  if (painPoint.pain_points.length === 0 && painPoint.pain_points_other.trim() === "") {
    return "3번 질문(가장 불편한 점)을 1개 이상 선택해주세요.";
  }
  return null;
}

export default function Home() {
  const [confirmed, setConfirmed] = useState(false);
  const sessionId = useRef(crypto.randomUUID()).current;

  const [step, setStep] = useState<1 | 2>(1);

  const [team, setTeam] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [painPoint, setPainPoint] = useState<PainPoint>(EMPTY_PAIN_POINT);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  const [editingOriginal, setEditingOriginal] = useState(false);
  const [savingOriginal, setSavingOriginal] = useState(false);
  const [originalEditError, setOriginalEditError] = useState<string | null>(null);
  const [originalBackup, setOriginalBackup] = useState<{
    painPoint: PainPoint;
    files: UploadedFile[];
  } | null>(null);

  const {
    summaryStatus,
    summaryContent,
    requestId,
    generating,
    generateError,
    runGenerate,
    resetGeneration,
    setSummaryContent,
  } = useGenerationFlow({
    painPoint,
    filePaths: files.map((f) => f.path),
    team,
    submitterName,
  });

  async function handleSubmit() {
    const error = validatePainPoint(painPoint, team, submitterName);
    if (error) {
      setStep1Error(error);
      return;
    }
    setStep1Error(null);
    setStep(2);
    await runGenerate();
  }

  function resetAll() {
    setStep(1);
    setTeam("");
    setSubmitterName("");
    setPainPoint(EMPTY_PAIN_POINT);
    setFiles([]);
    setConfirmed(false);
    resetGeneration();
  }

  function handleOpenEditOriginal() {
    setOriginalBackup({ painPoint, files });
    setOriginalEditError(null);
    setEditingOriginal(true);
  }

  function handleCancelEditOriginal() {
    if (originalBackup) {
      setPainPoint(originalBackup.painPoint);
      setFiles(originalBackup.files);
    }
    setOriginalEditError(null);
    setEditingOriginal(false);
  }

  async function handleSaveEditOriginal() {
    if (!requestId) return;
    const error = validatePainPoint(painPoint, team, submitterName);
    if (error) {
      setOriginalEditError(error);
      return;
    }

    setSavingOriginal(true);
    setOriginalEditError(null);
    try {
      await updateRequest(requestId, {
        pain_point: painPoint,
        file_paths: files.map((f) => f.path),
      });
      setEditingOriginal(false);
      await runGenerate();
    } catch (err) {
      setOriginalEditError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setSavingOriginal(false);
    }
  }

  async function handleConfirm(confirmedFeatures: string[]) {
    if (!requestId) return;
    await confirmRequest(requestId, confirmedFeatures);
    setConfirmed(true);
  }

  async function handleSaveSummary(content: SummaryContent) {
    if (!requestId) return;
    const updated = await updateSummary(requestId, content);
    setSummaryContent(JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="bg-gradient-to-b from-blue-600 to-blue-500 px-4 pb-16 pt-12 text-center text-white">
        <h1 className="text-2xl font-bold">원하는 기능이 있으신가요?</h1>
        <p className="mt-2 text-sm text-blue-100">
          업무 중 겪고 있는 불편함을 알려주세요. 인텔리전스팀이 빠르게 검토해드릴게요.
        </p>
      </div>

      <main className="flex flex-col items-center gap-8 px-4 pb-16 -mt-10">
        <StepProgressBar currentStep={step} />

        {step === 1 && (
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">팀</label>
                <input
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="예: 인텔리전스"
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">이름</label>
                <input
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <PainPointForm
              value={painPoint}
              onChange={setPainPoint}
              files={files}
              onFilesChange={setFiles}
              sessionId={sessionId}
            />

            {step1Error && <div className="mt-6"><ErrorMessage message={step1Error} /></div>}
            <button
              type="button"
              onClick={handleSubmit}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              요청 제출
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">요청 확인</h2>

            {generateError && <ErrorMessage message={generateError} />}

            {confirmed ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 text-center">
                <p className="text-sm text-gray-700">
                  확정되었습니다. 인텔리전스팀이 검토를 진행할 예정입니다.
                </p>
              </div>
            ) : editingOriginal ? (
              <div className="flex flex-col gap-4">
                <PainPointForm
                  value={painPoint}
                  onChange={setPainPoint}
                  files={files}
                  onFilesChange={setFiles}
                  sessionId={sessionId}
                />
                {originalEditError && <ErrorMessage message={originalEditError} />}
                <p className="text-xs text-gray-400">
                  저장하면 요청 내용을 기준으로 요약이 다시 생성됩니다.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEditOriginal}
                    disabled={savingOriginal}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingOriginal ? "저장 중..." : "저장"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditOriginal}
                    disabled={savingOriginal}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : summaryStatus === "done" ? (
              <RequesterOutputView
                key={summaryContent}
                summary={JSON.parse(summaryContent) as SummaryContent}
                status="drafting"
                onConfirm={handleConfirm}
                onEdit={handleOpenEditOriginal}
                onSaveSummary={handleSaveSummary}
              />
            ) : summaryStatus === "error" ? (
              <div className="flex flex-col items-start gap-2">
                <ErrorMessage message="요약 생성에 실패했습니다. 서버가 깨어나는 중일 수 있어요. 잠시 후 다시 시도해주세요." />
                <button type="button" onClick={() => runGenerate()} className="text-sm text-blue-600 underline">
                  다시 시도
                </button>
              </div>
            ) : (
              <SkeletonLoader label="요청 내용을 요약하고 있습니다..." />
            )}

            {!generating && !confirmed && !editingOriginal && (
              <button
                type="button"
                onClick={resetAll}
                className="mt-6 w-full text-center text-sm text-gray-400 underline hover:text-gray-600"
              >
                처음부터 다시 시작
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
