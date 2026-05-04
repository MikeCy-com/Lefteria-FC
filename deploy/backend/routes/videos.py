"""Video Analytics API routes - video uploads, markers, player tagging."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime, timezone
from pathlib import Path
import uuid
import aiofiles

router = APIRouter(prefix="/api")

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
VIDEO_DIR = UPLOAD_DIR / "videos"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)


def setup_video_routes(db, get_current_user):
    """Setup routes with shared db and auth dependency."""

    # ==================== VIDEO CRUD ====================
    @router.post("/admin/videos")
    async def create_video(body: dict, current_user: dict = Depends(get_current_user)):
        video = {
            "id": str(uuid.uuid4()),
            "title": body.get("title", ""),
            "description": body.get("description", ""),
            "video_url": body.get("video_url", ""),  # External URL (YouTube, etc.) or uploaded
            "video_type": body.get("video_type", "match"),  # match, training, highlights, other
            "team_id": body.get("team_id"),
            "academy_group_id": body.get("academy_group_id"),
            "fixture_id": body.get("fixture_id"),
            "training_session_id": body.get("training_session_id"),
            "thumbnail_url": body.get("thumbnail_url", ""),
            "duration": body.get("duration", ""),  # e.g. "01:30:00"
            "markers": [],  # Will be added separately
            "tagged_players": body.get("tagged_players", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get("id"),
        }
        await db.videos.insert_one(video)
        return {"id": video["id"], "message": "Video created"}

    @router.get("/admin/videos")
    async def get_videos(
        team_id: str = None,
        academy_group_id: str = None,
        video_type: str = None,
        current_user: dict = Depends(get_current_user),
    ):
        query = {}
        if team_id:
            query["team_id"] = team_id
        if academy_group_id:
            query["academy_group_id"] = academy_group_id
        if video_type:
            query["video_type"] = video_type
        videos = await db.videos.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
        return videos

    @router.get("/admin/videos/{video_id}")
    async def get_video(video_id: str, current_user: dict = Depends(get_current_user)):
        video = await db.videos.find_one({"id": video_id}, {"_id": 0})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        return video

    @router.put("/admin/videos/{video_id}")
    async def update_video(video_id: str, body: dict, current_user: dict = Depends(get_current_user)):
        update_data = {}
        for key in ["title", "description", "video_url", "video_type", "team_id",
                     "academy_group_id", "fixture_id", "training_session_id",
                     "thumbnail_url", "duration", "tagged_players"]:
            if key in body:
                update_data[key] = body[key]
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.videos.update_one({"id": video_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        return {"message": "Updated"}

    @router.delete("/admin/videos/{video_id}")
    async def delete_video(video_id: str, current_user: dict = Depends(get_current_user)):
        result = await db.videos.delete_one({"id": video_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        return {"message": "Deleted"}

    # ==================== VIDEO UPLOAD (chunked) ====================
    @router.post("/admin/videos/upload")
    async def upload_video_file(
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
    ):
        allowed_ext = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
        ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in allowed_ext:
            raise HTTPException(status_code=400, detail=f"Unsupported format. Use: {', '.join(allowed_ext)}")

        file_id = str(uuid.uuid4())
        filename = f"{file_id}{ext}"
        filepath = VIDEO_DIR / filename

        async with aiofiles.open(filepath, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                await f.write(chunk)

        video_url = f"/api/uploads/videos/{filename}"
        return {"video_url": video_url, "filename": filename}

    # ==================== MARKERS / ANNOTATIONS ====================
    @router.post("/admin/videos/{video_id}/markers")
    async def add_marker(video_id: str, body: dict, current_user: dict = Depends(get_current_user)):
        marker = {
            "id": str(uuid.uuid4()),
            "timestamp": body.get("timestamp", "00:00:00"),  # HH:MM:SS
            "timestamp_seconds": body.get("timestamp_seconds", 0),
            "label": body.get("label", ""),
            "description": body.get("description", ""),
            "marker_type": body.get("marker_type", "note"),  # goal, assist, foul, tactical, note
            "tagged_players": body.get("tagged_players", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await db.videos.update_one(
            {"id": video_id},
            {"$push": {"markers": marker}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        return {"id": marker["id"], "message": "Marker added"}

    @router.delete("/admin/videos/{video_id}/markers/{marker_id}")
    async def delete_marker(video_id: str, marker_id: str, current_user: dict = Depends(get_current_user)):
        result = await db.videos.update_one(
            {"id": video_id},
            {"$pull": {"markers": {"id": marker_id}}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        return {"message": "Marker removed"}

    # ==================== PUBLIC VIDEO LIST ====================
    @router.get("/videos")
    async def public_get_videos(team_id: str = None, academy_group_id: str = None):
        query = {}
        if team_id:
            query["team_id"] = team_id
        if academy_group_id:
            query["academy_group_id"] = academy_group_id
        videos = await db.videos.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
        return videos

    return router
