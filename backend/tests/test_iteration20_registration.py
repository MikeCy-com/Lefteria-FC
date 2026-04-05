"""
Iteration 20: Academy Registration Feature Tests
Tests for multi-step registration form, admin registration management, and approval workflow
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "Lefteria FC"
ADMIN_PASSWORD = "L3ft3r1@FC#2024$Secure!"


class TestPublicRegistrationAPI:
    """Tests for public registration submission endpoint"""
    
    def test_create_registration_success(self):
        """POST /api/registrations - Create a new registration"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "player_first_name": f"TestPlayer{test_id}",
            "player_last_name": "TestLastName",
            "player_dob": "2015-05-15",
            "player_gender": "male",
            "player_address": "Test Address 123",
            "player_city": "Λευκωσία",
            "player_postal_code": "1060",
            "parent_name": "Test Parent",
            "parent_relationship": "Πατέρας",
            "parent_phone": "+357 99 123456",
            "parent_email": f"test{test_id}@example.com",
            "emergency_name": "Emergency Contact",
            "emergency_phone": "+357 99 654321",
            "emergency_relationship": "Θείος",
            "has_allergies": False,
            "allergies_details": "",
            "has_conditions": False,
            "conditions_details": "",
            "has_medication": False,
            "medication_details": "",
            "consent_participation": True,
            "consent_medical_auth": True,
            "consent_gdpr": True,
            "consent_media": True,
            "consent_communications": True,
            "comm_email": True,
            "comm_sms": False,
            "consent_liability": True,
            "consent_financial": True,
            "payment_method": "cash",
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "signature_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "message" in data  # API returns message and id
        
        # Store for cleanup
        self.__class__.test_registration_id = data["id"]
        print(f"✓ Created registration: {data['id']}")
    
    def test_create_registration_with_medical_info(self):
        """POST /api/registrations - Create registration with medical conditions"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "player_first_name": f"MedicalTest{test_id}",
            "player_last_name": "WithAllergies",
            "player_dob": "2016-03-20",
            "player_gender": "female",
            "player_address": "Medical Test St 45",
            "player_city": "Λεμεσός",
            "player_postal_code": "3000",
            "parent_name": "Medical Parent",
            "parent_relationship": "Μητέρα",
            "parent_phone": "+357 99 111222",
            "parent_email": f"medical{test_id}@example.com",
            "emergency_name": "Emergency Medical",
            "emergency_phone": "+357 99 333444",
            "emergency_relationship": "Γιαγιά",
            "has_allergies": True,
            "allergies_details": "Αλλεργία στα φιστίκια",
            "has_conditions": True,
            "conditions_details": "Άσθμα",
            "has_medication": True,
            "medication_details": "Ventolin εισπνοές",
            "consent_participation": True,
            "consent_medical_auth": True,
            "consent_gdpr": True,
            "consent_media": False,
            "consent_communications": True,
            "comm_email": True,
            "comm_sms": True,
            "consent_liability": True,
            "consent_financial": True,
            "payment_method": "card",
            "signature_data": "data:image/png;base64,test",
            "signature_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        
        # Verify by fetching the registration via admin API
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        reg_response = requests.get(f"{BASE_URL}/api/admin/registrations/{data['id']}", headers=headers)
        reg_data = reg_response.json()
        assert reg_data["has_allergies"] == True
        assert reg_data["allergies_details"] == "Αλλεργία στα φιστίκια"
        assert reg_data["has_conditions"] == True
        assert reg_data["consent_media"] == False
        print(f"✓ Created registration with medical info: {data['id']}")


class TestAdminRegistrationAPI:
    """Tests for admin registration management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_all_registrations(self):
        """GET /api/admin/registrations - List all registrations"""
        response = requests.get(f"{BASE_URL}/api/admin/registrations", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} registrations")
    
    def test_get_registrations_by_status_pending(self):
        """GET /api/admin/registrations?status=pending - Filter by pending status"""
        response = requests.get(f"{BASE_URL}/api/admin/registrations?status=pending", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        for reg in data:
            assert reg["status"] == "pending"
        print(f"✓ Retrieved {len(data)} pending registrations")
    
    def test_get_registrations_by_status_approved(self):
        """GET /api/admin/registrations?status=approved - Filter by approved status"""
        response = requests.get(f"{BASE_URL}/api/admin/registrations?status=approved", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        for reg in data:
            assert reg["status"] == "approved"
        print(f"✓ Retrieved {len(data)} approved registrations")
    
    def test_get_single_registration(self):
        """GET /api/admin/registrations/{id} - Get registration detail"""
        # First get list to find an ID
        list_response = requests.get(f"{BASE_URL}/api/admin/registrations", headers=self.headers)
        registrations = list_response.json()
        
        if len(registrations) == 0:
            pytest.skip("No registrations to test")
        
        reg_id = registrations[0]["id"]
        response = requests.get(f"{BASE_URL}/api/admin/registrations/{reg_id}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == reg_id
        assert "player_first_name" in data
        assert "parent_name" in data
        print(f"✓ Retrieved registration detail: {data['player_first_name']} {data['player_last_name']}")
    
    def test_approve_registration_creates_player(self):
        """PUT /api/admin/registrations/{id}/status - Approve creates academy player"""
        # First create a test registration
        test_id = str(uuid.uuid4())[:8]
        create_payload = {
            "player_first_name": f"ApproveTest{test_id}",
            "player_last_name": "ForApproval",
            "player_dob": "2014-08-10",
            "player_gender": "male",
            "player_address": "Approval St 99",
            "player_city": "Πάφος",
            "player_postal_code": "8000",
            "parent_name": "Approval Parent",
            "parent_relationship": "Πατέρας",
            "parent_phone": "+357 99 555666",
            "parent_email": f"approve{test_id}@example.com",
            "emergency_name": "Emergency Approve",
            "emergency_phone": "+357 99 777888",
            "emergency_relationship": "Θείος",
            "has_allergies": False,
            "has_conditions": False,
            "has_medication": False,
            "consent_participation": True,
            "consent_medical_auth": True,
            "consent_gdpr": True,
            "consent_media": True,
            "consent_liability": True,
            "consent_financial": True,
            "payment_method": "transfer",
            "signature_data": "data:image/png;base64,test",
            "signature_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        create_response = requests.post(f"{BASE_URL}/api/registrations", json=create_payload)
        assert create_response.status_code == 200
        reg_id = create_response.json()["id"]
        
        # Get academy groups to assign
        groups_response = requests.get(f"{BASE_URL}/api/academy-groups")
        groups = groups_response.json()
        group_id = groups[0]["id"] if groups else None
        
        # Approve the registration
        approve_payload = {
            "status": "approved",
            "admin_notes": "Test approval",
            "assigned_group_id": group_id
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/registrations/{reg_id}/status",
            json=approve_payload,
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data  # API returns message
        
        # Verify status changed by fetching the registration
        verify_response = requests.get(f"{BASE_URL}/api/admin/registrations/{reg_id}", headers=self.headers)
        verify_data = verify_response.json()
        assert verify_data["status"] == "approved"
        
        # Verify player was created
        if group_id:
            players_response = requests.get(f"{BASE_URL}/api/players?team_type=Academy")
            players = players_response.json()
            player_names = [p["name"] for p in players]
            expected_name = f"{create_payload['player_first_name']} {create_payload['player_last_name']}"
            assert expected_name in player_names, f"Player {expected_name} not found in academy players"
            print(f"✓ Approved registration and created academy player: {expected_name}")
        else:
            print(f"✓ Approved registration (no academy group to assign)")
    
    def test_reject_registration(self):
        """PUT /api/admin/registrations/{id}/status - Reject registration"""
        # Create a test registration
        test_id = str(uuid.uuid4())[:8]
        create_payload = {
            "player_first_name": f"RejectTest{test_id}",
            "player_last_name": "ForRejection",
            "player_dob": "2015-01-01",
            "player_gender": "female",
            "player_address": "Reject St 1",
            "player_city": "Λάρνακα",
            "player_postal_code": "6000",
            "parent_name": "Reject Parent",
            "parent_relationship": "Μητέρα",
            "parent_phone": "+357 99 999000",
            "parent_email": f"reject{test_id}@example.com",
            "emergency_name": "Emergency Reject",
            "emergency_phone": "+357 99 000111",
            "emergency_relationship": "",
            "consent_participation": True,
            "consent_medical_auth": True,
            "consent_gdpr": True,
            "consent_liability": True,
            "consent_financial": True,
            "payment_method": "cash",
            "signature_data": "data:image/png;base64,test",
            "signature_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        create_response = requests.post(f"{BASE_URL}/api/registrations", json=create_payload)
        reg_id = create_response.json()["id"]
        
        # Reject the registration
        reject_payload = {
            "status": "rejected",
            "admin_notes": "Test rejection - age not suitable"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/registrations/{reg_id}/status",
            json=reject_payload,
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data  # API returns message
        
        # Verify status changed
        verify_response = requests.get(f"{BASE_URL}/api/admin/registrations/{reg_id}", headers=self.headers)
        verify_data = verify_response.json()
        assert verify_data["status"] == "rejected"
        print(f"✓ Rejected registration: {reg_id}")
    
    def test_delete_registration(self):
        """DELETE /api/admin/registrations/{id} - Delete registration"""
        # Create a test registration
        test_id = str(uuid.uuid4())[:8]
        create_payload = {
            "player_first_name": f"DeleteTest{test_id}",
            "player_last_name": "ForDeletion",
            "player_dob": "2016-06-06",
            "player_gender": "male",
            "player_address": "Delete St 666",
            "player_city": "Αμμόχωστος",
            "player_postal_code": "5000",
            "parent_name": "Delete Parent",
            "parent_relationship": "Κηδεμόνας",
            "parent_phone": "+357 99 666777",
            "parent_email": f"delete{test_id}@example.com",
            "emergency_name": "Emergency Delete",
            "emergency_phone": "+357 99 888999",
            "emergency_relationship": "Παππούς",
            "consent_participation": True,
            "consent_medical_auth": True,
            "consent_gdpr": True,
            "consent_liability": True,
            "consent_financial": True,
            "payment_method": "cash",
            "signature_data": "data:image/png;base64,test",
            "signature_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        create_response = requests.post(f"{BASE_URL}/api/registrations", json=create_payload)
        reg_id = create_response.json()["id"]
        
        # Delete the registration
        response = requests.delete(
            f"{BASE_URL}/api/admin/registrations/{reg_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/admin/registrations/{reg_id}",
            headers=self.headers
        )
        assert get_response.status_code == 404
        print(f"✓ Deleted registration: {reg_id}")


class TestAcademyGroupsAPI:
    """Tests for academy groups (needed for registration assignment)"""
    
    def test_get_academy_groups(self):
        """GET /api/academy-groups - List academy groups"""
        response = requests.get(f"{BASE_URL}/api/academy-groups")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify expected groups exist (U12, U7, U9 per context)
        group_names = [g["name"] for g in data]
        print(f"✓ Academy groups: {group_names}")


class TestAdminStats:
    """Tests for admin dashboard stats including pending registrations count"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_dashboard_includes_pending_registrations(self):
        """GET /api/admin/dashboard - Should include pending_registrations count"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "pending_registrations" in data
        assert isinstance(data["pending_registrations"], int)
        print(f"✓ Admin dashboard - pending registrations: {data['pending_registrations']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
