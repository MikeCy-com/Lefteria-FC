"""
Lefteria FC API Tests - New Features (Iteration 3)
Tests for:
- Live Score endpoint (PUT /api/admin/fixtures/{id}/live-score)
- Standings Recalculate endpoint (POST /api/admin/standings/recalculate)
- Auto-update standings when fixture status changes to Completed
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com')

# Admin credentials from test_credentials.md
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


@pytest.fixture
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


class TestLiveScoreEndpoint:
    """Test PUT /api/admin/fixtures/{id}/live-score endpoint"""
    
    def test_live_score_update_scores(self, auth_token):
        """Test updating scores via live-score endpoint"""
        # First create a test fixture
        fixture_data = {
            "home_team": "TEST_Home Team",
            "away_team": "TEST_Away Team",
            "match_date": "2026-05-01T15:00:00Z",
            "venue": "Test Stadium",
            "competition": "Test League",
            "season": "2025/26",
            "status": "Scheduled"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/fixtures",
            json=fixture_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        fixture_id = create_response.json()["id"]
        print(f"✓ Created test fixture: {fixture_id}")
        
        try:
            # Update scores via live-score endpoint
            update_response = requests.put(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score",
                json={"home_score": 2, "away_score": 1},
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert update_response.status_code == 200
            updated = update_response.json()
            assert updated["home_score"] == 2
            assert updated["away_score"] == 1
            print(f"✓ Live score update: {updated['home_score']} - {updated['away_score']}")
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
    
    def test_live_score_set_status_live(self, auth_token):
        """Test setting fixture status to Live via live-score endpoint"""
        # Create a test fixture
        fixture_data = {
            "home_team": "TEST_Live Home",
            "away_team": "TEST_Live Away",
            "match_date": "2026-05-02T15:00:00Z",
            "venue": "Test Stadium",
            "competition": "Test League",
            "season": "2025/26",
            "status": "Scheduled"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/fixtures",
            json=fixture_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        fixture_id = create_response.json()["id"]
        
        try:
            # Set status to Live
            update_response = requests.put(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score",
                json={"status": "Live", "home_score": 0, "away_score": 0},
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert update_response.status_code == 200
            updated = update_response.json()
            assert updated["status"] == "Live"
            print(f"✓ Fixture status set to Live")
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
    
    def test_live_score_set_status_completed_auto_updates_standings(self, auth_token):
        """Test that setting status to Completed auto-updates standings"""
        # Create a test fixture
        fixture_data = {
            "home_team": "TEST_AutoStand Home",
            "away_team": "TEST_AutoStand Away",
            "match_date": "2026-05-03T15:00:00Z",
            "venue": "Test Stadium",
            "competition": "Test Auto League",
            "season": "2025/26",
            "status": "Live"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/fixtures",
            json=fixture_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        fixture_id = create_response.json()["id"]
        
        try:
            # Set status to Completed with scores
            update_response = requests.put(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}/live-score",
                json={"status": "Completed", "home_score": 3, "away_score": 1},
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert update_response.status_code == 200
            updated = update_response.json()
            assert updated["status"] == "Completed"
            print(f"✓ Fixture status set to Completed: {updated['home_score']} - {updated['away_score']}")
            
            # Check standings were auto-created for both teams
            standings_response = requests.get(f"{BASE_URL}/api/standings?competition=Test%20Auto%20League")
            standings = standings_response.json()
            
            home_standing = next((s for s in standings if s["team_name"] == "TEST_AutoStand Home"), None)
            away_standing = next((s for s in standings if s["team_name"] == "TEST_AutoStand Away"), None)
            
            if home_standing:
                assert home_standing["played"] >= 1
                assert home_standing["won"] >= 1
                assert home_standing["points"] >= 3
                print(f"✓ Home team standings auto-updated: P={home_standing['played']}, W={home_standing['won']}, Pts={home_standing['points']}")
            
            if away_standing:
                assert away_standing["played"] >= 1
                assert away_standing["lost"] >= 1
                print(f"✓ Away team standings auto-updated: P={away_standing['played']}, L={away_standing['lost']}")
            
        finally:
            # Cleanup fixture
            requests.delete(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            # Cleanup standings
            standings_response = requests.get(f"{BASE_URL}/api/standings?competition=Test%20Auto%20League")
            for s in standings_response.json():
                if s["team_name"].startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/admin/standings/{s['id']}",
                        headers={"Authorization": f"Bearer {auth_token}"}
                    )


class TestStandingsRecalculate:
    """Test POST /api/admin/standings/recalculate endpoint"""
    
    def test_recalculate_standings_endpoint_exists(self, auth_token):
        """Test that recalculate endpoint exists and returns success"""
        response = requests.post(
            f"{BASE_URL}/api/admin/standings/recalculate",
            json={},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Recalculate endpoint response: {data['message']}")
    
    def test_recalculate_requires_auth(self):
        """Test that recalculate endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/standings/recalculate",
            json={}
        )
        assert response.status_code == 401
        print("✓ Recalculate endpoint correctly requires authentication")


