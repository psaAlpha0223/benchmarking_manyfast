from typing import Optional

from pydantic import BaseModel


class InterviewAnswer(BaseModel):
    id: str
    answer: str


class Question(BaseModel):
    id: str
    question: str
    options: list[str]


class InterviewRequest(BaseModel):
    text: Optional[str] = None
    features: list[str]
    file_paths: Optional[list[str]] = None


class InterviewResponse(BaseModel):
    questions: list[Question]


class GenerateRequest(BaseModel):
    text: Optional[str] = None
    features: list[str]
    file_paths: Optional[list[str]] = None
    interview_answers: Optional[list[InterviewAnswer]] = None
    output_type: str  # "summary" | "prd" | "spec" | "userflow" | "wireframe"
    request_id: Optional[str] = None
    prd_content: Optional[str] = None
    spec_content: Optional[str] = None
    userflow_content: Optional[str] = None


class RequestSummary(BaseModel):
    id: str
    text: Optional[str] = None
    features: list[str]
    status: str
    created_at: str
    completed_outputs: list[str]


class OutputItem(BaseModel):
    type: str
    content: dict
    created_at: str


class RequestDetail(BaseModel):
    id: str
    user_id: str
    text: Optional[str] = None
    features: list[str]
    confirmed_features: Optional[list[str]] = None
    status: str
    interview_answers: Optional[list[dict]] = None
    file_paths: Optional[list[str]] = None
    created_at: str
    outputs: list[OutputItem]


class UpdateRequestPayload(BaseModel):
    text: Optional[str] = None
    features: list[str]
    file_paths: Optional[list[str]] = None
    interview_answers: Optional[list[InterviewAnswer]] = None


class ConfirmPayload(BaseModel):
    confirmed_features: list[str]


class ConfirmResponse(BaseModel):
    request_id: str
    status: str
    confirmed_features: list[str]


class StatusUpdatePayload(BaseModel):
    status: str  # "in_review" | "completed"


class StatusUpdateResponse(BaseModel):
    request_id: str
    status: str
