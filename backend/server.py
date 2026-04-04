from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import aiofiles
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import bcrypt
import jwt
import base64

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret-key')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Create the main app
app = FastAPI(title="LEFTERIA FC API", description="Football Club & Academy Management System")
api_router = APIRouter(prefix="/api")

# Static files for uploads
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "players").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ==================== ENUMS ====================
class PlayerPosition(str, Enum):
    GOALKEEPER = "Goalkeeper"
    DEFENDER = "Defender"
    MIDFIELDER = "Midfielder"
    FORWARD = "Forward"

class MatchStatus(str, Enum):
    SCHEDULED = "Scheduled"
    LIVE = "Live"
    HALF_TIME = "Half Time"
    COMPLETED = "Completed"
    POSTPONED = "Postponed"

class TeamType(str, Enum):
    FIRST_TEAM = "First Team"
    ACADEMY = "Academy"

class StaffRole(str, Enum):
    HEAD_COACH = "Head Coach"
    ASSISTANT_COACH = "Assistant Coach"
    GOALKEEPER_COACH = "Goalkeeper Coach"
    FITNESS_COACH = "Fitness Coach"
    PHYSIO = "Physiotherapist"
    TEAM_MANAGER = "Team Manager"
    YOUTH_COACH = "Youth Coach"
    SCOUT = "Scout"

# ==================== AUTH HELPERS ====================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.admin_users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== MODELS ====================

# Auth Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    id: str
    username: str
    token: str

# Academy Group Model
class AcademyGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "U18", "U16", "U14"
    age_range: str  # e.g., "16-18 ετών"
    coach_id: Optional[str] = None
    coach_name: Optional[str] = None
    training_schedule: str
    description: str
    max_players: int = 25
    season: str = "2025/26"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AcademyGroupCreate(BaseModel):
    name: str
    age_range: str
    coach_id: Optional[str] = None
    coach_name: Optional[str] = None
    training_schedule: str
    description: str
    max_players: int = 25
    season: str = "2025/26"

# Player Profile Model (Extended)
class PlayerStatistics(BaseModel):
    appearances: int = 0
    goals: int = 0
    assists: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    minutes_played: int = 0
    clean_sheets: int = 0  # for goalkeepers

class PreviousClub(BaseModel):
    club_name: str
    from_year: str
    to_year: str
    appearances: int = 0
    goals: int = 0

class Player(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Basic Info
    name: str
    number: int
    position: PlayerPosition
    nationality: str
    date_of_birth: Optional[str] = None
    age: int
    height: Optional[str] = None  # e.g., "1.85m"
    weight: Optional[str] = None  # e.g., "78kg"
    preferred_foot: Optional[str] = None  # Left/Right/Both
    # Team Info
    team_type: TeamType = TeamType.FIRST_TEAM
    academy_group_id: Optional[str] = None
    academy_group_name: Optional[str] = None
    # Profile
    image_url: Optional[str] = None
    bio: Optional[str] = None
    # Statistics
    statistics: PlayerStatistics = Field(default_factory=PlayerStatistics)
    season_statistics: Dict[str, PlayerStatistics] = Field(default_factory=dict)
    # Career History
    previous_clubs: List[PreviousClub] = Field(default_factory=list)
    joined_date: Optional[str] = None
    contract_until: Optional[str] = None
    # Social Media
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    # Meta
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlayerCreate(BaseModel):
    name: str
    number: int
    position: PlayerPosition
    nationality: str
    date_of_birth: Optional[str] = None
    age: int
    height: Optional[str] = None
    weight: Optional[str] = None
    preferred_foot: Optional[str] = None
    team_type: TeamType = TeamType.FIRST_TEAM
    academy_group_id: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    previous_clubs: List[PreviousClub] = Field(default_factory=list)
    joined_date: Optional[str] = None
    contract_until: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    number: Optional[int] = None
    position: Optional[PlayerPosition] = None
    nationality: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    preferred_foot: Optional[str] = None
    team_type: Optional[TeamType] = None
    academy_group_id: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    previous_clubs: Optional[List[PreviousClub]] = None
    joined_date: Optional[str] = None
    contract_until: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    is_active: Optional[bool] = None
    statistics: Optional[PlayerStatistics] = None

# Staff Model
class Staff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: StaffRole
    nationality: str
    date_of_birth: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    team_type: TeamType = TeamType.FIRST_TEAM
    academy_group_id: Optional[str] = None
    joined_date: Optional[str] = None
    previous_experience: List[Dict[str, str]] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StaffCreate(BaseModel):
    name: str
    role: StaffRole
    nationality: str
    date_of_birth: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    team_type: TeamType = TeamType.FIRST_TEAM
    academy_group_id: Optional[str] = None
    joined_date: Optional[str] = None
    previous_experience: List[Dict[str, str]] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)

# Fixture with Player Performance
class PlayerPerformance(BaseModel):
    player_id: str
    player_name: str
    minutes_played: int = 0
    goals: int = 0
    assists: int = 0
    yellow_card: bool = False
    red_card: bool = False
    rating: Optional[float] = None
    is_starter: bool = True
    substituted_in: Optional[int] = None
    substituted_out: Optional[int] = None

