import requests
import sys
import json
from datetime import datetime

class LefteriaFCAPITester:
    def __init__(self, base_url="https://club-academy-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_size": len(response.text) if response.text else 0
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        response_data = response.json()
                        if isinstance(response_data, list):
                            print(f"   Response: List with {len(response_data)} items")
                        elif isinstance(response_data, dict):
                            print(f"   Response: Dict with keys: {list(response_data.keys())[:5]}")
                        result["response_data"] = response_data
                    except:
                        print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                result["error_response"] = response.text[:500]

            self.test_results.append(result)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200,
            description="Check if API is accessible"
        )

    def test_seed_data(self):
        """Test seeding data"""
        return self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200,
            description="Populate database with initial data"
        )

    def test_club_info(self):
        """Test club information endpoint"""
        return self.run_test(
            "Club Information",
            "GET",
            "club",
            200,
            description="Get club details"
        )

    def test_players_endpoints(self):
        """Test all player-related endpoints"""
        print("\n📋 Testing Player Endpoints...")
        
        # Get all players
        success, players = self.run_test(
            "Get All Players",
            "GET",
            "players",
            200,
            description="Fetch all players"
        )
        
        # Get first team players only
        self.run_test(
            "Get First Team Players",
            "GET",
            "players?is_academy=false",
            200,
            description="Fetch first team players"
        )
        
        # Get academy players only
        self.run_test(
            "Get Academy Players",
            "GET",
            "players?is_academy=true",
            200,
            description="Fetch academy players"
        )
        
        # Filter by position
        self.run_test(
            "Get Goalkeepers",
            "GET",
            "players?position=Goalkeeper",
            200,
            description="Filter players by position"
        )
        
        # Get specific player if we have players
        if success and players and len(players) > 0:
            player_id = players[0]['id']
            self.run_test(
                "Get Specific Player",
                "GET",
                f"players/{player_id}",
                200,
                description=f"Get player details for ID: {player_id}"
            )
        
        return success

    def test_fixtures_endpoints(self):
        """Test all fixture-related endpoints"""
        print("\n⚽ Testing Fixture Endpoints...")
        
        # Get all fixtures
        success, fixtures = self.run_test(
            "Get All Fixtures",
            "GET",
            "fixtures",
            200,
            description="Fetch all fixtures"
        )
        
        # Get limited fixtures
        self.run_test(
            "Get Limited Fixtures",
            "GET",
            "fixtures?limit=5",
            200,
            description="Fetch limited number of fixtures"
        )
        
        # Filter by status
        self.run_test(
            "Get Completed Fixtures",
            "GET",
            "fixtures?status=Completed",
            200,
            description="Filter fixtures by status"
        )
        
        self.run_test(
            "Get Scheduled Fixtures",
            "GET",
            "fixtures?status=Scheduled",
            200,
            description="Filter scheduled fixtures"
        )
        
        # Get specific fixture if we have fixtures
        if success and fixtures and len(fixtures) > 0:
            fixture_id = fixtures[0]['id']
            self.run_test(
                "Get Specific Fixture",
                "GET",
                f"fixtures/{fixture_id}",
                200,
                description=f"Get fixture details for ID: {fixture_id}"
            )
        
        return success

    def test_standings_endpoints(self):
        """Test standings endpoints"""
        print("\n🏆 Testing Standings Endpoints...")
        
        success, standings = self.run_test(
            "Get League Standings",
            "GET",
            "standings",
            200,
            description="Fetch league standings"
        )
        
        # Filter by competition
        self.run_test(
            "Get Super League 2 Standings",
            "GET",
            "standings?competition=Super League 2",
            200,
            description="Filter standings by competition"
        )
        
        return success

    def test_news_endpoints(self):
        """Test news endpoints"""
        print("\n📰 Testing News Endpoints...")
        
        success, news = self.run_test(
            "Get All News",
            "GET",
            "news",
            200,
            description="Fetch all news articles"
        )
        
        # Get limited news
        self.run_test(
            "Get Limited News",
            "GET",
            "news?limit=5",
            200,
            description="Fetch limited news articles"
        )
        
        # Get featured news
        self.run_test(
            "Get Featured News",
            "GET",
            "news?is_featured=true",
            200,
            description="Fetch featured news only"
        )
        
        # Filter by category
        self.run_test(
            "Get Match Reports",
            "GET",
            "news?category=Match Report",
            200,
            description="Filter news by category"
        )
        
        # Get specific news if we have news
        if success and news and len(news) > 0:
            news_id = news[0]['id']
            self.run_test(
                "Get Specific News",
                "GET",
                f"news/{news_id}",
                200,
                description=f"Get news details for ID: {news_id}"
            )
        
        return success

    def test_academy_endpoints(self):
        """Test academy endpoints"""
        print("\n🎓 Testing Academy Endpoints...")
        
        success, academy = self.run_test(
            "Get Academy Information",
            "GET",
            "academy",
            200,
            description="Fetch all academy age groups"
        )
        
        # Get specific age group if we have academy data
        if success and academy and len(academy) > 0:
            age_group = academy[0]['age_group']
            self.run_test(
                "Get Specific Age Group",
                "GET",
                f"academy/{age_group}",
                200,
                description=f"Get academy info for {age_group}"
            )
        
        return success

    def test_contact_endpoints(self):
        """Test contact endpoints"""
        print("\n📧 Testing Contact Endpoints...")
        
        # Test contact form submission
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "General Inquiry",
            "message": "This is a test message from the API testing suite."
        }
        
        success, response = self.run_test(
            "Submit Contact Form",
            "POST",
            "contact",
            200,
            data=contact_data,
            description="Submit contact form"
        )
        
        # Get contact messages (admin endpoint)
        self.run_test(
            "Get Contact Messages",
            "GET",
            "contact",
            200,
            description="Fetch all contact messages"
        )
        
        return success

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n❌ Testing Error Handling...")
        
        # Test non-existent player
        self.run_test(
            "Get Non-existent Player",
            "GET",
            "players/non-existent-id",
            404,
            description="Should return 404 for non-existent player"
        )
        
        # Test non-existent fixture
        self.run_test(
            "Get Non-existent Fixture",
            "GET",
            "fixtures/non-existent-id",
            404,
            description="Should return 404 for non-existent fixture"
        )
        
        # Test non-existent news
        self.run_test(
            "Get Non-existent News",
            "GET",
            "news/non-existent-id",
            404,
            description="Should return 404 for non-existent news"
        )
        
        # Test non-existent academy age group
        self.run_test(
            "Get Non-existent Academy Group",
            "GET",
            "academy/U99",
            404,
            description="Should return 404 for non-existent age group"
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Lefteria FC API Testing Suite")
        print("=" * 60)
        
        # Test basic connectivity
        root_success, _ = self.test_root_endpoint()
        if not root_success:
            print("❌ Cannot connect to API. Stopping tests.")
            return False
        
        # Seed data first
        print("\n🌱 Seeding initial data...")
        self.test_seed_data()
        
        # Test all endpoints
        self.test_club_info()
        self.test_players_endpoints()
        self.test_fixtures_endpoints()
        self.test_standings_endpoints()
        self.test_news_endpoints()
        self.test_academy_endpoints()
        self.test_contact_endpoints()
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                error_msg = test.get('error', f"Status {test.get('actual_status', 'unknown')}")
                print(f"   • {test['test_name']} - {error_msg}") 
        
        return self.tests_passed == self.tests_run

def main():
    tester = LefteriaFCAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())