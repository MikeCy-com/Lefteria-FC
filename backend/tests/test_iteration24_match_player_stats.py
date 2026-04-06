"""
Iteration 24 Tests: Match-based Player Stats Input
Tests for:
1. POST /api/admin/fixtures/{id}/player-stats - saves player performances and increments player aggregate stats
2. GET /api/admin/fixtures/{id}/player-stats - retrieves saved performances
3. Idempotency: re-saving stats for same fixture reverses old stats before applying new
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"

# Known test data from context
ACADEMY_GROUP_ID = "7dda3b6a-afc6-48d2-9f64-8907533c2f34"  # U12 group


class TestMatchPlayerStats:
    """Tests for match-based player stats endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.auth_token = token
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_admin_login_works(self):
        """Verify admin login works with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["username"] == ADMIN_USERNAME
        print(f"PASS: Admin login successful, token received")
    
    def test_get_academy_groups(self):
        """Verify academy groups endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200, f"Failed to get academy groups: {response.text}"
        groups = response.json()
        assert isinstance(groups, list)
        print(f"PASS: Found {len(groups)} academy groups")
        
        # Check if U12 group exists
        u12_group = next((g for g in groups if g.get("id") == ACADEMY_GROUP_ID), None)
        if u12_group:
            print(f"PASS: U12 group found: {u12_group.get('name')}")
        return groups
    
    def test_get_academy_group_players(self):
        """Verify we can get players for an academy group"""
        response = self.session.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_ID}/players")
        assert response.status_code == 200, f"Failed to get players: {response.text}"
        players = response.json()
        assert isinstance(players, list)
        print(f"PASS: Found {len(players)} players in academy group")
        return players
    
    def test_get_academy_group_fixtures(self):
        """Verify we can get fixtures for an academy group"""
        response = self.session.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_ID}/fixtures")
        assert response.status_code == 200, f"Failed to get fixtures: {response.text}"
        fixtures = response.json()
        assert isinstance(fixtures, list)
        print(f"PASS: Found {len(fixtures)} fixtures for academy group")
        return fixtures
    
    def test_get_fixture_player_stats_empty(self):
        """Test GET /api/admin/fixtures/{id}/player-stats returns empty for non-existent fixture"""
        fake_fixture_id = str(uuid.uuid4())
        response = self.session.get(f"{BASE_URL}/api/admin/fixtures/{fake_fixture_id}/player-stats")
        assert response.status_code == 200, f"Unexpected status: {response.status_code}"
        data = response.json()
        assert data.get("fixture_id") == fake_fixture_id
        assert data.get("performances") == []
        print(f"PASS: GET player-stats returns empty for non-existent fixture")
    
    def test_get_existing_fixture_player_stats(self):
        """Test GET /api/admin/fixtures/{id}/player-stats for existing fixture"""
        # First get fixtures
        fixtures_response = self.session.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_ID}/fixtures")
        fixtures = fixtures_response.json()
        
        if not fixtures:
            pytest.skip("No fixtures found to test")
        
        # Get the first completed fixture
        completed_fixture = next((f for f in fixtures if f.get("status") == "Completed"), None)
        if not completed_fixture:
            pytest.skip("No completed fixtures found")
        
        fixture_id = completed_fixture["id"]
        response = self.session.get(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/player-stats")
        assert response.status_code == 200, f"Failed to get player stats: {response.text}"
        data = response.json()
        assert "fixture_id" in data
        assert "performances" in data
        print(f"PASS: GET player-stats for fixture {fixture_id}, found {len(data.get('performances', []))} performances")
        return data
    
    def test_create_fixture_and_save_player_stats(self):
        """Test creating a fixture and saving player stats"""
        # Get players first
        players_response = self.session.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_ID}/players")
        players = players_response.json()
        
        if len(players) < 2:
            pytest.skip("Need at least 2 players to test")
        
        # Create a new test fixture
        fixture_data = {
            "home_team": "LEFTERIA FC U12",
            "away_team": "TEST_Opponent FC",
            "match_date": "2026-01-20",
            "venue": "Test Stadium",
            "competition": "Test Cup",
            "season": "2025/26",
            "status": "Scheduled",
            "academy_group_id": ACADEMY_GROUP_ID
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/admin/academy-groups/{ACADEMY_GROUP_ID}/fixtures",
            json=fixture_data
        )
        assert create_response.status_code == 200, f"Failed to create fixture: {create_response.text}"
        fixture = create_response.json()
        fixture_id = fixture["id"]
        print(f"PASS: Created test fixture {fixture_id}")
        
        # Record initial player stats
        player1 = players[0]
        player2 = players[1]
        initial_stats_p1 = player1.get("statistics", {})
        initial_stats_p2 = player2.get("statistics", {})
        
        # Save player stats for the fixture
        performances = [
            {
                "player_id": player1["id"],
                "player_name": player1["name"],
                "minutes_played": 90,
                "goals": 2,
                "assists": 1,
                "yellow_card": False,
                "red_card": False
            },
            {
                "player_id": player2["id"],
                "player_name": player2["name"],
                "minutes_played": 75,
                "goals": 1,
                "assists": 2,
                "yellow_card": True,
                "red_card": False
            }
        ]
        
        save_response = self.session.post(
            f"{BASE_URL}/api/admin/fixtures/{fixture_id}/player-stats",
            json={"performances": performances}
        )
        assert save_response.status_code == 200, f"Failed to save player stats: {save_response.text}"
        save_data = save_response.json()
        assert save_data.get("count") == 2
        print(f"PASS: Saved player stats for 2 players")
        
        # Verify stats were saved
        get_response = self.session.get(f"{BASE_URL}/api/admin/fixtures/{fixture_id}/player-stats")
        assert get_response.status_code == 200
        saved_data = get_response.json()
        assert len(saved_data.get("performances", [])) == 2
        print(f"PASS: Verified saved performances retrieved correctly")
        
        # Verify player aggregate stats were updated
        player1_updated = self.session.get(f"{BASE_URL}/api/players/{player1['id']}").json()
        player1_new_stats = player1_updated.get("statistics", {})
        
        # Check that goals increased
        expected_goals = initial_stats_p1.get("goals", 0) + 2
        actual_goals = player1_new_stats.get("goals", 0)
        assert actual_goals == expected_goals, f"Player1 goals mismatch: expected {expected_goals}, got {actual_goals}"
        print(f"PASS: Player1 aggregate goals updated correctly ({initial_stats_p1.get('goals', 0)} -> {actual_goals})")
        
        # Cleanup: Delete the test fixture
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}")
        assert delete_response.status_code == 200
        print(f"PASS: Cleaned up test fixture")
        
        return fixture_id
    
    def test_idempotency_resave_stats(self):
        """Test that re-saving stats reverses old stats before applying new"""
        # Get players
        players_response = self.session.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_ID}/players")
        players = players_response.json()
        
        if len(players) < 1:
            pytest.skip("Need at least 1 player to test")
        
        # Create a test fixture
        fixture_data = {
            "home_team": "LEFTERIA FC U12",
            "away_team": "TEST_Idempotency FC",
            "match_date": "2026-01-21",
            "venue": "Test Stadium",
            "competition": "Test Cup",
            "season": "2025/26",
            "status": "Scheduled",
            "academy_group_id": ACADEMY_GROUP_ID
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/admin/academy-groups/{ACADEMY_GROUP_ID}/fixtures",
            json=fixture_data
        )
        fixture = create_response.json()
        fixture_id = fixture["id"]
        
        player = players[0]
        
        # Get initial stats
        initial_player = self.session.get(f"{BASE_URL}/api/players/{player['id']}").json()
        initial_goals = initial_player.get("statistics", {}).get("goals", 0)
        initial_appearances = initial_player.get("statistics", {}).get("appearances", 0)
        
        # First save: 3 goals
        self.session.post(
            f"{BASE_URL}/api/admin/fixtures/{fixture_id}/player-stats",
            json={"performances": [{
                "player_id": player["id"],
                "player_name": player["name"],
                "minutes_played": 90,
                "goals": 3,
                "assists": 0,
                "yellow_card": False,
                "red_card": False
            }]}
        )
        
        # Check stats after first save
        after_first = self.session.get(f"{BASE_URL}/api/players/{player['id']}").json()
        goals_after_first = after_first.get("statistics", {}).get("goals", 0)
        assert goals_after_first == initial_goals + 3, f"After first save: expected {initial_goals + 3}, got {goals_after_first}"
        print(f"PASS: After first save, goals = {goals_after_first} (initial {initial_goals} + 3)")
        
        # Second save: 1 goal (should reverse 3 and add 1)
        self.session.post(
            f"{BASE_URL}/api/admin/fixtures/{fixture_id}/player-stats",
            json={"performances": [{
                "player_id": player["id"],
                "player_name": player["name"],
                "minutes_played": 90,
                "goals": 1,
                "assists": 0,
                "yellow_card": False,
                "red_card": False
            }]}
        )
        
        # Check stats after second save - should be initial + 1 (not initial + 3 + 1)
        after_second = self.session.get(f"{BASE_URL}/api/players/{player['id']}").json()
        goals_after_second = after_second.get("statistics", {}).get("goals", 0)
        assert goals_after_second == initial_goals + 1, f"After second save (idempotency): expected {initial_goals + 1}, got {goals_after_second}"
        print(f"PASS: Idempotency verified - goals = {goals_after_second} (initial {initial_goals} + 1, not +4)")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/fixtures/{fixture_id}")
        print(f"PASS: Cleaned up test fixture")
    
    def test_post_player_stats_nonexistent_fixture(self):
        """Test POST player-stats returns 404 for non-existent fixture"""
        fake_fixture_id = str(uuid.uuid4())
        response = self.session.post(
            f"{BASE_URL}/api/admin/fixtures/{fake_fixture_id}/player-stats",
            json={"performances": []}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: POST player-stats returns 404 for non-existent fixture")
    
    def test_player_stats_endpoint_requires_auth(self):
        """Test that player-stats endpoints require authentication"""
        # Create a new session without auth
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        fake_fixture_id = str(uuid.uuid4())
        
        # GET should require auth
        get_response = no_auth_session.get(f"{BASE_URL}/api/admin/fixtures/{fake_fixture_id}/player-stats")
        assert get_response.status_code == 401, f"GET should require auth, got {get_response.status_code}"
        
        # POST should require auth
        post_response = no_auth_session.post(
            f"{BASE_URL}/api/admin/fixtures/{fake_fixture_id}/player-stats",
            json={"performances": []}
        )
        assert post_response.status_code == 401, f"POST should require auth, got {post_response.status_code}"
        
        print(f"PASS: Player-stats endpoints require authentication")


class TestPublicAcademyGroupStats:
    """Tests for public academy group statistics page"""
    
    def test_academy_group_players_have_statistics_field(self):
        """Verify players returned have statistics field for stats computation"""
        response = requests.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_ID}/players")
        assert response.status_code == 200
        players = response.json()
        
        if not players:
            pytest.skip("No players in academy group")
        
        # Check that players have statistics field
        for player in players:
            assert "statistics" in player, f"Player {player.get('name')} missing statistics field"
            stats = player["statistics"]
            # Verify expected stat fields exist
            expected_fields = ["appearances", "goals", "assists", "yellow_cards", "red_cards", "minutes_played"]
            for field in expected_fields:
                assert field in stats, f"Player {player.get('name')} missing {field} in statistics"
        
        print(f"PASS: All {len(players)} players have statistics field with expected sub-fields")
    
    def test_academy_group_fixtures_have_score_fields(self):
        """Verify fixtures have score and status fields for W/D/L computation"""
        response = requests.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_ID}/fixtures")
        assert response.status_code == 200
        fixtures = response.json()
        
        if not fixtures:
            pytest.skip("No fixtures in academy group")
        
        for fixture in fixtures:
            assert "status" in fixture, f"Fixture {fixture.get('id')} missing status"
            assert "home_team" in fixture
            assert "away_team" in fixture
            # Completed fixtures should have scores
            if fixture.get("status") == "Completed":
                assert "home_score" in fixture, f"Completed fixture missing home_score"
                assert "away_score" in fixture, f"Completed fixture missing away_score"
        
        print(f"PASS: All {len(fixtures)} fixtures have required fields for stats computation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
