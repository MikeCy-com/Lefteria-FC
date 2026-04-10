"""
Test Mobile Chat System - Iteration 38
Tests for:
1. Mobile OTP login flow (parent role)
2. Parent dashboard with expandable drill-down UI
3. Chat system: conversations, team chats, private chats, messages
4. Backend chat endpoints: GET/POST /mobile/conversations, /mobile/team-chat, /mobile/team-members
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com').rstrip('/')


class TestMobileOTPLogin:
    """Test OTP login flow for parent role"""
    
    def test_otp_request_returns_debug_code(self):
        """Test OTP request returns otp_debug in simulated mode"""
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": "99555666"})
        assert resp.status_code == 200, f"OTP request failed: {resp.text}"
        data = resp.json()
        assert "otp_debug" in data, "OTP debug code should be in response (simulated mode)"
        assert data.get("simulated") == True, "Should indicate simulated mode"
        assert data.get("role_detected") == "parent", f"Expected parent role, got {data.get('role_detected')}"
        print(f"OTP request successful: role={data.get('role_detected')}, otp={data.get('otp_debug')}")
    
    def test_otp_verify_returns_token_and_user(self):
        """Test OTP verify returns token and user data"""
        phone = "99555666"
        # Request OTP
        resp = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone})
        otp_code = resp.json().get("otp_debug")
        
        # Verify OTP
        verify_resp = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone, "code": otp_code
        })
        assert verify_resp.status_code == 200, f"OTP verify failed: {verify_resp.text}"
        data = verify_resp.json()
        
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data.get("role") == "parent", f"Expected parent role, got {data.get('role')}"
        print(f"OTP verify successful: user={data['user'].get('name')}, role={data.get('role')}")


class TestParentDashboardExpandable:
    """Test parent dashboard returns data for expandable drill-down UI"""
    
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
    
    def test_dashboard_returns_groups_for_team_cards(self, auth_headers):
        """Test dashboard returns groups for team card display"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200, f"Dashboard failed: {resp.text}"
        data = resp.json()
        
        assert "groups" in data, "Dashboard should return 'groups' for team cards"
        assert isinstance(data["groups"], list), "groups should be a list"
        print(f"Dashboard returned {len(data.get('groups', []))} groups for team cards")
    
    def test_dashboard_returns_children_for_my_kids_section(self, auth_headers):
        """Test dashboard returns children for 'Τα παιδιά μου' section"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "children" in data, "Dashboard should return 'children' for my kids section"
        assert isinstance(data["children"], list), "children should be a list"
        print(f"Dashboard returned {len(data.get('children', []))} children")
    
    def test_dashboard_returns_group_players_for_roster(self, auth_headers):
        """Test dashboard returns group_players for roster expandable section"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "group_players" in data, "Dashboard should return 'group_players' for roster"
        assert isinstance(data["group_players"], dict), "group_players should be a dict keyed by group_id"
        print(f"Dashboard returned group_players for {len(data.get('group_players', {}))} groups")
    
    def test_dashboard_returns_fixtures_for_events(self, auth_headers):
        """Test dashboard returns fixtures for upcoming events section"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "fixtures" in data, "Dashboard should return 'fixtures'"
        assert "training_sessions" in data, "Dashboard should return 'training_sessions'"
        print(f"Dashboard returned {len(data.get('fixtures', []))} fixtures, {len(data.get('training_sessions', []))} training sessions")
    
    def test_dashboard_returns_announcements(self, auth_headers):
        """Test dashboard returns announcements for expandable section"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "announcements" in data, "Dashboard should return 'announcements'"
        print(f"Dashboard returned {len(data.get('announcements', []))} announcements")


class TestChatConversations:
    """Test chat conversation endpoints"""
    
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
    
    def test_get_conversations_endpoint(self, auth_headers):
        """Test GET /mobile/conversations returns list"""
        resp = requests.get(f"{BASE_URL}/api/mobile/conversations", headers=auth_headers)
        assert resp.status_code == 200, f"Get conversations failed: {resp.text}"
        data = resp.json()
        
        assert isinstance(data, list), "Conversations should be a list"
        print(f"Got {len(data)} conversations")
    
    def test_get_conversations_without_auth_fails(self):
        """Test GET /mobile/conversations requires auth"""
        resp = requests.get(f"{BASE_URL}/api/mobile/conversations")
        assert resp.status_code == 401, "Should require authentication"


