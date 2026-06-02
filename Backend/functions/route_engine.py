import os
import csv
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# In-memory singletons for O(1) lookup
_exact_cities_cache = None
_insensitive_cities_cache = None

def _resolve_csv_path():
    """
    Search for indian_cities.csv or india_cities.csv in multiple locations
    to guarantee it is always found regardless of the current working directory.
    """
    search_paths = [
        # 1. Base directory configured in Django
        getattr(settings, 'BASE_DIR', ''),
        # 2. Parent of Base Directory
        os.path.abspath(os.path.join(getattr(settings, 'BASE_DIR', ''), '..')),
        # 3. Absolute standard workspace path
        'd:\\Desktop\\Route-Analysis',
        'd:\\Desktop\\Route-Analysis\\Backend',
        # 4. Relative to this module
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..')),
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')),
    ]

    filenames = ['indian_cities.csv', 'india_cities.csv']
    
    for base in search_paths:
        if not base:
            continue
        for filename in filenames:
            full_path = os.path.join(base, filename)
            if os.path.exists(full_path):
                logger.info(f"Resolved cities database at: {full_path}")
                return full_path
                
    # Fallback to current directory lookups
    for filename in filenames:
        if os.path.exists(filename):
            return os.path.abspath(filename)
            
    raise FileNotFoundError("Could not locate indian_cities.csv or india_cities.csv in any search paths.")


def load_cities_data():
    """
    Loads and caches the cities data from the CSV file.
    Duplicate city names are resolved by keeping the record with the largest population.
    """
    global _exact_cities_cache, _insensitive_cities_cache
    if _exact_cities_cache is not None:
        return _exact_cities_cache, _insensitive_cities_cache

    csv_path = _resolve_csv_path()
    
    exact_map = {}
    insensitive_map = {}

    with open(csv_path, mode='r', encoding='utf-8') as f:
        # Support flexible column mapping
        reader = csv.DictReader(f)
        for row in reader:
            city_name = row.get('city', '').strip()
            if not city_name:
                continue

            try:
                lat = float(row.get('latitude', 0.0))
                lon = float(row.get('longitude', 0.0))
                pop = int(float(row.get('population', 0) or 0))
            except (ValueError, TypeError):
                continue

            city_data = {
                "city": city_name,
                "latitude": lat,
                "longitude": lon,
                "population": pop
            }

            # If city exists, keep the one with higher population to resolve duplicates
            if city_name not in exact_map or pop > exact_map[city_name]["population"]:
                exact_map[city_name] = city_data

            lower_name = city_name.lower()
            if lower_name not in insensitive_map or pop > insensitive_map[lower_name]["population"]:
                insensitive_map[lower_name] = city_data

    _exact_cities_cache = exact_map
    _insensitive_cities_cache = insensitive_map
    logger.info(f"Loaded {len(exact_map)} cities into memory cache.")
    return _exact_cities_cache, _insensitive_cities_cache


def search_city(query):
    """
    Performs city search:
    1. Exact case-sensitive match
    2. Case-insensitive fallback
    """
    if not query:
        return None
    
    query = str(query).strip()
    exact_map, insensitive_map = load_cities_data()

    # 1. Exact match
    if query in exact_map:
        return exact_map[query]

    # 2. Case-insensitive fallback
    lower_query = query.lower()
    if lower_query in insensitive_map:
        return insensitive_map[lower_query]

    return None


