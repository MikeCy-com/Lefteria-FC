"""
Backend API tests for Mobile PWA Redesign - Iteration 40
Tests: OTP auth, parent dashboard, matches, chat, profile endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com')

class TestBackendAPIs:
    """Test backend API endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data['message']}")
    
    def test_get_players(self):
        """Test GET /api/players"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Players endpoint: {len(data)} players")
    
    def test_get_fixtures(self):
        """Test GET /api/fixtures"""
        response = requests.get(f"{BASE_URL}/api/fixtures")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Fixtures endpoint: {len(data)} fixtures")
    
    def test_get_academy_groups(self):
        """Test GET /api/academy-groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Academy groups endpoint: {len(data)} groups")


class TestMobileOTPAuth:
    """Test mobile OTP authentication flow"""
    
    def test_request_otp(self):
        """Test POST /api/mobile/auth/request-otp"""
        response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": "99555666"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "OTP sent"
        assert "phone" in data
        assert "otp_debug" in data  # MOCKED - OTP returned in debug field
        assert "role_detected" in data
        assert data["role_detected"] == "parent"
        print(f"✓ OTP request: phone={data['phone']}, role={data['role_detected']}, otp={data['otp_debug']}")
        return data["otp_debug"], data["phone"]
    
    def test_verify_otp_success(self):
        """Test POST /api/mobile/auth/verify-otp with correct OTP"""
        # First request OTP
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": "99555666"}
        )
        otp_data = otp_response.json()
        otp_code = otp_data["otp_debug"]
        phone = otp_data["phone"]
        
        # Verify OTP
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
        print(f"✓ OTP verify: role={data['role']}, user={data['user'].get('name')}")
        return data["token"]
    
    def test_verify_otp_wrong_code(self):
        """Test POST /api/mobile/auth/verify-otp with wrong OTP"""
        # First request OTP
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": "99555666"}
        )
        otp_data = otp_response.json()
        phone = otp_data["phone"]
        
        # Verify with wrong OTP
        response = requests.post(
            f"{BASE_URL}/api/mobile/auth/verify-otp",
            json={"phone": phone, "code": "000000"}
        )
        assert response.status_code == 400
        print("✓ Wrong OTP returns 400")


class TestMobileParentDashboard:
    """Test mobile parent dashboard endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for parent user"""
        # Request OTP
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": "99555666"}
        )
        otp_data = otp_response.json()
        
        # Verify OTP
        verify_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/verify-otp",
            json={"phone": otp_data["phone"], "code": otp_data["otp_debug"]}
        )
        return verify_response.json()["token"]
    
    def test_parent_dashboard(self, auth_token):
        """Test GET /api/mobile/parent/dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/mobile/parent/dashboard",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check dashboard data structure
        assert "children" in data
        assert "groups" in data
        assert "fixtures" in data
        assert "events" in data or "training_sessions" in data
        
        print(f"✓ Parent dashboard: {len(data.get('children', []))} children, {len(data.get('groups', []))} groups, {len(data.get('fixtures', []))} fixtures")
    
    def test_parent_dashboard_no_auth(self):
        """Test GET /api/mobile/parent/dashboard without auth"""
        response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard")
        assert response.status_code == 401
        print("✓ Parent dashboard without auth returns 401")
    
    def test_my_availability(self, auth_token):
        """Test GET /api/mobile/my-availability"""
        response = requests.get(
            f"{BASE_URL}/api/mobile/my-availability",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ My availability: {len(data)} records")


class TestMobileChat:
    """Test mobile chat endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for parent user"""
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": "99555666"}
        )
        otp_data = otp_response.json()
        verify_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/verify-otp",
            json={"phone": otp_data["phone"], "code": otp_data["otp_debug"]}
        )
        return verify_response.json()["token"]
    
    def test_get_conversations(self, auth_token):
        """Test GET /api/mobile/conversations"""
        response = requests.get(
            f"{BASE_URL}/api/mobile/conversations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Conversations: {len(data)} conversations")


class TestMobileProfile:
    """Test mobile profile endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for parent user"""
        otp_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/request-otp",
            json={"phone": "99555666"}
        )
        otp_data = otp_response.json()
        verify_response = requests.post(
            f"{BASE_URL}/api/mobile/auth/verify-otp",
            json={"phone": otp_data["phone"], "code": otp_data["otp_debug"]}
        )
        return verify_response.json()["token"]
    
    def test_get_me(self, auth_token):
        """Test GET /api/mobile/auth/me"""
        response = requests.get(
            f"{BASE_URL}/api/mobile/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "phone" in data
        assert "role" in data
        assert "name" in data
        print(f"✓ Get me: name={data['name']}, role={data['role']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
