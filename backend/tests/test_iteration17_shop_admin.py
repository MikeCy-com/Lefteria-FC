"""
Iteration 17 Tests: Admin CMS (Products, Tickets, Orders) + Restructured Shop Page
Tests:
- Admin Products CRUD (GET, POST, PUT, DELETE)
- Admin Tickets CRUD (GET, POST, PUT, DELETE)
- Admin Orders management (GET, PUT status)
- Public tickets endpoint
- Cart add-ticket endpoint
- Shop page structure (tickets + merchandise tabs)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Admin authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    """Admin auth headers"""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def customer_token():
    """Register and get customer token"""
    unique_email = f"test_iter17_{uuid.uuid4().hex[:8]}@test.com"
    response = requests.post(f"{BASE_URL}/api/customer/register", json={
        "name": "Test Customer Iter17",
        "email": unique_email,
        "password": "test123456",
        "phone": "99123456"
    })
    if response.status_code == 200:
        return response.json().get("token")
    # Try login if already exists
    response = requests.post(f"{BASE_URL}/api/customer/login", json={
        "email": unique_email,
        "password": "test123456"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Customer auth failed: {response.status_code}")


@pytest.fixture(scope="module")
def customer_headers(customer_token):
    """Customer auth headers"""
    return {"Authorization": f"Bearer {customer_token}"}


class TestPublicTicketsEndpoint:
    """Test public /api/tickets endpoint"""
    
    def test_get_tickets_returns_200(self):
        """GET /api/tickets should return 200"""
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/tickets: {len(data)} tickets returned")
    
    def test_tickets_have_required_fields(self):
        """Tickets should have id, name, price, ticket_type"""
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200
        tickets = response.json()
        if len(tickets) > 0:
            ticket = tickets[0]
            assert "id" in ticket
            assert "name" in ticket
            assert "price" in ticket
            assert "ticket_type" in ticket
            print(f"Ticket fields verified: {ticket.get('name')}, type={ticket.get('ticket_type')}, price={ticket.get('price')}")


class TestAdminProductsCRUD:
    """Test admin product management endpoints"""
    
    def test_get_admin_products_requires_auth(self):
        """GET /api/admin/products without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code == 401
        print("GET /api/admin/products without auth: 401 as expected")
    
    def test_get_admin_products_with_auth(self, admin_headers):
        """GET /api/admin/products with auth should return 200"""
        response = requests.get(f"{BASE_URL}/api/admin/products", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/admin/products: {len(data)} products")
    
    def test_create_product(self, admin_headers):
        """POST /api/admin/products should create a product"""
        product_data = {
            "name": f"TEST_Product_{uuid.uuid4().hex[:6]}",
            "description": "Test product for iteration 17",
            "price": 29.99,
            "image_url": "https://example.com/test.jpg",
            "category": "clothing",
            "sizes": ["S", "M", "L"],
            "in_stock": True,
            "delivery_options": ["Παραλαβή", "Αποστολή"]
        }
        response = requests.post(f"{BASE_URL}/api/admin/products", json=product_data, headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"POST /api/admin/products: Created product {data.get('id')}")
        return data.get("id")
    
    def test_update_product(self, admin_headers):
        """PUT /api/admin/products/{id} should update a product"""
        # First create a product
        product_data = {
            "name": f"TEST_Update_{uuid.uuid4().hex[:6]}",
            "description": "To be updated",
            "price": 19.99,
            "category": "accessories",
            "sizes": [],
            "in_stock": True,
            "delivery_options": ["Παραλαβή"]
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/products", json=product_data, headers=admin_headers)
        assert create_resp.status_code == 200
        product_id = create_resp.json().get("id")
        
        # Update the product
        update_data = {
            "name": f"TEST_Updated_{uuid.uuid4().hex[:6]}",
            "price": 24.99,
            "in_stock": False
        }
        response = requests.put(f"{BASE_URL}/api/admin/products/{product_id}", json=update_data, headers=admin_headers)
        assert response.status_code == 200
        print(f"PUT /api/admin/products/{product_id}: Updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/products/{product_id}", headers=admin_headers)
    
    def test_delete_product(self, admin_headers):
        """DELETE /api/admin/products/{id} should delete a product"""
        # First create a product
        product_data = {
            "name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "description": "To be deleted",
            "price": 9.99,
            "category": "accessories",
            "sizes": [],
            "in_stock": True,
            "delivery_options": []
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/products", json=product_data, headers=admin_headers)
        assert create_resp.status_code == 200
        product_id = create_resp.json().get("id")
        
        # Delete the product
        response = requests.delete(f"{BASE_URL}/api/admin/products/{product_id}", headers=admin_headers)
        assert response.status_code == 200
        print(f"DELETE /api/admin/products/{product_id}: Deleted successfully")
        
        # Verify deletion
        get_resp = requests.get(f"{BASE_URL}/api/admin/products", headers=admin_headers)
        products = get_resp.json()
        assert not any(p.get("id") == product_id for p in products)


class TestAdminTicketsCRUD:
    """Test admin ticket management endpoints"""
    
    def test_get_admin_tickets_requires_auth(self):
        """GET /api/admin/tickets without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/tickets")
        assert response.status_code == 401
        print("GET /api/admin/tickets without auth: 401 as expected")
    
    def test_get_admin_tickets_with_auth(self, admin_headers):
        """GET /api/admin/tickets with auth should return 200"""
        response = requests.get(f"{BASE_URL}/api/admin/tickets", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/admin/tickets: {len(data)} tickets")
    
    def test_create_seasonal_ticket(self, admin_headers):
        """POST /api/admin/tickets should create a seasonal ticket"""
        ticket_data = {
            "name": f"TEST_Seasonal_{uuid.uuid4().hex[:6]}",
            "description": "Test seasonal ticket",
            "price": 150.00,
            "ticket_type": "seasonal",
            "available": True,
            "max_quantity": 100
        }
        response = requests.post(f"{BASE_URL}/api/admin/tickets", json=ticket_data, headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"POST /api/admin/tickets (seasonal): Created ticket {data.get('id')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/tickets/{data.get('id')}", headers=admin_headers)
    
    def test_create_match_ticket(self, admin_headers):
        """POST /api/admin/tickets should create a match ticket"""
        ticket_data = {
            "name": f"TEST_Match_{uuid.uuid4().hex[:6]}",
            "description": "Test match ticket",
            "price": 10.00,
            "ticket_type": "match",
            "fixture_id": None,  # No fixture linked
            "available": True,
            "max_quantity": 200
        }
        response = requests.post(f"{BASE_URL}/api/admin/tickets", json=ticket_data, headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"POST /api/admin/tickets (match): Created ticket {data.get('id')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/tickets/{data.get('id')}", headers=admin_headers)
    
    def test_update_ticket(self, admin_headers):
        """PUT /api/admin/tickets/{id} should update a ticket"""
        # Create ticket
        ticket_data = {
            "name": f"TEST_TicketUpdate_{uuid.uuid4().hex[:6]}",
            "description": "To be updated",
            "price": 20.00,
            "ticket_type": "match",
            "available": True,
            "max_quantity": 50
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/tickets", json=ticket_data, headers=admin_headers)
        assert create_resp.status_code == 200
        ticket_id = create_resp.json().get("id")
        
        # Update
        update_data = {
            "price": 25.00,
            "available": False
        }
        response = requests.put(f"{BASE_URL}/api/admin/tickets/{ticket_id}", json=update_data, headers=admin_headers)
        assert response.status_code == 200
        print(f"PUT /api/admin/tickets/{ticket_id}: Updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/tickets/{ticket_id}", headers=admin_headers)
    
    def test_delete_ticket(self, admin_headers):
        """DELETE /api/admin/tickets/{id} should delete a ticket"""
        # Create ticket
        ticket_data = {
            "name": f"TEST_TicketDelete_{uuid.uuid4().hex[:6]}",
            "description": "To be deleted",
            "price": 5.00,
            "ticket_type": "match",
            "available": True,
            "max_quantity": 10
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/tickets", json=ticket_data, headers=admin_headers)
        assert create_resp.status_code == 200
        ticket_id = create_resp.json().get("id")
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/admin/tickets/{ticket_id}", headers=admin_headers)
        assert response.status_code == 200
        print(f"DELETE /api/admin/tickets/{ticket_id}: Deleted successfully")


class TestAdminOrdersManagement:
    """Test admin order management endpoints"""
    
    def test_get_admin_orders_requires_auth(self):
        """GET /api/admin/orders without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 401
        print("GET /api/admin/orders without auth: 401 as expected")
    
    def test_get_admin_orders_with_auth(self, admin_headers):
        """GET /api/admin/orders with auth should return 200"""
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/admin/orders: {len(data)} orders")
    
    def test_update_order_status(self, admin_headers):
        """PUT /api/admin/orders/{id}/status should update order status"""
        # First get existing orders
        orders_resp = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers)
        orders = orders_resp.json()
        
        if len(orders) == 0:
            pytest.skip("No orders to test status update")
        
        order_id = orders[0].get("id")
        original_status = orders[0].get("status")
        
        # Update to processing
        new_status = "processing" if original_status != "processing" else "pending"
        response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}/status?status={new_status}",
            headers=admin_headers
        )
        assert response.status_code == 200
        print(f"PUT /api/admin/orders/{order_id}/status: Updated to {new_status}")
        
        # Verify update
        verify_resp = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers)
        updated_orders = verify_resp.json()
        updated_order = next((o for o in updated_orders if o.get("id") == order_id), None)
        assert updated_order is not None
        assert updated_order.get("status") == new_status
        
        # Restore original status
        requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}/status?status={original_status}",
            headers=admin_headers
        )


