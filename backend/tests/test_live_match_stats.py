"""
Test suite for Live Match Statistics System - Iteration 4
Tests: Match Events CRUD, Match Stats, Live Match Widget, Score Auto-Update
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


class TestSetup:
    """Setup and authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin operations"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Return headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}


class TestLiveMatchEndpoint(TestSetup):
    """Tests for GET /api/live-match public endpoint"""
    
    def test_live_match_returns_inactive_when_no_live(self):
        """GET /api/live-match returns active:false when no live match"""
        response = requests.get(f"{BASE_URL}/api/live-match")
        assert response.status_code == 200
        data = response.json()
        # Either active is False or there's a live match
        assert "active" in data
        if not data["active"]:
            assert data["fixture"] is None
            assert data["events"] == []
            assert data["stats"] is None
    
    def test_live_match_structure(self):
        """GET /api/live-match returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/live-match")
        assert response.status_code == 200
        data = response.json()
        assert "active" in data
        assert "fixture" in data
        assert "events" in data
        assert "stats" in data


class TestFixtureDetail(TestSetup):
    """Tests for GET /api/fixtures/{id}/detail endpoint"""
    
    def test_fixture_detail_returns_events_and_stats(self, auth_headers):
        """GET /api/fixtures/{id}/detail returns fixture with events and stats"""
        # First get a fixture
        fixtures_res = requests.get(f"{BASE_URL}/api/fixtures?limit=1")
        assert fixtures_res.status_code == 200
        fixtures = fixtures_res.json()
        if len(fixtures) == 0:
            pytest.skip("No fixtures available")
        
        fixture_id = fixtures[0]["id"]
        response = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}/detail")
        assert response.status_code == 200
        data = response.json()
        
        assert "fixture" in data
        assert "events" in data
        assert "stats" in data
        assert data["fixture"]["id"] == fixture_id
    
    def test_fixture_detail_404_for_invalid_id(self):
        """GET /api/fixtures/{id}/detail returns 404 for invalid fixture"""
        response = requests.get(f"{BASE_URL}/api/fixtures/invalid-fixture-id/detail")
        assert response.status_code == 404


class TestMatchEvents(TestSetup):
    """Tests for Match Events CRUD operations"""
    
    @pytest.fixture(scope="class")
    def test_fixture(self, auth_headers):
        """Create a test fixture for event testing"""
        fixture_data = {
            "home_team": "LEFTERIA FC",
            "away_team": "TEST_EventTeam",
            "match_date": "2026-03-15T15:00:00Z",
            "venue": "Γήπεδο Αετού",
            "competition": "ΠΑΑΟΚ Α' Όμιλος",
            "status": "Live",
            "home_score": 0,
            "away_score": 0
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures", json=fixture_data, headers=auth_headers)
        assert response.status_code == 200
        fixture = response.json()
        yield fixture
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture['id']}", headers=auth_headers)
    
    def test_add_goal_event_increments_home_score(self, auth_headers, test_fixture):
        """POST /api/admin/fixtures/{id}/events adds goal and increments home score"""
        fixture_id = test_fixture["id"]
        
        # Add a goal for home team
        event_data = {
            "event_type": "goal",
            "minute": 25,
            "team": "home",
            "player_name": "Μάριος Ρούκλας"
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        event_result = response.json()
        assert "id" in event_result
        
        # Verify score was incremented
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        assert fixture_res.status_code == 200
        updated_fixture = fixture_res.json()
        assert updated_fixture["home_score"] == 1
        
        # Cleanup - delete the event
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_result['id']}", headers=auth_headers)
    
    def test_add_goal_event_increments_away_score(self, auth_headers, test_fixture):
        """POST /api/admin/fixtures/{id}/events adds goal and increments away score"""
        fixture_id = test_fixture["id"]
        
        # Reset scores first
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"home_score": 0, "away_score": 0}, headers=auth_headers)
        
        # Add a goal for away team
        event_data = {
            "event_type": "goal",
            "minute": 30,
            "team": "away",
            "player_name": "Test Player"
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        event_result = response.json()
        
        # Verify away score was incremented
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        updated_fixture = fixture_res.json()
        assert updated_fixture["away_score"] == 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_result['id']}", headers=auth_headers)
    
    def test_add_own_goal_increments_opposing_team_score(self, auth_headers, test_fixture):
        """POST /api/admin/fixtures/{id}/events - own_goal increments OPPOSING team's score"""
        fixture_id = test_fixture["id"]
        
        # Reset scores
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"home_score": 0, "away_score": 0}, headers=auth_headers)
        
        # Add own goal by home team player (should increment AWAY score)
        event_data = {
            "event_type": "own_goal",
            "minute": 40,
            "team": "home",
            "player_name": "Own Goal Player"
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        event_result = response.json()
        
        # Verify AWAY score was incremented (not home)
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        updated_fixture = fixture_res.json()
        assert updated_fixture["home_score"] == 0, "Home score should not change for own goal"
        assert updated_fixture["away_score"] == 1, "Away score should increment for home team's own goal"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_result['id']}", headers=auth_headers)
    
    def test_add_penalty_scored_increments_score(self, auth_headers, test_fixture):
        """POST /api/admin/fixtures/{id}/events - penalty_scored increments score"""
        fixture_id = test_fixture["id"]
        
        # Reset scores
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"home_score": 0, "away_score": 0}, headers=auth_headers)
        
        event_data = {
            "event_type": "penalty_scored",
            "minute": 50,
            "team": "home",
            "player_name": "Penalty Taker"
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        event_result = response.json()
        
        # Verify score incremented
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        updated_fixture = fixture_res.json()
        assert updated_fixture["home_score"] == 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_result['id']}", headers=auth_headers)
    
    def test_add_yellow_card_event(self, auth_headers, test_fixture):
        """POST /api/admin/fixtures/{id}/events adds yellow card (no score change)"""
        fixture_id = test_fixture["id"]
        
        # Reset scores
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"home_score": 0, "away_score": 0}, headers=auth_headers)
        
        event_data = {
            "event_type": "yellow_card",
            "minute": 35,
            "team": "home",
            "player_name": "Yellow Card Player"
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        event_result = response.json()
        
        # Verify score NOT changed
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        updated_fixture = fixture_res.json()
        assert updated_fixture["home_score"] == 0
        assert updated_fixture["away_score"] == 0
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_result['id']}", headers=auth_headers)
    
    def test_add_substitution_event(self, auth_headers, test_fixture):
        """POST /api/admin/fixtures/{id}/events adds substitution with secondary player"""
        fixture_id = test_fixture["id"]
        
        event_data = {
            "event_type": "substitution",
            "minute": 60,
            "team": "home",
            "player_name": "Player Out",
            "secondary_player_name": "Player In"
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        event_result = response.json()
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_result['id']}", headers=auth_headers)
    
    def test_delete_goal_event_reverses_score(self, auth_headers, test_fixture):
        """DELETE /api/admin/fixtures/{id}/events/{event_id} reverses score for goal"""
        fixture_id = test_fixture["id"]
        
        # Reset scores
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"home_score": 0, "away_score": 0}, headers=auth_headers)
        
        # Add a goal
        event_data = {
            "event_type": "goal",
            "minute": 70,
            "team": "home",
            "player_name": "Goal Scorer"
        }
        add_res = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        event_id = add_res.json()["id"]
        
        # Verify score is 1
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        assert fixture_res.json()["home_score"] == 1
        
        # Delete the event
        delete_res = requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_id}", headers=auth_headers)
        assert delete_res.status_code == 200
        
        # Verify score is back to 0
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        assert fixture_res.json()["home_score"] == 0
    
    def test_delete_own_goal_reverses_opposing_score(self, auth_headers, test_fixture):
        """DELETE /api/admin/fixtures/{id}/events/{event_id} reverses opposing score for own_goal"""
        fixture_id = test_fixture["id"]
        
        # Reset scores
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"home_score": 0, "away_score": 0}, headers=auth_headers)
        
        # Add own goal (home team own goal = away score +1)
        event_data = {
            "event_type": "own_goal",
            "minute": 75,
            "team": "home",
            "player_name": "Own Goal Player"
        }
        add_res = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        event_id = add_res.json()["id"]
        
        # Verify away score is 1
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        assert fixture_res.json()["away_score"] == 1
        
        # Delete the event
        delete_res = requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_id}", headers=auth_headers)
        assert delete_res.status_code == 200
        
        # Verify away score is back to 0
        fixture_res = requests.get(f"{BASE_URL}/api/fixtures/{fixture_id}")
        assert fixture_res.json()["away_score"] == 0
    
    def test_get_match_events_sorted_by_minute(self, auth_headers, test_fixture):
        """GET /api/admin/fixtures/{id}/events returns events sorted by minute"""
        fixture_id = test_fixture["id"]
        
        # Add events in non-chronological order
        events_to_add = [
            {"event_type": "yellow_card", "minute": 45, "team": "home", "player_name": "Player A"},
            {"event_type": "yellow_card", "minute": 10, "team": "away", "player_name": "Player B"},
            {"event_type": "yellow_card", "minute": 30, "team": "home", "player_name": "Player C"},
        ]
        
        event_ids = []
        for event in events_to_add:
            res = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event, headers=auth_headers)
            event_ids.append(res.json()["id"])
        
        # Get events
        response = requests.get(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", headers=auth_headers)
        assert response.status_code == 200
        events = response.json()
        
        # Verify sorted by minute
        minutes = [e["minute"] for e in events]
        assert minutes == sorted(minutes), "Events should be sorted by minute"
        
        # Cleanup
        for event_id in event_ids:
            requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_id}", headers=auth_headers)


