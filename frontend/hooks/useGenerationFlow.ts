"use client";

import { useState } from "react";
import { streamGenerate, type OutputType } from "@/lib/api";
import { WIREFRAME_ENABLED } from "@/lib/config";

export const OUTPUT_ORDER: OutputType[] = WIREFRAME_ENABLED
  ? ["prd", "spec", "userflow", "wireframe"]
  : ["prd", "spec", "userflow"];

export interface OutputState {
  status: "pending" | "streaming" | "done" | "error";
  content: string;
}

export interface GenerationInput {
  text: string;
  features: string[];
  filePaths: string[];
  interviewAnswers: { id: string; answer: string }[];
}

export function useGenerationFlow(
  input: GenerationInput,
  initial?: { requestId?: string; outputsState?: Partial<Record<OutputType, OutputState>> }
) {
  const [outputsState, setOutputsState] = useState<Partial<Record<OutputType, OutputState>>>(
    initial?.outputsState ?? {}
  );
  const [activeOutputTab, setActiveOutputTab] = useState<OutputType>("prd");
  const [requestId, setRequestId] = useState<string | undefined>(initial?.requestId);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function runGenerate(outputType: OutputType) {
    setGenerating(true);
    setGenerateError(null);
    setActiveOutputTab(outputType);
    setOutputsState((prev) => ({ ...prev, [outputType]: { status: "pending", content: "" } }));

    try {
      await streamGenerate(
        {
          text: input.text,
          features: input.features,
          file_paths: input.filePaths,
          interview_answers: input.interviewAnswers,
          output_type: outputType,
          request_id: requestId,
          prd_content: outputsState.prd?.content,
          spec_content: outputsState.spec?.content,
          userflow_content: outputsState.userflow?.content,
        },
        (event, data) => {
          if (event === "request_created" && data.request_id) {
            setRequestId(data.request_id);
            return;
          }
          const match = event.match(/^([a-z]+)_(start|chunk|done)$/);
          if (match) {
            const type = match[1] as OutputType;
            const phase = match[2];
            setOutputsState((prev) => {
              const current = prev[type] ?? { status: "pending", content: "" };
              if (phase === "start") return { ...prev, [type]: { ...current, status: "streaming" } };
              if (phase === "chunk")
                return {
                  ...prev,
                  [type]: { ...current, content: current.content + (data.content ?? "") },
                };
              return { ...prev, [type]: { status: "done", content: data.content ?? "" } };
            });
          } else if (event === "error" && data.output_type) {
            const errType = data.output_type as OutputType;
            setOutputsState((prev) => ({
              ...prev,
              [errType]: { ...(prev[errType] ?? { content: "" }), status: "error" },
            }));
          }
        }
      );
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "기획서 생성에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  function resetGeneration() {
    setOutputsState({});
    setActiveOutputTab("prd");
    setRequestId(undefined);
    setGenerateError(null);
  }

  const lastDoneIndex = OUTPUT_ORDER.reduce(
    (acc, type, idx) => (outputsState[type]?.status === "done" ? idx : acc),
    -1
  );
  const nextOutputType: OutputType | null =
    lastDoneIndex >= 0 && lastDoneIndex < OUTPUT_ORDER.length - 1
      ? OUTPUT_ORDER[lastDoneIndex + 1]
      : null;

  return {
    outputsState,
    activeOutputTab,
    setActiveOutputTab,
    requestId,
    generating,
    generateError,
    runGenerate,
    resetGeneration,
    nextOutputType,
  };
}
