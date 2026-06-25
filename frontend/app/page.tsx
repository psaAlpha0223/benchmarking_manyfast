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
import GenerationPanel from "@/components/output/GenerationPanel";
import { createClient } from "@/lib/supabase";
import { fetchInterviewQuestions } from "@/lib/api";
import { useGenerationFlow } from "@/hooks/useGenerationFlow";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
    activeOutputTab,
    setActiveOutputTab,
    generating,
    generateError,
    runGenerate,
    resetGeneration,
    nextOutputType,
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
      runGenerate("prd");
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
    resetGeneration();
    generateStarted.current = false;
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
          <div className="flex w-full max-w-6xl flex-col gap-4">
            <h1 className="text-lg font-semibold text-gray-900">기획서 생성</h1>

            <GenerationPanel
              outputsState={outputsState}
              activeOutputTab={activeOutputTab}
              setActiveOutputTab={setActiveOutputTab}
              generating={generating}
              generateError={generateError}
              nextOutputType={nextOutputType}
              runGenerate={runGenerate}
            />

            {!generating && (
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
