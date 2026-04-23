"""Tests for attendance tracking API (iter 42)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000").rstrip("/")

PHONES = {
    "parent": "+357 99 555666",
    "coach": "+357 99 222222",
    "player": "+357 99 333333",
    "management": "+357 99 111111",
}

TEST_PLAYER_ID = "cc9e1511-07d6-40e2-8260-a89ba8db823b"  # Ανδρέας Πραστίτης


def _login(phone):
    r = requests.post(f"{BASE_URL}/api/mobile/auth/request-otp", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, r.text
    code = r.json()["otp_debug"]
    r2 = requests.post(f"{BASE_URL}/api/mobile/auth/verify-otp", json={"phone": phone, "code": code}, timeout=15)
    assert r2.status_code == 200, r2.text
    data = r2.json()
    return data["token"], data["user"]


@pytest.fixture(scope="module")
def tokens():
    return {role: _login(p) for role, p in PHONES.items()}


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Helper: find a training session from coach dashboard ----------
@pytest.fixture(scope="module")
def training_session_id(tokens):
    token, _ = tokens["coach"]
    r = requests.get(f"{BASE_URL}/api/mobile/coach/dashboard", headers=_auth(token), timeout=15)
    assert r.status_code == 200
    sessions = r.json().get("training_sessions", [])
    assert sessions, "No training sessions found for coach"
    # Pick a session with a future date to avoid lock. Iterate until we find >= today
    import datetime as dt
    today = dt.datetime.utcnow().strftime("%Y-%m-%d")
    future = [s for s in sessions if (s.get("date", "") or "")[:10] >= today]
    s = future[0] if future else sessions[0]
    return s["id"], s.get("date", "")


# ---------- mark attendance endpoints ----------
class TestMarkAttendance:
    def test_coach_marks_player_present(self, tokens, training_session_id):
        token, _ = tokens["coach"]
        event_id, _ = training_session_id
        body = {"event_id": event_id, "player_id": TEST_PLAYER_ID, "status": "present", "event_type": "training"}
        r = requests.post(f"{BASE_URL}/api/mobile/attendance/mark", json=body, headers=_auth(token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "present"
        assert data["player_id"] == TEST_PLAYER_ID

        # Verify via GET
        g = requests.get(
            f"{BASE_URL}/api/mobile/attendance/{event_id}?event_type=training",
            headers=_auth(token), timeout=15,
        )
        assert g.status_code == 200
        rosters = g.json()["roster"]
        found = next((p for p in rosters if p["id"] == TEST_PLAYER_ID), None)
        assert found is not None, "Player not in roster"
        assert found["attendance_status"] == "present"

    def test_player_marks_self(self, tokens, training_session_id):
        token, user = tokens["player"]
        event_id, _ = training_session_id
        body = {"event_id": event_id, "status": "present", "event_type": "training"}
        r = requests.post(f"{BASE_URL}/api/mobile/attendance/mark", json=body, headers=_auth(token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "present"
        assert data["player_id"] == user.get("linked_player_id")

    def test_parent_marks_child(self, tokens, training_session_id):
        token, user = tokens["parent"]
        event_id, _ = training_session_id
        # Use parent's linked player
        child_id = user.get("linked_player_id") or (user.get("linked_player_ids") or [None])[0]
        assert child_id, "Parent has no linked child"
        body = {"event_id": event_id, "player_id": child_id, "status": "present", "event_type": "training"}
        r = requests.post(f"{BASE_URL}/api/mobile/attendance/mark", json=body, headers=_auth(token), timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "present"

    def test_lock_when_event_passed(self, tokens):
        """Create a past training session in DB, then try to mark -> expect 403."""
        import pymongo
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        client = pymongo.MongoClient(mongo_url)
        db = client[db_name]
        past_id = "TEST_past_training_iter42"
        db.training_sessions.update_one(
            {"id": past_id},
            {"$set": {"id": past_id, "date": "2020-01-01", "title": "TEST past", "academy_group_id": None}},
            upsert=True,
        )
        try:
            token, _ = tokens["coach"]
            body = {"event_id": past_id, "player_id": TEST_PLAYER_ID, "status": "present", "event_type": "training"}
            r = requests.post(f"{BASE_URL}/api/mobile/attendance/mark", json=body, headers=_auth(token), timeout=15)
            assert r.status_code == 403, f"Expected 403 for locked event, got {r.status_code}: {r.text}"
            assert "locked" in r.json().get("detail", "").lower()
        finally:
            db.training_sessions.delete_one({"id": past_id})
            client.close()

    def test_invalid_status(self, tokens, training_session_id):
        token, _ = tokens["coach"]
        event_id, _ = training_session_id
        body = {"event_id": event_id, "player_id": TEST_PLAYER_ID, "status": "maybe", "event_type": "training"}
        r = requests.post(f"{BASE_URL}/api/mobile/attendance/mark", json=body, headers=_auth(token), timeout=15)
        assert r.status_code == 400

    def test_no_auth(self, training_session_id):
        event_id, _ = training_session_id
        r = requests.post(f"{BASE_URL}/api/mobile/attendance/mark", json={"event_id": event_id, "status": "present"}, timeout=15)
        assert r.status_code == 401


class TestGetEventAttendance:
    def test_coach_roster(self, tokens, training_session_id):
        token, _ = tokens["coach"]
        event_id, _ = training_session_id
        r = requests.get(
            f"{BASE_URL}/api/mobile/attendance/{event_id}?event_type=training",
            headers=_auth(token), timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert "roster" in data and isinstance(data["roster"], list)
        assert "records" in data
        assert "is_locked" in data
        assert "summary" in data
        assert data["summary"]["total"] == len(data["roster"])
        assert data["is_locked"] is False  # future date

    def test_locked_flag_true_for_past(self, tokens):
        import pymongo
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        client = pymongo.MongoClient(mongo_url)
        db = client[db_name]
        past_id = "TEST_past_training_iter42_get"
        db.training_sessions.update_one(
            {"id": past_id},
            {"$set": {"id": past_id, "date": "2020-01-01", "title": "TEST past"}},
            upsert=True,
        )
        try:
            token, _ = tokens["coach"]
            r = requests.get(
                f"{BASE_URL}/api/mobile/attendance/{past_id}?event_type=training",
                headers=_auth(token), timeout=15,
            )
            assert r.status_code == 200
            assert r.json()["is_locked"] is True
        finally:
            db.training_sessions.delete_one({"id": past_id})
            client.close()


class TestMyAttendance:
    def test_player_my_attendance(self, tokens):
        token, _ = tokens["player"]
        r = requests.get(f"{BASE_URL}/api/mobile/my-attendance", headers=_auth(token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_parent_my_attendance(self, tokens):
        token, _ = tokens["parent"]
        r = requests.get(f"{BASE_URL}/api/mobile/my-attendance", headers=_auth(token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/mobile/my-attendance", timeout=15)
        assert r.status_code == 401
