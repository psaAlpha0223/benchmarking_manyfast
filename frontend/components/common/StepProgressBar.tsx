const STEPS = [
  { step: 1, label: "요청 입력" },
  { step: 2, label: "AI 사전 인터뷰" },
  { step: 3, label: "기획서 생성" },
];

export default function StepProgressBar({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {STEPS.map(({ step, label }, idx) => (
        <div key={step} className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step === currentStep
                  ? "bg-gray-900 text-white"
                  : step < currentStep
                  ? "bg-gray-300 text-gray-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step}
            </div>
            <span
              className={`text-sm ${
                step === currentStep ? "font-medium text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && <div className="h-px w-8 bg-gray-200" />}
        </div>
      ))}
    </div>
  );
}
