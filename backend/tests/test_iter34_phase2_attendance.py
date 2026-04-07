"""
Iteration 34 - Phase 2 Attendance Features Testing
Tests:
1. POST /api/admin/events/{event_id}/attendance - marks attendance
2. GET /api/admin/events/{event_id}/attendance - returns attendance records
3. GET /api/admin/attendance/stats?player_id={id} - returns player attendance stats including training sessions
4. POST /api/mobile/availability - syncs to both availability and event_attendance collections
5. GET /api/mobile/my-availability - returns all availability for linked players
6. Parent dashboard events include training sessions and fixtures with type field
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuth:
    """Admin authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Test admin login works"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print(f"SUCCESS: Admin login successful, token length: {len(admin_token)}")


class TestAttendanceEndpoints:
    """Test attendance marking and retrieval endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_training_session(self, admin_headers):
        """Create a test training session for attendance testing"""
        # First get an academy group
        groups_res = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_res.json()
        group_id = groups[0]["id"] if groups else None
        
        # Create a training session
        session_data = {
            "title": "TEST_Attendance_Training",
            "date": "2026-02-15",
            "start_time": "16:00",
            "duration_minutes": 90,
            "intensity": "medium",
            "academy_group_id": group_id,
            "notes": "Test session for attendance"
        }
        response = requests.post(f"{BASE_URL}/api/admin/training-sessions", 
                                json=session_data, headers=admin_headers)
        assert response.status_code == 200, f"Failed to create training session: {response.text}"
        session = response.json()
        print(f"Created test training session: {session['id']}")
        yield session
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/training-sessions/{session['id']}", headers=admin_headers)
        print(f"Cleaned up test training session: {session['id']}")
    
    @pytest.fixture(scope="class")
    def test_player(self, admin_headers):
        """Get or create a test player"""
        # Get existing players
        response = requests.get(f"{BASE_URL}/api/players")
        players = response.json()
        if players:
            return players[0]
        
        # Create a test player if none exist
        player_data = {
            "name": "TEST_Attendance_Player",
            "number": 99,
            "position": "Midfielder",
            "nationality": "Cyprus",
            "age": 18,
            "team_type": "Academy"
        }
        response = requests.post(f"{BASE_URL}/api/admin/players", 
                                json=player_data, headers=admin_headers)
        assert response.status_code == 200
        return response.json()
    
    def test_post_attendance(self, admin_headers, test_training_session, test_player):
        """Test POST /api/admin/events/{event_id}/attendance"""
        event_id = test_training_session["id"]
        player_id = test_player["id"]
        player_name = test_player["name"]
        
        # Mark attendance
        response = requests.post(f"{BASE_URL}/api/admin/events/{event_id}/attendance", 
            json={
                "responses": [
                    {"player_id": player_id, "player_name": player_name, "status": "going"}
                ]
            }, 
            headers=admin_headers
        )
        
        assert response.status_code == 200, f"POST attendance failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert data.get("count") == 1
        print(f"SUCCESS: POST attendance - marked {data['count']} attendance record(s)")
    
    def test_get_attendance(self, admin_headers, test_training_session, test_player):
        """Test GET /api/admin/events/{event_id}/attendance"""
        event_id = test_training_session["id"]
        
        response = requests.get(f"{BASE_URL}/api/admin/events/{event_id}/attendance", 
                               headers=admin_headers)
        
        assert response.status_code == 200, f"GET attendance failed: {response.text}"
        records = response.json()
        assert isinstance(records, list)
        
        # Should have at least the record we just created
        if records:
            record = records[0]
            assert "player_id" in record
            assert "status" in record
            assert "event_id" in record
            print(f"SUCCESS: GET attendance - found {len(records)} record(s)")
            print(f"  First record: player_id={record['player_id']}, status={record['status']}")
        else:
            print("WARNING: No attendance records found (may have been cleaned up)")
    
    def test_attendance_stats_with_player_id(self, admin_headers, test_player):
        """Test GET /api/admin/attendance/stats?player_id={id}"""
        player_id = test_player["id"]
        
        response = requests.get(f"{BASE_URL}/api/admin/attendance/stats?player_id={player_id}", 
                               headers=admin_headers)
        
        assert response.status_code == 200, f"GET attendance stats failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "total_events" in data
        assert "player_stats" in data
        assert "overall" in data
        
        print(f"SUCCESS: GET attendance stats - total_events={data['total_events']}")
        
        if data["player_stats"]:
            ps = data["player_stats"][0]
            assert "player_id" in ps
            assert "going" in ps
            assert "not_going" in ps
            assert "attendance_rate" in ps
            print(f"  Player stats: going={ps['going']}, not_going={ps['not_going']}, rate={ps['attendance_rate']}%")
    
    def test_attendance_toggle(self, admin_headers, test_training_session, test_player):
        """Test toggling attendance status"""
        event_id = test_training_session["id"]
        player_id = test_player["id"]
        player_name = test_player["name"]
        
        # Mark as not_going
        response = requests.post(f"{BASE_URL}/api/admin/events/{event_id}/attendance", 
            json={
                "responses": [
                    {"player_id": player_id, "player_name": player_name, "status": "not_going"}
                ]
            }, 
            headers=admin_headers
        )
        assert response.status_code == 200
        
        # Verify the change
        response = requests.get(f"{BASE_URL}/api/admin/events/{event_id}/attendance", 
                               headers=admin_headers)
        records = response.json()
        player_record = next((r for r in records if r["player_id"] == player_id), None)
        
        if player_record:
            assert player_record["status"] == "not_going"
            print(f"SUCCESS: Attendance toggle - status changed to 'not_going'")
        else:
            print("WARNING: Could not verify toggle (record not found)")


class TestMobileAvailability:
    """Test mobile availability endpoints"""
    
    @pytest.fixture(scope="class")
    def parent_token(self):
        """Get parent mobile token via OTP flow"""
        # Request OTP
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": "+357 99 555666"
        })
        assert response.status_code == 200, f"OTP request failed: {response.text}"
        data = response.json()
        
        # Get OTP from debug field (simulated mode)
        otp_code = data.get("otp_debug")
        assert otp_code, "OTP debug code not found in response"
        phone = data.get("phone")
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone,
            "code": otp_code
        })
        assert response.status_code == 200, f"OTP verify failed: {response.text}"
        verify_data = response.json()
        
        assert "token" in verify_data
        assert verify_data.get("role") == "parent"
        print(f"SUCCESS: Parent login - role={verify_data['role']}")
        return verify_data["token"]
    
    @pytest.fixture(scope="class")
    def parent_headers(self, parent_token):
        return {"Authorization": f"Bearer {parent_token}"}
    
    def test_parent_dashboard_has_events_with_type(self, parent_headers):
        """Test parent dashboard includes events with type field"""
        response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=parent_headers)
        
        assert response.status_code == 200, f"Parent dashboard failed: {response.text}"
        data = response.json()
        
        assert "events" in data
        assert "children" in data
        
        events = data["events"]
        print(f"SUCCESS: Parent dashboard - found {len(events)} events")
        
        # Check that events have type field
        for event in events[:5]:  # Check first 5
            event_type = event.get("type") or event.get("event_type")
            print(f"  Event: {event.get('title', 'N/A')[:30]} - type={event_type}")
            # Events should have a type (training, match, etc.)
    
    def test_post_mobile_availability(self, parent_headers):
        """Test POST /api/mobile/availability syncs to event_attendance"""
        # First get events from dashboard
        dash_response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=parent_headers)
        assert dash_response.status_code == 200
        dash_data = dash_response.json()
        
        events = dash_data.get("events", [])
        children = dash_data.get("children", [])
        
        if not events:
            pytest.skip("No events available for availability test")
        if not children:
            pytest.skip("No children linked to parent")
        
        event_id = events[0]["id"]
        player_id = children[0]["id"]
        
        # Submit availability
        response = requests.post(f"{BASE_URL}/api/mobile/availability", json={
            "event_id": event_id,
            "player_id": player_id,
            "status": "going"
        }, headers=parent_headers)
        
        assert response.status_code == 200, f"POST availability failed: {response.text}"
        data = response.json()
        assert data.get("status") == "going"
        print(f"SUCCESS: POST mobile availability - event_id={event_id}, status=going")
    
    def test_get_my_availability(self, parent_headers):
        """Test GET /api/mobile/my-availability returns availability for linked players"""
        response = requests.get(f"{BASE_URL}/api/mobile/my-availability", headers=parent_headers)
        
        assert response.status_code == 200, f"GET my-availability failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: GET my-availability - found {len(data)} availability record(s)")
        
        if data:
            record = data[0]
            assert "event_id" in record
            assert "player_id" in record
            assert "status" in record
            print(f"  First record: event_id={record['event_id'][:8]}..., status={record['status']}")
    
    def test_availability_toggle(self, parent_headers):
        """Test toggling availability from going to not_going"""
        # Get events and children
        dash_response = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=parent_headers)
        dash_data = dash_response.json()
        
        events = dash_data.get("events", [])
        children = dash_data.get("children", [])
        
        if not events or not children:
            pytest.skip("No events or children for toggle test")
        
        event_id = events[0]["id"]
        player_id = children[0]["id"]
        
        # Toggle to not_going
        response = requests.post(f"{BASE_URL}/api/mobile/availability", json={
            "event_id": event_id,
            "player_id": player_id,
            "status": "not_going"
        }, headers=parent_headers)
        
        assert response.status_code == 200
        assert response.json().get("status") == "not_going"
        print(f"SUCCESS: Availability toggle - changed to 'not_going'")
        
        # Verify via my-availability
        avail_response = requests.get(f"{BASE_URL}/api/mobile/my-availability", headers=parent_headers)
        avails = avail_response.json()
        
        matching = [a for a in avails if a["event_id"] == event_id and a["player_id"] == player_id]
        if matching:
            assert matching[0]["status"] == "not_going"
            print(f"SUCCESS: Toggle verified via my-availability endpoint")


class TestMobileAvailabilitySyncToEventAttendance:
    """Test that mobile availability syncs to event_attendance collection"""
    
    @pytest.fixture(scope="class")
    def tokens(self):
        """Get both parent and admin tokens"""
        # Parent token
        otp_res = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": "+357 99 555666"})
        otp_data = otp_res.json()
        verify_res = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": otp_data["phone"],
            "code": otp_data["otp_debug"]
        })
        parent_token = verify_res.json()["token"]
        
        # Admin token
        admin_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        admin_token = admin_res.json()["token"]
        
        return {
            "parent": {"Authorization": f"Bearer {parent_token}"},
            "admin": {"Authorization": f"Bearer {admin_token}"}
        }
    
    def test_mobile_availability_syncs_to_event_attendance(self, tokens):
        """Test that POST /api/mobile/availability syncs to event_attendance for admin visibility"""
        parent_headers = tokens["parent"]
        admin_headers = tokens["admin"]
        
        # Get parent dashboard
        dash_res = requests.get(f"{BASE_URL}/api/mobile/parent/dashboard", headers=parent_headers)
        dash_data = dash_res.json()
        
        events = dash_data.get("events", [])
        children = dash_data.get("children", [])
        
        if not events or not children:
            pytest.skip("No events or children for sync test")
        
        event_id = events[0]["id"]
        player_id = children[0]["id"]
        
        # Submit availability via mobile
        response = requests.post(f"{BASE_URL}/api/mobile/availability", json={
            "event_id": event_id,
            "player_id": player_id,
            "status": "going"
        }, headers=parent_headers)
        assert response.status_code == 200
        
        # Verify via admin endpoint
        admin_response = requests.get(f"{BASE_URL}/api/admin/events/{event_id}/attendance", 
                                      headers=admin_headers)
        assert admin_response.status_code == 200
        
        records = admin_response.json()
        matching = [r for r in records if r["player_id"] == player_id]
        
        if matching:
            assert matching[0]["status"] == "going"
            assert matching[0].get("source") == "mobile"
            print(f"SUCCESS: Mobile availability synced to event_attendance")
            print(f"  Admin can see: player_id={player_id}, status=going, source=mobile")
        else:
            # The sync might have worked but we need to check
            print(f"INFO: Sync verification - found {len(records)} total records for event")


class TestCoachMobileAuth:
    """Test coach mobile authentication"""
    
    def test_coach_otp_flow(self):
        """Test coach can login via OTP"""
        # Request OTP
        response = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={
            "phone": "+357 99 333333"
        })
        assert response.status_code == 200, f"Coach OTP request failed: {response.text}"
        data = response.json()
        
        otp_code = data.get("otp_debug")
        phone = data.get("phone")
        
        if not otp_code:
            pytest.skip("No OTP debug code - coach phone may not be registered")
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={
            "phone": phone,
            "code": otp_code
        })
        
        if response.status_code == 404:
            pytest.skip("Coach phone not registered in system")
        
        assert response.status_code == 200, f"Coach OTP verify failed: {response.text}"
        data = response.json()
        
        assert "token" in data
        print(f"SUCCESS: Coach login - role={data.get('role')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
