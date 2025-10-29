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
    RebuildResponse,
    IncompleteChaptersResponse,
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
async def get_explanation(explanation_id: str, background_tasks: BackgroundTasks):
    """
    Get a specific explanation with its chapters.
    Automatically triggers rebuild for any incomplete chapters.
    """
    try:
        explanation = await Explanation.get(id=explanation_id).prefetch_related("chapters")

        # Check for incomplete chapters and auto-rebuild
        incomplete_chapters = []
        for chapter in explanation.chapters:
            await chapter.fetch_related("contents")

            # Check if chapter is incomplete (error, pending, or completed but empty)
            if chapter.status in ["pending", "building", "error"] or (chapter.status == "completed" and len(chapter.contents) == 0):
                # Reset status if it's completed but empty
                if chapter.status == "completed" and len(chapter.contents) == 0:
                    chapter.status = "pending"
                    await chapter.save()

                incomplete_chapters.append({
                    "id": str(chapter.id),
                    "title": chapter.title,
                    "status": chapter.status
                })

        # Auto-rebuild incomplete chapters in background
        if incomplete_chapters:
            background_tasks.add_task(
                rebuild_chapters,
                concept=explanation.text,
                chapters=incomplete_chapters
            )

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


@router.get("/chapters/incomplete", response_model=IncompleteChaptersResponse)
async def get_incomplete_chapters():
    """
    Get all chapters that are incomplete (pending, building, error, or empty).
    Returns chapters that need to be rebuilt.
    """
    try:
        # Find chapters that are not completed or have no content
        incomplete_chapters = []

        # Get all chapters with status not "completed"
        chapters = await Chapter.filter(status__in=["pending", "building", "error"]).prefetch_related("parent", "contents")

        for chapter in chapters:
            incomplete_chapters.append({
                "chapter_id": str(chapter.id),
                "explanation_id": str(chapter.parent_id),
                "title": chapter.title,
                "status": chapter.status,
                "concept": chapter.parent.text if chapter.parent else "Unknown",
                "content_count": len(chapter.contents)
            })

        # Also check for "completed" chapters with no content (failed silently)
        completed_empty = await Chapter.filter(status="completed").prefetch_related("parent", "contents")
        for chapter in completed_empty:
            if len(chapter.contents) == 0:
                incomplete_chapters.append({
                    "chapter_id": str(chapter.id),
                    "explanation_id": str(chapter.parent_id),
                    "title": chapter.title,
                    "status": "completed_but_empty",
                    "concept": chapter.parent.text if chapter.parent else "Unknown",
                    "content_count": 0
                })

        return IncompleteChaptersResponse(
            total_incomplete=len(incomplete_chapters),
            chapters=incomplete_chapters
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch incomplete chapters: {str(e)}")


@router.post("/chapters/rebuild", response_model=RebuildResponse)
async def rebuild_incomplete_chapters(background_tasks: BackgroundTasks):
    """
    Find all incomplete chapters and rebuild them in the background.
    This is useful for recovering from failed chapter generation.
    """
    try:
        # Find all incomplete chapters
        incomplete_chapters = []

        # Get chapters that are not completed or have errors
        chapters = await Chapter.filter(status__in=["pending", "building", "error"]).prefetch_related("parent", "contents")

        for chapter in chapters:
            incomplete_chapters.append({
                "id": str(chapter.id),
                "title": chapter.title,
                "concept": chapter.parent.text if chapter.parent else "Unknown"
            })

        # Also find completed chapters with no content
        completed_empty = await Chapter.filter(status="completed").prefetch_related("parent", "contents")
        for chapter in completed_empty:
            if len(chapter.contents) == 0:
                # Reset status to pending so it can be rebuilt
                chapter.status = "pending"
                await chapter.save()

                incomplete_chapters.append({
                    "id": str(chapter.id),
                    "title": chapter.title,
                    "concept": chapter.parent.text if chapter.parent else "Unknown"
                })

        if not incomplete_chapters:
            return RebuildResponse(
                message="No incomplete chapters found",
                incomplete_chapters=0,
                chapters_to_rebuild=[]
            )

        # Group chapters by explanation for efficient rebuilding
        chapters_by_explanation = {}
        for chapter in incomplete_chapters:
            concept = chapter["concept"]
            if concept not in chapters_by_explanation:
                chapters_by_explanation[concept] = []
            chapters_by_explanation[concept].append(chapter)

        # Schedule rebuild tasks
        for concept, chapter_list in chapters_by_explanation.items():
            background_tasks.add_task(
                rebuild_chapters,
                concept=concept,
                chapters=chapter_list
            )

        return RebuildResponse(
            message=f"Rebuilding {len(incomplete_chapters)} incomplete chapter(s) in the background",
            incomplete_chapters=len(incomplete_chapters),
            chapters_to_rebuild=incomplete_chapters
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rebuild chapters: {str(e)}")


@router.post("/explanations/{explanation_id}/rebuild", response_model=RebuildResponse)
async def rebuild_explanation_chapters(explanation_id: str, background_tasks: BackgroundTasks):
    """
    Rebuild all incomplete chapters for a specific explanation.
    """
    try:
        explanation = await Explanation.get(id=explanation_id).prefetch_related("chapters")

        # Find incomplete chapters in this explanation
        incomplete_chapters = []

        for chapter in explanation.chapters:
            # Check if chapter is incomplete
            await chapter.fetch_related("contents")

            if chapter.status in ["pending", "building", "error"] or (chapter.status == "completed" and len(chapter.contents) == 0):
                # Reset status if it's completed but empty
                if chapter.status == "completed" and len(chapter.contents) == 0:
                    chapter.status = "pending"
                    await chapter.save()

                incomplete_chapters.append({
                    "id": str(chapter.id),
                    "title": chapter.title,
                    "status": chapter.status
                })

        if not incomplete_chapters:
            return RebuildResponse(
                message="No incomplete chapters found for this explanation",
                incomplete_chapters=0,
                chapters_to_rebuild=[]
            )

        # Schedule rebuild task
        background_tasks.add_task(
            rebuild_chapters,
            concept=explanation.text,
            chapters=incomplete_chapters
        )

        return RebuildResponse(
            message=f"Rebuilding {len(incomplete_chapters)} chapter(s) for '{explanation.text}'",
            incomplete_chapters=len(incomplete_chapters),
            chapters_to_rebuild=incomplete_chapters
        )

    except Exception as e:
        raise HTTPException(status_code=404, detail="Explanation not found")


async def rebuild_chapters(concept: str, chapters: List[dict]):
    """
    Background task: Rebuild content for specific chapters.
    Similar to build_all_chapters but for recovery.
    """
    for chapter_data in chapters:
        try:
            # Get the chapter
            chapter = await Chapter.get(id=chapter_data["id"])

            # Clear any existing content (in case of partial generation)
            await Content.filter(chapter_id=chapter.id).delete()

            # Update status to building
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

            # Update status to completed
            chapter.status = "completed"
            await chapter.save()

            print(f"Successfully rebuilt chapter: {chapter_data['title']}")

        except Exception as e:
            # Log error and mark as error
            print(f"Error rebuilding chapter {chapter_data['id']}: {e}")
            try:
                chapter = await Chapter.get(id=chapter_data["id"])
                chapter.status = "error"
                await chapter.save()
            except:
                pass
