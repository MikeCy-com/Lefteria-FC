"""Financial Dashboard API routes - payment tracking, revenue, dues management."""
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")


def setup_financial_routes(db, get_current_user):
    """Setup routes with shared db and auth dependency."""

    # ==================== FINANCIAL RECORDS CRUD ====================
    @router.post("/admin/financial/records")
    async def create_financial_record(body: dict, current_user: dict = Depends(get_current_user)):
        record = {
            "id": str(uuid.uuid4()),
            "player_id": body.get("player_id"),
            "player_name": body.get("player_name", ""),
            "team_id": body.get("team_id"),
            "academy_group_id": body.get("academy_group_id"),
            "category": body.get("category", "subscription"),  # subscription, fee, equipment, other
            "description": body.get("description", ""),
            "amount": float(body.get("amount", 0)),
            "status": body.get("status", "pending"),  # pending, paid, overdue
            "due_date": body.get("due_date"),
            "paid_date": body.get("paid_date"),
            "payment_method": body.get("payment_method", ""),  # cash, bank, card
            "notes": body.get("notes", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get("id"),
        }
        await db.financial_records.insert_one(record)
        return {"id": record["id"], "message": "Record created"}

    @router.get("/admin/financial/records")
    async def get_financial_records(
        team_id: str = None,
        academy_group_id: str = None,
        player_id: str = None,
        status: str = None,
        category: str = None,
        current_user: dict = Depends(get_current_user),
    ):
        query = {}
        if team_id:
            query["team_id"] = team_id
        if academy_group_id:
            query["academy_group_id"] = academy_group_id
        if player_id:
            query["player_id"] = player_id
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        records = await db.financial_records.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
        return records

    @router.put("/admin/financial/records/{record_id}")
    async def update_financial_record(record_id: str, body: dict, current_user: dict = Depends(get_current_user)):
        update_data = {}
        for key in ["player_id", "player_name", "team_id", "academy_group_id", "category",
                     "description", "amount", "status", "due_date", "paid_date",
                     "payment_method", "notes"]:
            if key in body:
                update_data[key] = body[key]
        if "amount" in update_data:
            update_data["amount"] = float(update_data["amount"])
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.financial_records.update_one({"id": record_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"message": "Updated"}

    @router.delete("/admin/financial/records/{record_id}")
    async def delete_financial_record(record_id: str, current_user: dict = Depends(get_current_user)):
        result = await db.financial_records.delete_one({"id": record_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"message": "Deleted"}

    # ==================== MARK AS PAID ====================
    @router.put("/admin/financial/records/{record_id}/pay")
    async def mark_record_paid(record_id: str, body: dict, current_user: dict = Depends(get_current_user)):
        update = {
            "status": "paid",
            "paid_date": body.get("paid_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
            "payment_method": body.get("payment_method", "cash"),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await db.financial_records.update_one({"id": record_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"message": "Marked as paid"}

    # ==================== FINANCIAL STATS / DASHBOARD ====================
    @router.get("/admin/financial/stats")
    async def get_financial_stats(
        team_id: str = None,
        academy_group_id: str = None,
        current_user: dict = Depends(get_current_user),
    ):
        query = {}
        if team_id:
            query["team_id"] = team_id
        if academy_group_id:
            query["academy_group_id"] = academy_group_id

        all_records = await db.financial_records.find(query, {"_id": 0}).to_list(2000)

        total_revenue = sum(r["amount"] for r in all_records if r.get("status") == "paid")
        total_pending = sum(r["amount"] for r in all_records if r.get("status") == "pending")
        total_overdue = sum(r["amount"] for r in all_records if r.get("status") == "overdue")
        total_expected = total_revenue + total_pending + total_overdue

        # Monthly revenue for current year
        now = datetime.now(timezone.utc)
        monthly = {}
        for r in all_records:
            if r.get("status") == "paid" and r.get("paid_date"):
                try:
                    pd = r["paid_date"][:7]  # YYYY-MM
                    if pd.startswith(str(now.year)):
                        monthly[pd] = monthly.get(pd, 0) + r["amount"]
                except Exception:
                    pass

        monthly_data = []
        for m in range(1, 13):
            key = f"{now.year}-{m:02d}"
            monthly_data.append({"month": key, "revenue": monthly.get(key, 0)})

        # By category
        by_category = {}
        for r in all_records:
            cat = r.get("category", "other")
            by_category[cat] = by_category.get(cat, 0) + r["amount"]

        # Overdue records
        overdue_records = [r for r in all_records if r.get("status") == "overdue"]

        return {
            "total_revenue": total_revenue,
            "total_pending": total_pending,
            "total_overdue": total_overdue,
            "total_expected": total_expected,
            "record_count": len(all_records),
            "paid_count": len([r for r in all_records if r.get("status") == "paid"]),
            "pending_count": len([r for r in all_records if r.get("status") == "pending"]),
            "overdue_count": len(overdue_records),
            "monthly_revenue": monthly_data,
            "by_category": by_category,
            "overdue_records": overdue_records[:20],
        }

    # ==================== BULK GENERATE DUES ====================
    @router.post("/admin/financial/generate-dues")
    async def generate_monthly_dues(body: dict, current_user: dict = Depends(get_current_user)):
        """Generate payment records for a group of players (monthly subscription)."""
        player_ids = body.get("player_ids", [])
        amount = float(body.get("amount", 0))
        due_date = body.get("due_date")
        description = body.get("description", "Μηνιαία συνδρομή")
        category = body.get("category", "subscription")
        team_id = body.get("team_id")
        academy_group_id = body.get("academy_group_id")

        if not player_ids or not amount or not due_date:
            raise HTTPException(status_code=400, detail="player_ids, amount, due_date required")

        created = 0
        for pid in player_ids:
            player = await db.players.find_one({"id": pid}, {"_id": 0, "name": 1, "id": 1})
            if not player:
                continue
            record = {
                "id": str(uuid.uuid4()),
                "player_id": pid,
                "player_name": player.get("name", ""),
                "team_id": team_id,
                "academy_group_id": academy_group_id,
                "category": category,
                "description": description,
                "amount": amount,
                "status": "pending",
                "due_date": due_date,
                "paid_date": None,
                "payment_method": "",
                "notes": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": current_user.get("id"),
            }
            await db.financial_records.insert_one(record)
            created += 1

        return {"message": f"{created} records created", "count": created}

    return router
