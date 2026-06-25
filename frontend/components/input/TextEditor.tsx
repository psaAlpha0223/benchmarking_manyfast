export default function TextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="어떤 것을 요청하고 싶으신가요? 꼭 필요한 주요 기능을 함께 작성해주세요."
      rows={8}
      className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
    />
  );
}