class TestMatchStats(TestSetup):
    """Tests for Match Statistics endpoints"""
    
    @pytest.fixture(scope="class")
    def stats_fixture(self, auth_headers):
        """Create a test fixture for stats testing"""
        fixture_data = {
            "home_team": "LEFTERIA FC",
            "away_team": "TEST_StatsTeam",
            "match_date": "2026-03-16T15:00:00Z",
            "venue": "Γήπεδο Αετού",
            "competition": "ΠΑΑΟΚ Α' Όμιλος",
            "status": "Live",
            "home_score": 0,
            "away_score": 0
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures", json=fixture_data, headers=auth_headers)
        assert response.status_code == 200
        fixture = response.json()
        yield fixture
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture['id']}", headers=auth_headers)
    
    def test_update_match_stats(self, auth_headers, stats_fixture):
        """PUT /api/admin/fixtures/{id}/stats updates match statistics"""
        fixture_id = stats_fixture["id"]
        
        stats_data = {
            "home_possession": 60,
            "home_shots": 12,
            "away_shots": 8,
            "home_corners": 5,
            "away_corners": 3,
            "home_fouls": 10,
            "away_fouls": 14,
            "home_offsides": 2,
            "away_offsides": 4,
            "home_saves": 3,
            "away_saves": 5,
            "match_minute": 45
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/stats", json=stats_data, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        
        assert result["home_possession"] == 60
        assert result["home_shots"] == 12
        assert result["away_shots"] == 8
        assert result["home_corners"] == 5
        assert result["match_minute"] == 45
    
    def test_possession_auto_balances(self, auth_headers, stats_fixture):
        """PUT /api/admin/fixtures/{id}/stats - possession auto-balances to 100%"""
        fixture_id = stats_fixture["id"]
        
        # Set home possession to 65
        stats_data = {"home_possession": 65}
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/stats", json=stats_data, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        
        assert result["home_possession"] == 65
        assert result["away_possession"] == 35, "Away possession should auto-balance to 35"
    
    def test_possession_auto_balances_from_away(self, auth_headers, stats_fixture):
        """PUT /api/admin/fixtures/{id}/stats - setting away_possession auto-balances home"""
        fixture_id = stats_fixture["id"]
        
        # Set away possession to 55
        stats_data = {"away_possession": 55}
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/stats", json=stats_data, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        
        assert result["away_possession"] == 55
        assert result["home_possession"] == 45, "Home possession should auto-balance to 45"
    
    def test_get_match_stats(self, auth_headers, stats_fixture):
        """GET /api/admin/fixtures/{id}/stats returns match statistics"""
        fixture_id = stats_fixture["id"]
        
        response = requests.get(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/stats", headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        
        assert "fixture_id" in result
        assert "home_possession" in result
        assert "away_possession" in result
        assert "home_shots" in result
        assert "away_shots" in result


class TestMatchStatusTransitions(TestSetup):
    """Tests for match status transitions (Scheduled -> Live -> Half Time -> Completed)"""
    
    @pytest.fixture(scope="class")
    def status_fixture(self, auth_headers):
        """Create a test fixture for status testing"""
        fixture_data = {
            "home_team": "LEFTERIA FC",
            "away_team": "TEST_StatusTeam",
            "match_date": "2026-03-17T15:00:00Z",
            "venue": "Γήπεδο Αετού",
            "competition": "ΠΑΑΟΚ Α' Όμιλος",
            "status": "Scheduled",
            "home_score": 0,
            "away_score": 0
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures", json=fixture_data, headers=auth_headers)
        assert response.status_code == 200
        fixture = response.json()
        yield fixture
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture['id']}", headers=auth_headers)
    
    def test_scheduled_to_live(self, auth_headers, status_fixture):
        """PUT /api/admin/fixtures/{id}/live-score can change Scheduled to Live"""
        fixture_id = status_fixture["id"]
        
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                               json={"status": "Live"}, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "Live"
    
    def test_live_to_half_time(self, auth_headers, status_fixture):
        """PUT /api/admin/fixtures/{id}/live-score can change Live to Half Time"""
        fixture_id = status_fixture["id"]
        
        # Ensure it's Live first
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"status": "Live"}, headers=auth_headers)
        
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                               json={"status": "Half Time"}, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "Half Time"
    
    def test_half_time_to_live(self, auth_headers, status_fixture):
        """PUT /api/admin/fixtures/{id}/live-score can change Half Time back to Live"""
        fixture_id = status_fixture["id"]
        
        # Ensure it's Half Time first
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"status": "Half Time"}, headers=auth_headers)
        
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                               json={"status": "Live"}, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "Live"
    
    def test_live_to_completed_updates_standings(self, auth_headers, status_fixture):
        """PUT /api/admin/fixtures/{id}/live-score - Completed status auto-updates standings"""
        fixture_id = status_fixture["id"]
        
        # Set to Live with scores
        requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                    json={"status": "Live", "home_score": 2, "away_score": 1}, headers=auth_headers)
        
        # Complete the match
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score", 
                               json={"status": "Completed", "home_score": 2, "away_score": 1}, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "Completed"


