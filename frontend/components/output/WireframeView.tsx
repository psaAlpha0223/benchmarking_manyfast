function cleanHtml(raw: string): string {
  return raw
    .trim()
    .replace(/^```(html)?/, "")
    .replace(/```$/, "")
    .trim();
}

export default function WireframeView({ content }: { content: string }) {
  const html = cleanHtml(content);

  if (!html) {
    return <p className="text-sm text-gray-400">와이어프레임 내용이 없습니다.</p>;
  }

  return (
    <iframe
      srcDoc={html}
      sandbox=""
      className="h-[600px] w-full rounded-md border border-gray-200 bg-white"
      title="와이어프레임 미리보기"
    />
  );
}
