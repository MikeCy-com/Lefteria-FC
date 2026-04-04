"""
Iteration 6 Tests: Team Hub Page and Player Profile Restructuring
Tests for the new tabbed Team Hub page and redesigned Player Profile page.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com')

class TestTeamHubAPIs:
    """Tests for APIs used by the Team Hub page tabs"""
    
    def test_get_first_team_players(self):
        """Test GET /api/players?team_type=First Team - Used by Overview and Roster tabs"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify player structure
        player = data[0]
        assert "id" in player
        assert "name" in player
        assert "number" in player
        assert "position" in player
        assert "statistics" in player
        print(f"✅ Found {len(data)} First Team players")
    
    def test_get_fixtures(self):
        """Test GET /api/fixtures - Used by Overview and Results tabs"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=50")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify fixture structure
        if len(data) > 0:
            fixture = data[0]
            assert "id" in fixture
            assert "home_team" in fixture
            assert "away_team" in fixture
            assert "match_date" in fixture
            assert "status" in fixture
        print(f"✅ Found {len(data)} fixtures")
    
    def test_get_standings(self):
        """Test GET /api/standings - Used by Overview tab Team Statistics"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify standings structure
        if len(data) > 0:
            standing = data[0]
            assert "team_name" in standing
            assert "points" in standing
            assert "goals_for" in standing
            assert "goals_against" in standing
        print(f"✅ Found {len(data)} standings entries")
    
    def test_get_staff(self):
        """Test GET /api/staff - Used by Overview tab Staff Preview"""
        response = requests.get(f"{BASE_URL}/api/staff")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Found {len(data)} staff members")
    
    def test_get_calendar(self):
        """Test GET /api/calendar - Used by Schedule tab"""
        response = requests.get(f"{BASE_URL}/api/calendar?month=1&year=2026")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Calendar API returned {len(data)} events for Jan 2026")
    
    def test_get_venues(self):
        """Test GET /api/venues - Used by Venues tab"""
        response = requests.get(f"{BASE_URL}/api/venues")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify venue structure
        if len(data) > 0:
            venue = data[0]
            assert "id" in venue
            assert "name" in venue
            assert "address" in venue
            assert "city" in venue
        print(f"✅ Found {len(data)} venues")


class TestPlayerProfileAPIs:
    """Tests for APIs used by the Player Profile page"""
    
    def test_get_player_by_id(self):
        """Test GET /api/players/{id} - Used by Player Profile page"""
        # First get a player ID
        players_response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert players_response.status_code == 200
        players = players_response.json()
        assert len(players) > 0
        
        player_id = players[0]["id"]
        
        # Get player detail
        response = requests.get(f"{BASE_URL}/api/players/{player_id}")
        assert response.status_code == 200
        player = response.json()
        
        # Verify full player structure for profile page
        assert "id" in player
        assert "name" in player
        assert "number" in player
        assert "position" in player
        assert "nationality" in player
        assert "age" in player
        assert "team_type" in player
        assert "statistics" in player
        
        # Verify statistics structure for stat bars
        stats = player["statistics"]
        assert "appearances" in stats
        assert "goals" in stats
        assert "assists" in stats
        assert "minutes_played" in stats
        
        print(f"✅ Player profile API returns full data for: {player['name']}")
    
    def test_get_nonexistent_player(self):
        """Test GET /api/players/{id} with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/players/nonexistent-id-12345")
        assert response.status_code == 404
        print("✅ Non-existent player returns 404")


class TestRosterFiltering:
    """Tests for roster filtering functionality"""
    
    def test_filter_by_position_goalkeeper(self):
        """Test filtering players by Goalkeeper position"""
        response = requests.get(f"{BASE_URL}/api/players?position=Goalkeeper")
        assert response.status_code == 200
        data = response.json()
        for player in data:
            assert player["position"] == "Goalkeeper"
        print(f"✅ Found {len(data)} Goalkeepers")
    
    def test_filter_by_position_defender(self):
        """Test filtering players by Defender position"""
        response = requests.get(f"{BASE_URL}/api/players?position=Defender")
        assert response.status_code == 200
        data = response.json()
        for player in data:
            assert player["position"] == "Defender"
        print(f"✅ Found {len(data)} Defenders")
    
    def test_filter_by_position_midfielder(self):
        """Test filtering players by Midfielder position"""
        response = requests.get(f"{BASE_URL}/api/players?position=Midfielder")
        assert response.status_code == 200
        data = response.json()
        for player in data:
            assert player["position"] == "Midfielder"
        print(f"✅ Found {len(data)} Midfielders")
    
    def test_filter_by_position_forward(self):
        """Test filtering players by Forward position"""
        response = requests.get(f"{BASE_URL}/api/players?position=Forward")
        assert response.status_code == 200
        data = response.json()
        for player in data:
            assert player["position"] == "Forward"
        print(f"✅ Found {len(data)} Forwards")


class TestResultsFiltering:
    """Tests for results/fixtures filtering functionality"""
    
    def test_filter_completed_fixtures(self):
        """Test filtering fixtures by Completed status"""
        response = requests.get(f"{BASE_URL}/api/fixtures?status=Completed")
        assert response.status_code == 200
        data = response.json()
        for fixture in data:
            assert fixture["status"] == "Completed"
        print(f"✅ Found {len(data)} completed fixtures")
    
    def test_filter_scheduled_fixtures(self):
        """Test filtering fixtures by Scheduled status"""
        response = requests.get(f"{BASE_URL}/api/fixtures?status=Scheduled")
        assert response.status_code == 200
        data = response.json()
        for fixture in data:
            assert fixture["status"] == "Scheduled"
        print(f"✅ Found {len(data)} scheduled fixtures")


class TestAcademyGroups:
    """Tests for academy groups API"""
    
    def test_get_academy_groups(self):
        """Test GET /api/academy-groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            group = data[0]
            assert "id" in group
            assert "name" in group
            assert "age_range" in group
            assert "coach_name" in group
        print(f"✅ Found {len(data)} academy groups")
    
    def test_get_academy_players(self):
        """Test GET /api/players?team_type=Academy"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=Academy")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for player in data:
            assert player["team_type"] == "Academy"
        print(f"✅ Found {len(data)} academy players")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
