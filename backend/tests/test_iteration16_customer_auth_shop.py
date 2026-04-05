"""
Iteration 16 Backend Tests - Customer Auth, Shop, Cart, Orders, and Voting
Tests the new user authentication system, product shop, shopping cart, order placement,
and login-based voting system.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com').rstrip('/')

# Test data
TEST_EMAIL = f"test_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "test123456"
TEST_NAME = "Test Fan User"
TEST_PHONE = "+357 99 123456"


class TestCustomerRegistration:
    """Customer registration endpoint tests"""
    
    def test_register_success(self):
        """Test successful customer registration"""
        response = requests.post(f"{BASE_URL}/api/customer/register", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "phone": TEST_PHONE
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "id" in data, "Response should contain user id"
        assert data["name"] == TEST_NAME, "Name should match"
        assert data["email"] == TEST_EMAIL, "Email should match"
        print(f"SUCCESS: Customer registration - user {data['id']} created")
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email fails"""
        response = requests.post(f"{BASE_URL}/api/customer/register", json={
            "name": "Another User",
            "email": TEST_EMAIL,
            "password": "anotherpass123",
            "phone": ""
        })
        # 409 Conflict is the correct status for duplicate resource
        assert response.status_code in [400, 409], f"Expected 400/409 for duplicate email, got {response.status_code}"
        print("SUCCESS: Duplicate email registration rejected")
    
    def test_register_missing_fields(self):
        """Test registration with missing required fields"""
        response = requests.post(f"{BASE_URL}/api/customer/register", json={
            "name": "",
            "email": "test@test.com",
            "password": "test123"
        })
        # Should fail validation
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("SUCCESS: Missing fields validation works")


