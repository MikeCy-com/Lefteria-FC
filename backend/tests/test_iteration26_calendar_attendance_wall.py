"""
Iteration 26 Tests: Calendar, Attendance, and Wall Posts Features
Tests for the new 360Player-style features:
1. Club Calendar (events CRUD, unified calendar view)
2. Attendance Tracking (mark attendance, stats per player)
3. Wall Posts (announcements with likes, comments, pinning)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


class TestAdminAuth:
    """Test admin authentication for protected endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Verify admin login works"""
        assert admin_token is not None
        assert len(admin_token) > 0


class TestEventsAPI:
    """Test Events CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def test_event_data(self):
        """Sample event data for testing"""
        return {
            "title": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "type": "training",
            "date": "2026-01-20T17:00:00",
            "end_date": "2026-01-20T19:00:00",
            "location": "Γήπεδο Αετού",
            "description": "Test training session"
        }
    
    def test_create_event(self, admin_headers, test_event_data):
        """POST /api/admin/events - Create event"""
        response = requests.post(
            f"{BASE_URL}/api/admin/events",
            json=test_event_data,
            headers=admin_headers
        )
        assert response.status_code == 200, f"Create event failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in response"
        assert data["title"] == test_event_data["title"]
        assert data["type"] == test_event_data["type"]
        assert data["location"] == test_event_data["location"]
        return data["id"]
    
    def test_get_admin_events(self, admin_headers):
        """GET /api/admin/events - Get all events (admin)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get events failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_get_public_events(self):
        """GET /api/events - Get public events (no auth)"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200, f"Get public events failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_create_update_delete_event(self, admin_headers):
        """Full CRUD cycle for events"""
        # CREATE
        event_data = {
            "title": f"TEST_CRUD_Event_{uuid.uuid4().hex[:8]}",
            "type": "meeting",
            "date": "2026-01-25T10:00:00",
            "location": "Γραφεία Συλλόγου"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/events",
            json=event_data,
            headers=admin_headers
        )
        assert create_response.status_code == 200
        event_id = create_response.json()["id"]
        
        # UPDATE
        update_data = {"title": "TEST_Updated_Event", "location": "Νέα Τοποθεσία"}
        update_response = requests.put(
            f"{BASE_URL}/api/admin/events/{event_id}",
            json=update_data,
            headers=admin_headers
        )
        assert update_response.status_code == 200
        
        # DELETE
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/events/{event_id}",
            headers=admin_headers
        )
        assert delete_response.status_code == 200


class TestCalendarAPI:
    """Test unified calendar endpoint"""
    
    def test_get_calendar(self):
        """GET /api/calendar - Get merged events + fixtures"""
        response = requests.get(f"{BASE_URL}/api/calendar")
        assert response.status_code == 200, f"Get calendar failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check that calendar items have expected fields
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "title" in item
            assert "type" in item
            assert "date" in item
            assert "source" in item  # Should be 'event' or 'fixture'
    
    def test_calendar_contains_fixtures(self):
        """Verify calendar includes fixtures as matches"""
        response = requests.get(f"{BASE_URL}/api/calendar")
        assert response.status_code == 200
        data = response.json()
        
        # Check for fixture items (source: fixture)
        fixtures = [item for item in data if item.get("source") == "fixture"]
        assert len(fixtures) > 0, "Calendar should contain fixtures"
        
        # Verify fixture has match type
        for fixture in fixtures[:3]:  # Check first 3
            assert fixture.get("type") == "match", "Fixtures should have type 'match'"


