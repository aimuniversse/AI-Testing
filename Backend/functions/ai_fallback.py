import os
import json
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

try:
    from google import genai
    genai_available = True
except ImportError:
    genai_available = False


def _build_verified_context(source, destination, via,
                            source_city, dest_city, via_city, osrm_data):
    """Build the verified data JSON string to inject into the AI prompt."""
    path_parts = [source]
    if via:
        path_parts.append(via)
    path_parts.append(destination)

    distance_km = osrm_data['total_distance'] if osrm_data else 0
    duration_hours = osrm_data['estimated_time'] if osrm_data else 0

    context = {
        "route_summary": {
            "path": path_parts,
            "total_distance": distance_km,
            "estimated_time": duration_hours
        },
        "population_data": {
            "source": {
                "name": source,
                "population": source_city['population'] if source_city else 0,
                "latitude": source_city['latitude'] if source_city else 0,
                "longitude": source_city['longitude'] if source_city else 0
            },
            "destination": {
                "name": destination,
                "population": dest_city['population'] if dest_city else 0,
                "latitude": dest_city['latitude'] if dest_city else 0,
                "longitude": dest_city['longitude'] if dest_city else 0
            }
        }
    }

    if via and via_city:
        context["population_data"]["via"] = {
            "name": via,
            "population": via_city['population'],
            "latitude": via_city['latitude'],
            "longitude": via_city['longitude']
        }

    return json.dumps(context, indent=2)


def _build_prompt(verified_context):
    """Build the Gemini prompt with pre-verified data context."""
    return (
        "You are a Senior Route Analysis Data Engine.\n\n"
        "IMPORTANT:\n\n"
        "The backend has already calculated and verified:\n\n"
        "1. Route distance\n"
        "2. Route duration\n"
        "3. Population\n"
        "4. Latitude\n"
        "5. Longitude\n\n"
        "These values come from:\n\n"
        "- indian_cities.csv\n"
        "- OSRM Routing API\n\n"
        "You MUST use these values exactly as provided.\n\n"
        "NEVER:\n\n"
        "- generate population\n"
        "- generate latitude\n"
        "- generate longitude\n"
        "- generate distance\n"
        "- generate duration\n"
        "- modify any provided values\n\n"
        "INPUT:\n\n"
        + verified_context + "\n\n"
        "Generate ONLY the following sections:\n\n"
        "1. area_segmentation\n"
        "2. visitor_data\n"
        "3. demand_distribution\n"
        "4. transport_distribution\n"
        "5. logistics_services\n"
        "6. transport_schedule\n\n"
        "Requirements:\n\n"
        "- Use realistic Indian geography.\n"
        "- Use realistic tourism patterns.\n"
        "- Use realistic education hubs.\n"
        "- Use realistic business hubs.\n"
        "- Use realistic transport demand.\n"
        "- All percentages must total 100 where applicable.\n"
        "- Transport distribution must total 100.\n"
        "- Logistics distribution must total 100.\n"
        "- Do not create impossible routes.\n"
        "- Do not modify any backend values.\n\n"
        "Return ONLY valid JSON. No markdown. No explanations. No extra sections.\n\n"
        "Output Format:\n\n"
        "{\n"
        '  "area_segmentation": {\n'
        '    "job_business_areas": [{"name": "string"}],\n'
        '    "student_areas": [{"name": "string"}],\n'
        '    "tourist_places": [{"name": "string"}]\n'
        "  },\n"
        '  "visitor_data": {\n'
        '    "source": {"yearly_total": int, "daily_normal": int, "daily_peak": int},\n'
        '    "destination": {"yearly_total": int, "daily_normal": int, "daily_peak": int}\n'
        "  },\n"
        '  "demand_distribution": [\n'
        '    {"state": "string", "percentage": float, "cities": [{"name": "string", "percentage": float, "visitor_count": int}]}\n'
        "  ],\n"
        '  "transport_distribution": {"bus": float, "train": float, "car": float, "taxi": float, "flight": float},\n'
        '  "logistics_services": {"bus": float, "train": float, "courier": float, "taxi": float},\n'
        '  "transport_schedule": [{"from": "string", "to": "string", "type": "string", "trips_per_day": int}]\n'
        "}\n"
    )


