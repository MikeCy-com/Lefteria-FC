"""
Lefteria FC API Tests - Comprehensive Backend Testing
Tests all API endpoints for the football club website
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com')

# Admin credentials from test_credentials.md
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


class TestPublicEndpoints:
    """Test all public API endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root returns: {data['message']}")
    
    def test_get_players(self):
        """Test GET /api/players returns 20 players with required fields"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        players = response.json()
        assert isinstance(players, list)
        assert len(players) == 20, f"Expected 20 players, got {len(players)}"
        
        # Check required fields
        for player in players:
            assert "is_active" in player, "Player missing is_active field"
            assert "team_type" in player, "Player missing team_type field"
            assert player["team_type"] == "First Team", f"Expected First Team, got {player['team_type']}"
        print(f"✓ GET /api/players returns {len(players)} players with is_active and team_type fields")
    
    def test_get_players_with_team_type_filter(self):
        """Test GET /api/players?team_type=First Team"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        assert response.status_code == 200
        players = response.json()
        assert all(p["team_type"] == "First Team" for p in players)
        print(f"✓ GET /api/players?team_type=First Team returns {len(players)} first team players")
    
    def test_get_players_with_position_filter(self):
        """Test GET /api/players?position=Goalkeeper"""
        response = requests.get(f"{BASE_URL}/api/players?position=Goalkeeper")
        assert response.status_code == 200
        players = response.json()
        assert all(p["position"] == "Goalkeeper" for p in players)
        print(f"✓ GET /api/players?position=Goalkeeper returns {len(players)} goalkeepers")
    
    def test_get_academy_groups(self):
        """Test GET /api/academy-groups returns academy groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        assert len(groups) >= 1, f"Expected at least 1 academy group, got {len(groups)}"
        
        # Check group names exist
        group_names = [g["name"] for g in groups]
        print(f"✓ GET /api/academy-groups returns {len(groups)} groups: {group_names}")
    
    def test_get_standings(self):
        """Test GET /api/standings returns teams sorted by points"""
        response = requests.get(f"{BASE_URL}/api/standings")
        assert response.status_code == 200
        standings = response.json()
        assert isinstance(standings, list)
        assert len(standings) >= 1, f"Expected at least 1 team, got {len(standings)}"
        
        # Check sorted by points (descending)
        points = [s["points"] for s in standings]
        assert points == sorted(points, reverse=True), "Standings not sorted by points"
        
        # Check LEFTERIA FC is in standings
        team_names = [s["team_name"] for s in standings]
        assert "LEFTERIA FC" in team_names, "LEFTERIA FC not in standings"
        print(f"✓ GET /api/standings returns {len(standings)} teams sorted by points")
    
    def test_get_fixtures(self):
        """Test GET /api/fixtures"""
        response = requests.get(f"{BASE_URL}/api/fixtures")
        assert response.status_code == 200
        fixtures = response.json()
        assert isinstance(fixtures, list)
        assert len(fixtures) >= 5, f"Expected at least 5 fixtures, got {len(fixtures)}"
        
        # Check LEFTERIA FC is in fixtures (uppercase)
        lefteria_fixtures = [f for f in fixtures if "LEFTERIA FC" in f["home_team"] or "LEFTERIA FC" in f["away_team"]]
        assert len(lefteria_fixtures) > 0, "No fixtures with LEFTERIA FC"
        print(f"✓ GET /api/fixtures returns {len(fixtures)} fixtures, {len(lefteria_fixtures)} with LEFTERIA FC")
    
    def test_get_fixtures_with_status_filter(self):
        """Test GET /api/fixtures?status=Completed"""
        response = requests.get(f"{BASE_URL}/api/fixtures?status=Completed")
        assert response.status_code == 200
        fixtures = response.json()
        assert all(f["status"] == "Completed" for f in fixtures)
        print(f"✓ GET /api/fixtures?status=Completed returns {len(fixtures)} completed fixtures")
    
    def test_get_fixtures_scheduled(self):
        """Test GET /api/fixtures?status=Scheduled"""
        response = requests.get(f"{BASE_URL}/api/fixtures?status=Scheduled")
        assert response.status_code == 200
        fixtures = response.json()
        assert all(f["status"] == "Scheduled" for f in fixtures)
        print(f"✓ GET /api/fixtures?status=Scheduled returns {len(fixtures)} scheduled fixtures")
    
    def test_get_news(self):
        """Test GET /api/news"""
        response = requests.get(f"{BASE_URL}/api/news")
        assert response.status_code == 200
        news = response.json()
        assert isinstance(news, list)
        assert len(news) >= 2, f"Expected at least 2 news articles, got {len(news)}"
        
        # Check for featured article
        featured = [n for n in news if n.get("is_featured")]
        assert len(featured) > 0, "No featured news article"
        print(f"✓ GET /api/news returns {len(news)} articles, {len(featured)} featured")
    
    def test_get_club_profile(self):
        """Test GET /api/club"""
        response = requests.get(f"{BASE_URL}/api/club")
        assert response.status_code == 200
        club = response.json()
        assert club["name"] == "LEFTERIA FC"
        assert "greek_name" in club
        print(f"✓ GET /api/club returns club profile: {club['name']}")
    
    def test_get_staff(self):
        """Test GET /api/staff"""
        response = requests.get(f"{BASE_URL}/api/staff")
        assert response.status_code == 200
        staff = response.json()
        assert isinstance(staff, list)
        print(f"✓ GET /api/staff returns {len(staff)} staff members")
    
    def test_get_venues(self):
        """Test GET /api/venues"""
        response = requests.get(f"{BASE_URL}/api/venues")
        assert response.status_code == 200
        venues = response.json()
        assert isinstance(venues, list)
        assert len(venues) >= 1, "Expected at least 1 venue"
        print(f"✓ GET /api/venues returns {len(venues)} venues")
    
    def test_get_seasons(self):
        """Test GET /api/seasons"""
        response = requests.get(f"{BASE_URL}/api/seasons")
        assert response.status_code == 200
        seasons = response.json()
        assert isinstance(seasons, list)
        assert len(seasons) >= 1, "Expected at least 1 season"
        print(f"✓ GET /api/seasons returns {len(seasons)} seasons")
    
    def test_contact_form_submission(self):
        """Test POST /api/contact"""
        contact_data = {
            "name": "TEST_Contact User",
            "email": "test@example.com",
            "subject": "Γενική Ερώτηση",
            "message": "This is a test message from automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == contact_data["name"]
        assert result["email"] == contact_data["email"]
        print(f"✓ POST /api/contact successfully submitted contact form")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "id" in data
        assert data["username"] == ADMIN_USERNAME
        print(f"✓ Admin login successful for user: {data['username']}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong_user",
            "password": "wrong_password"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /api/auth/me correctly requires authentication")
    
    def test_auth_me_with_token(self):
        """Test /api/auth/me with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Then check /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == ADMIN_USERNAME
        print(f"✓ /api/auth/me returns user info: {data['username']}")


