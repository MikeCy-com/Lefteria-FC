"""
Iteration 27 Tests: Training Sessions, Player Development Plans, Player Evaluations
Tests the new 360Player-style features added in Phase 2:
- Training Session Planning (inside Team/Academy drill-down sub-tabs)
- Player Development Plans (inside AdminPlayerProfile)
- Player Evaluation System (inside AdminPlayerProfile)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"

# Known test data from previous iterations
ACADEMY_GROUP_U12_ID = "7dda3b6a-afc6-48d2-9f64-8907533c2f34"

@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture(scope="module")
def test_player_id(auth_headers):
    """Get a player ID for testing development and evaluations"""
    # Get players from U12 academy group
    response = requests.get(f"{BASE_URL}/api/academy-groups/{ACADEMY_GROUP_U12_ID}/players", headers=auth_headers)
    assert response.status_code == 200, f"Get players failed: {response.text}"
    players = response.json()
    if players:
        return players[0]["id"]
    # Fallback to all players
    response = requests.get(f"{BASE_URL}/api/players", headers=auth_headers)
    assert response.status_code == 200
    players = response.json()
    if players:
        return players[0]["id"]
    pytest.skip("No players found for testing")


class TestTrainingSessions:
    """Training Session CRUD tests"""
    
    created_session_id = None
    
    def test_create_training_session(self, auth_headers):
        """POST /api/admin/training-sessions creates training session with exercises, tags, intensity"""
        payload = {
            "title": "TEST_Τεχνική Προπόνηση",
            "date": "2026-01-20T10:00:00",
            "duration_minutes": 90,
            "intensity": "high",
            "tags": ["possession", "passing", "1v1"],
            "exercises": [
                {"name": "Rondo 4v2", "description": "Κατοχή μπάλας", "duration_minutes": 15, "equipment": "Κώνοι"},
                {"name": "Πάσες σε τρίγωνο", "description": "Ακρίβεια πάσας", "duration_minutes": 10, "equipment": "Μπάλες"}
            ],
            "notes": "Έμφαση στην κατοχή",
            "academy_group_id": ACADEMY_GROUP_U12_ID
        }
        response = requests.post(f"{BASE_URL}/api/admin/training-sessions", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create training session failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "No ID in response"
        assert data["title"] == payload["title"]
        assert data["intensity"] == "high"
        assert len(data["tags"]) == 3
        assert "possession" in data["tags"]
        assert len(data["exercises"]) == 2
        assert data["exercises"][0]["name"] == "Rondo 4v2"
        assert data["academy_group_id"] == ACADEMY_GROUP_U12_ID
        
        TestTrainingSessions.created_session_id = data["id"]
        print(f"Created training session: {data['id']}")
    
    def test_get_training_sessions_by_academy_group(self, auth_headers):
        """GET /api/admin/training-sessions?academy_group_id= returns sessions for group"""
        response = requests.get(
            f"{BASE_URL}/api/admin/training-sessions?academy_group_id={ACADEMY_GROUP_U12_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get training sessions failed: {response.text}"
        
        sessions = response.json()
        assert isinstance(sessions, list)
        # Should contain our created session
        if TestTrainingSessions.created_session_id:
            session_ids = [s["id"] for s in sessions]
            assert TestTrainingSessions.created_session_id in session_ids, "Created session not found in list"
        print(f"Found {len(sessions)} training sessions for U12 group")
    
    def test_update_training_session(self, auth_headers):
        """PUT /api/admin/training-sessions/{id} updates session"""
        if not TestTrainingSessions.created_session_id:
            pytest.skip("No session created to update")
        
        update_payload = {
            "title": "TEST_Τεχνική Προπόνηση (Ενημερωμένη)",
            "intensity": "medium",
            "tags": ["possession", "passing", "shooting"]
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/training-sessions/{TestTrainingSessions.created_session_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Update training session failed: {response.text}"
        
        # Verify update
        get_response = requests.get(
            f"{BASE_URL}/api/admin/training-sessions?academy_group_id={ACADEMY_GROUP_U12_ID}",
            headers=auth_headers
        )
        sessions = get_response.json()
        updated = next((s for s in sessions if s["id"] == TestTrainingSessions.created_session_id), None)
        assert updated is not None
        assert updated["intensity"] == "medium"
        assert "shooting" in updated["tags"]
        print("Training session updated successfully")
    
    def test_delete_training_session(self, auth_headers):
        """DELETE /api/admin/training-sessions/{id} removes session"""
        if not TestTrainingSessions.created_session_id:
            pytest.skip("No session created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/training-sessions/{TestTrainingSessions.created_session_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete training session failed: {response.text}"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/admin/training-sessions?academy_group_id={ACADEMY_GROUP_U12_ID}",
            headers=auth_headers
        )
        sessions = get_response.json()
        session_ids = [s["id"] for s in sessions]
        assert TestTrainingSessions.created_session_id not in session_ids, "Session still exists after delete"
        print("Training session deleted successfully")


class TestPlayerDevelopment:
    """Player Development Plans CRUD tests"""
    
    created_goal_id = None
    
    def test_create_development_goal(self, auth_headers, test_player_id):
        """POST /api/admin/players/{id}/development creates development goal with milestones"""
        payload = {
            "title": "TEST_Βελτίωση αριστερού ποδιού",
            "category": "technical",
            "description": "Εξάσκηση στο αριστερό πόδι για καλύτερη ακρίβεια",
            "target_date": "2026-06-30",
            "milestones": [
                {"text": "10 σουτ με αριστερό ανά προπόνηση", "completed": False},
                {"text": "Πάσες μόνο με αριστερό σε rondo", "completed": False},
                {"text": "Γκολ με αριστερό σε αγώνα", "completed": False}
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/players/{test_player_id}/development",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Create development goal failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["category"] == "technical"
        assert len(data["milestones"]) == 3
        assert data["progress"] == 0
        assert data["status"] == "active"
        
        TestPlayerDevelopment.created_goal_id = data["id"]
        print(f"Created development goal: {data['id']}")
    
    def test_get_development_goals(self, auth_headers, test_player_id):
        """GET /api/admin/players/{id}/development returns goals list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/players/{test_player_id}/development",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get development goals failed: {response.text}"
        
        goals = response.json()
        assert isinstance(goals, list)
        if TestPlayerDevelopment.created_goal_id:
            goal_ids = [g["id"] for g in goals]
            assert TestPlayerDevelopment.created_goal_id in goal_ids
        print(f"Found {len(goals)} development goals for player")
    
    def test_update_development_goal_progress(self, auth_headers, test_player_id):
        """PUT /api/admin/development/{id} updates goal (progress, milestones)"""
        if not TestPlayerDevelopment.created_goal_id:
            pytest.skip("No goal created to update")
        
        # Update with one milestone completed
        update_payload = {
            "milestones": [
                {"text": "10 σουτ με αριστερό ανά προπόνηση", "completed": True},
                {"text": "Πάσες μόνο με αριστερό σε rondo", "completed": False},
                {"text": "Γκολ με αριστερό σε αγώνα", "completed": False}
            ],
            "progress": 33  # 1/3 milestones completed
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/development/{TestPlayerDevelopment.created_goal_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Update development goal failed: {response.text}"
        
        # Verify update
        get_response = requests.get(
            f"{BASE_URL}/api/admin/players/{test_player_id}/development",
            headers=auth_headers
        )
        goals = get_response.json()
        updated = next((g for g in goals if g["id"] == TestPlayerDevelopment.created_goal_id), None)
        assert updated is not None
        assert updated["progress"] == 33
        assert updated["milestones"][0]["completed"] == True
        print("Development goal progress updated successfully")
    
    def test_delete_development_goal(self, auth_headers, test_player_id):
        """DELETE /api/admin/development/{id} removes goal"""
        if not TestPlayerDevelopment.created_goal_id:
            pytest.skip("No goal created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/development/{TestPlayerDevelopment.created_goal_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete development goal failed: {response.text}"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/admin/players/{test_player_id}/development",
            headers=auth_headers
        )
        goals = get_response.json()
        goal_ids = [g["id"] for g in goals]
        assert TestPlayerDevelopment.created_goal_id not in goal_ids
        print("Development goal deleted successfully")


class TestPlayerEvaluations:
    """Player Evaluation System tests"""
    
    created_eval_id = None
    
    def test_create_evaluation(self, auth_headers, test_player_id):
        """POST /api/admin/players/{id}/evaluations creates evaluation with ratings (1-10) for 5 categories"""
        payload = {
            "period": "Ιαν 2026",
            "ratings": {
                "technical": 7,
                "tactical": 6,
                "physical": 8,
                "mental": 7,
                "teamwork": 9
            },
            "overall": 7.4,  # avg of 5 categories
            "strengths": "Εξαιρετική ομαδικότητα, καλή φυσική κατάσταση",
            "areas_to_improve": "Τακτική κατανόηση, τοποθέτηση",
            "coach_notes": "Πολύ καλή πρόοδος τον τελευταίο μήνα"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/players/{test_player_id}/evaluations",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Create evaluation failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["period"] == "Ιαν 2026"
        assert data["ratings"]["technical"] == 7
        assert data["ratings"]["tactical"] == 6
        assert data["ratings"]["physical"] == 8
        assert data["ratings"]["mental"] == 7
        assert data["ratings"]["teamwork"] == 9
        assert data["overall"] == 7.4
        assert data["strengths"] == payload["strengths"]
        assert data["areas_to_improve"] == payload["areas_to_improve"]
        
        TestPlayerEvaluations.created_eval_id = data["id"]
        print(f"Created evaluation: {data['id']}")
    
    def test_get_evaluations(self, auth_headers, test_player_id):
        """GET /api/admin/players/{id}/evaluations returns evaluations list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/players/{test_player_id}/evaluations",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get evaluations failed: {response.text}"
        
        evals = response.json()
        assert isinstance(evals, list)
        if TestPlayerEvaluations.created_eval_id:
            eval_ids = [e["id"] for e in evals]
            assert TestPlayerEvaluations.created_eval_id in eval_ids
        print(f"Found {len(evals)} evaluations for player")
    
    def test_evaluation_ratings_validation(self, auth_headers, test_player_id):
        """Verify evaluation ratings are stored correctly (1-10 scale)"""
        if not TestPlayerEvaluations.created_eval_id:
            pytest.skip("No evaluation created")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/players/{test_player_id}/evaluations",
            headers=auth_headers
        )
        evals = response.json()
        created_eval = next((e for e in evals if e["id"] == TestPlayerEvaluations.created_eval_id), None)
        
        assert created_eval is not None
        ratings = created_eval["ratings"]
        
        # Verify all 5 categories exist
        assert "technical" in ratings
        assert "tactical" in ratings
        assert "physical" in ratings
        assert "mental" in ratings
        assert "teamwork" in ratings
        
        # Verify ratings are in valid range
        for key, value in ratings.items():
            assert 1 <= value <= 10, f"Rating {key}={value} out of range"
        
        print("Evaluation ratings validated successfully")
    
    def test_delete_evaluation(self, auth_headers, test_player_id):
        """DELETE /api/admin/evaluations/{id} removes evaluation"""
        if not TestPlayerEvaluations.created_eval_id:
            pytest.skip("No evaluation created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/evaluations/{TestPlayerEvaluations.created_eval_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete evaluation failed: {response.text}"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/admin/players/{test_player_id}/evaluations",
            headers=auth_headers
        )
        evals = get_response.json()
        eval_ids = [e["id"] for e in evals]
        assert TestPlayerEvaluations.created_eval_id not in eval_ids
        print("Evaluation deleted successfully")


class TestExistingFeatures:
    """Verify existing features still work (regression tests)"""
    
    def test_calendar_endpoint(self, auth_headers):
        """GET /api/calendar still works"""
        response = requests.get(f"{BASE_URL}/api/calendar", headers=auth_headers)
        assert response.status_code == 200, f"Calendar endpoint failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Calendar returns {len(data)} items")
    
    def test_attendance_stats(self, auth_headers):
        """GET /api/admin/attendance/stats still works"""
        response = requests.get(
            f"{BASE_URL}/api/admin/attendance/stats?academy_group_id={ACADEMY_GROUP_U12_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Attendance stats failed: {response.text}"
        print("Attendance stats endpoint working")
    
    def test_wall_posts(self, auth_headers):
        """GET /api/admin/posts still works"""
        response = requests.get(f"{BASE_URL}/api/admin/posts", headers=auth_headers)
        assert response.status_code == 200, f"Wall posts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Wall posts returns {len(data)} posts")
    
    def test_dashboard_stats(self, auth_headers):
        """GET /api/admin/dashboard still works"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        assert "total_players" in data or "players" in data or isinstance(data, dict)
        print("Dashboard endpoint working")
    
    def test_academy_groups(self, auth_headers):
        """GET /api/academy-groups still works"""
        response = requests.get(f"{BASE_URL}/api/academy-groups", headers=auth_headers)
        assert response.status_code == 200, f"Academy groups failed: {response.text}"
        groups = response.json()
        assert isinstance(groups, list)
        # Verify U12 group exists
        group_ids = [g["id"] for g in groups]
        assert ACADEMY_GROUP_U12_ID in group_ids, "U12 group not found"
        print(f"Found {len(groups)} academy groups")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
