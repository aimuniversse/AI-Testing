import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'analysis.settings')
django.setup()

from functions.ai_fallback import generate_route_analysis

# Mock data for testing
source = "Chennai"
destination = "Coimbatore"
source_city = {'name': 'Chennai', 'population': 4646732, 'latitude': 13.0827, 'longitude': 80.2707}
dest_city = {'name': 'Coimbatore', 'population': 1050721, 'latitude': 11.0168, 'longitude': 76.9558}
osrm_data = {'total_distance': 500, 'estimated_time': 8.5}

print("Starting multi-model Gemini API test...")
models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]

for model_name in models:
    print(f"\n--- Testing model: {model_name} ---")
    try:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_api_key")
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents="Say hi"
        )
        print(f"SUCCESS with {model_name}!")
        print(f"Response: {response.text}")
        break
    except Exception as e:
        print(f"FAILED with {model_name}: {str(e)}")
else:
    print("\nALL MODELS FAILED. There might be an issue with the API Key or the Library.")