class TestAdminEndpoints:
    """Test admin CRUD endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_dashboard(self, auth_token):
        """Test GET /api/admin/dashboard"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        stats = response.json()
        assert "first_team_players" in stats
        assert "academy_players" in stats
        assert "staff_members" in stats
        assert "total_fixtures" in stats
        assert "news_articles" in stats
        assert "unread_messages" in stats
        assert "academy_groups" in stats
        print(f"✓ Admin dashboard stats: {stats}")
    
    def test_admin_create_player(self, auth_token):
        """Test POST /api/admin/players"""
        player_data = {
            "name": "TEST_New Player",
            "number": 99,
            "position": "Forward",
            "nationality": "Cyprus",
            "age": 22,
            "team_type": "First Team"
        }
        response = requests.post(f"{BASE_URL}/api/admin/players", json=player_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        player = response.json()
        assert player["name"] == player_data["name"]
        assert player["number"] == player_data["number"]
        print(f"✓ Created player: {player['name']} (ID: {player['id']})")
        return player["id"]
    
    def test_admin_update_player(self, auth_token):
        """Test PUT /api/admin/players/{id}"""
        # First create a player
        create_response = requests.post(f"{BASE_URL}/api/admin/players", json={
            "name": "TEST_Update Player",
            "number": 98,
            "position": "Midfielder",
            "nationality": "Cyprus",
            "age": 25,
            "team_type": "First Team"
        }, headers={"Authorization": f"Bearer {auth_token}"})
        player_id = create_response.json()["id"]
        
        # Update the player
        update_data = {"name": "TEST_Updated Player Name", "age": 26}
        response = requests.put(f"{BASE_URL}/api/admin/players/{player_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        updated = response.json()
        assert updated["name"] == update_data["name"]
        assert updated["age"] == update_data["age"]
        print(f"✓ Updated player: {updated['name']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/players/{player_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_delete_player(self, auth_token):
        """Test DELETE /api/admin/players/{id}"""
        # First create a player
        create_response = requests.post(f"{BASE_URL}/api/admin/players", json={
            "name": "TEST_Delete Player",
            "number": 97,
            "position": "Defender",
            "nationality": "Cyprus",
            "age": 23,
            "team_type": "First Team"
        }, headers={"Authorization": f"Bearer {auth_token}"})
        player_id = create_response.json()["id"]
        
        # Delete the player
        response = requests.delete(f"{BASE_URL}/api/admin/players/{player_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ Deleted player ID: {player_id}")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/players/{player_id}")
        assert get_response.status_code == 404
    
    def test_admin_create_academy_group(self, auth_token):
        """Test POST /api/admin/academy-groups"""
        group_data = {
            "name": "TEST_U10",
            "age_range": "8-10 ετών",
            "coach_name": "Test Coach",
            "training_schedule": "Mon, Wed - 16:00",
            "description": "Test academy group",
            "max_players": 20,
            "season": "2025/26"
        }
        response = requests.post(f"{BASE_URL}/api/admin/academy-groups", json=group_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        group = response.json()
        assert group["name"] == group_data["name"]
        print(f"✓ Created academy group: {group['name']} (ID: {group['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/academy-groups/{group['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_create_staff(self, auth_token):
        """Test POST /api/admin/staff"""
        staff_data = {
            "name": "TEST_Staff Member",
            "role": "Assistant Coach",
            "nationality": "Cyprus",
            "team_type": "First Team"
        }
        response = requests.post(f"{BASE_URL}/api/admin/staff", json=staff_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        staff = response.json()
        assert staff["name"] == staff_data["name"]
        print(f"✓ Created staff: {staff['name']} (ID: {staff['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/staff/{staff['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_create_fixture(self, auth_token):
        """Test POST /api/admin/fixtures"""
        fixture_data = {
            "home_team": "LEFTERIA FC",
            "away_team": "TEST_Opponent",
            "match_date": "2026-04-15T15:00:00Z",
            "venue": "Γήπεδο Αετού",
            "competition": "ΠΑΑΟΚ Α' Όμιλος",
            "season": "2025/26",
            "status": "Scheduled"
        }
        response = requests.post(f"{BASE_URL}/api/admin/fixtures", json=fixture_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        fixture = response.json()
        assert fixture["home_team"] == fixture_data["home_team"]
        print(f"✓ Created fixture: {fixture['home_team']} vs {fixture['away_team']} (ID: {fixture['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/fixtures/{fixture['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_create_standing(self, auth_token):
        """Test POST /api/admin/standings"""
        standing_data = {
            "team_name": "TEST_Team",
            "played": 10,
            "won": 5,
            "drawn": 3,
            "lost": 2,
            "goals_for": 15,
            "goals_against": 10,
            "points": 18,
            "competition": "ΠΑΑΟΚ Α' Όμιλος",
            "season": "2025/26"
        }
        response = requests.post(f"{BASE_URL}/api/admin/standings", json=standing_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        standing = response.json()
        assert standing["team_name"] == standing_data["team_name"]
        assert standing["goal_difference"] == 5  # 15 - 10
        print(f"✓ Created standing: {standing['team_name']} (ID: {standing['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/standings/{standing['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_create_news(self, auth_token):
        """Test POST /api/admin/news"""
        news_data = {
            "title": "TEST_News Article",
            "content": "This is test content for the news article.",
            "excerpt": "Test excerpt",
            "category": "Νέα",
            "is_featured": False
        }
        response = requests.post(f"{BASE_URL}/api/admin/news", json=news_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        news = response.json()
        assert news["title"] == news_data["title"]
        print(f"✓ Created news: {news['title']} (ID: {news['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/news/{news['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_create_venue(self, auth_token):
        """Test POST /api/admin/venues"""
        venue_data = {
            "name": "TEST_Stadium",
            "address": "Test Address",
            "city": "Λεμεσός",
            "country": "Κύπρος",
            "capacity": 5000,
            "surface": "Natural Grass",
            "is_home_ground": False
        }
        response = requests.post(f"{BASE_URL}/api/admin/venues", json=venue_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        venue = response.json()
        assert venue["name"] == venue_data["name"]
        print(f"✓ Created venue: {venue['name']} (ID: {venue['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/venues/{venue['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_create_season(self, auth_token):
        """Test POST /api/admin/seasons"""
        season_data = {
            "name": "TEST_2026/27",
            "start_date": "2026-08-01",
            "end_date": "2027-05-31",
            "is_current": False,
            "competitions": ["ΠΑΑΟΚ Α' Όμιλος"]
        }
        response = requests.post(f"{BASE_URL}/api/admin/seasons", json=season_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        season = response.json()
        assert season["name"] == season_data["name"]
        print(f"✓ Created season: {season['name']} (ID: {season['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/seasons/{season['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_admin_update_club_profile(self, auth_token):
        """Test PUT /api/admin/club"""
        # Get current club profile
        get_response = requests.get(f"{BASE_URL}/api/club")
        club = get_response.json()
        
        # Update with same data (to not break anything)
        response = requests.put(f"{BASE_URL}/api/admin/club", json=club, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        updated = response.json()
        assert updated["name"] == club["name"]
        print(f"✓ Updated club profile: {updated['name']}")
    
    def test_admin_get_contact_messages(self, auth_token):
        """Test GET /api/admin/contact"""
        response = requests.get(f"{BASE_URL}/api/admin/contact", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        print(f"✓ Admin contact messages: {len(messages)} messages")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_cleanup_test_players(self, auth_token):
        """Remove TEST_ prefixed players"""
        response = requests.get(f"{BASE_URL}/api/players?is_active=true")
        players = response.json()
        test_players = [p for p in players if p["name"].startswith("TEST_")]
        
        for player in test_players:
            requests.delete(f"{BASE_URL}/api/admin/players/{player['id']}", headers={
                "Authorization": f"Bearer {auth_token}"
            })
        
        print(f"✓ Cleaned up {len(test_players)} test players")
    
    def test_cleanup_test_messages(self, auth_token):
        """Remove TEST_ prefixed contact messages"""
        response = requests.get(f"{BASE_URL}/api/admin/contact", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        messages = response.json()
        test_messages = [m for m in messages if m["name"].startswith("TEST_")]
        
        for msg in test_messages:
            requests.delete(f"{BASE_URL}/api/admin/contact/{msg['id']}", headers={
                "Authorization": f"Bearer {auth_token}"
            })
        
        print(f"✓ Cleaned up {len(test_messages)} test messages")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