class TestCustomerLogin:
    """Customer login endpoint tests"""
    
    def test_login_success(self):
        """Test successful customer login"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "id" in data, "Response should contain user id"
        print(f"SUCCESS: Customer login - token received")
        return data["token"]
    
    def test_login_wrong_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Wrong password rejected")
    
    def test_login_nonexistent_email(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Non-existent email rejected")


class TestCustomerProfile:
    """Customer profile endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Login failed - cannot test profile")
        return response.json()["token"]
    
    def test_get_profile(self, auth_token):
        """Test getting customer profile"""
        response = requests.get(f"{BASE_URL}/api/customer/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert data["name"] == TEST_NAME
        print("SUCCESS: Profile retrieved")
    
    def test_get_profile_no_auth(self):
        """Test getting profile without auth fails"""
        response = requests.get(f"{BASE_URL}/api/customer/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Unauthenticated profile access rejected")
    
    def test_update_profile(self, auth_token):
        """Test updating customer profile"""
        response = requests.put(f"{BASE_URL}/api/customer/profile", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": TEST_NAME,
                "phone": "+357 99 999999",
                "address": "Test Address 123",
                "city": "Limassol",
                "postal_code": "3000"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["address"] == "Test Address 123"
        assert data["city"] == "Limassol"
        print("SUCCESS: Profile updated")


class TestChangePassword:
    """Customer change password tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Login failed")
        return response.json()["token"]
    
    def test_change_password_wrong_current(self, auth_token):
        """Test change password with wrong current password"""
        response = requests.post(f"{BASE_URL}/api/customer/change-password",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("SUCCESS: Wrong current password rejected")


class TestProducts:
    """Product listing endpoint tests"""
    
    def test_get_products(self):
        """Test getting product list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 6, f"Expected at least 6 products, got {len(data)}"
        
        # Check product structure
        product = data[0]
        assert "id" in product
        assert "name" in product
        assert "price" in product
        assert "image_url" in product
        print(f"SUCCESS: Got {len(data)} products")
        return data
    
    def test_get_single_product(self):
        """Test getting a single product"""
        # First get products list
        products = requests.get(f"{BASE_URL}/api/products").json()
        if not products:
            pytest.skip("No products available")
        
        product_id = products[0]["id"]
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["id"] == product_id
        print(f"SUCCESS: Got product {data['name']}")


class TestCart:
    """Shopping cart endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Login failed")
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        """Get a product ID for testing"""
        products = requests.get(f"{BASE_URL}/api/products").json()
        if not products:
            pytest.skip("No products available")
        return products[0]["id"]
    
    def test_cart_requires_auth(self):
        """Test cart endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Cart requires authentication")
    
    def test_add_to_cart(self, auth_token, product_id):
        """Test adding item to cart"""
        response = requests.post(f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "quantity": 2,
                "size": "M"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("SUCCESS: Item added to cart")
    
    def test_get_cart(self, auth_token):
        """Test getting cart contents"""
        response = requests.get(f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"SUCCESS: Cart has {len(data['items'])} items, total: {data['total']}")
        return data
    
    def test_get_cart_count(self, auth_token):
        """Test getting cart item count"""
        response = requests.get(f"{BASE_URL}/api/cart/count",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "count" in data
        print(f"SUCCESS: Cart count: {data['count']}")
    
    def test_update_cart_quantity(self, auth_token, product_id):
        """Test updating cart item quantity"""
        # First add item
        requests.post(f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id, "quantity": 1, "size": "L"}
        )
        
        # Update quantity
        response = requests.put(f"{BASE_URL}/api/cart/item/{product_id}?size=L",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"quantity": 3}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: Cart quantity updated")
    
    def test_remove_from_cart(self, auth_token, product_id):
        """Test removing item from cart"""
        # First add item
        requests.post(f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id, "quantity": 1, "size": "XL"}
        )
        
        # Remove item
        response = requests.delete(f"{BASE_URL}/api/cart/item/{product_id}?size=XL",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: Item removed from cart")


class TestOrders:
    """Order placement endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Login failed")
        return response.json()["token"]
    
    @pytest.fixture
    def cart_with_items(self, auth_token):
        """Ensure cart has items"""
        products = requests.get(f"{BASE_URL}/api/products").json()
        if not products:
            pytest.skip("No products available")
        
        # Add item to cart
        requests.post(f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": products[0]["id"], "quantity": 1, "size": "M"}
        )
        return auth_token
    
    def test_orders_require_auth(self):
        """Test orders endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Orders require authentication")
    
    def test_create_order(self, cart_with_items):
        """Test creating an order"""
        auth_token = cart_with_items
        response = requests.post(f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "shipping_name": TEST_NAME,
                "shipping_address": "Test Street 123",
                "shipping_city": "Limassol",
                "shipping_postal_code": "3000",
                "shipping_phone": "+357 99 123456",
                "notes": "Test order"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "order_id" in data
        print(f"SUCCESS: Order created - {data['order_id']}")
        return data["order_id"]
    
    def test_get_orders(self, auth_token):
        """Test getting user orders"""
        response = requests.get(f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} orders")


class TestVotingWithAuth:
    """POTM voting with customer authentication tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Login failed")
        return response.json()["token"]
    
    @pytest.fixture
    def player_id(self):
        """Get a player ID for voting"""
        response = requests.get(f"{BASE_URL}/api/players?team_type=First%20Team")
        if response.status_code != 200 or not response.json():
            pytest.skip("No players available")
        return response.json()[0]["id"]
    
    def test_vote_requires_auth(self, player_id):
        """Test voting requires authentication"""
        response = requests.post(f"{BASE_URL}/api/votes/potm", json={
            "player_id": player_id
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Voting requires authentication")
    
    def test_vote_check_without_auth(self):
        """Test vote check works without auth (returns not voted)"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/check")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "has_voted" in data
        print("SUCCESS: Vote check works without auth")
    
    def test_vote_results_public(self):
        """Test vote results are publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/results")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "results" in data
        assert "total_votes" in data
        assert "month_key" in data
        print(f"SUCCESS: Vote results public - {data['total_votes']} total votes")
    
    def test_cast_vote(self, auth_token, player_id):
        """Test casting a vote when logged in"""
        # First withdraw any existing vote
        requests.post(f"{BASE_URL}/api/votes/potm/withdraw",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Cast vote
        response = requests.post(f"{BASE_URL}/api/votes/potm",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"player_id": player_id}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("SUCCESS: Vote cast successfully")
    
    def test_check_vote_status(self, auth_token):
        """Test checking vote status when logged in"""
        response = requests.get(f"{BASE_URL}/api/votes/potm/check",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "has_voted" in data
        print(f"SUCCESS: Vote status - has_voted: {data['has_voted']}")
    
    def test_withdraw_vote(self, auth_token):
        """Test withdrawing a vote"""
        response = requests.post(f"{BASE_URL}/api/votes/potm/withdraw",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # May return 200 or 404 depending on if vote exists
        assert response.status_code in [200, 404], f"Expected 200/404, got {response.status_code}"
        print("SUCCESS: Vote withdrawal endpoint works")


class TestAdminAuth:
    """Admin authentication tests (separate from customer auth)"""
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "L3ft3r1@FC#2024$Secure!"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "token" in data
        print("SUCCESS: Admin login works")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Lefteria FC",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Admin wrong password rejected")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup():
    """Cleanup test data after all tests"""
    yield
    # Note: In a real scenario, we'd clean up the test user
    # For now, we leave it as the email is unique per test run
    print("Test cleanup complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
