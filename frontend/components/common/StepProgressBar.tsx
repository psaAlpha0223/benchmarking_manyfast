const STEPS = [
  { step: 1, label: "요청 입력" },
  { step: 2, label: "요청 확인" },
];

export default function StepProgressBar({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {STEPS.map(({ step, label }, idx) => (
        <div key={step} className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition-colors ${
                step === currentStep
                  ? "bg-white text-blue-700"
                  : step < currentStep
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step}
            </div>
            <span
              className={`text-sm ${
                step === currentStep ? "font-semibold text-white" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`h-px w-8 ${currentStep > step ? "bg-blue-300" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
