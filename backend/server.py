from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Lefteria FC API", description="Football Club & Academy Management")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== ENUMS ====================
class PlayerPosition(str, Enum):
    GOALKEEPER = "Goalkeeper"
    DEFENDER = "Defender"
    MIDFIELDER = "Midfielder"
    FORWARD = "Forward"

class MatchStatus(str, Enum):
    SCHEDULED = "Scheduled"
    LIVE = "Live"
    COMPLETED = "Completed"
    POSTPONED = "Postponed"

class AgeGroup(str, Enum):
    U8 = "U8"
    U10 = "U10"
    U12 = "U12"
    U14 = "U14"
    U16 = "U16"
    U18 = "U18"
    SENIOR = "Senior"

# ==================== MODELS ====================
class PlayerBase(BaseModel):
    name: str
    number: int
    position: PlayerPosition
    nationality: str
    age: int
    image_url: Optional[str] = None
    is_academy: bool = False
    age_group: Optional[AgeGroup] = AgeGroup.SENIOR

class Player(PlayerBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlayerCreate(PlayerBase):
    pass

class FixtureBase(BaseModel):
    home_team: str
    away_team: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: str
    venue: str
    competition: str
    status: MatchStatus = MatchStatus.SCHEDULED

class Fixture(FixtureBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FixtureCreate(FixtureBase):
    pass

class StandingBase(BaseModel):
    team_name: str
    played: int = 0
    won: int = 0
    drawn: int = 0
    lost: int = 0
    goals_for: int = 0
    goals_against: int = 0
    points: int = 0
    competition: str

class Standing(StandingBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    goal_difference: int = 0

class StandingCreate(StandingBase):
    pass

class NewsBase(BaseModel):
    title: str
    content: str
    excerpt: str
    image_url: Optional[str] = None
    category: str = "News"
    is_featured: bool = False

class News(NewsBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NewsCreate(NewsBase):
    pass

class AcademyInfoBase(BaseModel):
    age_group: AgeGroup
    coach_name: str
    training_schedule: str
    description: str
    max_players: int = 25
    current_players: int = 0

class AcademyInfo(AcademyInfoBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class AcademyInfoCreate(AcademyInfoBase):
    pass

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    subject: str
    message: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class ClubInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "club-info"
    name: str = "Lefteria FC"
    greek_name: str = "ΛΕΥΤΕΡΙΑ"
    founded: int = 2024
    stadium: str = "Lefteria Stadium"
    capacity: int = 5000
    city: str = "Athens"
    country: str = "Greece"
    description: str = "Lefteria FC is a professional football club dedicated to excellence on and off the pitch."
    logo_url: str = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png"
    primary_color: str = "#F5A623"
    secondary_color: str = "#000000"

# ==================== ROUTES ====================

# Root
@api_router.get("/")
async def root():
    return {"message": "Welcome to Lefteria FC API"}

# Club Info
@api_router.get("/club", response_model=ClubInfo)
async def get_club_info():
    club = await db.club_info.find_one({"id": "club-info"}, {"_id": 0})
    if not club:
        default_club = ClubInfo()
        await db.club_info.insert_one(default_club.model_dump())
        return default_club
    return ClubInfo(**club)

@api_router.put("/club", response_model=ClubInfo)
async def update_club_info(club: ClubInfo):
    club_dict = club.model_dump()
    await db.club_info.update_one({"id": "club-info"}, {"$set": club_dict}, upsert=True)
    return club

# Players
@api_router.get("/players", response_model=List[Player])
async def get_players(
    is_academy: Optional[bool] = None,
    age_group: Optional[AgeGroup] = None,
    position: Optional[PlayerPosition] = None
):
    query = {}
    if is_academy is not None:
        query["is_academy"] = is_academy
    if age_group:
        query["age_group"] = age_group.value
    if position:
        query["position"] = position.value
    
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    return [Player(**p) for p in players]

@api_router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return Player(**player)

@api_router.post("/players", response_model=Player)
async def create_player(player: PlayerCreate):
    player_obj = Player(**player.model_dump())
    await db.players.insert_one(player_obj.model_dump())
    return player_obj

@api_router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player: PlayerCreate):
    existing = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Player not found")
    
    update_data = player.model_dump()
    await db.players.update_one({"id": player_id}, {"$set": update_data})
    updated = await db.players.find_one({"id": player_id}, {"_id": 0})
    return Player(**updated)

@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str):
    result = await db.players.delete_one({"id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Player deleted"}

# Fixtures
@api_router.get("/fixtures", response_model=List[Fixture])
async def get_fixtures(
    status: Optional[MatchStatus] = None,
    competition: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    query = {}
    if status:
        query["status"] = status.value
    if competition:
        query["competition"] = competition
    
    fixtures = await db.fixtures.find(query, {"_id": 0}).sort("match_date", -1).to_list(limit)
    return [Fixture(**f) for f in fixtures]

@api_router.get("/fixtures/{fixture_id}", response_model=Fixture)
async def get_fixture(fixture_id: str):
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return Fixture(**fixture)

@api_router.post("/fixtures", response_model=Fixture)
async def create_fixture(fixture: FixtureCreate):
    fixture_obj = Fixture(**fixture.model_dump())
    await db.fixtures.insert_one(fixture_obj.model_dump())
    return fixture_obj

@api_router.put("/fixtures/{fixture_id}", response_model=Fixture)
async def update_fixture(fixture_id: str, fixture: FixtureCreate):
    existing = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    update_data = fixture.model_dump()
    await db.fixtures.update_one({"id": fixture_id}, {"$set": update_data})
    updated = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    return Fixture(**updated)

@api_router.delete("/fixtures/{fixture_id}")
async def delete_fixture(fixture_id: str):
    result = await db.fixtures.delete_one({"id": fixture_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return {"message": "Fixture deleted"}

# Standings
@api_router.get("/standings", response_model=List[Standing])
async def get_standings(competition: Optional[str] = None):
    query = {}
    if competition:
        query["competition"] = competition
    
    standings = await db.standings.find(query, {"_id": 0}).sort("points", -1).to_list(100)
    return [Standing(**s) for s in standings]

@api_router.post("/standings", response_model=Standing)
async def create_standing(standing: StandingCreate):
    standing_dict = standing.model_dump()
    standing_dict["goal_difference"] = standing_dict["goals_for"] - standing_dict["goals_against"]
    standing_obj = Standing(**standing_dict)
    await db.standings.insert_one(standing_obj.model_dump())
    return standing_obj

@api_router.put("/standings/{standing_id}", response_model=Standing)
async def update_standing(standing_id: str, standing: StandingCreate):
    existing = await db.standings.find_one({"id": standing_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Standing not found")
    
    update_data = standing.model_dump()
    update_data["goal_difference"] = update_data["goals_for"] - update_data["goals_against"]
    await db.standings.update_one({"id": standing_id}, {"$set": update_data})
    updated = await db.standings.find_one({"id": standing_id}, {"_id": 0})
    return Standing(**updated)

@api_router.delete("/standings/{standing_id}")
async def delete_standing(standing_id: str):
    result = await db.standings.delete_one({"id": standing_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Standing not found")
    return {"message": "Standing deleted"}

# News
@api_router.get("/news", response_model=List[News])
async def get_news(
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    limit: int = Query(default=20, le=100)
):
    query = {}
    if category:
        query["category"] = category
    if is_featured is not None:
        query["is_featured"] = is_featured
    
    news = await db.news.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [News(**n) for n in news]

@api_router.get("/news/{news_id}", response_model=News)
async def get_news_item(news_id: str):
    news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return News(**news)

@api_router.post("/news", response_model=News)
async def create_news(news: NewsCreate):
    news_obj = News(**news.model_dump())
    await db.news.insert_one(news_obj.model_dump())
    return news_obj

@api_router.put("/news/{news_id}", response_model=News)
async def update_news(news_id: str, news: NewsCreate):
    existing = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="News not found")
    
    update_data = news.model_dump()
    await db.news.update_one({"id": news_id}, {"$set": update_data})
    updated = await db.news.find_one({"id": news_id}, {"_id": 0})
    return News(**updated)

@api_router.delete("/news/{news_id}")
async def delete_news(news_id: str):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

# Academy
@api_router.get("/academy", response_model=List[AcademyInfo])
async def get_academy_info():
    academy = await db.academy.find({}, {"_id": 0}).to_list(100)
    return [AcademyInfo(**a) for a in academy]

@api_router.get("/academy/{age_group}", response_model=AcademyInfo)
async def get_academy_by_age_group(age_group: AgeGroup):
    academy = await db.academy.find_one({"age_group": age_group.value}, {"_id": 0})
    if not academy:
        raise HTTPException(status_code=404, detail="Academy info not found")
    return AcademyInfo(**academy)

@api_router.post("/academy", response_model=AcademyInfo)
async def create_academy_info(academy: AcademyInfoCreate):
    academy_obj = AcademyInfo(**academy.model_dump())
    await db.academy.insert_one(academy_obj.model_dump())
    return academy_obj

@api_router.put("/academy/{academy_id}", response_model=AcademyInfo)
async def update_academy_info(academy_id: str, academy: AcademyInfoCreate):
    existing = await db.academy.find_one({"id": academy_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Academy info not found")
    
    update_data = academy.model_dump()
    await db.academy.update_one({"id": academy_id}, {"$set": update_data})
    updated = await db.academy.find_one({"id": academy_id}, {"_id": 0})
    return AcademyInfo(**updated)

@api_router.delete("/academy/{academy_id}")
async def delete_academy_info(academy_id: str):
    result = await db.academy.delete_one({"id": academy_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Academy info not found")
    return {"message": "Academy info deleted"}

# Contact
@api_router.post("/contact", response_model=ContactMessage)
async def submit_contact(contact: ContactMessageCreate):
    contact_obj = ContactMessage(**contact.model_dump())
    await db.contact_messages.insert_one(contact_obj.model_dump())
    return contact_obj

@api_router.get("/contact", response_model=List[ContactMessage])
async def get_contact_messages():
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ContactMessage(**m) for m in messages]

# Seed Data
@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    player_count = await db.players.count_documents({})
    if player_count > 0:
        return {"message": "Data already seeded"}
    
    # Seed Players (First Team)
    first_team_players = [
        {"name": "Nikos Papadopoulos", "number": 1, "position": "Goalkeeper", "nationality": "Greece", "age": 28, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400"},
        {"name": "Dimitris Alexiou", "number": 2, "position": "Defender", "nationality": "Greece", "age": 25, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400"},
        {"name": "Kostas Nikolaidis", "number": 4, "position": "Defender", "nationality": "Greece", "age": 27, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400"},
        {"name": "Yannis Georgiou", "number": 5, "position": "Defender", "nationality": "Greece", "age": 24, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400"},
        {"name": "Alexandros Stavros", "number": 3, "position": "Defender", "nationality": "Greece", "age": 26, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400"},
        {"name": "Michalis Konstantinou", "number": 6, "position": "Midfielder", "nationality": "Cyprus", "age": 29, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400"},
        {"name": "Giorgos Papanikolas", "number": 8, "position": "Midfielder", "nationality": "Greece", "age": 23, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400"},
        {"name": "Andreas Christodoulou", "number": 10, "position": "Midfielder", "nationality": "Greece", "age": 26, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400"},
        {"name": "Petros Ioannou", "number": 7, "position": "Midfielder", "nationality": "Greece", "age": 24, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400"},
        {"name": "Stefanos Vlahos", "number": 9, "position": "Forward", "nationality": "Greece", "age": 27, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400"},
        {"name": "Thanasis Karagiannis", "number": 11, "position": "Forward", "nationality": "Greece", "age": 22, "is_academy": False, "age_group": "Senior", "image_url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400"},
    ]
    
    for p in first_team_players:
        player = Player(**p)
        await db.players.insert_one(player.model_dump())
    
    # Seed Academy Players
    academy_players = [
        {"name": "Nikos Jr. Papadopoulos", "number": 1, "position": "Goalkeeper", "nationality": "Greece", "age": 16, "is_academy": True, "age_group": "U18"},
        {"name": "Marios Dimitriou", "number": 5, "position": "Defender", "nationality": "Greece", "age": 15, "is_academy": True, "age_group": "U16"},
        {"name": "Christos Angelou", "number": 10, "position": "Midfielder", "nationality": "Greece", "age": 14, "is_academy": True, "age_group": "U14"},
        {"name": "Pavlos Theodorou", "number": 9, "position": "Forward", "nationality": "Greece", "age": 12, "is_academy": True, "age_group": "U12"},
    ]
    
    for p in academy_players:
        player = Player(**p)
        await db.players.insert_one(player.model_dump())
    
    # Seed Fixtures
    fixtures_data = [
        {"home_team": "Lefteria FC", "away_team": "Olympiacos B", "home_score": 3, "away_score": 1, "match_date": "2026-01-15T15:00:00Z", "venue": "Lefteria Stadium", "competition": "Super League 2", "status": "Completed"},
        {"home_team": "Panathinaikos B", "away_team": "Lefteria FC", "home_score": 1, "away_score": 2, "match_date": "2026-01-22T17:00:00Z", "venue": "Apostolos Nikolaidis", "competition": "Super League 2", "status": "Completed"},
        {"home_team": "Lefteria FC", "away_team": "AEK Athens B", "home_score": 2, "away_score": 2, "match_date": "2026-01-29T15:00:00Z", "venue": "Lefteria Stadium", "competition": "Super League 2", "status": "Completed"},
        {"home_team": "PAOK B", "away_team": "Lefteria FC", "home_score": None, "away_score": None, "match_date": "2026-02-05T18:00:00Z", "venue": "Toumba Stadium", "competition": "Super League 2", "status": "Scheduled"},
        {"home_team": "Lefteria FC", "away_team": "Aris FC B", "home_score": None, "away_score": None, "match_date": "2026-02-12T15:00:00Z", "venue": "Lefteria Stadium", "competition": "Super League 2", "status": "Scheduled"},
    ]
    
    for f in fixtures_data:
        fixture = Fixture(**f)
        await db.fixtures.insert_one(fixture.model_dump())
    
    # Seed Standings
    standings_data = [
        {"team_name": "Olympiacos B", "played": 18, "won": 12, "drawn": 4, "lost": 2, "goals_for": 35, "goals_against": 15, "points": 40, "competition": "Super League 2"},
        {"team_name": "Lefteria FC", "played": 18, "won": 11, "drawn": 3, "lost": 4, "goals_for": 32, "goals_against": 18, "points": 36, "competition": "Super League 2"},
        {"team_name": "Panathinaikos B", "played": 18, "won": 10, "drawn": 4, "lost": 4, "goals_for": 28, "goals_against": 20, "points": 34, "competition": "Super League 2"},
        {"team_name": "AEK Athens B", "played": 18, "won": 9, "drawn": 5, "lost": 4, "goals_for": 25, "goals_against": 17, "points": 32, "competition": "Super League 2"},
        {"team_name": "PAOK B", "played": 18, "won": 8, "drawn": 6, "lost": 4, "goals_for": 24, "goals_against": 19, "points": 30, "competition": "Super League 2"},
        {"team_name": "Aris FC B", "played": 18, "won": 7, "drawn": 5, "lost": 6, "goals_for": 22, "goals_against": 22, "points": 26, "competition": "Super League 2"},
    ]
    
    for s in standings_data:
        s["goal_difference"] = s["goals_for"] - s["goals_against"]
        standing = Standing(**s)
        await db.standings.insert_one(standing.model_dump())
    
    # Seed News
    news_data = [
        {
            "title": "Lefteria FC Secures Impressive Win Against Olympiacos B",
            "content": "In a stunning display of teamwork and skill, Lefteria FC defeated Olympiacos B 3-1 at home. Goals from Stefanos Vlahos (2) and Andreas Christodoulou sealed the victory.",
            "excerpt": "Lefteria FC defeats Olympiacos B 3-1 in a dominant home performance.",
            "category": "Match Report",
            "is_featured": True,
            "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"
        },
        {
            "title": "Academy Success: U18 Team Reaches Regional Finals",
            "content": "Our U18 academy team has qualified for the regional finals after an unbeaten run in the group stages. Coach Papadopoulos praised the young talents.",
            "excerpt": "U18 academy team qualifies for regional finals with unbeaten record.",
            "category": "Academy",
            "is_featured": True,
            "image_url": "https://images.unsplash.com/photo-1622659097574-c814ee26068e?w=800"
        },
        {
            "title": "New Training Facility Opening Next Month",
            "content": "Lefteria FC is proud to announce the opening of our new state-of-the-art training facility, featuring modern amenities for both first team and academy players.",
            "excerpt": "New training facility with modern amenities opening soon.",
            "category": "Club News",
            "is_featured": False,
            "image_url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"
        },
    ]
    
    for n in news_data:
        news = News(**n)
        await db.news.insert_one(news.model_dump())
    
    # Seed Academy Info
    academy_data = [
        {"age_group": "U8", "coach_name": "Maria Konstantinou", "training_schedule": "Mon, Wed, Fri - 4:00 PM", "description": "Introduction to football fundamentals with fun activities.", "max_players": 20, "current_players": 15},
        {"age_group": "U10", "coach_name": "Nikos Stavridis", "training_schedule": "Mon, Wed, Fri - 4:30 PM", "description": "Building basic skills and team coordination.", "max_players": 22, "current_players": 18},
        {"age_group": "U12", "coach_name": "Giorgos Alexandrou", "training_schedule": "Tue, Thu, Sat - 5:00 PM", "description": "Developing tactical awareness and technical skills.", "max_players": 24, "current_players": 20},
        {"age_group": "U14", "coach_name": "Dimitris Papadopoulos", "training_schedule": "Tue, Thu, Sat - 5:30 PM", "description": "Advanced tactical training and competitive matches.", "max_players": 25, "current_players": 22},
        {"age_group": "U16", "coach_name": "Andreas Georgiou", "training_schedule": "Mon, Wed, Fri, Sat - 6:00 PM", "description": "Pre-professional development and intensive training.", "max_players": 25, "current_players": 23},
        {"age_group": "U18", "coach_name": "Kostas Papadopoulos", "training_schedule": "Daily - 6:30 PM", "description": "Professional pathway training with first team integration.", "max_players": 25, "current_players": 24},
    ]
    
    for a in academy_data:
        academy = AcademyInfo(**a)
        await db.academy.insert_one(academy.model_dump())
    
    return {"message": "Data seeded successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
