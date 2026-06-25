"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false });

function sanitizeEdgeLabels(code: string): string {
  return code.replace(/\|([^|]*)\|/g, (_match, label) => `|${label.replace(/\s*\n\s*/g, " ").trim()}|`);
}

function quoteLabel(label: string): string {
  const trimmed = label.replace(/\s*\n\s*/g, " ").trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed;
  return `"${trimmed.replace(/"/g, "'")}"`;
}

function sanitizeNodeLabels(code: string): string {
  return code
    .replace(/\[([^[\]]*)\]/g, (_match, label) => `[${quoteLabel(label)}]`)
    .replace(/\{([^{}]*)\}/g, (_match, label) => `{${quoteLabel(label)}}`);
}

export default function MermaidRenderer({ code }: { code: string }) {
  const renderId = useId().replace(/:/g, "-");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    mermaid
      .render(`mermaid-${renderId}`, sanitizeNodeLabels(sanitizeEdgeLabels(code)))
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "다이어그램 렌더링에 실패했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [code, renderId]);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-xs text-red-600">
        다이어그램을 그릴 수 없습니다: {error}
      </div>
    );
  }

  if (!svg) {
    return <div className="h-24 animate-pulse rounded-md bg-gray-100" />;
  }

  return <div className="overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
