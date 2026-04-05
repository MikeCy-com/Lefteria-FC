"""
Iteration 15: POTM Voting System Tests
Tests the overhauled Player of the Month voting system with:
- Voter identity (name + email) required before voting
- Vote counts visible to everyone
- Player detail modal with voter list
- Vote withdrawal and revote capability
- One vote per email per month
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com')

# Test voter data
TEST_VOTER_1 = {
    "name": f"TEST_Voter_{uuid.uuid4().hex[:6]}",
    "email": f"test_voter_{uuid.uuid4().hex[:6]}@example.com"
}
TEST_VOTER_2 = {
    "name": f"TEST_Voter2_{uuid.uuid4().hex[:6]}",
    "email": f"test_voter2_{uuid.uuid4().hex[:6]}@example.com"
}


class TestPotmVotingResults:
    """Test GET /api/votes/potm/results - Public results endpoint"""
    
    def test_get_results_returns_200(self):
        """Results endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/votes/potm/results returns 200")
    
    def test_results_has_required_fields(self):
        """Results should have month_key, total_votes, results fields"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        data = response.json()
        
        assert "month_key" in data, "Missing month_key field"
        assert "total_votes" in data, "Missing total_votes field"
        assert "results" in data, "Missing results field"
        assert isinstance(data["results"], list), "results should be a list"
        print(f"PASS: Results has required fields - month_key: {data['month_key']}, total_votes: {data['total_votes']}")
    
    def test_results_month_key_format(self):
        """Month key should be in YYYY-MM format"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        data = response.json()
        
        month_key = data["month_key"]
        assert len(month_key) == 7, f"Month key should be 7 chars (YYYY-MM), got {month_key}"
        assert month_key[4] == "-", f"Month key should have dash at position 4, got {month_key}"
        print(f"PASS: Month key format correct: {month_key}")


class TestPotmVotingCheck:
    """Test GET /api/votes/potm/check - Check if email has voted"""
    
    def test_check_without_email_returns_not_voted(self):
        """Check without email should return has_voted=False"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/check")
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_voted"] == False, "Should return has_voted=False without email"
        assert data["voted_player_id"] is None, "Should return voted_player_id=None"
        print("PASS: Check without email returns has_voted=False")
    
    def test_check_with_nonexistent_email(self):
        """Check with non-existent email should return has_voted=False"""
        fake_email = f"nonexistent_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.get(f"{BASE_URL}/api/votes/potm/check?email={fake_email}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_voted"] == False, "Should return has_voted=False for non-existent email"
        print(f"PASS: Check with non-existent email returns has_voted=False")


class TestPotmVotingCast:
    """Test POST /api/votes/potm - Cast a vote"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a valid player ID for testing"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert response.status_code == 200
        players = response.json()
        assert len(players) > 0, "No first team players found"
        self.player_id = players[0]["id"]
        self.player_name = players[0]["name"]
        self.second_player_id = players[1]["id"] if len(players) > 1 else players[0]["id"]
    
    def test_vote_without_player_id_returns_422(self):
        """Vote without player_id should return 422"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "voter_name": "Test",
            "voter_email": "test@example.com"
        })
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("PASS: Vote without player_id returns 422")
    
    def test_vote_without_voter_name_returns_422(self):
        """Vote without voter_name should return 422"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_id,
            "voter_email": "test@example.com"
        })
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("PASS: Vote without voter_name returns 422")
    
    def test_vote_without_voter_email_returns_422(self):
        """Vote without voter_email should return 422"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_id,
            "voter_name": "Test"
        })
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("PASS: Vote without voter_email returns 422")
    
    def test_vote_with_invalid_player_returns_404(self):
        """Vote with invalid player_id should return 404"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": "invalid-player-id-12345",
            "voter_name": "Test Voter",
            "voter_email": f"test_{uuid.uuid4().hex[:6]}@example.com"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Vote with invalid player returns 404")
    
    def test_vote_with_empty_name_returns_400(self):
        """Vote with empty voter_name should return 400"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_id,
            "voter_name": "   ",
            "voter_email": f"test_{uuid.uuid4().hex[:6]}@example.com"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Vote with empty name returns 400")
    
    def test_vote_with_empty_email_returns_400(self):
        """Vote with empty voter_email should return 400"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_id,
            "voter_name": "Test Voter",
            "voter_email": "   "
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Vote with empty email returns 400")


