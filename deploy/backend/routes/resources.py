"""Resource/Field Management API routes - venue booking, availability, conflict detection."""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")


def setup_resource_routes(db, get_current_user):
    """Setup routes with shared db and auth dependency."""

    # ==================== FIELDS / FACILITIES CRUD ====================
    @router.post("/admin/facilities")
    async def create_facility(body: dict, current_user: dict = Depends(get_current_user)):
        facility = {
            "id": str(uuid.uuid4()),
            "name": body.get("name", ""),
            "type": body.get("type", "field"),  # field, gym, pool, indoor, other
            "surface": body.get("surface", ""),  # grass, turf, indoor, clay
            "capacity": body.get("capacity", 0),
            "dimensions": body.get("dimensions", ""),  # e.g. "105x68m"
            "has_lighting": body.get("has_lighting", False),
            "has_changing_rooms": body.get("has_changing_rooms", False),
            "address": body.get("address", ""),
            "location_url": body.get("location_url", ""),
            "team_type": body.get("team_type", ""),
            "notes": body.get("notes", ""),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.facilities.insert_one(facility)
        return {"id": facility["id"], "message": "Facility created"}

    @router.get("/admin/facilities")
    async def get_facilities(team_type: str = None, current_user: dict = Depends(get_current_user)):
        query = {"is_active": True}
        if team_type:
            query["team_type"] = team_type
        facilities = await db.facilities.find(query, {"_id": 0}).sort("name", 1).to_list(100)
        return facilities

    @router.put("/admin/facilities/{facility_id}")
    async def update_facility(facility_id: str, body: dict, current_user: dict = Depends(get_current_user)):
        update_data = {}
        for key in ["name", "type", "surface", "capacity", "dimensions",
                     "has_lighting", "has_changing_rooms", "address", "location_url", "team_type", "notes", "is_active"]:
            if key in body:
                update_data[key] = body[key]
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.facilities.update_one({"id": facility_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Facility not found")
        return {"message": "Updated"}

    @router.delete("/admin/facilities/{facility_id}")
    async def delete_facility(facility_id: str, current_user: dict = Depends(get_current_user)):
        await db.facilities.update_one({"id": facility_id}, {"$set": {"is_active": False}})
        # Also delete future bookings for this facility
        return {"message": "Facility deactivated"}

    # ==================== BOOKINGS CRUD ====================
    @router.post("/admin/bookings")
    async def create_booking(body: dict, current_user: dict = Depends(get_current_user)):
        facility_id = body.get("facility_id")
        date = body.get("date")  # YYYY-MM-DD
        start_time = body.get("start_time")  # HH:MM
        end_time = body.get("end_time")  # HH:MM

        if not all([facility_id, date, start_time, end_time]):
            raise HTTPException(status_code=400, detail="facility_id, date, start_time, end_time required")

        # Conflict detection
        existing = await db.bookings.find({
            "facility_id": facility_id,
            "date": date,
            "status": {"$ne": "cancelled"},
        }, {"_id": 0}).to_list(100)

        for b in existing:
            if _times_overlap(start_time, end_time, b["start_time"], b["end_time"]):
                raise HTTPException(
                    status_code=409,
                    detail=f"Conflict with existing booking: {b.get('title', '')} ({b['start_time']}-{b['end_time']})"
                )

        booking = {
            "id": str(uuid.uuid4()),
            "facility_id": facility_id,
            "facility_name": body.get("facility_name", ""),
            "title": body.get("title", ""),
            "description": body.get("description", ""),
            "booking_type": body.get("booking_type", "training"),  # training, match, event, maintenance
            "team_id": body.get("team_id"),
            "academy_group_id": body.get("academy_group_id"),
            "team_name": body.get("team_name", ""),
            "date": date,
            "start_time": start_time,
            "end_time": end_time,
            "recurring": body.get("recurring", False),
            "recurring_until": body.get("recurring_until"),
            "status": "confirmed",  # confirmed, cancelled
            "notes": body.get("notes", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get("id"),
        }
        await db.bookings.insert_one(booking)

        # Handle recurring bookings
        if booking["recurring"] and booking.get("recurring_until"):
            await _create_recurring_bookings(db, booking, current_user)

        return {"id": booking["id"], "message": "Booking created"}

    @router.get("/admin/bookings")
    async def get_bookings(
        facility_id: str = None,
        date: str = None,
        month: str = None,
        team_id: str = None,
        academy_group_id: str = None,
        current_user: dict = Depends(get_current_user),
    ):
        query = {"status": {"$ne": "cancelled"}}
        if facility_id:
            query["facility_id"] = facility_id
        if date:
            query["date"] = date
        if month:
            query["date"] = {"$regex": f"^{month}"}
        if team_id:
            query["team_id"] = team_id
        if academy_group_id:
            query["academy_group_id"] = academy_group_id
        bookings = await db.bookings.find(query, {"_id": 0}).sort([("date", 1), ("start_time", 1)]).to_list(500)
        return bookings

    @router.put("/admin/bookings/{booking_id}")
    async def update_booking(booking_id: str, body: dict, current_user: dict = Depends(get_current_user)):
        update_data = {}
        for key in ["title", "description", "booking_type", "team_id", "academy_group_id",
                     "team_name", "date", "start_time", "end_time", "notes", "status"]:
            if key in body:
                update_data[key] = body[key]

        # Re-check conflict if time changed
        if any(k in body for k in ["date", "start_time", "end_time"]):
            booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
            if booking:
                new_date = body.get("date", booking["date"])
                new_start = body.get("start_time", booking["start_time"])
                new_end = body.get("end_time", booking["end_time"])
                fid = body.get("facility_id", booking["facility_id"])
                existing = await db.bookings.find({
                    "facility_id": fid,
                    "date": new_date,
                    "id": {"$ne": booking_id},
                    "status": {"$ne": "cancelled"},
                }, {"_id": 0}).to_list(100)
                for b in existing:
                    if _times_overlap(new_start, new_end, b["start_time"], b["end_time"]):
                        raise HTTPException(status_code=409, detail=f"Conflict: {b.get('title', '')} ({b['start_time']}-{b['end_time']})")

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Updated"}

    @router.delete("/admin/bookings/{booking_id}")
    async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
        result = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled"}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Booking cancelled"}

    # ==================== AVAILABILITY CHECK ====================
    @router.get("/admin/facilities/{facility_id}/availability")
    async def check_availability(facility_id: str, date: str, current_user: dict = Depends(get_current_user)):
        """Get all bookings for a facility on a given date, useful for availability view."""
        bookings = await db.bookings.find({
            "facility_id": facility_id,
            "date": date,
            "status": {"$ne": "cancelled"},
        }, {"_id": 0}).sort("start_time", 1).to_list(50)

        # Generate time slots (07:00 to 22:00 in 1h intervals)
        slots = []
        for h in range(7, 22):
            slot_start = f"{h:02d}:00"
            slot_end = f"{h + 1:02d}:00"
            occupied_by = None
            for b in bookings:
                if _times_overlap(slot_start, slot_end, b["start_time"], b["end_time"]):
                    occupied_by = b
                    break
            slots.append({
                "start": slot_start,
                "end": slot_end,
                "available": occupied_by is None,
                "booking": occupied_by,
            })

        return {"facility_id": facility_id, "date": date, "slots": slots}

    return router


def _times_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """Check if two time ranges overlap. Times in HH:MM format."""
    try:
        s1 = int(start1.replace(":", ""))
        e1 = int(end1.replace(":", ""))
        s2 = int(start2.replace(":", ""))
        e2 = int(end2.replace(":", ""))
        return s1 < e2 and s2 < e1
    except (ValueError, AttributeError):
        return False


async def _create_recurring_bookings(db, template: dict, current_user: dict):
    """Create weekly recurring bookings up to recurring_until date."""
    from datetime import timedelta
    try:
        start_date = datetime.strptime(template["date"], "%Y-%m-%d")
        end_date = datetime.strptime(template["recurring_until"], "%Y-%m-%d")
    except (ValueError, KeyError):
        return

    current = start_date + timedelta(weeks=1)
    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        # Check for conflicts
        existing = await db.bookings.find({
            "facility_id": template["facility_id"],
            "date": date_str,
            "status": {"$ne": "cancelled"},
        }, {"_id": 0}).to_list(100)

        has_conflict = any(
            _times_overlap(template["start_time"], template["end_time"], b["start_time"], b["end_time"])
            for b in existing
        )

        if not has_conflict:
            booking = {
                "id": str(uuid.uuid4()),
                "facility_id": template["facility_id"],
                "facility_name": template.get("facility_name", ""),
                "title": template["title"],
                "description": template.get("description", ""),
                "booking_type": template.get("booking_type", "training"),
                "team_id": template.get("team_id"),
                "academy_group_id": template.get("academy_group_id"),
                "team_name": template.get("team_name", ""),
                "date": date_str,
                "start_time": template["start_time"],
                "end_time": template["end_time"],
                "recurring": False,
                "parent_booking_id": template["id"],
                "status": "confirmed",
                "notes": template.get("notes", ""),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": current_user.get("id"),
            }
            await db.bookings.insert_one(booking)

        current += timedelta(weeks=1)