def get_osrm_route(source_city, destination_city, via_city=None):
    """
    Constructs and executes the OSRM routing request.
    Extracts total distance (km), estimated time (hours) rounded to 2 decimal places,
    and returns leg details for segment distance overrides.
    """
    source_lon, source_lat = source_city['longitude'], source_city['latitude']
    dest_lon, dest_lat = destination_city['longitude'], destination_city['latitude']

    if via_city:
        via_lon, via_lat = via_city['longitude'], via_city['latitude']
        url = f"https://router.project-osrm.org/route/v1/driving/{source_lon},{source_lat};{via_lon},{via_lat};{dest_lon},{dest_lat}?overview=false"
    else:
        url = f"https://router.project-osrm.org/route/v1/driving/{source_lon},{source_lat};{dest_lon},{dest_lat}?overview=false"

    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        res_json = response.json()
    except Exception as e:
        logger.error(f"OSRM request failed: {str(e)}")
        return None, f"OSRM request failed: {str(e)}"

    routes = res_json.get('routes', [])
    if not routes:
        return None, "No routing options returned by OSRM."

    route = routes[0]
    distance = route.get('distance', 0)
    duration = route.get('duration', 0)

    # Convert: distance_km = distance / 1000, duration_hours = duration / 3600
    distance_km = round(distance / 1000.0, 2)
    duration_hours = round(duration / 3600.0, 2)

    legs_data = []
    legs = route.get('legs', [])
    for leg in legs:
        legs_data.append({
            'distance_km': round(leg.get('distance', 0) / 1000.0, 2),
            'duration_hours': round(leg.get('duration', 0) / 3600.0, 2)
        })

    return {
        'total_distance': distance_km,
        'estimated_time': duration_hours,
        'legs': legs_data
    }, None


ALLOWED_AI_ANALYTICS = {
    "area_segmentation",
    "visitor_data",
    "demand_distribution",
    "transport_distribution",
    "logistics_services",
    "transport_schedule"
}


def build_verified_payload(source, destination, via=None, osrm_data=None):
    """
    Build the verified backend data payload using CSV and OSRM only.
    """
    distance_km = osrm_data['total_distance'] if osrm_data else 0.0
    duration_hours = osrm_data['estimated_time'] if osrm_data else 0.0

    path_array = [source['city']]
    if via:
        path_array.append(via['city'])
    path_array.append(destination['city'])

    route_summary = {
        "path": path_array,
        "total_distance": distance_km,
        "estimated_time": duration_hours,
        # Keep compatibility fields for frontend consumers
        "total_distance_km": distance_km,
        "estimated_time_hours": duration_hours
    }

    source_pop_info = {
        "name": source['city'],
        "population": source['population'],
        "count": source['population'],
        "latitude": source['latitude'],
        "longitude": source['longitude']
    }
    dest_pop_info = {
        "name": destination['city'],
        "population": destination['population'],
        "count": destination['population'],
        "latitude": destination['latitude'],
        "longitude": destination['longitude']
    }

    population_data = {
        "source": source_pop_info,
        "destination": dest_pop_info
    }

    if via:
        population_data['via'] = {
            "name": via['city'],
            "population": via['population'],
            "count": via['population'],
            "latitude": via['latitude'],
            "longitude": via['longitude']
        }

    if via and osrm_data and len(osrm_data.get('legs', [])) >= 2:
        legs = osrm_data['legs']
        distance_details = [
            {
                "segment": f"{source['city']} to {via['city']}",
                "from": source['city'],
                "to": via['city'],
                "distance_km": legs[0]['distance_km']
            },
            {
                "segment": f"{via['city']} to {destination['city']}",
                "from": via['city'],
                "to": destination['city'],
                "distance_km": legs[1]['distance_km']
            }
        ]
    else:
        distance_details = [
            {
                "segment": f"{source['city']} to {destination['city']}",
                "from": source['city'],
                "to": destination['city'],
                "distance_km": distance_km
            }
        ]

    return {
        "route_summary": route_summary,
        "population_data": population_data,
        "distance_details": distance_details
    }


def apply_verified_overrides(ai_data, source, destination, via=None, osrm_data=None):
    """
    Merge verified backend data with AI-generated analytics only.
    Gemini output is restricted to analytical sections and cannot overwrite
    backend-provided route, population, or distance values.
    """
    backend_payload = build_verified_payload(source, destination, via=via, osrm_data=osrm_data)

    if not ai_data or not isinstance(ai_data, dict):
        return backend_payload

    sanitized_ai = {
        key: value
        for key, value in ai_data.items()
        if key in ALLOWED_AI_ANALYTICS
    }

    return {**backend_payload, **sanitized_ai}
