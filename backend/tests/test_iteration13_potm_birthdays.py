"""
Iteration 13 Tests: Player of the Month Voting & Birthday Celebrations
Tests for the two new features added to Lefteria FC CMS:
1. Player of the Month (POTM) voting - first-team players votable, one vote per visitor per month
2. Birthday celebrations - players with birthdays in current month (April 2026)
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBirthdayEndpoint:
    """Tests for GET /api/players/birthdays - players with birthdays in current month"""
    
    def test_birthday_endpoint_returns_200(self):
        """Birthday endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/players/birthdays")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Birthday endpoint returns 200")
    
    def test_birthday_endpoint_returns_list(self):
        """Birthday endpoint should return a list"""
        response = requests.get(f"{BASE_URL}/api/players/birthdays")
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: Birthday endpoint returns list with {len(data)} players")
    
    def test_birthday_players_have_required_fields(self):
        """Each birthday player should have required fields"""
        response = requests.get(f"{BASE_URL}/api/players/birthdays")
        data = response.json()
        
        required_fields = ["id", "name", "number", "position", "team_type", "date_of_birth", "age", "birthday_day"]
        
        for player in data:
            for field in required_fields:
                assert field in player, f"Missing field '{field}' in player {player.get('name', 'unknown')}"
        
        print(f"PASS: All {len(data)} birthday players have required fields")
    
    def test_birthday_players_are_in_april(self):
        """All birthday players should have April birthdays (month 4)"""
        response = requests.get(f"{BASE_URL}/api/players/birthdays")
        data = response.json()
        
        current_month = datetime.now().month  # Should be 4 (April)
        
        for player in data:
            dob = player.get("date_of_birth", "")
            if dob:
                dob_month = int(dob.split("-")[1])
                assert dob_month == current_month, f"Player {player['name']} has DOB {dob}, expected month {current_month}"
        
        print(f"PASS: All {len(data)} birthday players have birthdays in month {current_month}")
    
    def test_birthday_players_sorted_by_day(self):
        """Birthday players should be sorted by birthday_day"""
        response = requests.get(f"{BASE_URL}/api/players/birthdays")
        data = response.json()
        
        if len(data) > 1:
            days = [p["birthday_day"] for p in data]
            assert days == sorted(days), f"Players not sorted by birthday_day: {days}"
        
        print(f"PASS: Birthday players sorted by day: {[p['birthday_day'] for p in data]}")
    
    def test_birthday_count_is_6_for_april(self):
        """Should have 6 players with April birthdays based on seed data"""
        response = requests.get(f"{BASE_URL}/api/players/birthdays")
        data = response.json()
        
        # Based on the seed data, there should be 6 players with April birthdays
        assert len(data) == 6, f"Expected 6 April birthday players, got {len(data)}"
        print(f"PASS: Found expected 6 April birthday players")


class TestPotmVotingResults:
    """Tests for GET /api/votes/potm/results - voting results with leaderboard"""
    
    def test_potm_results_returns_200(self):
        """POTM results endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: POTM results endpoint returns 200")
    
    def test_potm_results_has_required_fields(self):
        """POTM results should have month_key, total_votes, and results"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        data = response.json()
        
        assert "month_key" in data, "Missing month_key in results"
        assert "total_votes" in data, "Missing total_votes in results"
        assert "results" in data, "Missing results array"
        assert isinstance(data["results"], list), "results should be a list"
        
        print(f"PASS: POTM results has required fields - month_key: {data['month_key']}, total_votes: {data['total_votes']}")
    
    def test_potm_results_month_key_format(self):
        """Month key should be in YYYY-MM format"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        data = response.json()
        
        month_key = data["month_key"]
        assert len(month_key) == 7, f"Month key should be 7 chars (YYYY-MM), got {month_key}"
        assert month_key[4] == "-", f"Month key should have dash at position 4, got {month_key}"
        
        # Should be 2026-04 for April 2026
        expected = datetime.now().strftime("%Y-%m")
        assert month_key == expected, f"Expected month_key {expected}, got {month_key}"
        
        print(f"PASS: Month key format correct: {month_key}")
    
    def test_potm_results_entries_have_required_fields(self):
        """Each result entry should have player_id, player_name, votes, image_url, number, position"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        data = response.json()
        
        required_fields = ["player_id", "player_name", "votes", "image_url", "number", "position"]
        
        for result in data["results"]:
            for field in required_fields:
                assert field in result, f"Missing field '{field}' in result"
        
        print(f"PASS: All {len(data['results'])} result entries have required fields")


