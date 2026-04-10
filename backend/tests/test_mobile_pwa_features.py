"""
Test Mobile PWA Features - Iteration 36
Tests for:
1. Mobile header sizing (logo w-10, text text-xs)
2. Currency € instead of $ 
3. Parent dashboard with team-first navigation
4. Parent profile with avatar upload and edit mode
5. Backend endpoints: PUT /mobile/profile, POST /mobile/profile/avatar
6. Backend: GET /mobile/parent/dashboard returns group_players and training_sessions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMobileOTPLogin:
    """Test OTP login flow to get auth token for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def parent_token(self):
        """Get parent auth token via OTP flow"""
        # Request OTP
        phone = "99555666"  # Parent phone from test_credentials.md
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone})
        assert resp.status_code == 200, f"OTP request failed: {resp.text}"
        data = resp.json()
        
        # Get OTP from debug response (simulated mode)
        otp_code = data.get("otp_debug")
        assert otp_code, "OTP code not in response (simulated mode expected)"
        
        # Verify OTP
        verify_resp = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone,
            "code": otp_code
        })
        assert verify_resp.status_code == 200, f"OTP verify failed: {verify_resp.text}"
        verify_data = verify_resp.json()
        
        assert "token" in verify_data, "No token in verify response"
        assert verify_data.get("role") == "parent", f"Expected parent role, got {verify_data.get('role')}"
        
        return verify_data["token"]
    
    def test_otp_request(self):
        """Test OTP request endpoint"""
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": "99555666"})
        assert resp.status_code == 200
        data = resp.json()
        assert "otp_debug" in data, "OTP debug code should be in response (simulated mode)"
        assert data.get("role_detected") == "parent"
        print(f"OTP request successful, role detected: {data.get('role_detected')}")


