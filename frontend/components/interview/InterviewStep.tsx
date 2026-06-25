import QuestionCard, { type Question, type Answer } from "./QuestionCard";

export default function InterviewStep({
  questions,
  answers,
  onAnswerChange,
  onSkip,
  onSubmit,
}: {
  questions: Question[];
  answers: Record<string, Answer>;
  onAnswerChange: (questionId: string, answer: Answer) => void;
  onSkip: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answer={answers[q.id] ?? { selected: null, custom: "" }}
          onChange={(answer) => onAnswerChange(q.id, answer)}
        />
      ))}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md px-4 py-2 text-sm text-gray-500 underline"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          기획서 생성
        </button>
      </div>
    </div>
  );
}
