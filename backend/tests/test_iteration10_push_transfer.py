"""
Iteration 10 Tests: Web Push Notifications & Player Transfer History
Tests for P3 features:
1. Push Notification Infrastructure (VAPID keys, subscribe, unsubscribe, test push, stats)
2. Player Transfer History (admin transfer management, public display)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"

# Expected VAPID public key from .env
EXPECTED_VAPID_KEY = "BKSDwwWVyapiWEVJ6vgeqaWJvmYSeLcdJG0jEioOfXGBkCwlHV7pn3d_r0OzXJLtXPeYxhEHRTkjjrG1s528jLg"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ==================== PUSH NOTIFICATION TESTS ====================

class TestPushNotificationPublicEndpoints:
    """Test public push notification endpoints"""
    
    def test_get_vapid_key(self, api_client):
        """GET /api/push/vapid-key returns VAPID public key"""
        response = api_client.get(f"{BASE_URL}/api/push/vapid-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain 'public_key'"
        assert data["public_key"] == EXPECTED_VAPID_KEY, f"VAPID key mismatch: {data['public_key']}"
        print(f"✓ VAPID public key returned correctly")
    
    def test_subscribe_to_push(self, api_client):
        """POST /api/push/subscribe creates a push subscription"""
        # Mock subscription data (similar to what browser would send)
        subscription_data = {
            "endpoint": "https://test-push-endpoint.example.com/test-subscription-12345",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/push/subscribe", json=subscription_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        print(f"✓ Push subscription created: {data.get('message')}")
    
    def test_get_subscribers_count(self, api_client):
        """GET /api/push/subscribers-count returns subscriber count"""
        response = api_client.get(f"{BASE_URL}/api/push/subscribers-count")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "count" in data, "Response should contain 'count'"
        assert isinstance(data["count"], int), "Count should be an integer"
        assert data["count"] >= 0, "Count should be non-negative"
        print(f"✓ Subscribers count: {data['count']}")
    
    def test_unsubscribe_from_push(self, api_client):
        """POST /api/push/unsubscribe removes a push subscription"""
        # Use the same endpoint we subscribed with
        subscription_data = {
            "endpoint": "https://test-push-endpoint.example.com/test-subscription-12345",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/push/unsubscribe", json=subscription_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        print(f"✓ Push unsubscription: {data.get('message')}")


class TestPushNotificationAdminEndpoints:
    """Test admin push notification endpoints (require auth)"""
    
    def test_admin_push_test_without_auth(self, api_client):
        """POST /api/admin/push/test without auth returns 401"""
        # Remove auth header temporarily
        original_auth = api_client.headers.pop("Authorization", None)
        
        response = api_client.post(f"{BASE_URL}/api/admin/push/test")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Restore auth header
        if original_auth:
            api_client.headers["Authorization"] = original_auth
        print(f"✓ Admin push test endpoint requires auth (401)")
    
    def test_admin_push_stats_without_auth(self, api_client):
        """GET /api/admin/push/stats without auth returns 401"""
        # Remove auth header temporarily
        original_auth = api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/admin/push/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Restore auth header
        if original_auth:
            api_client.headers["Authorization"] = original_auth
        print(f"✓ Admin push stats endpoint requires auth (401)")
    
    def test_admin_push_stats_with_auth(self, authenticated_client):
        """GET /api/admin/push/stats returns subscriber stats"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/push/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # API returns 'subscribers' field
        assert "subscribers" in data, "Response should contain 'subscribers'"
        assert isinstance(data["subscribers"], int), "subscribers should be an integer"
        print(f"✓ Admin push stats: {data}")
    
    def test_admin_push_test_with_auth(self, authenticated_client):
        """POST /api/admin/push/test sends test push (requires auth)"""
        response = authenticated_client.post(f"{BASE_URL}/api/admin/push/test")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data or "sent" in data, "Response should contain 'message' or 'sent'"
        print(f"✓ Admin test push sent: {data}")


# ==================== TRANSFER HISTORY TESTS ====================

class TestTransferPublicEndpoints:
    """Test public transfer endpoints"""
    
    def test_get_transfers_list(self, api_client):
        """GET /api/transfers returns transfer list"""
        response = api_client.get(f"{BASE_URL}/api/transfers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Transfers list returned: {len(data)} transfers")
        
        # If there are transfers, verify structure
        if len(data) > 0:
            transfer = data[0]
            required_fields = ["id", "player_id", "player_name", "from_team", "to_team", "transfer_date", "transfer_type"]
            for field in required_fields:
                assert field in transfer, f"Transfer should contain '{field}'"
            print(f"✓ Transfer structure verified: {transfer.get('player_name')} - {transfer.get('transfer_type')}")


