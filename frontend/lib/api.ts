import { createClient } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function authHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
}

export interface InterviewQuestion {
  id: string;
  question: string;
  options: string[];
}

export async function fetchInterviewQuestions(payload: {
  text: string;
  features: string[];
  file_paths: string[];
}): Promise<InterviewQuestion[]> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/interview`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "질문 생성에 실패했습니다.");
  }

  const data = await res.json();
  return data.questions;
}

export type OutputType = "summary" | "prd" | "spec" | "userflow" | "wireframe";

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
  text: string;
  features: string[];
  file_paths: string[];
  interview_answers: { id: string; answer: string }[];
  output_type: OutputType;
  request_id?: string;
  prd_content?: string;
  spec_content?: string;
  userflow_content?: string;
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
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
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

export interface RequestSummary {
  id: string;
  text: string | null;
  features: string[];
  status: string;
  created_at: string;
  completed_outputs: OutputType[];
}

export interface RequestDetail {
  id: string;
  user_id: string;
  text: string | null;
  features: string[];
  confirmed_features: string[] | null;
  status: string;
  interview_answers: { id: string; answer: string }[] | null;
  file_paths: string[] | null;
  created_at: string;
  outputs: {
    type: OutputType;
    content: { content: string } | SummaryContent;
    created_at: string;
  }[];
}

export async function fetchRequests(): Promise<RequestSummary[]> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/requests`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "요청 이력을 불러오지 못했습니다.");
  }
  return res.json();
}

export async function fetchRequestDetail(requestId: string): Promise<RequestDetail> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/requests/${requestId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "요청 상세를 불러오지 못했습니다.");
  }
  return res.json();
}

export interface UpdateRequestPayload {
  text: string;
  features: string[];
  file_paths: string[];
  interview_answers: { id: string; answer: string }[];
}

export async function updateRequest(
  requestId: string,
  payload: UpdateRequestPayload
): Promise<RequestDetail> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/requests/${requestId}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "요청 수정에 실패했습니다.");
  }
  return res.json();
}

export async function deleteRequest(requestId: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/requests/${requestId}`, {
    method: "DELETE",
    headers,
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
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/requests/${requestId}/confirm`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
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
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/requests/${requestId}/summary`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "요약 수정에 실패했습니다.");
  }
  return res.json();
}

export async function updateRequestStatus(
  requestId: string,
  status: string
): Promise<{ request_id: string; status: string }> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/requests/${requestId}/status`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "상태 변경에 실패했습니다.");
  }
  return res.json();
}
