"""
Iteration 22 Backend Tests
Tests for:
1. Admin player profile APIs (GET/PUT player)
2. Academy group detail APIs (GET group, players, fixtures, gallery)
3. Existing admin flows (dashboard, news, settings)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"

class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        """Test admin login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        print(f"PASS: Admin login successful")
        return data["token"]


class TestAcademyGroupAPIs:
    """Academy group detail page APIs"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json().get("token")
    
    def test_get_academy_groups(self):
        """GET /api/academy-groups - list all groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/academy-groups returned {len(data)} groups")
        return data
    
    def test_get_academy_group_by_id(self):
        """GET /api/academy-groups/{id} - get single group"""
        # First get list of groups
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_response.json()
        
        if len(groups) == 0:
            pytest.skip("No academy groups to test")
        
        group_id = groups[0]["id"]
        response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have id"
        assert "name" in data, "Response should have name"
        print(f"PASS: GET /api/academy-groups/{group_id} returned group: {data.get('name')}")
    
    def test_get_academy_group_players(self):
        """GET /api/academy-groups/{id}/players - get group players"""
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_response.json()
        
        if len(groups) == 0:
            pytest.skip("No academy groups to test")
        
        group_id = groups[0]["id"]
        response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}/players")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/academy-groups/{group_id}/players returned {len(data)} players")
    
    def test_get_academy_group_fixtures(self):
        """GET /api/academy-groups/{id}/fixtures - get group fixtures"""
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_response.json()
        
        if len(groups) == 0:
            pytest.skip("No academy groups to test")
        
        group_id = groups[0]["id"]
        response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}/fixtures")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/academy-groups/{group_id}/fixtures returned {len(data)} fixtures")
    
    def test_get_gallery_by_academy_group(self):
        """GET /api/gallery?academy_group_id={id} - get group gallery"""
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_response.json()
        
        if len(groups) == 0:
            pytest.skip("No academy groups to test")
        
        group_id = groups[0]["id"]
        response = requests.get(f"{BASE_URL}/api/gallery?academy_group_id={group_id}")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/gallery?academy_group_id={group_id} returned {len(data)} items")


class TestPlayerProfileAPIs:
    """Player profile view/edit APIs"""
    
    @pytest.fixture
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_players_list(self, auth_headers):
        """GET /api/players - list all players (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/players returned {len(data)} players")
    
    def test_get_player_by_id(self, auth_headers):
        """GET /api/players/{id} - get single player (public)"""
        # First get list of players
        players_response = requests.get(f"{BASE_URL}/api/players")
        players = players_response.json()
        
        if len(players) == 0:
            pytest.skip("No players to test")
        
        player_id = players[0]["id"]
        response = requests.get(f"{BASE_URL}/api/players/{player_id}")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have id"
        assert "name" in data, "Response should have name"
        print(f"PASS: GET /api/players/{player_id} returned player: {data.get('name')}")
    
    def test_update_player(self, auth_headers):
        """PUT /api/admin/players/{id} - update player"""
        # First get list of players
        players_response = requests.get(f"{BASE_URL}/api/players")
        players = players_response.json()
        
        if len(players) == 0:
            pytest.skip("No players to test")
        
        # Find a test player or use first one
        player = players[0]
        player_id = player["id"]
        original_bio = player.get("bio", "")
        
        # Update with test bio
        test_bio = f"TEST_BIO_{os.urandom(4).hex()}"
        update_payload = {
            "name": player.get("name"),
            "number": player.get("number", 0),
            "position": player.get("position", "Midfielder"),
            "nationality": player.get("nationality", "Cyprus"),
            "age": player.get("age", 0),
            "team_type": player.get("team_type", "First Team"),
            "bio": test_bio
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/players/{player_id}", 
                               json=update_payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/players/{player_id}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("bio") == test_bio, "Bio update not persisted"
        
        # Restore original bio
        update_payload["bio"] = original_bio
        requests.put(f"{BASE_URL}/api/admin/players/{player_id}", 
                    json=update_payload, headers=auth_headers)
        
        print(f"PASS: PUT /api/admin/players/{player_id} - update and verify worked")


class TestAdminDashboard:
    """Admin dashboard and existing flows"""
    
    @pytest.fixture
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_admin_dashboard(self, auth_headers):
        """GET /api/admin/dashboard - dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Check expected stats fields
        expected_fields = ["teams_count", "first_team_players", "academy_players", "total_fixtures", "news_articles"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print(f"PASS: GET /api/admin/dashboard returned dashboard stats")
    
    def test_get_news(self, auth_headers):
        """GET /api/news - list news articles"""
        response = requests.get(f"{BASE_URL}/api/news")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/news returned {len(data)} articles")
    
    def test_get_teams(self, auth_headers):
        """GET /api/teams - list teams"""
        response = requests.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/teams returned {len(data)} teams")
    
    def test_get_fixtures(self, auth_headers):
        """GET /api/fixtures - list fixtures"""
        response = requests.get(f"{BASE_URL}/api/fixtures")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/fixtures returned {len(data)} fixtures")


class TestPublicAcademyPage:
    """Public academy page APIs"""
    
    def test_academy_page_data(self):
        """Test all data needed for public academy page"""
        # Get academy groups
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200, f"Failed: {response.text}"
        groups = response.json()
        
        if len(groups) == 0:
            pytest.skip("No academy groups")
        
        # Test each group has required fields for cards
        for group in groups:
            assert "id" in group, "Group missing id"
            assert "name" in group, "Group missing name"
            # age_range, coach_name, training_schedule are optional but expected
        
        print(f"PASS: Academy page data - {len(groups)} groups with required fields")
    
    def test_academy_group_detail_page_data(self):
        """Test all data needed for /academy/:groupId page"""
        # Get academy groups
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_response.json()
        
        if len(groups) == 0:
            pytest.skip("No academy groups")
        
        group_id = groups[0]["id"]
        
        # Test group detail
        group_response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}")
        assert group_response.status_code == 200
        group = group_response.json()
        assert "name" in group
        
        # Test players
        players_response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}/players")
        assert players_response.status_code == 200
        players = players_response.json()
        
        # Test fixtures
        fixtures_response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}/fixtures")
        assert fixtures_response.status_code == 200
        fixtures = fixtures_response.json()
        
        # Test gallery
        gallery_response = requests.get(f"{BASE_URL}/api/gallery?academy_group_id={group_id}")
        assert gallery_response.status_code == 200
        gallery = gallery_response.json()
        
        print(f"PASS: Academy group detail page data - group: {group.get('name')}, players: {len(players)}, fixtures: {len(fixtures)}, gallery: {len(gallery)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
