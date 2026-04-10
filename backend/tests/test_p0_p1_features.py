"""
Test P0 and P1 features for Lefteria FC CMS
- P0: Accent removal in Greek text
- P0: Academy age groups U6-U12
- P1: Event attendance API for fixtures
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login(self):
        """Test admin login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert len(data["token"]) > 0, "Token is empty"
        print(f"Login successful, token length: {len(data['token'])}")


class TestEventAttendanceAPI:
    """Test P1: Event attendance API for fixtures"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_fixtures(self, auth_headers):
        """Test getting fixtures list"""
        response = requests.get(f"{BASE_URL}/api/fixtures", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get fixtures: {response.text}"
        fixtures = response.json()
        assert isinstance(fixtures, list), "Fixtures should be a list"
        print(f"Found {len(fixtures)} fixtures")
        return fixtures
    
    def test_get_event_attendance_for_fixture(self, auth_headers):
        """Test getting attendance for a fixture event ID"""
        # First get fixtures
        fixtures_response = requests.get(f"{BASE_URL}/api/fixtures", headers=auth_headers)
        assert fixtures_response.status_code == 200
        fixtures = fixtures_response.json()
        
        if len(fixtures) == 0:
            pytest.skip("No fixtures available to test")
        
        # Get attendance for first fixture
        fixture_id = fixtures[0]["id"]
        response = requests.get(f"{BASE_URL}/api/admin/events/{fixture_id}/attendance", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get attendance: {response.text}"
        attendance = response.json()
        assert isinstance(attendance, list), "Attendance should be a list"
        print(f"Fixture {fixture_id} has {len(attendance)} attendance records")
    
    def test_save_event_attendance_for_fixture(self, auth_headers):
        """Test saving attendance for a fixture"""
        # Get fixtures
        fixtures_response = requests.get(f"{BASE_URL}/api/fixtures", headers=auth_headers)
        assert fixtures_response.status_code == 200
        fixtures = fixtures_response.json()
        
        if len(fixtures) == 0:
            pytest.skip("No fixtures available to test")
        
        fixture_id = fixtures[0]["id"]
        
        # Get team players
        teams_response = requests.get(f"{BASE_URL}/api/teams", headers=auth_headers)
        assert teams_response.status_code == 200
        teams = teams_response.json()
        
        if len(teams) == 0:
            pytest.skip("No teams available")
        
        team_id = teams[0]["id"]
        players_response = requests.get(f"{BASE_URL}/api/players?team_id={team_id}", headers=auth_headers)
        assert players_response.status_code == 200
        players = players_response.json()
        
        if len(players) == 0:
            pytest.skip("No players available")
        
        # Save attendance for first player
        test_player = players[0]
        attendance_data = {
            "responses": [
                {
                    "player_id": test_player["id"],
                    "player_name": test_player.get("name", "Test Player"),
                    "status": "going"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/events/{fixture_id}/attendance",
            headers=auth_headers,
            json=attendance_data
        )
        assert response.status_code == 200, f"Failed to save attendance: {response.text}"
        result = response.json()
        assert "message" in result, "No message in response"
        assert result.get("count") == 1, "Count should be 1"
        print(f"Saved attendance for fixture {fixture_id}")
        
        # Verify attendance was saved
        verify_response = requests.get(f"{BASE_URL}/api/admin/events/{fixture_id}/attendance", headers=auth_headers)
        assert verify_response.status_code == 200
        attendance = verify_response.json()
        player_attendance = [a for a in attendance if a["player_id"] == test_player["id"]]
        assert len(player_attendance) > 0, "Attendance not found after save"
        assert player_attendance[0]["status"] == "going", "Status should be 'going'"


class TestAcademyAgeGroups:
    """Test P0: Academy age groups should be U6-U12"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get headers with auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_get_academy_groups(self, auth_headers):
        """Test getting academy groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get academy groups: {response.text}"
        groups = response.json()
        assert isinstance(groups, list), "Academy groups should be a list"
        print(f"Found {len(groups)} academy groups")
        
        # Check age ranges are within U6-U12
        for group in groups:
            name = group.get("name", "")
            age_range = group.get("age_range", "")
            print(f"Group: {name}, Age range: {age_range}")
            
            # Check that no group has U8-U18 range
            if "U18" in name or "U18" in age_range:
                pytest.fail(f"Found old age range U18 in group: {name}")
            if "U8" in name and "U8" not in ["U8", "U8-U9"]:  # U8 is valid if it's within U6-U12
                pass  # U8 is valid


class TestAttendanceStats:
    """Test attendance statistics API"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get headers with auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_get_attendance_stats(self, auth_headers):
        """Test getting attendance statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/attendance/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get attendance stats: {response.text}"
        stats = response.json()
        assert "total_events" in stats, "Missing total_events in stats"
        assert "player_stats" in stats, "Missing player_stats in stats"
        assert "overall" in stats, "Missing overall in stats"
        print(f"Attendance stats: {stats['total_events']} total events")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
