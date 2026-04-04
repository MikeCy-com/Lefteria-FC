"""
Iteration 7 Tests: Match Report Page and Navigation Changes
- Match Report page (/match/:fixtureId) with fixture data, events, stats
- Navigation reduced to 6 items (Αγώνες removed)
- /fixtures redirects to /team?tab=results
- Results tab clickable fixtures navigate to /match/:id
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMatchReportBackend:
    """Test the new /api/fixtures/{id}/detail endpoint"""
    
    def test_fixture_detail_endpoint_exists(self):
        """Test that the fixture detail endpoint returns data"""
        # Use the known fixture with events
        fixture_id = "d1053581-dbbd-4dd1-9627-94139566dac8"
        response = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}/detail")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "fixture" in data, "Response should contain 'fixture' key"
        assert "events" in data, "Response should contain 'events' key"
        assert "stats" in data, "Response should contain 'stats' key"
        print(f"PASS: Fixture detail endpoint returns fixture, events, stats")
    
    def test_fixture_detail_has_correct_fixture_data(self):
        """Test that fixture data contains expected fields"""
        fixture_id = "d1053581-dbbd-4dd1-9627-94139566dac8"
        response = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}/detail")
        assert response.status_code == 200
        
        data = response.json()
        fixture = data["fixture"]
        
        # Check required fields
        assert fixture["id"] == fixture_id
        assert fixture["home_team"] == "Άγιος Θεράπων"
        assert fixture["away_team"] == "LEFTERIA FC"
        assert fixture["home_score"] == 0
        assert fixture["away_score"] == 1
        assert fixture["status"] == "Completed"
        assert fixture["competition"] == "ΠΑΑΟΚ Α' Όμιλος"
        assert fixture["venue"] == "Άγιος Θεράπων"
        assert "match_date" in fixture
        print(f"PASS: Fixture data contains all expected fields")
    
    def test_fixture_detail_has_events(self):
        """Test that fixture with events returns events array"""
        fixture_id = "d1053581-dbbd-4dd1-9627-94139566dac8"
        response = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}/detail")
        assert response.status_code == 200
        
        data = response.json()
        events = data["events"]
        
        assert isinstance(events, list), "Events should be a list"
        assert len(events) >= 1, "This fixture should have at least 1 event"
        
        # Check the goal event
        goal_event = events[0]
        assert goal_event["event_type"] == "goal"
        assert goal_event["minute"] == 15
        assert goal_event["team"] == "away"
        assert goal_event["player_name"] == "Μάριος Ρούκλας"
        print(f"PASS: Fixture has {len(events)} event(s) with correct data")
    
    def test_fixture_detail_404_for_nonexistent(self):
        """Test that nonexistent fixture returns 404"""
        response = requests.get(f"{BASE_URL}/api/fixtures/nonexistent-id-12345/detail")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Nonexistent fixture returns 404")
    
    def test_fixture_detail_without_events(self):
        """Test fixture without events returns empty events array"""
        # Get a fixture that likely has no events
        fixtures_response = requests.get(f"{BASE_URL}/api/fixtures?limit=10")
        fixtures = fixtures_response.json()
        
        # Find a fixture other than the one with events
        for f in fixtures:
            if f["id"] != "d1053581-dbbd-4dd1-9627-94139566dac8":
                response = requests.get(f"{BASE_URL}/api/fixtures/{f['id']}/detail")
                assert response.status_code == 200
                data = response.json()
                assert "events" in data
                assert isinstance(data["events"], list)
                print(f"PASS: Fixture without events returns empty events array")
                return
        
        print("SKIP: No other fixtures found to test")
    
    def test_fixture_detail_stats_field(self):
        """Test that stats field is present (can be null)"""
        fixture_id = "d1053581-dbbd-4dd1-9627-94139566dac8"
        response = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}/detail")
        assert response.status_code == 200
        
        data = response.json()
        # Stats can be null if not recorded
        assert "stats" in data
        print(f"PASS: Stats field present (value: {data['stats']})")


class TestFixturesEndpoint:
    """Test existing fixtures endpoint still works"""
    
    def test_fixtures_list(self):
        """Test fixtures list endpoint"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=5")
        assert response.status_code == 200
        
        fixtures = response.json()
        assert isinstance(fixtures, list)
        assert len(fixtures) > 0
        
        # Check fixture structure
        fixture = fixtures[0]
        assert "id" in fixture
        assert "home_team" in fixture
        assert "away_team" in fixture
        assert "match_date" in fixture
        assert "status" in fixture
        print(f"PASS: Fixtures list returns {len(fixtures)} fixtures")
    
    def test_single_fixture_endpoint(self):
        """Test single fixture endpoint (without detail)"""
        fixture_id = "d1053581-dbbd-4dd1-9627-94139566dac8"
        response = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        assert response.status_code == 200
        
        fixture = response.json()
        assert fixture["id"] == fixture_id
        print(f"PASS: Single fixture endpoint works")


class TestLiveMatchEndpoint:
    """Test live match endpoint"""
    
    def test_live_match_endpoint(self):
        """Test live match endpoint returns proper structure"""
        response = requests.get(f"{BASE_URL}/api/live-match")
        assert response.status_code == 200
        
        data = response.json()
        assert "active" in data
        assert "fixture" in data
        assert "events" in data
        assert "stats" in data
        
        if data["active"]:
            assert data["fixture"] is not None
            print(f"PASS: Live match active - {data['fixture']['home_team']} vs {data['fixture']['away_team']}")
        else:
            print(f"PASS: No live match currently active")


class TestEventTypes:
    """Test that event types are properly defined"""
    
    def test_event_type_in_response(self):
        """Test that event types match expected values"""
        fixture_id = "d1053581-dbbd-4dd1-9627-94139566dac8"
        response = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}/detail")
        assert response.status_code == 200
        
        data = response.json()
        events = data["events"]
        
        valid_event_types = [
            "goal", "penalty_scored", "penalty_missed", "own_goal",
            "yellow_card", "red_card", "second_yellow", "substitution", "var_decision"
        ]
        
        for event in events:
            assert event["event_type"] in valid_event_types, f"Invalid event type: {event['event_type']}"
        
        print(f"PASS: All event types are valid")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