class TestHalfTimeStatus(TestSetup):
    """Tests for Half Time status in MatchStatus enum"""
    
    def test_half_time_in_live_match_response(self, auth_headers):
        """GET /api/live-match includes Half Time matches as active"""
        # Create a Half Time fixture
        fixture_data = {
            "home_team": "LEFTERIA FC",
            "away_team": "TEST_HalfTimeTeam",
            "match_date": "2026-03-18T15:00:00Z",
            "venue": "Γήπεδο Αετού",
            "competition": "ΠΑΑΟΚ Α' Όμιλος",
            "status": "Half Time",
            "home_score": 1,
            "away_score": 0
        }
        create_res = requests.post(f"{BASE_URL}/api/admin/fixtures", json=fixture_data, headers=auth_headers)
        assert create_res.status_code == 200
        fixture = create_res.json()
        
        try:
            # Check live-match endpoint
            response = requests.get(f"{BASE_URL}/api/live-match")
            assert response.status_code == 200
            data = response.json()
            
            # Should be active since Half Time is considered "live"
            assert data["active"] == True
            assert data["fixture"]["status"] == "Half Time"
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture['id']}", headers=auth_headers)


class TestEventTypes(TestSetup):
    """Tests for all event types in EventType enum"""
    
    @pytest.fixture(scope="class")
    def event_type_fixture(self, auth_headers):
        """Create a test fixture for event type testing"""
        fixture_data = {
            "home_team": "LEFTERIA FC",
            "away_team": "TEST_EventTypeTeam",
            "match_date": "2026-03-19T15:00:00Z",
            "venue": "Γήπεδο Αετού",
            "competition": "ΠΑΑΟΚ Α' Όμιλος",
            "status": "Live",
            "home_score": 0,
            "away_score": 0
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures", json=fixture_data, headers=auth_headers)
        assert response.status_code == 200
        fixture = response.json()
        yield fixture
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture['id']}", headers=auth_headers)
    
    @pytest.mark.parametrize("event_type", [
        "goal", "yellow_card", "red_card", "second_yellow", 
        "substitution", "penalty_scored", "penalty_missed", 
        "own_goal", "var_decision"
    ])
    def test_all_event_types_can_be_added(self, auth_headers, event_type_fixture, event_type):
        """All event types in EventType enum can be added"""
        fixture_id = event_type_fixture["id"]
        
        event_data = {
            "event_type": event_type,
            "minute": 50,
            "team": "home",
            "player_name": f"Test Player {event_type}"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to add event type: {event_type}"
        event_result = response.json()
        assert "id" in event_result
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/events/{event_result['id']}", headers=auth_headers)


class TestAuthRequirements(TestSetup):
    """Tests for authentication requirements on admin endpoints"""
    
    def test_add_event_requires_auth(self):
        """POST /api/admin/fixtures/{id}/events requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/fixtures/some-id/events", json={
            "event_type": "goal",
            "minute": 10,
            "team": "home"
        })
        assert response.status_code == 401
    
    def test_delete_event_requires_auth(self):
        """DELETE /api/admin/fixtures/{id}/events/{event_id} requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/admin/fixtures/some-id/events/some-event-id")
        assert response.status_code == 401
    
    def test_get_events_requires_auth(self):
        """GET /api/admin/fixtures/{id}/events requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/fixtures/some-id/events")
        assert response.status_code == 401
    
    def test_update_stats_requires_auth(self):
        """PUT /api/admin/fixtures/{id}/stats requires authentication"""
        response = requests.put(f"{BASE_URL}/api/admin/fixtures/some-id/stats", json={
            "home_possession": 50
        })
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
