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
import { fetchInterviewQuestions, confirmRequest, deleteRequest, type SummaryContent } from "@/lib/api";
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

  async function handleEditFromStep3() {
    if (requestId) {
      try {
        await deleteRequest(requestId);
      } catch {
        // 미확정 임시 요청 삭제 실패는 무시하고 편집으로 진행
      }
    }
    setStep(1);
    resetGeneration();
    generateStarted.current = false;
  }

  async function handleConfirm(confirmedFeatures: string[]) {
    if (!requestId) return;
    await confirmRequest(requestId, confirmedFeatures);
    setConfirmed(true);
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
            ) : outputsState.summary?.status === "done" ? (
              <RequesterOutputView
                summary={JSON.parse(outputsState.summary.content) as SummaryContent}
                status="drafting"
                onConfirm={handleConfirm}
                onEdit={handleEditFromStep3}
              />
            ) : (
              <SkeletonLoader label="요청 내용을 요약하고 있습니다..." />
            )}

            {!generating && !confirmed && (
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
