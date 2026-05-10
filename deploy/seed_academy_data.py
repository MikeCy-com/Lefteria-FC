#!/usr/bin/env python3
"""
Idempotent seeder for Academy opponents + facilities.

Run on the production VPS once (or whenever you need to refresh) to import
the academy opponents/fields that were prepared on the preview environment.

USAGE (inside the running backend container):
    docker compose exec backend python /app/deploy/seed_academy_data.py

It:
  - Reads /app/deploy/academy_data_seed.json
  - Upserts each opponent and facility by name (case-insensitive) within team_type=Academy
  - Preserves existing data; never deletes
"""
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

# Load env from /app/backend/.env if available (Docker/dev parity)
ENV_FILE = Path("/app/backend/.env")
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
DATA_FILE = Path(__file__).parent / "academy_data_seed.json"

if not MONGO_URL or not DB_NAME:
    print("ERROR: MONGO_URL and DB_NAME must be set", file=sys.stderr)
    sys.exit(1)
if not DATA_FILE.exists():
    print(f"ERROR: data file not found at {DATA_FILE}", file=sys.stderr)
    sys.exit(1)


async def main() -> None:
    payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    opponents = payload.get("opponents", [])
    facilities = payload.get("facilities", [])

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    op_added = op_skipped = 0
    for o in opponents:
        name = (o.get("name") or "").strip()
        if not name:
            continue
        existing = await db.opponents.find_one(
            {"team_type": "Academy", "name": {"$regex": f"^{name}$", "$options": "i"}},
            {"_id": 0, "id": 1},
        )
        if existing:
            op_skipped += 1
            continue
        doc = {
            "id": o.get("id") or str(uuid.uuid4()),
            "name": name,
            "team_type": "Academy",
            "logo_url": o.get("logo_url", ""),
            "venue": o.get("venue", ""),
            "location_url": o.get("location_url", ""),
            "created_at": o.get("created_at") or datetime.now(timezone.utc).isoformat(),
        }
        await db.opponents.insert_one(doc)
        op_added += 1

    fac_added = fac_skipped = 0
    for f in facilities:
        name = (f.get("name") or "").strip()
        if not name:
            continue
        existing = await db.facilities.find_one(
            {"team_type": "Academy", "name": {"$regex": f"^{name}$", "$options": "i"}},
            {"_id": 0, "id": 1},
        )
        if existing:
            fac_skipped += 1
            continue
        doc = {
            "id": f.get("id") or str(uuid.uuid4()),
            "name": name,
            "team_type": "Academy",
            "address": f.get("address", ""),
            "location_url": f.get("location_url", ""),
            "image_url": f.get("image_url", ""),
            "created_at": f.get("created_at") or datetime.now(timezone.utc).isoformat(),
        }
        await db.facilities.insert_one(doc)
        fac_added += 1

    print(f"Opponents: added={op_added}, skipped(existing)={op_skipped}")
    print(f"Facilities: added={fac_added}, skipped(existing)={fac_skipped}")
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
