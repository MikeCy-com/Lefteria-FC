"""
Iteration 9: Gallery System API Tests
Tests for Gallery CRUD operations, file upload, filtering, and authentication
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://club-academy-portal.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"

# Test data prefix for cleanup
TEST_PREFIX = "TEST_GALLERY_"


class TestGalleryPublicAPI:
    """Public Gallery API tests (no auth required)"""
    
    def test_get_gallery_returns_empty_initially(self):
        """GET /api/gallery returns empty array when no items exist"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/gallery returned {len(data)} items")
    
    def test_get_gallery_with_category_filter(self):
        """GET /api/gallery?category=Training filters by category"""
        response = requests.get(f"{BASE_URL}/api/gallery?category=Training")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All items should have category=Training
        for item in data:
            assert item.get("category") == "Training"
        print(f"GET /api/gallery?category=Training returned {len(data)} items")
    
    def test_get_gallery_with_player_filter(self):
        """GET /api/gallery?player_id=xxx filters by player"""
        fake_player_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/gallery?player_id={fake_player_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/gallery?player_id={fake_player_id} returned {len(data)} items")


class TestGalleryAdminAuth:
    """Gallery Admin API authentication tests"""
    
    def test_create_gallery_without_auth_returns_401(self):
        """POST /api/admin/gallery without auth returns 401"""
        payload = {
            "title": "Test Photo",
            "image_url": "https://example.com/test.jpg",
            "category": "Other"
        }
        response = requests.post(f"{BASE_URL}/api/admin/gallery", json=payload)
        assert response.status_code == 401
        print("POST /api/admin/gallery without auth correctly returns 401")
    
    def test_upload_gallery_without_auth_returns_401(self):
        """POST /api/admin/gallery/upload without auth returns 401"""
        # Create a simple test file
        files = {'file': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/admin/gallery/upload", files=files)
        assert response.status_code == 401
        print("POST /api/admin/gallery/upload without auth correctly returns 401")
    
    def test_update_gallery_without_auth_returns_401(self):
        """PUT /api/admin/gallery/{id} without auth returns 401"""
        fake_id = str(uuid.uuid4())
        payload = {"title": "Updated Title", "image_url": "https://example.com/test.jpg", "category": "Other"}
        response = requests.put(f"{BASE_URL}/api/admin/gallery/{fake_id}", json=payload)
        assert response.status_code == 401
        print("PUT /api/admin/gallery/{id} without auth correctly returns 401")
    
    def test_delete_gallery_without_auth_returns_401(self):
        """DELETE /api/admin/gallery/{id} without auth returns 401"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/admin/gallery/{fake_id}")
        assert response.status_code == 401
        print("DELETE /api/admin/gallery/{id} without auth correctly returns 401")


class TestGalleryAdminCRUD:
    """Gallery Admin CRUD operations with authentication"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        print(f"Logged in as {ADMIN_USERNAME}")
        return data["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_create_gallery_item(self, auth_headers):
        """POST /api/admin/gallery creates a gallery item"""
        payload = {
            "title": f"{TEST_PREFIX}Match Day Photo",
            "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
            "category": "Match Day",
            "description": "Test match day photo",
            "is_featured": False
        }
        response = requests.post(f"{BASE_URL}/api/admin/gallery", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["image_url"] == payload["image_url"]
        assert data["category"] == payload["category"]
        assert data["description"] == payload["description"]
        assert "created_at" in data
        
        print(f"Created gallery item with id: {data['id']}")
        
        # Store for later tests
        TestGalleryAdminCRUD.created_item_id = data["id"]
        return data
    
    def test_get_gallery_item_after_create(self, auth_headers):
        """GET /api/gallery/{id} returns the created item"""
        item_id = getattr(TestGalleryAdminCRUD, 'created_item_id', None)
        if not item_id:
            pytest.skip("No item created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/gallery/{item_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == item_id
        assert TEST_PREFIX in data["title"]
        print(f"GET /api/gallery/{item_id} returned correct item")
    
    def test_gallery_item_appears_in_list(self, auth_headers):
        """GET /api/gallery includes the created item"""
        item_id = getattr(TestGalleryAdminCRUD, 'created_item_id', None)
        if not item_id:
            pytest.skip("No item created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        
        # Find our test item
        test_items = [item for item in data if item["id"] == item_id]
        assert len(test_items) == 1, f"Created item not found in gallery list"
        print(f"Created item found in gallery list")
    
    def test_filter_gallery_by_category(self, auth_headers):
        """GET /api/gallery?category=Match Day returns filtered items"""
        response = requests.get(f"{BASE_URL}/api/gallery?category=Match%20Day")
        assert response.status_code == 200
        data = response.json()
        
        # All items should have category=Match Day
        for item in data:
            assert item.get("category") == "Match Day"
        
        # Our test item should be in the list
        item_id = getattr(TestGalleryAdminCRUD, 'created_item_id', None)
        if item_id:
            test_items = [item for item in data if item["id"] == item_id]
            assert len(test_items) == 1, "Test item not found in filtered results"
        
        print(f"Category filter returned {len(data)} Match Day items")
    
    def test_update_gallery_item(self, auth_headers):
        """PUT /api/admin/gallery/{id} updates a gallery item"""
        item_id = getattr(TestGalleryAdminCRUD, 'created_item_id', None)
        if not item_id:
            pytest.skip("No item created in previous test")
        
        payload = {
            "title": f"{TEST_PREFIX}Updated Photo Title",
            "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
            "category": "Training",
            "description": "Updated description",
            "is_featured": True
        }
        response = requests.put(f"{BASE_URL}/api/admin/gallery/{item_id}", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        
        # Verify updates
        assert data["title"] == payload["title"]
        assert data["category"] == payload["category"]
        assert data["description"] == payload["description"]
        assert data["is_featured"] == True
        
        print(f"Updated gallery item {item_id}")
    
    def test_verify_update_persisted(self, auth_headers):
        """GET /api/gallery/{id} returns updated data"""
        item_id = getattr(TestGalleryAdminCRUD, 'created_item_id', None)
        if not item_id:
            pytest.skip("No item created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/gallery/{item_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify updates persisted
        assert "Updated Photo Title" in data["title"]
        assert data["category"] == "Training"
        assert data["is_featured"] == True
        
        print(f"Update persisted correctly for item {item_id}")
    
    def test_delete_gallery_item(self, auth_headers):
        """DELETE /api/admin/gallery/{id} deletes a gallery item"""
        item_id = getattr(TestGalleryAdminCRUD, 'created_item_id', None)
        if not item_id:
            pytest.skip("No item created in previous test")
        
        response = requests.delete(f"{BASE_URL}/api/admin/gallery/{item_id}", headers=auth_headers)
        assert response.status_code == 200
        
        print(f"Deleted gallery item {item_id}")
    
    def test_verify_delete_persisted(self, auth_headers):
        """GET /api/gallery/{id} returns 404 after delete"""
        item_id = getattr(TestGalleryAdminCRUD, 'created_item_id', None)
        if not item_id:
            pytest.skip("No item created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/gallery/{item_id}")
        assert response.status_code == 404
        
        print(f"Item {item_id} correctly returns 404 after delete")


class TestGalleryDashboardStats:
    """Test gallery_photos count in admin dashboard"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_dashboard_includes_gallery_photos_count(self, auth_headers):
        """GET /api/admin/dashboard includes gallery_photos count"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify gallery_photos field exists
        assert "gallery_photos" in data
        assert isinstance(data["gallery_photos"], int)
        
        print(f"Dashboard shows gallery_photos: {data['gallery_photos']}")


class TestGalleryFileUpload:
    """Test gallery image file upload"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_upload_gallery_image(self, auth_headers):
        """POST /api/admin/gallery/upload uploads an image file"""
        # Create a minimal valid JPEG file (1x1 pixel)
        # This is a valid JPEG header + minimal image data
        jpeg_data = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7E, 0xA9,
            0x00, 0x1F, 0xFF, 0xD9
        ])
        
        files = {'file': ('test_gallery.jpg', jpeg_data, 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/admin/gallery/upload", files=files, headers=auth_headers)
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        
        # Verify response contains image_url
        assert "image_url" in data
        assert data["image_url"].startswith("/api/uploads/gallery/")
        
        print(f"Uploaded image, URL: {data['image_url']}")
        
        # Store for cleanup
        TestGalleryFileUpload.uploaded_url = data["image_url"]
    
    def test_uploaded_image_accessible(self, auth_headers):
        """Uploaded image is accessible via the returned URL"""
        uploaded_url = getattr(TestGalleryFileUpload, 'uploaded_url', None)
        if not uploaded_url:
            pytest.skip("No image uploaded in previous test")
        
        # Access the uploaded image
        response = requests.get(f"{BASE_URL}{uploaded_url}")
        assert response.status_code == 200
        assert response.headers.get('content-type', '').startswith('image/')
        
        print(f"Uploaded image accessible at {uploaded_url}")


class TestGalleryCategories:
    """Test all gallery categories"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_create_items_for_all_categories(self, auth_headers):
        """Create gallery items for all categories"""
        categories = ["Match Day", "Training", "Team Events", "Academy", "Fans", "Other"]
        created_ids = []
        
        for cat in categories:
            payload = {
                "title": f"{TEST_PREFIX}{cat} Photo",
                "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
                "category": cat,
                "description": f"Test photo for {cat} category"
            }
            response = requests.post(f"{BASE_URL}/api/admin/gallery", json=payload, headers=auth_headers)
            assert response.status_code == 200, f"Failed to create {cat} item: {response.text}"
            created_ids.append(response.json()["id"])
            print(f"Created {cat} gallery item")
        
        # Store for cleanup
        TestGalleryCategories.created_ids = created_ids
    
    def test_filter_each_category(self, auth_headers):
        """Test filtering by each category"""
        categories = ["Match Day", "Training", "Team Events", "Academy", "Fans", "Other"]
        
        for cat in categories:
            response = requests.get(f"{BASE_URL}/api/gallery?category={cat.replace(' ', '%20')}")
            assert response.status_code == 200
            data = response.json()
            
            # All items should have the correct category
            for item in data:
                assert item.get("category") == cat
            
            print(f"Category '{cat}' filter returned {len(data)} items")
    
    def test_cleanup_test_items(self, auth_headers):
        """Cleanup test items"""
        created_ids = getattr(TestGalleryCategories, 'created_ids', [])
        
        for item_id in created_ids:
            response = requests.delete(f"{BASE_URL}/api/admin/gallery/{item_id}", headers=auth_headers)
            assert response.status_code == 200
        
        print(f"Cleaned up {len(created_ids)} test items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
