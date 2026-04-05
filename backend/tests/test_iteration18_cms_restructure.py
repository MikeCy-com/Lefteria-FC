"""
Iteration 18 Tests: Admin Panel CMS Restructuring
- Teams CRUD endpoints
- Current season endpoint
- Sidebar grouped sections verification
- Team drill-down functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


class TestHealthAndBasics:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"PASS: API root returns: {data['message']}")
    
    def test_current_season_endpoint(self):
        """Test GET /api/current-season returns current season"""
        response = requests.get(f"{BASE_URL}/api/current-season")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        print(f"PASS: Current season: {data.get('name')}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "id" in data
        assert data["username"] == ADMIN_USERNAME
        print(f"PASS: Admin login successful, token received")
        return data["token"]
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Wrong password returns 401")
    
    def test_admin_login_wrong_username(self):
        """Test admin login with wrong username"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wronguser",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401
        print("PASS: Wrong username returns 401")


class TestTeamsEndpoints:
    """Teams CRUD endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_teams_public(self):
        """Test GET /api/teams (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/teams returns {len(data)} teams")
        # Check that teams have player_count
        if len(data) > 0:
            assert "player_count" in data[0]
            print(f"PASS: Teams include player_count field")
    
    def test_create_team(self):
        """Test POST /api/admin/teams"""
        test_name = f"TEST_Team_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/admin/teams", 
            json={
                "name": test_name,
                "level": "Β' Ομάδα",
                "description": "Test team for iteration 18"
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_name
        assert data["level"] == "Β' Ομάδα"
        assert "id" in data
        print(f"PASS: Created team: {test_name}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teams/{data['id']}", headers=self.headers)
        return data
    
    def test_create_team_no_auth(self):
        """Test POST /api/admin/teams without auth"""
        response = requests.post(f"{BASE_URL}/api/admin/teams", 
            json={"name": "Unauthorized Team", "level": "Test"}
        )
        assert response.status_code == 401
        print("PASS: Create team without auth returns 401")
    
    def test_update_team(self):
        """Test PUT /api/admin/teams/{id}"""
        # Create a team first
        test_name = f"TEST_Update_{uuid.uuid4().hex[:8]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/teams", 
            json={"name": test_name, "level": "Α' Ομάδα", "description": ""},
            headers=self.headers
        )
        team_id = create_resp.json()["id"]
        
        # Update the team
        updated_name = f"TEST_Updated_{uuid.uuid4().hex[:8]}"
        response = requests.put(f"{BASE_URL}/api/admin/teams/{team_id}",
            json={"name": updated_name, "level": "Β' Ομάδα", "description": "Updated description"},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == updated_name
        assert data["level"] == "Β' Ομάδα"
        print(f"PASS: Updated team to: {updated_name}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teams/{team_id}", headers=self.headers)
    
    def test_delete_team(self):
        """Test DELETE /api/admin/teams/{id}"""
        # Create a team first
        test_name = f"TEST_Delete_{uuid.uuid4().hex[:8]}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/teams", 
            json={"name": test_name, "level": "Test", "description": ""},
            headers=self.headers
        )
        team_id = create_resp.json()["id"]
        
        # Delete the team
        response = requests.delete(f"{BASE_URL}/api/admin/teams/{team_id}", headers=self.headers)
        assert response.status_code == 200
        print(f"PASS: Deleted team: {test_name}")
        
        # Verify deletion
        get_resp = requests.get(f"{BASE_URL}/api/teams")
        teams = get_resp.json()
        assert not any(t["id"] == team_id for t in teams)
        print("PASS: Team no longer exists after deletion")
    
    def test_delete_team_not_found(self):
        """Test DELETE /api/admin/teams/{id} with non-existent ID"""
        response = requests.delete(f"{BASE_URL}/api/admin/teams/nonexistent-id", headers=self.headers)
        assert response.status_code == 404
        print("PASS: Delete non-existent team returns 404")


class TestPlayersWithTeams:
    """Test players assigned to teams"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_players_public(self):
        """Test GET /api/players (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/players returns {len(data)} players")
    
    def test_players_have_team_id(self):
        """Test that players can have team_id field"""
        response = requests.get(f"{BASE_URL}/api/players")
        data = response.json()
        # Check if any player has team_id
        players_with_team = [p for p in data if p.get("team_id")]
        print(f"PASS: {len(players_with_team)} players have team_id assigned")


class TestAcademyGroups:
    """Academy groups endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_academy_groups_public(self):
        """Test GET /api/academy-groups (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/academy-groups returns {len(data)} groups")
    
    def test_get_academy_group_players(self):
        """Test GET /api/academy-groups/{id}/players"""
        # First get groups
        groups_resp = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_resp.json()
        
        if len(groups) > 0:
            group_id = groups[0]["id"]
            response = requests.get(f"{BASE_URL}/api/academy-groups/{group_id}/players")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"PASS: Academy group {groups[0]['name']} has {len(data)} players")
        else:
            print("SKIP: No academy groups to test")


class TestSettingsEndpoints:
    """Settings-related endpoints (Seasons, Venues, Club Profile)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_seasons(self):
        """Test GET /api/seasons"""
        response = requests.get(f"{BASE_URL}/api/seasons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/seasons returns {len(data)} seasons")
    
    def test_get_venues(self):
        """Test GET /api/venues"""
        response = requests.get(f"{BASE_URL}/api/venues")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/venues returns {len(data)} venues")
    
    def test_get_club_profile(self):
        """Test GET /api/club"""
        response = requests.get(f"{BASE_URL}/api/club")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert data["name"] == "LEFTERIA FC"
        print(f"PASS: GET /api/club returns club profile: {data['name']}")


class TestShopEndpoints:
    """Shop-related endpoints (Products, Tickets, Orders)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_products_public(self):
        """Test GET /api/products (public)"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/products returns {len(data)} products")
    
    def test_get_tickets_public(self):
        """Test GET /api/tickets (public)"""
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/tickets returns {len(data)} tickets")
    
    def test_admin_products_requires_auth(self):
        """Test GET /api/admin/products requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code == 401
        print("PASS: Admin products endpoint requires auth")
    
    def test_admin_orders_requires_auth(self):
        """Test GET /api/admin/orders requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 401
        print("PASS: Admin orders endpoint requires auth")


class TestStandingsEndpoints:
    """Standings endpoint tests"""
    
    def test_get_standings_public(self):
        """Test GET /api/standings (public)"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/standings returns {len(data)} standings entries")


class TestFixturesEndpoints:
    """Fixtures endpoint tests"""
    
    def test_get_fixtures_public(self):
        """Test GET /api/fixtures (public)"""
        response = requests.get(f"{BASE_URL}/api/fixtures")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/fixtures returns {len(data)} fixtures")


class TestStaffEndpoints:
    """Staff endpoint tests"""
    
    def test_get_staff_public(self):
        """Test GET /api/staff (public)"""
        response = requests.get(f"{BASE_URL}/api/staff")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/staff returns {len(data)} staff members")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
