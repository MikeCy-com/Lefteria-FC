"""
Iteration 32 - Testing scoped opponents and venues with team_type field
Tests:
1. Opponents CRUD with team_type filter (Academy vs First Team)
2. Facilities CRUD with team_type and location_url fields
3. Verify filtering by team_type works correctly
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "Lefteria FC",
        "password": "L3ft3r1@FC#2024$Secure!"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")

@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestOpponentsCRUD:
    """Test opponents CRUD with team_type scoping"""
    
    def test_create_opponent_first_team(self, auth_headers):
        """Create opponent with team_type=First Team"""
        unique_name = f"TEST_FirstTeamOpp_{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "First Team",
            "venue": "Test Stadium",
            "location_url": "https://maps.google.com/test-first-team"
        }, headers=auth_headers)
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data.get("message") == "Opponent created"
        
        # Store for cleanup
        self.first_team_opp_id = data["id"]
        self.first_team_opp_name = unique_name
        return data["id"]
    
    def test_create_opponent_academy(self, auth_headers):
        """Create opponent with team_type=Academy"""
        unique_name = f"TEST_AcademyOpp_{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "Academy",
            "venue": "Academy Field",
            "location_url": "https://maps.google.com/test-academy"
        }, headers=auth_headers)
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        
        self.academy_opp_id = data["id"]
        self.academy_opp_name = unique_name
        return data["id"]
    
    def test_get_opponents_filter_first_team(self, auth_headers):
        """GET opponents filtered by team_type=First Team"""
        # First create a First Team opponent
        unique_name = f"TEST_FT_Filter_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "First Team"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # Get filtered list
        response = requests.get(f"{BASE_URL}/api/admin/opponents?team_type=First%20Team", headers=auth_headers)
        assert response.status_code == 200, f"GET failed: {response.text}"
        
        opponents = response.json()
        assert isinstance(opponents, list)
        
        # All returned opponents should have team_type=First Team
        for opp in opponents:
            assert opp.get("team_type") == "First Team", f"Found non-First Team opponent: {opp}"
        
        # Our created opponent should be in the list
        found = any(o["id"] == created_id for o in opponents)
        assert found, f"Created opponent {created_id} not found in filtered list"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/opponents/{created_id}", headers=auth_headers)
    
    def test_get_opponents_filter_academy(self, auth_headers):
        """GET opponents filtered by team_type=Academy"""
        # First create an Academy opponent
        unique_name = f"TEST_Acad_Filter_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "Academy"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # Get filtered list
        response = requests.get(f"{BASE_URL}/api/admin/opponents?team_type=Academy", headers=auth_headers)
        assert response.status_code == 200, f"GET failed: {response.text}"
        
        opponents = response.json()
        assert isinstance(opponents, list)
        
        # All returned opponents should have team_type=Academy
        for opp in opponents:
            assert opp.get("team_type") == "Academy", f"Found non-Academy opponent: {opp}"
        
        # Our created opponent should be in the list
        found = any(o["id"] == created_id for o in opponents)
        assert found, f"Created opponent {created_id} not found in filtered list"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/opponents/{created_id}", headers=auth_headers)
    
    def test_get_opponents_no_filter_returns_all(self, auth_headers):
        """GET opponents without filter returns all opponents"""
        response = requests.get(f"{BASE_URL}/api/admin/opponents", headers=auth_headers)
        assert response.status_code == 200, f"GET failed: {response.text}"
        
        opponents = response.json()
        assert isinstance(opponents, list)
        # Should return opponents (may include both types)
    
    def test_update_opponent_location_url(self, auth_headers):
        """Update opponent's location_url field"""
        # Create opponent
        unique_name = f"TEST_UpdateOpp_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "First Team",
            "location_url": "https://maps.google.com/original"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        opp_id = create_resp.json()["id"]
        
        # Update location_url
        update_resp = requests.put(f"{BASE_URL}/api/admin/opponents/{opp_id}", json={
            "location_url": "https://maps.google.com/updated"
        }, headers=auth_headers)
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        # Verify update
        get_resp = requests.get(f"{BASE_URL}/api/admin/opponents?team_type=First%20Team", headers=auth_headers)
        opponents = get_resp.json()
        updated_opp = next((o for o in opponents if o["id"] == opp_id), None)
        assert updated_opp is not None
        assert updated_opp.get("location_url") == "https://maps.google.com/updated"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/opponents/{opp_id}", headers=auth_headers)
    
    def test_delete_opponent(self, auth_headers):
        """Delete opponent"""
        # Create opponent
        unique_name = f"TEST_DeleteOpp_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/opponents", json={
            "name": unique_name,
            "team_type": "Academy"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        opp_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/opponents/{opp_id}", headers=auth_headers)
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        
        # Verify deleted
        get_resp = requests.get(f"{BASE_URL}/api/admin/opponents", headers=auth_headers)
        opponents = get_resp.json()
        found = any(o["id"] == opp_id for o in opponents)
        assert not found, "Opponent still exists after deletion"


class TestFacilitiesCRUD:
    """Test facilities CRUD with team_type and location_url fields"""
    
    def test_create_facility_first_team_with_location_url(self, auth_headers):
        """Create facility with team_type=First Team and location_url"""
        unique_name = f"TEST_FTFacility_{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "First Team",
            "type": "field",
            "surface": "grass",
            "address": "123 Test Street",
            "location_url": "https://maps.google.com/first-team-facility"
        }, headers=auth_headers)
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        
        self.ft_facility_id = data["id"]
        return data["id"]
    
    def test_create_facility_academy_with_location_url(self, auth_headers):
        """Create facility with team_type=Academy and location_url"""
        unique_name = f"TEST_AcadFacility_{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "Academy",
            "type": "field",
            "surface": "turf",
            "address": "456 Academy Road",
            "location_url": "https://maps.google.com/academy-facility"
        }, headers=auth_headers)
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        
        self.acad_facility_id = data["id"]
        return data["id"]
    
    def test_get_facilities_filter_academy(self, auth_headers):
        """GET facilities filtered by team_type=Academy returns only Academy facilities with location_url"""
        # Create Academy facility
        unique_name = f"TEST_AcadFilter_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "Academy",
            "location_url": "https://maps.google.com/academy-test"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # Get filtered list
        response = requests.get(f"{BASE_URL}/api/admin/facilities?team_type=Academy", headers=auth_headers)
        assert response.status_code == 200, f"GET failed: {response.text}"
        
        facilities = response.json()
        assert isinstance(facilities, list)
        
        # All returned facilities should have team_type=Academy
        for fac in facilities:
            assert fac.get("team_type") == "Academy", f"Found non-Academy facility: {fac}"
        
        # Our created facility should be in the list with location_url
        created_fac = next((f for f in facilities if f["id"] == created_id), None)
        assert created_fac is not None, f"Created facility {created_id} not found"
        assert created_fac.get("location_url") == "https://maps.google.com/academy-test"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/facilities/{created_id}", headers=auth_headers)
    
    def test_get_facilities_filter_first_team(self, auth_headers):
        """GET facilities filtered by team_type=First Team"""
        # Create First Team facility
        unique_name = f"TEST_FTFilter_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "First Team",
            "location_url": "https://maps.google.com/ft-test"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # Get filtered list
        response = requests.get(f"{BASE_URL}/api/admin/facilities?team_type=First%20Team", headers=auth_headers)
        assert response.status_code == 200, f"GET failed: {response.text}"
        
        facilities = response.json()
        assert isinstance(facilities, list)
        
        # All returned facilities should have team_type=First Team
        for fac in facilities:
            assert fac.get("team_type") == "First Team", f"Found non-First Team facility: {fac}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/facilities/{created_id}", headers=auth_headers)
    
    def test_update_facility_location_url(self, auth_headers):
        """PUT /api/admin/facilities/{id} can update location_url field"""
        # Create facility
        unique_name = f"TEST_UpdateFac_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "Academy",
            "location_url": "https://maps.google.com/original-location"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        fac_id = create_resp.json()["id"]
        
        # Update location_url
        update_resp = requests.put(f"{BASE_URL}/api/admin/facilities/{fac_id}", json={
            "location_url": "https://maps.google.com/updated-location"
        }, headers=auth_headers)
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        # Verify update
        get_resp = requests.get(f"{BASE_URL}/api/admin/facilities?team_type=Academy", headers=auth_headers)
        facilities = get_resp.json()
        updated_fac = next((f for f in facilities if f["id"] == fac_id), None)
        assert updated_fac is not None
        assert updated_fac.get("location_url") == "https://maps.google.com/updated-location"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/facilities/{fac_id}", headers=auth_headers)
    
    def test_delete_facility(self, auth_headers):
        """Delete facility (soft delete - sets is_active=False)"""
        # Create facility
        unique_name = f"TEST_DeleteFac_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "First Team"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        fac_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/facilities/{fac_id}", headers=auth_headers)
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        
        # Verify not in active list (soft delete)
        get_resp = requests.get(f"{BASE_URL}/api/admin/facilities", headers=auth_headers)
        facilities = get_resp.json()
        found = any(f["id"] == fac_id for f in facilities)
        assert not found, "Facility still in active list after deletion"


