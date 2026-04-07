"""
Iteration 31 - Test new features:
1. Training Sessions with venue/location fields (single + bulk)
2. Team CRUD with banner_url field
3. Academy Group CRUD with banner_url field
4. Admin image upload endpoint
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuth:
    """Admin authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Verify admin login works"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print(f"Admin login successful, token length: {len(admin_token)}")


class TestTrainingSessions:
    """Training session CRUD with venue/location fields"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_create_single_training_session_with_venue(self, auth_headers):
        """Test creating single training session with venue/location fields"""
        session_data = {
            "title": "TEST_Training Session",
            "date": "2026-02-15",
            "start_time": "16:00",
            "duration_minutes": 90,
            "intensity": "high",
            "venue": "Γήπεδο Λευτεριά",
            "venue_id": "venue-001",
            "location": "Λευκωσία, Κύπρος",
            "location_url": "https://maps.google.com/?q=35.1856,33.3823",
            "arrival_time": "15:30",
            "tags": ["τακτική", "φυσική κατάσταση"],
            "notes": "Test session with venue fields"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/training-sessions",
            json=session_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify all venue fields are returned
        assert data.get("venue") == "Γήπεδο Λευτεριά", f"venue mismatch: {data.get('venue')}"
        assert data.get("location") == "Λευκωσία, Κύπρος", f"location mismatch: {data.get('location')}"
        assert data.get("location_url") == "https://maps.google.com/?q=35.1856,33.3823"
        assert data.get("arrival_time") == "15:30"
        assert data.get("venue_id") == "venue-001"
        assert "id" in data
        
        print(f"Created training session with venue: {data['id']}")
        return data["id"]
    
    def test_get_training_sessions_returns_venue_data(self, auth_headers):
        """Test that GET training sessions returns venue/location fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/training-sessions",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"GET failed: {response.text}"
        sessions = response.json()
        
        # Find our test session
        test_sessions = [s for s in sessions if s.get("title", "").startswith("TEST_")]
        if test_sessions:
            session = test_sessions[0]
            # Verify venue fields exist in response
            assert "venue" in session, "venue field missing from response"
            assert "location" in session, "location field missing from response"
            print(f"Training session has venue: {session.get('venue')}, location: {session.get('location')}")
        
        print(f"Retrieved {len(sessions)} training sessions")
    
    def test_bulk_training_sessions_with_venue(self, auth_headers):
        """Test bulk training session creation with venue/location fields"""
        # Create sessions for next week
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        
        bulk_data = {
            "title": "TEST_Bulk Training",
            "days_of_week": [0, 2, 4],  # Mon, Wed, Fri
            "start_time": "17:00",
            "duration_minutes": 75,
            "intensity": "medium",
            "season_start": start_date,
            "season_end": end_date,
            "venue": "Κεντρικό Γήπεδο",
            "venue_id": "venue-002",
            "location": "Λεμεσός, Κύπρος",
            "location_url": "https://maps.google.com/?q=34.6786,33.0413",
            "arrival_time": "16:30",
            "tags": ["ομαδική"],
            "notes": "Bulk created test sessions"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/training-sessions/bulk",
            json=bulk_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Bulk create failed: {response.text}"
        data = response.json()
        
        assert "count" in data, "count field missing from bulk response"
        assert data["count"] > 0, "No sessions created"
        
        print(f"Bulk created {data['count']} training sessions")
        
        # Verify the created sessions have venue data
        response = requests.get(
            f"{BASE_URL}/api/admin/training-sessions",
            headers=auth_headers
        )
        sessions = response.json()
        bulk_sessions = [s for s in sessions if s.get("title", "").startswith("TEST_Bulk")]
        
        if bulk_sessions:
            session = bulk_sessions[0]
            assert session.get("venue") == "Κεντρικό Γήπεδο", f"Bulk venue mismatch: {session.get('venue')}"
            assert session.get("location") == "Λεμεσός, Κύπρος"
            assert session.get("location_url") == "https://maps.google.com/?q=34.6786,33.0413"
            assert session.get("arrival_time") == "16:30"
            print(f"Verified bulk session has venue data: {session.get('venue')}")


class TestTeamBannerUrl:
    """Team CRUD with banner_url field"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_create_team_with_banner_url(self, auth_headers):
        """Test creating team with banner_url field"""
        team_data = {
            "name": "TEST_Team With Banner",
            "level": "Β' Ομάδα",
            "description": "Test team with banner",
            "banner_url": "/api/uploads/players/test_banner.jpg"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/teams",
            json=team_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Create team failed: {response.text}"
        data = response.json()
        
        assert data.get("name") == "TEST_Team With Banner"
        assert data.get("banner_url") == "/api/uploads/players/test_banner.jpg", f"banner_url mismatch: {data.get('banner_url')}"
        assert "id" in data
        
        print(f"Created team with banner_url: {data['id']}")
        return data["id"]
    
    def test_get_teams_returns_banner_url(self, auth_headers):
        """Test that GET teams returns banner_url field"""
        response = requests.get(
            f"{BASE_URL}/api/teams",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"GET teams failed: {response.text}"
        teams = response.json()
        
        # Find our test team
        test_teams = [t for t in teams if t.get("name", "").startswith("TEST_")]
        if test_teams:
            team = test_teams[0]
            assert "banner_url" in team, "banner_url field missing from team response"
            print(f"Team has banner_url: {team.get('banner_url')}")
        
        print(f"Retrieved {len(teams)} teams")
    
    def test_update_team_banner_url(self, auth_headers):
        """Test updating team banner_url"""
        # First get existing teams
        response = requests.get(f"{BASE_URL}/api/teams", headers=auth_headers)
        teams = response.json()
        test_teams = [t for t in teams if t.get("name", "").startswith("TEST_")]
        
        if not test_teams:
            pytest.skip("No test team found to update")
        
        team = test_teams[0]
        team_id = team["id"]
        
        # Update with new banner_url
        update_data = {
            "name": team["name"],
            "level": team.get("level", "Α' Ομάδα"),
            "description": team.get("description", ""),
            "banner_url": "/api/uploads/players/updated_banner.jpg"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/teams/{team_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Update team failed: {response.text}"
        data = response.json()
        
        assert data.get("banner_url") == "/api/uploads/players/updated_banner.jpg"
        print(f"Updated team banner_url successfully")


class TestAcademyGroupBannerUrl:
    """Academy Group CRUD with banner_url field"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_create_academy_group_with_banner_url(self, auth_headers):
        """Test creating academy group with banner_url field"""
        group_data = {
            "name": "TEST_U12 Academy",
            "age_range": "10-12 ετών",
            "training_schedule": "Τρίτη & Πέμπτη 16:00-17:30",
            "description": "Test academy group with banner",
            "max_players": 20,
            "season": "2025/26",
            "banner_url": "/api/uploads/players/academy_banner.jpg"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/academy-groups",
            json=group_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Create academy group failed: {response.text}"
        data = response.json()
        
        assert data.get("name") == "TEST_U12 Academy"
        assert data.get("banner_url") == "/api/uploads/players/academy_banner.jpg", f"banner_url mismatch: {data.get('banner_url')}"
        assert "id" in data
        
        print(f"Created academy group with banner_url: {data['id']}")
        return data["id"]
    
    def test_get_academy_groups_returns_banner_url(self, auth_headers):
        """Test that GET academy groups returns banner_url field"""
        response = requests.get(
            f"{BASE_URL}/api/academy-groups",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"GET academy groups failed: {response.text}"
        groups = response.json()
        
        # Find our test group
        test_groups = [g for g in groups if g.get("name", "").startswith("TEST_")]
        if test_groups:
            group = test_groups[0]
            assert "banner_url" in group, "banner_url field missing from academy group response"
            print(f"Academy group has banner_url: {group.get('banner_url')}")
        
        print(f"Retrieved {len(groups)} academy groups")
    
    def test_update_academy_group_banner_url(self, auth_headers):
        """Test updating academy group banner_url"""
        # First get existing groups
        response = requests.get(f"{BASE_URL}/api/academy-groups", headers=auth_headers)
        groups = response.json()
        test_groups = [g for g in groups if g.get("name", "").startswith("TEST_")]
        
        if not test_groups:
            pytest.skip("No test academy group found to update")
        
        group = test_groups[0]
        group_id = group["id"]
        
        # Update with new banner_url
        update_data = {
            "name": group["name"],
            "age_range": group.get("age_range", "10-12 ετών"),
            "training_schedule": group.get("training_schedule", ""),
            "description": group.get("description", ""),
            "max_players": group.get("max_players", 25),
            "season": group.get("season", "2025/26"),
            "banner_url": "/api/uploads/players/updated_academy_banner.jpg"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/academy-groups/{group_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Update academy group failed: {response.text}"
        data = response.json()
        
        assert data.get("banner_url") == "/api/uploads/players/updated_academy_banner.jpg"
        print(f"Updated academy group banner_url successfully")


class TestImageUpload:
    """Admin image upload endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_upload_image_returns_image_url(self, auth_headers):
        """Test that image upload returns image_url field"""
        # Create a simple test image (1x1 pixel PNG)
        import base64
        # Minimal valid PNG
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            "file": ("test_image.png", png_data, "image/png")
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/upload-image",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Image upload failed: {response.text}"
        data = response.json()
        
        # server.py returns {image_url: ...}
        assert "image_url" in data, f"image_url field missing from response: {data}"
        assert data["image_url"].startswith("/api/uploads/"), f"Invalid image_url format: {data['image_url']}"
        
        print(f"Uploaded image, got URL: {data['image_url']}")
        
        # Verify the image is accessible
        image_response = requests.get(f"{BASE_URL}{data['image_url']}")
        assert image_response.status_code == 200, f"Uploaded image not accessible: {image_response.status_code}"
        print("Verified uploaded image is accessible")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_cleanup_test_training_sessions(self, auth_headers):
        """Clean up TEST_ prefixed training sessions"""
        response = requests.get(f"{BASE_URL}/api/admin/training-sessions", headers=auth_headers)
        sessions = response.json()
        
        deleted = 0
        for session in sessions:
            if session.get("title", "").startswith("TEST_"):
                del_response = requests.delete(
                    f"{BASE_URL}/api/admin/training-sessions/{session['id']}",
                    headers=auth_headers
                )
                if del_response.status_code == 200:
                    deleted += 1
        
        print(f"Cleaned up {deleted} test training sessions")
    
    def test_cleanup_test_teams(self, auth_headers):
        """Clean up TEST_ prefixed teams"""
        response = requests.get(f"{BASE_URL}/api/teams", headers=auth_headers)
        teams = response.json()
        
        deleted = 0
        for team in teams:
            if team.get("name", "").startswith("TEST_"):
                del_response = requests.delete(
                    f"{BASE_URL}/api/admin/teams/{team['id']}",
                    headers=auth_headers
                )
                if del_response.status_code == 200:
                    deleted += 1
        
        print(f"Cleaned up {deleted} test teams")
    
    def test_cleanup_test_academy_groups(self, auth_headers):
        """Clean up TEST_ prefixed academy groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups", headers=auth_headers)
        groups = response.json()
        
        deleted = 0
        for group in groups:
            if group.get("name", "").startswith("TEST_"):
                del_response = requests.delete(
                    f"{BASE_URL}/api/admin/academy-groups/{group['id']}",
                    headers=auth_headers
                )
                if del_response.status_code == 200:
                    deleted += 1
        
        print(f"Cleaned up {deleted} test academy groups")