def generate_route_analysis(source, destination, via=None,
                            source_city=None, dest_city=None,
                            via_city=None, osrm_data=None):
    """
    Calls the Gemini API to generate ONLY analytical sections.
    Pre-verified data (population, coordinates, distance, time) is passed
    as read-only context — the AI never regenerates those values.

    Returns: (data_dict, error_string) tuple
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_api_key")

    if not genai_available or not api_key:
        logger.warning("Gemini API unavailable. Using mock fallback data.")
        return _generate_mock_data(source, destination, via), None

    # Build prompt with verified data context
    verified_context = _build_verified_context(
        source, destination, via,
        source_city, dest_city, via_city, osrm_data
    )
    prompt = _build_prompt(verified_context)

    client = genai.Client(api_key=api_key)
    content = ""
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )

        # Extract text content from various response formats
        if isinstance(response, dict):
            content = (response.get("content")
                       or response.get("output_text")
                       or response.get("text"))
        else:
            content = (getattr(response, "content", None)
                       or getattr(response, "output_text", None)
                       or getattr(response, "text", None))
            if not content and hasattr(response, "to_dict"):
                rd = response.to_dict()
                content = (rd.get("content")
                           or rd.get("output_text")
                           or rd.get("text"))

        if not content:
            return None, "Gemini API returned an unexpected response format."

        content = content.strip()

        # Extract JSON from response
        parsed = _extract_json(content)
        if parsed is not None:
            return parsed, None

        _log_error("JSON PARSE FAILURE", "Unable to parse JSON from Gemini response.", content)
        logger.warning("Gemini returned invalid JSON; falling back to mock route analysis.")
        return _generate_mock_data(source, destination, via), None

    except json.JSONDecodeError as e:
        _log_error("JSON DECODE ERROR", str(e), content)
        return None, "Unable to fetch route analysis at the moment (invalid response format)"
    except Exception as e:
        import traceback
        logger.error(f"Gemini API error: {str(e)}")
        traceback.print_exc()
        return None, "Unable to fetch route analysis at the moment"


def _extract_json(content):
    """Try multiple strategies to extract valid JSON from AI response."""
    # Strategy 1: Find outermost JSON object boundaries
    start = content.find('{')
    end = content.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(content[start:end + 1])
        except json.JSONDecodeError:
            pass

    # Strategy 2: Strip markdown code fences
    stripped = content
    if stripped.startswith("```json"):
        stripped = stripped[7:]
    elif stripped.startswith("```"):
        stripped = stripped[3:]
    if stripped.endswith("```"):
        stripped = stripped[:-3]

    try:
        return json.loads(stripped.strip())
    except json.JSONDecodeError:
        pass

    return None


def _log_error(label, error_msg, raw_content=""):
    """Append error details to the error log file."""
    try:
        with open('django_error.log', 'a', encoding='utf-8') as f:
            f.write(f"\n--- {label} AT {timezone.now()} ---\n")
            f.write(f"Error: {error_msg}\n")
            if raw_content:
                f.write(f"Raw Content: {raw_content[:2000]}\n")
            f.write("------------------------------\n")
    except Exception:
        pass


def _generate_mock_data(source, destination, via):
    """Generate schema-compliant mock fallback when Gemini is unavailable."""
    mock = {
        "area_segmentation": {
            "job_business_areas": [
                {"name": f"{source} Commercial Hub"},
                {"name": f"{destination} Business District"}
            ],
            "student_areas": [
                {"name": f"{source} University Area"},
                {"name": f"{destination} College Zone"}
            ],
            "tourist_places": [
                {"name": f"{source} Heritage Site"},
                {"name": f"{destination} Tourist Attraction"}
            ]
        },
        "visitor_data": {
            "source": {
                "yearly_total": 500000,
                "daily_normal": 1400,
                "daily_peak": 3500
            },
            "destination": {
                "yearly_total": 400000,
                "daily_normal": 1100,
                "daily_peak": 2800
            }
        },
        "demand_distribution": [
            {
                "state": "Local State",
                "percentage": 60.0,
                "cities": [
                    {"name": source, "percentage": 35.0, "visitor_count": 50000},
                    {"name": destination, "percentage": 25.0, "visitor_count": 35000}
                ]
            },
            {
                "state": "Neighboring State",
                "percentage": 40.0,
                "cities": [
                    {"name": "Nearby City", "percentage": 40.0, "visitor_count": 20000}
                ]
            }
        ],
        "transport_distribution": {
            "bus": 35.0,
            "train": 25.0,
            "car": 20.0,
            "taxi": 10.0,
            "flight": 10.0
        },
        "logistics_services": {
            "bus": 30.0,
            "train": 40.0,
            "courier": 20.0,
            "taxi": 10.0
        },
        "transport_schedule": [
            {"from": source, "to": destination, "type": "bus", "trips_per_day": 15},
            {"from": source, "to": destination, "type": "train", "trips_per_day": 6}
        ]
    }
    return mock
