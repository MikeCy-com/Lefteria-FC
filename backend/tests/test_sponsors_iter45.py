"""Iteration 45 - Sponsors CRUD + Academy/Sponsors public route smoke tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://club-academy-portal.preview.emergentagent.com").rstrip("/")
ADMIN_USER = "Lefteria FC"
ADMIN_PASS = "L3ft3r1@FC#2024$Secure!"


@pytest.fixture(scope="module")
def auth_token():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip(f"No token in login response: {data}")
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# --------- Public Sponsor list / filter ---------
class TestSponsorsPublic:
    def test_list_all_sponsors(self):
        r = requests.get(f"{BASE_URL}/api/sponsors", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        # Ensure no Mongo _id leak
        for s in data:
            assert "_id" not in s
            assert "id" in s
            assert "name" in s
            assert "level" in s
            assert "sponsor_type" in s
            assert "display_order" in s
        # Sorted by display_order asc
        orders = [s.get("display_order", 0) for s in data]
        assert orders == sorted(orders), f"Sponsors not sorted by display_order: {orders}"

    def test_filter_first_team(self):
        r = requests.get(f"{BASE_URL}/api/sponsors", params={"type": "first_team"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        for s in data:
            assert s["sponsor_type"] == "first_team", s

    def test_filter_academy(self):
        r = requests.get(f"{BASE_URL}/api/sponsors", params={"type": "academy"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for s in data:
            assert s["sponsor_type"] == "academy", s

    def test_get_seeded_sponsor(self):
        sid = "d857ae0c-6bcc-4ce7-b640-985af59a5c51"
        r = requests.get(f"{BASE_URL}/api/sponsors/{sid}", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == sid
        assert data["name"] == "Cyprus Football Association"
        assert data["level"] == "mega"
        assert data["sponsor_type"] == "first_team"
        assert "_id" not in data

    def test_get_sponsor_404(self):
        r = requests.get(f"{BASE_URL}/api/sponsors/nonexistent-id-xyz", timeout=15)
        assert r.status_code == 404


# --------- Admin CRUD ---------
class TestSponsorsAdminCRUD:
    created_id = None

    def test_create_sponsor_unauthenticated(self):
        r = requests.post(f"{BASE_URL}/api/admin/sponsors", json={"name": "TEST_NoAuth"}, timeout=15)
        assert r.status_code in (401, 403), r.status_code

    def test_create_sponsor(self, auth_headers):
        payload = {
            "name": "TEST_Sponsor_Iter45",
            "description": "Test sponsor created by iter45 tests",
            "logo_url": "/api/uploads/sponsors/example.png",
            "banner_url": "/api/uploads/sponsors/banner.png",
            "website": "https://example.com",
            "level": "silver",
            "sponsor_type": "first_team",
            "display_order": 999
        }
        r = requests.post(f"{BASE_URL}/api/admin/sponsors", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["level"] == "silver"
        assert data["sponsor_type"] == "first_team"
        assert data["display_order"] == 999
        assert "id" in data and isinstance(data["id"], str)
        TestSponsorsAdminCRUD.created_id = data["id"]

        # Verify persistence
        g = requests.get(f"{BASE_URL}/api/sponsors/{data['id']}", timeout=15)
        assert g.status_code == 200
        gd = g.json()
        assert gd["name"] == payload["name"]
        assert gd["website"] == "https://example.com"

    def test_update_sponsor(self, auth_headers):
        sid = TestSponsorsAdminCRUD.created_id
        assert sid, "create test must run first"
        update_payload = {
            "name": "TEST_Sponsor_Iter45_Updated",
            "description": "updated desc",
            "logo_url": "",
            "banner_url": "",
            "website": "https://updated.example.com",
            "level": "gold",
            "sponsor_type": "academy",
            "display_order": 5
        }
        r = requests.put(f"{BASE_URL}/api/admin/sponsors/{sid}", json=update_payload, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Sponsor_Iter45_Updated"
        assert data["level"] == "gold"
        assert data["sponsor_type"] == "academy"
        assert data["display_order"] == 5

        # Verify persistence
        g = requests.get(f"{BASE_URL}/api/sponsors/{sid}", timeout=15).json()
        assert g["name"] == "TEST_Sponsor_Iter45_Updated"
        assert g["sponsor_type"] == "academy"

    def test_update_404(self, auth_headers):
        r = requests.put(f"{BASE_URL}/api/admin/sponsors/nonexistent-zzz",
                         json={"name": "x"}, headers=auth_headers, timeout=15)
        assert r.status_code == 404

    def test_delete_sponsor(self, auth_headers):
        sid = TestSponsorsAdminCRUD.created_id
        assert sid
        r = requests.delete(f"{BASE_URL}/api/admin/sponsors/{sid}", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        # Verify gone
        g = requests.get(f"{BASE_URL}/api/sponsors/{sid}", timeout=15)
        assert g.status_code == 404

    def test_delete_404(self, auth_headers):
        r = requests.delete(f"{BASE_URL}/api/admin/sponsors/nonexistent-zzz", headers=auth_headers, timeout=15)
        assert r.status_code == 404


# --------- Public route smoke tests ---------
class TestPublicPagesReachable:
    @pytest.mark.parametrize("path", [
        "/academy",
        "/academy/philosophy",
        "/academy/groups",
        "/academy/registration",
        "/sponsors/first-team",
        "/sponsors/academy",
        "/sponsors/d857ae0c-6bcc-4ce7-b640-985af59a5c51",
    ])
    def test_route_returns_html(self, path):
        r = requests.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code}"
        # SPA returns index.html
        assert "<div id=\"root\"" in r.text or "<!doctype html>" in r.text.lower()