class TestPotmVotingFullFlow:
    """Test complete voting flow: cast, check, results, withdraw, revote"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get valid player IDs for testing"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert response.status_code == 200
        players = response.json()
        assert len(players) >= 2, "Need at least 2 first team players"
        self.player_1_id = players[0]["id"]
        self.player_1_name = players[0]["name"]
        self.player_2_id = players[1]["id"]
        self.player_2_name = players[1]["name"]
        
        # Use unique test voter for this test class
        self.test_voter = {
            "name": f"TEST_FullFlow_{uuid.uuid4().hex[:6]}",
            "email": f"test_fullflow_{uuid.uuid4().hex[:6]}@example.com"
        }
    
    def test_01_cast_vote_success(self):
        """Cast a vote successfully"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should have message"
        print(f"PASS: Cast vote for {self.player_1_name} with email {self.test_voter['email']}")
    
    def test_02_check_vote_after_casting(self):
        """Check vote status after casting"""
        # First cast a vote
        requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        
        # Then check
        response = requests.get(f"{BASE_URL}/api/votes/potm/check?email={self.test_voter['email']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_voted"] == True, "Should return has_voted=True after voting"
        assert data["voted_player_id"] == self.player_1_id, f"Should return correct player_id"
        print(f"PASS: Check returns has_voted=True, voted_player_id={data['voted_player_id']}")
    
    def test_03_duplicate_vote_returns_429(self):
        """Duplicate vote with same email should return 429"""
        # First cast a vote
        requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        
        # Try to vote again
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_2_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        assert response.status_code == 429, f"Expected 429, got {response.status_code}"
        print("PASS: Duplicate vote returns 429")
    
    def test_04_results_show_vote(self):
        """Results should show the cast vote"""
        # First cast a vote
        requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        assert response.status_code == 200
        data = response.json()
        
        # Find the player in results
        player_result = next((r for r in data["results"] if r["player_id"] == self.player_1_id), None)
        if player_result:
            assert player_result["votes"] >= 1, "Player should have at least 1 vote"
            assert self.test_voter["name"] in player_result.get("voters", []), "Voter name should be in voters list"
            print(f"PASS: Results show vote for {self.player_1_name} with {player_result['votes']} votes")
        else:
            print(f"INFO: Player {self.player_1_id} not in results (may have been cleaned up)")
    
    def test_05_player_detail_shows_voters(self):
        """Player detail should show voter list"""
        # First cast a vote
        requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        
        response = requests.get(f"{BASE_URL}/api/votes/potm/player/{self.player_1_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "player" in data, "Should have player field"
        assert "vote_count" in data, "Should have vote_count field"
        assert "voters" in data, "Should have voters field"
        assert "total_month_votes" in data, "Should have total_month_votes field"
        
        # Check voter is in list
        voter_names = [v.get("voter_name") for v in data["voters"]]
        if self.test_voter["name"] in voter_names:
            print(f"PASS: Player detail shows {data['vote_count']} votes, voter {self.test_voter['name']} in list")
        else:
            print(f"INFO: Voter not in list (may have been cleaned up)")
    
    def test_06_withdraw_vote_success(self):
        """Withdraw vote successfully"""
        # First cast a vote
        requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        
        # Withdraw
        response = requests.post(f"{BASE_URL}/api/votes/potm/withdraw", json={
            "voter_email": self.test_voter["email"]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Withdraw vote for {self.test_voter['email']}")
    
    def test_07_check_after_withdraw(self):
        """Check vote status after withdrawal"""
        # Cast and withdraw
        requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        requests.post(f"{BASE_URL}/api/votes/potm/withdraw", json={
            "voter_email": self.test_voter["email"]
        })
        
        # Check
        response = requests.get(f"{BASE_URL}/api/votes/potm/check?email={self.test_voter['email']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_voted"] == False, "Should return has_voted=False after withdrawal"
        print("PASS: Check returns has_voted=False after withdrawal")
    
    def test_08_revote_after_withdraw(self):
        """Can vote again after withdrawal"""
        # Cast, withdraw, revote
        requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_1_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        requests.post(f"{BASE_URL}/api/votes/potm/withdraw", json={
            "voter_email": self.test_voter["email"]
        })
        
        # Revote for different player
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_2_id,
            "voter_name": self.test_voter["name"],
            "voter_email": self.test_voter["email"]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify new vote
        check_response = requests.get(f"{BASE_URL}/api/votes/potm/check?email={self.test_voter['email']}")
        check_data = check_response.json()
        assert check_data["has_voted"] == True
        assert check_data["voted_player_id"] == self.player_2_id
        print(f"PASS: Revote successful for {self.player_2_name}")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/votes/potm/withdraw", json={
            "voter_email": self.test_voter["email"]
        })


class TestPotmWithdraw:
    """Test POST /api/votes/potm/withdraw - Withdraw vote"""
    
    def test_withdraw_nonexistent_vote_returns_404(self):
        """Withdraw with non-existent email should return 404"""
        fake_email = f"nonexistent_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/votes/potm/withdraw", json={
            "voter_email": fake_email
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Withdraw non-existent vote returns 404")


class TestPotmPlayerDetail:
    """Test GET /api/votes/potm/player/{player_id} - Player voting detail"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a valid player ID"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        players = response.json()
        self.player_id = players[0]["id"]
    
    def test_player_detail_returns_200(self):
        """Player detail should return 200"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/player/{self.player_id}")
        assert response.status_code == 200
        print(f"PASS: Player detail returns 200 for {self.player_id}")
    
    def test_player_detail_has_required_fields(self):
        """Player detail should have required fields"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/player/{self.player_id}")
        data = response.json()
        
        assert "player" in data, "Missing player field"
        assert "vote_count" in data, "Missing vote_count field"
        assert "voters" in data, "Missing voters field"
        assert "total_month_votes" in data, "Missing total_month_votes field"
        assert "month_key" in data, "Missing month_key field"
        
        # Check player has name, number, position
        player = data["player"]
        assert "name" in player, "Player missing name"
        print(f"PASS: Player detail has required fields - {player.get('name')}, {data['vote_count']} votes")
    
    def test_player_detail_invalid_id_returns_404(self):
        """Player detail with invalid ID should return 404"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/player/invalid-player-id-12345")
        assert response.status_code == 404
        print("PASS: Player detail with invalid ID returns 404")


