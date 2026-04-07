"""
Mobile OTP Authentication & Role-based Dashboard API Tests - Iteration 30
Tests for Lefteria FC PWA Mobile App with Phone+OTP auth and 4 roles
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test phone numbers (without +357 prefix - backend auto-adds it)
PARENT_PHONE = "99555666"
COACH_PHONE = "99222222"
PLAYER_PHONE = "99333333"
MANAGEMENT_PHONE = "99111111"


class TestMobileOTPRequest:
    """Test POST /api/mobile/auth/request-otp endpoint"""
    
    def test_request_otp_parent_role(self):
        """Parent phone 99555666 should return parent role"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PARENT_PHONE})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "otp_debug" in data, "OTP debug code should be in response (simulated mode)"
        assert data.get("role_detected") == "parent", f"Expected parent role, got {data.get('role_detected')}"
        assert data.get("simulated") == True, "Should be in simulated mode"
        print(f"✓ Parent OTP request: role={data.get('role_detected')}, otp_debug={data.get('otp_debug')}")
    
    def test_request_otp_coach_role(self):
        """Coach phone 99222222 should return coach role"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": COACH_PHONE})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "otp_debug" in data, "OTP debug code should be in response"
        assert data.get("role_detected") == "coach", f"Expected coach role, got {data.get('role_detected')}"
        print(f"✓ Coach OTP request: role={data.get('role_detected')}, otp_debug={data.get('otp_debug')}")
    
    def test_request_otp_player_role(self):
        """Player phone 99333333 should return player role"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PLAYER_PHONE})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "otp_debug" in data, "OTP debug code should be in response"
        assert data.get("role_detected") == "player", f"Expected player role, got {data.get('role_detected')}"
        print(f"✓ Player OTP request: role={data.get('role_detected')}, otp_debug={data.get('otp_debug')}")
    
    def test_request_otp_management_role(self):
        """Management phone 99111111 should return management role"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": MANAGEMENT_PHONE})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "otp_debug" in data, "OTP debug code should be in response"
        assert data.get("role_detected") == "management", f"Expected management role, got {data.get('role_detected')}"
        print(f"✓ Management OTP request: role={data.get('role_detected')}, otp_debug={data.get('otp_debug')}")
    
    def test_request_otp_empty_phone(self):
        """Empty phone should return 400"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": ""})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Empty phone returns 400")


class TestMobileOTPVerify:
    """Test POST /api/mobile/auth/verify-otp endpoint"""
    
    def test_verify_otp_correct_code(self):
        """Correct OTP code should return token and user"""
        # First request OTP
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PARENT_PHONE})
        assert otp_response.status_code == 200
        otp_code = otp_response.json().get("otp_debug")
        assert otp_code, "OTP code should be in response"
        
        # Verify OTP
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        data = verify_response.json()
        
        # Validate response structure
        assert "token" in data, "Token should be in response"
        assert "user" in data, "User should be in response"
        assert "role" in data, "Role should be in response"
        assert data["role"] == "parent", f"Expected parent role, got {data['role']}"
        assert isinstance(data["token"], str) and len(data["token"]) > 0, "Token should be non-empty string"
        print(f"✓ OTP verification successful: role={data['role']}, user_name={data['user'].get('name')}")
        return data["token"]
    
    def test_verify_otp_wrong_code(self):
        """Wrong OTP code should return 400"""
        # First request OTP
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PARENT_PHONE})
        assert otp_response.status_code == 200
        
        # Verify with wrong code
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": "000000"  # Wrong code
        })
        assert verify_response.status_code == 400, f"Expected 400, got {verify_response.status_code}"
        print("✓ Wrong OTP code returns 400")
    
    def test_verify_otp_missing_fields(self):
        """Missing phone or code should return 400"""
        response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={"phone": PARENT_PHONE})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Missing code returns 400")


