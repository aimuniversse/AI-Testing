# API Test Results

## Endpoints Tested
1. **Route Analysis**: `GET /api/route-analysis/?source=Chennai&destination=Coimbatore`
   - **Status**: SUCCESS
   - **Performance**: ~20 seconds (includes Gemini AI generation)
2. **Popular Searches**: `GET /api/popular-searches/`
   - **Status**: SUCCESS
3. **Search Data (City List)**: `GET /api/search-data/`
   - **Status**: SUCCESS

## Sample Route Analysis Data (Retrieved)
```json
{
  "status": "success",
  "data_source": "google_gemini_api",
  "data": {
    "route_summary": {
      "path": ["Chennai", "Coimbatore"],
      "total_distance": 518.96,
      "estimated_time": 6.66
    },
    "population_data": {
      "source": { "name": "Chennai", "population": 4681087 },
      "destination": { "name": "Coimbatore", "population": 2136916 }
    },
    "area_segmentation": {
      "job_business_areas": ["Old Mahabalipuram Road (OMR) IT Corridor", "Tidel Park"],
      "student_areas": ["Anna University", "PSG College of Technology"],
      "tourist_places": ["Marina Beach", "Isha Yoga Center"]
    }
  }
}
```

## How to test manually
Run the following command in your terminal:
```bash
curl "http://127.0.0.1:8000/api/route-analysis/?source=Chennai&destination=Coimbatore"
```
