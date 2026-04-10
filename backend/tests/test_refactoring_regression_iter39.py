"""
Regression tests for iteration 39 - Backend refactoring verification.
Tests that extracted modules (models.py, auth.py, database.py) work correctly.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"

# Mobile test phone
PARENT_PHONE = "99555666"


class TestBasicEndpoints:
    """Test basic API endpoints work after refactoring"""
    
    def test_api_root_returns_welcome(self):
        """GET /api/ returns welcome message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "LEFTERIA FC" in data["message"]
        print("✓ API root endpoint working")
    
    def test_players_endpoint(self):
        """GET /api/players returns players list"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            player = data[0]
            # Verify Player model fields from models.py
            assert "id" in player
            assert "name" in player
            assert "position" in player
            assert "team_type" in player
        print(f"✓ Players endpoint working - {len(data)} players returned")
    
    def test_fixtures_endpoint(self):
        """GET /api/fixtures returns fixtures list"""
        response = requests.get(f"{BASE_URL}/api/fixtures")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            fixture = data[0]
            # Verify Fixture model fields from models.py
            assert "id" in fixture
            assert "home_team" in fixture
            assert "away_team" in fixture
            assert "status" in fixture
        print(f"✓ Fixtures endpoint working - {len(data)} fixtures returned")
    
    def test_academy_groups_endpoint(self):
        """GET /api/academy-groups returns groups list"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            group = data[0]
            # Verify AcademyGroup model fields from models.py
            assert "id" in group
            assert "name" in group
            assert "age_range" in group
        print(f"✓ Academy groups endpoint working - {len(data)} groups returned")
    
    def test_teams_endpoint(self):
        """GET /api/teams returns teams list"""
        response = requests.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Teams endpoint working - {len(data)} teams returned")
    
    def test_staff_endpoint(self):
        """GET /api/staff returns staff list"""
        response = requests.get(f"{BASE_URL}/api/staff")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Staff endpoint working - {len(data)} staff returned")
    
    def test_standings_endpoint(self):
        """GET /api/standings returns standings list"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Standings endpoint working - {len(data)} standings returned")


class TestAuthModule:
    """Test auth.py module functions work correctly"""
    
    def test_admin_login_success(self):
        """POST /api/auth/login with correct credentials returns token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "id" in data
        assert "username" in data
        assert data["username"] == ADMIN_USERNAME
        print("✓ Admin login working - token received")
        return data["token"]
    
    def test_admin_login_wrong_password(self):
        """POST /api/auth/login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Admin login rejects wrong password")
    
    def test_admin_login_wrong_username(self):
        """POST /api/auth/login with wrong username returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "WrongUser", "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 401
        print("✓ Admin login rejects wrong username")
    
    def test_auth_me_with_token(self):
        """GET /api/auth/me with valid token returns user info"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        token = login_response.json()["token"]
        
        # Then check /auth/me
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert data["username"] == ADMIN_USERNAME
        print("✓ Auth /me endpoint working with token")
    
    def test_auth_me_without_token(self):
        """GET /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth /me rejects unauthenticated requests")


