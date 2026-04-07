"""
Iteration 33 - Testing sidebar restructure and scoped opponents/venues
Tests:
1. Backend: GET /api/admin/opponents?team_type=Academy returns only Academy opponents
2. Backend: GET /api/admin/facilities?team_type=First%20Team returns only First Team venues
3. Backend: Create opponent with team_type
4. Backend: Create facility with team_type and location_url
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestScopedOpponentsAndVenues:
    """Test scoped opponents and venues with team_type filtering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("token")
        assert token, "No token in login response"
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Track created items for cleanup
        self.created_opponents = []
        self.created_facilities = []
        
        yield
        
        # Cleanup
        for opp_id in self.created_opponents:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/opponents/{opp_id}")
            except:
                pass
        for fac_id in self.created_facilities:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/facilities/{fac_id}")
            except:
                pass
    
    # ==================== OPPONENTS TESTS ====================
    
    def test_create_club_opponent(self):
        """Create opponent with team_type=First Team"""
        unique_name = f"TEST_Club_Opponent_{uuid.uuid4().hex[:6]}"
        response = self.session.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "First Team"
        })
        assert response.status_code == 200, f"Failed to create club opponent: {response.text}"
        data = response.json()
        assert "id" in data
        self.created_opponents.append(data["id"])
        
        # Verify it appears in First Team filter
        list_response = self.session.get(f"{BASE_URL}/api/admin/opponents?team_type=First%20Team")
        assert list_response.status_code == 200
        opponents = list_response.json()
        found = any(o["name"] == unique_name for o in opponents)
        assert found, f"Created opponent not found in First Team list"
        
        # Verify it does NOT appear in Academy filter
        academy_response = self.session.get(f"{BASE_URL}/api/admin/opponents?team_type=Academy")
        assert academy_response.status_code == 200
        academy_opponents = academy_response.json()
        found_in_academy = any(o["name"] == unique_name for o in academy_opponents)
        assert not found_in_academy, "Club opponent should NOT appear in Academy list"
    
    def test_create_academy_opponent(self):
        """Create opponent with team_type=Academy"""
        unique_name = f"TEST_Academy_Opponent_{uuid.uuid4().hex[:6]}"
        response = self.session.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "Academy"
        })
        assert response.status_code == 200, f"Failed to create academy opponent: {response.text}"
        data = response.json()
        assert "id" in data
        self.created_opponents.append(data["id"])
        
        # Verify it appears in Academy filter
        list_response = self.session.get(f"{BASE_URL}/api/admin/opponents?team_type=Academy")
        assert list_response.status_code == 200
        opponents = list_response.json()
        found = any(o["name"] == unique_name for o in opponents)
        assert found, f"Created opponent not found in Academy list"
        
        # Verify it does NOT appear in First Team filter
        club_response = self.session.get(f"{BASE_URL}/api/admin/opponents?team_type=First%20Team")
        assert club_response.status_code == 200
        club_opponents = club_response.json()
        found_in_club = any(o["name"] == unique_name for o in club_opponents)
        assert not found_in_club, "Academy opponent should NOT appear in First Team list"
    
    def test_get_opponents_without_filter(self):
        """GET /api/admin/opponents without filter returns all opponents"""
        response = self.session.get(f"{BASE_URL}/api/admin/opponents")
        assert response.status_code == 200
        opponents = response.json()
        assert isinstance(opponents, list)
    
    # ==================== FACILITIES/VENUES TESTS ====================
    
    def test_create_club_venue(self):
        """Create venue with team_type=First Team and location_url"""
        unique_name = f"TEST_Club_Venue_{uuid.uuid4().hex[:6]}"
        response = self.session.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "First Team",
            "address": "Test Address 123",
            "location_url": "https://maps.google.com/test-club-venue"
        })
        assert response.status_code == 200, f"Failed to create club venue: {response.text}"
        data = response.json()
        assert "id" in data
        self.created_facilities.append(data["id"])
        
        # Verify it appears in First Team filter
        list_response = self.session.get(f"{BASE_URL}/api/admin/facilities?team_type=First%20Team")
        assert list_response.status_code == 200
        facilities = list_response.json()
        found = next((f for f in facilities if f["name"] == unique_name), None)
        assert found, f"Created venue not found in First Team list"
        assert found.get("location_url") == "https://maps.google.com/test-club-venue", "location_url not saved"
        
        # Verify it does NOT appear in Academy filter
        academy_response = self.session.get(f"{BASE_URL}/api/admin/facilities?team_type=Academy")
        assert academy_response.status_code == 200
        academy_facilities = academy_response.json()
        found_in_academy = any(f["name"] == unique_name for f in academy_facilities)
        assert not found_in_academy, "Club venue should NOT appear in Academy list"
    
    def test_create_academy_venue(self):
        """Create venue with team_type=Academy"""
        unique_name = f"TEST_Academy_Venue_{uuid.uuid4().hex[:6]}"
        response = self.session.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "Academy",
            "address": "Academy Address 456",
            "location_url": "https://maps.google.com/test-academy-venue"
        })
        assert response.status_code == 200, f"Failed to create academy venue: {response.text}"
        data = response.json()
        assert "id" in data
        self.created_facilities.append(data["id"])
        
        # Verify it appears in Academy filter
        list_response = self.session.get(f"{BASE_URL}/api/admin/facilities?team_type=Academy")
        assert list_response.status_code == 200
        facilities = list_response.json()
        found = next((f for f in facilities if f["name"] == unique_name), None)
        assert found, f"Created venue not found in Academy list"
        
        # Verify it does NOT appear in First Team filter
        club_response = self.session.get(f"{BASE_URL}/api/admin/facilities?team_type=First%20Team")
        assert club_response.status_code == 200
        club_facilities = club_response.json()
        found_in_club = any(f["name"] == unique_name for f in club_facilities)
        assert not found_in_club, "Academy venue should NOT appear in First Team list"
    
    def test_get_facilities_without_filter(self):
        """GET /api/admin/facilities without filter returns all facilities"""
        response = self.session.get(f"{BASE_URL}/api/admin/facilities")
        assert response.status_code == 200
        facilities = response.json()
        assert isinstance(facilities, list)
    
    # ==================== DASHBOARD ENDPOINTS ====================
    
    def test_events_endpoint(self):
        """GET /api/admin/events for calendar dashboard"""
        response = self.session.get(f"{BASE_URL}/api/admin/events")
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
    
    def test_training_sessions_endpoint(self):
        """GET /api/admin/training-sessions for calendar dashboard"""
        response = self.session.get(f"{BASE_URL}/api/admin/training-sessions")
        assert response.status_code == 200
        sessions = response.json()
        assert isinstance(sessions, list)
    
    def test_fixtures_endpoint(self):
        """GET /api/fixtures for calendar dashboard"""
        response = self.session.get(f"{BASE_URL}/api/fixtures")
        assert response.status_code == 200
        fixtures = response.json()
        assert isinstance(fixtures, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
