"use client";

import { useState } from "react";
import { streamGenerate, type PainPoint } from "@/lib/api";

export type SummaryStatus = "pending" | "streaming" | "done" | "error";

export interface GenerationInput {
  painPoint: PainPoint;
  filePaths: string[];
  team: string;
  submitterName: string;
}

export function useGenerationFlow(
  input: GenerationInput,
  initial?: { requestId?: string; summaryStatus?: SummaryStatus; summaryContent?: string }
) {
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus | null>(
    initial?.summaryStatus ?? null
  );
  const [summaryContent, setSummaryContent] = useState<string>(initial?.summaryContent ?? "");
  const [requestId, setRequestId] = useState<string | undefined>(initial?.requestId);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function runGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setSummaryStatus("pending");

    try {
      await streamGenerate(
        {
          pain_point: input.painPoint,
          file_paths: input.filePaths,
          output_type: "summary",
          request_id: requestId,
          team: input.team,
          submitter_name: input.submitterName,
        },
        (event, data) => {
          if (event === "request_created" && data.request_id) {
            setRequestId(data.request_id);
            return;
          }
          if (event === "summary_start") {
            setSummaryStatus("streaming");
          } else if (event === "summary_done") {
            const content =
              typeof data.content === "string" ? data.content : JSON.stringify(data.content ?? "");
            setSummaryContent(content);
            setSummaryStatus("done");
          } else if (event === "error") {
            setGenerateError(data.message ?? "요약 생성에 실패했습니다.");
            setSummaryStatus("error");
          }
        }
      );
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "요약 생성에 실패했습니다.");
      setSummaryStatus("error");
    } finally {
      setGenerating(false);
    }
  }

  function setSummaryContentDirect(content: string) {
    setSummaryContent(content);
    setSummaryStatus("done");
  }

  function resetGeneration() {
    setSummaryStatus(null);
    setSummaryContent("");
    setRequestId(undefined);
    setGenerateError(null);
  }

  return {
    summaryStatus,
    summaryContent,
    requestId,
    generating,
    generateError,
    runGenerate,
    resetGeneration,
    setSummaryContent: setSummaryContentDirect,
  };
}
