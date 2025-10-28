from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional


# Content Schemas
class ContentBase(BaseModel):
    content_type: str = Field(..., description="Type of content: text, code, image")
    value: str = Field(..., description="The actual content value")


class ContentCreate(ContentBase):
    pass


class ContentResponse(ContentBase):
    id: UUID
    chapter_id: UUID

    class Config:
        from_attributes = True


# Chapter Schemas
class ChapterBase(BaseModel):
    title: str = Field(..., max_length=255)


class ChapterCreate(ChapterBase):
    pass


class ChapterResponse(ChapterBase):
    id: UUID
    parent_id: UUID
    status: str
    contents: List[ContentResponse] = []

    class Config:
        from_attributes = True


class ChapterListItem(ChapterBase):
    id: UUID
    status: str

    class Config:
        from_attributes = True


# Explanation Schemas
class ExplanationBase(BaseModel):
    text: str = Field(..., max_length=255, description="The concept title")
    overview: str = Field(..., description="High-level overview of the concept")


class ExplanationCreate(BaseModel):
    concept: str = Field(..., description="The concept user wants explained")


class ExplanationResponse(ExplanationBase):
    id: UUID
    created_at: datetime
    chapters: List[ChapterListItem] = []

    class Config:
        from_attributes = True


class ExplanationListItem(BaseModel):
    id: UUID
    text: str
    created_at: datetime

    class Config:
        from_attributes = True


# Planner Response (immediate return after planning)
class PlannerResponse(BaseModel):
    explanation_id: UUID
    text: str
    overview: str
    chapters: List[ChapterListItem]


# Status Check Response
class ExplanationStatusResponse(BaseModel):
    explanation_id: UUID
    total_chapters: int
    completed_chapters: int
    pending_chapters: int
    status: str  # "planning", "building", "completed"
