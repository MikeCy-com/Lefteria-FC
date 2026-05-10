"""Mobile OTP Authentication & Role-based API routes."""
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone, timedelta
import uuid
import random
import jwt
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret-key')
JWT_ALGORITHM = "HS256"

# Twilio config (when keys are provided)
TWILIO_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE = os.environ.get('TWILIO_PHONE_NUMBER', '')


def _send_sms(to_phone: str, message: str, db=None, role: str = None) -> bool:
    """Send SMS via Twilio. Reads credentials from db.club first, falls back to env."""
    sid = TWILIO_SID
    token = TWILIO_TOKEN
    from_number = TWILIO_PHONE
    sms_enabled_in_db = False
    # Try DB-stored settings (takes priority)
    if db is not None:
        try:
            import asyncio as _asyncio
            loop = _asyncio.get_event_loop()
            if loop.is_running():
                # Use the existing loop to fetch club settings synchronously via run_until_complete is not safe.
                # Instead the caller is expected to pass db; we read settings asynchronously externally.
                pass
        except Exception:
            pass
    if sid and token and from_number:
        try:
            from twilio.rest import Client
            client = Client(sid, token)
            client.messages.create(body=message, from_=from_number, to=to_phone)
            logger.info(f"SMS sent to {to_phone}")
            return True
        except Exception as e:
            logger.error(f"Twilio SMS error: {e}")
            return False
    else:
        logger.info(f"[SIMULATED SMS] To: {to_phone} | Message: {message}")
        return False  # Important: when not configured, return False so caller knows to expose otp_debug


async def _send_sms_async(db, to_phone: str, message: str, role: str = None) -> bool:
    """Async helper that reads Twilio creds from DB (with env fallback), then sends."""
    sid = TWILIO_SID
    token = TWILIO_TOKEN
    from_number = TWILIO_PHONE
    sms_enabled = bool(sid and token and from_number)

    try:
        club = await db.club.find_one({"id": "club-profile"}, {"_id": 0})
        if club:
            db_sid = club.get("twilio_account_sid")
            db_token = club.get("twilio_auth_token")
            db_from = club.get("twilio_from_number")
            db_first = club.get("twilio_first_team_from")
            db_acad = club.get("twilio_academy_from")
            if club.get("sms_enabled") and db_sid and db_token:
                sid = db_sid
                token = db_token
                # Choose from_number based on role if per-team override exists
                if role == "parent" and db_acad:
                    from_number = db_acad
                elif role in ("coach", "player", "management") and db_first:
                    from_number = db_first
                else:
                    from_number = db_from or from_number
                sms_enabled = bool(from_number)
    except Exception as e:
        logger.error(f"Reading Twilio settings from DB failed: {e}")

    if sms_enabled and sid and token and from_number:
        try:
            from twilio.rest import Client
            client = Client(sid, token)
            client.messages.create(body=message, from_=from_number, to=to_phone)
            logger.info(f"SMS sent to {to_phone}")
            return True
        except Exception as e:
            logger.error(f"Twilio SMS error: {e}")
            return False

    logger.info(f"[SIMULATED SMS] To: {to_phone} | Message: {message}")
    return False


