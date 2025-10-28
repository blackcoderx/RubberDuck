from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from uuid import uuid4

from api.models import Explanation, Chapter, Content
from api.schemas import (
    ExplanationCreate,
    ExplanationResponse,
    ExplanationListItem,
    PlannerResponse,
    ChapterResponse,
    ExplanationStatusResponse,
)
from api.genai import planner_service, builder_service

router = APIRouter(prefix="/api", tags=["explanations"])


@router.post("/explanations", response_model=PlannerResponse)
async def create_explanation(
    data: ExplanationCreate,
    background_tasks: BackgroundTasks
):
    """
    Create a new explanation. The Planner generates the structure immediately,
    and the Builder works in the background to generate chapter content.
    """
    try:
        # Step 1: Planner generates structure (fast)
        plan = await planner_service.plan_explanation(data.concept)

        # Step 2: Create Explanation in database
        explanation = await Explanation.create(
            id=uuid4(),
            text=plan["title"],
            overview=plan["overview"]
        )

        # Step 3: Create empty chapters with titles
        chapters = []
        for chapter_title in plan["chapters"]:
            chapter = await Chapter.create(
                id=uuid4(),
                parent_id=explanation.id,
                title=chapter_title,
                status="pending"
            )
            chapters.append({
                "id": chapter.id,
                "title": chapter.title,
                "status": chapter.status
            })

        # Step 4: Schedule Builder to generate content in background
        background_tasks.add_task(
            build_all_chapters,
            explanation_id=explanation.id,
            concept=plan["title"],
            chapters=chapters
        )

        # Step 5: Return immediately with structure
        return PlannerResponse(
            explanation_id=explanation.id,
            text=plan["title"],
            overview=plan["overview"],
            chapters=chapters
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create explanation: {str(e)}")


async def build_all_chapters(explanation_id: str, concept: str, chapters: List[dict]):
    """
    Background task: Build content for all chapters sequentially.
    """
    for chapter_data in chapters:
        try:
            # Update chapter status to building
            chapter = await Chapter.get(id=chapter_data["id"])
            chapter.status = "building"
            await chapter.save()

            # Generate content using Builder AI
            content_items = await builder_service.build_chapter_content(
                concept=concept,
                chapter_title=chapter_data["title"]
            )

            # Save content items to database
            for item in content_items:
                await Content.create(
                    id=uuid4(),
                    chapter_id=chapter.id,
                    content_type=item["content_type"],
                    value=item["value"]
                )

            # Update chapter status to completed
            chapter.status = "completed"
            await chapter.save()

        except Exception as e:
            # Log error but continue with other chapters
            print(f"Error building chapter {chapter_data['id']}: {e}")
            chapter = await Chapter.get(id=chapter_data["id"])
            chapter.status = "error"
            await chapter.save()


@router.get("/explanations", response_model=List[ExplanationListItem])
async def list_explanations():
    """
    Get all past explanations (for sidebar).
    """
    explanations = await Explanation.all().order_by("-created_at")
    return [
        ExplanationListItem(
            id=exp.id,
            text=exp.text,
            created_at=exp.created_at
        )
        for exp in explanations
    ]


@router.get("/explanations/{explanation_id}", response_model=ExplanationResponse)
async def get_explanation(explanation_id: str):
    """
    Get a specific explanation with its chapters.
    """
    try:
        explanation = await Explanation.get(id=explanation_id).prefetch_related("chapters")

        return ExplanationResponse(
            id=explanation.id,
            text=explanation.text,
            overview=explanation.overview,
            created_at=explanation.created_at,
            chapters=[
                {
                    "id": chapter.id,
                    "title": chapter.title,
                    "status": chapter.status
                }
                for chapter in explanation.chapters
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Explanation not found")


@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(chapter_id: str):
    """
    Get a specific chapter with all its content.
    """
    try:
        chapter = await Chapter.get(id=chapter_id).prefetch_related("contents", "parent")

        return ChapterResponse(
            id=chapter.id,
            title=chapter.title,
            parent_id=chapter.parent_id,
            status=chapter.status,
            contents=[
                {
                    "id": content.id,
                    "chapter_id": content.chapter_id,
                    "content_type": content.content_type,
                    "value": content.value
                }
                for content in chapter.contents
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Chapter not found")


@router.get("/explanations/{explanation_id}/status", response_model=ExplanationStatusResponse)
async def get_explanation_status(explanation_id: str):
    """
    Check the build status of an explanation.
    Useful for polling from frontend to show progress.
    """
    try:
        explanation = await Explanation.get(id=explanation_id).prefetch_related("chapters")

        total_chapters = len(explanation.chapters)
        completed_chapters = sum(1 for ch in explanation.chapters if ch.status == "completed")
        pending_chapters = sum(1 for ch in explanation.chapters if ch.status in ["pending", "building"])

        # Determine overall status
        if completed_chapters == total_chapters:
            status = "completed"
        elif pending_chapters == total_chapters:
            status = "planning"
        else:
            status = "building"

        return ExplanationStatusResponse(
            explanation_id=explanation.id,
            total_chapters=total_chapters,
            completed_chapters=completed_chapters,
            pending_chapters=pending_chapters,
            status=status
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Explanation not found")