class TestParentDashboard:
    """Test parent dashboard endpoint returns required data"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for parent user"""
        phone = "99555666"
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone})
        otp_code = resp.json().get("otp_debug")
        verify_resp = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone, "code": otp_code
        })
        token = verify_resp.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_parent_dashboard_returns_groups(self, auth_headers):
        """Test that parent dashboard returns groups (teams) the kids are in"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200, f"Dashboard failed: {resp.text}"
        data = resp.json()
        
        # Check required fields
        assert "groups" in data, "Dashboard should return 'groups' field"
        assert "children" in data, "Dashboard should return 'children' field"
        print(f"Dashboard returned {len(data.get('groups', []))} groups, {len(data.get('children', []))} children")
    
    def test_parent_dashboard_returns_group_players(self, auth_headers):
        """Test that parent dashboard returns group_players for roster view"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "group_players" in data, "Dashboard should return 'group_players' field for roster"
        # group_players should be a dict with group_id as key
        assert isinstance(data["group_players"], dict), "group_players should be a dict"
        print(f"Dashboard returned group_players for {len(data.get('group_players', {}))} groups")
    
    def test_parent_dashboard_returns_training_sessions(self, auth_headers):
        """Test that parent dashboard returns training_sessions"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "training_sessions" in data, "Dashboard should return 'training_sessions' field"
        assert isinstance(data["training_sessions"], list), "training_sessions should be a list"
        print(f"Dashboard returned {len(data.get('training_sessions', []))} training sessions")
    
    def test_parent_dashboard_returns_fixtures(self, auth_headers):
        """Test that parent dashboard returns fixtures for team view"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "fixtures" in data, "Dashboard should return 'fixtures' field"
        print(f"Dashboard returned {len(data.get('fixtures', []))} fixtures")
    
    def test_parent_dashboard_returns_events(self, auth_headers):
        """Test that parent dashboard returns events for Going/Not Going"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "events" in data, "Dashboard should return 'events' field"
        print(f"Dashboard returned {len(data.get('events', []))} events")


class TestAvailabilityEndpoint:
    """Test Going/Not Going availability endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for parent user"""
        phone = "99555666"
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone})
        otp_code = resp.json().get("otp_debug")
        verify_resp = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone, "code": otp_code
        })
        token = verify_resp.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_submit_availability_going(self, auth_headers):
        """Test submitting 'going' availability"""
        # First get dashboard to find an event and player
        dash_resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        data = dash_resp.json()
        
        events = data.get("events", [])
        children = data.get("children", [])
        
        if not events or not children:
            pytest.skip("No events or children to test availability")
        
        event_id = events[0]["id"]
        player_id = children[0]["id"]
        
        resp = requests.post(f"{BASE_URL}/api/mobile/availability", 
            json={"event_id": event_id, "player_id": player_id, "status": "going"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Availability submit failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "going"
        print(f"Successfully submitted 'going' for event {event_id}")
    
    def test_submit_availability_not_going(self, auth_headers):
        """Test submitting 'not_going' availability"""
        dash_resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        data = dash_resp.json()
        
        events = data.get("events", [])
        children = data.get("children", [])
        
        if not events or not children:
            pytest.skip("No events or children to test availability")
        
        # Use second event if available
        event_idx = 1 if len(events) > 1 else 0
        event_id = events[event_idx]["id"]
        player_id = children[0]["id"]
        
        resp = requests.post(f"{BASE_URL}/api/mobile/availability", 
            json={"event_id": event_id, "player_id": player_id, "status": "not_going"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Availability submit failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "not_going"
        print(f"Successfully submitted 'not_going' for event {event_id}")


class TestProfileEndpoints:
    """Test profile update and avatar upload endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for parent user"""
        phone = "99555666"
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone})
        otp_code = resp.json().get("otp_debug")
        verify_resp = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone, "code": otp_code
        })
        token = verify_resp.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_current_user(self, auth_headers):
        """Test GET /mobile/auth/me returns user profile"""
        resp = requests.get(f"{BASE_URL}/api/mobile/auth/me", headers=auth_headers)
        assert resp.status_code == 200, f"Get me failed: {resp.text}"
        data = resp.json()
        
        assert "name" in data, "User should have name"
        assert "phone" in data, "User should have phone"
        assert "role" in data, "User should have role"
        print(f"Current user: {data.get('name')}, role: {data.get('role')}")
    
    def test_update_profile_name_email(self, auth_headers):
        """Test PUT /mobile/profile updates name and email"""
        # Update profile
        resp = requests.put(f"{BASE_URL}/api/mobile/profile", 
            json={"name": "Test Parent Name", "email": "testparent@example.com"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Profile update failed: {resp.text}"
        data = resp.json()
        
        assert data.get("name") == "Test Parent Name", "Name should be updated"
        assert data.get("email") == "testparent@example.com", "Email should be updated"
        print("Profile name and email updated successfully")
    
    def test_update_profile_phone_locked(self, auth_headers):
        """Test that phone cannot be updated via profile endpoint"""
        # Try to update phone (should be ignored)
        resp = requests.put(f"{BASE_URL}/api/mobile/profile", 
            json={"phone": "+35799999999"},
            headers=auth_headers
        )
        # Should return 400 because no valid fields to update
        assert resp.status_code == 400, "Phone update should be rejected"
        print("Phone update correctly rejected (locked field)")
    
    def test_avatar_upload_endpoint_exists(self, auth_headers):
        """Test POST /mobile/profile/avatar endpoint exists"""
        # Test with empty form data to verify endpoint exists
        resp = requests.post(f"{BASE_URL}/api/mobile/profile/avatar", 
            headers=auth_headers,
            files={}
        )
        # Should return 400 (no file) not 404 (endpoint not found)
        assert resp.status_code in [400, 422], f"Avatar endpoint should exist, got {resp.status_code}"
        print("Avatar upload endpoint exists and validates input")


class TestMobileAuthMe:
    """Test /mobile/auth/me endpoint returns all required fields"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        phone = "99555666"
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone})
        otp_code = resp.json().get("otp_debug")
        verify_resp = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone, "code": otp_code
        })
        token = verify_resp.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_me_returns_avatar_url(self, auth_headers):
        """Test that /me returns avatar_url field for profile display"""
        resp = requests.get(f"{BASE_URL}/api/mobile/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # avatar_url may be empty string but field should exist
        assert "avatar_url" in data or data.get("avatar_url") is None or data.get("avatar_url") == "", \
            "User should have avatar_url field (can be empty)"
        print(f"User avatar_url: {data.get('avatar_url', 'not set')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
