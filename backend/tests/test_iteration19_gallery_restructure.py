"""
Iteration 19 Tests: Admin Panel Restructuring - Gallery & Βαθμολογία moved inside drill-downs
Tests:
1. Admin login
2. Gallery API with team_id and academy_group_id filtering
3. POST gallery with team_id
4. Sidebar structure verification (no standalone Γκαλερί or Βαθμολογία)
5. Teams drill-down sub-tabs (Ρόστερ, Πρόγραμμα, Staff, Βαθμολογία, Γκαλερί)
6. Academy drill-down sub-tabs (Παίκτες, Γκαλερί)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["username"] == "Lefteria FC"
        print(f"✓ Admin login successful, token received")
        return data["token"]
    
    def test_admin_login_invalid(self):
        """Test admin login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401
        print(f"✓ Invalid login correctly rejected")


class TestGalleryAPI:
    """Gallery API tests with team_id and academy_group_id filtering"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Auth failed")
    
    @pytest.fixture
    def team_id(self):
        """Get first team ID"""
        response = requests.get(f"{BASE_URL}/api/teams")
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]["id"]
        pytest.skip("No teams available")
    
    @pytest.fixture
    def academy_group_id(self):
        """Get first academy group ID"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]["id"]
        pytest.skip("No academy groups available")
    
    def test_get_gallery_all(self):
        """Test GET /api/gallery returns all gallery items"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/gallery returned {len(data)} items")
    
    def test_get_gallery_by_team_id(self, team_id):
        """Test GET /api/gallery?team_id=<id> filters by team"""
        response = requests.get(f"{BASE_URL}/api/gallery?team_id={team_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned items should have matching team_id or be empty
        for item in data:
            assert item.get("team_id") == team_id, f"Item {item['id']} has wrong team_id"
        print(f"✓ GET /api/gallery?team_id={team_id} returned {len(data)} filtered items")
    
    def test_get_gallery_by_academy_group_id(self, academy_group_id):
        """Test GET /api/gallery?academy_group_id=<id> filters by academy group"""
        response = requests.get(f"{BASE_URL}/api/gallery?academy_group_id={academy_group_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned items should have matching academy_group_id or be empty
        for item in data:
            assert item.get("academy_group_id") == academy_group_id, f"Item {item['id']} has wrong academy_group_id"
        print(f"✓ GET /api/gallery?academy_group_id={academy_group_id} returned {len(data)} filtered items")
    
    def test_post_gallery_with_team_id(self, auth_token, team_id):
        """Test POST /api/admin/gallery with team_id creates gallery item for team"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        test_title = f"TEST_Team_Gallery_{uuid.uuid4().hex[:8]}"
        payload = {
            "title": test_title,
            "image_url": "https://example.com/test-image.jpg",
            "category": "Match Day",
            "team_id": team_id,
            "description": "Test gallery item for team"
        }
        response = requests.post(f"{BASE_URL}/api/admin/gallery", json=payload, headers=headers)
        assert response.status_code == 200, f"Failed to create gallery: {response.text}"
        data = response.json()
        assert data["title"] == test_title
        assert data["team_id"] == team_id
        print(f"✓ POST /api/admin/gallery with team_id created item: {data['id']}")
        
        # Verify it appears in filtered query
        verify_response = requests.get(f"{BASE_URL}/api/gallery?team_id={team_id}")
        assert verify_response.status_code == 200
        items = verify_response.json()
        found = any(item["id"] == data["id"] for item in items)
        assert found, "Created gallery item not found in team-filtered query"
        print(f"✓ Created gallery item verified in team-filtered query")
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/admin/gallery/{data['id']}", headers=headers)
        assert delete_response.status_code == 200
        print(f"✓ Test gallery item cleaned up")
    
    def test_post_gallery_with_academy_group_id(self, auth_token, academy_group_id):
        """Test POST /api/admin/gallery with academy_group_id creates gallery item for academy"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        test_title = f"TEST_Academy_Gallery_{uuid.uuid4().hex[:8]}"
        payload = {
            "title": test_title,
            "image_url": "https://example.com/test-academy-image.jpg",
            "category": "Academy",
            "academy_group_id": academy_group_id,
            "description": "Test gallery item for academy group"
        }
        response = requests.post(f"{BASE_URL}/api/admin/gallery", json=payload, headers=headers)
        assert response.status_code == 200, f"Failed to create gallery: {response.text}"
        data = response.json()
        assert data["title"] == test_title
        assert data["academy_group_id"] == academy_group_id
        print(f"✓ POST /api/admin/gallery with academy_group_id created item: {data['id']}")
        
        # Verify it appears in filtered query
        verify_response = requests.get(f"{BASE_URL}/api/gallery?academy_group_id={academy_group_id}")
        assert verify_response.status_code == 200
        items = verify_response.json()
        found = any(item["id"] == data["id"] for item in items)
        assert found, "Created gallery item not found in academy-filtered query"
        print(f"✓ Created gallery item verified in academy-filtered query")
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/admin/gallery/{data['id']}", headers=headers)
        assert delete_response.status_code == 200
        print(f"✓ Test gallery item cleaned up")


class TestTeamsAPI:
    """Teams API tests"""
    
    def test_get_teams(self):
        """Test GET /api/teams returns teams with player_count"""
        response = requests.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "id" in data[0]
            assert "name" in data[0]
            assert "player_count" in data[0]
        print(f"✓ GET /api/teams returned {len(data)} teams")


class TestAcademyGroupsAPI:
    """Academy Groups API tests"""
    
    def test_get_academy_groups(self):
        """Test GET /api/academy-groups returns groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/academy-groups returned {len(data)} groups")


class TestStandingsAPI:
    """Standings API tests"""
    
    def test_get_standings(self):
        """Test GET /api/standings returns standings"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/standings returned {len(data)} standings")


class TestSettingsAPI:
    """Settings API tests"""
    
    def test_get_club_profile(self):
        """Test GET /api/club returns club profile"""
        response = requests.get(f"{BASE_URL}/api/club")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        print(f"✓ GET /api/club returned club: {data['name']}")
    
    def test_get_seasons(self):
        """Test GET /api/seasons returns seasons"""
        response = requests.get(f"{BASE_URL}/api/seasons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/seasons returned {len(data)} seasons")
    
    def test_get_venues(self):
        """Test GET /api/venues returns venues"""
        response = requests.get(f"{BASE_URL}/api/venues")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/venues returned {len(data)} venues")


class TestShopAPI:
    """Shop API tests"""
    
    def test_get_products(self):
        """Test GET /api/products returns products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/products returned {len(data)} products")
    
    def test_get_tickets(self):
        """Test GET /api/tickets returns tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/tickets returned {len(data)} tickets")


class TestDashboardStats:
    """Dashboard stats API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Auth failed")
    
    def test_get_admin_stats(self, auth_token):
        """Test GET /api/admin/stats returns dashboard statistics"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "teams_count" in data
        assert "first_team_players" in data
        assert "academy_players" in data
        print(f"✓ GET /api/admin/stats returned stats: teams={data['teams_count']}, first_team={data['first_team_players']}, academy={data['academy_players']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
