"""
Iteration 21: Academy Player Management Tests
Tests for:
- Academy player CRUD (create, read, update, delete)
- Player transfer between groups (multi-group support)
- Academy group fixtures CRUD
- Parent contact info fields
- DOB auto-age calculation
- Public player profile endpoint
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAcademyPlayerManagement:
    """Academy player CRUD and transfer tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and academy groups"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get academy groups
        groups_response = self.session.get(f"{BASE_URL}/api/academy-groups")
        assert groups_response.status_code == 200
        self.groups = groups_response.json()
        assert len(self.groups) > 0, "No academy groups found"
        self.first_group = self.groups[0]
        
        yield
        
        # Cleanup: Delete test players created during tests
        players_response = self.session.get(f"{BASE_URL}/api/players?team_type=Academy")
        if players_response.status_code == 200:
            for player in players_response.json():
                if player.get("name", "").startswith("TEST_"):
                    self.session.delete(f"{BASE_URL}/api/admin/players/{player['id']}")
    
    def test_01_admin_login(self):
        """Test admin login works"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["username"] == "Lefteria FC"
        print("PASS: Admin login successful")
    
    def test_02_get_academy_groups(self):
        """Test GET /api/academy-groups returns groups"""
        response = self.session.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        assert len(groups) > 0
        # Verify group structure
        group = groups[0]
        assert "id" in group
        assert "name" in group
        assert "age_range" in group
        print(f"PASS: Found {len(groups)} academy groups: {[g['name'] for g in groups]}")
    
    def test_03_create_academy_player_with_parent_info(self):
        """Test creating academy player with parent contact info and DOB"""
        # Calculate DOB for a 10-year-old
        dob = (datetime.now() - timedelta(days=365*10 + 100)).strftime("%Y-%m-%d")
        
        player_data = {
            "name": "TEST_Academy_Player_1",
            "number": 99,
            "position": "Midfielder",
            "nationality": "Cyprus",
            "date_of_birth": dob,
            "age": 10,
            "height": "1.40m",
            "weight": "35kg",
            "preferred_foot": "Right",
            "team_type": "Academy",
            "academy_group_id": self.first_group["id"],
            "academy_group_ids": [self.first_group["id"]],
            "parent_name": "TEST_Parent Name",
            "parent_phone": "+357 99 123456",
            "parent_email": "test.parent@example.com",
            "bio": "Test academy player bio"
        }
        
        response = self.session.post(f"{BASE_URL}/api/admin/players", json=player_data)
        assert response.status_code == 200, f"Create player failed: {response.text}"
        
        player = response.json()
        assert player["name"] == "TEST_Academy_Player_1"
        assert player["team_type"] == "Academy"
        assert player["academy_group_id"] == self.first_group["id"]
        assert player["parent_name"] == "TEST_Parent Name"
        assert player["parent_phone"] == "+357 99 123456"
        assert player["parent_email"] == "test.parent@example.com"
        assert player["date_of_birth"] == dob
        # Age should be auto-calculated from DOB
        assert player["age"] >= 9 and player["age"] <= 11, f"Age calculation issue: {player['age']}"
        
        self.created_player_id = player["id"]
        print(f"PASS: Created academy player with parent info, age auto-calculated to {player['age']}")
        
        # Verify player appears in group roster
        roster_response = self.session.get(f"{BASE_URL}/api/academy-groups/{self.first_group['id']}/players")
        assert roster_response.status_code == 200
        roster = roster_response.json()
        player_ids = [p["id"] for p in roster]
        assert player["id"] in player_ids, "Player not found in group roster"
        print("PASS: Player appears in academy group roster")
    
    def test_04_get_academy_group_players(self):
        """Test GET /api/academy-groups/{group_id}/players"""
        response = self.session.get(f"{BASE_URL}/api/academy-groups/{self.first_group['id']}/players")
        assert response.status_code == 200
        players = response.json()
        assert isinstance(players, list)
        print(f"PASS: Academy group {self.first_group['name']} has {len(players)} players")
    
    def test_05_edit_academy_player(self):
        """Test editing academy player - verify changes saved"""
        # First create a player to edit
        dob = (datetime.now() - timedelta(days=365*11)).strftime("%Y-%m-%d")
        create_response = self.session.post(f"{BASE_URL}/api/admin/players", json={
            "name": "TEST_Edit_Player",
            "number": 88,
            "position": "Defender",
            "nationality": "Cyprus",
            "date_of_birth": dob,
            "age": 11,
            "team_type": "Academy",
            "academy_group_id": self.first_group["id"],
            "parent_name": "Original Parent",
            "parent_phone": "111111"
        })
        assert create_response.status_code == 200
        player = create_response.json()
        player_id = player["id"]
        
        # Edit the player
        update_data = {
            "name": "TEST_Edit_Player_Updated",
            "number": 77,
            "position": "Forward",
            "parent_name": "Updated Parent Name",
            "parent_phone": "+357 99 999999",
            "parent_email": "updated@example.com",
            "bio": "Updated bio text"
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/admin/players/{player_id}", json=update_data)
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        updated_player = update_response.json()
        assert updated_player["name"] == "TEST_Edit_Player_Updated"
        assert updated_player["number"] == 77
        assert updated_player["position"] == "Forward"
        assert updated_player["parent_name"] == "Updated Parent Name"
        assert updated_player["parent_phone"] == "+357 99 999999"
        assert updated_player["parent_email"] == "updated@example.com"
        
        # Verify with GET
        get_response = self.session.get(f"{BASE_URL}/api/players/{player_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == "TEST_Edit_Player_Updated"
        assert fetched["parent_name"] == "Updated Parent Name"
        
        print("PASS: Academy player edit works, changes persisted")
    
    def test_06_transfer_player_multi_group(self):
        """Test POST /api/admin/players/{id}/transfer for multi-group assignment"""
        # Create a player first
        create_response = self.session.post(f"{BASE_URL}/api/admin/players", json={
            "name": "TEST_Transfer_Player",
            "number": 66,
            "position": "Midfielder",
            "nationality": "Cyprus",
            "age": 10,
            "team_type": "Academy",
            "academy_group_id": self.first_group["id"]
        })
        assert create_response.status_code == 200
        player = create_response.json()
        player_id = player["id"]
        
        # Get all group IDs for multi-group transfer
        if len(self.groups) >= 2:
            target_group_ids = [self.groups[0]["id"], self.groups[1]["id"]]
        else:
            target_group_ids = [self.groups[0]["id"]]
        
        # Transfer to multiple groups
        transfer_response = self.session.post(f"{BASE_URL}/api/admin/players/{player_id}/transfer", json={
            "group_ids": target_group_ids,
            "primary_group_id": target_group_ids[0]
        })
        assert transfer_response.status_code == 200, f"Transfer failed: {transfer_response.text}"
        
        # Verify player is now in multiple groups
        get_response = self.session.get(f"{BASE_URL}/api/players/{player_id}")
        assert get_response.status_code == 200
        updated_player = get_response.json()
        
        assert "academy_group_ids" in updated_player
        assert set(updated_player["academy_group_ids"]) == set(target_group_ids), \
            f"Expected groups {target_group_ids}, got {updated_player['academy_group_ids']}"
        
        print(f"PASS: Player transferred to {len(target_group_ids)} groups: {target_group_ids}")
        
        # Verify player appears in both group rosters
        for gid in target_group_ids:
            roster_response = self.session.get(f"{BASE_URL}/api/academy-groups/{gid}/players")
            assert roster_response.status_code == 200
            roster = roster_response.json()
            player_ids = [p["id"] for p in roster]
            assert player_id in player_ids, f"Player not found in group {gid} roster"
        
        print("PASS: Player appears in all assigned group rosters")
    
    def test_07_delete_academy_player(self):
        """Test DELETE /api/admin/players/{id}"""
        # Create a player to delete
        create_response = self.session.post(f"{BASE_URL}/api/admin/players", json={
            "name": "TEST_Delete_Player",
            "number": 55,
            "position": "Goalkeeper",
            "nationality": "Cyprus",
            "age": 9,
            "team_type": "Academy",
            "academy_group_id": self.first_group["id"]
        })
        assert create_response.status_code == 200
        player_id = create_response.json()["id"]
        
        # Delete the player
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/players/{player_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify player is gone
        get_response = self.session.get(f"{BASE_URL}/api/players/{player_id}")
        assert get_response.status_code == 404, "Player should not exist after deletion"
        
        print("PASS: Academy player deleted successfully")
    
    def test_08_public_player_profile(self):
        """Test GET /api/players/{id} returns full player profile"""
        # Create a player with full profile
        dob = (datetime.now() - timedelta(days=365*12)).strftime("%Y-%m-%d")
        create_response = self.session.post(f"{BASE_URL}/api/admin/players", json={
            "name": "TEST_Profile_Player",
            "number": 44,
            "position": "Forward",
            "nationality": "Cyprus",
            "date_of_birth": dob,
            "age": 12,
            "height": "1.55m",
            "weight": "45kg",
            "team_type": "Academy",
            "academy_group_id": self.first_group["id"],
            "bio": "Test player biography for public profile"
        })
        assert create_response.status_code == 200
        player_id = create_response.json()["id"]
        
        # Get public profile (no auth needed)
        public_session = requests.Session()
        profile_response = public_session.get(f"{BASE_URL}/api/players/{player_id}")
        assert profile_response.status_code == 200
        
        profile = profile_response.json()
        assert profile["name"] == "TEST_Profile_Player"
        assert profile["team_type"] == "Academy"
        assert profile["date_of_birth"] == dob
        assert profile["bio"] == "Test player biography for public profile"
        assert "academy_group_name" in profile or "academy_group_id" in profile
        
        print("PASS: Public player profile accessible without auth")


class TestAcademyFixtures:
    """Academy group fixtures CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and academy groups"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get first academy group
        groups_response = self.session.get(f"{BASE_URL}/api/academy-groups")
        assert groups_response.status_code == 200
        self.groups = groups_response.json()
        self.first_group = self.groups[0]
        
        yield
        
        # Cleanup: Delete test fixtures
        fixtures_response = self.session.get(f"{BASE_URL}/api/academy-groups/{self.first_group['id']}/fixtures")
        if fixtures_response.status_code == 200:
            for fixture in fixtures_response.json():
                if "TEST_" in fixture.get("away_team", ""):
                    self.session.delete(f"{BASE_URL}/api/admin/fixtures/{fixture['id']}")
    
    def test_09_create_academy_fixture(self):
        """Test POST /api/admin/academy-groups/{group_id}/fixtures"""
        fixture_data = {
            "home_team": "LEFTERIA FC U12",
            "away_team": "TEST_Opponent FC",
            "match_date": "2026-02-15T15:00:00Z",
            "venue": "Γήπεδο Αετού",
            "competition": "Πρωτάθλημα U12",
            "season": "2025/26",
            "status": "Scheduled"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/academy-groups/{self.first_group['id']}/fixtures",
            json=fixture_data
        )
        assert response.status_code == 200, f"Create fixture failed: {response.text}"
        
        fixture = response.json()
        assert fixture["home_team"] == "LEFTERIA FC U12"
        assert fixture["away_team"] == "TEST_Opponent FC"
        assert fixture["academy_group_id"] == self.first_group["id"]
        assert fixture["status"] == "Scheduled"
        
        self.created_fixture_id = fixture["id"]
        print(f"PASS: Created academy fixture for group {self.first_group['name']}")
    
    def test_10_get_academy_group_fixtures(self):
        """Test GET /api/academy-groups/{group_id}/fixtures"""
        # First create a fixture
        self.session.post(
            f"{BASE_URL}/api/admin/academy-groups/{self.first_group['id']}/fixtures",
            json={
                "home_team": "LEFTERIA FC",
                "away_team": "TEST_Fixture_Team",
                "match_date": "2026-03-01T14:00:00Z",
                "venue": "Test Venue",
                "competition": "Test Cup",
                "season": "2025/26"
            }
        )
        
        # Get fixtures for group
        response = self.session.get(f"{BASE_URL}/api/academy-groups/{self.first_group['id']}/fixtures")
        assert response.status_code == 200
        
        fixtures = response.json()
        assert isinstance(fixtures, list)
        print(f"PASS: Academy group {self.first_group['name']} has {len(fixtures)} fixtures")
    
    def test_11_player_model_has_required_fields(self):
        """Verify Player model includes parent_name, parent_phone, parent_email, academy_group_ids"""
        # Create player with all fields
        dob = (datetime.now() - timedelta(days=365*10)).strftime("%Y-%m-%d")
        create_response = self.session.post(f"{BASE_URL}/api/admin/players", json={
            "name": "TEST_Model_Check_Player",
            "number": 33,
            "position": "Midfielder",
            "nationality": "Cyprus",
            "date_of_birth": dob,
            "age": 10,
            "team_type": "Academy",
            "academy_group_id": self.first_group["id"],
            "academy_group_ids": [self.first_group["id"]],
            "parent_name": "Model Check Parent",
            "parent_phone": "+357 99 000000",
            "parent_email": "model.check@test.com"
        })
        assert create_response.status_code == 200
        player = create_response.json()
        
        # Verify all required fields exist
        assert "parent_name" in player, "Missing parent_name field"
        assert "parent_phone" in player, "Missing parent_phone field"
        assert "parent_email" in player, "Missing parent_email field"
        assert "academy_group_ids" in player, "Missing academy_group_ids field"
        assert "date_of_birth" in player, "Missing date_of_birth field"
        
        # Verify values
        assert player["parent_name"] == "Model Check Parent"
        assert player["parent_phone"] == "+357 99 000000"
        assert player["parent_email"] == "model.check@test.com"
        assert isinstance(player["academy_group_ids"], list)
        
        print("PASS: Player model has all required fields (parent_name, parent_phone, parent_email, academy_group_ids)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