class TestTeamChat:
    """Test team chat creation and retrieval"""
    
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
    
    @pytest.fixture(scope="class")
    def group_id(self, auth_headers):
        """Get a group ID from parent dashboard"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        data = resp.json()
        groups = data.get("groups", [])
        if not groups:
            pytest.skip("No groups available for team chat test")
        return groups[0]["id"]
    
    def test_create_team_chat(self, auth_headers, group_id):
        """Test POST /mobile/team-chat/{group_id} creates or returns team chat"""
        resp = requests.post(f"{BASE_URL}/api/mobile/team-chat/{group_id}", json={}, headers=auth_headers)
        assert resp.status_code == 200, f"Team chat creation failed: {resp.text}"
        data = resp.json()
        
        assert "id" in data, "Team chat should have id"
        assert data.get("type") == "team", "Should be team type conversation"
        assert data.get("group_id") == group_id, "Should have correct group_id"
        print(f"Team chat created/retrieved: id={data['id']}, group_name={data.get('group_name')}")
        return data["id"]
    
    def test_team_chat_idempotent(self, auth_headers, group_id):
        """Test that calling team-chat twice returns same conversation"""
        resp1 = requests.post(f"{BASE_URL}/api/mobile/team-chat/{group_id}", json={}, headers=auth_headers)
        resp2 = requests.post(f"{BASE_URL}/api/mobile/team-chat/{group_id}", json={}, headers=auth_headers)
        
        assert resp1.status_code == 200
        assert resp2.status_code == 200
        
        data1 = resp1.json()
        data2 = resp2.json()
        
        assert data1["id"] == data2["id"], "Should return same conversation on repeated calls"
        print(f"Team chat is idempotent: same id={data1['id']}")


class TestChatMessages:
    """Test chat message sending and retrieval"""
    
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
    
    @pytest.fixture(scope="class")
    def conversation_id(self, auth_headers):
        """Get or create a team chat conversation"""
        # Get group from dashboard
        dash_resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        groups = dash_resp.json().get("groups", [])
        if not groups:
            pytest.skip("No groups available for message test")
        
        # Create/get team chat
        chat_resp = requests.post(f"{BASE_URL}/api/mobile/team-chat/{groups[0]['id']}", json={}, headers=auth_headers)
        return chat_resp.json()["id"]
    
    def test_send_message(self, auth_headers, conversation_id):
        """Test POST /mobile/conversations/{id}/messages sends a message"""
        test_content = f"Test message {uuid.uuid4().hex[:8]}"
        resp = requests.post(
            f"{BASE_URL}/api/mobile/conversations/{conversation_id}/messages",
            json={"content": test_content},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Send message failed: {resp.text}"
        data = resp.json()
        
        assert "id" in data, "Message should have id"
        assert data.get("content") == test_content, "Message content should match"
        assert "sender_id" in data, "Message should have sender_id"
        assert "created_at" in data, "Message should have created_at"
        print(f"Message sent: id={data['id']}, content={data['content'][:30]}...")
    
    def test_get_messages(self, auth_headers, conversation_id):
        """Test GET /mobile/conversations/{id}/messages retrieves messages"""
        resp = requests.get(
            f"{BASE_URL}/api/mobile/conversations/{conversation_id}/messages",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Get messages failed: {resp.text}"
        data = resp.json()
        
        assert isinstance(data, list), "Messages should be a list"
        print(f"Got {len(data)} messages in conversation")
    
    def test_send_empty_message_fails(self, auth_headers, conversation_id):
        """Test that empty message is rejected"""
        resp = requests.post(
            f"{BASE_URL}/api/mobile/conversations/{conversation_id}/messages",
            json={"content": "   "},
            headers=auth_headers
        )
        assert resp.status_code == 400, "Empty message should be rejected"


class TestTeamMembers:
    """Test team members endpoint for private messaging"""
    
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
    
    @pytest.fixture(scope="class")
    def group_id(self, auth_headers):
        """Get a group ID from parent dashboard"""
        resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        data = resp.json()
        groups = data.get("groups", [])
        if not groups:
            pytest.skip("No groups available for team members test")
        return groups[0]["id"]
    
    def test_get_team_members(self, auth_headers, group_id):
        """Test GET /mobile/team-members/{group_id} returns members"""
        resp = requests.get(f"{BASE_URL}/api/mobile/team-members/{group_id}", headers=auth_headers)
        assert resp.status_code == 200, f"Get team members failed: {resp.text}"
        data = resp.json()
        
        assert "members" in data, "Response should have 'members'"
        assert "players" in data, "Response should have 'players'"
        print(f"Got {len(data.get('members', []))} members, {len(data.get('players', []))} players")


class TestPrivateChat:
    """Test private chat creation"""
    
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
    
    def test_create_private_chat_requires_other_user(self, auth_headers):
        """Test POST /mobile/conversations requires other_user_id for private chat"""
        resp = requests.post(
            f"{BASE_URL}/api/mobile/conversations",
            json={"type": "private"},
            headers=auth_headers
        )
        assert resp.status_code == 400, "Should require other_user_id"


class TestAvailabilityEndpoint:
    """Test Going/Not Going availability for events"""
    
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
    
    def test_submit_going_availability(self, auth_headers):
        """Test submitting 'going' availability for an event"""
        # Get dashboard to find event and child
        dash_resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        data = dash_resp.json()
        
        events = data.get("events", [])
        children = data.get("children", [])
        
        if not events or not children:
            pytest.skip("No events or children to test availability")
        
        event_id = events[0]["id"]
        player_id = children[0]["id"]
        
        resp = requests.post(
            f"{BASE_URL}/api/mobile/availability",
            json={"event_id": event_id, "player_id": player_id, "status": "going"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Availability submit failed: {resp.text}"
        assert resp.json().get("status") == "going"
        print(f"Submitted 'going' for event {event_id}")
    
    def test_submit_not_going_availability(self, auth_headers):
        """Test submitting 'not_going' availability for an event"""
        dash_resp = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=auth_headers)
        data = dash_resp.json()
        
        events = data.get("events", [])
        children = data.get("children", [])
        
        if not events or not children:
            pytest.skip("No events or children to test availability")
        
        # Use different event if available
        event_idx = 1 if len(events) > 1 else 0
        event_id = events[event_idx]["id"]
        player_id = children[0]["id"]
        
        resp = requests.post(
            f"{BASE_URL}/api/mobile/availability",
            json={"event_id": event_id, "player_id": player_id, "status": "not_going"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Availability submit failed: {resp.text}"
        assert resp.json().get("status") == "not_going"
        print(f"Submitted 'not_going' for event {event_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