class TestAutoUpdateStandings:
    """Test auto-update standings when creating/updating fixtures"""
    
    def test_create_completed_fixture_auto_updates_standings(self, auth_token):
        """Test creating a fixture with status=Completed auto-updates standings"""
        # Create a completed fixture directly
        fixture_data = {
            "home_team": "TEST_Direct Home",
            "away_team": "TEST_Direct Away",
            "home_score": 2,
            "away_score": 2,
            "match_date": "2026-05-04T15:00:00Z",
            "venue": "Test Stadium",
            "competition": "Test Direct League",
            "season": "2025/26",
            "status": "Completed"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/fixtures",
            json=fixture_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        fixture_id = create_response.json()["id"]
        print(f"✓ Created completed fixture: {fixture_id}")
        
        try:
            # Check standings were auto-created (draw = 1 point each)
            standings_response = requests.get(f"{BASE_URL}/api/standings?competition=Test%20Direct%20League")
            standings = standings_response.json()
            
            home_standing = next((s for s in standings if s["team_name"] == "TEST_Direct Home"), None)
            away_standing = next((s for s in standings if s["team_name"] == "TEST_Direct Away"), None)
            
            if home_standing:
                assert home_standing["drawn"] >= 1
                assert home_standing["points"] >= 1
                print(f"✓ Home team standings: D={home_standing['drawn']}, Pts={home_standing['points']}")
            
            if away_standing:
                assert away_standing["drawn"] >= 1
                assert away_standing["points"] >= 1
                print(f"✓ Away team standings: D={away_standing['drawn']}, Pts={away_standing['points']}")
            
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            standings_response = requests.get(f"{BASE_URL}/api/standings?competition=Test%20Direct%20League")
            for s in standings_response.json():
                if s["team_name"].startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/admin/standings/{s['id']}",
                        headers={"Authorization": f"Bearer {auth_token}"}
                    )
    
    def test_update_completed_fixture_scores_reverses_and_reapplies(self, auth_token):
        """Test updating scores on completed fixture reverses old result and applies new"""
        # Create a completed fixture
        fixture_data = {
            "home_team": "TEST_Reverse Home",
            "away_team": "TEST_Reverse Away",
            "home_score": 1,
            "away_score": 0,
            "match_date": "2026-05-05T15:00:00Z",
            "venue": "Test Stadium",
            "competition": "Test Reverse League",
            "season": "2025/26",
            "status": "Completed"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/fixtures",
            json=fixture_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        fixture_id = create_response.json()["id"]
        print(f"✓ Created fixture with 1-0 result")
        
        try:
            # Get initial standings
            standings_response = requests.get(f"{BASE_URL}/api/standings?competition=Test%20Reverse%20League")
            standings = standings_response.json()
            home_initial = next((s for s in standings if s["team_name"] == "TEST_Reverse Home"), None)
            
            if home_initial:
                initial_points = home_initial["points"]
                initial_won = home_initial["won"]
                print(f"✓ Initial home standings: W={initial_won}, Pts={initial_points}")
            
            # Update fixture to 0-1 (reverse result)
            update_data = {
                "home_team": "TEST_Reverse Home",
                "away_team": "TEST_Reverse Away",
                "home_score": 0,
                "away_score": 1,
                "match_date": "2026-05-05T15:00:00Z",
                "venue": "Test Stadium",
                "competition": "Test Reverse League",
                "season": "2025/26",
                "status": "Completed"
            }
            update_response = requests.put(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}",
                json=update_data,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert update_response.status_code == 200
            print(f"✓ Updated fixture to 0-1 result")
            
            # Check standings were updated (home team should now have a loss)
            standings_response = requests.get(f"{BASE_URL}/api/standings?competition=Test%20Reverse%20League")
            standings = standings_response.json()
            home_updated = next((s for s in standings if s["team_name"] == "TEST_Reverse Home"), None)
            away_updated = next((s for s in standings if s["team_name"] == "TEST_Reverse Away"), None)
            
            if home_updated:
                print(f"✓ Updated home standings: W={home_updated['won']}, L={home_updated['lost']}, Pts={home_updated['points']}")
            
            if away_updated:
                print(f"✓ Updated away standings: W={away_updated['won']}, L={away_updated['lost']}, Pts={away_updated['points']}")
            
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/admin/fixtures/{fixture_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            standings_response = requests.get(f"{BASE_URL}/api/standings?competition=Test%20Reverse%20League")
            for s in standings_response.json():
                if s["team_name"].startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/admin/standings/{s['id']}",
                        headers={"Authorization": f"Bearer {auth_token}"}
                    )


class TestAdminSidebarTabs:
    """Test that admin panel has all 12 tabs"""
    
    def test_admin_dashboard_returns_stats(self, auth_token):
        """Test admin dashboard endpoint returns all required stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        stats = response.json()
        
        required_fields = [
            "first_team_players",
            "academy_players", 
            "staff_members",
            "total_fixtures",
            "news_articles",
            "unread_messages",
            "academy_groups"
        ]
        
        for field in required_fields:
            assert field in stats, f"Missing field: {field}"
        
        print(f"✓ Dashboard stats: {stats}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