class TestAttendanceAPI:
    """Test Attendance tracking endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def test_event_id(self, admin_headers):
        """Create a test event for attendance"""
        event_data = {
            "title": f"TEST_Attendance_Event_{uuid.uuid4().hex[:8]}",
            "type": "training",
            "date": "2026-01-22T17:00:00"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/events",
            json=event_data,
            headers=admin_headers
        )
        return response.json()["id"]
    
    def test_save_attendance(self, admin_headers, test_event_id):
        """POST /api/admin/events/{id}/attendance - Save attendance records"""
        attendance_data = {
            "responses": [
                {"player_id": "test-player-1", "player_name": "Test Player 1", "status": "going"},
                {"player_id": "test-player-2", "player_name": "Test Player 2", "status": "not_going"},
                {"player_id": "test-player-3", "player_name": "Test Player 3", "status": "no_response"}
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/events/{test_event_id}/attendance",
            json=attendance_data,
            headers=admin_headers
        )
        assert response.status_code == 200, f"Save attendance failed: {response.text}"
        data = response.json()
        assert "count" in data
        assert data["count"] == 3
    
    def test_get_event_attendance(self, admin_headers, test_event_id):
        """GET /api/admin/events/{id}/attendance - Get attendance for event"""
        # First save some attendance
        attendance_data = {
            "responses": [
                {"player_id": "test-player-1", "player_name": "Test Player 1", "status": "going"}
            ]
        }
        requests.post(
            f"{BASE_URL}/api/admin/events/{test_event_id}/attendance",
            json=attendance_data,
            headers=admin_headers
        )
        
        # Then get it
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{test_event_id}/attendance",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get attendance failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_attendance_stats(self, admin_headers):
        """GET /api/admin/attendance/stats - Get per-player attendance rates"""
        response = requests.get(
            f"{BASE_URL}/api/admin/attendance/stats",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        assert "total_events" in data
        assert "player_stats" in data
        assert "overall" in data
        assert isinstance(data["player_stats"], list)


class TestWallPostsAPI:
    """Test Wall Posts (announcements) endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def test_post_data(self):
        """Sample post data"""
        return {
            "content": f"TEST_Post_{uuid.uuid4().hex[:8]} - Ανακοίνωση δοκιμής",
            "pinned": False
        }
    
    def test_create_post(self, admin_headers, test_post_data):
        """POST /api/admin/posts - Create wall post"""
        response = requests.post(
            f"{BASE_URL}/api/admin/posts",
            json=test_post_data,
            headers=admin_headers
        )
        assert response.status_code == 200, f"Create post failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["content"] == test_post_data["content"]
        assert "author_name" in data
        assert "created_at" in data
        return data["id"]
    
    def test_get_admin_posts(self, admin_headers):
        """GET /api/admin/posts - Get all posts (admin)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/posts",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get posts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_public_posts(self):
        """GET /api/posts - Get public posts (no auth)"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200, f"Get public posts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_like_post(self, admin_headers):
        """POST /api/posts/{id}/like - Toggle like on post"""
        # First create a post
        post_data = {"content": f"TEST_Like_Post_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(
            f"{BASE_URL}/api/admin/posts",
            json=post_data,
            headers=admin_headers
        )
        post_id = create_response.json()["id"]
        
        # Like the post
        like_response = requests.post(
            f"{BASE_URL}/api/posts/{post_id}/like",
            json={"user_id": "test-user-1"}
        )
        assert like_response.status_code == 200, f"Like post failed: {like_response.text}"
        data = like_response.json()
        assert "likes" in data
        assert "liked" in data
        assert data["liked"] == True
        
        # Unlike (toggle)
        unlike_response = requests.post(
            f"{BASE_URL}/api/posts/{post_id}/like",
            json={"user_id": "test-user-1"}
        )
        assert unlike_response.status_code == 200
        assert unlike_response.json()["liked"] == False
    
    def test_add_comment(self, admin_headers):
        """POST /api/posts/{id}/comments - Add comment to post"""
        # First create a post
        post_data = {"content": f"TEST_Comment_Post_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(
            f"{BASE_URL}/api/admin/posts",
            json=post_data,
            headers=admin_headers
        )
        post_id = create_response.json()["id"]
        
        # Add comment
        comment_data = {
            "author_name": "Test User",
            "content": "Test comment content"
        }
        comment_response = requests.post(
            f"{BASE_URL}/api/posts/{post_id}/comments",
            json=comment_data
        )
        assert comment_response.status_code == 200, f"Add comment failed: {comment_response.text}"
        data = comment_response.json()
        assert "id" in data
        assert data["content"] == comment_data["content"]
        assert data["author_name"] == comment_data["author_name"]
    
    def test_get_comments(self, admin_headers):
        """GET /api/posts/{id}/comments - Get comments for post"""
        # First create a post with a comment
        post_data = {"content": f"TEST_GetComments_Post_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(
            f"{BASE_URL}/api/admin/posts",
            json=post_data,
            headers=admin_headers
        )
        post_id = create_response.json()["id"]
        
        # Add a comment
        requests.post(
            f"{BASE_URL}/api/posts/{post_id}/comments",
            json={"author_name": "Test", "content": "Test comment"}
        )
        
        # Get comments
        response = requests.get(f"{BASE_URL}/api/posts/{post_id}/comments")
        assert response.status_code == 200, f"Get comments failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_toggle_pin_post(self, admin_headers):
        """PUT /api/admin/posts/{id}/pin - Toggle pin status"""
        # Create a post
        post_data = {"content": f"TEST_Pin_Post_{uuid.uuid4().hex[:8]}", "pinned": False}
        create_response = requests.post(
            f"{BASE_URL}/api/admin/posts",
            json=post_data,
            headers=admin_headers
        )
        post_id = create_response.json()["id"]
        
        # Pin the post
        pin_response = requests.put(
            f"{BASE_URL}/api/admin/posts/{post_id}/pin",
            json={},
            headers=admin_headers
        )
        assert pin_response.status_code == 200, f"Pin post failed: {pin_response.text}"
        data = pin_response.json()
        assert "pinned" in data
        assert data["pinned"] == True
        
        # Unpin (toggle)
        unpin_response = requests.put(
            f"{BASE_URL}/api/admin/posts/{post_id}/pin",
            json={},
            headers=admin_headers
        )
        assert unpin_response.status_code == 200
        assert unpin_response.json()["pinned"] == False
    
    def test_delete_post(self, admin_headers):
        """DELETE /api/admin/posts/{id} - Delete post"""
        # Create a post
        post_data = {"content": f"TEST_Delete_Post_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(
            f"{BASE_URL}/api/admin/posts",
            json=post_data,
            headers=admin_headers
        )
        post_id = create_response.json()["id"]
        
        # Delete the post
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/posts/{post_id}",
            headers=admin_headers
        )
        assert delete_response.status_code == 200, f"Delete post failed: {delete_response.text}"


