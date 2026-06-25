import MermaidRenderer from "@/components/renderers/MermaidRenderer";

function extractMermaidBlocks(content: string): string[] {
  const matches = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  if (matches.length > 0) return matches.map((m) => m[1].trim());
  return content.trim() ? [content.trim()] : [];
}

export default function UserFlowView({ content }: { content: string }) {
  const blocks = extractMermaidBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-sm text-gray-400">유저플로우 내용이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((code, idx) => (
        <div key={idx} className="rounded-md border border-gray-200 p-4">
          <MermaidRenderer code={code} />
        </div>
      ))}
    </div>
  );
}