def _create_mobile_token(user_id: str, role: str, phone: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "phone": phone,
        "type": "mobile_access",
        "exp": datetime.now(timezone.utc) + timedelta(days=90),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def setup_mobile_routes(db):
    """Setup mobile auth and data routes."""

    async def get_mobile_user(request: Request) -> dict:
        auth = request.headers.get("Authorization", "")
        token = auth[7:] if auth.startswith("Bearer ") else ""
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("type") != "mobile_access":
                raise HTTPException(status_code=401, detail="Invalid token type")
            user = await db.mobile_users.find_one({"id": payload["sub"]}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    # ==================== OTP REQUEST ====================
    @router.post("/mobile/auth/request-otp")
    async def request_otp(body: dict):
        phone = body.get("phone", "").strip()
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number required")

        # Normalize phone (add +357 for Cyprus if no prefix)
        if not phone.startswith("+"):
            if phone.startswith("00"):
                phone = "+" + phone[2:]
            else:
                phone = "+357" + phone.lstrip("0")

        # Generate 6-digit OTP
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        # Store OTP
        await db.mobile_otps.delete_many({"phone": phone})
        await db.mobile_otps.insert_one({
            "phone": phone,
            "code": otp_code,
            "expires_at": expires_at.isoformat(),
            "attempts": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        # Detect role
        role_info = await _detect_role(db, phone)

        # Send OTP via Twilio (DB-configured) or fall back to simulated
        message = f"ΛΕΥΤΕΡΙΑ FC: Ο κωδικός σας είναι {otp_code}. Λήγει σε 5 λεπτά."
        sent = await _send_sms_async(db, phone, message, role=role_info.get("role") if role_info else None)

        # Detect if SMS is "really" enabled (DB or env)
        club_settings = await db.club.find_one({"id": "club-profile"}, {"_id": 0}) or {}
        sms_actually_enabled = (
            sent
            or (club_settings.get("sms_enabled") and club_settings.get("twilio_account_sid") and club_settings.get("twilio_auth_token"))
            or (TWILIO_SID and TWILIO_TOKEN and TWILIO_PHONE)
        )

        response = {
            "message": "OTP sent" if sent else "OTP generated (SMS simulated)",
            "phone": phone,
            "role_detected": role_info["role"] if role_info else None,
            "expires_in": 300,
        }

        # Include OTP debug ONLY when SMS isn't actually enabled
        if not sms_actually_enabled:
            response["otp_debug"] = otp_code
            response["simulated"] = True

        return response

    # ==================== OTP VERIFY ====================
    @router.post("/mobile/auth/verify-otp")
    async def verify_otp(body: dict):
        phone = body.get("phone", "").strip()
        code = body.get("code", "").strip()

        if not phone or not code:
            raise HTTPException(status_code=400, detail="Phone and code required")

        # Normalize phone
        if not phone.startswith("+"):
            if phone.startswith("00"):
                phone = "+" + phone[2:]
            else:
                phone = "+357" + phone.lstrip("0")

        # Find OTP record
        otp_record = await db.mobile_otps.find_one({"phone": phone}, {"_id": 0})
        if not otp_record:
            raise HTTPException(status_code=400, detail="No OTP found for this number. Request a new one.")

        # Check expiry
        expires_at = datetime.fromisoformat(otp_record["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            await db.mobile_otps.delete_many({"phone": phone})
            raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

        # Check attempts
        if otp_record.get("attempts", 0) >= 5:
            await db.mobile_otps.delete_many({"phone": phone})
            raise HTTPException(status_code=429, detail="Too many attempts. Request a new OTP.")

        # Increment attempts
        await db.mobile_otps.update_one({"phone": phone}, {"$inc": {"attempts": 1}})

        # Verify code
        if otp_record["code"] != code:
            raise HTTPException(status_code=400, detail="Invalid code")

        # OTP valid — clean up
        await db.mobile_otps.delete_many({"phone": phone})

        # Detect role and find/create user
        role_info = await _detect_role(db, phone)

        if not role_info:
            raise HTTPException(status_code=404, detail="No account found for this phone number. Contact the academy.")

        # Find or create mobile user
        mobile_user = await db.mobile_users.find_one({"phone": phone}, {"_id": 0})
        if not mobile_user:
            mobile_user = {
                "id": str(uuid.uuid4()),
                "phone": phone,
                "role": role_info["role"],
                "name": role_info["name"],
                "linked_player_id": role_info.get("player_id"),
                "linked_player_ids": role_info.get("player_ids", []),
                "team_id": role_info.get("team_id"),
                "academy_group_ids": role_info.get("academy_group_ids", []),
                "avatar_url": role_info.get("avatar_url", ""),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat(),
            }
            await db.mobile_users.insert_one(mobile_user)
        else:
            # Update last login and sync role data
            update = {
                "last_login": datetime.now(timezone.utc).isoformat(),
                "role": role_info["role"],
                "name": role_info["name"],
                "linked_player_id": role_info.get("player_id"),
                "linked_player_ids": role_info.get("player_ids", []),
                "team_id": role_info.get("team_id"),
                "academy_group_ids": role_info.get("academy_group_ids", []),
            }
            await db.mobile_users.update_one({"phone": phone}, {"$set": update})
            mobile_user.update(update)

        # Remove _id if present
        mobile_user.pop("_id", None)

        token = _create_mobile_token(mobile_user["id"], mobile_user["role"], phone)

        return {
            "token": token,
            "user": {k: v for k, v in mobile_user.items() if k != "_id"},
            "role": mobile_user["role"],
        }

    # ==================== GET CURRENT USER ====================
    @router.get("/mobile/auth/me")
    async def get_mobile_me(user: dict = Depends(get_mobile_user)):
        # Refresh role data
        role_info = await _detect_role(db, user["phone"])
        if role_info:
            user["name"] = role_info["name"]
            user["role"] = role_info["role"]
        return user

    # ==================== PARENT DASHBOARD DATA ====================
    @router.get("/mobile/parent/dashboard")
    async def parent_dashboard(user: dict = Depends(get_mobile_user)):
        if user["role"] != "parent":
            raise HTTPException(status_code=403, detail="Not a parent account")

        player_ids = user.get("linked_player_ids", [])
        if user.get("linked_player_id"):
            player_ids = list(set(player_ids + [user["linked_player_id"]]))

        children = []
        for pid in player_ids:
            player = await db.players.find_one({"id": pid}, {"_id": 0})
            if player:
                children.append(player)

        # Get academy group info
        group_ids = set()
        for child in children:
            for gid in child.get("academy_group_ids", []):
                group_ids.add(gid)
            if child.get("academy_group_id"):
                group_ids.add(child["academy_group_id"])

        groups = []
        for gid in group_ids:
            g = await db.academy_groups.find_one({"id": gid}, {"_id": 0})
            if g:
                groups.append(g)

        # Recent fixtures for child's groups
        fixtures = []
        for gid in group_ids:
            fx = await db.fixtures.find({"academy_group_id": gid}, {"_id": 0}).sort("match_date", -1).to_list(10)
            fixtures.extend(fx)

        # Upcoming events
        now = datetime.now(timezone.utc).isoformat()[:10]
        events = await db.events.find({"date": {"$gte": now}}, {"_id": 0}).sort("date", 1).to_list(20)
        relevant_events = [e for e in events if not e.get("academy_group_id") or e.get("academy_group_id") in group_ids]

        # Also include training sessions as events
        for gid in group_ids:
            trainings = await db.training_sessions.find({"academy_group_id": gid, "date": {"$gte": now}}, {"_id": 0}).sort("date", 1).to_list(20)
            for t in trainings:
                relevant_events.append({
                    "id": t["id"],
                    "title": t.get("title", "Προπόνηση"),
                    "date": t.get("date", ""),
                    "start_time": t.get("start_time", ""),
                    "location": t.get("venue", ""),
                    "location_url": t.get("location_url", ""),
                    "arrival_time": t.get("arrival_time", ""),
                    "event_type": "training",
                    "type": "training",
                })
        # Add upcoming fixtures as events too
        for fx in fixtures:
            if fx.get("match_date", "") >= now:
                relevant_events.append({
                    "id": fx["id"],
                    "title": f"{fx.get('home_team', '')} vs {fx.get('away_team', '')}",
                    "date": fx.get("match_date", ""),
                    "start_time": fx.get("match_time", ""),
                    "location": fx.get("venue", ""),
                    "location_url": fx.get("location_url", ""),
                    "arrival_time": fx.get("arrival_time", ""),
                    "event_type": "match",
                    "type": "match",
                })
        relevant_events.sort(key=lambda e: e.get("date", ""))

        # Announcements
        posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)
        relevant_posts = [p for p in posts if not p.get("academy_group_id") or p.get("academy_group_id") in group_ids]

        # Financial records
        fin_records = []
        for pid in player_ids:
            recs = await db.financial_records.find({"player_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(20)
            fin_records.extend(recs)

        # Attendance stats from unified event_attendance
        attendance_data = []
        for pid in player_ids:
            att = await db.event_attendance.find({"player_id": pid, "status": "going"}, {"_id": 0}).to_list(500)
            total_att = await db.event_attendance.find({"player_id": pid}, {"_id": 0}).to_list(500)
            attendance_data.append({
                "player_id": pid,
                "attended": len(att),
                "total": len(total_att),
                "rate": round(len(att) / max(len(total_att), 1) * 100),
            })

        # Get all players in child's groups (for roster view)
        group_players = {}
        for gid in group_ids:
            gp = await db.players.find(
                {"$or": [{"academy_group_ids": gid}, {"academy_group_id": gid}]},
                {"_id": 0}
            ).to_list(100)
            group_players[gid] = gp

        # Get training sessions for groups (fallback to all if none found)
        training_sessions = []
        if group_ids:
            for gid in group_ids:
                ts = await db.training_sessions.find(
                    {"academy_group_id": gid, "date": {"$gte": now}},
                    {"_id": 0}
                ).sort("date", 1).to_list(20)
                training_sessions.extend(ts)
        if not training_sessions:
            # Fallback: return recent training sessions regardless of group
            training_sessions = await db.training_sessions.find(
                {}, {"_id": 0}
            ).sort("date", -1).to_list(20)

        return {
            "children": children,
            "groups": groups,
            "group_players": group_players,
            "fixtures": fixtures[:20],
            "training_sessions": training_sessions[:20],
            "events": relevant_events[:20],
            "announcements": relevant_posts[:10],
            "financial_records": fin_records,
            "attendance": attendance_data,
        }

    # ==================== COACH DASHBOARD DATA ====================
    @router.get("/mobile/coach/dashboard")
    async def coach_dashboard(user: dict = Depends(get_mobile_user)):
        if user["role"] != "coach":
            raise HTTPException(status_code=403, detail="Not a coach account")

        # Get all teams and groups
        teams = await db.teams.find({}, {"_id": 0}).to_list(50)
        groups = await db.academy_groups.find({}, {"_id": 0}).to_list(50)

        # All players
        players = await db.players.find({}, {"_id": 0}).to_list(500)

        # Upcoming fixtures
        now = datetime.now(timezone.utc).isoformat()[:10]
        fixtures = await db.fixtures.find({}, {"_id": 0}).sort("match_date", -1).to_list(20)

        # Upcoming events
        events = await db.events.find({"date": {"$gte": now}}, {"_id": 0}).sort("date", 1).to_list(20)

        # Recent posts
        posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

        # Training sessions
        sessions = await db.training_sessions.find({}, {"_id": 0}).sort("date", -1).to_list(20)

        return {
            "teams": teams,
            "groups": groups,
            "players": players,
            "fixtures": fixtures,
            "events": events[:10],
            "announcements": posts,
            "training_sessions": sessions,
        }

    # ==================== PLAYER DASHBOARD DATA ====================
    @router.get("/mobile/player/dashboard")
    async def player_dashboard(user: dict = Depends(get_mobile_user)):
        if user["role"] != "player":
            raise HTTPException(status_code=403, detail="Not a player account")

        player_id = user.get("linked_player_id")
        player = None
        if player_id:
            player = await db.players.find_one({"id": player_id}, {"_id": 0})

        group_ids = set()
        if player:
            for gid in player.get("academy_group_ids", []):
                group_ids.add(gid)
            if player.get("academy_group_id"):
                group_ids.add(player["academy_group_id"])

        # Fixtures with my stats
        fixtures = []
        for gid in group_ids:
            fx = await db.fixtures.find({"academy_group_id": gid}, {"_id": 0}).sort("match_date", -1).to_list(20)
            fixtures.extend(fx)

        # Extract my stats from fixtures
        my_stats = {"goals": 0, "assists": 0, "appearances": 0, "minutes": 0}
        for f in fixtures:
            for pp in f.get("player_performances", []):
                if pp.get("player_id") == player_id:
                    my_stats["goals"] += pp.get("goals", 0)
                    my_stats["assists"] += pp.get("assists", 0)
                    my_stats["minutes"] += pp.get("minutes", 0)
                    my_stats["appearances"] += 1

        # Events
        now = datetime.now(timezone.utc).isoformat()[:10]
        events = await db.events.find({"date": {"$gte": now}}, {"_id": 0}).sort("date", 1).to_list(20)
        relevant_events = [e for e in events if not e.get("academy_group_id") or e.get("academy_group_id") in group_ids]

        # Training sessions for the player's groups
        training_query = {"academy_group_id": {"$in": list(group_ids)}} if group_ids else {}
        training_sessions = await db.training_sessions.find(training_query, {"_id": 0}).sort("date", -1).to_list(20)

        # Announcements
        posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

        # Development plans
        dev_plans = []
        if player_id:
            dev_plans = await db.player_development.find({"player_id": player_id}, {"_id": 0}).to_list(20)

        # Evaluations
        evaluations = []
        if player_id:
            evaluations = await db.player_evaluations.find({"player_id": player_id}, {"_id": 0}).to_list(20)

        return {
            "player": player,
            "stats": my_stats,
            "fixtures": fixtures[:10],
            "events": relevant_events[:10],
            "announcements": posts[:10],
            "development_plans": dev_plans,
            "evaluations": evaluations,
            "training_sessions": training_sessions,
        }

    # ==================== MANAGEMENT DASHBOARD DATA ====================
    @router.get("/mobile/management/dashboard")
    async def management_dashboard(user: dict = Depends(get_mobile_user)):
        if user["role"] != "management":
            raise HTTPException(status_code=403, detail="Not a management account")

        teams = await db.teams.find({}, {"_id": 0}).to_list(50)
        groups = await db.academy_groups.find({}, {"_id": 0}).to_list(50)
        players = await db.players.find({}, {"_id": 0}).to_list(500)

        # Financial summary
        fin_records = await db.financial_records.find({}, {"_id": 0}).to_list(2000)
        total_revenue = sum(r["amount"] for r in fin_records if r.get("status") == "paid")
        total_pending = sum(r["amount"] for r in fin_records if r.get("status") == "pending")
        total_overdue = sum(r["amount"] for r in fin_records if r.get("status") == "overdue")

        # Recent registrations
        registrations = await db.registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

        # Announcements
        posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

        # Events
        now = datetime.now(timezone.utc).isoformat()[:10]
        events = await db.events.find({"date": {"$gte": now}}, {"_id": 0}).sort("date", 1).to_list(20)

        # Training sessions
        sessions = await db.training_sessions.find({}, {"_id": 0}).sort("date", -1).to_list(20)

        return {
            "teams": teams,
            "groups": groups,
            "player_count": len(players),
            "financial": {
                "total_revenue": total_revenue,
                "total_pending": total_pending,
                "total_overdue": total_overdue,
            },
            "registrations": registrations,
            "announcements": posts,
            "events": events[:10],
            "training_sessions": sessions,
        }

    # ==================== SUBMIT AVAILABILITY ====================
    @router.post("/mobile/availability")
    async def submit_availability(body: dict, user: dict = Depends(get_mobile_user)):
        event_id = body.get("event_id")
        status = body.get("status", "going")  # going, not_going, maybe

        if not event_id:
            raise HTTPException(status_code=400, detail="event_id required")

        player_id = user.get("linked_player_id")
        if not player_id and user["role"] == "parent":
            player_id = body.get("player_id")

        if not player_id:
            raise HTTPException(status_code=400, detail="No linked player")

        # Upsert availability
        await db.availability.update_one(
            {"event_id": event_id, "player_id": player_id},
            {"$set": {
                "event_id": event_id,
                "player_id": player_id,
                "user_id": user["id"],
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True
        )

        # Also sync to event_attendance for admin visibility
        player_doc = await db.players.find_one({"id": player_id}, {"_id": 0, "name": 1})
        await db.event_attendance.update_one(
            {"event_id": event_id, "player_id": player_id},
            {"$set": {
                "event_id": event_id,
                "player_id": player_id,
                "player_name": player_doc.get("name", "") if player_doc else "",
                "status": status,
                "marked_at": datetime.now(timezone.utc).isoformat(),
                "marked_by": f"mobile:{user['role']}",
                "source": "mobile",
            }},
            upsert=True
        )

        return {"message": "Availability submitted", "status": status}

    # ==================== ATTENDANCE TRACKING ====================
    @router.post("/mobile/attendance/mark")
    async def mark_attendance(body: dict, user: dict = Depends(get_mobile_user)):
        """Mark player attendance (present/absent) for an event/training/match.
        All roles can mark. Locked after event date passes."""
        event_id = body.get("event_id")
        player_id = body.get("player_id")
        status = body.get("status")  # "present" or "absent"
        event_type = body.get("event_type", "event")  # "event", "training", "match"

        if not event_id or not status:
            raise HTTPException(status_code=400, detail="event_id and status required")
        if status not in ("present", "absent"):
            raise HTTPException(status_code=400, detail="status must be 'present' or 'absent'")

        # Determine the event date for lock check
        event_date = None
        if event_type == "match":
            fixture = await db.fixtures.find_one({"id": event_id}, {"_id": 0, "match_date": 1})
            if fixture:
                event_date = fixture.get("match_date", "")
        elif event_type == "training":
            session = await db.training_sessions.find_one({"id": event_id}, {"_id": 0, "date": 1})
            if session:
                event_date = session.get("date", "")
        else:
            event = await db.events.find_one({"id": event_id}, {"_id": 0, "date": 1})
            if event:
                event_date = event.get("date", "")

        # Lock check: cannot change after event date
        if event_date:
            date_str = event_date[:10] if len(event_date) >= 10 else event_date
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if date_str < today:
                raise HTTPException(status_code=403, detail="Attendance locked - event has passed")

        # Resolve player_id based on role
        role = user["role"]
        if role == "player":
            player_id = user.get("linked_player_id")
            if not player_id:
                raise HTTPException(status_code=400, detail="No linked player")
        elif role == "parent":
            if not player_id:
                player_id = user.get("linked_player_id")
            # Verify parent owns this child
            children_ids = list(user.get("linked_player_ids", []))
            if user.get("linked_player_id") and user["linked_player_id"] not in children_ids:
                children_ids.append(user["linked_player_id"])
            if player_id not in children_ids:
                raise HTTPException(status_code=403, detail="Not your child")
        elif role in ("coach", "management"):
            if not player_id:
                raise HTTPException(status_code=400, detail="player_id required for coach/management")
        else:
            raise HTTPException(status_code=403, detail="Invalid role")

        # Get player name
        player_doc = await db.players.find_one({"id": player_id}, {"_id": 0, "name": 1})
        player_name = player_doc.get("name", "") if player_doc else ""

        # Upsert attendance record
        await db.attendance.update_one(
            {"event_id": event_id, "player_id": player_id},
            {"$set": {
                "event_id": event_id,
                "player_id": player_id,
                "player_name": player_name,
                "status": status,
                "event_type": event_type,
                "marked_by_user_id": user["id"],
                "marked_by_role": role,
                "marked_by_name": user.get("name", ""),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True
        )

        return {"message": "Attendance marked", "status": status, "player_id": player_id}

    @router.get("/mobile/attendance/{event_id}")
    async def get_event_attendance_mobile(event_id: str, event_type: str = "event", user: dict = Depends(get_mobile_user)):
        """Get attendance records for an event + roster of eligible players."""
        # Get attendance records
        records = await db.attendance.find({"event_id": event_id}, {"_id": 0}).to_list(200)
        att_map = {r["player_id"]: r for r in records}

        # Determine the event's group to get roster
        group_id = None
        event_date = None
        if event_type == "match":
            fixture = await db.fixtures.find_one({"id": event_id}, {"_id": 0})
            if fixture:
                group_id = fixture.get("academy_group_id")
                event_date = fixture.get("match_date", "")
        elif event_type == "training":
            session = await db.training_sessions.find_one({"id": event_id}, {"_id": 0})
            if session:
                group_id = session.get("academy_group_id")
                event_date = session.get("date", "")
        else:
            event = await db.events.find_one({"id": event_id}, {"_id": 0})
            if event:
                group_id = event.get("academy_group_id")
                event_date = event.get("date", "")

        # Check if locked
        is_locked = False
        if event_date:
            date_str = event_date[:10] if len(event_date) >= 10 else event_date
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if date_str < today:
                is_locked = True

        # Get roster for group
        roster = []
        if group_id:
            players = await db.players.find(
                {"$or": [
                    {"academy_group_id": group_id},
                    {"academy_group_ids": group_id}
                ]},
                {"_id": 0, "id": 1, "name": 1, "number": 1, "position": 1, "image_url": 1}
            ).to_list(100)
            # Fallback: if no players in group, load all for coach/management
            if not players and user["role"] in ("coach", "management"):
                players = await db.players.find(
                    {},
                    {"_id": 0, "id": 1, "name": 1, "number": 1, "position": 1, "image_url": 1}
                ).to_list(200)
            for p in players:
                att = att_map.get(p["id"])
                roster.append({
                    **p,
                    "attendance_status": att["status"] if att else None,
                    "marked_by": att.get("marked_by_role") if att else None,
                })
        elif user["role"] in ("coach", "management"):
            players = await db.players.find(
                {},
                {"_id": 0, "id": 1, "name": 1, "number": 1, "position": 1, "image_url": 1}
            ).to_list(200)
            for p in players:
                att = att_map.get(p["id"])
                roster.append({
                    **p,
                    "attendance_status": att["status"] if att else None,
                    "marked_by": att.get("marked_by_role") if att else None,
                })

        # For player/parent: ensure their own player(s) are in the roster
        if user["role"] == "player" and user.get("linked_player_id"):
            pid = user["linked_player_id"]
            if not any(r["id"] == pid for r in roster):
                p = await db.players.find_one({"id": pid}, {"_id": 0, "id": 1, "name": 1, "number": 1, "position": 1, "image_url": 1})
                if p:
                    att = att_map.get(pid)
                    roster.append({**p, "attendance_status": att["status"] if att else None, "marked_by": att.get("marked_by_role") if att else None})
        elif user["role"] == "parent":
            parent_player_ids = list(user.get("linked_player_ids", []))
            if user.get("linked_player_id") and user["linked_player_id"] not in parent_player_ids:
                parent_player_ids.append(user["linked_player_id"])
            for pid in parent_player_ids:
                if not any(r["id"] == pid for r in roster):
                    p = await db.players.find_one({"id": pid}, {"_id": 0, "id": 1, "name": 1, "number": 1, "position": 1, "image_url": 1})
                    if p:
                        att = att_map.get(pid)
                        roster.append({**p, "attendance_status": att["status"] if att else None, "marked_by": att.get("marked_by_role") if att else None})

        present_count = sum(1 for r in roster if r.get("attendance_status") == "present")
        absent_count = sum(1 for r in roster if r.get("attendance_status") == "absent")

        return {
            "event_id": event_id,
            "roster": roster,
            "records": records,
            "is_locked": is_locked,
            "summary": {
                "total": len(roster),
                "present": present_count,
                "absent": absent_count,
                "unmarked": len(roster) - present_count - absent_count,
            }
        }

    @router.get("/mobile/my-attendance")
    async def get_my_attendance(user: dict = Depends(get_mobile_user)):
        """Get attendance history for current user's linked players."""
        player_ids = []
        if user.get("linked_player_id"):
            player_ids.append(user["linked_player_id"])
        if user["role"] == "parent" and user.get("linked_player_ids"):
            player_ids.extend(user["linked_player_ids"])
        if not player_ids:
            return []
        records = await db.attendance.find(
            {"player_id": {"$in": player_ids}},
            {"_id": 0}
        ).sort("updated_at", -1).to_list(200)
        return records

    # ==================== GET AVAILABILITY FOR EVENT ====================
    @router.get("/mobile/availability/{event_id}")
    async def get_availability(event_id: str, user: dict = Depends(get_mobile_user)):
        avails = await db.availability.find({"event_id": event_id}, {"_id": 0}).to_list(100)
        return avails

    @router.get("/mobile/my-availability")
    async def get_my_availability(user: dict = Depends(get_mobile_user)):
        """Get all availability responses for the current user's linked players."""
        player_ids = []
        if user.get("linked_player_id"):
            player_ids.append(user["linked_player_id"])
        if user["role"] == "parent" and user.get("linked_player_ids"):
            player_ids.extend(user["linked_player_ids"])
        if not player_ids:
            return []
        avails = await db.availability.find({"player_id": {"$in": player_ids}}, {"_id": 0}).to_list(500)
        return avails

    # ==================== PROFILE UPDATE ====================
    @router.put("/mobile/profile")
    async def update_mobile_profile(body: dict, user: dict = Depends(get_mobile_user)):
        """Update mobile user profile (name, email). Phone is locked."""
        allowed_fields = {"name", "email"}
        update = {k: v for k, v in body.items() if k in allowed_fields and v is not None}
        if not update:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.mobile_users.update_one({"id": user["id"]}, {"$set": update})
        updated = await db.mobile_users.find_one({"id": user["id"]}, {"_id": 0})
        return updated

    # ==================== AVATAR UPLOAD ====================
    @router.post("/mobile/profile/avatar")
    async def upload_mobile_avatar(request: Request, user: dict = Depends(get_mobile_user)):
        """Upload avatar for mobile user profile."""
        from fastapi import UploadFile
        import shutil

        form = await request.form()
        file = form.get("file")
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")

        # Save file
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"mobile_avatar_{user['id']}.{ext}"
        upload_dir = "/app/backend/uploads/avatars"
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)

        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)

        avatar_url = f"/api/uploads/avatars/{filename}"
        await db.mobile_users.update_one(
            {"id": user["id"]},
            {"$set": {"avatar_url": avatar_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"avatar_url": avatar_url}

    # ==================== CHAT SYSTEM ====================
    @router.get("/mobile/conversations")
    async def get_conversations(user: dict = Depends(get_mobile_user)):
        """Get all conversations for the current user."""
        convos = await db.conversations.find(
            {"participants": user["id"]},
            {"_id": 0}
        ).sort("updated_at", -1).to_list(50)

        # Enrich with last message and unread count
        for c in convos:
            last_msg = await db.chat_messages.find_one(
                {"conversation_id": c["id"]},
                {"_id": 0},
                sort=[("created_at", -1)]
            )
            c["last_message"] = last_msg
            # Get other participant info for private chats
            if c.get("type") == "private":
                other_id = next((p for p in c["participants"] if p != user["id"]), None)
                if other_id:
                    other_user = await db.mobile_users.find_one({"id": other_id}, {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "role": 1})
                    c["other_user"] = other_user

        return convos

    @router.get("/mobile/conversations/{conversation_id}/messages")
    async def get_messages(conversation_id: str, limit: int = 50, before: str = None, user: dict = Depends(get_mobile_user)):
        """Get messages for a conversation."""
        convo = await db.conversations.find_one({"id": conversation_id, "participants": user["id"]})
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")

        query = {"conversation_id": conversation_id}
        if before:
            query["created_at"] = {"$lt": before}

        messages = await db.chat_messages.find(
            query, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)

        return list(reversed(messages))

    @router.post("/mobile/conversations/{conversation_id}/messages")
    async def send_message(conversation_id: str, body: dict, user: dict = Depends(get_mobile_user)):
        """Send a message in a conversation."""
        convo = await db.conversations.find_one({"id": conversation_id, "participants": user["id"]})
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")

        content = body.get("content", "").strip()
        if not content:
            raise HTTPException(status_code=400, detail="Message content required")

        msg = {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "sender_id": user["id"],
            "sender_name": user.get("name", ""),
            "sender_avatar": user.get("avatar_url", ""),
            "content": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.chat_messages.insert_one(msg)
        await db.conversations.update_one(
            {"id": conversation_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        msg.pop("_id", None)
        return msg

    @router.post("/mobile/conversations")
    async def create_conversation(body: dict, user: dict = Depends(get_mobile_user)):
        """Create a new private conversation or get existing one."""
        other_user_id = body.get("other_user_id")
        conv_type = body.get("type", "private")

        if conv_type == "private" and other_user_id:
            # Check if conversation already exists
            existing = await db.conversations.find_one({
                "type": "private",
                "participants": {"$all": [user["id"], other_user_id]}
            }, {"_id": 0})
            if existing:
                return existing

            convo = {
                "id": str(uuid.uuid4()),
                "type": "private",
                "participants": [user["id"], other_user_id],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.conversations.insert_one(convo)
            convo.pop("_id", None)
            return convo

        raise HTTPException(status_code=400, detail="Invalid conversation request")

    @router.post("/mobile/team-chat/{group_id}")
    async def get_or_create_team_chat(group_id: str, user: dict = Depends(get_mobile_user)):
        """Get or create team chat for an academy group."""
        existing = await db.conversations.find_one(
            {"type": "team", "group_id": group_id},
            {"_id": 0}
        )
        if existing:
            # Add user to participants if not already
            if user["id"] not in existing.get("participants", []):
                await db.conversations.update_one(
                    {"id": existing["id"]},
                    {"$addToSet": {"participants": user["id"]}}
                )
            return existing

        # Get group info
        group = await db.academy_groups.find_one({"id": group_id}, {"_id": 0})
        convo = {
            "id": str(uuid.uuid4()),
            "type": "team",
            "group_id": group_id,
            "group_name": group.get("name", "") if group else "",
            "participants": [user["id"]],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.conversations.insert_one(convo)
        convo.pop("_id", None)
        return convo

    @router.get("/mobile/team-members/{group_id}")
    async def get_team_members(group_id: str, user: dict = Depends(get_mobile_user)):
        """Get all parents/coaches linked to a group for private messaging."""
        # Get all players in group
        players = await db.players.find(
            {"$or": [{"academy_group_ids": group_id}, {"academy_group_id": group_id}]},
            {"_id": 0}
        ).to_list(100)

        # Get all mobile users who are parents of these players or coaches
        player_ids = [p["id"] for p in players]
        mobile_users = await db.mobile_users.find(
            {"$or": [
                {"linked_player_ids": {"$in": player_ids}},
                {"linked_player_id": {"$in": player_ids}},
                {"role": {"$in": ["coach", "management"]}}
            ]},
            {"_id": 0, "id": 1, "name": 1, "role": 1, "avatar_url": 1, "phone": 1}
        ).to_list(100)

        # Also get staff for the group
        staff = await db.staff.find(
            {"$or": [{"academy_group_id": group_id}, {"team_type": "academy"}]},
            {"_id": 0}
        ).to_list(20)

        return {"members": mobile_users, "staff": staff, "players": players}



    # ==================== ROLE DETECTION HELPER ====================
    async def _detect_role(db, phone: str):
        """Detect user role based on phone number in the system."""
        # Extract just the digits for matching
        digits = ''.join(c for c in phone if c.isdigit())
        # Use last 8 digits for flexible matching
        suffix = digits[-8:] if len(digits) >= 8 else digits

        # 1. Check parents (by parent_phone in players)
        all_players = await db.players.find({}, {"_id": 0}).to_list(500)
        parent_players = [p for p in all_players if _phone_match(p.get("parent_phone", ""), suffix)]

        if parent_players:
            player_ids = [p["id"] for p in parent_players]
            group_ids = []
            for p in parent_players:
                group_ids.extend(p.get("academy_group_ids", []))
                if p.get("academy_group_id"):
                    group_ids.append(p["academy_group_id"])
            return {
                "role": "parent",
                "name": parent_players[0].get("parent_name", "Γονέας"),
                "player_id": parent_players[0]["id"],
                "player_ids": player_ids,
                "academy_group_ids": list(set(group_ids)),
            }

        # 2. Check staff (coaches) — match by phone in staff collection
        all_staff = await db.staff.find({}, {"_id": 0}).to_list(100)
        staff_member = next((s for s in all_staff if _phone_match(s.get("phone", ""), suffix)), None)
        if staff_member:
            return {
                "role": "coach",
                "name": staff_member.get("name", "Προπονητής"),
                "team_id": staff_member.get("team_id"),
                "avatar_url": staff_member.get("image_url", ""),
            }

        # 3. Check admin users (management)
        all_admins = await db.admin_users.find({}, {"_id": 0}).to_list(20)
        admin = next((a for a in all_admins if _phone_match(a.get("phone", ""), suffix)), None)
        if admin:
            return {
                "role": "management",
                "name": admin.get("username", "Διοίκηση"),
            }

        # 4. Check players directly (player with own phone)
        player = next((p for p in all_players if _phone_match(p.get("phone", ""), suffix)), None)
        if player:
            group_ids = player.get("academy_group_ids", [])
            if player.get("academy_group_id"):
                group_ids.append(player["academy_group_id"])
            return {
                "role": "player",
                "name": player.get("name", "Παίκτης"),
                "player_id": player["id"],
                "academy_group_ids": list(set(group_ids)),
                "avatar_url": player.get("image_url", ""),
            }

        # 5. Check registrations (parents who registered)
        all_regs = await db.registrations.find({}, {"_id": 0}).to_list(200)
        registration = next((r for r in all_regs if _phone_match(r.get("parent_mobile", ""), suffix)), None)
        if registration:
            return {
                "role": "parent",
                "name": registration.get("parent_name", "Γονέας"),
                "player_ids": [],
                "academy_group_ids": [registration.get("academy_group_id")] if registration.get("academy_group_id") else [],
            }

        return None

    return router


def _phone_match(stored: str, suffix: str) -> bool:
    """Match phone by comparing last N digits, ignoring spaces/dashes."""
    if not stored or not suffix:
        return False
    stored_digits = ''.join(c for c in stored if c.isdigit())
    return stored_digits.endswith(suffix)
