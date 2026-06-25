import MarkdownRenderer from "@/components/renderers/MarkdownRenderer";

export default function PrdView({ content }: { content: string }) {
  return <MarkdownRenderer content={content} />;
}
