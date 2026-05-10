"""All Pydantic models and Enums for the Lefteria FC backend."""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime, timezone
import uuid


# ==================== SPONSORS ====================
class SponsorLevel(str, Enum):
    mega = "mega"
    gold = "gold"
    silver = "silver"
    supporter = "supporter"

class SponsorType(str, Enum):
    first_team = "first_team"
    academy = "academy"

class Sponsor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    logo_url: Optional[str] = ""
    banner_url: Optional[str] = ""
    website: Optional[str] = ""
    facebook: Optional[str] = ""
    instagram: Optional[str] = ""
    twitter: Optional[str] = ""
    youtube: Optional[str] = ""
    linkedin: Optional[str] = ""
    level: str = "supporter"
    sponsor_type: str = "first_team"
    display_order: int = 0
    content_blocks: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SponsorCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    logo_url: Optional[str] = ""
    banner_url: Optional[str] = ""
    website: Optional[str] = ""
    facebook: Optional[str] = ""
    instagram: Optional[str] = ""
    twitter: Optional[str] = ""
    youtube: Optional[str] = ""
    linkedin: Optional[str] = ""
    level: str = "supporter"
    sponsor_type: str = "first_team"
    display_order: int = 0
    content_blocks: List[Dict[str, Any]] = []


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

class GalleryCategory(str, Enum):
    MATCH_DAY = "Match Day"
    TRAINING = "Training"
    TEAM_EVENTS = "Team Events"
    ACADEMY = "Academy"
    FANS = "Fans"
    OTHER = "Other"


# ==================== AUTH MODELS ====================
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    id: str
    username: str
    token: str


# ==================== ACADEMY GROUP ====================
class AcademyGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age_range: str
    coach_id: Optional[str] = None
    coach_name: Optional[str] = None
    training_schedule: str
    description: str
    max_players: int = 25
    season: str = "2025/26"
    banner_url: Optional[str] = None
    display_order: int = 0
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
    banner_url: Optional[str] = None
    display_order: int = 0


# ==================== TEAM ====================
class TeamCreate(BaseModel):
    name: str
    level: str = "Α' Ομάδα"
    description: str = ""
    banner_url: Optional[str] = None

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    level: str = "Α' Ομάδα"
    description: str = ""
    banner_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ==================== REGISTRATION ====================
class RegistrationCreate(BaseModel):
    player_first_name: str
    player_last_name: str
    player_dob: str
    player_gender: str
    player_address: str
    player_city: str
    player_postal_code: str
    parent_name: str
    parent_relationship: str
    parent_phone: str
    parent_email: str
    emergency_name: str
    emergency_phone: str
    emergency_relationship: str
    has_allergies: bool = False
    allergies_details: str = ""
    has_conditions: bool = False
    conditions_details: str = ""
    has_medication: bool = False
    medication_details: str = ""
    consent_participation: bool = False
    consent_medical_auth: bool = False
    consent_gdpr: bool = False
    consent_media: Optional[bool] = None
    consent_communications: bool = False
    comm_email: bool = False
    comm_sms: bool = False
    consent_liability: bool = False
    consent_financial: bool = False
    payment_method: str = "cash"
    signature_data: str = ""
    signature_date: str = ""

class Registration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_first_name: str
    player_last_name: str
    player_dob: str
    player_gender: str
    player_address: str
    player_city: str
    player_postal_code: str
    parent_name: str
    parent_relationship: str
    parent_phone: str
    parent_email: str
    emergency_name: str
    emergency_phone: str
    emergency_relationship: str
    has_allergies: bool = False
    allergies_details: str = ""
    has_conditions: bool = False
    conditions_details: str = ""
    has_medication: bool = False
    medication_details: str = ""
    consent_participation: bool = False
    consent_medical_auth: bool = False
    consent_gdpr: bool = False
    consent_media: Optional[bool] = None
    consent_communications: bool = False
    comm_email: bool = False
    comm_sms: bool = False
    consent_liability: bool = False
    consent_financial: bool = False
    payment_method: str = "cash"
    signature_data: str = ""
    signature_date: str = ""
    status: str = "pending"
    assigned_group_id: Optional[str] = None
    admin_notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ==================== PLAYER ====================
class PlayerStatistics(BaseModel):
    appearances: int = 0
    goals: int = 0
    assists: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    minutes_played: int = 0
    clean_sheets: int = 0

