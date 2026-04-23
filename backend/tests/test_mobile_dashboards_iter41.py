"""
Iteration 41: Mobile PWA Dashboard Redesign Tests
Tests: Coach, Player, Management, Parent dashboards via role-based OTP login.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://club-academy-portal.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

PHONES = {
    "parent": "+357 99 555666",
    "coach": "+357 99 222222",
    "player": "+357 99 333333",
    "management": "+357 99 111111",
}


def login(phone):
    r = requests.post(f"{API}/mobile/auth/request-otp", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, f"request-otp failed {r.status_code} {r.text}"
    data = r.json()
    assert "otp_debug" in data, f"otp_debug not in response: {data}"
    code = data["otp_debug"]
    role_detected = data.get("role_detected")

    r2 = requests.post(f"{API}/mobile/auth/verify-otp", json={"phone": phone, "code": code}, timeout=15)
    assert r2.status_code == 200, f"verify-otp failed {r2.status_code} {r2.text}"
    d = r2.json()
    assert "token" in d
    return d["token"], role_detected, d.get("user", {})


@pytest.fixture(scope="module")
def tokens():
    t = {}
    for role, phone in PHONES.items():
        try:
            token, detected, user = login(phone)
            t[role] = {"token": token, "detected": detected, "user": user}
        except AssertionError as e:
            t[role] = {"error": str(e)}
    return t


# ---------- Auth / role detection ----------
def test_role_detection(tokens):
    for role in ["parent", "coach", "player", "management"]:
        assert "token" in tokens[role], f"login failed for {role}: {tokens[role].get('error')}"
        assert tokens[role]["detected"] == role, f"{role}: detected={tokens[role]['detected']}"


# ---------- Coach ----------
def test_coach_dashboard(tokens):
    tok = tokens["coach"]["token"]
    r = requests.get(f"{API}/mobile/coach/dashboard", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    for key in ["teams", "groups", "players", "fixtures", "events", "announcements", "training_sessions"]:
        assert key in d, f"missing '{key}' in coach dashboard. keys={list(d.keys())}"
        assert isinstance(d[key], list)


def test_coach_dashboard_no_auth():
    r = requests.get(f"{API}/mobile/coach/dashboard", timeout=15)
    assert r.status_code in (401, 403)


def test_coach_dashboard_wrong_role(tokens):
    tok = tokens["player"]["token"]
    r = requests.get(f"{API}/mobile/coach/dashboard", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 403


# ---------- Player ----------
def test_player_dashboard(tokens):
    tok = tokens["player"]["token"]
    r = requests.get(f"{API}/mobile/player/dashboard", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    for key in ["player", "stats", "fixtures", "events", "announcements"]:
        assert key in d, f"missing '{key}' in player dashboard. keys={list(d.keys())}"
    for s in ["goals", "assists", "appearances", "minutes"]:
        assert s in d["stats"], f"stats missing '{s}': {d['stats']}"
        assert isinstance(d["stats"][s], (int, float))
    if d["player"]:
        assert "name" in d["player"] or "first_name" in d["player"]


def test_player_dashboard_wrong_role(tokens):
    tok = tokens["coach"]["token"]
    r = requests.get(f"{API}/mobile/player/dashboard", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 403


# ---------- Management ----------
def test_management_dashboard(tokens):
    tok = tokens["management"]["token"]
    r = requests.get(f"{API}/mobile/management/dashboard", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    for key in ["teams", "groups", "player_count", "financial", "registrations", "announcements", "events"]:
        assert key in d, f"missing '{key}' in mgmt dashboard. keys={list(d.keys())}"
    assert isinstance(d["player_count"], int)
    for f in ["total_revenue", "total_pending", "total_overdue"]:
        assert f in d["financial"]
        assert isinstance(d["financial"][f], (int, float))


def test_management_dashboard_wrong_role(tokens):
    tok = tokens["parent"]["token"]
    r = requests.get(f"{API}/mobile/management/dashboard", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 403


# ---------- Parent (regression) ----------
def test_parent_dashboard(tokens):
    tok = tokens["parent"]["token"]
    r = requests.get(f"{API}/mobile/parent/dashboard", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    # parent dashboard typically has children/groups/fixtures
    assert isinstance(d, dict) and len(d) > 0


# ---------- /auth/me for each role ----------
def test_auth_me_all_roles(tokens):
    for role in ["parent", "coach", "player", "management"]:
        tok = tokens[role]["token"]
        r = requests.get(f"{API}/mobile/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
        assert r.status_code == 200, f"{role}: {r.text}"
        d = r.json()
        assert d.get("role") == role, f"{role}: me returned role={d.get('role')}"