class Fixture(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    home_team: str
    home_team_logo: Optional[str] = None
    away_team: str
    away_team_logo: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: str
    match_time: Optional[str] = None
    venue: str
    venue_id: Optional[str] = None
    competition: str
    season: str = "2025/26"
    status: MatchStatus = MatchStatus.SCHEDULED
    # Player Performances
    player_performances: List[PlayerPerformance] = Field(default_factory=list)
    # Match Events
    scorers: List[Dict[str, Any]] = Field(default_factory=list)  # [{player_id, player_name, minute, type}]
    # Meta
    attendance: Optional[int] = None
    referee: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FixtureCreate(BaseModel):
    home_team: str
    home_team_logo: Optional[str] = None
    away_team: str
    away_team_logo: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: str
    match_time: Optional[str] = None
    venue: str
    venue_id: Optional[str] = None
    competition: str
    season: str = "2025/26"
    status: MatchStatus = MatchStatus.SCHEDULED
    player_performances: List[PlayerPerformance] = Field(default_factory=list)
    scorers: List[Dict[str, Any]] = Field(default_factory=list)
    attendance: Optional[int] = None
    referee: Optional[str] = None

# ==================== MATCH EVENTS & LIVE STATS ====================
class EventType(str, Enum):
    GOAL = "goal"
    YELLOW_CARD = "yellow_card"
    RED_CARD = "red_card"
    SECOND_YELLOW = "second_yellow"
    SUBSTITUTION = "substitution"
    PENALTY_SCORED = "penalty_scored"
    PENALTY_MISSED = "penalty_missed"
    OWN_GOAL = "own_goal"
    VAR_DECISION = "var_decision"

class MatchEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fixture_id: str
    event_type: EventType
    minute: int
    added_time: Optional[int] = None
    team: str  # "home" or "away"
    player_name: Optional[str] = None
    player_id: Optional[str] = None
    secondary_player_name: Optional[str] = None  # for subs: player coming in
    secondary_player_id: Optional[str] = None
    description: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MatchEventCreate(BaseModel):
    event_type: EventType
    minute: int
    added_time: Optional[int] = None
    team: str
    player_name: Optional[str] = None
    player_id: Optional[str] = None
    secondary_player_name: Optional[str] = None
    secondary_player_id: Optional[str] = None
    description: Optional[str] = None

class MatchStats(BaseModel):
    fixture_id: str
    home_possession: int = 50
    away_possession: int = 50
    home_shots: int = 0
    away_shots: int = 0
    home_shots_on_target: int = 0
    away_shots_on_target: int = 0
    home_corners: int = 0
    away_corners: int = 0
    home_fouls: int = 0
    away_fouls: int = 0
    home_offsides: int = 0
    away_offsides: int = 0
    home_saves: int = 0
    away_saves: int = 0
    match_minute: int = 0
    half: int = 1  # 1 or 2
    injury_time: int = 0

class MatchStatsUpdate(BaseModel):
    home_possession: Optional[int] = None
    away_possession: Optional[int] = None
    home_shots: Optional[int] = None
    away_shots: Optional[int] = None
    home_shots_on_target: Optional[int] = None
    away_shots_on_target: Optional[int] = None
    home_corners: Optional[int] = None
    away_corners: Optional[int] = None
    home_fouls: Optional[int] = None
    away_fouls: Optional[int] = None
    home_offsides: Optional[int] = None
    away_offsides: Optional[int] = None
    home_saves: Optional[int] = None
    away_saves: Optional[int] = None
    match_minute: Optional[int] = None
    half: Optional[int] = None
    injury_time: Optional[int] = None

# Standing with Logo
class Standing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team_name: str
    team_logo: Optional[str] = None
    played: int = 0
    won: int = 0
    drawn: int = 0
    lost: int = 0
    goals_for: int = 0
    goals_against: int = 0
    goal_difference: int = 0
    points: int = 0
    competition: str
    season: str = "2025/26"
    position: Optional[int] = None
    form: Optional[str] = None  # e.g., "WWDLW"

class StandingCreate(BaseModel):
    team_name: str
    team_logo: Optional[str] = None
    played: int = 0
    won: int = 0
    drawn: int = 0
    lost: int = 0
    goals_for: int = 0
    goals_against: int = 0
    points: int = 0
    competition: str
    season: str = "2025/26"
    form: Optional[str] = None

# Venue Model
class Venue(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    country: str
    capacity: Optional[int] = None
    surface: Optional[str] = None  # e.g., "Natural Grass"
    image_url: Optional[str] = None
    map_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_home_ground: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VenueCreate(BaseModel):
    name: str
    address: str
    city: str
    country: str
    capacity: Optional[int] = None
    surface: Optional[str] = None
    image_url: Optional[str] = None
    map_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_home_ground: bool = False

# Season Archive
class Season(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "2025/26"
    start_date: str
    end_date: str
    is_current: bool = False
    competitions: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    final_position: Optional[int] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SeasonCreate(BaseModel):
    name: str
    start_date: str
    end_date: str
    is_current: bool = False
    competitions: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    final_position: Optional[int] = None

# Club Profile
class ClubProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "club-profile"
    name: str = "LEFTERIA FC"
    greek_name: str = "ΛΕΥΤΕΡΙΑ"
    founded: int = 2024
    logo_url: str = ""
    stadium: str = "Γήπεδο Αετού"
    city: str = "Λεμεσός"
    country: str = "Κύπρος"
    description: str = ""
    primary_color: str = "#F5A623"
    secondary_color: str = "#000000"
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    youtube: Optional[str] = None

# News Model
class News(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    excerpt: str
    image_url: Optional[str] = None
    category: str = "Νέα"
    is_featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NewsCreate(BaseModel):
    title: str
    content: str
    excerpt: str
    image_url: Optional[str] = None
    category: str = "Νέα"
    is_featured: bool = False

# Contact Message
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

# Transfer Model
class Transfer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    player_name: str
    from_team: str
    to_team: str
    transfer_date: str
    transfer_type: str  # "In", "Out", "Loan In", "Loan Out"
    fee: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TransferCreate(BaseModel):
    player_id: str
    player_name: str
    from_team: str
    to_team: str
    transfer_date: str
    transfer_type: str
    fee: Optional[str] = None
    notes: Optional[str] = None

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    user = await db.admin_users.find_one({"username": request.username}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Λάθος όνομα χρήστη ή κωδικός")
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Λάθος όνομα χρήστη ή κωδικός")
    
    token = create_access_token(user["id"], user["username"])
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    return LoginResponse(id=user["id"], username=user["username"], token=token)

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Αποσυνδέθηκε επιτυχώς"}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== PUBLIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Welcome to LEFTERIA FC API"}

# Club Profile
@api_router.get("/club", response_model=ClubProfile)
async def get_club_profile():
    club = await db.club_profile.find_one({"id": "club-profile"}, {"_id": 0})
    if not club:
        default_club = ClubProfile()
        await db.club_profile.insert_one(default_club.model_dump())
        return default_club
    return ClubProfile(**club)

# Players (Public Read)
@api_router.get("/players", response_model=List[Player])
async def get_players(
    team_type: Optional[TeamType] = None,
    academy_group_id: Optional[str] = None,
    position: Optional[PlayerPosition] = None,
    is_active: bool = True
):
    query = {"is_active": is_active}
    if team_type:
        query["team_type"] = team_type.value
    if academy_group_id:
        query["academy_group_id"] = academy_group_id
    if position:
        query["position"] = position.value
    
    players = await db.players.find(query, {"_id": 0}).sort("number", 1).to_list(1000)
    return [Player(**p) for p in players]

@api_router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
    return Player(**player)

# Academy Groups (Public Read)
@api_router.get("/academy-groups", response_model=List[AcademyGroup])
async def get_academy_groups():
    groups = await db.academy_groups.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    return [AcademyGroup(**g) for g in groups]

@api_router.get("/academy-groups/{group_id}", response_model=AcademyGroup)
async def get_academy_group(group_id: str):
    group = await db.academy_groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Η ομάδα δεν βρέθηκε")
    return AcademyGroup(**group)

@api_router.get("/academy-groups/{group_id}/players", response_model=List[Player])
async def get_academy_group_players(group_id: str):
    players = await db.players.find({"academy_group_id": group_id, "is_active": True}, {"_id": 0}).to_list(100)
    return [Player(**p) for p in players]

# Staff (Public Read)
@api_router.get("/staff", response_model=List[Staff])
async def get_staff(team_type: Optional[TeamType] = None):
    query = {"is_active": True}
    if team_type:
        query["team_type"] = team_type.value
    staff = await db.staff.find(query, {"_id": 0}).to_list(100)
    return [Staff(**s) for s in staff]

@api_router.get("/staff/{staff_id}", response_model=Staff)
async def get_staff_member(staff_id: str):
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not staff:
        raise HTTPException(status_code=404, detail="Το μέλος του staff δεν βρέθηκε")
    return Staff(**staff)

# Fixtures (Public Read)
@api_router.get("/fixtures", response_model=List[Fixture])
async def get_fixtures(
    status: Optional[MatchStatus] = None,
    competition: Optional[str] = None,
    season: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    query = {}
    if status:
        query["status"] = status.value
    if competition:
        query["competition"] = competition
    if season:
        query["season"] = season
    
    fixtures = await db.fixtures.find(query, {"_id": 0}).sort("match_date", -1).to_list(limit)
    return [Fixture(**f) for f in fixtures]

@api_router.get("/fixtures/{fixture_id}", response_model=Fixture)
async def get_fixture(fixture_id: str):
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")
    return Fixture(**fixture)

# Calendar Events
@api_router.get("/calendar")
async def get_calendar_events(month: Optional[int] = None, year: Optional[int] = None):
    query = {}
    if month and year:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        query["match_date"] = {"$gte": start_date, "$lt": end_date}
    
    fixtures = await db.fixtures.find(query, {"_id": 0}).sort("match_date", 1).to_list(100)
    return fixtures

# Standings (Public Read)
@api_router.get("/standings", response_model=List[Standing])
async def get_standings(competition: Optional[str] = None, season: Optional[str] = None):
    query = {}
    if competition:
        query["competition"] = competition
    if season:
        query["season"] = season
    
    standings = await db.standings.find(query, {"_id": 0}).sort("points", -1).to_list(100)
    # Add position
    for i, standing in enumerate(standings):
        standing["position"] = i + 1
    return [Standing(**s) for s in standings]

# Venues (Public Read)
@api_router.get("/venues", response_model=List[Venue])
async def get_venues():
    venues = await db.venues.find({}, {"_id": 0}).to_list(100)
    return [Venue(**v) for v in venues]

@api_router.get("/venues/{venue_id}", response_model=Venue)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Το γήπεδο δεν βρέθηκε")
    return Venue(**venue)

# Seasons (Public Read)
@api_router.get("/seasons", response_model=List[Season])
async def get_seasons():
    seasons = await db.seasons.find({}, {"_id": 0}).sort("start_date", -1).to_list(100)
    return [Season(**s) for s in seasons]

# News (Public Read)
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
        raise HTTPException(status_code=404, detail="Τα νέα δεν βρέθηκαν")
    return News(**news)

# Contact (Public)
@api_router.post("/contact", response_model=ContactMessage)
async def submit_contact(contact: ContactMessageCreate):
    contact_obj = ContactMessage(**contact.model_dump())
    await db.contact_messages.insert_one(contact_obj.model_dump())
    return contact_obj

# Transfers (Public Read)
@api_router.get("/transfers", response_model=List[Transfer])
async def get_transfers(season: Optional[str] = None):
    query = {}
    transfers = await db.transfers.find(query, {"_id": 0}).sort("transfer_date", -1).to_list(100)
    return [Transfer(**t) for t in transfers]

# ==================== STANDINGS AUTO-CALCULATION HELPERS ====================

async def ensure_team_in_standings(team_name: str, competition: str, season: str):
    """Ensure a team exists in standings, create if not."""
    existing = await db.standings.find_one({"team_name": team_name, "competition": competition, "season": season}, {"_id": 0})
    if not existing:
        standing = Standing(team_name=team_name, competition=competition, season=season)
        await db.standings.insert_one(standing.model_dump())

async def auto_update_standings_for_match(home_team: str, away_team: str, home_score: int, away_score: int, competition: str, season: str):
    """Auto-update standings based on a completed match result."""
    await ensure_team_in_standings(home_team, competition, season)
    await ensure_team_in_standings(away_team, competition, season)
    
    home_inc = {"played": 1, "goals_for": home_score, "goals_against": away_score}
    away_inc = {"played": 1, "goals_for": away_score, "goals_against": home_score}
    
    if home_score > away_score:
        home_inc["won"] = 1; home_inc["points"] = 3
        away_inc["lost"] = 1
    elif home_score < away_score:
        away_inc["won"] = 1; away_inc["points"] = 3
        home_inc["lost"] = 1
    else:
        home_inc["drawn"] = 1; home_inc["points"] = 1
        away_inc["drawn"] = 1; away_inc["points"] = 1
    
    await db.standings.update_one({"team_name": home_team, "competition": competition, "season": season}, {"$inc": home_inc})
    await db.standings.update_one({"team_name": away_team, "competition": competition, "season": season}, {"$inc": away_inc})
    
    # Recalc goal_difference for both
    for team in [home_team, away_team]:
        s = await db.standings.find_one({"team_name": team, "competition": competition, "season": season}, {"_id": 0})
        if s:
            gd = s.get("goals_for", 0) - s.get("goals_against", 0)
            await db.standings.update_one({"team_name": team, "competition": competition, "season": season}, {"$set": {"goal_difference": gd}})

async def reverse_standings_for_match(home_team: str, away_team: str, home_score: int, away_score: int, competition: str, season: str):
    """Reverse standings impact of a match (for score corrections)."""
    home_dec = {"played": -1, "goals_for": -home_score, "goals_against": -away_score}
    away_dec = {"played": -1, "goals_for": -away_score, "goals_against": -home_score}
    
    if home_score > away_score:
        home_dec["won"] = -1; home_dec["points"] = -3
        away_dec["lost"] = -1
    elif home_score < away_score:
        away_dec["won"] = -1; away_dec["points"] = -3
        home_dec["lost"] = -1
    else:
        home_dec["drawn"] = -1; home_dec["points"] = -1
        away_dec["drawn"] = -1; away_dec["points"] = -1
    
    await db.standings.update_one({"team_name": home_team, "competition": competition, "season": season}, {"$inc": home_dec})
    await db.standings.update_one({"team_name": away_team, "competition": competition, "season": season}, {"$inc": away_dec})
    
    for team in [home_team, away_team]:
        s = await db.standings.find_one({"team_name": team, "competition": competition, "season": season}, {"_id": 0})
        if s:
            gd = s.get("goals_for", 0) - s.get("goals_against", 0)
            await db.standings.update_one({"team_name": team, "competition": competition, "season": season}, {"$set": {"goal_difference": gd}})

# ==================== ADMIN ROUTES ====================

# Club Profile Admin
@api_router.put("/admin/club", response_model=ClubProfile)
async def update_club_profile(club: ClubProfile, current_user: dict = Depends(get_current_user)):
    club_dict = club.model_dump()
    await db.club_profile.update_one({"id": "club-profile"}, {"$set": club_dict}, upsert=True)
    return club

# Players Admin
@api_router.post("/admin/players", response_model=Player)
async def create_player(player: PlayerCreate, current_user: dict = Depends(get_current_user)):
    player_dict = player.model_dump()
    
    # Get academy group name if provided
    if player.academy_group_id:
        group = await db.academy_groups.find_one({"id": player.academy_group_id}, {"_id": 0})
        if group:
            player_dict["academy_group_name"] = group["name"]
    
    player_obj = Player(**player_dict)
    await db.players.insert_one(player_obj.model_dump())
    return player_obj

@api_router.put("/admin/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player: PlayerUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
    
    update_data = {k: v for k, v in player.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Get academy group name if provided
    if "academy_group_id" in update_data and update_data["academy_group_id"]:
        group = await db.academy_groups.find_one({"id": update_data["academy_group_id"]}, {"_id": 0})
        if group:
            update_data["academy_group_name"] = group["name"]
    
    await db.players.update_one({"id": player_id}, {"$set": update_data})
    updated = await db.players.find_one({"id": player_id}, {"_id": 0})
    return Player(**updated)

@api_router.delete("/admin/players/{player_id}")
async def delete_player(player_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.players.delete_one({"id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
    return {"message": "Ο παίκτης διαγράφηκε"}

@api_router.post("/admin/players/{player_id}/transfer")
async def transfer_player(player_id: str, transfer: TransferCreate, current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
    
    # Create transfer record
    transfer_obj = Transfer(**transfer.model_dump())
    await db.transfers.insert_one(transfer_obj.model_dump())
    
    # Update player's previous clubs if transferring out
    if transfer.transfer_type in ["Out", "Loan Out"]:
        prev_club = PreviousClub(
            club_name="LEFTERIA FC",
            from_year=player.get("joined_date", "2024")[:4] if player.get("joined_date") else "2024",
            to_year=transfer.transfer_date[:4],
            appearances=player.get("statistics", {}).get("appearances", 0),
            goals=player.get("statistics", {}).get("goals", 0)
        )
        await db.players.update_one(
            {"id": player_id},
            {
                "$push": {"previous_clubs": prev_club.model_dump()},
                "$set": {"is_active": False}
            }
        )
    
    return transfer_obj

# Player Image Upload
@api_router.post("/admin/players/{player_id}/upload-image")
async def upload_player_image(player_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Μη αποδεκτός τύπος αρχείου. Χρησιμοποιήστε JPEG, PNG, WebP ή GIF.")
    
    # Validate size (max 5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Το αρχείο υπερβαίνει τα 5MB")
    
    # Save file
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{player_id}.{ext}"
    filepath = UPLOAD_DIR / "players" / filename
    
    async with aiofiles.open(str(filepath), "wb") as f:
        await f.write(content)
    
    # Update player image_url
    image_url = f"/uploads/players/{filename}"
    await db.players.update_one({"id": player_id}, {"$set": {"image_url": image_url}})
    
    return {"image_url": image_url, "message": "Η εικόνα ανέβηκε επιτυχώς"}

# General image upload (for news, club, etc.)
@api_router.post("/admin/upload-image")
async def upload_general_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Μη αποδεκτός τύπος αρχείου")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Το αρχείο υπερβαίνει τα 5MB")
    
    filename = f"{uuid.uuid4().hex[:12]}_{file.filename}"
    filepath = UPLOAD_DIR / "players" / filename
    
    async with aiofiles.open(str(filepath), "wb") as f:
        await f.write(content)
    
    return {"image_url": f"/uploads/players/{filename}"}

# Academy Groups Admin
@api_router.post("/admin/academy-groups", response_model=AcademyGroup)
async def create_academy_group(group: AcademyGroupCreate, current_user: dict = Depends(get_current_user)):
    group_obj = AcademyGroup(**group.model_dump())
    await db.academy_groups.insert_one(group_obj.model_dump())
    return group_obj

@api_router.put("/admin/academy-groups/{group_id}", response_model=AcademyGroup)
async def update_academy_group(group_id: str, group: AcademyGroupCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.academy_groups.find_one({"id": group_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Η ομάδα δεν βρέθηκε")
    
    update_data = group.model_dump()
    await db.academy_groups.update_one({"id": group_id}, {"$set": update_data})
    
    # Update group name in players
    await db.players.update_many(
        {"academy_group_id": group_id},
        {"$set": {"academy_group_name": group.name}}
    )
    
    updated = await db.academy_groups.find_one({"id": group_id}, {"_id": 0})
    return AcademyGroup(**updated)

@api_router.delete("/admin/academy-groups/{group_id}")
async def delete_academy_group(group_id: str, current_user: dict = Depends(get_current_user)):
    # Remove group reference from players
    await db.players.update_many(
        {"academy_group_id": group_id},
        {"$set": {"academy_group_id": None, "academy_group_name": None}}
    )
    
    result = await db.academy_groups.delete_one({"id": group_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Η ομάδα δεν βρέθηκε")
    return {"message": "Η ομάδα διαγράφηκε"}

@api_router.post("/admin/academy-groups/{group_id}/players/{player_id}")
async def add_player_to_group(group_id: str, player_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.academy_groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Η ομάδα δεν βρέθηκε")
    
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
    
    await db.players.update_one(
        {"id": player_id},
        {"$set": {
            "academy_group_id": group_id,
            "academy_group_name": group["name"],
            "team_type": TeamType.ACADEMY.value
        }}
    )
    
    return {"message": "Ο παίκτης προστέθηκε στην ομάδα"}

@api_router.delete("/admin/academy-groups/{group_id}/players/{player_id}")
async def remove_player_from_group(group_id: str, player_id: str, current_user: dict = Depends(get_current_user)):
    await db.players.update_one(
        {"id": player_id},
        {"$set": {"academy_group_id": None, "academy_group_name": None}}
    )
    return {"message": "Ο παίκτης αφαιρέθηκε από την ομάδα"}

# Staff Admin
@api_router.post("/admin/staff", response_model=Staff)
async def create_staff(staff: StaffCreate, current_user: dict = Depends(get_current_user)):
    staff_obj = Staff(**staff.model_dump())
    await db.staff.insert_one(staff_obj.model_dump())
    return staff_obj

@api_router.put("/admin/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff: StaffCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Το μέλος του staff δεν βρέθηκε")
    
    update_data = staff.model_dump()
    await db.staff.update_one({"id": staff_id}, {"$set": update_data})
    updated = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    return Staff(**updated)

@api_router.delete("/admin/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.staff.delete_one({"id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Το μέλος του staff δεν βρέθηκε")
    return {"message": "Το μέλος του staff διαγράφηκε"}

# Fixtures Admin
@api_router.post("/admin/fixtures", response_model=Fixture)
async def create_fixture(fixture: FixtureCreate, current_user: dict = Depends(get_current_user)):
    fixture_obj = Fixture(**fixture.model_dump())
    await db.fixtures.insert_one(fixture_obj.model_dump())
    
    # Auto-update standings if completed
    if fixture.status == MatchStatus.COMPLETED and fixture.home_score is not None and fixture.away_score is not None:
        await auto_update_standings_for_match(fixture.home_team, fixture.away_team, fixture.home_score, fixture.away_score, fixture.competition, fixture.season)
    
    return fixture_obj

@api_router.put("/admin/fixtures/{fixture_id}", response_model=Fixture)
async def update_fixture(fixture_id: str, fixture: FixtureCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")
    
    old_status = existing.get("status")
    update_data = fixture.model_dump()
    await db.fixtures.update_one({"id": fixture_id}, {"$set": update_data})
    
    # Auto-update standings when status changes to Completed
    if fixture.status == MatchStatus.COMPLETED and fixture.home_score is not None and fixture.away_score is not None:
        # Only auto-update if the match wasn't already completed, or if scores changed
        old_completed = old_status == "Completed"
        scores_changed = old_completed and (existing.get("home_score") != fixture.home_score or existing.get("away_score") != fixture.away_score)
        
        if not old_completed or scores_changed:
            # If scores changed on an already-completed match, reverse old result first
            if scores_changed:
                await reverse_standings_for_match(existing["home_team"], existing["away_team"], existing.get("home_score", 0), existing.get("away_score", 0), existing.get("competition", ""), existing.get("season", "2025/26"))
            await auto_update_standings_for_match(fixture.home_team, fixture.away_team, fixture.home_score, fixture.away_score, fixture.competition, fixture.season)
    
    # Update player statistics if match is completed
    if fixture.status == MatchStatus.COMPLETED and fixture.player_performances:
        for perf in fixture.player_performances:
            await db.players.update_one(
                {"id": perf.player_id},
                {"$inc": {
                    "statistics.appearances": 1,
                    "statistics.goals": perf.goals,
                    "statistics.assists": perf.assists,
                    "statistics.yellow_cards": 1 if perf.yellow_card else 0,
                    "statistics.red_cards": 1 if perf.red_card else 0,
                    "statistics.minutes_played": perf.minutes_played
                }}
            )
    
    updated = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    return Fixture(**updated)

@api_router.delete("/admin/fixtures/{fixture_id}")
async def delete_fixture(fixture_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.fixtures.delete_one({"id": fixture_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")
    return {"message": "Ο αγώνας διαγράφηκε"}

# Standings Admin
@api_router.post("/admin/standings", response_model=Standing)
async def create_standing(standing: StandingCreate, current_user: dict = Depends(get_current_user)):
    standing_dict = standing.model_dump()
    standing_dict["goal_difference"] = standing_dict["goals_for"] - standing_dict["goals_against"]
    standing_obj = Standing(**standing_dict)
    await db.standings.insert_one(standing_obj.model_dump())
    return standing_obj

@api_router.put("/admin/standings/{standing_id}", response_model=Standing)
async def update_standing(standing_id: str, standing: StandingCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.standings.find_one({"id": standing_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Η βαθμολογία δεν βρέθηκε")
    
    update_data = standing.model_dump()
    update_data["goal_difference"] = update_data["goals_for"] - update_data["goals_against"]
    await db.standings.update_one({"id": standing_id}, {"$set": update_data})
    updated = await db.standings.find_one({"id": standing_id}, {"_id": 0})
    return Standing(**updated)

@api_router.delete("/admin/standings/{standing_id}")
async def delete_standing(standing_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.standings.delete_one({"id": standing_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Η βαθμολογία δεν βρέθηκε")
    return {"message": "Η βαθμολογία διαγράφηκε"}

# Recalculate all standings from completed fixtures
@api_router.post("/admin/standings/recalculate")
async def recalculate_standings(current_user: dict = Depends(get_current_user)):
    """Drop all standings and rebuild from completed fixtures."""
    await db.standings.delete_many({})
    
    completed = await db.fixtures.find({"status": "Completed"}, {"_id": 0}).to_list(1000)
    for f in completed:
        hs = f.get("home_score")
        aws = f.get("away_score")
        if hs is not None and aws is not None:
            await auto_update_standings_for_match(
                f["home_team"], f["away_team"], hs, aws,
                f.get("competition", ""), f.get("season", "2025/26")
            )
    
    count = await db.standings.count_documents({})
    return {"message": f"Η βαθμολογία υπολογίστηκε ξανά από {len(completed)} αγώνες. {count} ομάδες στον πίνακα."}

# Live score update (quick endpoint for match day)
@api_router.put("/admin/fixtures/{fixture_id}/live-score")
async def update_live_score(fixture_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    body = await request.json()
    existing = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")
    
    update = {}
    if "home_score" in body:
        update["home_score"] = body["home_score"]
    if "away_score" in body:
        update["away_score"] = body["away_score"]
    if "status" in body:
        update["status"] = body["status"]
    
    old_status = existing.get("status")
    new_status = body.get("status", old_status)
    
    await db.fixtures.update_one({"id": fixture_id}, {"$set": update})
    
    # If transitioning to Completed, auto-update standings
    if new_status == "Completed" and old_status != "Completed":
        hs = body.get("home_score", existing.get("home_score"))
        aws = body.get("away_score", existing.get("away_score"))
        if hs is not None and aws is not None:
            await auto_update_standings_for_match(
                existing["home_team"], existing["away_team"], hs, aws,
                existing.get("competition", ""), existing.get("season", "2025/26")
            )
    
    updated = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    return updated

# ==================== MATCH EVENTS API ====================

# Public: Get live match data (fixture + events + stats)
@api_router.get("/live-match")
async def get_live_match():
    """Get currently live match with all events and stats for public display."""
    live = await db.fixtures.find_one({"status": {"$in": ["Live", "Half Time"]}}, {"_id": 0})
    if not live:
        return {"active": False, "fixture": None, "events": [], "stats": None}
    
    events = await db.match_events.find({"fixture_id": live["id"]}, {"_id": 0}).sort("minute", 1).to_list(200)
    stats = await db.match_stats.find_one({"fixture_id": live["id"]}, {"_id": 0})
    
    return {"active": True, "fixture": live, "events": events, "stats": stats}

# Public: Get match detail with events and stats
@api_router.get("/fixtures/{fixture_id}/detail")
async def get_fixture_detail(fixture_id: str):
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")
    events = await db.match_events.find({"fixture_id": fixture_id}, {"_id": 0}).sort("minute", 1).to_list(200)
    stats = await db.match_stats.find_one({"fixture_id": fixture_id}, {"_id": 0})
    return {"fixture": fixture, "events": events, "stats": stats}

# Admin: Add match event
@api_router.post("/admin/fixtures/{fixture_id}/events")
async def add_match_event(fixture_id: str, event: MatchEventCreate, current_user: dict = Depends(get_current_user)):
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")
    
    event_obj = MatchEvent(fixture_id=fixture_id, **event.model_dump())
    await db.match_events.insert_one(event_obj.model_dump())
    
    # Auto-update score for goal events
    if event.event_type in [EventType.GOAL, EventType.PENALTY_SCORED]:
        score_field = "home_score" if event.team == "home" else "away_score"
        current_score = fixture.get(score_field) or 0
        await db.fixtures.update_one({"id": fixture_id}, {"$set": {score_field: current_score + 1}})
    elif event.event_type == EventType.OWN_GOAL:
        # Own goal goes to the opposing team
        score_field = "away_score" if event.team == "home" else "home_score"
        current_score = fixture.get(score_field) or 0
        await db.fixtures.update_one({"id": fixture_id}, {"$set": {score_field: current_score + 1}})
    
    return {"id": event_obj.id, "message": "Το συμβάν προστέθηκε"}

# Admin: Delete match event
@api_router.delete("/admin/fixtures/{fixture_id}/events/{event_id}")
async def delete_match_event(fixture_id: str, event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.match_events.find_one({"id": event_id, "fixture_id": fixture_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Το συμβάν δεν βρέθηκε")
    
    # Reverse score if it was a goal event
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if event["event_type"] in ["goal", "penalty_scored"]:
        score_field = "home_score" if event["team"] == "home" else "away_score"
        current_score = fixture.get(score_field) or 0
        if current_score > 0:
            await db.fixtures.update_one({"id": fixture_id}, {"$set": {score_field: current_score - 1}})
    elif event["event_type"] == "own_goal":
        score_field = "away_score" if event["team"] == "home" else "home_score"
        current_score = fixture.get(score_field) or 0
        if current_score > 0:
            await db.fixtures.update_one({"id": fixture_id}, {"$set": {score_field: current_score - 1}})
    
    await db.match_events.delete_one({"id": event_id})
    return {"message": "Το συμβάν διαγράφηκε"}

# Admin: Get match events
@api_router.get("/admin/fixtures/{fixture_id}/events")
async def get_match_events(fixture_id: str, current_user: dict = Depends(get_current_user)):
    events = await db.match_events.find({"fixture_id": fixture_id}, {"_id": 0}).sort("minute", 1).to_list(200)
    return events

# Admin: Update match stats
@api_router.put("/admin/fixtures/{fixture_id}/stats")
async def update_match_stats(fixture_id: str, stats: MatchStatsUpdate, current_user: dict = Depends(get_current_user)):
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")
    
    update_data = {k: v for k, v in stats.model_dump().items() if v is not None}
    
    # Auto-balance possession
    if "home_possession" in update_data:
        update_data["away_possession"] = 100 - update_data["home_possession"]
    elif "away_possession" in update_data:
        update_data["home_possession"] = 100 - update_data["away_possession"]
    
    existing = await db.match_stats.find_one({"fixture_id": fixture_id})
    if existing:
        await db.match_stats.update_one({"fixture_id": fixture_id}, {"$set": update_data})
    else:
        new_stats = MatchStats(fixture_id=fixture_id, **update_data)
        await db.match_stats.insert_one(new_stats.model_dump())
    
    result = await db.match_stats.find_one({"fixture_id": fixture_id}, {"_id": 0})
    return result

# Admin: Get match stats
@api_router.get("/admin/fixtures/{fixture_id}/stats")
async def get_match_stats(fixture_id: str, current_user: dict = Depends(get_current_user)):
    stats = await db.match_stats.find_one({"fixture_id": fixture_id}, {"_id": 0})
    if not stats:
        return MatchStats(fixture_id=fixture_id).model_dump()
    return stats

# Venues Admin
@api_router.post("/admin/venues", response_model=Venue)
async def create_venue(venue: VenueCreate, current_user: dict = Depends(get_current_user)):
    venue_obj = Venue(**venue.model_dump())
    await db.venues.insert_one(venue_obj.model_dump())
    return venue_obj

@api_router.put("/admin/venues/{venue_id}", response_model=Venue)
async def update_venue(venue_id: str, venue: VenueCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Το γήπεδο δεν βρέθηκε")
    
    update_data = venue.model_dump()
    await db.venues.update_one({"id": venue_id}, {"$set": update_data})
    updated = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    return Venue(**updated)

@api_router.delete("/admin/venues/{venue_id}")
async def delete_venue(venue_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.venues.delete_one({"id": venue_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Το γήπεδο δεν βρέθηκε")
    return {"message": "Το γήπεδο διαγράφηκε"}

# Seasons Admin
@api_router.post("/admin/seasons", response_model=Season)
async def create_season(season: SeasonCreate, current_user: dict = Depends(get_current_user)):
    # If setting as current, unset other current seasons
    if season.is_current:
        await db.seasons.update_many({}, {"$set": {"is_current": False}})
    
    season_obj = Season(**season.model_dump())
    await db.seasons.insert_one(season_obj.model_dump())
    return season_obj

@api_router.put("/admin/seasons/{season_id}", response_model=Season)
async def update_season(season_id: str, season: SeasonCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.seasons.find_one({"id": season_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Η σεζόν δεν βρέθηκε")
    
    if season.is_current:
        await db.seasons.update_many({}, {"$set": {"is_current": False}})
    
    update_data = season.model_dump()
    await db.seasons.update_one({"id": season_id}, {"$set": update_data})
    updated = await db.seasons.find_one({"id": season_id}, {"_id": 0})
    return Season(**updated)

@api_router.delete("/admin/seasons/{season_id}")
async def delete_season(season_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.seasons.delete_one({"id": season_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Η σεζόν δεν βρέθηκε")
    return {"message": "Η σεζόν διαγράφηκε"}

# News Admin
@api_router.post("/admin/news", response_model=News)
async def create_news(news: NewsCreate, current_user: dict = Depends(get_current_user)):
    news_obj = News(**news.model_dump())
    await db.news.insert_one(news_obj.model_dump())
    return news_obj

@api_router.put("/admin/news/{news_id}", response_model=News)
async def update_news(news_id: str, news: NewsCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Τα νέα δεν βρέθηκαν")
    
    update_data = news.model_dump()
    await db.news.update_one({"id": news_id}, {"$set": update_data})
    updated = await db.news.find_one({"id": news_id}, {"_id": 0})
    return News(**updated)

@api_router.delete("/admin/news/{news_id}")
async def delete_news(news_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Τα νέα δεν βρέθηκαν")
    return {"message": "Τα νέα διαγράφηκαν"}

# Contact Messages Admin
@api_router.get("/admin/contact", response_model=List[ContactMessage])
async def get_contact_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ContactMessage(**m) for m in messages]

@api_router.delete("/admin/contact/{message_id}")
async def delete_contact_message(message_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.contact_messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Το μήνυμα δεν βρέθηκε")
    return {"message": "Το μήνυμα διαγράφηκε"}

# Dashboard Stats
@api_router.get("/admin/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    first_team_count = await db.players.count_documents({"team_type": "First Team", "is_active": True})
    academy_count = await db.players.count_documents({"team_type": "Academy", "is_active": True})
    staff_count = await db.staff.count_documents({"is_active": True})
    fixtures_count = await db.fixtures.count_documents({})
    news_count = await db.news.count_documents({})
    messages_count = await db.contact_messages.count_documents({})
    groups_count = await db.academy_groups.count_documents({})
    
    return {
        "first_team_players": first_team_count,
        "academy_players": academy_count,
        "staff_members": staff_count,
        "total_fixtures": fixtures_count,
        "news_articles": news_count,
        "unread_messages": messages_count,
        "academy_groups": groups_count
    }

# Seed Data
@api_router.post("/seed")
async def seed_data():
    player_count = await db.players.count_documents({})
    if player_count > 0:
        return {"message": "Τα δεδομένα έχουν ήδη φορτωθεί"}
    
    # Seed Academy Groups
    academy_groups = [
        {"name": "U18", "age_range": "16-18 ετών", "coach_name": "Κώστας Παπαδόπουλος", "training_schedule": "Καθημερινά - 18:30", "description": "Προπόνηση επαγγελματικής πορείας με ενσωμάτωση στην πρώτη ομάδα."},
        {"name": "U16", "age_range": "14-16 ετών", "coach_name": "Ανδρέας Γεωργίου", "training_schedule": "Δευ, Τετ, Παρ, Σαβ - 18:00", "description": "Προ-επαγγελματική ανάπτυξη και εντατική προπόνηση."},
        {"name": "U14", "age_range": "12-14 ετών", "coach_name": "Δημήτρης Παπαδόπουλος", "training_schedule": "Τρι, Πεμ, Σαβ - 17:30", "description": "Προχωρημένη τακτική προπόνηση και αγωνιστικές συμμετοχές."},
        {"name": "U12", "age_range": "10-12 ετών", "coach_name": "Γιώργος Αλεξάνδρου", "training_schedule": "Τρι, Πεμ, Σαβ - 17:00", "description": "Ανάπτυξη τακτικής αντίληψης και τεχνικών δεξιοτήτων."},
    ]
    
    group_ids = {}
    for g in academy_groups:
        group = AcademyGroup(**g)
        await db.academy_groups.insert_one(group.model_dump())
        group_ids[g["name"]] = group.id
    
    # Seed First Team Players
    first_team_players = [
        {"name": "Ανδρέας Πραστίτης", "number": 1, "position": "Goalkeeper", "nationality": "Cyprus", "age": 25, "team_type": "First Team", "height": "1.88m", "weight": "82kg", "preferred_foot": "Right", "image_url": "https://lefteriafc.cy/images/2026/01/31/528045922_122146565900791287_8734561383230242929_n.jpg", "bio": "Έμπειρος τερματοφύλακας με εξαιρετικά αντανακλαστικά."},
        {"name": "Κωνσταντίνος Σάρρου", "number": 12, "position": "Goalkeeper", "nationality": "Cyprus", "age": 23, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/02/23/eikona_viber_2026-02-23_18-54-22-310.jpg"},
        {"name": "Μάριος Φωτίου", "number": 13, "position": "Goalkeeper", "nationality": "Cyprus", "age": 24, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/31/eikona_viber_2026-01-30_17-02-32-858.jpg"},
        {"name": "Βασίλης Κυριάκου", "number": 2, "position": "Defender", "nationality": "Cyprus", "age": 26, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/31/523964068_122144556074791287_2482787494682151145_n.jpg"},
        {"name": "Κωνσταντίνος Χριστοδούλου", "number": 3, "position": "Defender", "nationality": "Cyprus", "age": 24, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/503169848_122134869422791287_5056076530651154859_n.jpg"},
        {"name": "Αρχοντής Στογιάνοβ", "number": 4, "position": "Defender", "nationality": "Bulgaria", "age": 27, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/02/11/arxontis.jpg"},
        {"name": "Ισμαήλ Ουασίμ", "number": 5, "position": "Defender", "nationality": "Morocco", "age": 25, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/503700541_122135477444791287_4665573012085293882_n.jpg"},
        {"name": "Χρίστος Νικολάου", "number": 15, "position": "Defender", "nationality": "Cyprus", "age": 23, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/508226964_122137905386791287_1698498073020797453_n.jpg"},
        {"name": "Κωνσταντίνος Χατζηχρήστος", "number": 6, "position": "Midfielder", "nationality": "Cyprus", "age": 26, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/517752227_122142087260791287_6830899101870867423_n.jpg"},
        {"name": "Στέφανος Κυπριανού", "number": 8, "position": "Midfielder", "nationality": "Cyprus", "age": 25, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/509313084_122138487422791287_4756376359198609794_n.jpg"},
        {"name": "Ngeleka Marcus", "number": 10, "position": "Midfielder", "nationality": "Congo", "age": 24, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/506587079_122137218710791287_5051177697532592442_n.jpg"},
        {"name": "Αλέξανδρος Γεωργιάδης", "number": 14, "position": "Midfielder", "nationality": "Cyprus", "age": 22, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/501799346_122134624826791287_2044572723166562606_n.jpg"},
        {"name": "Ιούλιος Κοϊνάς", "number": 16, "position": "Midfielder", "nationality": "Cyprus", "age": 23, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/28/515670556_122141240300791287_3364588695721783440_n.jpg"},
        {"name": "Αντρέας Ανδρέου", "number": 7, "position": "Midfielder", "nationality": "Cyprus", "age": 24, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/31/520316506_122143414910791287_3987226275692365678_n.jpg"},
        {"name": "David Mlynarczyk", "number": 11, "position": "Midfielder", "nationality": "Poland", "age": 26, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/508207125_122137548812791287_6095146996956984947_n.jpg"},
        {"name": "Μάριος Δημητρίου", "number": 17, "position": "Midfielder", "nationality": "Cyprus", "age": 22, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/28/528799209_122146292636791287_1550400844660231472_n.jpg"},
        {"name": "Χριστόφορος Παναγιώτου", "number": 18, "position": "Midfielder", "nationality": "Cyprus", "age": 23, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/31/eikona_viber_2026-01-30_16-59-49-223.jpg"},
        {"name": "Μάριος Ρούκλας", "number": 9, "position": "Forward", "nationality": "Cyprus", "age": 27, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/503124532_122135125964791287_7150647654623647573_n.jpg", "statistics": {"appearances": 18, "goals": 12, "assists": 5}},
        {"name": "Μάριος Σάββα", "number": 19, "position": "Forward", "nationality": "Cyprus", "age": 25, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/01/26/506451069_122137382540791287_6481162118035374507_n.jpg"},
        {"name": "Παναγιώτης Χριστοφόρου", "number": 20, "position": "Forward", "nationality": "Cyprus", "age": 24, "team_type": "First Team", "image_url": "https://lefteriafc.cy/images/2026/02/23/eikona_viber_2026-02-23_18-59-38-220.jpg"},
    ]
    
    for p in first_team_players:
        if "statistics" not in p:
            p["statistics"] = {"appearances": 0, "goals": 0, "assists": 0, "yellow_cards": 0, "red_cards": 0, "minutes_played": 0}
        player = Player(**p)
        await db.players.insert_one(player.model_dump())
    
    # Seed Fixtures
    fixtures_data = [
        {"home_team": "LEFTERIA FC", "away_team": "Αμαθούς Αγίου Τύχωνα", "home_score": 3, "away_score": 0, "match_date": "2026-02-21T14:30:00Z", "venue": "Γήπεδο Αετού", "competition": "ΠΑΑΟΚ Α' Όμιλος", "status": "Completed", "season": "2025/26"},
        {"home_team": "Απόλλων Επισκοπής", "away_team": "LEFTERIA FC", "home_score": 1, "away_score": 6, "match_date": "2026-02-16T19:30:00Z", "venue": "Επισκοπή", "competition": "ΠΑΑΟΚ Α' Όμιλος", "status": "Completed", "season": "2025/26"},
        {"home_team": "LEFTERIA FC", "away_team": "Π&Σ Ζακακίου", "home_score": 1, "away_score": 2, "match_date": "2026-02-02T15:00:00Z", "venue": "Γήπεδο Αετού", "competition": "ΠΑΑΟΚ Α' Όμιλος", "status": "Completed", "season": "2025/26"},
        {"home_team": "LEFTERIA FC", "away_team": "Αναγέννηση Γερμασόγειας", "match_date": "2026-03-01T15:00:00Z", "venue": "Γήπεδο Αετού", "competition": "ΠΑΑΟΚ Α' Όμιλος", "status": "Scheduled", "season": "2025/26"},
        {"home_team": "Άγιος Θεράπων", "away_team": "LEFTERIA FC", "match_date": "2026-03-08T15:00:00Z", "venue": "Άγιος Θεράπων", "competition": "ΠΑΑΟΚ Α' Όμιλος", "status": "Scheduled", "season": "2025/26"},
    ]
    
    for f in fixtures_data:
        fixture = Fixture(**f)
        await db.fixtures.insert_one(fixture.model_dump())
    
    # Seed Standings
    standings_data = [
        {"team_name": "Π&Σ Ζακακίου", "played": 16, "won": 16, "drawn": 0, "lost": 0, "goals_for": 57, "goals_against": 6, "points": 48, "competition": "ΠΑΑΟΚ Α' Όμιλος", "form": "WWWWW"},
        {"team_name": "ΑΤΕ-ΠΕΚ Παρεκκλησιάς", "played": 18, "won": 16, "drawn": 0, "lost": 2, "goals_for": 74, "goals_against": 13, "points": 48, "competition": "ΠΑΑΟΚ Α' Όμιλος", "form": "WWWLW"},
        {"team_name": "LEFTERIA FC", "played": 18, "won": 13, "drawn": 2, "lost": 3, "goals_for": 60, "goals_against": 20, "points": 41, "competition": "ΠΑΑΟΚ Α' Όμιλος", "form": "WWLWW"},
        {"team_name": "Αμαθούς Αγίου Τύχωνα", "played": 18, "won": 8, "drawn": 3, "lost": 7, "goals_for": 39, "goals_against": 29, "points": 27, "competition": "ΠΑΑΟΚ Α' Όμιλος"},
        {"team_name": "Αναγέννηση Γερμασόγειας", "played": 16, "won": 8, "drawn": 2, "lost": 6, "goals_for": 46, "goals_against": 30, "points": 26, "competition": "ΠΑΑΟΚ Α' Όμιλος"},
        {"team_name": "Απόλλων Επισκοπής", "played": 16, "won": 7, "drawn": 2, "lost": 7, "goals_for": 29, "goals_against": 30, "points": 23, "competition": "ΠΑΑΟΚ Α' Όμιλος"},
    ]
    
    for s in standings_data:
        s["goal_difference"] = s["goals_for"] - s["goals_against"]
        standing = Standing(**s)
        await db.standings.insert_one(standing.model_dump())
    
    # Seed News
    news_data = [
        {"title": "Νίκη με 3-0 εναντίον Αμαθούς!", "content": "Η ομάδα μας μπήκε στο γήπεδο με αποφασιστικότητα και απόλυτη συγκέντρωση.", "excerpt": "Η LEFTERIA FC νίκησε 3-0 τον Αμαθούς Αγίου Τύχωνα.", "category": "Αποτελέσματα", "is_featured": True, "image_url": "https://lefteriafc.cy/images/2026/02/22/639112112_122172212540791287_1953686296477132728_n.jpg"},
        {"title": "Σπουδαία εκτός έδρας νίκη με 1-6!", "content": "Η LEFTERIA FC πραγματοποίησε μια εξαιρετική εμφάνιση.", "excerpt": "Εντυπωσιακή νίκη με 1-6 εκτός έδρας.", "category": "Αποτελέσματα", "is_featured": True, "image_url": "https://lefteriafc.cy/images/2026/02/22/637904373_122171673212791287_1035750099661745766_n.jpg"},
    ]
    
    for n in news_data:
        news = News(**n)
        await db.news.insert_one(news.model_dump())
    
    # Seed Venue
    venue = Venue(
        name="Γήπεδο Αετού",
        address="Λεμεσός",
        city="Λεμεσός",
        country="Κύπρος",
        surface="Φυσικός Χλοοτάπητας",
        is_home_ground=True
    )
    await db.venues.insert_one(venue.model_dump())
    
    # Seed Season
    season = Season(
        name="2025/26",
        start_date="2025-08-01",
        end_date="2026-05-31",
        is_current=True,
        competitions=["ΠΑΑΟΚ Α' Όμιλος"]
    )
    await db.seasons.insert_one(season.model_dump())
    
    # Seed Club Profile
    club = ClubProfile(
        name="LEFTERIA FC",
        greek_name="ΛΕΥΤΕΡΙΑ",
        founded=2024,
        logo_url="https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png",
        stadium="Γήπεδο Αετού",
        city="Λεμεσός",
        country="Κύπρος",
        description="Η LEFTERIA FC ιδρύθηκε το 2024 με όραμα την αριστεία στο ποδόσφαιρο.",
        email="info@lefteriafc.cy"
    )
    await db.club_profile.insert_one(club.model_dump())
    
    return {"message": "Τα δεδομένα φορτώθηκαν επιτυχώς"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def seed_admin():
    admin_username = os.environ.get("ADMIN_USERNAME", "admin")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.admin_users.find_one({"username": admin_username}, {"_id": 0})
    
    if existing is None:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": admin_username,
            "password_hash": hash_password(admin_password),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_users.insert_one(admin_user)
        logger.info(f"Admin user '{admin_username}' created")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.admin_users.update_one(
            {"username": admin_username},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin user '{admin_username}' password updated")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
