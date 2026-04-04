"""
Iteration 8: Standings Column Configuration Tests
Tests for the new admin feature to toggle which columns appear in the public standings table.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStandingsColumnsPublicAPI:
    """Public API tests for standings column configuration"""
    
    def test_get_standings_columns_returns_default_config(self):
        """GET /api/settings/standings-columns returns default column config"""
        response = requests.get(f"{BASE_URL}/api/settings/standings-columns")
        assert response.status_code == 200
        
        data = response.json()
        # Verify default config: played/won/drawn/lost/goal_difference/points true, goals_for/goals_against/form false
        assert data.get("played") == True, "played should be True by default"
        assert data.get("won") == True, "won should be True by default"
        assert data.get("drawn") == True, "drawn should be True by default"
        assert data.get("lost") == True, "lost should be True by default"
        assert data.get("goal_difference") == True, "goal_difference should be True by default"
        assert data.get("points") == True, "points should be True by default"
        assert data.get("goals_for") == False, "goals_for should be False by default"
        assert data.get("goals_against") == False, "goals_against should be False by default"
        assert data.get("form") == False, "form should be False by default"
        print("PASS: GET /api/settings/standings-columns returns correct default config")


class TestStandingsColumnsAdminAPI:
    """Admin API tests for standings column configuration (requires auth)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_put_standings_columns_without_auth_returns_401(self):
        """PUT /api/admin/settings/standings-columns without auth returns 401"""
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/standings-columns",
            json={
                "played": True, "won": True, "drawn": True, "lost": True,
                "goals_for": True, "goals_against": True, "goal_difference": True,
                "points": True, "form": True
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: PUT /api/admin/settings/standings-columns without auth returns 401")
    
    def test_put_standings_columns_with_auth_updates_config(self, auth_token):
        """PUT /api/admin/settings/standings-columns updates column config (requires auth)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Update config to enable goals_for
        new_config = {
            "played": True, "won": True, "drawn": True, "lost": True,
            "goals_for": True, "goals_against": False, "goal_difference": True,
            "points": True, "form": False
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/standings-columns",
            json=new_config,
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("goals_for") == True, "goals_for should be updated to True"
        print("PASS: PUT /api/admin/settings/standings-columns updates config with auth")
        
        # Verify persistence by fetching again
        get_response = requests.get(f"{BASE_URL}/api/settings/standings-columns")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data.get("goals_for") == True, "goals_for should persist as True"
        print("PASS: Settings persist in MongoDB (reload shows same config)")
    
    def test_toggle_goals_for_on_and_verify(self, auth_token):
        """Toggle Goals For (goals_for) on in admin and verify"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Enable goals_for
        config_with_goals_for = {
            "played": True, "won": True, "drawn": True, "lost": True,
            "goals_for": True, "goals_against": False, "goal_difference": True,
            "points": True, "form": False
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/standings-columns",
            json=config_with_goals_for,
            headers=headers
        )
        assert response.status_code == 200
        assert response.json().get("goals_for") == True
        print("PASS: Toggling goals_for on works correctly")
    
    def test_toggle_form_on_and_verify(self, auth_token):
        """Toggle Form column on in admin and verify"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Enable form
        config_with_form = {
            "played": True, "won": True, "drawn": True, "lost": True,
            "goals_for": False, "goals_against": False, "goal_difference": True,
            "points": True, "form": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/standings-columns",
            json=config_with_form,
            headers=headers
        )
        assert response.status_code == 200
        assert response.json().get("form") == True
        print("PASS: Toggling form on works correctly")
    
    def test_reset_to_default_config(self, auth_token):
        """Reset config back to default values"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Reset to default
        default_config = {
            "played": True, "won": True, "drawn": True, "lost": True,
            "goals_for": False, "goals_against": False, "goal_difference": True,
            "points": True, "form": False
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/standings-columns",
            json=default_config,
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify reset
        get_response = requests.get(f"{BASE_URL}/api/settings/standings-columns")
        data = get_response.json()
        assert data.get("goals_for") == False
        assert data.get("goals_against") == False
        assert data.get("form") == False
        print("PASS: Reset to default config works correctly")


class TestStandingsAPIIntegration:
    """Integration tests for standings with column config"""
    
    def test_standings_api_returns_data(self):
        """GET /api/standings returns standings data"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Standings should be a list"
        
        if len(data) > 0:
            # Verify standings have all required fields
            standing = data[0]
            required_fields = ["team_name", "played", "won", "drawn", "lost", 
                             "goals_for", "goals_against", "goal_difference", "points"]
            for field in required_fields:
                assert field in standing, f"Standing should have {field} field"
        print(f"PASS: GET /api/standings returns {len(data)} teams")


class TestAdminLogin:
    """Admin login tests"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "username" in data, "Response should contain username"
        assert data["username"] == "Lefteria FC"
        print("PASS: Admin login with correct credentials works")
    
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Admin login with wrong password returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
