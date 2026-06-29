"use client";

import type { ReactNode } from "react";
import CheckboxGroup from "./CheckboxGroup";
import FileUploader, { type UploadedFile } from "./FileUploader";
import type { PainPoint } from "@/lib/api";

const PAIN_POINT_OPTIONS = [
  "단순 반복성 업무라서 실무자의 시간을 투입하기 아깝다",
  "절대량(혹은 걸리는 시간)이 너무 많다",
  "실무자가 퀄리티를 맞추기 어려워 피드백에 시간을 많이 쓴다",
  "실수(오류)가 자주 발생한다",
  "특정 담당자에게만 지식이 몰려 있어, 그가 없으면 업무 진행이 안된다",
  "사용하는 툴들이 서로 연동되지 않아 동일 데이터를 다른 양식으로 매번 바꿔야 한다",
];

const REQUIRED_OUTPUTS_OPTIONS = ["정리된 엑셀/시트", "자동화된 프로세스", "시각화(차트/그래프)", "웹 화면/툴"];

const CURRENT_TOOLS_OPTIONS = ["Excel / Google Sheets", "Notion", "구글폼/설문 폼"];

const INPUT_DATA_TYPES_OPTIONS = ["엑셀 파일", "PDF", "텍스트", "오디오/비디오", "API/DB", "아직 정리 안 됨"];

const DEV_PREFERENCE_OPTIONS = [
  "단순 엑셀 함수나 매크로도 괜찮아요",
  "자동화 툴 (Zapier, Make 등)",
  "간단한 웹/앱 개발",
  "잘 모르겠음 (제안에 따름)",
];

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function PainPointForm({
  value,
  onChange,
  files,
  onFilesChange,
  sessionId,
}: {
  value: PainPoint;
  onChange: (value: PainPoint) => void;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  sessionId: string;
}) {
  function set<K extends keyof PainPoint>(key: K, v: PainPoint[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-8">
      <Section title="Pain Point" description="지금 겪고 있는 어려움을 알려주세요">
        <Question number="1" title="어떤 기능을 원하시나요?" required>
          <textarea
            rows={4}
            value={value.feature_request}
            onChange={(e) => set("feature_request", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </Question>

        <Question number="2" title="기존에는 위 업무를 어떤 프로세스로 진행했나요?" required>
          <textarea
            rows={4}
            value={value.current_process}
            onChange={(e) => set("current_process", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </Question>

        <Question number="3" title="어떤 점이 가장 불편한가요?" required>
          <CheckboxGroup
            options={PAIN_POINT_OPTIONS}
            selected={value.pain_points}
            onChange={(v) => set("pain_points", v)}
            hasOther
            otherValue={value.pain_points_other}
            onOtherChange={(v) => set("pain_points_other", v)}
          />
        </Question>
      </Section>

      <Section title="Solution" description="원하시는 결과물의 모습을 구체적으로 알려주세요">
        <Question number="4" title="해당 업무가 어떻게 바뀌면 좋을까요?">
          <textarea
            rows={3}
            placeholder="예) 버튼 한 번으로 정리됨 / 자동 그래프 생성 / 정리된 결과를 PDF로 바로 공유"
            value={value.desired_change}
            onChange={(e) => set("desired_change", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </Question>

        <Question number="5" title="반드시 필요한 결과물은 무엇인가요?">
          <CheckboxGroup
            options={REQUIRED_OUTPUTS_OPTIONS}
            selected={value.required_outputs}
            onChange={(v) => set("required_outputs", v)}
            hasOther
            otherValue={value.required_outputs_other}
            onOtherChange={(v) => set("required_outputs_other", v)}
          />
        </Question>

        <Question number="6" title="현재 해당 작업을 진행할 때 사용하는 도구를 입력해주세요">
          <CheckboxGroup
            options={CURRENT_TOOLS_OPTIONS}
            selected={value.current_tools}
            onChange={(v) => set("current_tools", v)}
            hasOther
            otherValue={value.current_tools_other}
            onOtherChange={(v) => set("current_tools_other", v)}
          />
        </Question>

        <Question number="7" title="입력 데이터 형태">
          <CheckboxGroup
            options={INPUT_DATA_TYPES_OPTIONS}
            selected={value.input_data_types}
            onChange={(v) => set("input_data_types", v)}
            hasOther
            otherValue={value.input_data_types_other}
            onOtherChange={(v) => set("input_data_types_other", v)}
          />
        </Question>

        <Question number="8" title="샘플 파일 또는 예시 링크">
          <div className="flex flex-col gap-3">
            <FileUploader sessionId={sessionId} files={files} onChange={onFilesChange} />
            <input
              placeholder="또는 예시 링크를 입력해주세요"
              value={value.sample_link}
              onChange={(e) => set("sample_link", e.target.value)}
              className={TEXTAREA_CLASS}
            />
          </div>
        </Question>

        <Question number="9" title="자동화/개발 중 어떤 게 가장 필요한가요?">
          <CheckboxGroup
            options={DEV_PREFERENCE_OPTIONS}
            selected={value.dev_preference}
            onChange={(v) => set("dev_preference", v)}
          />
        </Question>

        <Question number="10" title="제약 사항 & 참고사항">
          <textarea
            rows={3}
            placeholder="반드시 지켜야할 형식이나 규칙이 있나요? 이미 시도해봤지만 잘 안 된 방법이 있나요?"
            value={value.constraints}
            onChange={(e) => set("constraints", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </Question>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 border-b border-blue-100 pb-3">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}

function Question({
  number,
  title,
  required,
  children,
}: {
  number: string;
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
          {number}
        </span>
        {title}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
