from typing import Optional

from pydantic import BaseModel


class PainPoint(BaseModel):
    feature_request: str
    current_process: str
    pain_points: list[str] = []
    pain_points_other: Optional[str] = None
    desired_change: Optional[str] = None
    required_outputs: list[str] = []
    required_outputs_other: Optional[str] = None
    current_tools: list[str] = []
    current_tools_other: Optional[str] = None
    input_data_types: list[str] = []
    input_data_types_other: Optional[str] = None
    sample_link: Optional[str] = None
    dev_preference: list[str] = []
    constraints: Optional[str] = None


class GenerateRequest(BaseModel):
    pain_point: Optional[PainPoint] = None
    file_paths: Optional[list[str]] = None
    output_type: str = "summary"
    request_id: Optional[str] = None
    team: Optional[str] = None
    submitter_name: Optional[str] = None


class UpdateRequestPayload(BaseModel):
    pain_point: PainPoint
    file_paths: Optional[list[str]] = None


class RequestUpdateResponse(BaseModel):
    id: str
    status: str
    pain_point: PainPoint
    file_paths: Optional[list[str]] = None


class ConfirmPayload(BaseModel):
    confirmed_features: list[str]


class ConfirmResponse(BaseModel):
    request_id: str
    status: str
    confirmed_features: list[str]


class SummaryCardPayload(BaseModel):
    service_name: str
    purpose: str
    target_users: str
    key_features: list[str]


class FeatureChecklistItemPayload(BaseModel):
    id: str
    name: str
    description: str
    checked: bool


class UpdateSummaryPayload(BaseModel):
    summary_card: SummaryCardPayload
    feature_checklist: list[FeatureChecklistItemPayload]
