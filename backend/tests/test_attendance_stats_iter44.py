"""Iter 44 - Admin attendance stats endpoint + mobile font/accent changes regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://club-academy-portal.preview.emergentagent.com").rstrip("/")
ADMIN_USER = "Lefteria FC"
ADMIN_PASS = "L3ft3r1@FC#2024$Secure!"
TEST_PLAYER_ID = "cc9e1511-07d6-40e2-8260-a89ba8db823b"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token") or r.json().get("token")
    assert token, f"No token in login response: {r.json()}"
    return token


@pytest.fixture(scope="module")
def admin_client(admin_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"})
    return s


# ==================== /admin/attendance/stats ====================
class TestAttendanceStatsEndpoint:
    def test_stats_no_filter_returns_attendance_stats_array(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/attendance/stats")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "attendance_stats" in data, f"Missing 'attendance_stats' key: {list(data.keys())}"
        assert isinstance(data["attendance_stats"], list)
        # Sanity: other keys still present for backwards compat
        assert "player_stats" in data
        assert "overall" in data
        assert "total_events" in data

    def test_stats_with_player_id_filters(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/attendance/stats", params={"player_id": TEST_PLAYER_ID})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "attendance_stats" in data
        # All entries must be for this player only
        for entry in data["attendance_stats"]:
            assert entry["player_id"] == TEST_PLAYER_ID

    def test_stats_player_cc9e1511_has_present_record(self, admin_client):
        """Player Ανδρέας Πραστίτης is seeded with 1 present record per iter 44 context."""
        r = admin_client.get(f"{BASE_URL}/api/admin/attendance/stats", params={"player_id": TEST_PLAYER_ID})
        assert r.status_code == 200
        data = r.json()
        stats_list = data["attendance_stats"]
        assert len(stats_list) >= 1, f"Expected at least 1 attendance record for {TEST_PLAYER_ID}, got {stats_list}"
        entry = stats_list[0]
        # Required shape: present, absent, total, attendance_pct
        assert "present" in entry, f"Missing 'present' key: {entry}"
        assert "absent" in entry
        assert "total" in entry
        assert "attendance_pct" in entry
        assert entry["player_id"] == TEST_PLAYER_ID
        assert entry["present"] >= 1, f"Expected at least 1 present record, got {entry}"
        assert entry["total"] == entry["present"] + entry["absent"]
        assert entry["attendance_pct"] == round((entry["present"] / entry["total"] * 100) if entry["total"] > 0 else 0)

    def test_stats_unknown_player_returns_empty(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/attendance/stats", params={"player_id": "TEST_nonexistent_iter44"})
        assert r.status_code == 200
        data = r.json()
        assert data["attendance_stats"] == []

    def test_stats_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/attendance/stats")
        assert r.status_code in (401, 403), f"Expected auth guard, got {r.status_code}"


# ==================== Regression: 4 mobile dashboards still respond ====================
MOBILE_PHONES = {
    "coach": "+357 99 222222",
    "player": "+357 99 333333",
    "management": "+357 99 111111",
    "parent": "+357 99 555666",
}


def _mobile_login(phone):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone})
    assert r.status_code == 200, f"request-otp failed for {phone}: {r.text}"
    code = r.json().get("otp_debug")
    assert code, f"no otp_debug for {phone}: {r.json()}"
    r2 = s.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={"phone": phone, "code": code})
    assert r2.status_code == 200, f"verify-otp failed for {phone}: {r2.text}"
    token = r2.json().get("token") or r2.json().get("access_token")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.mark.parametrize("role,path", [
    ("coach", "/api/mobile/coach/dashboard"),
    ("player", "/api/mobile/player/dashboard"),
    ("management", "/api/mobile/management/dashboard"),
    ("parent", "/api/mobile/parent/dashboard"),
])
class TestMobileDashboardsRegression:
    def test_dashboard_responds_200(self, role, path):
        s = _mobile_login(MOBILE_PHONES[role])
        r = s.get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{role} dashboard failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        assert isinstance(data, dict)


# ==================== Regression: attendance marking still works (coach) ====================
class TestAttendanceMarkingRegression:
    def test_coach_can_get_training_and_roster(self):
        s = _mobile_login(MOBILE_PHONES["coach"])
        r = s.get(f"{BASE_URL}/api/mobile/coach/dashboard")
        assert r.status_code == 200
        training_sessions = r.json().get("training_sessions", [])
        if not training_sessions:
            pytest.skip("No training sessions seeded for coach - cannot test attendance regression")
        tid = training_sessions[0]["id"]
        r2 = s.get(f"{BASE_URL}/api/mobile/attendance/{tid}", params={"event_type": "training"})
        assert r2.status_code == 200, r2.text
        data = r2.json()
        assert "roster" in data
        assert isinstance(data["roster"], list)
