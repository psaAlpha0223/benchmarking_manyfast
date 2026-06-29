export interface SubFeature {
  id: string;
  name: string;
  description: string;
  priority: "필수" | "중요" | "선택" | string;
  notes?: string;
}

export interface Feature {
  id: string;
  category: string;
  name: string;
  description: string;
  sub_features: SubFeature[];
}

export interface FunctionSpec {
  features: Feature[];
}

export function parseSpecContent(raw: string): FunctionSpec {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

export interface PrdField {
  label: string;
  value: string;
}

export interface PrdSection {
  id: string;
  title: string;
  icon: string;
  fields: PrdField[];
}

export interface StructuredPrd {
  sections: PrdSection[];
}

export function parsePrdContent(raw: string): StructuredPrd | null {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed?.sections)) return parsed as StructuredPrd;
    return null;
  } catch {
    return null;
  }
}
