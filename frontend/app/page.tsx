"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/layout/Header";
import StepProgressBar from "@/components/common/StepProgressBar";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import ErrorMessage from "@/components/common/ErrorMessage";
import TextEditor from "@/components/input/TextEditor";
import FeatureTagInput from "@/components/input/FeatureTagInput";
import FileUploader, { type UploadedFile } from "@/components/input/FileUploader";
import InterviewStep from "@/components/interview/InterviewStep";
import type { Question, Answer } from "@/components/interview/QuestionCard";
import RequesterOutputView from "@/components/requester/RequesterOutputView";
import { createClient } from "@/lib/supabase";
import {
  fetchInterviewQuestions,
  confirmRequest,
  updateRequest,
  updateSummary,
  type SummaryContent,
} from "@/lib/api";
import { useGenerationFlow } from "@/hooks/useGenerationFlow";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [text, setText] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const [editingOriginal, setEditingOriginal] = useState(false);
  const [savingOriginal, setSavingOriginal] = useState(false);
  const [originalEditError, setOriginalEditError] = useState<string | null>(null);
  const [originalBackup, setOriginalBackup] = useState<{
    text: string;
    features: string[];
    files: UploadedFile[];
  } | null>(null);

  const generateStarted = useRef(false);

  function answerText(answer: Answer | undefined): string {
    if (!answer || !answer.selected) return "";
    return answer.selected === "직접 입력" ? answer.custom : answer.selected;
  }

  const interviewAnswers = Object.entries(answers)
    .filter(([, a]) => answerText(a) !== "")
    .map(([id, a]) => ({ id, answer: answerText(a) }));

  const {
    outputsState,
    requestId,
    generating,
    generateError,
    runGenerate,
    resetGeneration,
    setOutputContent,
  } = useGenerationFlow({
    text,
    features,
    filePaths: files.map((f) => f.path),
    interviewAnswers,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    });
  }, []);

  async function handleAnalyze() {
    if (features.length === 0) {
      setStep1Error("주요 기능 태그를 1개 이상 입력해주세요.");
      return;
    }
    if (text.trim() === "" && files.length === 0) {
      setStep1Error("자유 텍스트 또는 파일 중 하나 이상을 입력해주세요.");
      return;
    }

    setStep1Error(null);
    setAnalyzing(true);

    try {
      const result = await fetchInterviewQuestions({
        text,
        features,
        file_paths: files.map((f) => f.path),
      });
      setQuestions(result);
      setStep(2);
    } catch (err) {
      setStep1Error(err instanceof Error ? err.message : "분석 요청에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (step === 3 && !generateStarted.current) {
      generateStarted.current = true;
      runGenerate("summary");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function resetAll() {
    setStep(1);
    setText("");
    setFeatures([]);
    setFiles([]);
    setQuestions([]);
    setAnswers({});
    setConfirmed(false);
    resetGeneration();
    generateStarted.current = false;
  }

  function handleOpenEditOriginal() {
    setOriginalBackup({ text, features, files });
    setOriginalEditError(null);
    setEditingOriginal(true);
  }

  function handleCancelEditOriginal() {
    if (originalBackup) {
      setText(originalBackup.text);
      setFeatures(originalBackup.features);
      setFiles(originalBackup.files);
    }
    setOriginalEditError(null);
    setEditingOriginal(false);
  }

  async function handleSaveEditOriginal() {
    if (!requestId) return;
    if (features.length === 0) {
      setOriginalEditError("주요 기능 태그를 1개 이상 입력해주세요.");
      return;
    }
    if (text.trim() === "" && files.length === 0) {
      setOriginalEditError("자유 텍스트 또는 파일 중 하나 이상을 입력해주세요.");
      return;
    }

    setSavingOriginal(true);
    setOriginalEditError(null);
    try {
      await updateRequest(requestId, {
        text,
        features,
        file_paths: files.map((f) => f.path),
        interview_answers: interviewAnswers,
      });
      setEditingOriginal(false);
      await runGenerate("summary");
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
    setOutputContent("summary", JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen">
      <Header email={email} />
      <main className="flex flex-col items-center gap-8 px-4 py-12">
        <StepProgressBar currentStep={step} />

        {step === 1 && (
          <div className="flex w-full max-w-lg flex-col gap-4">
            <TextEditor value={text} onChange={setText} />
            <FeatureTagInput tags={features} onChange={setFeatures} />
            {userId && (
              <FileUploader userId={userId} files={files} onChange={setFiles} />
            )}
            {step1Error && <ErrorMessage message={step1Error} />}
            {analyzing ? (
              <SkeletonLoader label="요청 내용을 분석하고 있습니다..." />
            ) : (
              <button
                type="button"
                onClick={handleAnalyze}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                분석 요청
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <InterviewStep
            questions={questions}
            answers={answers}
            onAnswerChange={(id, answer) =>
              setAnswers((prev) => ({ ...prev, [id]: answer }))
            }
            onSkip={() => setStep(3)}
            onSubmit={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <div className="flex w-full max-w-3xl flex-col gap-4">
            <h1 className="text-lg font-semibold text-gray-900">요청 확인</h1>

            {generateError && <ErrorMessage message={generateError} />}

            {confirmed ? (
              <div className="rounded-md border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-700">
                  확정되었습니다. 인텔리전스팀이 검토를 진행할 예정입니다.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/requests")}
                  className="mt-4 text-sm text-gray-500 underline"
                >
                  요청 이력에서 확인하기
                </button>
              </div>
            ) : editingOriginal ? (
              <div className="flex flex-col gap-4">
                <TextEditor value={text} onChange={setText} />
                <FeatureTagInput tags={features} onChange={setFeatures} />
                {userId && <FileUploader userId={userId} files={files} onChange={setFiles} />}
                {originalEditError && <ErrorMessage message={originalEditError} />}
                <p className="text-xs text-gray-400">
                  저장하면 요청 내용을 기준으로 요약이 다시 생성됩니다.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEditOriginal}
                    disabled={savingOriginal}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingOriginal ? "저장 중..." : "저장"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditOriginal}
                    disabled={savingOriginal}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : outputsState.summary?.status === "done" ? (
              <RequesterOutputView
                key={outputsState.summary.content}
                summary={JSON.parse(outputsState.summary.content) as SummaryContent}
                status="drafting"
                onConfirm={handleConfirm}
                onEdit={handleOpenEditOriginal}
                onSaveSummary={handleSaveSummary}
              />
            ) : outputsState.summary?.status === "error" ? (
              <div className="flex flex-col items-start gap-2">
                <ErrorMessage message="요약 생성에 실패했습니다. 서버가 깨어나는 중일 수 있어요. 잠시 후 다시 시도해주세요." />
                <button
                  type="button"
                  onClick={() => runGenerate("summary")}
                  className="text-sm text-gray-500 underline"
                >
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
                className="text-center text-sm text-gray-500 underline"
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
