"""Opponents management and bulk training session creation."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime, timezone, timedelta
import uuid
import aiofiles
from pathlib import Path

router = APIRouter(prefix="/api")

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def setup_opponents_routes(db, get_current_user):
    """Setup opponents and bulk training routes."""

    # ==================== OPPONENTS CRUD ====================
    @router.post("/admin/opponents")
    async def create_opponent(body: dict, current_user: dict = Depends(get_current_user)):
        opponent = {
            "id": str(uuid.uuid4()),
            "name": body.get("name", ""),
            "logo_url": body.get("logo_url", ""),
            "venue": body.get("venue", ""),
            "location": body.get("location", ""),
            "location_url": body.get("location_url", ""),
            "team_type": body.get("team_type", ""),
            "notes": body.get("notes", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.opponents.insert_one(opponent)
        return {"id": opponent["id"], "message": "Opponent created"}

    @router.get("/admin/opponents")
    async def get_opponents(team_type: str = None, current_user: dict = Depends(get_current_user)):
        query = {}
        if team_type:
            query["team_type"] = team_type
        opponents = await db.opponents.find(query, {"_id": 0}).sort("name", 1).to_list(200)
        return opponents

    @router.put("/admin/opponents/{opponent_id}")
    async def update_opponent(opponent_id: str, body: dict, current_user: dict = Depends(get_current_user)):
        update_data = {}
        for key in ["name", "logo_url", "venue", "location", "location_url", "team_type", "notes"]:
            if key in body:
                update_data[key] = body[key]
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.opponents.update_one({"id": opponent_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Opponent not found")
        return {"message": "Updated"}

    @router.delete("/admin/opponents/{opponent_id}")
    async def delete_opponent(opponent_id: str, current_user: dict = Depends(get_current_user)):
        result = await db.opponents.delete_one({"id": opponent_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Opponent not found")
        return {"message": "Deleted"}

    # ==================== OPPONENT LOGO UPLOAD ====================
    @router.post("/admin/opponents/upload-logo")
    async def upload_opponent_logo(
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
    ):
        ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ".png"
        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".svg"}:
            raise HTTPException(status_code=400, detail="Unsupported image format")
        file_id = str(uuid.uuid4())
        filename = f"opponent_{file_id}{ext}"
        filepath = UPLOAD_DIR / filename
        async with aiofiles.open(filepath, "wb") as f:
            content = await file.read()
            await f.write(content)
        return {"url": f"/api/uploads/{filename}"}

    # ==================== BULK TRAINING SESSIONS ====================
    @router.post("/admin/training-sessions/bulk")
    async def create_bulk_training_sessions(body: dict, current_user: dict = Depends(get_current_user)):
        """Create recurring training sessions for an entire season."""
        title = body.get("title", "Προπόνηση")
        days_of_week = body.get("days_of_week", [])  # [0=Mon, 1=Tue, ..., 6=Sun]
        start_time = body.get("start_time", "16:00")
        duration_minutes = int(body.get("duration_minutes", 60))
        intensity = body.get("intensity", "medium")
        season_start = body.get("season_start")  # YYYY-MM-DD
        season_end = body.get("season_end")  # YYYY-MM-DD
        team_id = body.get("team_id")
        academy_group_id = body.get("academy_group_id")
        tags = body.get("tags", [])
        notes = body.get("notes", "")
        exercises = body.get("exercises", [])
        venue = body.get("venue", "")
        venue_id = body.get("venue_id", "")
        location = body.get("location", "")
        location_url = body.get("location_url", "")
        arrival_time = body.get("arrival_time", "")

        if not days_of_week or not season_start or not season_end:
            raise HTTPException(status_code=400, detail="days_of_week, season_start, season_end required")

        try:
            start_date = datetime.strptime(season_start, "%Y-%m-%d")
            end_date = datetime.strptime(season_end, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

        if end_date <= start_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")

        # Map day names to weekday numbers (Monday=0 to Sunday=6)
        created = 0
        current = start_date
        while current <= end_date:
            weekday = current.weekday()  # 0=Mon, 6=Sun
            if weekday in days_of_week:
                date_str = current.strftime("%Y-%m-%d")
                day_names = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"]
                session = {
                    "id": str(uuid.uuid4()),
                    "title": f"{title} - {day_names[weekday]}",
                    "date": date_str,
                    "start_time": start_time,
                    "duration_minutes": duration_minutes,
                    "intensity": intensity,
                    "venue": venue,
                    "venue_id": venue_id,
                    "location": location,
                    "location_url": location_url,
                    "arrival_time": arrival_time,
                    "tags": tags,
                    "notes": notes,
                    "exercises": exercises,
                    "player_count": 0,
                    "team_id": team_id,
                    "academy_group_id": academy_group_id,
                    "is_bulk_created": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "created_by": current_user.get("id"),
                }
                await db.training_sessions.insert_one(session)
                created += 1
            current += timedelta(days=1)

        return {"message": f"{created} training sessions created", "count": created}

    # ==================== IMAGE UPLOAD (generic) ====================
    @router.post("/admin/upload-image")
    async def upload_image(
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
    ):
        ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ".png"
        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            raise HTTPException(status_code=400, detail="Unsupported image format")
        file_id = str(uuid.uuid4())
        filename = f"img_{file_id}{ext}"
        filepath = UPLOAD_DIR / filename
        async with aiofiles.open(filepath, "wb") as f:
            content = await file.read()
            await f.write(content)
        return {"url": f"/api/uploads/{filename}"}

    return router
