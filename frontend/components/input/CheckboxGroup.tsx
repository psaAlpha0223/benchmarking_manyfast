export default function CheckboxGroup({
  options,
  selected,
  onChange,
  hasOther,
  otherValue,
  onOtherChange,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  hasOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <label
            key={option}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors cursor-pointer ${
              active ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(option)}
              className="h-4 w-4 accent-blue-600"
            />
            <span className={active ? "font-medium text-blue-700" : "text-gray-700"}>{option}</span>
          </label>
        );
      })}
      {hasOther && (
        <div className="flex items-center gap-2 px-1">
          <span className="shrink-0 text-sm text-gray-500">기타</span>
          <input
            value={otherValue ?? ""}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder="직접 입력"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      )}
    </div>
  );
}