class TestAdminEndpoints:
    """Test admin endpoints require authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_admin_dashboard(self, auth_token):
        """GET /api/admin/dashboard returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Verify dashboard stats fields
        assert "first_team_players" in data
        assert "academy_players" in data
        assert "staff_members" in data
        assert "total_fixtures" in data
        print(f"✓ Admin dashboard working - {data['first_team_players']} first team, {data['academy_players']} academy players")
    
    def test_admin_dashboard_requires_auth(self):
        """GET /api/admin/dashboard without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        print("✓ Admin dashboard requires authentication")
    
    def test_admin_registrations(self, auth_token):
        """GET /api/admin/registrations returns registrations list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/registrations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin registrations endpoint working - {len(data)} registrations")
    
    def test_admin_products(self, auth_token):
        """GET /api/admin/products returns products list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin products endpoint working - {len(data)} products")
    
    def test_admin_tickets(self, auth_token):
        """GET /api/admin/tickets returns tickets list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/tickets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin tickets endpoint working - {len(data)} tickets")
    
    def test_admin_orders(self, auth_token):
        """GET /api/admin/orders returns orders list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin orders endpoint working - {len(data)} orders")


class TestMobileAuth:
    """Test mobile auth endpoints from mobile_auth.py"""
    
    def test_request_otp(self):
        """POST /api/mobile/auth/request-otp returns OTP in debug mode"""
        response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": PARENT_PHONE}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "OTP sent"
        assert "phone" in data
        assert "otp_debug" in data  # Simulated mode returns OTP
        assert "role_detected" in data
        assert data["role_detected"] == "parent"
        print(f"✓ Mobile OTP request working - OTP: {data['otp_debug']}")
        return data
    
    def test_verify_otp(self):
        """POST /api/mobile/auth/verify-otp with correct OTP returns token"""
        # First request OTP
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": PARENT_PHONE}
        )
        otp_code = otp_response.json()["otp_debug"]
        phone = otp_response.json()["phone"]
        
        # Then verify OTP
        response = requests.post(
            f"{BASE_URL}/api/mobile/auth/verify-otp",
            json={"phone": phone, "code": otp_code}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert "role" in data
        assert data["role"] == "parent"
        print(f"✓ Mobile OTP verify working - role: {data['role']}")
        return data["token"]
    
    def test_verify_otp_wrong_code(self):
        """POST /api/mobile/auth/verify-otp with wrong OTP returns 400"""
        # First request OTP
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": PARENT_PHONE}
        )
        phone = otp_response.json()["phone"]
        
        # Then verify with wrong OTP
        response = requests.post(
            f"{BASE_URL}/api/mobile/auth/verify-otp",
            json={"phone": phone, "code": "000000"}
        )
        assert response.status_code == 400
        print("✓ Mobile OTP verify rejects wrong code")


class TestMobileParentDashboard:
    """Test mobile parent dashboard endpoint"""
    
    @pytest.fixture
    def mobile_token(self):
        """Get mobile auth token"""
        # Request OTP
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": PARENT_PHONE}
        )
        otp_code = otp_response.json()["otp_debug"]
        phone = otp_response.json()["phone"]
        
        # Verify OTP
        verify_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/verify-otp",
            json={"phone": phone, "code": otp_code}
        )
        return verify_response.json()["token"]
    
    def test_parent_dashboard(self, mobile_token):
        """GET /api/mobile/parent/dashboard returns dashboard data"""
        response = requests.get(
            f"{BASE_URL}/api/mobile/parent/dashboard",
            headers={"Authorization": f"Bearer {mobile_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Verify dashboard fields
        assert "children" in data
        assert "groups" in data
        assert "fixtures" in data
        assert "events" in data
        assert "announcements" in data
        print(f"✓ Mobile parent dashboard working - {len(data['children'])} children, {len(data['groups'])} groups")
    
    def test_parent_dashboard_requires_auth(self):
        """GET /api/mobile/parent/dashboard without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard")
        assert response.status_code == 401
        print("✓ Mobile parent dashboard requires authentication")


class TestModelsIntegrity:
    """Test that Pydantic models from models.py work correctly"""
    
    def test_player_model_fields(self):
        """Verify Player model has all expected fields"""
        response = requests.get(f"{BASE_URL}/api/players")
        if response.status_code == 200 and len(response.json()) > 0:
            player = response.json()[0]
            expected_fields = [
                "id", "name", "number", "position", "nationality",
                "team_type", "is_active", "statistics"
            ]
            for field in expected_fields:
                assert field in player, f"Missing field: {field}"
            print("✓ Player model has all expected fields")
    
    def test_fixture_model_fields(self):
        """Verify Fixture model has all expected fields"""
        response = requests.get(f"{BASE_URL}/api/fixtures")
        if response.status_code == 200 and len(response.json()) > 0:
            fixture = response.json()[0]
            expected_fields = [
                "id", "home_team", "away_team", "match_date",
                "venue", "competition", "status"
            ]
            for field in expected_fields:
                assert field in fixture, f"Missing field: {field}"
            print("✓ Fixture model has all expected fields")
    
    def test_academy_group_model_fields(self):
        """Verify AcademyGroup model has all expected fields"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        if response.status_code == 200 and len(response.json()) > 0:
            group = response.json()[0]
            expected_fields = [
                "id", "name", "age_range", "training_schedule",
                "description", "max_players", "season"
            ]
            for field in expected_fields:
                assert field in group, f"Missing field: {field}"
            print("✓ AcademyGroup model has all expected fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