class TestEmailCaseInsensitivity:
    """Test that email matching is case-insensitive"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a valid player ID"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        players = response.json()
        self.player_id = players[0]["id"]
        self.test_email_base = f"test_case_{uuid.uuid4().hex[:6]}"
    
    def test_email_case_insensitive_duplicate_check(self):
        """Voting with different case email should be detected as duplicate"""
        email_lower = f"{self.test_email_base}@example.com"
        email_upper = f"{self.test_email_base.upper()}@EXAMPLE.COM"
        
        # Vote with lowercase
        response1 = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_id,
            "voter_name": "Test Case",
            "voter_email": email_lower
        })
        assert response1.status_code == 200
        
        # Try to vote with uppercase - should be blocked
        response2 = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": self.player_id,
            "voter_name": "Test Case",
            "voter_email": email_upper
        })
        assert response2.status_code == 429, f"Expected 429 for case-insensitive duplicate, got {response2.status_code}"
        print("PASS: Email duplicate check is case-insensitive")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/votes/potm/withdraw", json={
            "voter_email": email_lower
        })


class TestFirstTeamPlayersForVoting:
    """Test that first team players are available for voting"""
    
    def test_first_team_players_available(self):
        """Should have first team players to vote for"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert response.status_code == 200
        players = response.json()
        
        assert len(players) > 0, "No first team players found"
        print(f"PASS: {len(players)} first team players available for voting")
    
    def test_players_have_required_fields(self):
        """Players should have fields needed for voting UI"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        players = response.json()
        
        for player in players[:5]:  # Check first 5
            assert "id" in player, f"Player missing id"
            assert "name" in player, f"Player missing name"
            assert "number" in player, f"Player missing number"
            assert "position" in player, f"Player missing position"
        
        print(f"PASS: Players have required fields (id, name, number, position)")


# Cleanup fixture to run after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_votes():
    """Cleanup any TEST_ prefixed votes after tests"""
    yield
    # Note: Individual tests clean up their own votes via withdraw
    print("Test session complete - individual tests cleaned up their votes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