class PreviousClub(BaseModel):
    club_name: str
    from_year: str
    to_year: str
    appearances: int = 0
    goals: int = 0

class Player(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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
    academy_group_name: Optional[str] = None
    team_id: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    statistics: PlayerStatistics = Field(default_factory=PlayerStatistics)
    season_statistics: Dict[str, PlayerStatistics] = Field(default_factory=dict)
    previous_clubs: List[PreviousClub] = Field(default_factory=list)
    joined_date: Optional[str] = None
    contract_until: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    phone: Optional[str] = None
    academy_group_ids: List[str] = Field(default_factory=list)
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
    phone: Optional[str] = None
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
    phone: Optional[str] = None
    academy_group_ids: Optional[List[str]] = None


# ==================== STAFF ====================
class Staff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: StaffRole
    nationality: str
    date_of_birth: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
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
    phone: Optional[str] = None
    team_type: TeamType = TeamType.FIRST_TEAM
    academy_group_id: Optional[str] = None
    joined_date: Optional[str] = None
    previous_experience: List[Dict[str, str]] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)


# ==================== FIXTURE ====================
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
    arrival_time: Optional[str] = None
    venue: str
    venue_id: Optional[str] = None
    location: Optional[str] = None
    location_url: Optional[str] = None
    competition: str
    season: str = "2025/26"
    status: MatchStatus = MatchStatus.SCHEDULED
    academy_group_id: Optional[str] = None
    opponent_id: Optional[str] = None
    player_performances: List[PlayerPerformance] = Field(default_factory=list)
    scorers: List[Dict[str, Any]] = Field(default_factory=list)
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
    arrival_time: Optional[str] = None
    venue: str
    venue_id: Optional[str] = None
    location: Optional[str] = None
    location_url: Optional[str] = None
    competition: str
    season: str = "2025/26"
    status: MatchStatus = MatchStatus.SCHEDULED
    academy_group_id: Optional[str] = None
    opponent_id: Optional[str] = None
    player_performances: List[PlayerPerformance] = Field(default_factory=list)
    scorers: List[Dict[str, Any]] = Field(default_factory=list)
    attendance: Optional[int] = None
    referee: Optional[str] = None


# ==================== MATCH EVENTS & LIVE STATS ====================
class MatchEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fixture_id: str
    event_type: EventType
    minute: int
    added_time: Optional[int] = None
    team: str
    player_name: Optional[str] = None
    player_id: Optional[str] = None
    secondary_player_name: Optional[str] = None
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
    half: int = 1
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


# ==================== STANDING ====================
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
    form: Optional[str] = None

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


# ==================== VENUE ====================
class Venue(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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


# ==================== SEASON ====================
class Season(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
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


# ==================== CLUB PROFILE ====================
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
    # Per-team-type social media (overrides the legacy fields above)
    first_team_facebook: Optional[str] = None
    first_team_instagram: Optional[str] = None
    first_team_twitter: Optional[str] = None
    first_team_youtube: Optional[str] = None
    first_team_tiktok: Optional[str] = None
    academy_facebook: Optional[str] = None
    academy_instagram: Optional[str] = None
    academy_twitter: Optional[str] = None
    academy_youtube: Optional[str] = None
    academy_tiktok: Optional[str] = None


# ==================== NEWS ====================
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


# ==================== CONTACT ====================
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


# ==================== TRANSFER ====================
class Transfer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    player_name: str
    from_team: str
    to_team: str
    transfer_date: str
    transfer_type: str
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


# ==================== GALLERY ====================
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


# ==================== PUSH SUBSCRIPTIONS ====================
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


# ==================== SETTINGS ====================
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


# ==================== SHOP ====================
class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    image_url: str = ""
    category: str = "clothing"
    sizes: list = []
    in_stock: bool = True
    product_type: str = "merchandise"
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

class TicketCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    ticket_type: str = "match"
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

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1
    size: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int

class CartTicketAdd(BaseModel):
    ticket_id: str
    quantity: int = 1

class OrderCreate(BaseModel):
    shipping_name: str
    shipping_address: str
    shipping_city: str
    shipping_postal_code: str
    shipping_phone: str
    notes: Optional[str] = ""


# ==================== CUSTOMER AUTH ====================
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


# ==================== POTM ====================
class PotmVote(BaseModel):
    player_id: str
