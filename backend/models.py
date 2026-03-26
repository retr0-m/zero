from uuid import UUID

from pydantic import BaseModel, field_validator
from config import settings
from typing import Literal


class IdeaRequest(BaseModel):
    idea: str

    @field_validator("idea")
    @classmethod
    def validate_idea(cls, v: str) -> str:
        v = v.strip()
        if len(v) < settings.idea_min_length:
            raise ValueError(f"Idea must be at least {settings.idea_min_length} characters.")
        if len(v) > settings.idea_max_length:
            raise ValueError(f"Idea must be at most {settings.idea_max_length} characters.")
        return v


# step 1 — quick read response

class Question(BaseModel):
    id: str                                  # unique slug, used as answer key
    text: str                                # question shown to user
    type: Literal["text", "choice"]
    choices: list[str] | None = None         # only for type=choice


class QuickReadResult(BaseModel):
    title: str
    summary: str
    viability_score: int
    questions: list[Question]                # dynamic idea-specific questions


# step 2 — full analysis request

class FullAnalysisRequest(BaseModel):
    idea: str
    hours_per_day: str                       # fixed question 1
    budget: str                              # fixed question 2
    answers: dict[str, str]                  # dynamic question answers keyed by question id

    @field_validator("idea")
    @classmethod
    def validate_idea(cls, v: str) -> str:
        v = v.strip()
        if len(v) < settings.idea_min_length:
            raise ValueError(f"Idea must be at least {settings.idea_min_length} characters.")
        if len(v) > settings.idea_max_length:
            raise ValueError(f"Idea must be at most {settings.idea_max_length} characters.")
        return v


# step 2 — full analysis response

class Investment(BaseModel):
    min: float
    max: float
    currency: str
    breakdown: str


class Revenue(BaseModel):
    month_3: float
    month_6: float
    month_12: float
    currency: str


class Timeline(BaseModel):
    first_customer: str
    break_even: str
    amortize: str


class Contact(BaseModel):
    role: str
    why: str
    where: str


class RoadmapItem(BaseModel):
    milestone: str
    when: str


class Problem(BaseModel):
    title: str
    description: str
    mitigation: str
    contingency: str


class FullAnalysisResult(BaseModel):
    title: str
    summary: str
    viability_score: int
    business_plan: list[str]
    roadmap: list[RoadmapItem]
    investment: Investment
    revenue: Revenue
    timeline: Timeline
    contacts_needed: list[Contact]
    problems: list[Problem]


# Auth models

class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str

    model_config = {"from_attributes": True}


# Ideas models

class SaveIdeaRequest(BaseModel):
    original_prompt: str
    analysis: FullAnalysisResult


class IdeaListItem(BaseModel):
    id: str
    title: str
    description: str
    viability_score: int
    created_at: str

    model_config = {"from_attributes": True}


class IdeaDetail(BaseModel):
    id: str
    title: str
    description: str
    viability_score: int
    original_prompt: str
    created_at: str
    tabs: dict
    chat_messages: list[dict]


# Chat models

class ChatRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str

    model_config = {"from_attributes": True}