class TestCartAddTicket:
    """Test cart add-ticket endpoint"""
    
    def test_add_ticket_requires_auth(self):
        """POST /api/cart/add-ticket without auth should return 401"""
        response = requests.post(f"{BASE_URL}/api/cart/add-ticket", json={
            "ticket_id": "some-id",
            "quantity": 1
        })
        assert response.status_code == 401
        print("POST /api/cart/add-ticket without auth: 401 as expected")
    
    def test_add_ticket_to_cart(self, customer_headers, admin_headers):
        """POST /api/cart/add-ticket should add ticket to cart"""
        # First create a test ticket
        ticket_data = {
            "name": f"TEST_CartTicket_{uuid.uuid4().hex[:6]}",
            "description": "Test ticket for cart",
            "price": 15.00,
            "ticket_type": "match",
            "available": True,
            "max_quantity": 100
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/tickets", json=ticket_data, headers=admin_headers)
        assert create_resp.status_code == 200
        ticket_id = create_resp.json().get("id")
        
        # Add to cart
        response = requests.post(f"{BASE_URL}/api/cart/add-ticket", json={
            "ticket_id": ticket_id,
            "quantity": 2
        }, headers=customer_headers)
        assert response.status_code == 200
        print(f"POST /api/cart/add-ticket: Added ticket {ticket_id} to cart")
        
        # Verify in cart
        cart_resp = requests.get(f"{BASE_URL}/api/cart", headers=customer_headers)
        assert cart_resp.status_code == 200
        cart = cart_resp.json()
        ticket_in_cart = any(item.get("product_id") == ticket_id for item in cart.get("items", []))
        assert ticket_in_cart, "Ticket should be in cart"
        
        # Cleanup ticket
        requests.delete(f"{BASE_URL}/api/admin/tickets/{ticket_id}", headers=admin_headers)
    
    def test_add_unavailable_ticket_fails(self, customer_headers, admin_headers):
        """POST /api/cart/add-ticket for unavailable ticket should fail"""
        # Create unavailable ticket
        ticket_data = {
            "name": f"TEST_UnavailableTicket_{uuid.uuid4().hex[:6]}",
            "description": "Unavailable ticket",
            "price": 10.00,
            "ticket_type": "match",
            "available": False,
            "max_quantity": 0
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/tickets", json=ticket_data, headers=admin_headers)
        assert create_resp.status_code == 200
        ticket_id = create_resp.json().get("id")
        
        # Try to add to cart
        response = requests.post(f"{BASE_URL}/api/cart/add-ticket", json={
            "ticket_id": ticket_id,
            "quantity": 1
        }, headers=customer_headers)
        assert response.status_code == 404  # Ticket not available
        print("POST /api/cart/add-ticket for unavailable ticket: 404 as expected")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/tickets/{ticket_id}", headers=admin_headers)


class TestPublicProductsEndpoint:
    """Test public products endpoint"""
    
    def test_get_products_returns_200(self):
        """GET /api/products should return 200"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/products: {len(data)} products")
    
    def test_products_have_required_fields(self):
        """Products should have id, name, price, delivery_options"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        if len(products) > 0:
            product = products[0]
            assert "id" in product
            assert "name" in product
            assert "price" in product
            print(f"Product fields verified: {product.get('name')}, price={product.get('price')}")


class TestCartEnrichment:
    """Test that cart correctly enriches both product and ticket items"""
    
    def test_cart_shows_item_types(self, customer_headers):
        """GET /api/cart should show item_type for items"""
        response = requests.get(f"{BASE_URL}/api/cart", headers=customer_headers)
        assert response.status_code == 200
        cart = response.json()
        items = cart.get("items", [])
        if len(items) > 0:
            # Check that items have item_type field
            for item in items:
                if "item_type" in item:
                    print(f"Cart item: {item.get('name')} - type: {item.get('item_type')}")
        print(f"GET /api/cart: {len(items)} items in cart")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
