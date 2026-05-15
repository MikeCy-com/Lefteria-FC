"""First Team trials registration — public submit + admin manage."""
from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid
import io
import csv

router = APIRouter(prefix="/api")

TRIAL_STATUSES = {"new", "contacted", "approved", "rejected"}


class TrialSubmission(BaseModel):
    full_name: str
    date_of_birth: str
    phone: str
    email: str
    position: str
    preferred_foot: str
    previous_club: Optional[str] = None
    years_played: Optional[str] = None
    height_cm: Optional[str] = None
    weight_kg: Optional[str] = None
    notes: Optional[str] = None


class TrialStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None


class TrialsSettings(BaseModel):
    open: bool = False
    headline: str = "Ετοιμος να Ξεκινησεις το Ταξιδι σου;"
    subtitle: str = "Γίνε μέλος της πρώτης ομάδας LEFTERIA FC και κάνε το πρώτο βήμα για να γίνεις επαγγελματίας ποδοσφαιριστής."
    button_text: str = "Δηλωσε Συμμετοχη για Δοκιμαστικα"
    closed_message: str = "Οι εγγραφές για δοκιμαστικά είναι προσωρινά κλειστές. Παρακαλούμε δοκιμάστε ξανά σύντομα."


_DEFAULT_SETTINGS = TrialsSettings().model_dump()


async def _get_settings(db):
    doc = await db.trials_settings.find_one({"_id": "singleton"}, {"_id": 0})
    if not doc:
        await db.trials_settings.insert_one({"_id": "singleton", **_DEFAULT_SETTINGS})
        return _DEFAULT_SETTINGS.copy()
    # Backfill any missing keys with defaults
    merged = {**_DEFAULT_SETTINGS, **doc}
    return merged


def setup_trials_routes(db, get_current_user):

    # ============ PUBLIC ============
    @router.get("/trials/settings")
    async def public_trials_settings():
        s = await _get_settings(db)
        return {
            "open": bool(s.get("open")),
            "headline": s.get("headline"),
            "subtitle": s.get("subtitle"),
            "button_text": s.get("button_text"),
            "closed_message": s.get("closed_message"),
        }

    @router.post("/trials/submit")
    async def submit_trial(payload: TrialSubmission):
        s = await _get_settings(db)
        if not s.get("open"):
            raise HTTPException(status_code=403, detail="Οι εγγραφές είναι κλειστές αυτή τη στιγμή.")
        doc = payload.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["status"] = "new"
        doc["admin_notes"] = None
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.trials.insert_one(doc)
        return {"ok": True, "id": doc["id"]}

    # ============ ADMIN ============
    @router.get("/admin/trials")
    async def list_trials(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
        query = {}
        if status and status in TRIAL_STATUSES:
            query["status"] = status
        cursor = db.trials.find(query, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=1000)

    @router.patch("/admin/trials/{trial_id}")
    async def update_trial(trial_id: str, payload: TrialStatusUpdate, current_user: dict = Depends(get_current_user)):
        if payload.status not in TRIAL_STATUSES:
            raise HTTPException(status_code=400, detail="Μη έγκυρη κατάσταση")
        update = {"status": payload.status}
        if payload.admin_notes is not None:
            update["admin_notes"] = payload.admin_notes
        result = await db.trials.update_one({"id": trial_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
        return {"ok": True}

    @router.delete("/admin/trials/{trial_id}")
    async def delete_trial(trial_id: str, current_user: dict = Depends(get_current_user)):
        result = await db.trials.delete_one({"id": trial_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
        return {"ok": True}

    @router.get("/admin/trials/export.csv")
    async def export_trials_csv(current_user: dict = Depends(get_current_user)):
        rows = await db.trials.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=10000)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            "Ημερομηνία", "Κατάσταση", "Ονοματεπώνυμο", "Ημ. Γέννησης",
            "Τηλέφωνο", "Email", "Θέση", "Πόδι", "Προηγούμενος Σύλλογος",
            "Χρόνια", "Ύψος (cm)", "Βάρος (kg)", "Σημειώσεις", "Σχόλια Admin",
        ])
        for r in rows:
            writer.writerow([
                r.get("created_at", ""), r.get("status", ""), r.get("full_name", ""),
                r.get("date_of_birth", ""), r.get("phone", ""), r.get("email", ""),
                r.get("position", ""), r.get("preferred_foot", ""),
                r.get("previous_club", ""), r.get("years_played", ""),
                r.get("height_cm", ""), r.get("weight_kg", ""),
                r.get("notes", ""), r.get("admin_notes", ""),
            ])
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=trials.csv"},
        )

    # ============ ADMIN SETTINGS ============
    @router.get("/admin/trials/settings")
    async def admin_get_settings(current_user: dict = Depends(get_current_user)):
        return await _get_settings(db)

    @router.put("/admin/trials/settings")
    async def admin_update_settings(payload: TrialsSettings, current_user: dict = Depends(get_current_user)):
        await db.trials_settings.update_one(
            {"_id": "singleton"},
            {"$set": payload.model_dump()},
            upsert=True,
        )
        return {"ok": True}
