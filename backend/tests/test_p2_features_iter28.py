"""
Test suite for P2 Features - Iteration 28
Tests: Financial Dashboard, Video Analytics, Resource/Field Management APIs
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_admin_login(self, auth_token):
        """Test admin login works"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Admin login successful, token obtained")


class TestFinancialDashboard:
    """Financial Dashboard API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_player_id(self, auth_headers):
        """Get a player ID for testing"""
        response = requests.get(f"{BASE_URL}/api/admin/players", headers=auth_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0].get("id")
        return None
    
    def test_get_financial_stats(self, auth_headers):
        """Test GET /api/admin/financial/stats returns stats object"""
        response = requests.get(f"{BASE_URL}/api/admin/financial/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify stats structure
        assert "total_revenue" in data
        assert "total_pending" in data
        assert "total_overdue" in data
        assert "total_expected" in data
        assert "monthly_revenue" in data
        assert isinstance(data["monthly_revenue"], list)
        print(f"✓ Financial stats returned: revenue={data['total_revenue']}, pending={data['total_pending']}")
    
    def test_create_financial_record(self, auth_headers, test_player_id):
        """Test POST /api/admin/financial/records creates a record"""
        payload = {
            "player_id": test_player_id,
            "player_name": "TEST_Player",
            "category": "subscription",
            "description": "TEST_Monthly subscription",
            "amount": 50.00,
            "status": "pending",
            "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "notes": "Test record for iteration 28"
        }
        response = requests.post(f"{BASE_URL}/api/admin/financial/records", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data.get("message") == "Record created"
        print(f"✓ Financial record created with ID: {data['id']}")
        return data["id"]
    
    def test_get_financial_records(self, auth_headers):
        """Test GET /api/admin/financial/records returns records list"""
        response = requests.get(f"{BASE_URL}/api/admin/financial/records", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Financial records returned: {len(data)} records")
    
    def test_mark_record_as_paid(self, auth_headers, test_player_id):
        """Test PUT /api/admin/financial/records/{id}/pay marks record as paid"""
        # First create a record
        payload = {
            "player_id": test_player_id,
            "player_name": "TEST_PayTest",
            "category": "fee",
            "description": "TEST_Fee to mark paid",
            "amount": 25.00,
            "status": "pending",
            "due_date": datetime.now().strftime("%Y-%m-%d")
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/financial/records", json=payload, headers=auth_headers)
        assert create_resp.status_code == 200
        record_id = create_resp.json()["id"]
        
        # Mark as paid
        pay_resp = requests.put(f"{BASE_URL}/api/admin/financial/records/{record_id}/pay", 
                                json={"payment_method": "cash"}, headers=auth_headers)
        assert pay_resp.status_code == 200, f"Failed: {pay_resp.text}"
        assert pay_resp.json().get("message") == "Marked as paid"
        
        # Verify it's paid
        get_resp = requests.get(f"{BASE_URL}/api/admin/financial/records", headers=auth_headers)
        records = get_resp.json()
        paid_record = next((r for r in records if r["id"] == record_id), None)
        assert paid_record is not None
        assert paid_record["status"] == "paid"
        print(f"✓ Record {record_id} marked as paid successfully")
    
    def test_filter_records_by_status(self, auth_headers):
        """Test filtering records by status"""
        response = requests.get(f"{BASE_URL}/api/admin/financial/records?status=pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # All returned records should be pending
        for record in data:
            assert record.get("status") == "pending"
        print(f"✓ Filter by status works: {len(data)} pending records")
    
    def test_generate_bulk_dues(self, auth_headers):
        """Test POST /api/admin/financial/generate-dues generates bulk records"""
        # Get academy group and players
        groups_resp = requests.get(f"{BASE_URL}/api/admin/academy-groups", headers=auth_headers)
        players_resp = requests.get(f"{BASE_URL}/api/admin/players", headers=auth_headers)
        
        if groups_resp.status_code != 200 or not groups_resp.json():
            pytest.skip("No academy groups available")
        
        group = groups_resp.json()[0]
        players = players_resp.json()
        
        # Find players in this group
        group_players = [p for p in players if group["id"] in (p.get("academy_group_ids") or []) or p.get("academy_group_id") == group["id"]]
        
        if not group_players:
            # Use any 2 players for testing
            group_players = players[:2] if len(players) >= 2 else players
        
        if not group_players:
            pytest.skip("No players available for bulk dues test")
        
        payload = {
            "player_ids": [p["id"] for p in group_players[:3]],  # Max 3 players
            "amount": 30.00,
            "due_date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
            "description": "TEST_Bulk monthly dues",
            "category": "subscription",
            "academy_group_id": group["id"]
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/financial/generate-dues", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "count" in data
        assert data["count"] > 0
        print(f"✓ Bulk dues generated: {data['count']} records created")


class TestResourceManagement:
    """Resource/Field Management API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_facility(self, auth_headers):
        """Test POST /api/admin/facilities creates a facility"""
        payload = {
            "name": "TEST_Main Field",
            "type": "field",
            "surface": "grass",
            "capacity": 500,
            "dimensions": "105x68m",
            "has_lighting": True,
            "has_changing_rooms": True,
            "address": "Test Address 123",
            "notes": "Test facility for iteration 28"
        }
        response = requests.post(f"{BASE_URL}/api/admin/facilities", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data.get("message") == "Facility created"
        print(f"✓ Facility created with ID: {data['id']}")
        return data["id"]
    
    def test_get_facilities(self, auth_headers):
        """Test GET /api/admin/facilities returns facilities list"""
        response = requests.get(f"{BASE_URL}/api/admin/facilities", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Facilities returned: {len(data)} facilities")
        return data
    
    def test_create_booking(self, auth_headers):
        """Test POST /api/admin/bookings creates a booking"""
        # First get or create a facility
        facilities = requests.get(f"{BASE_URL}/api/admin/facilities", headers=auth_headers).json()
        
        if not facilities:
            # Create one
            fac_resp = requests.post(f"{BASE_URL}/api/admin/facilities", json={
                "name": "TEST_Booking Field",
                "type": "field",
                "surface": "turf"
            }, headers=auth_headers)
            facility_id = fac_resp.json()["id"]
            facility_name = "TEST_Booking Field"
        else:
            facility_id = facilities[0]["id"]
            facility_name = facilities[0]["name"]
        
        # Create booking for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        payload = {
            "facility_id": facility_id,
            "facility_name": facility_name,
            "title": "TEST_Training Session",
            "description": "Test booking",
            "booking_type": "training",
            "date": tomorrow,
            "start_time": "10:00",
            "end_time": "12:00",
            "notes": "Test booking for iteration 28"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/bookings", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data.get("message") == "Booking created"
        print(f"✓ Booking created with ID: {data['id']}")
        return data["id"], facility_id, tomorrow
    
    def test_get_bookings(self, auth_headers):
        """Test GET /api/admin/bookings returns bookings list"""
        response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Bookings returned: {len(data)} bookings")
    
    def test_check_availability(self, auth_headers):
        """Test GET /api/admin/facilities/{id}/availability returns time slots"""
        # Get a facility
        facilities = requests.get(f"{BASE_URL}/api/admin/facilities", headers=auth_headers).json()
        if not facilities:
            pytest.skip("No facilities available")
        
        facility_id = facilities[0]["id"]
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/api/admin/facilities/{facility_id}/availability?date={today}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "slots" in data
        assert isinstance(data["slots"], list)
        assert len(data["slots"]) > 0  # Should have time slots
        
        # Verify slot structure
        slot = data["slots"][0]
        assert "start" in slot
        assert "end" in slot
        assert "available" in slot
        print(f"✓ Availability check returned {len(data['slots'])} time slots")
    
    def test_conflict_detection(self, auth_headers):
        """Test conflict detection prevents double-booking"""
        # Get or create a facility
        facilities = requests.get(f"{BASE_URL}/api/admin/facilities", headers=auth_headers).json()
        
        if not facilities:
            fac_resp = requests.post(f"{BASE_URL}/api/admin/facilities", json={
                "name": "TEST_Conflict Field",
                "type": "field"
            }, headers=auth_headers)
            facility_id = fac_resp.json()["id"]
        else:
            facility_id = facilities[0]["id"]
        
        # Create first booking
        test_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        booking1 = {
            "facility_id": facility_id,
            "title": "TEST_First Booking",
            "date": test_date,
            "start_time": "14:00",
            "end_time": "16:00"
        }
        resp1 = requests.post(f"{BASE_URL}/api/admin/bookings", json=booking1, headers=auth_headers)
        assert resp1.status_code == 200, f"First booking failed: {resp1.text}"
        
        # Try to create overlapping booking
        booking2 = {
            "facility_id": facility_id,
            "title": "TEST_Conflicting Booking",
            "date": test_date,
            "start_time": "15:00",  # Overlaps with 14:00-16:00
            "end_time": "17:00"
        }
        resp2 = requests.post(f"{BASE_URL}/api/admin/bookings", json=booking2, headers=auth_headers)
        
        # Should return 409 Conflict
        assert resp2.status_code == 409, f"Expected 409 conflict, got {resp2.status_code}: {resp2.text}"
        assert "Conflict" in resp2.json().get("detail", "")
        print(f"✓ Conflict detection working: overlapping booking rejected")


class TestVideoAnalytics:
    """Video Analytics API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_team_id(self, auth_headers):
        """Get a team ID for testing"""
        response = requests.get(f"{BASE_URL}/api/admin/teams", headers=auth_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0].get("id")
        return None
    
    def test_create_video(self, auth_headers, test_team_id):
        """Test POST /api/admin/videos creates a video"""
        payload = {
            "title": "TEST_Match Highlights",
            "description": "Test video for iteration 28",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "video_type": "highlights",
            "team_id": test_team_id,
            "duration": "00:03:30",
            "tagged_players": []
        }
        response = requests.post(f"{BASE_URL}/api/admin/videos", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data.get("message") == "Video created"
        print(f"✓ Video created with ID: {data['id']}")
        return data["id"]
    
    def test_get_videos(self, auth_headers):
        """Test GET /api/admin/videos returns videos list"""
        response = requests.get(f"{BASE_URL}/api/admin/videos", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Videos returned: {len(data)} videos")
        return data
    
    def test_get_video_detail(self, auth_headers, test_team_id):
        """Test GET /api/admin/videos/{id} returns video detail"""
        # First create a video
        create_resp = requests.post(f"{BASE_URL}/api/admin/videos", json={
            "title": "TEST_Detail Video",
            "video_url": "https://youtu.be/test123",
            "video_type": "training",
            "team_id": test_team_id
        }, headers=auth_headers)
        video_id = create_resp.json()["id"]
        
        # Get detail
        response = requests.get(f"{BASE_URL}/api/admin/videos/{video_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["id"] == video_id
        assert data["title"] == "TEST_Detail Video"
        assert "markers" in data
        print(f"✓ Video detail returned for ID: {video_id}")
        return video_id
    
    def test_add_marker(self, auth_headers, test_team_id):
        """Test POST /api/admin/videos/{id}/markers adds a marker"""
        # Create a video first
        create_resp = requests.post(f"{BASE_URL}/api/admin/videos", json={
            "title": "TEST_Marker Video",
            "video_url": "https://youtube.com/watch?v=marker123",
            "video_type": "match",
            "team_id": test_team_id
        }, headers=auth_headers)
        video_id = create_resp.json()["id"]
        
        # Add marker
        marker_payload = {
            "timestamp": "00:15:30",
            "timestamp_seconds": 930,
            "label": "TEST_Goal scored",
            "description": "Great team goal",
            "marker_type": "goal",
            "tagged_players": []
        }
        response = requests.post(f"{BASE_URL}/api/admin/videos/{video_id}/markers", json=marker_payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data.get("message") == "Marker added"
        
        # Verify marker was added
        video_resp = requests.get(f"{BASE_URL}/api/admin/videos/{video_id}", headers=auth_headers)
        video = video_resp.json()
        assert len(video.get("markers", [])) > 0
        print(f"✓ Marker added to video {video_id}")
    
    def test_delete_marker(self, auth_headers, test_team_id):
        """Test DELETE /api/admin/videos/{id}/markers/{marker_id} removes marker"""
        # Create video with marker
        create_resp = requests.post(f"{BASE_URL}/api/admin/videos", json={
            "title": "TEST_Delete Marker Video",
            "video_url": "https://youtube.com/watch?v=delmarker",
            "video_type": "match",
            "team_id": test_team_id
        }, headers=auth_headers)
        video_id = create_resp.json()["id"]
        
        # Add marker
        marker_resp = requests.post(f"{BASE_URL}/api/admin/videos/{video_id}/markers", json={
            "timestamp": "00:05:00",
            "label": "TEST_To Delete",
            "marker_type": "note"
        }, headers=auth_headers)
        marker_id = marker_resp.json()["id"]
        
        # Delete marker
        del_resp = requests.delete(f"{BASE_URL}/api/admin/videos/{video_id}/markers/{marker_id}", headers=auth_headers)
        assert del_resp.status_code == 200, f"Failed: {del_resp.text}"
        
        # Verify marker removed
        video_resp = requests.get(f"{BASE_URL}/api/admin/videos/{video_id}", headers=auth_headers)
        video = video_resp.json()
        marker_ids = [m["id"] for m in video.get("markers", [])]
        assert marker_id not in marker_ids
        print(f"✓ Marker {marker_id} deleted from video {video_id}")
    
    def test_filter_videos_by_type(self, auth_headers):
        """Test filtering videos by type"""
        response = requests.get(f"{BASE_URL}/api/admin/videos?video_type=match", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        for video in data:
            assert video.get("video_type") == "match"
        print(f"✓ Filter by video_type works: {len(data)} match videos")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_cleanup_test_data(self, auth_headers):
        """Clean up TEST_ prefixed data"""
        # Clean financial records
        records = requests.get(f"{BASE_URL}/api/admin/financial/records", headers=auth_headers).json()
        deleted_records = 0
        for r in records:
            if "TEST_" in (r.get("player_name", "") or r.get("description", "")):
                requests.delete(f"{BASE_URL}/api/admin/financial/records/{r['id']}", headers=auth_headers)
                deleted_records += 1
        
        # Clean videos
        videos = requests.get(f"{BASE_URL}/api/admin/videos", headers=auth_headers).json()
        deleted_videos = 0
        for v in videos:
            if v.get("title", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/videos/{v['id']}", headers=auth_headers)
                deleted_videos += 1
        
        # Clean facilities
        facilities = requests.get(f"{BASE_URL}/api/admin/facilities", headers=auth_headers).json()
        deleted_facilities = 0
        for f in facilities:
            if f.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/facilities/{f['id']}", headers=auth_headers)
                deleted_facilities += 1
        
        print(f"✓ Cleanup: {deleted_records} records, {deleted_videos} videos, {deleted_facilities} facilities deleted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