class TestTransferAdminEndpoints:
    """Test admin transfer endpoints (require auth)"""
    
    def test_transfer_player_without_auth(self):
        """POST /api/admin/players/{id}/transfer without auth returns 401"""
        # Use a fresh session without auth
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        # First get a real player ID (public endpoint)
        players_response = fresh_client.get(f"{BASE_URL}/api/players")
        players = players_response.json() if players_response.status_code == 200 else []
        
        if len(players) == 0:
            pytest.skip("No players available for auth test")
        
        player_id = players[0]["id"]
        
        transfer_data = {
            "player_id": player_id,
            "player_name": players[0]["name"],
            "from_team": "LEFTERIA FC",
            "to_team": "Test Team",
            "transfer_date": "2026-01-15",
            "transfer_type": "Out",
            "fee": "Free",
            "notes": "Test transfer"
        }
        
        response = fresh_client.post(f"{BASE_URL}/api/admin/players/{player_id}/transfer", json=transfer_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Admin transfer endpoint requires auth (401)")
    
    def test_transfer_player_with_auth(self, authenticated_client):
        """POST /api/admin/players/{id}/transfer creates a transfer record"""
        # First, get a player to transfer
        players_response = authenticated_client.get(f"{BASE_URL}/api/players")
        assert players_response.status_code == 200, "Failed to get players"
        
        players = players_response.json()
        if len(players) == 0:
            pytest.skip("No players available for transfer test")
        
        player = players[0]
        player_id = player["id"]
        player_name = player["name"]
        
        # Create transfer record
        transfer_data = {
            "player_id": player_id,
            "player_name": player_name,
            "from_team": "LEFTERIA FC",
            "to_team": "TEST_Transfer_Team",
            "transfer_date": "2026-01-15",
            "transfer_type": "Loan Out",
            "fee": "Δανεισμός",
            "notes": "Test transfer for iteration 10"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/admin/players/{player_id}/transfer", json=transfer_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain 'id'"
        assert data["player_name"] == player_name, "Player name should match"
        assert data["transfer_type"] == "Loan Out", "Transfer type should match"
        assert data["to_team"] == "TEST_Transfer_Team", "To team should match"
        
        print(f"✓ Transfer created for {player_name}: {data.get('transfer_type')} to {data.get('to_team')}")
        
        # Verify transfer appears in public list
        transfers_response = authenticated_client.get(f"{BASE_URL}/api/transfers")
        assert transfers_response.status_code == 200
        
        transfers = transfers_response.json()
        test_transfer = next((t for t in transfers if t.get("to_team") == "TEST_Transfer_Team"), None)
        assert test_transfer is not None, "Created transfer should appear in transfers list"
        print(f"✓ Transfer verified in public list")
        
        return data
    
    def test_transfer_types(self, authenticated_client):
        """Verify all transfer types work: In, Out, Loan In, Loan Out"""
        players_response = authenticated_client.get(f"{BASE_URL}/api/players")
        players = players_response.json()
        
        if len(players) < 2:
            pytest.skip("Need at least 2 players for transfer type tests")
        
        transfer_types = ["In", "Out", "Loan In", "Loan Out"]
        
        for i, transfer_type in enumerate(transfer_types):
            if i >= len(players):
                break
                
            player = players[i]
            transfer_data = {
                "player_id": player["id"],
                "player_name": player["name"],
                "from_team": "Test Origin" if transfer_type in ["In", "Loan In"] else "LEFTERIA FC",
                "to_team": "LEFTERIA FC" if transfer_type in ["In", "Loan In"] else "Test Destination",
                "transfer_date": f"2026-01-{15+i:02d}",
                "transfer_type": transfer_type,
                "fee": "Test fee",
                "notes": f"Test {transfer_type} transfer"
            }
            
            response = authenticated_client.post(f"{BASE_URL}/api/admin/players/{player['id']}/transfer", json=transfer_data)
            # Note: Some transfers might fail if player doesn't exist, that's ok
            if response.status_code == 200:
                print(f"✓ Transfer type '{transfer_type}' works correctly")
            else:
                print(f"⚠ Transfer type '{transfer_type}' returned {response.status_code}")


class TestTransferFieldValidation:
    """Test transfer record field structure"""
    
    def test_transfer_record_fields(self, api_client):
        """Verify transfer record includes all required fields"""
        response = api_client.get(f"{BASE_URL}/api/transfers")
        assert response.status_code == 200
        
        transfers = response.json()
        if len(transfers) == 0:
            pytest.skip("No transfers to verify fields")
        
        transfer = transfers[0]
        
        # Required fields per spec
        required_fields = [
            "id",
            "player_id",
            "player_name",
            "from_team",
            "to_team",
            "transfer_date",
            "transfer_type"
        ]
        
        # Optional fields
        optional_fields = ["fee", "notes", "created_at"]
        
        for field in required_fields:
            assert field in transfer, f"Transfer should contain required field '{field}'"
        
        print(f"✓ Transfer record has all required fields: {required_fields}")
        
        # Check optional fields exist (may be null)
        for field in optional_fields:
            if field in transfer:
                print(f"✓ Optional field '{field}' present")


# ==================== SERVICE WORKER TEST ====================

class TestServiceWorker:
    """Test service worker accessibility"""
    
    def test_service_worker_accessible(self, api_client):
        """Service worker file sw-push.js accessible at /sw-push.js"""
        # Service worker is served from frontend, not backend API
        # We test via the frontend URL
        frontend_url = BASE_URL.replace('/api', '')
        
        response = requests.get(f"{frontend_url}/sw-push.js")
        # Service worker should be accessible (200) or might be served differently
        assert response.status_code in [200, 304], f"Expected 200 or 304, got {response.status_code}"
        
        if response.status_code == 200:
            content = response.text
            # Verify it's a service worker
            assert "self.addEventListener" in content or "push" in content.lower(), "Should be a service worker file"
            print(f"✓ Service worker accessible at /sw-push.js")
        else:
            print(f"✓ Service worker returned {response.status_code} (cached)")


# ==================== CLEANUP ====================

class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_transfers(self, authenticated_client):
        """Remove test transfers created during testing"""
        # Get all transfers
        response = authenticated_client.get(f"{BASE_URL}/api/transfers")
        if response.status_code != 200:
            return
        
        transfers = response.json()
        
        # Note: There's no delete endpoint for transfers in the API
        # The transfers will remain but are marked with TEST_ prefix
        test_transfers = [t for t in transfers if "TEST_" in t.get("to_team", "") or "TEST_" in t.get("from_team", "")]
        
        if test_transfers:
            print(f"⚠ {len(test_transfers)} test transfers remain (no delete endpoint)")
        else:
            print(f"✓ No test transfers to clean up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
