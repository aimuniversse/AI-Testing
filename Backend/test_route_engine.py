import os
import sys
import django
import unittest
from unittest.mock import patch, MagicMock

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "analysis.settings")
django.setup()

from functions.route_engine import (
    load_cities_data, search_city, get_osrm_route, apply_verified_overrides
)
from functions.views import get_route_analysis_data


class TestRouteEngine(unittest.TestCase):

    def test_01_load_cache(self):
        """Test that cities data is loaded from the CSV and cached successfully."""
        exact_map, insensitive_map = load_cities_data()
        self.assertIsNotNone(exact_map)
        self.assertIsNotNone(insensitive_map)
        self.assertIn("Chennai", exact_map)
        self.assertIn("Coimbatore", exact_map)

    def test_02_search_city_exact(self):
        """Test exact match on city search."""
        res = search_city("Chennai")
        self.assertIsNotNone(res)
        self.assertEqual(res["city"], "Chennai")
        self.assertEqual(res["population"], 4681087)
        self.assertAlmostEqual(res["latitude"], 13.08784, places=4)
        self.assertAlmostEqual(res["longitude"], 80.27847, places=4)

    def test_03_search_city_case_insensitive(self):
        """Test case-insensitive fallback on city search."""
        res = search_city("chennai")
        self.assertIsNotNone(res)
        self.assertEqual(res["city"], "Chennai")

        res_coimbatore = search_city("COIMBATORE")
        self.assertIsNotNone(res_coimbatore)
        self.assertEqual(res_coimbatore["city"], "Coimbatore")

    def test_04_search_nonexistent_city(self):
        """Test search for nonexistent city returns None."""
        res = search_city("NonExistentCityNameXYZ")
        self.assertIsNone(res)

    def test_05_osrm_request_without_via(self):
        """Test OSRM request formatting and mock execution without via."""
        source = {"city": "Chennai", "latitude": 13.08784, "longitude": 80.27847, "population": 4646732}
        dest = {"city": "Coimbatore", "latitude": 11.0168, "longitude": 76.9558, "population": 959823}
        
        mock_response = {
            "routes": [
                {
                    "distance": 505230,
                    "duration": 28840,
                    "legs": [
                        {"distance": 505230, "duration": 28840}
                    ]
                }
            ]
        }
        
        with patch('requests.get') as mock_get:
            mock_res_obj = MagicMock()
            mock_res_obj.json.return_value = mock_response
            mock_res_obj.raise_for_status = MagicMock()
            mock_get.return_value = mock_res_obj
            
            res_data, err = get_osrm_route(source, dest)
            
            self.assertIsNone(err)
            self.assertEqual(res_data["total_distance"], 505.23)
            self.assertEqual(res_data["estimated_time"], 8.01)
            mock_get.assert_called_once()
            url_called = mock_get.call_args[0][0]
            self.assertIn("80.27847,13.08784", url_called)
            self.assertIn("76.9558,11.0168", url_called)

    def test_06_osrm_request_with_via(self):
        """Test OSRM request formatting and mock execution with via."""
        source = {"city": "Chennai", "latitude": 13.08784, "longitude": 80.27847, "population": 4646732}
        dest = {"city": "Coimbatore", "latitude": 11.0168, "longitude": 76.9558, "population": 959823}
        via = {"city": "Vellore", "latitude": 12.9184, "longitude": 79.13255, "population": 484690}
        
        mock_response = {
            "routes": [
                {
                    "distance": 525000,
                    "duration": 30000,
                    "legs": [
                        {"distance": 140000, "duration": 8000},
                        {"distance": 385000, "duration": 22000}
                    ]
                }
            ]
        }
        
        with patch('requests.get') as mock_get:
            mock_res_obj = MagicMock()
            mock_res_obj.json.return_value = mock_response
            mock_res_obj.raise_for_status = MagicMock()
            mock_get.return_value = mock_res_obj
            
            res_data, err = get_osrm_route(source, dest, via)
            
            self.assertIsNone(err)
            self.assertEqual(res_data["total_distance"], 525.0)
            self.assertEqual(res_data["estimated_time"], 8.33)
            self.assertEqual(len(res_data["legs"]), 2)
            mock_get.assert_called_once()
            url_called = mock_get.call_args[0][0]
            self.assertIn("80.27847,13.08784;79.13255,12.9184;76.9558,11.0168", url_called)

    def test_07_verified_overrides(self):
        """Test that Gemini estimates are perfectly overwritten with real data."""
        source = {"city": "Chennai", "latitude": 13.08784, "longitude": 80.27847, "population": 4646732}
        dest = {"city": "Coimbatore", "latitude": 11.0168, "longitude": 76.9558, "population": 959823}
        
        osrm_data = {
            "total_distance": 505.23,
            "estimated_time": 8.01,
            "legs": [{"distance_km": 505.23, "duration_hours": 8.01}]
        }
        
        ai_data = {
            "route_summary": {"path": "Hallucinated Chennai -> Coimbatore", "total_distance": 600, "estimated_time": 12.0},
            "population_data": {
                "source": {"name": "Chennai", "count": 2000000},
                "destination": {"name": "Coimbatore", "count": 500000}
            },
            "area_segmentation": {
                "job_business_areas": [{"name": "Chennai"}],
                "student_areas": [{"name": "Chennai University"}],
                "tourist_places": [{"name": "Marina Beach"}]
            },
            "visitor_data": {
                "source": {"yearly_total": 500000, "daily_normal": 1400, "daily_peak": 3500},
                "destination": {"yearly_total": 400000, "daily_normal": 1100, "daily_peak": 2800}
            },
            "demand_distribution": [
                {"state": "Tamil Nadu", "percentage": 100.0, "cities": [{"name": "Chennai", "percentage": 60.0, "visitor_count": 60000}]}
            ],
            "transport_distribution": {"bus": 40.0, "train": 30.0, "car": 20.0, "taxi": 10.0, "flight": 0.0},
            "logistics_services": {"bus": 30.0, "train": 40.0, "courier": 20.0, "taxi": 10.0},
            "transport_schedule": [{"from": "Chennai", "to": "Coimbatore", "type": "bus", "trips_per_day": 15}]
        }

        verified = apply_verified_overrides(ai_data, source, dest, via=None, osrm_data=osrm_data)

        # Verify backend route and population values are from CSV/OSRM only
        self.assertEqual(verified["route_summary"]["total_distance"], 505.23)
        self.assertEqual(verified["route_summary"]["estimated_time"], 8.01)
        self.assertEqual(verified["route_summary"]["path"], ["Chennai", "Coimbatore"])
        self.assertEqual(verified["population_data"]["source"]["population"], 4646732)
        self.assertEqual(verified["population_data"]["source"]["count"], 4646732)
        self.assertEqual(verified["population_data"]["destination"]["population"], 959823)
        self.assertEqual(verified["population_data"]["destination"]["count"], 959823)

        # Verify only allowed AI sections are retained
        self.assertEqual(verified["area_segmentation"]["tourist_places"][0]["name"], "Marina Beach")
        self.assertNotIn("route_summary", {k: v for k, v in ai_data.items() if k not in ["area_segmentation", "visitor_data", "demand_distribution", "transport_distribution", "logistics_services", "transport_schedule"]})

        data, err = get_route_analysis_data("Chennai", "NonExistentDest", "")
        self.assertIsNone(data)
        self.assertEqual(err, "Destination city not found in indian_cities.csv")


if __name__ == "__main__":
    unittest.main()
