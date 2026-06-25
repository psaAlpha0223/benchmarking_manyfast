"use client";

import { useState } from "react";

export interface Question {
  id: string;
  question: string;
  options: string[];
}

export interface Answer {
  selected: string | null;
  custom: string;
}

export default function QuestionCard({
  question,
  answer,
  onChange,
}: {
  question: Question;
  answer: Answer;
  onChange: (answer: Answer) => void;
}) {
  const [showCustom, setShowCustom] = useState(answer.selected === "직접 입력");

  function selectOption(option: string) {
    setShowCustom(option === "직접 입력");
    onChange({ selected: option, custom: option === "직접 입력" ? answer.custom : "" });
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-900">{question.question}</p>
      <div className="flex flex-col gap-2">
        {(question.options.includes("직접 입력")
          ? question.options
          : [...question.options, "직접 입력"]
        ).map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="radio"
              name={question.id}
              checked={answer.selected === option}
              onChange={() => selectOption(option)}
            />
            {option}
          </label>
        ))}
        {showCustom && (
          <input
            value={answer.custom}
            onChange={(e) => onChange({ selected: "직접 입력", custom: e.target.value })}
            placeholder="직접 입력해주세요"
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        )}
      </div>
    </div>
  );
}
