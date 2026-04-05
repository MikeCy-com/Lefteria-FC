"""
Iteration 11: Test official ΠΑΑΟΚ Α' Όμιλος 2025-2026 data seeding
Tests verify:
1. GET /api/standings returns 11 teams with correct data
2. GET /api/fixtures returns fixtures (max 100 per request)
3. ΛΕΥΤΕΡΙΑ 2024 is at 3rd place with 42 points
4. ΠΑΣ ΖΑΚΑΚΙΟΥ is at top with 57 points
5. Push notification endpoints still work
6. Transfers endpoint still works
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com')

class TestOfficialStandingsData:
    """Test standings data from official ΠΑΑΟΚ Α' Όμιλος 2025-2026"""
    
    def test_standings_returns_11_teams(self):
        """Verify 11 teams in standings"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 11, f"Expected 11 teams, got {len(data)}"
        print(f"✓ Standings returns 11 teams")
    
    def test_pas_zakakiou_is_first(self):
        """Verify ΠΑΣ ΖΑΚΑΚΙΟΥ is at top with 57 points"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        first_team = data[0]
        assert first_team['team_name'] == 'ΠΑΣ ΖΑΚΑΚΙΟΥ', f"Expected ΠΑΣ ΖΑΚΑΚΙΟΥ at top, got {first_team['team_name']}"
        assert first_team['points'] == 57, f"Expected 57 points, got {first_team['points']}"
        print(f"✓ ΠΑΣ ΖΑΚΑΚΙΟΥ is 1st with 57 points")
    
    def test_lefteria_2024_is_third(self):
        """Verify ΛΕΥΤΕΡΙΑ 2024 is at 3rd place with 42 points"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        
        # Find ΛΕΥΤΕΡΙΑ 2024
        lefteria = None
        lefteria_position = None
        for i, team in enumerate(data):
            if team['team_name'] == 'ΛΕΥΤΕΡΙΑ 2024':
                lefteria = team
                lefteria_position = i + 1
                break
        
        assert lefteria is not None, "ΛΕΥΤΕΡΙΑ 2024 not found in standings"
        assert lefteria_position == 3, f"Expected ΛΕΥΤΕΡΙΑ 2024 at 3rd, got {lefteria_position}"
        assert lefteria['points'] == 42, f"Expected 42 points, got {lefteria['points']}"
        print(f"✓ ΛΕΥΤΕΡΙΑ 2024 is 3rd with 42 points")
    
    def test_lefteria_2024_stats(self):
        """Verify ΛΕΥΤΕΡΙΑ 2024 detailed stats: 20 played, 13 won, 3 drawn, 4 lost, 61 GF, 24 GA"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        
        lefteria = next((t for t in data if t['team_name'] == 'ΛΕΥΤΕΡΙΑ 2024'), None)
        assert lefteria is not None, "ΛΕΥΤΕΡΙΑ 2024 not found"
        
        assert lefteria['played'] == 20, f"Expected 20 played, got {lefteria['played']}"
        assert lefteria['won'] == 13, f"Expected 13 won, got {lefteria['won']}"
        assert lefteria['drawn'] == 3, f"Expected 3 drawn, got {lefteria['drawn']}"
        assert lefteria['lost'] == 4, f"Expected 4 lost, got {lefteria['lost']}"
        assert lefteria['goals_for'] == 61, f"Expected 61 GF, got {lefteria['goals_for']}"
        assert lefteria['goals_against'] == 24, f"Expected 24 GA, got {lefteria['goals_against']}"
        assert lefteria['goal_difference'] == 37, f"Expected +37 GD, got {lefteria['goal_difference']}"
        print(f"✓ ΛΕΥΤΕΡΙΑ 2024 stats: P:{lefteria['played']} W:{lefteria['won']} D:{lefteria['drawn']} L:{lefteria['lost']} GF:{lefteria['goals_for']} GA:{lefteria['goals_against']} GD:{lefteria['goal_difference']}")
    
    def test_standings_has_gf_ga_columns(self):
        """Verify standings include goals_for and goals_against columns"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        data = response.json()
        
        first_team = data[0]
        assert 'goals_for' in first_team, "goals_for column missing"
        assert 'goals_against' in first_team, "goals_against column missing"
        assert 'goal_difference' in first_team, "goal_difference column missing"
        print(f"✓ Standings has GF, GA, GD columns")


class TestOfficialFixturesData:
    """Test fixtures data from official ΠΑΑΟΚ Α' Όμιλος 2025-2026"""
    
    def test_fixtures_returns_data(self):
        """Verify fixtures endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=100")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "No fixtures returned"
        print(f"✓ Fixtures returns {len(data)} matches")
    
    def test_fixtures_limit_validation(self):
        """Verify fixtures endpoint rejects limit > 100"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=200")
        assert response.status_code == 422, f"Expected 422 for limit=200, got {response.status_code}"
        print(f"✓ Fixtures rejects limit > 100 (returns 422)")
    
    def test_lefteria_matches_in_fixtures(self):
        """Verify ΛΕΥΤΕΡΙΑ 2024 matches are in fixtures"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        lefteria_matches = [f for f in data if 'ΛΕΥΤΕΡΙΑ 2024' in f['home_team'] or 'ΛΕΥΤΕΡΙΑ 2024' in f['away_team']]
        assert len(lefteria_matches) > 0, "No ΛΕΥΤΕΡΙΑ 2024 matches found"
        print(f"✓ Found {len(lefteria_matches)} ΛΕΥΤΕΡΙΑ 2024 matches in response")
    
    def test_fixtures_have_completed_status(self):
        """Verify fixtures have Completed status"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        completed = [f for f in data if f['status'] == 'Completed']
        assert len(completed) > 0, "No completed fixtures found"
        print(f"✓ Found {len(completed)} completed fixtures")
    
    def test_fixtures_have_scores(self):
        """Verify completed fixtures have scores"""
        response = requests.get(f"{BASE_URL}/api/fixtures?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        completed = [f for f in data if f['status'] == 'Completed']
        for f in completed[:5]:  # Check first 5
            assert f['home_score'] is not None, f"Missing home_score for {f['id']}"
            assert f['away_score'] is not None, f"Missing away_score for {f['id']}"
        print(f"✓ Completed fixtures have scores")


class TestPushNotificationEndpoints:
    """Verify push notification endpoints still work"""
    
    def test_vapid_key_endpoint(self):
        """GET /api/push/vapid-key returns public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        assert response.status_code == 200
        data = response.json()
        assert 'public_key' in data, "public_key missing from response"
        assert len(data['public_key']) > 0, "public_key is empty"
        print(f"✓ GET /api/push/vapid-key returns public key")
    
    def test_subscribers_count_endpoint(self):
        """GET /api/push/subscribers-count returns count"""
        response = requests.get(f"{BASE_URL}/api/push/subscribers-count")
        assert response.status_code == 200
        data = response.json()
        assert 'count' in data, "count missing from response"
        print(f"✓ GET /api/push/subscribers-count returns {data['count']}")


class TestTransfersEndpoint:
    """Verify transfers endpoint still works"""
    
    def test_transfers_endpoint(self):
        """GET /api/transfers returns list"""
        response = requests.get(f"{BASE_URL}/api/transfers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"✓ GET /api/transfers returns {len(data)} transfers")


class TestCalendarEndpoint:
    """Test calendar endpoint for schedule tab"""
    
    def test_calendar_september_2025(self):
        """GET /api/calendar for September 2025 returns fixtures"""
        response = requests.get(f"{BASE_URL}/api/calendar?month=9&year=2025")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Calendar September 2025: {len(data)} fixtures")
    
    def test_calendar_march_2026(self):
        """GET /api/calendar for March 2026 returns fixtures"""
        response = requests.get(f"{BASE_URL}/api/calendar?month=3&year=2026")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Calendar March 2026: {len(data)} fixtures")


class TestSettingsEndpoint:
    """Test standings columns settings"""
    
    def test_standings_columns_settings(self):
        """GET /api/settings/standings-columns returns column config"""
        response = requests.get(f"{BASE_URL}/api/settings/standings-columns")
        assert response.status_code == 200
        data = response.json()
        assert 'goals_for' in data, "goals_for setting missing"
        assert 'goals_against' in data, "goals_against setting missing"
        print(f"✓ Standings columns settings: GF={data.get('goals_for')}, GA={data.get('goals_against')}")