class TestPotmVotingCheck:
    """Tests for GET /api/votes/potm/check - check if visitor has voted"""
    
    def test_potm_check_returns_200(self):
        """POTM check endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/check")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: POTM check endpoint returns 200")
    
    def test_potm_check_has_required_fields(self):
        """POTM check should have has_voted and voted_player_id fields"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/check")
        data = response.json()
        
        assert "has_voted" in data, "Missing has_voted field"
        assert "voted_player_id" in data, "Missing voted_player_id field"
        assert isinstance(data["has_voted"], bool), "has_voted should be boolean"
        
        print(f"PASS: POTM check has required fields - has_voted: {data['has_voted']}")


class TestPotmVotingCast:
    """Tests for POST /api/votes/potm - casting a vote"""
    
    def test_potm_vote_requires_player_id(self):
        """Voting without player_id should fail with 422"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={})
        assert response.status_code == 422, f"Expected 422 for missing player_id, got {response.status_code}"
        print("PASS: Voting without player_id returns 422")
    
    def test_potm_vote_invalid_player_returns_404(self):
        """Voting for non-existent player should return 404"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={"player_id": "non-existent-id"})
        assert response.status_code == 404, f"Expected 404 for invalid player, got {response.status_code}"
        print("PASS: Voting for invalid player returns 404")
    
    def test_potm_duplicate_vote_returns_429(self):
        """Duplicate voting should return 429 (rate limited)"""
        # First, get a valid player ID
        players_response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        players = players_response.json()
        assert len(players) > 0, "No first team players found"
        
        player_id = players[0]["id"]
        
        # Try to vote (may succeed or fail with 429 if already voted)
        response1 = requests.post(f"{BASE_URL}/api/votes/potm", json={"player_id": player_id})
        
        # Second vote should definitely return 429
        response2 = requests.post(f"{BASE_URL}/api/votes/potm", json={"player_id": player_id})
        assert response2.status_code == 429, f"Expected 429 for duplicate vote, got {response2.status_code}"
        
        print("PASS: Duplicate voting returns 429")


class TestFirstTeamPlayersForPotm:
    """Tests for GET /api/players?team_type=First Team - all first-team players for POTM voting"""
    
    def test_first_team_players_returns_200(self):
        """First team players endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: First team players endpoint returns 200")
    
    def test_first_team_has_20_players(self):
        """First team should have exactly 20 players (regression check)"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        data = response.json()
        
        assert len(data) == 20, f"Expected 20 first team players, got {len(data)}"
        print(f"PASS: First team has 20 players")
    
    def test_first_team_players_have_required_fields_for_potm(self):
        """First team players should have fields needed for POTM display"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        data = response.json()
        
        required_fields = ["id", "name", "number", "position", "image_url"]
        
        for player in data:
            for field in required_fields:
                assert field in player, f"Missing field '{field}' in player {player.get('name', 'unknown')}"
        
        print(f"PASS: All 20 first team players have required POTM fields")


class TestRosterRegression:
    """Regression test: /team?tab=roster should show all 20 first-team players"""
    
    def test_roster_shows_20_players(self):
        """Roster should show all 20 first-team players"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        data = response.json()
        
        assert len(data) == 20, f"Expected 20 players in roster, got {len(data)}"
        
        # Verify all positions are represented
        positions = set(p["position"] for p in data)
        expected_positions = {"Goalkeeper", "Defender", "Midfielder", "Forward"}
        assert positions == expected_positions, f"Missing positions: {expected_positions - positions}"
        
        print(f"PASS: Roster has 20 players with all positions: {positions}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