class TestMobileAuthMe:
    """Test GET /api/mobile/auth/me endpoint"""
    
    @pytest.fixture
    def parent_token(self):
        """Get a valid parent token"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PARENT_PHONE})
        otp_code = otp_response.json().get("otp_debug")
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        return verify_response.json().get("token")
    
    def test_get_me_with_token(self, parent_token):
        """GET /api/mobile/auth/me with valid token should return user data"""
        response = requests.get(f"{BASE_URL}/api/mobile/auth/me", headers={
            "Authorization": f"Bearer {parent_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "role" in data, "Role should be in response"
        assert "name" in data, "Name should be in response"
        assert "phone" in data, "Phone should be in response"
        print(f"✓ GET /me successful: role={data['role']}, name={data['name']}")
    
    def test_get_me_without_token(self):
        """GET /api/mobile/auth/me without token should return 401"""
        response = requests.get(f"{BASE_URL}/api/mobile/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /me without token returns 401")


class TestParentDashboard:
    """Test GET /api/mobile/parent/dashboard endpoint"""
    
    @pytest.fixture
    def parent_token(self):
        """Get a valid parent token"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PARENT_PHONE})
        otp_code = otp_response.json().get("otp_debug")
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        return verify_response.json().get("token")
    
    def test_parent_dashboard(self, parent_token):
        """Parent dashboard should return children, events, financial data"""
        response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers={
            "Authorization": f"Bearer {parent_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "children" in data, "children should be in response"
        assert "events" in data, "events should be in response"
        assert "financial_records" in data, "financial_records should be in response"
        assert "attendance" in data, "attendance should be in response"
        assert "announcements" in data, "announcements should be in response"
        
        print(f"✓ Parent dashboard: {len(data.get('children', []))} children, {len(data.get('events', []))} events, {len(data.get('financial_records', []))} financial records")


class TestCoachDashboard:
    """Test GET /api/mobile/coach/dashboard endpoint"""
    
    @pytest.fixture
    def coach_token(self):
        """Get a valid coach token"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": COACH_PHONE})
        otp_code = otp_response.json().get("otp_debug")
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": COACH_PHONE,
            "code": otp_code
        })
        return verify_response.json().get("token")
    
    def test_coach_dashboard(self, coach_token):
        """Coach dashboard should return teams, players, training"""
        response = requests.get(f"{BASE_URL}/api/mobile/coach/dashboard", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "teams" in data, "teams should be in response"
        assert "groups" in data, "groups should be in response"
        assert "players" in data, "players should be in response"
        assert "events" in data, "events should be in response"
        assert "announcements" in data, "announcements should be in response"
        
        print(f"✓ Coach dashboard: {len(data.get('teams', []))} teams, {len(data.get('players', []))} players, {len(data.get('groups', []))} groups")


class TestPlayerDashboard:
    """Test GET /api/mobile/player/dashboard endpoint"""
    
    @pytest.fixture
    def player_token(self):
        """Get a valid player token"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PLAYER_PHONE})
        otp_code = otp_response.json().get("otp_debug")
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PLAYER_PHONE,
            "code": otp_code
        })
        return verify_response.json().get("token")
    
    def test_player_dashboard(self, player_token):
        """Player dashboard should return player stats and development"""
        response = requests.get(f"{BASE_URL}/api/mobile/player/dashboard", headers={
            "Authorization": f"Bearer {player_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "player" in data, "player should be in response"
        assert "stats" in data, "stats should be in response"
        assert "events" in data, "events should be in response"
        assert "announcements" in data, "announcements should be in response"
        
        # Validate stats structure
        stats = data.get("stats", {})
        assert "goals" in stats, "goals should be in stats"
        assert "assists" in stats, "assists should be in stats"
        assert "appearances" in stats, "appearances should be in stats"
        
        print(f"✓ Player dashboard: stats={stats}, player={data.get('player', {}).get('name')}")


class TestManagementDashboard:
    """Test GET /api/mobile/management/dashboard endpoint"""
    
    @pytest.fixture
    def management_token(self):
        """Get a valid management token"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": MANAGEMENT_PHONE})
        otp_code = otp_response.json().get("otp_debug")
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": MANAGEMENT_PHONE,
            "code": otp_code
        })
        return verify_response.json().get("token")
    
    def test_management_dashboard(self, management_token):
        """Management dashboard should return financial summary"""
        response = requests.get(f"{BASE_URL}/api/mobile/management/dashboard", headers={
            "Authorization": f"Bearer {management_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "teams" in data, "teams should be in response"
        assert "groups" in data, "groups should be in response"
        assert "player_count" in data, "player_count should be in response"
        assert "financial" in data, "financial should be in response"
        assert "announcements" in data, "announcements should be in response"
        
        # Validate financial structure
        fin = data.get("financial", {})
        assert "total_revenue" in fin, "total_revenue should be in financial"
        assert "total_pending" in fin, "total_pending should be in financial"
        assert "total_overdue" in fin, "total_overdue should be in financial"
        
        print(f"✓ Management dashboard: {data.get('player_count')} players, financial={fin}")


class TestAvailability:
    """Test POST /api/mobile/availability endpoint"""
    
    @pytest.fixture
    def parent_token(self):
        """Get a valid parent token"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PARENT_PHONE})
        otp_code = otp_response.json().get("otp_debug")
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        return verify_response.json().get("token")
    
    def test_submit_availability(self, parent_token):
        """Submit availability should work"""
        # First get dashboard to find an event and player
        dashboard = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers={
            "Authorization": f"Bearer {parent_token}"
        })
        data = dashboard.json()
        
        events = data.get("events", [])
        children = data.get("children", [])
        
        if not events or not children:
            pytest.skip("No events or children to test availability")
        
        event_id = events[0].get("id")
        player_id = children[0].get("id")
        
        response = requests.post(f"{BASE_URL}/api/mobile/availability", 
            headers={"Authorization": f"Bearer {parent_token}"},
            json={
                "event_id": event_id,
                "player_id": player_id,
                "status": "going"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "going", "Status should be 'going'"
        print(f"✓ Availability submitted: event_id={event_id}, status=going")


class TestRoleAccessControl:
    """Test that dashboards enforce role-based access"""
    
    @pytest.fixture
    def parent_token(self):
        """Get a valid parent token"""
        otp_response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": PARENT_PHONE})
        otp_code = otp_response.json().get("otp_debug")
        verify_response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": PARENT_PHONE,
            "code": otp_code
        })
        return verify_response.json().get("token")
    
    def test_parent_cannot_access_coach_dashboard(self, parent_token):
        """Parent should not be able to access coach dashboard"""
        response = requests.get(f"{BASE_URL}/api/mobile/coach/dashboard", headers={
            "Authorization": f"Bearer {parent_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Parent cannot access coach dashboard (403)")
    
    def test_parent_cannot_access_management_dashboard(self, parent_token):
        """Parent should not be able to access management dashboard"""
        response = requests.get(f"{BASE_URL}/api/mobile/management/dashboard", headers={
            "Authorization": f"Bearer {parent_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Parent cannot access management dashboard (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