class TestVenueAutoPopulateLocationUrl:
    """Test that selecting a venue auto-populates location_url in fixture forms"""
    
    def test_facility_has_location_url_field(self, auth_headers):
        """Verify facility response includes location_url field"""
        # Create facility with location_url
        unique_name = f"TEST_LocUrl_{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/facilities", json={
            "name": unique_name,
            "team_type": "Academy",
            "location_url": "https://maps.google.com/test-venue"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        fac_id = create_resp.json()["id"]
        
        # Get facilities and verify location_url is returned
        get_resp = requests.get(f"{BASE_URL}/api/admin/facilities?team_type=Academy", headers=auth_headers)
        facilities = get_resp.json()
        
        fac = next((f for f in facilities if f["id"] == fac_id), None)
        assert fac is not None
        assert "location_url" in fac, "location_url field missing from facility response"
        assert fac["location_url"] == "https://maps.google.com/test-venue"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/facilities/{fac_id}", headers=auth_headers)


class TestCleanup:
    """Cleanup any remaining test data"""
    
    def test_cleanup_test_opponents(self, auth_headers):
        """Remove any TEST_ prefixed opponents"""
        response = requests.get(f"{BASE_URL}/api/admin/opponents", headers=auth_headers)
        if response.status_code == 200:
            opponents = response.json()
            for opp in opponents:
                if opp.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/opponents/{opp['id']}", headers=auth_headers)
    
    def test_cleanup_test_facilities(self, auth_headers):
        """Remove any TEST_ prefixed facilities"""
        response = requests.get(f"{BASE_URL}/api/admin/facilities", headers=auth_headers)
        if response.status_code == 200:
            facilities = response.json()
            for fac in facilities:
                if fac.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/facilities/{fac['id']}", headers=auth_headers)
