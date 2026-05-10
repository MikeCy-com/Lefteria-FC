"""Charges / billing endpoints — admin CRUD + bulk monthly + parent fetch."""
from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from datetime import datetime, timezone
from calendar import monthrange
import uuid

from models import Charge, ChargeCreate, ChargeBulkMonthly, ChargePaymentBody, ChargeTemplate, ChargeTemplateCreate

router = APIRouter(prefix="/api")


def _month_iter(from_ym: str, to_ym: str):
    GR_MONTHS = ["", "Ιανουαριος", "Φεβρουαριος", "Μαρτιος", "Απριλιος", "Μαϊος", "Ιουνιος",
                 "Ιουλιος", "Αυγουστος", "Σεπτεμβριος", "Οκτωβριος", "Νοεμβριος", "Δεκεμβριος"]
    fy, fm = int(from_ym.split("-")[0]), int(from_ym.split("-")[1])
    ty, tm = int(to_ym.split("-")[0]), int(to_ym.split("-")[1])
    y, m = fy, fm
    while (y, m) <= (ty, tm):
        yield y, m, f"{GR_MONTHS[m]} {y}"
        m += 1
        if m > 12:
            m = 1
            y += 1


def setup_charges_routes(db, get_current_user):

    # ============ ADMIN CRUD ============
    @router.post("/admin/charges")
    async def create_charge(payload: ChargeCreate, current_user: dict = Depends(get_current_user)):
        player = await db.players.find_one({"id": payload.player_id}, {"_id": 0})
        if not player:
            raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
        doc = Charge(
            player_id=payload.player_id,
            player_name=player.get("name"),
            type=payload.type,
            description=payload.description,
            amount=payload.amount,
            currency=payload.currency,
            due_date=payload.due_date,
            season=payload.season,
            period_label=payload.period_label,
            notes=payload.notes,
            created_by=current_user.get("username"),
        ).model_dump()
        await db.charges.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @router.get("/admin/charges")
    async def list_charges(
        player_id: Optional[str] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
        season: Optional[str] = None,
        current_user: dict = Depends(get_current_user),
    ):
        query = {}
        if player_id: query["player_id"] = player_id
        if status: query["status"] = status
        if type: query["type"] = type
        if season: query["season"] = season
        return await db.charges.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=None)

    @router.get("/admin/charges/summary")
    async def charges_summary(current_user: dict = Depends(get_current_user)):
        pipeline = [{"$group": {"_id": "$status", "total_amount": {"$sum": "$amount"}, "count": {"$sum": 1}}}]
        by_status = await db.charges.aggregate(pipeline).to_list(length=None)
        return {
            "pending_total": round(sum(s["total_amount"] for s in by_status if s["_id"] == "pending"), 2),
            "paid_total": round(sum(s["total_amount"] for s in by_status if s["_id"] == "paid"), 2),
            "overdue_total": round(sum(s["total_amount"] for s in by_status if s["_id"] == "overdue"), 2),
            "by_status": [{"status": s["_id"], "total": round(s["total_amount"], 2), "count": s["count"]} for s in by_status],
        }

    @router.put("/admin/charges/{charge_id}")
    async def update_charge(charge_id: str, payload: dict = Body(...), current_user: dict = Depends(get_current_user)):
        payload.pop("id", None); payload.pop("_id", None)
        res = await db.charges.update_one({"id": charge_id}, {"$set": payload})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
        return {"updated": True}

    @router.delete("/admin/charges/{charge_id}")
    async def delete_charge(charge_id: str, current_user: dict = Depends(get_current_user)):
        res = await db.charges.delete_one({"id": charge_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
        return {"deleted": True}

    @router.post("/admin/charges/{charge_id}/mark-paid")
    async def mark_paid(charge_id: str, payload: ChargePaymentBody, current_user: dict = Depends(get_current_user)):
        charge = await db.charges.find_one({"id": charge_id}, {"_id": 0})
        if not charge:
            raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
        update = {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "paid_amount": payload.paid_amount if payload.paid_amount is not None else charge.get("amount"),
            "payment_method": payload.payment_method or "cash",
        }
        if payload.notes:
            update["notes"] = (charge.get("notes") or "") + ("\n" if charge.get("notes") else "") + payload.notes
        await db.charges.update_one({"id": charge_id}, {"$set": update})
        return {"updated": True, **update}

    @router.post("/admin/charges/{charge_id}/mark-pending")
    async def mark_pending(charge_id: str, current_user: dict = Depends(get_current_user)):
        await db.charges.update_one(
            {"id": charge_id},
            {"$set": {"status": "pending"}, "$unset": {"paid_at": "", "paid_amount": "", "payment_method": ""}},
        )
        return {"updated": True}

    @router.post("/admin/charges/bulk-monthly")
    async def bulk_monthly(payload: ChargeBulkMonthly, current_user: dict = Depends(get_current_user)):
        if not payload.player_ids:
            raise HTTPException(status_code=400, detail="Επιλέξτε τουλάχιστον έναν παίκτη")
        players = await db.players.find({"id": {"$in": payload.player_ids}}, {"_id": 0}).to_list(length=None)
        name_map = {p["id"]: p.get("name", "") for p in players}
        docs = []
        months = list(_month_iter(payload.from_year_month, payload.to_year_month))
        for pid in payload.player_ids:
            for y, m, label in months:
                last_day = monthrange(y, m)[1]
                due_day = min(payload.due_day, last_day)
                docs.append({
                    "id": str(uuid.uuid4()),
                    "player_id": pid,
                    "player_name": name_map.get(pid, ""),
                    "type": payload.type.value if hasattr(payload.type, "value") else str(payload.type),
                    "description": payload.description,
                    "amount": payload.amount_per_month,
                    "currency": "EUR",
                    "due_date": f"{y:04d}-{m:02d}-{due_day:02d}",
                    "season": payload.season,
                    "period_label": label,
                    "status": "pending",
                    "notes": payload.notes,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "created_by": current_user.get("username"),
                })
        if docs:
            await db.charges.insert_many(docs)
        return {"created": len(docs), "months": len(months), "players": len(payload.player_ids)}

    # ============ TEMPLATES ============
    @router.post("/admin/charge-templates")
    async def create_template(payload: ChargeTemplateCreate, current_user: dict = Depends(get_current_user)):
        doc = ChargeTemplate(**payload.model_dump()).model_dump()
        await db.charge_templates.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @router.get("/admin/charge-templates")
    async def list_templates(current_user: dict = Depends(get_current_user)):
        return await db.charge_templates.find({}, {"_id": 0}).sort("name", 1).to_list(length=None)

    @router.put("/admin/charge-templates/{tid}")
    async def update_template(tid: str, payload: dict = Body(...), current_user: dict = Depends(get_current_user)):
        payload.pop("id", None); payload.pop("_id", None)
        res = await db.charge_templates.update_one({"id": tid}, {"$set": payload})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
        return {"updated": True}

    @router.delete("/admin/charge-templates/{tid}")
    async def delete_template(tid: str, current_user: dict = Depends(get_current_user)):
        res = await db.charge_templates.delete_one({"id": tid})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
        return {"deleted": True}

    @router.post("/admin/charges/from-template/{template_id}")
    async def create_from_template(template_id: str, payload: dict = Body(...), current_user: dict = Depends(get_current_user)):
        template = await db.charge_templates.find_one({"id": template_id}, {"_id": 0})
        if not template:
            raise HTTPException(status_code=404, detail="Το template δεν βρέθηκε")
        player_ids = payload.get("player_ids", [])
        if not player_ids:
            raise HTTPException(status_code=400, detail="Επιλέξτε παίκτες")
        due_date = payload.get("due_date")
        season = payload.get("season")
        players = await db.players.find({"id": {"$in": player_ids}}, {"_id": 0}).to_list(length=None)
        name_map = {p["id"]: p.get("name", "") for p in players}
        docs = []
        for pid in player_ids:
            docs.append({
                "id": str(uuid.uuid4()),
                "player_id": pid,
                "player_name": name_map.get(pid, ""),
                "type": template["type"],
                "description": template.get("description") or template["name"],
                "amount": float(template["default_amount"]),
                "currency": "EUR",
                "due_date": due_date,
                "season": season,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": current_user.get("username"),
            })
        if docs:
            await db.charges.insert_many(docs)
        return {"created": len(docs)}

    # ============ PARENT MOBILE ============
    @router.get("/mobile/charges/{player_id}")
    async def parent_charges(player_id: str):
        docs = await db.charges.find({"player_id": player_id}, {"_id": 0}).sort("due_date", -1).to_list(length=None)
        pending = [d for d in docs if d.get("status") == "pending"]
        overdue = [d for d in docs if d.get("status") == "overdue"]
        paid = [d for d in docs if d.get("status") == "paid"]
        balance = sum(d.get("amount", 0) for d in pending + overdue)
        return {
            "balance": round(balance, 2),
            "pending_count": len(pending) + len(overdue),
            "charges": docs,
            "totals": {
                "pending": round(sum(d.get("amount", 0) for d in pending), 2),
                "overdue": round(sum(d.get("amount", 0) for d in overdue), 2),
                "paid": round(sum(d.get("paid_amount", d.get("amount", 0)) for d in paid), 2),
            },
        }
