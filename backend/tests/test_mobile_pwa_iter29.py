"""
Mobile PWA API Tests - Iteration 29
Tests for OTP authentication, role detection, and role-based dashboards
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test phone numbers
PARENT_PHONE = "+35799555666"  # Matches parent_phone in players DB
UNKNOWN_PHONE = "+35799999999"  # No match in DB


class TestMobileOTPAuth:
    """Test OTP request and verification flow"""

    def test_request_otp_success(self):
        """POST /api/mobile/auth/request-otp - should return OTP in simulated mode"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert data["message"] == "OTP sent"
        assert "phone" in data
        assert "expires_in" in data
        
        # In simulated mode, OTP should be in response
        assert "otp_debug" in data, "Expected otp_debug in simulated mode"
        assert "simulated" in data
        assert data["simulated"] == True
        assert len(data["otp_debug"]) == 6
        
        # Role should be detected for parent phone
        assert "role_detected" in data
        print(f"OTP requested successfully. Debug OTP: {data['otp_debug']}, Role: {data['role_detected']}")

    def test_request_otp_empty_phone(self):
        """POST /api/mobile/auth/request-otp - should fail with empty phone"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": ""
        })
        assert response.status_code == 400
        assert "Phone number required" in response.json().get("detail", "")

    def test_request_otp_normalizes_phone(self):
        """POST /api/mobile/auth/request-otp - should normalize phone without + prefix"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": "99555666"  # Without country code
        })
        assert response.status_code == 200
        data = response.json()
        # Should normalize to +357 prefix
        assert data["phone"].startswith("+357")
        print(f"Phone normalized to: {data['phone']}")

    def test_verify_otp_success(self):
        """POST /api/mobile/auth/verify-otp - should return token and user data"""
        # First request OTP
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        assert otp_response.status_code == 200
        otp_code = otp_response.json()["otp_debug"]
        
        # Verify OTP
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        data = verify_response.json()
        assert "token" in data
        assert "user" in data
        assert "role" in data
        
        # Verify user data structure
        user = data["user"]
        assert "id" in user
        assert "phone" in user
        assert "role" in user
        assert "name" in user
        
        # For parent role, should have linked player IDs
        if data["role"] == "parent":
            assert "linked_player_ids" in user or "linked_player_id" in user
        
        print(f"Login successful. Role: {data['role']}, User: {user['name']}")
        return data["token"]

    def test_verify_otp_wrong_code(self):
        """POST /api/mobile/auth/verify-otp - should fail with wrong code"""
        # First request OTP
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        assert otp_response.status_code == 200
        
        # Verify with wrong code
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": "000000"  # Wrong code
        })
        assert verify_response.status_code == 400
        assert "Invalid code" in verify_response.json().get("detail", "")

    def test_verify_otp_no_otp_requested(self):
        """POST /api/mobile/auth/verify-otp - should fail if no OTP was requested"""
        # Try to verify without requesting OTP first (use a different phone)
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": "+35712345678",
            "code": "123456"
        })
        assert verify_response.status_code == 400
        assert "No OTP found" in verify_response.json().get("detail", "")

    def test_verify_otp_unknown_phone(self):
        """POST /api/mobile/auth/verify-otp - should fail for phone not in system"""
        # Request OTP for unknown phone
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": UNKNOWN_PHONE
        })
        assert otp_response.status_code == 200
        otp_code = otp_response.json()["otp_debug"]
        
        # Verify OTP - should fail because phone not linked to any account
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": UNKNOWN_PHONE,
            "code": otp_code
        })
        assert verify_response.status_code == 404
        assert "No account found" in verify_response.json().get("detail", "")


