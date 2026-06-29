const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface PainPoint {
  feature_request: string;
  current_process: string;
  pain_points: string[];
  pain_points_other: string;
  desired_change: string;
  required_outputs: string[];
  required_outputs_other: string;
  current_tools: string[];
  current_tools_other: string;
  input_data_types: string[];
  input_data_types_other: string;
  sample_link: string;
  dev_preference: string[];
  constraints: string;
}

export const EMPTY_PAIN_POINT: PainPoint = {
  feature_request: "",
  current_process: "",
  pain_points: [],
  pain_points_other: "",
  desired_change: "",
  required_outputs: [],
  required_outputs_other: "",
  current_tools: [],
  current_tools_other: "",
  input_data_types: [],
  input_data_types_other: "",
  sample_link: "",
  dev_preference: [],
  constraints: "",
};

export type OutputType = "summary";

export interface SummaryCard {
  service_name: string;
  purpose: string;
  target_users: string;
  key_features: string[];
}

export interface FeatureChecklistItem {
  id: string;
  name: string;
  description: string;
  checked: boolean;
}

export interface SummaryContent {
  summary_card: SummaryCard;
  feature_checklist: FeatureChecklistItem[];
}

export interface GeneratePayload {
  pain_point: PainPoint;
  file_paths: string[];
  output_type: OutputType;
  request_id?: string;
  team?: string;
  submitter_name?: string;
}

export interface GenerateEventData {
  content?: string | SummaryContent;
  output_type?: string;
  message?: string;
  request_id?: string;
}

export async function streamGenerate(
  payload: GeneratePayload,
  onEvent: (event: string, data: GenerateEventData) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "기획서 생성 요청에 실패했습니다.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const eventMatch = part.match(/^event: (.+)$/m);
      const dataMatch = part.match(/^data: (.+)$/m);
      if (eventMatch && dataMatch) {
        onEvent(eventMatch[1], JSON.parse(dataMatch[1]));
      }
    }
  }
}

export interface UpdateRequestPayload {
  pain_point: PainPoint;
  file_paths: string[];
}

export interface RequestUpdateResponse {
  id: string;
  status: string;
  pain_point: PainPoint;
  file_paths: string[] | null;
}

export async function updateRequest(
  requestId: string,
  payload: UpdateRequestPayload
): Promise<RequestUpdateResponse> {
  const res = await fetch(`${API_BASE}/api/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "요청 수정에 실패했습니다.");
  }
  return res.json();
}

export async function deleteRequest(requestId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/requests/${requestId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "요청 삭제에 실패했습니다.");
  }
}

export interface ConfirmResponse {
  request_id: string;
  status: string;
  confirmed_features: string[];
}

export async function confirmRequest(
  requestId: string,
  confirmedFeatures: string[]
): Promise<ConfirmResponse> {
  const res = await fetch(`${API_BASE}/api/requests/${requestId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmed_features: confirmedFeatures }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "확정 처리에 실패했습니다.");
  }
  return res.json();
}

export async function updateSummary(
  requestId: string,
  content: SummaryContent
): Promise<SummaryContent> {
  const res = await fetch(`${API_BASE}/api/requests/${requestId}/summary`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "요약 수정에 실패했습니다.");
  }
  return res.json();
}