class TestPostsWithTeamFilter:
    """Test posts filtering by team/academy group"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_post_with_team_targeting(self, admin_headers):
        """Create post targeted to specific team"""
        # Get a team ID first
        teams_response = requests.get(f"{BASE_URL}/api/teams")
        teams = teams_response.json()
        if len(teams) > 0:
            team_id = teams[0]["id"]
            
            post_data = {
                "content": f"TEST_Team_Post_{uuid.uuid4().hex[:8]}",
                "team_id": team_id
            }
            response = requests.post(
                f"{BASE_URL}/api/admin/posts",
                json=post_data,
                headers=admin_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["team_id"] == team_id
    
    def test_get_posts_with_team_filter(self):
        """GET /api/posts with team_id filter"""
        # Get a team ID
        teams_response = requests.get(f"{BASE_URL}/api/teams")
        teams = teams_response.json()
        if len(teams) > 0:
            team_id = teams[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/posts?team_id={team_id}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_cleanup_test_events(self, admin_headers):
        """Clean up TEST_ prefixed events"""
        response = requests.get(f"{BASE_URL}/api/admin/events", headers=admin_headers)
        if response.status_code == 200:
            events = response.json()
            for event in events:
                if event.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/admin/events/{event['id']}",
                        headers=admin_headers
                    )
        assert True  # Cleanup is best-effort
    
    def test_cleanup_test_posts(self, admin_headers):
        """Clean up TEST_ prefixed posts"""
        response = requests.get(f"{BASE_URL}/api/admin/posts", headers=admin_headers)
        if response.status_code == 200:
            posts = response.json()
            for post in posts:
                if post.get("content", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/admin/posts/{post['id']}",
                        headers=admin_headers
                    )
        assert True  # Cleanup is best-effort


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
