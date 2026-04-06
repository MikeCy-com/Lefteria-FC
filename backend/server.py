from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
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
import json
from pywebpush import webpush, WebPushException

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret-key')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# VAPID Config for Web Push
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_CONTACT = os.environ.get('VAPID_CONTACT', 'mailto:info@lefteriafc.com')

# Create the main app
app = FastAPI(title="LEFTERIA FC API", description="Football Club & Academy Management System")
api_router = APIRouter(prefix="/api")

# Static files for uploads - serve via /api/uploads to go through ingress
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "players").mkdir(exist_ok=True)

# Serve uploads through api router to ensure K8s ingress routing
@api_router.get("/uploads/{path:path}")
async def serve_upload(path: str):
    from starlette.responses import FileResponse
    file_path = UPLOAD_DIR / path
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

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

def create_access_token(user_id: str, username: str, role: str = "admin") -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def _extract_token(request: Request) -> str:
    token = request.cookies.get("access_token")
    if not token:
        token = request.cookies.get("user_access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    return token

async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
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

async def get_current_customer(request: Request) -> dict:
    token = request.cookies.get("user_access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Πρέπει να συνδεθείτε")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access" or payload.get("role") != "customer":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_customer(request: Request):
    token = request.cookies.get("user_access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "customer":
            return None
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if user:
            user.pop("password_hash", None)
        return user
    except Exception:
        return None

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

# Team Model (Senior Teams)
class TeamCreate(BaseModel):
    name: str
    level: str = "Α' Ομάδα"
    description: str = ""

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    level: str = "Α' Ομάδα"
    description: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Academy Registration Model
class RegistrationCreate(BaseModel):
    # Player Info
    player_first_name: str
    player_last_name: str
    player_dob: str
    player_gender: str
    player_address: str
    player_city: str
    player_postal_code: str
    # Parent/Guardian Info
    parent_name: str
    parent_relationship: str
    parent_phone: str
    parent_email: str
    # Emergency Contact
    emergency_name: str
    emergency_phone: str
    emergency_relationship: str
    # Medical Info
    has_allergies: bool = False
    allergies_details: str = ""
    has_conditions: bool = False
    conditions_details: str = ""
    has_medication: bool = False
    medication_details: str = ""
    # Consents
    consent_participation: bool = False
    consent_medical_auth: bool = False
    consent_gdpr: bool = False
    consent_media: Optional[bool] = None
    consent_communications: bool = False
    comm_email: bool = False
    comm_sms: bool = False
    consent_liability: bool = False
    consent_financial: bool = False
    # Payment
    payment_method: str = "cash"
    # Signature
    signature_data: str = ""
    signature_date: str = ""

class Registration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Player
    player_first_name: str
    player_last_name: str
    player_dob: str
    player_gender: str
    player_address: str
    player_city: str
    player_postal_code: str
    # Parent/Guardian
    parent_name: str
    parent_relationship: str
    parent_phone: str
    parent_email: str
    # Emergency
    emergency_name: str
    emergency_phone: str
    emergency_relationship: str
    # Medical
    has_allergies: bool = False
    allergies_details: str = ""
    has_conditions: bool = False
    conditions_details: str = ""
    has_medication: bool = False
    medication_details: str = ""
    # Consents
    consent_participation: bool = False
    consent_medical_auth: bool = False
    consent_gdpr: bool = False
    consent_media: Optional[bool] = None
    consent_communications: bool = False
    comm_email: bool = False
    comm_sms: bool = False
    consent_liability: bool = False
    consent_financial: bool = False
    # Payment & Signature
    payment_method: str = "cash"
    signature_data: str = ""
    signature_date: str = ""
    # Status
    status: str = "pending"
    assigned_group_id: Optional[str] = None
    admin_notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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
    team_id: Optional[str] = None
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
    # Parent/Guardian Contact (for academy players)
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    # Multi-group support (academy)
    academy_group_ids: List[str] = Field(default_factory=list)
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
    team_id: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    previous_clubs: List[PreviousClub] = Field(default_factory=list)
    joined_date: Optional[str] = None
    contract_until: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    academy_group_ids: List[str] = Field(default_factory=list)

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
    team_id: Optional[str] = None
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
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    academy_group_ids: Optional[List[str]] = None

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
    academy_group_id: Optional[str] = None
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
    academy_group_id: Optional[str] = None
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

# ==================== GALLERY MODELS ====================
class GalleryCategory(str, Enum):
    MATCH_DAY = "Match Day"
    TRAINING = "Training"
    TEAM_EVENTS = "Team Events"
    ACADEMY = "Academy"
    FANS = "Fans"
    OTHER = "Other"

class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    image_url: str
    category: str = "Other"
    description: Optional[str] = None
    match_id: Optional[str] = None
    player_id: Optional[str] = None
    team_id: Optional[str] = None
    academy_group_id: Optional[str] = None
    tags: List[str] = []
    is_featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GalleryItemCreate(BaseModel):
    title: str
    image_url: str
    category: str = "Other"
    description: Optional[str] = None
    match_id: Optional[str] = None
    player_id: Optional[str] = None
    team_id: Optional[str] = None
    academy_group_id: Optional[str] = None
    tags: List[str] = []
    is_featured: bool = False

# ==================== PUSH SUBSCRIPTION MODELS ====================
class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str

class PushSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    endpoint: str
    keys: PushSubscriptionKeys
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys

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

# Birthday players - MUST be before {player_id} route
@api_router.get("/players/birthdays")
async def get_birthday_players():
    now = datetime.now(timezone.utc)
    current_month = now.month
    
    all_players = await db.players.find(
        {"is_active": True, "date_of_birth": {"$ne": None}},
        {"_id": 0}
    ).to_list(500)
    
    birthday_players = []
    for p in all_players:
        dob = p.get("date_of_birth", "")
        if dob:
            try:
                dob_date = datetime.strptime(dob, "%Y-%m-%d")
                if dob_date.month == current_month:
                    age = now.year - dob_date.year
                    birthday_players.append({
                        "id": p["id"],
                        "name": p["name"],
                        "number": p.get("number"),
                        "position": p.get("position"),
                        "team_type": p.get("team_type"),
                        "image_url": p.get("image_url"),
                        "date_of_birth": dob,
                        "age": age,
                        "birthday_day": dob_date.day,
                    })
            except ValueError:
                pass
    
    birthday_players.sort(key=lambda x: x["birthday_day"])
    return birthday_players

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
    players = await db.players.find(
        {"$or": [{"academy_group_id": group_id}, {"academy_group_ids": group_id}], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    return [Player(**p) for p in players]

@api_router.get("/academy-groups/{group_id}/fixtures")
async def get_academy_group_fixtures(group_id: str):
    fixtures = await db.fixtures.find({"academy_group_id": group_id}, {"_id": 0}).sort("match_date", -1).to_list(100)
    return fixtures

@api_router.post("/admin/academy-groups/{group_id}/fixtures")
async def create_academy_fixture(group_id: str, fixture: FixtureCreate, current_user: dict = Depends(get_current_user)):
    fixture_data = fixture.model_dump()
    fixture_data["academy_group_id"] = group_id  # Override with path parameter
    fixture_dict = Fixture(**fixture_data).model_dump()
    await db.fixtures.insert_one(fixture_dict)
    fixture_dict.pop("_id", None)
    return fixture_dict

@api_router.post("/admin/players/{player_id}/transfer")
async def transfer_player_group(player_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")
    target_group_ids = body.get("group_ids", [])
    primary_group_id = body.get("primary_group_id", target_group_ids[0] if target_group_ids else None)
    update = {"academy_group_ids": target_group_ids}
    if primary_group_id:
        update["academy_group_id"] = primary_group_id
        group = await db.academy_groups.find_one({"id": primary_group_id}, {"_id": 0})
        if group:
            update["academy_group_name"] = group["name"]
    await db.players.update_one({"id": player_id}, {"$set": update})
    return {"message": "Ο παίκτης μεταφέρθηκε επιτυχώς"}

# ==================== MATCH PLAYER STATS ====================
@api_router.get("/admin/fixtures/{fixture_id}/player-stats")
async def get_fixture_player_stats(fixture_id: str, current_user: dict = Depends(get_current_user)):
    """Get saved player stats for a fixture"""
    doc = await db.match_player_stats.find_one({"fixture_id": fixture_id}, {"_id": 0})
    if not doc:
        return {"fixture_id": fixture_id, "performances": []}
    return doc

@api_router.post("/admin/fixtures/{fixture_id}/player-stats")
async def save_fixture_player_stats(fixture_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    """Save/update player performances for a match. Idempotent: reverses old stats before applying new."""
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Ο αγώνας δεν βρέθηκε")

    performances = body.get("performances", [])

    # 1) Reverse any previously saved stats for this fixture
    existing = await db.match_player_stats.find_one({"fixture_id": fixture_id}, {"_id": 0})
    if existing:
        for old_perf in existing.get("performances", []):
            pid = old_perf.get("player_id")
            if not pid:
                continue
            await db.players.update_one({"id": pid}, {"$inc": {
                "statistics.appearances": -1,
                "statistics.goals": -(old_perf.get("goals", 0)),
                "statistics.assists": -(old_perf.get("assists", 0)),
                "statistics.yellow_cards": -1 if old_perf.get("yellow_card") else 0,
                "statistics.red_cards": -1 if old_perf.get("red_card") else 0,
                "statistics.minutes_played": -(old_perf.get("minutes_played", 0)),
            }})

    # 2) Save new performances
    stats_doc = {
        "fixture_id": fixture_id,
        "performances": performances,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.match_player_stats.update_one(
        {"fixture_id": fixture_id},
        {"$set": stats_doc},
        upsert=True
    )

    # 3) Apply new stats to player aggregates
    for perf in performances:
        pid = perf.get("player_id")
        if not pid:
            continue
        await db.players.update_one({"id": pid}, {"$inc": {
            "statistics.appearances": 1,
            "statistics.goals": perf.get("goals", 0),
            "statistics.assists": perf.get("assists", 0),
            "statistics.yellow_cards": 1 if perf.get("yellow_card") else 0,
            "statistics.red_cards": 1 if perf.get("red_card") else 0,
            "statistics.minutes_played": perf.get("minutes_played", 0),
        }})

    return {"message": "Τα στατιστικά αποθηκεύτηκαν", "count": len(performances)}

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
    limit: int = Query(default=50, le=500)
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

@api_router.get("/current-season")
async def get_current_season():
    season = await db.seasons.find_one({"is_current": True}, {"_id": 0})
    if season:
        return season
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    season = await db.seasons.find_one(
        {"start_date": {"$lte": now_str}, "end_date": {"$gte": now_str}}, {"_id": 0}
    )
    return season or {"name": "2025/26", "is_current": True}

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
    
    # Auto-calculate age from DOB
    if player_dict.get("date_of_birth"):
        try:
            dob = datetime.fromisoformat(player_dict["date_of_birth"])
            player_dict["age"] = (datetime.now(timezone.utc) - dob.replace(tzinfo=timezone.utc)).days // 365
        except:
            pass
    
    # Get academy group name if provided
    if player.academy_group_id:
        group = await db.academy_groups.find_one({"id": player.academy_group_id}, {"_id": 0})
        if group:
            player_dict["academy_group_name"] = group["name"]
    
    # Sync multi-group
    if player.academy_group_id and not player_dict.get("academy_group_ids"):
        player_dict["academy_group_ids"] = [player.academy_group_id]
    
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
    
    # Auto-calculate age from DOB
    if update_data.get("date_of_birth"):
        try:
            dob = datetime.fromisoformat(update_data["date_of_birth"])
            update_data["age"] = (datetime.now(timezone.utc) - dob.replace(tzinfo=timezone.utc)).days // 365
        except:
            pass
    
    # Get academy group name if provided
    if "academy_group_id" in update_data and update_data["academy_group_id"]:
        group = await db.academy_groups.find_one({"id": update_data["academy_group_id"]}, {"_id": 0})
        if group:
            update_data["academy_group_name"] = group["name"]
    
    # Sync multi-group
    if "academy_group_ids" in update_data:
        pass  # explicit multi-group update
    elif "academy_group_id" in update_data and update_data["academy_group_id"]:
        current_ids = existing.get("academy_group_ids", [])
        if update_data["academy_group_id"] not in current_ids:
            current_ids = [update_data["academy_group_id"]]
            update_data["academy_group_ids"] = current_ids
    
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
    image_url = f"/api/uploads/players/{filename}"
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
    
    return {"image_url": f"/api/uploads/players/{filename}"}

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

# ==================== TEAM MANAGEMENT ====================
@api_router.get("/teams")
async def get_teams():
    teams = await db.teams.find({}, {"_id": 0}).sort("created_at", 1).to_list(50)
    for team in teams:
        team["player_count"] = await db.players.count_documents({"team_id": team["id"], "is_active": True})
    return teams

@api_router.post("/admin/teams")
async def create_team(team: TeamCreate, current_user: dict = Depends(get_current_user)):
    team_obj = Team(**team.model_dump())
    doc = team_obj.model_dump()
    await db.teams.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/admin/teams/{team_id}")
async def update_team(team_id: str, team: TeamCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Η ομάδα δεν βρέθηκε")
    update_data = team.model_dump()
    await db.teams.update_one({"id": team_id}, {"$set": update_data})
    updated = await db.teams.find_one({"id": team_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/teams/{team_id}")
async def delete_team(team_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Η ομάδα δεν βρέθηκε")
    await db.players.update_many({"team_id": team_id}, {"$unset": {"team_id": ""}})
    return {"message": "Η ομάδα διαγράφηκε"}

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
    
    # Send push notification when match goes Live
    if new_status == "Live" and old_status != "Live":
        try:
            await send_push_to_all(
                title=f"LIVE: {existing['home_team']} vs {existing['away_team']}",
                body="Ο αγώνας ξεκίνησε!",
                url=f"/match/{fixture_id}"
            )
        except Exception as e:
            logging.warning(f"Push notification error: {e}")
    
    # Send push when match ends
    if new_status == "Completed" and old_status != "Completed":
        hs = body.get("home_score", existing.get("home_score", 0))
        aws = body.get("away_score", existing.get("away_score", 0))
        try:
            await send_push_to_all(
                title=f"Τέλος: {existing['home_team']} {hs} - {aws} {existing['away_team']}",
                body="Ο αγώνας ολοκληρώθηκε!",
                url=f"/match/{fixture_id}"
            )
        except Exception as e:
            logging.warning(f"Push notification error: {e}")
    
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
    
    # Send push notification for goals
    if event.event_type in [EventType.GOAL, EventType.PENALTY_SCORED, EventType.OWN_GOAL]:
        updated_fix = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
        try:
            player = event.player_name or "Γκολ"
            await send_push_to_all(
                title=f"ΓΚΟΛ! {updated_fix['home_team']} {updated_fix.get('home_score',0)} - {updated_fix.get('away_score',0)} {updated_fix['away_team']}",
                body=f"{player} {event.minute}'",
                url=f"/match/{fixture_id}"
            )
        except Exception as e:
            logging.warning(f"Push notification error: {e}")
    
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
    gallery_count = await db.gallery.count_documents({})
    teams_count = await db.teams.count_documents({})
    pending_registrations = await db.registrations.count_documents({"status": "pending"})
    
    return {
        "first_team_players": first_team_count,
        "academy_players": academy_count,
        "staff_members": staff_count,
        "total_fixtures": fixtures_count,
        "news_articles": news_count,
        "unread_messages": messages_count,
        "academy_groups": groups_count,
        "gallery_photos": gallery_count,
        "teams_count": teams_count,
        "pending_registrations": pending_registrations
    }


# ==================== SITE SETTINGS ====================
class StandingsColumnConfig(BaseModel):
    played: bool = True
    won: bool = True
    drawn: bool = True
    lost: bool = True
    goals_for: bool = False
    goals_against: bool = False
    goal_difference: bool = True
    points: bool = True
    form: bool = False

class SiteSettings(BaseModel):
    standings_columns: StandingsColumnConfig = StandingsColumnConfig()

@api_router.get("/settings/standings-columns")
async def get_standings_columns():
    settings = await db.site_settings.find_one({"key": "standings_columns"}, {"_id": 0})
    if not settings:
        return StandingsColumnConfig().model_dump()
    return settings.get("value", StandingsColumnConfig().model_dump())

@api_router.put("/admin/settings/standings-columns")
async def update_standings_columns(config: StandingsColumnConfig, current_user: dict = Depends(get_current_user)):
    await db.site_settings.update_one(
        {"key": "standings_columns"},
        {"$set": {"key": "standings_columns", "value": config.model_dump()}},
        upsert=True
    )
    return config.model_dump()


# ==================== GALLERY ====================
# Public: Get gallery items
@api_router.get("/gallery", response_model=List[GalleryItem])
async def get_gallery(category: Optional[str] = None, player_id: Optional[str] = None, match_id: Optional[str] = None, featured: Optional[bool] = None, team_id: Optional[str] = None, academy_group_id: Optional[str] = None, limit: int = 50):
    query = {}
    if category:
        query["category"] = category
    if player_id:
        query["player_id"] = player_id
    if match_id:
        query["match_id"] = match_id
    if featured is not None:
        query["is_featured"] = featured
    if team_id:
        query["team_id"] = team_id
    if academy_group_id:
        query["academy_group_id"] = academy_group_id
    items = await db.gallery.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [GalleryItem(**item) for item in items]

@api_router.get("/gallery/{item_id}", response_model=GalleryItem)
async def get_gallery_item(item_id: str):
    item = await db.gallery.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
    return GalleryItem(**item)

# Admin: Create gallery item
@api_router.post("/admin/gallery", response_model=GalleryItem)
async def create_gallery_item(item: GalleryItemCreate, current_user: dict = Depends(get_current_user)):
    gallery_item = GalleryItem(**item.model_dump())
    await db.gallery.insert_one(gallery_item.model_dump())
    return gallery_item

# Admin: Upload gallery image
@api_router.post("/admin/gallery/upload")
async def upload_gallery_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Μόνο εικόνες επιτρέπονται")
    gallery_dir = UPLOAD_DIR / "gallery"
    gallery_dir.mkdir(exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = gallery_dir / filename
    async with aiofiles.open(str(file_path), "wb") as f:
        content = await file.read()
        await f.write(content)
    return {"image_url": f"/api/uploads/gallery/{filename}"}

# Admin: Update gallery item
@api_router.put("/admin/gallery/{item_id}", response_model=GalleryItem)
async def update_gallery_item(item_id: str, item: GalleryItemCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.gallery.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
    update_data = item.model_dump()
    await db.gallery.update_one({"id": item_id}, {"$set": update_data})
    updated = await db.gallery.find_one({"id": item_id}, {"_id": 0})
    return GalleryItem(**updated)

# Admin: Delete gallery item
@api_router.delete("/admin/gallery/{item_id}")
async def delete_gallery_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.gallery.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε")
    return {"message": "Διαγράφηκε"}


# ==================== WEB PUSH NOTIFICATIONS ====================
@api_router.get("/push/vapid-key")
async def get_vapid_public_key():
    return {"public_key": VAPID_PUBLIC_KEY}

@api_router.post("/push/subscribe")
async def push_subscribe(sub: PushSubscriptionCreate):
    existing = await db.push_subscriptions.find_one({"endpoint": sub.endpoint}, {"_id": 0})
    if existing:
        return {"message": "Ήδη εγγεγραμμένος", "id": existing["id"]}
    subscription = PushSubscription(**sub.model_dump())
    await db.push_subscriptions.insert_one(subscription.model_dump())
    return {"message": "Εγγραφή επιτυχής", "id": subscription.id}

@api_router.post("/push/unsubscribe")
async def push_unsubscribe(sub: PushSubscriptionCreate):
    result = await db.push_subscriptions.delete_one({"endpoint": sub.endpoint})
    if result.deleted_count == 0:
        return {"message": "Δεν βρέθηκε εγγραφή"}
    return {"message": "Απεγγραφή επιτυχής"}

@api_router.get("/push/subscribers-count")
async def get_subscribers_count():
    count = await db.push_subscriptions.count_documents({})
    return {"count": count}

async def send_push_to_all(title: str, body: str, url: str = "/"):
    """Send push notification to all subscribers."""
    if not VAPID_PRIVATE_KEY:
        logging.warning("VAPID_PRIVATE_KEY not set, skipping push notifications")
        return 0
    
    subscriptions = await db.push_subscriptions.find({}, {"_id": 0}).to_list(10000)
    sent = 0
    failed_endpoints = []
    
    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "icon": "/logo192.png",
        "badge": "/logo192.png",
    })
    
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_CONTACT},
            )
            sent += 1
        except WebPushException as e:
            if "410" in str(e) or "404" in str(e):
                failed_endpoints.append(sub["endpoint"])
            logging.warning(f"Push failed for {sub['endpoint'][:50]}...: {e}")
        except Exception as e:
            logging.warning(f"Push error: {e}")
    
    if failed_endpoints:
        await db.push_subscriptions.delete_many({"endpoint": {"$in": failed_endpoints}})
    
    logging.info(f"Push sent to {sent}/{len(subscriptions)} subscribers")
    return sent

# Admin: Send test push notification
@api_router.post("/admin/push/test")
async def send_test_push(current_user: dict = Depends(get_current_user)):
    sent = await send_push_to_all(
        title="LEFTERIA FC",
        body="Δοκιμαστική ειδοποίηση! Οι ειδοποιήσεις λειτουργούν σωστά.",
        url="/"
    )
    return {"message": f"Στάλθηκε σε {sent} συνδρομητές"}

# Admin: Get subscribers count
@api_router.get("/admin/push/stats")
async def get_push_stats(current_user: dict = Depends(get_current_user)):
    count = await db.push_subscriptions.count_documents({})
    return {"subscribers": count}

# Admin: Trigger match-day reminder manually
@api_router.post("/admin/push/match-reminder")
async def trigger_match_reminder(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    tomorrow_str = tomorrow.strftime("%Y-%m-%d")

    fixtures = await db.fixtures.find({"status": "Scheduled"}, {"_id": 0}).to_list(200)
    tomorrow_matches = [f for f in fixtures if f.get("match_date", "").startswith(tomorrow_str)]

    if not tomorrow_matches:
        return {"message": "Δεν υπάρχουν αγώνες αύριο", "matches": 0, "sent": 0}

    total_sent = 0
    for match in tomorrow_matches:
        home = match.get("home_team", "")
        away = match.get("away_team", "")
        sent = await send_push_to_all(
            title="Αύριο παίζουμε!",
            body=f"{home} vs {away} — Αγόρασε εισιτήριο τώρα!",
            url="/shop"
        )
        total_sent += sent

    return {"message": f"Ειδοποιήσεις στάλθηκαν", "matches": len(tomorrow_matches), "sent": total_sent}

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

# ==================== ADMIN PRODUCT MANAGEMENT ====================
class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    image_url: str = ""
    category: str = "clothing"
    sizes: list = []
    in_stock: bool = True
    product_type: str = "merchandise"  # merchandise or ticket
    delivery_options: list = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    sizes: Optional[list] = None
    in_stock: Optional[bool] = None
    product_type: Optional[str] = None
    delivery_options: Optional[list] = None

@api_router.get("/admin/products")
async def admin_get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).sort("name", 1).to_list(200)
    return products

@api_router.post("/admin/products")
async def admin_create_product(body: ProductCreate, current_user: dict = Depends(get_current_user)):
    product = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "description": body.description,
        "price": body.price,
        "image_url": body.image_url,
        "category": body.category,
        "sizes": body.sizes,
        "in_stock": body.in_stock,
        "product_type": body.product_type,
        "delivery_options": body.delivery_options or ["Παραλαβή", "Αποστολή"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    return {"id": product["id"], "message": "Το προϊόν δημιουργήθηκε"}

@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, body: ProductUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    result = await db.products.update_one({"id": product_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Ενημερώθηκε"}

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Διαγράφηκε"}

# ==================== TICKETS ====================
class TicketCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    ticket_type: str = "match"  # match or seasonal
    fixture_id: Optional[str] = None
    available: bool = True
    max_quantity: int = 100

class TicketUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    ticket_type: Optional[str] = None
    fixture_id: Optional[str] = None
    available: Optional[bool] = None
    max_quantity: Optional[int] = None

@api_router.get("/tickets")
async def get_tickets():
    tickets = await db.tickets.find({"available": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    # Enrich match tickets with fixture info
    for t in tickets:
        if t.get("fixture_id"):
            fixture = await db.fixtures.find_one({"id": t["fixture_id"]}, {"_id": 0, "home_team": 1, "away_team": 1, "match_date": 1, "venue": 1, "status": 1})
            t["fixture"] = fixture
    return tickets

@api_router.get("/admin/tickets")
async def admin_get_tickets(current_user: dict = Depends(get_current_user)):
    tickets = await db.tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for t in tickets:
        if t.get("fixture_id"):
            fixture = await db.fixtures.find_one({"id": t["fixture_id"]}, {"_id": 0, "home_team": 1, "away_team": 1, "match_date": 1})
            t["fixture"] = fixture
    return tickets

@api_router.post("/admin/tickets")
async def admin_create_ticket(body: TicketCreate, current_user: dict = Depends(get_current_user)):
    ticket = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "description": body.description,
        "price": body.price,
        "ticket_type": body.ticket_type,
        "fixture_id": body.fixture_id,
        "available": body.available,
        "max_quantity": body.max_quantity,
        "sold": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tickets.insert_one(ticket)
    return {"id": ticket["id"], "message": "Το εισιτήριο δημιουργήθηκε"}

@api_router.put("/admin/tickets/{ticket_id}")
async def admin_update_ticket(ticket_id: str, body: TicketUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    result = await db.tickets.update_one({"id": ticket_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"message": "Ενημερώθηκε"}

@api_router.delete("/admin/tickets/{ticket_id}")
async def admin_delete_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tickets.delete_one({"id": ticket_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"message": "Διαγράφηκε"}

# Cart: add ticket to cart
class CartTicketAdd(BaseModel):
    ticket_id: str
    quantity: int = 1

@api_router.post("/cart/add-ticket")
async def add_ticket_to_cart(body: CartTicketAdd, user: dict = Depends(get_current_customer)):
    ticket = await db.tickets.find_one({"id": body.ticket_id, "available": True}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Εισιτήριο μη διαθέσιμο")

    cart = await db.carts.find_one({"user_id": user["id"]})
    item = {
        "product_id": body.ticket_id,
        "quantity": body.quantity,
        "size": "",
        "item_type": "ticket",
        "name": ticket["name"],
        "price": ticket["price"]
    }

    if not cart:
        await db.carts.insert_one({
            "user_id": user["id"],
            "items": [item],
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        # Check if ticket already in cart
        existing = None
        for ci in cart.get("items", []):
            if ci["product_id"] == body.ticket_id:
                existing = ci
                break
        if existing:
            await db.carts.update_one(
                {"user_id": user["id"], "items.product_id": body.ticket_id},
                {"$inc": {"items.$.quantity": body.quantity}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["id"]},
                {"$push": {"items": item}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )

    return {"message": "Το εισιτήριο προστέθηκε στο καλάθι"}

# ==================== CUSTOMER AUTH MODELS ====================
class CustomerRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None

class CustomerLogin(BaseModel):
    email: str
    password: str

class CustomerChangePassword(BaseModel):
    current_password: str
    new_password: str

class CustomerUpdateProfile(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None

# ==================== CUSTOMER AUTH ROUTES ====================
@api_router.post("/customer/register")
async def customer_register(body: CustomerRegister, response: Response):
    email_lower = body.email.strip().lower()
    if not body.name.strip() or not email_lower or not body.password:
        raise HTTPException(status_code=400, detail="Συμπληρώστε όλα τα πεδία")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες")

    existing = await db.users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status_code=409, detail="Αυτό το email χρησιμοποιείται ήδη")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": body.name.strip(),
        "email": email_lower,
        "password_hash": hash_password(body.password),
        "phone": body.phone or "",
        "address": "",
        "city": "",
        "postal_code": "",
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)

    token = create_access_token(user_id, body.name.strip(), role="customer")
    response.set_cookie(key="user_access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/")

    return {"id": user_id, "name": body.name.strip(), "email": email_lower, "token": token}

@api_router.post("/customer/login")
async def customer_login(body: CustomerLogin, response: Response):
    email_lower = body.email.strip().lower()
    user = await db.users.find_one({"email": email_lower}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Λάθος email ή κωδικός")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Λάθος email ή κωδικός")

    token = create_access_token(user["id"], user["name"], role="customer")
    response.set_cookie(key="user_access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/")

    return {"id": user["id"], "name": user["name"], "email": user["email"], "token": token}

@api_router.post("/customer/logout")
async def customer_logout(response: Response):
    response.delete_cookie(key="user_access_token", path="/")
    return {"message": "Αποσυνδέθηκε επιτυχώς"}

@api_router.get("/customer/me")
async def customer_me(user: dict = Depends(get_current_customer)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "phone": user.get("phone", ""), "address": user.get("address", ""), "city": user.get("city", ""), "postal_code": user.get("postal_code", ""), "created_at": user.get("created_at", "")}

@api_router.put("/customer/profile")
async def customer_update_profile(body: CustomerUpdateProfile, user: dict = Depends(get_current_customer)):
    updates = {}
    if body.name is not None:
        updates["name"] = body.name.strip()
    if body.phone is not None:
        updates["phone"] = body.phone.strip()
    if body.address is not None:
        updates["address"] = body.address.strip()
    if body.city is not None:
        updates["city"] = body.city.strip()
    if body.postal_code is not None:
        updates["postal_code"] = body.postal_code.strip()

    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})

    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.post("/customer/change-password")
async def customer_change_password(body: CustomerChangePassword, user: dict = Depends(get_current_customer)):
    full_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if not verify_password(body.current_password, full_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Ο τρέχων κωδικός είναι λάθος")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Ο νέος κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
    return {"message": "Ο κωδικός άλλαξε επιτυχώς"}

# ==================== ACADEMY REGISTRATIONS ====================
@api_router.post("/registrations")
async def create_registration(reg: RegistrationCreate):
    reg_obj = Registration(**reg.model_dump())
    doc = reg_obj.model_dump()
    await db.registrations.insert_one(doc)
    doc.pop("_id", None)
    return {"message": "Η εγγραφή υποβλήθηκε επιτυχώς", "id": doc["id"]}

@api_router.get("/admin/registrations")
async def get_registrations(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    regs = await db.registrations.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return regs

@api_router.get("/admin/registrations/{reg_id}")
async def get_registration(reg_id: str, current_user: dict = Depends(get_current_user)):
    reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Η εγγραφή δεν βρέθηκε")
    return reg

@api_router.put("/admin/registrations/{reg_id}/status")
async def update_registration_status(reg_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    status = body.get("status")
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Μη έγκυρη κατάσταση")
    update = {"status": status}
    if "admin_notes" in body:
        update["admin_notes"] = body["admin_notes"]
    if "assigned_group_id" in body:
        update["assigned_group_id"] = body["assigned_group_id"]
    result = await db.registrations.update_one({"id": reg_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Η εγγραφή δεν βρέθηκε")
    # If approved and group assigned, create a player
    if status == "approved":
        reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
        if reg:
            existing = await db.players.find_one({
                "name": f"{reg['player_first_name']} {reg['player_last_name']}",
                "team_type": "Academy"
            })
            if not existing:
                player_data = {
                    "id": str(uuid.uuid4()),
                    "name": f"{reg['player_first_name']} {reg['player_last_name']}",
                    "number": 0,
                    "position": "Midfielder",
                    "nationality": "Cyprus",
                    "age": 0,
                    "team_type": "Academy",
                    "academy_group_id": reg.get("assigned_group_id", ""),
                    "academy_group_name": "",
                    "is_active": True,
                    "image_url": "",
                    "bio": "",
                    "height": "",
                    "weight": "",
                    "preferred_foot": "Right",
                    "statistics": {"appearances": 0, "goals": 0, "assists": 0, "yellow_cards": 0, "red_cards": 0, "minutes_played": 0, "clean_sheets": 0},
                    "previous_clubs": [],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "parent_name": reg["parent_name"],
                    "parent_phone": reg["parent_phone"],
                    "parent_email": reg["parent_email"],
                }
                # Calculate age from DOB
                try:
                    dob = datetime.fromisoformat(reg["player_dob"])
                    player_data["age"] = (datetime.now(timezone.utc) - dob.replace(tzinfo=timezone.utc)).days // 365
                except:
                    pass
                # Get group name
                if reg.get("assigned_group_id"):
                    group = await db.academy_groups.find_one({"id": reg["assigned_group_id"]}, {"_id": 0})
                    if group:
                        player_data["academy_group_name"] = group["name"]
                await db.players.insert_one(player_data)
    return {"message": "Η κατάσταση ενημερώθηκε"}

@api_router.delete("/admin/registrations/{reg_id}")
async def delete_registration(reg_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.registrations.delete_one({"id": reg_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Η εγγραφή δεν βρέθηκε")
    return {"message": "Η εγγραφή διαγράφηκε"}

# ==================== PRODUCTS ====================
@api_router.get("/products")
async def get_products():
    products = await db.products.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Το προϊόν δεν βρέθηκε")
    return product

# ==================== CART ====================
class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1
    size: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int

@api_router.get("/cart")
async def get_cart(user: dict = Depends(get_current_customer)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        return {"user_id": user["id"], "items": [], "total": 0}

    enriched_items = []
    total = 0
    for item in cart.get("items", []):
        item_type = item.get("item_type", "product")
        if item_type == "ticket":
            ticket = await db.tickets.find_one({"id": item["product_id"]}, {"_id": 0})
            if ticket:
                subtotal = ticket["price"] * item["quantity"]
                total += subtotal
                enriched_items.append({
                    "product_id": item["product_id"],
                    "name": ticket["name"],
                    "price": ticket["price"],
                    "image_url": "",
                    "quantity": item["quantity"],
                    "size": "",
                    "item_type": "ticket",
                    "subtotal": subtotal
                })
        else:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            if product:
                subtotal = product["price"] * item["quantity"]
                total += subtotal
                enriched_items.append({
                    "product_id": item["product_id"],
                    "name": product["name"],
                    "price": product["price"],
                    "image_url": product.get("image_url", ""),
                    "quantity": item["quantity"],
                    "size": item.get("size", ""),
                    "item_type": "product",
                    "subtotal": subtotal
                })

    return {"user_id": user["id"], "items": enriched_items, "total": round(total, 2)}

@api_router.post("/cart/add")
async def add_to_cart(body: CartItemAdd, user: dict = Depends(get_current_customer)):
    product = await db.products.find_one({"id": body.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Το προϊόν δεν βρέθηκε")

    cart = await db.carts.find_one({"user_id": user["id"]})
    if not cart:
        await db.carts.insert_one({
            "user_id": user["id"],
            "items": [{"product_id": body.product_id, "quantity": body.quantity, "size": body.size or ""}],
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        existing_item = None
        for item in cart.get("items", []):
            if item["product_id"] == body.product_id and item.get("size", "") == (body.size or ""):
                existing_item = item
                break

        if existing_item:
            await db.carts.update_one(
                {"user_id": user["id"], "items.product_id": body.product_id, "items.size": body.size or ""},
                {"$inc": {"items.$.quantity": body.quantity}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["id"]},
                {"$push": {"items": {"product_id": body.product_id, "quantity": body.quantity, "size": body.size or ""}},
                 "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )

    return {"message": "Προστέθηκε στο καλάθι"}

@api_router.put("/cart/item/{product_id}")
async def update_cart_item(product_id: str, body: CartItemUpdate, size: str = "", user: dict = Depends(get_current_customer)):
    if body.quantity <= 0:
        await db.carts.update_one(
            {"user_id": user["id"]},
            {"$pull": {"items": {"product_id": product_id, "size": size}}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user["id"], "items.product_id": product_id, "items.size": size},
            {"$set": {"items.$.quantity": body.quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"message": "Ενημερώθηκε"}

@api_router.delete("/cart/item/{product_id}")
async def remove_cart_item(product_id: str, size: str = "", user: dict = Depends(get_current_customer)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"product_id": product_id, "size": size}}}
    )
    return {"message": "Αφαιρέθηκε από το καλάθι"}

@api_router.get("/cart/count")
async def get_cart_count(user: dict = Depends(get_current_customer)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0, "items": 1})
    if not cart:
        return {"count": 0}
    return {"count": sum(item.get("quantity", 0) for item in cart.get("items", []))}

# ==================== ORDERS ====================
class OrderCreate(BaseModel):
    shipping_name: str
    shipping_address: str
    shipping_city: str
    shipping_postal_code: str
    shipping_phone: str
    notes: Optional[str] = ""

@api_router.post("/orders")
async def create_order(body: OrderCreate, user: dict = Depends(get_current_customer)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Το καλάθι είναι άδειο")

    items = []
    total = 0
    for ci in cart["items"]:
        product = await db.products.find_one({"id": ci["product_id"]}, {"_id": 0})
        if product:
            subtotal = product["price"] * ci["quantity"]
            total += subtotal
            items.append({
                "product_id": ci["product_id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": ci["quantity"],
                "size": ci.get("size", ""),
                "subtotal": subtotal
            })

    order_id = str(uuid.uuid4())
    order = {
        "id": order_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "user_name": user["name"],
        "items": items,
        "total": round(total, 2),
        "shipping": {
            "name": body.shipping_name,
            "address": body.shipping_address,
            "city": body.shipping_city,
            "postal_code": body.shipping_postal_code,
            "phone": body.shipping_phone,
        },
        "notes": body.notes or "",
        "status": "pending",
        "payment_method": "Πληρωμή κατά την παραλαβή",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)

    await db.carts.delete_one({"user_id": user["id"]})

    return {"message": "Η παραγγελία σας καταχωρήθηκε!", "order_id": order_id}

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_customer)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_customer)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Η παραγγελία δεν βρέθηκε")
    return order

# Admin: view all orders
@api_router.get("/admin/orders")
async def admin_get_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, status: str = Query(...), current_user: dict = Depends(get_current_user)):
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Status updated"}

# ==================== PLAYER OF THE MONTH VOTING ====================
class PotmVote(BaseModel):
    player_id: str

@api_router.post("/votes/potm")
async def cast_potm_vote(vote: PotmVote, user: dict = Depends(get_current_customer)):
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")

    existing = await db.potm_votes.find_one({"voter_id": user["id"], "month_key": month_key})
    if existing:
        raise HTTPException(status_code=429, detail="Έχετε ήδη ψηφίσει αυτόν τον μήνα. Αποσύρετε πρώτα την ψήφο σας.")

    player = await db.players.find_one({"id": vote.player_id, "is_active": True}, {"_id": 0, "name": 1})
    if not player:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")

    await db.potm_votes.insert_one({
        "id": str(uuid.uuid4()),
        "player_id": vote.player_id,
        "player_name": player["name"],
        "voter_id": user["id"],
        "voter_name": user["name"],
        "voter_email": user["email"],
        "month_key": month_key,
        "created_at": now.isoformat()
    })

    return {"message": "Η ψήφος σας καταγράφηκε!"}

@api_router.post("/votes/potm/withdraw")
async def withdraw_potm_vote(user: dict = Depends(get_current_customer)):
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")

    result = await db.potm_votes.delete_one({"voter_id": user["id"], "month_key": month_key})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε ψήφος")

    return {"message": "Η ψήφος σας αποσύρθηκε επιτυχώς"}

@api_router.get("/votes/potm/results")
async def get_potm_results():
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")

    pipeline = [
        {"$match": {"month_key": month_key}},
        {"$group": {
            "_id": "$player_id",
            "player_name": {"$first": "$player_name"},
            "votes": {"$sum": 1},
            "voters": {"$push": "$voter_name"}
        }},
        {"$sort": {"votes": -1}},
    ]
    results = await db.potm_votes.aggregate(pipeline).to_list(100)

    enriched = []
    for r in results:
        player = await db.players.find_one({"id": r["_id"]}, {"_id": 0, "image_url": 1, "number": 1, "position": 1})
        enriched.append({
            "player_id": r["_id"],
            "player_name": r["player_name"],
            "votes": r["votes"],
            "voters": r["voters"],
            "image_url": player.get("image_url") if player else None,
            "number": player.get("number") if player else None,
            "position": player.get("position") if player else None,
        })

    total_votes = await db.potm_votes.count_documents({"month_key": month_key})

    return {
        "month_key": month_key,
        "total_votes": total_votes,
        "results": enriched
    }

@api_router.get("/votes/potm/check")
async def check_potm_vote(request: Request):
    user = await get_optional_customer(request)
    if not user:
        return {"has_voted": False, "voted_player_id": None, "voter_name": None, "logged_in": False}

    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")
    existing = await db.potm_votes.find_one(
        {"voter_id": user["id"], "month_key": month_key},
        {"_id": 0}
    )
    if existing:
        return {"has_voted": True, "voted_player_id": existing["player_id"], "voter_name": user["name"], "logged_in": True}
    return {"has_voted": False, "voted_player_id": None, "voter_name": user["name"], "logged_in": True}

@api_router.get("/votes/potm/player/{player_id}")
async def get_potm_player_detail(player_id: str):
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")

    player = await db.players.find_one({"id": player_id}, {"_id": 0, "name": 1, "image_url": 1, "number": 1, "position": 1})
    if not player:
        raise HTTPException(status_code=404, detail="Ο παίκτης δεν βρέθηκε")

    votes = await db.potm_votes.find(
        {"player_id": player_id, "month_key": month_key},
        {"_id": 0, "voter_name": 1, "created_at": 1}
    ).to_list(500)

    total_month_votes = await db.potm_votes.count_documents({"month_key": month_key})

    return {
        "player": player,
        "vote_count": len(votes),
        "voters": votes,
        "total_month_votes": total_month_votes,
        "month_key": month_key
    }

@api_router.get("/admin/votes/potm")
async def admin_get_potm_results(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")

    pipeline = [
        {"$match": {"month_key": month_key}},
        {"$group": {
            "_id": "$player_id",
            "player_name": {"$first": "$player_name"},
            "votes": {"$sum": 1},
            "voters": {"$push": {"name": "$voter_name", "email": "$voter_email", "date": "$created_at"}}
        }},
        {"$sort": {"votes": -1}}
    ]
    results = await db.potm_votes.aggregate(pipeline).to_list(100)
    total = await db.potm_votes.count_documents({"month_key": month_key})

    return {
        "month_key": month_key,
        "total_votes": total,
        "results": [{"player_id": r["_id"], "player_name": r["player_name"], "votes": r["votes"], "voters": r["voters"]} for r in results]
    }

# Admin: Reset votes for current month
@api_router.delete("/admin/votes/potm/reset")
async def admin_reset_potm_votes(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")
    result = await db.potm_votes.delete_many({"month_key": month_key})
    return {"message": f"Διαγράφηκαν {result.deleted_count} ψήφοι"}

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
async def startup_tasks():
    # Seed admin
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
        logger.info(f"Admin user \'{admin_username}\' created")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.admin_users.update_one(
            {"username": admin_username},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin user \'{admin_username}\' password updated")

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.potm_votes.create_index([("voter_id", 1), ("month_key", 1)], unique=True)

    # Seed products
    product_count = await db.products.count_documents({})
    if product_count == 0:
        products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Γιλέκο",
                "description": "Επίσημο γιλέκο ΛΕΥΤΕΡΙΑ FC",
                "price": 50.00,
                "image_url": "https://lefteriafc.cy/images/virtuemart/product/resized/eikona_viber_2026-02-09_21-32-54-956_512x512.jpg",
                "category": "clothing",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "in_stock": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Γιλέκο Premium",
                "description": "Premium γιλέκο ΛΕΥΤΕΡΙΑ FC",
                "price": 55.00,
                "image_url": "https://lefteriafc.cy/images/virtuemart/product/resized/eikona_viber_2026-02-09_21-32-54-983_512x512.jpg",
                "category": "clothing",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "in_stock": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Μπουφάν",
                "description": "Επίσημο μπουφάν ΛΕΥΤΕΡΙΑ FC",
                "price": 55.00,
                "image_url": "https://lefteriafc.cy/images/virtuemart/product/resized/eikona_viber_2026-02-09_21-32-55-021_512x512.jpg",
                "category": "clothing",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "in_stock": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Σακίδιο",
                "description": "Επίσημο σακίδιο ΛΕΥΤΕΡΙΑ FC",
                "price": 50.00,
                "image_url": "https://lefteriafc.cy/images/virtuemart/product/resized/eikona_viber_2026-02-09_21-32-54-942_512x512.jpg",
                "category": "accessories",
                "sizes": [],
                "in_stock": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Φόρμα",
                "description": "Αθλητική φόρμα ΛΕΥΤΕΡΙΑ FC",
                "price": 20.00,
                "image_url": "https://lefteriafc.cy/images/virtuemart/product/resized/eikona_viber_2026-02-09_21-32-55-079_512x512.jpg",
                "category": "clothing",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "in_stock": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Φούτερ",
                "description": "Επίσημο φούτερ ΛΕΥΤΕΡΙΑ FC",
                "price": 40.00,
                "image_url": "https://lefteriafc.cy/images/virtuemart/product/resized/eikona_viber_2026-02-09_21-32-54-997_512x512.jpg",
                "category": "clothing",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "in_stock": True
            },
        ]
        await db.products.insert_many(products)
        logger.info(f"Seeded {len(products)} products")

    # Add delivery_options to existing products that don't have it
    await db.products.update_many(
        {"delivery_options": {"$exists": False}},
        {"$set": {"delivery_options": ["Παραλαβή", "Αποστολή"], "product_type": "merchandise"}}
    )

    # Seed tickets if empty
    ticket_count = await db.tickets.count_documents({})
    if ticket_count == 0:
        upcoming = await db.fixtures.find({"status": "Scheduled"}, {"_id": 0, "id": 1, "home_team": 1, "away_team": 1, "match_date": 1}).sort("match_date", 1).to_list(3)
        tickets = []
        for f in upcoming:
            tickets.append({
                "id": str(uuid.uuid4()),
                "name": f"{f['home_team']} vs {f['away_team']}",
                "description": f"Αγώνας πρωταθλήματος",
                "price": 5.00,
                "ticket_type": "match",
                "fixture_id": f["id"],
                "available": True,
                "max_quantity": 200,
                "sold": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        tickets.append({
            "id": str(uuid.uuid4()),
            "name": "Εισιτήριο Διαρκείας 2025-2026",
            "description": "Πρόσβαση σε όλους τους εντός έδρας αγώνες της σεζόν",
            "price": 50.00,
            "ticket_type": "seasonal",
            "fixture_id": None,
            "available": True,
            "max_quantity": 100,
            "sold": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        if tickets:
            await db.tickets.insert_many(tickets)
            logger.info(f"Seeded {len(tickets)} tickets")

    # Seed default team if none exist
    team_count = await db.teams.count_documents({})
    if team_count == 0:
        default_team_id = str(uuid.uuid4())
        default_team = {
            "id": default_team_id,
            "name": "LEFTERIA FC - Α' Ομάδα",
            "level": "Α' Ομάδα",
            "description": "Η πρώτη ομάδα του ΛΕΥΤΕΡΙΑ FC",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.teams.insert_one(default_team)
        assigned = await db.players.update_many(
            {"team_type": "First Team"},
            {"$set": {"team_id": default_team_id}}
        )
        logger.info(f"Seeded default team, assigned {assigned.modified_count} players")

    # Assign team_id to First Team players that don't have one
    first_team = await db.teams.find_one({"level": "Α' Ομάδα"}, {"_id": 0})
    if first_team:
        await db.players.update_many(
            {"team_type": "First Team", "$or": [{"team_id": None}, {"team_id": {"$exists": False}}]},
            {"$set": {"team_id": first_team["id"]}}
        )

    # Start match-day reminder background task
    import asyncio
    asyncio.create_task(match_day_reminder_loop())

async def match_day_reminder_loop():
    """Background task that checks every hour for tomorrow's matches and sends reminders."""
    import asyncio
    while True:
        try:
            await check_and_send_match_reminders()
        except Exception as e:
            logger.error(f"Match reminder error: {e}")
        await asyncio.sleep(3600)  # Check every hour

async def check_and_send_match_reminders():
    """Check for matches happening tomorrow and send push if not already sent."""
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    tomorrow_str = tomorrow.strftime("%Y-%m-%d")

    # Check if we already sent for this date
    already_sent = await db.reminder_log.find_one({"date": tomorrow_str})
    if already_sent:
        return

    # Find matches scheduled for tomorrow
    fixtures = await db.fixtures.find({"status": "Scheduled"}, {"_id": 0}).to_list(200)
    tomorrow_matches = []
    for f in fixtures:
        match_date_str = f.get("match_date", "")
        if match_date_str and match_date_str.startswith(tomorrow_str):
            tomorrow_matches.append(f)

    if not tomorrow_matches:
        return

    for match in tomorrow_matches:
        home = match.get("home_team", "")
        away = match.get("away_team", "")
        title = "Αύριο παίζουμε!"
        body = f"{home} vs {away} — Αγόρασε εισιτήριο τώρα!"
        sent = await send_push_to_all(title=title, body=body, url="/shop")
        logger.info(f"Match reminder sent for {home} vs {away}: {sent} subscribers")

    # Log that we sent for this date
    await db.reminder_log.insert_one({"date": tomorrow_str, "sent_at": now.isoformat(), "matches": len(tomorrow_matches)})

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
