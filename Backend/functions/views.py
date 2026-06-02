from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q
from collections import deque
import json
import re

from .models import (
    ParcelService, SuggestedRoute, RouteAnalysisCache, PopularSearch
)
from .ai_fallback import generate_route_analysis
from .route_engine import search_city, get_osrm_route, apply_verified_overrides
from django.utils import timezone
from datetime import timedelta

def extract_number(text, default=10):
    """Extracts a single number from a string (e.g., '20-50' -> 35, '20' -> 20)."""
    if not text:
        return default
    if isinstance(text, (int, float)):
        return int(text)
    
    # Find all numbers in the string
    nums = [int(n) for n in re.findall(r'\d+', str(text))]
    if len(nums) == 1:
        return nums[0]
    elif len(nums) >= 2:
        return sum(nums) // len(nums)  # Average of range
    return default

# Relational DB fetcher removed to prioritize real-time AI generation.


def get_route_analysis_data(source_name, dest_name, via_name):
    """
    Validates source, destination, and via cities against indian_cities.csv,
    queries real-time routing from OSRM, calls Gemini API for analysis report,
    and returns verified geodata and routing metrics.
    """
    if not source_name or not dest_name:
        return None, "Source and destination cities are required."

    # STEP 1 & 2: Load cities from CSV
    source_city = search_city(source_name)
    if not source_city:
        return None, "Source city not found in indian_cities.csv"

    destination_city = search_city(dest_name)
    if not destination_city:
        return None, "Destination city not found in indian_cities.csv"

    via_city = None
    if via_name:
        via_city = search_city(via_name)
        if not via_city:
            return None, "Via city not found in indian_cities.csv"

    # STEP 3 & 4: Fetch OSRM routing metrics
    osrm_data, osrm_err = get_osrm_route(source_city, destination_city, via_city)
    if osrm_err:
        return None, osrm_err

    # Directly call the AI generation function
    ai_data, ai_error = generate_route_analysis(source_name, dest_name, via_name)
    
    if ai_data and not ai_error:
        # STEP 5 & 6 & 7: Replace Gemini estimates with verified data
        verified_data = apply_verified_overrides(
            ai_data=ai_data,
            source=source_city,
            destination=destination_city,
            via=via_city,
            osrm_data=osrm_data
        )

        return {
            "status": "success",
            "data_source": "google_gemini_api",
            "data": verified_data
        }, None

    # Error: API failed or returned invalid data
    return None, ai_error or "Unable to fetch route analysis"



def index(request):
    source_name = request.GET.get("source", "").strip()
    dest_name = request.GET.get("destination", "").strip()
    via_name = request.GET.get("via", "").strip()

    context = {
        "source_input": source_name,
        "dest_input": dest_name,
        "via_input": via_name
    }

    if source_name and dest_name:
        try:
            data, error = get_route_analysis_data(source_name, dest_name, via_name)
            if error:
                context["error"] = error
            else:
                # Unpack the 'data' part for template rendering compatibility
                context.update(data["data"])
                context["data_source"] = data["data_source"]
                context["has_data"] = True
                context["raw_json"] = json.dumps(data, indent=2)
        except Exception as e:
            import traceback
            traceback.print_exc()
            context["error"] = "An internal server error occurred while analyzing the route."

    return render(request, 'index.html', context)


@api_view(['POST', 'GET'])
@permission_classes([permissions.AllowAny])
def analyze_route_api(request):
    """
    Django REST Framework API endpoint for React frontend.
    POST /api/route-analysis/
    """
    if request.method == "POST":
        # DRF's request.data handles both JSON and Form data automatically
        source_name = request.data.get("source", "").strip()
        dest_name = request.data.get("destination", "").strip()
        via_name = request.data.get("via", "").strip()
    else:
        # Handle GET for testing in browser
        source_name = request.query_params.get("source", "").strip()
        dest_name = request.query_params.get("destination", "").strip()
        via_name = request.query_params.get("via", "").strip()

    print(f"DEBUG: analyze_route_api called with source={source_name}, dest={dest_name}, via={via_name}")
    # Record the search
    if source_name and dest_name:
        route_text = f"{source_name} → {dest_name}"
        try:
            popular, created = PopularSearch.objects.get_or_create(route_text=route_text)
            if not created:
                popular.search_count += 1
                popular.save()
        except Exception as e:
            print(f"DEBUG: PopularSearch error: {str(e)}")

    # Validation
    if not source_name or not dest_name:
        return Response({
            "status": "error",
            "message": "Source and destination are required"
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        response_data, error = get_route_analysis_data(source_name, dest_name, via_name)
        if error:
            # Check for CSV validation errors and return standard HTTP 400 Bad Request
            if "not found in indian_cities.csv" in error:
                return Response({
                    "error": error
                }, status=status.HTTP_400_BAD_REQUEST)

            with open('django_error.log', 'a', encoding='utf-8') as f:
                f.write(f"\n--- API ERROR AT {timezone.now()} ---\n")
                f.write(f"Source: {source_name}, Dest: {dest_name}, Via: {via_name}\n")
                f.write(f"Error: {error}\n")
                f.write("------------------------------\n")
            return Response({
                "status": "error",
                "message": error
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        print(f"DEBUG: Success! Returning AI data.")
        return Response(response_data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        err_detail = traceback.format_exc()
        with open('django_error.log', 'a', encoding='utf-8') as f:
            f.write(f"\n--- UNHANDLED EXCEPTION AT {timezone.now()} ---\n")
            f.write(err_detail)
            f.write("------------------------------\n")
        return Response({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_popular_searches(request):
    """
    Returns the top 5 most searched routes.
    """
    popular = PopularSearch.objects.all()[:5]
    data = [p.route_text for p in popular]
    
    # Fallback if no searches recorded yet
    if not data:
        data = [
            "Bangalore → Chennai",
            "Hyderabad → Vijayawada",
            "Pune → Mumbai",
            "Delhi → Manali",
            "Ahmedabad → Surat"
        ]
        
    return Response({
        "status": "success",
        "popular_searches": data
    })
