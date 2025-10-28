import os
import json
from typing import Dict, List
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Model configuration
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

# Initialize Gemini client (automatically reads GEMINI_API_KEY from environment)
client = genai.Client()

# Configure Google Search grounding tool for real-time information
google_search_tool = types.Tool(google_search=types.GoogleSearch())


class PlannerService:
    """
    Planner AI: Generates title, overview, and chapter titles for a concept.
    Uses Google Search grounding for up-to-date information.
    Returns immediately to provide fast user feedback.
    """

    async def plan_explanation(self, concept: str) -> Dict[str, any]:
        """
        Generate the structure of an explanation for a programming concept.

        Args:
            concept: The programming concept to explain (e.g., "Go routines")

        Returns:
            Dict with 'title', 'overview', and 'chapters' (list of chapter titles)
        """
        prompt = f"""You are an expert programming educator. A user wants to understand the concept: "{concept}"

Your task is to create a structured learning plan with current, accurate information. Generate:

1. A clear, concise title for this concept
2. A brief overview (2-3 sentences) explaining what this concept is and why it matters
3. Exactly 5 chapter titles that follow this structure:
   - Chapter 1: What - Define the concept and its fundamentals
   - Chapter 2: Why - High-level analogy and the problem it solves
   - Chapter 3: How - Core syntax and mechanics
   - Chapter 4: Where - Real-world use cases and applications
   - Chapter 5: Pitfalls - Common mistakes and best practices

Return your response as valid JSON in this exact format:
{{
  "title": "The concept title",
  "overview": "A brief overview of the concept",
  "chapters": [
    "What: [chapter title]",
    "Why: [chapter title]",
    "How: [chapter title]",
    "Where: [chapter title]",
    "Pitfalls: [chapter title]"
  ]
}}

Only return the JSON, no additional text."""

        try:
            # Configure with Google Search grounding for current information
            config = types.GenerateContentConfig(
                tools=[google_search_tool],
                temperature=0.7,
            )

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=config,
            )

            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())

            # Validate structure
            if not all(key in result for key in ["title", "overview", "chapters"]):
                raise ValueError("Invalid response structure from AI")

            if len(result["chapters"]) != 5:
                raise ValueError("Expected exactly 5 chapters")

            return result

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise RuntimeError(f"Error generating plan: {e}")


class BuilderService:
    """
    Builder AI: Generates detailed content for each chapter.
    Uses Google Search grounding for accurate, up-to-date information.
    Runs asynchronously in the background.
    """

    async def build_chapter_content(self, concept: str, chapter_title: str) -> List[Dict[str, str]]:
        """
        Generate detailed content for a specific chapter.

        Args:
            concept: The main programming concept
            chapter_title: The title of the chapter to build

        Returns:
            List of content items with 'content_type' and 'value'
        """
        prompt = f"""You are creating educational content for the concept: "{concept}"

Generate detailed, comprehensive, and current content for this chapter: "{chapter_title}"

Your content should:
- Be clear and educational with accurate, up-to-date information
- Include practical examples when relevant
- Use code blocks for code examples
- Break down complex ideas into digestible parts
- Reference current best practices and conventions

Return your response as valid JSON array with content items in this format:
[
  {{
    "content_type": "text",
    "value": "Explanatory text here..."
  }},
  {{
    "content_type": "code",
    "value": "// Code example here\\nfunction example() {{\\n  return true;\\n}}"
  }},
  {{
    "content_type": "text",
    "value": "More explanation..."
  }}
]

Content types can be: "text", "code", or "heading"
Use "heading" for section headings within the chapter.
Use "code" for code examples (include language comments or syntax).
Use "text" for explanatory paragraphs.

Only return the JSON array, no additional text."""

        try:
            # Configure with Google Search grounding for current, accurate information
            config = types.GenerateContentConfig(
                tools=[google_search_tool],
                temperature=0.7,
            )

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=config,
            )

            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())

            # Validate structure
            if not isinstance(result, list):
                raise ValueError("Expected JSON array of content items")

            for item in result:
                if "content_type" not in item or "value" not in item:
                    raise ValueError("Each content item must have 'content_type' and 'value'")

            return result

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise RuntimeError(f"Error building chapter content: {e}")


# Singleton instances
planner_service = PlannerService()
builder_service = BuilderService()