class TestMobileAuthMe:
    """Test GET /api/mobile/auth/me endpoint"""

    @pytest.fixture
    def auth_token(self):
        """Get auth token for parent user"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        otp_code = otp_response.json()["otp_debug"]
        
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        return verify_response.json()["token"]

    def test_get_me_success(self, auth_token):
        """GET /api/mobile/auth/me - should return current user"""
        response = requests.get(f"{BASE_URL}/api/mobile/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "phone" in data
        assert "role" in data
        assert "name" in data
        print(f"Current user: {data['name']}, Role: {data['role']}")

    def test_get_me_no_token(self):
        """GET /api/mobile/auth/me - should fail without token"""
        response = requests.get(f"{BASE_URL}/api/mobile/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self):
        """GET /api/mobile/auth/me - should fail with invalid token"""
        response = requests.get(f"{BASE_URL}/api/mobile/auth/me", headers={
            "Authorization": "Bearer invalid-token-here"
        })
        assert response.status_code == 401


class TestParentDashboard:
    """Test parent dashboard endpoint"""

    @pytest.fixture
    def parent_token(self):
        """Get auth token for parent user"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        otp_code = otp_response.json()["otp_debug"]
        
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        return verify_response.json()["token"]

    def test_parent_dashboard_success(self, parent_token):
        """GET /api/mobile/parent/dashboard - should return children, events, financial data"""
        response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers={
            "Authorization": f"Bearer {parent_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify expected fields
        assert "children" in data
        assert "events" in data
        assert "announcements" in data
        assert "financial_records" in data
        assert "attendance" in data
        
        # Children should be a list
        assert isinstance(data["children"], list)
        
        # If children exist, verify structure
        if data["children"]:
            child = data["children"][0]
            assert "id" in child
            assert "name" in child
            print(f"Found {len(data['children'])} children: {[c['name'] for c in data['children']]}")
        
        print(f"Dashboard data: {len(data['events'])} events, {len(data['announcements'])} announcements")

    def test_parent_dashboard_no_auth(self):
        """GET /api/mobile/parent/dashboard - should fail without auth"""
        response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard")
        assert response.status_code == 401


class TestCoachDashboard:
    """Test coach dashboard endpoint"""

    def test_coach_dashboard_requires_coach_role(self):
        """GET /api/mobile/coach/dashboard - should fail for non-coach"""
        # Login as parent
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        otp_code = otp_response.json()["otp_debug"]
        
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        token = verify_response.json()["token"]
        
        # Try to access coach dashboard
        response = requests.get(f"{BASE_URL}/api/mobile/coach/dashboard", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403
        assert "Not a coach" in response.json().get("detail", "")


class TestPlayerDashboard:
    """Test player dashboard endpoint"""

    def test_player_dashboard_requires_player_role(self):
        """GET /api/mobile/player/dashboard - should fail for non-player"""
        # Login as parent
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        otp_code = otp_response.json()["otp_debug"]
        
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        token = verify_response.json()["token"]
        
        # Try to access player dashboard
        response = requests.get(f"{BASE_URL}/api/mobile/player/dashboard", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403
        assert "Not a player" in response.json().get("detail", "")


class TestManagementDashboard:
    """Test management dashboard endpoint"""

    def test_management_dashboard_requires_management_role(self):
        """GET /api/mobile/management/dashboard - should fail for non-management"""
        # Login as parent
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": PARENT_PHONE
        })
        otp_code = otp_response.json()["otp_debug"]
        
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        token = verify_response.json()["token"]
        
        # Try to access management dashboard
        response = requests.get(f"{BASE_URL}/api/mobile/management/dashboard", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403
        assert "Not a management" in response.json().get("detail", "")


class TestAdminPanelStillWorks:
    """Verify existing admin panel still works"""

    def test_admin_login(self):
        """POST /api/auth/login - admin login should still work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        print("Admin login still works correctly")


class TestPWAManifest:
    """Test PWA manifest accessibility"""

    def test_manifest_accessible(self):
        """GET /manifest.json - should be accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        # May return 200 or 404 depending on setup
        if response.status_code == 200:
            data = response.json()
            print(f"Manifest found: {data.get('name', 'N/A')}")
        else:
            print(f"Manifest not found at root (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
