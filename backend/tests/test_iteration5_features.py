"""
Iteration 5 Tests: Image Upload, Player Profile, Academy Grouping, Standings Logos
Tests for new features added in iteration 5:
- POST /api/admin/players/{id}/upload-image - Player image file upload
- POST /api/admin/upload-image - General image upload
- GET /api/players/{id} - Full player detail with statistics
- Static files at /uploads/players/ accessible
- Academy groups with players grouped by group
- Standings with team_logo field
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com').rstrip('/')
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin operations"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def test_player_id():
    """Get a player ID for testing"""
    response = requests.get(f"{BASE_URL}/api/players")
    assert response.status_code == 200
    players = response.json()
    assert len(players) > 0, "No players found for testing"
    return players[0]["id"]


@pytest.fixture(scope="module")
def test_academy_player_id():
    """Get or create an academy player for testing"""
    response = requests.get(f"{BASE_URL}/api/players?team_type=Academy")
    if response.status_code == 200 and len(response.json()) > 0:
        return response.json()[0]["id"]
    return None


class TestPlayerDetailEndpoint:
    """Tests for GET /api/players/{id} - Full player detail"""
    
    def test_get_player_detail_returns_full_data(self, test_player_id):
        """Player detail endpoint returns complete player data with statistics"""
        response = requests.get(f"{BASE_URL}/api/players/{test_player_id}")
        assert response.status_code == 200
        
        player = response.json()
        # Basic fields
        assert "id" in player
        assert "name" in player
        assert "number" in player
        assert "position" in player
        assert "nationality" in player
        assert "age" in player
        
        # Extended profile fields
        assert "height" in player
        assert "weight" in player
        assert "preferred_foot" in player
        assert "bio" in player
        assert "image_url" in player
        
        # Statistics
        assert "statistics" in player
        stats = player["statistics"]
        assert "appearances" in stats
        assert "goals" in stats
        assert "assists" in stats
        assert "yellow_cards" in stats
        assert "red_cards" in stats
        assert "minutes_played" in stats
        assert "clean_sheets" in stats
        
        # Team info
        assert "team_type" in player
        assert "academy_group_id" in player
        assert "academy_group_name" in player
        
        print(f"Player detail test passed for: {player['name']}")
    
    def test_get_player_detail_404_for_invalid_id(self):
        """Player detail returns 404 for non-existent player"""
        response = requests.get(f"{BASE_URL}/api/players/invalid-player-id-12345")
        assert response.status_code == 404
        print("404 test passed for invalid player ID")
    
    def test_player_has_season_statistics_field(self, test_player_id):
        """Player has season_statistics field for historical data"""
        response = requests.get(f"{BASE_URL}/api/players/{test_player_id}")
        assert response.status_code == 200
        player = response.json()
        assert "season_statistics" in player
        print("Season statistics field present")
    
    def test_player_has_previous_clubs_field(self, test_player_id):
        """Player has previous_clubs field for career history"""
        response = requests.get(f"{BASE_URL}/api/players/{test_player_id}")
        assert response.status_code == 200
        player = response.json()
        assert "previous_clubs" in player
        assert isinstance(player["previous_clubs"], list)
        print("Previous clubs field present")


class TestImageUploadEndpoints:
    """Tests for image upload endpoints"""
    
    def test_player_image_upload_requires_auth(self, test_player_id):
        """Player image upload requires authentication"""
        # Create a small test image
        image_data = self._create_test_image()
        files = {"file": ("test.jpg", image_data, "image/jpeg")}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/players/{test_player_id}/upload-image",
            files=files
        )
        assert response.status_code == 401
        print("Auth required test passed for player image upload")
    
    def test_general_image_upload_requires_auth(self):
        """General image upload requires authentication"""
        image_data = self._create_test_image()
        files = {"file": ("test.jpg", image_data, "image/jpeg")}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/upload-image",
            files=files
        )
        assert response.status_code == 401
        print("Auth required test passed for general image upload")
    
    def test_player_image_upload_with_auth(self, test_player_id, auth_headers):
        """Player image upload works with authentication"""
        image_data = self._create_test_image()
        files = {"file": ("test_player.jpg", image_data, "image/jpeg")}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/players/{test_player_id}/upload-image",
            files=files,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert data["image_url"].startswith("/uploads/players/")
        print(f"Player image upload successful: {data['image_url']}")
        
        # Verify the image URL is accessible
        full_url = f"{BASE_URL}{data['image_url']}"
        img_response = requests.get(full_url)
        assert img_response.status_code == 200
        print(f"Uploaded image accessible at: {full_url}")
    
    def test_general_image_upload_with_auth(self, auth_headers):
        """General image upload works with authentication"""
        image_data = self._create_test_image()
        files = {"file": ("test_general.jpg", image_data, "image/jpeg")}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/upload-image",
            files=files,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert "/uploads/" in data["image_url"]
        print(f"General image upload successful: {data['image_url']}")
    
    def test_upload_rejects_non_image_file(self, test_player_id, auth_headers):
        """Upload rejects non-image files"""
        files = {"file": ("test.txt", b"This is not an image", "text/plain")}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/players/{test_player_id}/upload-image",
            files=files,
            headers=auth_headers
        )
        assert response.status_code == 400
        print("Non-image file rejection test passed")
    
    def test_upload_for_nonexistent_player(self, auth_headers):
        """Upload returns 404 for non-existent player"""
        image_data = self._create_test_image()
        files = {"file": ("test.jpg", image_data, "image/jpeg")}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/players/nonexistent-player-id/upload-image",
            files=files,
            headers=auth_headers
        )
        assert response.status_code == 404
        print("404 test passed for non-existent player upload")
    
    def _create_test_image(self):
        """Create a minimal valid JPEG image for testing"""
        # Minimal valid JPEG (1x1 pixel red)
        jpeg_bytes = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7E, 0xCA,
            0x8A, 0x28, 0xA0, 0x02, 0x8A, 0x28, 0xA0, 0xFF, 0xD9
        ])
        return io.BytesIO(jpeg_bytes)


class TestStaticFilesAccess:
    """Tests for static file serving at /uploads/players/"""
    
    def test_uploads_directory_accessible(self, test_player_id, auth_headers):
        """Verify that uploaded files are accessible via /uploads/players/"""
        # First upload an image
        image_data = TestImageUploadEndpoints()._create_test_image()
        files = {"file": ("static_test.jpg", image_data, "image/jpeg")}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/admin/players/{test_player_id}/upload-image",
            files=files,
            headers=auth_headers
        )
        
        if upload_response.status_code == 200:
            image_url = upload_response.json()["image_url"]
            full_url = f"{BASE_URL}{image_url}"
            
            # Verify the file is accessible
            response = requests.get(full_url)
            assert response.status_code == 200
            assert "image" in response.headers.get("content-type", "")
            print(f"Static file accessible: {full_url}")
        else:
            pytest.skip("Upload failed, skipping static file test")


class TestAcademyGroups:
    """Tests for academy groups and player grouping"""
    
    def test_get_academy_groups(self):
        """Academy groups endpoint returns list of groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        
        if len(groups) > 0:
            group = groups[0]
            assert "id" in group
            assert "name" in group
            assert "age_range" in group
            assert "coach_name" in group
            assert "training_schedule" in group
            assert "description" in group
            print(f"Found {len(groups)} academy groups")
        else:
            print("No academy groups found (may need seeding)")
    
    def test_get_academy_group_players(self):
        """Get players for a specific academy group"""
        # First get groups
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        if groups_response.status_code != 200 or len(groups_response.json()) == 0:
            pytest.skip("No academy groups available")
        
        group_id = groups_response.json()[0]["id"]
        response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}/players")
        assert response.status_code == 200
        players = response.json()
        assert isinstance(players, list)
        print(f"Academy group has {len(players)} players")
    
    def test_academy_players_have_group_info(self):
        """Academy players have academy_group_id and academy_group_name"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=Academy")
        assert response.status_code == 200
        players = response.json()
        
        for player in players:
            assert "academy_group_id" in player
            assert "academy_group_name" in player
            if player["academy_group_id"]:
                print(f"Player {player['name']} in group: {player['academy_group_name']}")
        
        print(f"Checked {len(players)} academy players")


class TestStandingsWithLogos:
    """Tests for standings with team_logo field"""
    
    def test_standings_have_team_logo_field(self):
        """Standings entries have team_logo field"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        standings = response.json()
        
        if len(standings) > 0:
            for standing in standings:
                assert "team_logo" in standing
                assert "team_name" in standing
                assert "points" in standing
                assert "played" in standing
                assert "won" in standing
                assert "drawn" in standing
                assert "lost" in standing
                assert "goals_for" in standing
                assert "goals_against" in standing
                assert "goal_difference" in standing
            print(f"Standings have team_logo field - {len(standings)} teams")
        else:
            print("No standings data (may need seeding)")
    
    def test_create_standing_with_logo(self, auth_headers):
        """Can create standing with team_logo"""
        standing_data = {
            "team_name": "TEST_Team_With_Logo",
            "team_logo": "https://example.com/logo.png",
            "played": 10,
            "won": 5,
            "drawn": 3,
            "lost": 2,
            "goals_for": 15,
            "goals_against": 10,
            "points": 18,
            "competition": "Test League",
            "season": "2025/26"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/standings",
            json=standing_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        created = response.json()
        assert created["team_logo"] == "https://example.com/logo.png"
        print(f"Created standing with logo: {created['team_name']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/standings/{created['id']}",
            headers=auth_headers
        )


class TestLiveMatchWidget:
    """Tests for live match widget endpoint"""
    
    def test_live_match_endpoint_exists(self):
        """Live match endpoint returns proper structure"""
        response = requests.get(f"{BASE_URL}/api/live-match")
        assert response.status_code == 200
        data = response.json()
        
        assert "active" in data
        assert "fixture" in data
        assert "events" in data
        assert "stats" in data
        
        if data["active"]:
            assert data["fixture"] is not None
            print("Live match is active")
        else:
            print("No live match currently")


class TestPublicPages:
    """Tests for public page data endpoints"""
    
    def test_homepage_data_endpoints(self):
        """All homepage data endpoints work"""
        endpoints = [
            "/api/fixtures?limit=5",
            "/api/standings",
            "/api/news?limit=3",
            "/api/live-match"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 200, f"Failed: {endpoint}"
            print(f"✓ {endpoint}")
    
    def test_team_page_data(self):
        """Team page data endpoint works"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert response.status_code == 200
        players = response.json()
        assert isinstance(players, list)
        print(f"Team page: {len(players)} first team players")
    
    def test_academy_page_data(self):
        """Academy page data endpoints work"""
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert groups_response.status_code == 200
        
        players_response = requests.get(f"{BASE_URL}/api/players?team_type=Academy")
        assert players_response.status_code == 200
        
        print(f"Academy page: {len(groups_response.json())} groups, {len(players_response.json())} players")
    
    def test_fixtures_page_data(self):
        """Fixtures page data endpoint works"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=50")
        assert response.status_code == 200
        fixtures = response.json()
        assert isinstance(fixtures, list)
        print(f"Fixtures page: {len(fixtures)} fixtures")
    
    def test_news_page_data(self):
        """News page data endpoint works"""
        response = requests.get(f"{BASE_URL}/api/news?limit=20")
        assert response.status_code == 200
        news = response.json()
        assert isinstance(news, list)
        print(f"News page: {len(news)} articles")
    
    def test_contact_form_submission(self):
        """Contact form submission works"""
        contact_data = {
            "name": "TEST_Contact",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test message"
        }
        
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "TEST_Contact"
        print("Contact form submission works")


class TestAdminEndpoints:
    """Tests for admin-specific endpoints"""
    
    def test_admin_dashboard_stats(self, auth_headers):
        """Admin dashboard stats endpoint works"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=auth_headers)
        assert response.status_code == 200
        stats = response.json()
        
        assert "first_team_players" in stats
        assert "academy_players" in stats
        assert "staff_members" in stats
        assert "total_fixtures" in stats
        assert "news_articles" in stats
        assert "unread_messages" in stats
        assert "academy_groups" in stats
        print(f"Dashboard stats: {stats}")
    
    def test_admin_dashboard_requires_auth(self):
        """Admin dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        print("Dashboard auth required test passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
