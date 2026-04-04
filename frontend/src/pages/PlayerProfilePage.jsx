import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Users, Shield, Target, TrendingUp, Award } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const resolveImg = (url) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
};

// ==================== STAT PROGRESS BAR ====================
const StatBar = ({ label, value, max = 100 }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="mb-4" data-testid={`stat-bar-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-zinc-300 uppercase tracking-wider font-medium">{label}</span>
        <span className="text-xs text-zinc-400">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full bg-[#F5A623] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ==================== PLAYER TAB BAR ====================
const PlayerTabBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Επισκόπηση" },
    { id: "statistics", label: "Στατιστικά" },
    { id: "biography", label: "Βιογραφικό" },
  ];
  return (
    <div className="border-b border-[#262626] bg-[#050505]" data-testid="player-tab-bar">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-4 text-center whitespace-nowrap transition-colors ${
                activeTab === tab.id ? "text-[#F5A623]" : "text-zinc-500 hover:text-zinc-300"
              }`}
              data-testid={`player-tab-${tab.id}`}
            >
              <span className="text-[10px] tracking-[0.2em] uppercase block">Παίκτης</span>
              <span className="font-['Bebas_Neue'] text-lg tracking-wide">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F5A623]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== PLAYER PROFILE PAGE ====================
const PlayerProfilePage = () => {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const [playerRes, galleryRes] = await Promise.all([
          axios.get(`${API}/players/${playerId}`),
          axios.get(`${API}/gallery?player_id=${playerId}`),
        ]);
        setPlayer(playerRes.data);
        setGallery(galleryRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchPlayer();
  }, [playerId]);

  if (loading) return (
    <div className="pt-28 flex items-center justify-center min-h-screen bg-[#050505]">
      <div className="spinner" />
    </div>
  );

  if (!player) return (
    <div className="pt-28 text-center min-h-screen bg-[#050505]">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white">Ο παίκτης δεν βρέθηκε</h2>
      <Link to="/team" className="text-[#F5A623] hover:underline text-sm mt-2 inline-block">Επιστροφή στην ομάδα</Link>
    </div>
  );

  const imgUrl = resolveImg(player.image_url);
  const stats = player.statistics || {};
  const positionGr = { Goalkeeper: "Τερματοφύλακας", Defender: "Αμυντικός", Midfielder: "Μέσος", Forward: "Επιθετικός" };

  // Calculate per-game stats
  const appearances = stats.appearances || 0;
  const goalsPerGame = appearances > 0 ? (stats.goals || 0) / appearances : 0;
  const assistsPerGame = appearances > 0 ? (stats.assists || 0) / appearances : 0;

  // Performance metrics (simple calculations)
  const totalGames = appearances || 1;
  const shotAccuracy = 0; // Would need shot data
  const passAccuracy = 0; // Would need pass data
  const performance = appearances > 0 ? Math.min(((stats.goals || 0) + (stats.assists || 0)) / totalGames * 50, 100) : 0;
  const winRatio = 0; // Would need match-level data

  return (
    <div className="pt-24 min-h-screen bg-[#050505]" data-testid="player-profile-page">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden" data-testid="player-hero">
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=1600)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-[280px_1fr_280px] gap-8 items-end">
            {/* Player Image */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="w-56 h-72 lg:w-full lg:h-80 relative">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={player.name}
                    className="w-full h-full object-cover object-top"
                    data-testid="player-hero-photo"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-zinc-800/50 to-zinc-900/80 flex items-center justify-center">
                    <Users size={80} className="text-zinc-700" />
                  </div>
                )}
              </div>
            </div>

            {/* Player Info (Center) */}
            <div className="text-center lg:text-left pb-4">
              {/* Number + Name */}
              <div className="flex items-start gap-3 justify-center lg:justify-start mb-4">
                <span className="font-['Bebas_Neue'] text-6xl lg:text-7xl text-[#F5A623] leading-none">{player.number}</span>
                <div>
                  <h1 className="font-['Bebas_Neue'] text-3xl lg:text-4xl text-white leading-tight uppercase" data-testid="player-name">
                    {player.name.split(' ').slice(0, -1).join(' ')}
                  </h1>
                  <h1 className="font-['Bebas_Neue'] text-4xl lg:text-5xl text-[#F5A623] leading-tight uppercase">
                    {player.name.split(' ').slice(-1)}
                  </h1>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm mb-6">
                {player.age && (
                  <div><span className="text-[10px] text-[#F5A623] uppercase tracking-wider">Ηλικία</span><div className="text-white font-medium">{player.age}</div></div>
                )}
                {player.date_of_birth && (
                  <div><span className="text-[10px] text-[#F5A623] uppercase tracking-wider">Γέννηση</span><div className="text-white font-medium">{player.date_of_birth}</div></div>
                )}
                <div>
                  <span className="text-[10px] text-[#F5A623] uppercase tracking-wider">Ομάδα</span>
                  <div className="text-white font-medium">{player.team_type === 'First Team' ? "Α' Ομάδα" : player.academy_group_name || "Ακαδημία"}</div>
                </div>
                {player.nationality && (
                  <div><span className="text-[10px] text-[#F5A623] uppercase tracking-wider">Εθνικότητα</span><div className="text-white font-medium">{player.nationality}</div></div>
                )}
                <div>
                  <span className="text-[10px] text-[#F5A623] uppercase tracking-wider">Σεζόν</span>
                  <div className="text-white font-medium">2025/2026</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#F5A623] uppercase tracking-wider">Θέση</span>
                  <div className="text-white font-medium">{positionGr[player.position] || player.position || 'n/a'}</div>
                </div>
              </div>

              {/* Goals/Assists per game indicators */}
              <div className="flex gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full border-2 border-[#F5A623]/40 flex items-center justify-center relative">
                    <svg className="absolute inset-0" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="26" fill="none" stroke="#262626" strokeWidth="2" />
                      <circle cx="28" cy="28" r="26" fill="none" stroke="#F5A623" strokeWidth="2"
                        strokeDasharray={`${goalsPerGame * 163.36} 163.36`}
                        transform="rotate(-90 28 28)" strokeLinecap="round" />
                    </svg>
                    <span className="font-['Bebas_Neue'] text-lg text-[#F5A623]">{(stats.goals || 0)}</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Γκολ</div>
                    <div className="text-[10px] text-[#F5A623]">ανά αγώνα: {goalsPerGame.toFixed(1)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full border-2 border-[#F5A623]/40 flex items-center justify-center relative">
                    <svg className="absolute inset-0" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="26" fill="none" stroke="#262626" strokeWidth="2" />
                      <circle cx="28" cy="28" r="26" fill="none" stroke="#F5A623" strokeWidth="2"
                        strokeDasharray={`${assistsPerGame * 163.36} 163.36`}
                        transform="rotate(-90 28 28)" strokeLinecap="round" />
                    </svg>
                    <span className="font-['Bebas_Neue'] text-lg text-[#F5A623]">{(stats.assists || 0)}</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Ασίστ</div>
                    <div className="text-[10px] text-[#F5A623]">ανά αγώνα: {assistsPerGame.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Stat Bars */}
            <div className="hidden lg:block pb-4" data-testid="player-stat-bars">
              <StatBar label="Συμμετοχές" value={appearances} max={Math.max(appearances, 30)} />
              <StatBar label="Απόδοση" value={performance} max={100} />
              <StatBar label="Γκολ" value={stats.goals || 0} max={Math.max(stats.goals || 0, 15)} />
              <StatBar label="Ασίστ" value={stats.assists || 0} max={Math.max(stats.assists || 0, 10)} />
              <StatBar label="Λεπτά" value={stats.minutes_played || 0} max={Math.max(stats.minutes_played || 0, 2700)} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <PlayerTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {activeTab === "overview" && (
          <div data-testid="player-overview-tab">
            {/* Bio text */}
            {player.bio ? (
              <div className="mb-8">
                <p className="text-zinc-400 text-sm leading-relaxed">{player.bio}</p>
              </div>
            ) : (
              <div className="mb-8">
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {player.name} αγωνίζεται στη θέση {positionGr[player.position] || player.position} 
                  στην {player.team_type === 'First Team' ? "Α' Ομάδα" : "Ακαδημία"} της LEFTERIA FC, 
                  δείχνοντας αφοσίωση και πάθος σε κάθε προπόνηση και αγώνα.
                </p>
              </div>
            )}

            {/* Key Attributes */}
            <div className="mb-8">
              <h3 className="text-sm text-zinc-300 font-medium mb-4">Βασικά Χαρακτηριστικά:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                  <div><span className="text-white text-sm font-medium">Θέση:</span> <span className="text-zinc-400 text-sm">{positionGr[player.position] || player.position || 'Ευέλικτη θέση'}</span></div>
                </div>
                {player.preferred_foot && (
                  <div className="flex items-start gap-3">
                    <TrendingUp size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <div><span className="text-white text-sm font-medium">Προτιμώμενο πόδι:</span> <span className="text-zinc-400 text-sm">{player.preferred_foot === 'Right' ? 'Δεξί' : player.preferred_foot === 'Left' ? 'Αριστερό' : 'Αμφίπλευρο'}</span></div>
                  </div>
                )}
                {player.height && (
                  <div className="flex items-start gap-3">
                    <Award size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <div><span className="text-white text-sm font-medium">Ύψος:</span> <span className="text-zinc-400 text-sm">{player.height}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile stat bars (visible on smaller screens) */}
            <div className="lg:hidden mb-8 card p-5" data-testid="player-stat-bars-mobile">
              <h3 className="font-['Bebas_Neue'] text-lg text-white mb-4">Στατιστικά</h3>
              <StatBar label="Συμμετοχές" value={appearances} max={Math.max(appearances, 30)} />
              <StatBar label="Απόδοση" value={performance} max={100} />
              <StatBar label="Γκολ" value={stats.goals || 0} max={Math.max(stats.goals || 0, 15)} />
              <StatBar label="Ασίστ" value={stats.assists || 0} max={Math.max(stats.assists || 0, 10)} />
              <StatBar label="Λεπτά" value={stats.minutes_played || 0} max={Math.max(stats.minutes_played || 0, 2700)} />
            </div>

            {/* Previous Clubs */}
            {player.previous_clubs && player.previous_clubs.length > 0 && (
              <div>
                <h3 className="font-['Bebas_Neue'] text-lg text-white mb-3">Προηγούμενοι Σύλλογοι</h3>
                <div className="space-y-2">
                  {player.previous_clubs.map((club, i) => (
                    <div key={i} className="card p-4 flex justify-between items-center">
                      <span className="text-white font-medium text-sm">{club.club_name}</span>
                      <span className="text-zinc-500 text-xs">{club.from_year} - {club.to_year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player Gallery */}
            {gallery.length > 0 && (
              <div data-testid="player-gallery-section">
                <h3 className="font-['Bebas_Neue'] text-lg text-white mb-3">Φωτογραφίες</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {gallery.map(item => (
                    <div key={item.id} className="aspect-square overflow-hidden bg-[#1a1a1a] rounded">
                      <img src={resolveImg(item.image_url)} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "statistics" && (
          <div data-testid="player-statistics-tab">
            <h2 className="font-['Bebas_Neue'] text-xl text-white mb-6">Πλήρη Στατιστικά — Σεζόν 2025/26</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Συμμετοχές", value: stats.appearances || 0 },
                { label: "Γκολ", value: stats.goals || 0 },
                { label: "Ασίστ", value: stats.assists || 0 },
                { label: "Κίτρινες", value: stats.yellow_cards || 0 },
                { label: "Κόκκινες", value: stats.red_cards || 0 },
                { label: "Λεπτά", value: stats.minutes_played || 0 },
                { label: "Clean Sheets", value: stats.clean_sheets || 0 },
                { label: "Γκολ/Αγώνα", value: goalsPerGame.toFixed(2) },
              ].map((s, i) => (
                <div key={i} className="card p-5 text-center" data-testid={`stat-card-${s.label.toLowerCase().replace(/[\s/]/g, '-')}`}>
                  <div className="font-['Bebas_Neue'] text-3xl text-[#F5A623]">{s.value}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Full stat bars */}
            <div className="card p-6">
              <h3 className="font-['Bebas_Neue'] text-lg text-white mb-4">Δείκτες Απόδοσης</h3>
              <StatBar label="Συμμετοχές" value={appearances} max={Math.max(appearances, 30)} />
              <StatBar label="Γκολ" value={stats.goals || 0} max={Math.max(stats.goals || 0, 15)} />
              <StatBar label="Ασίστ" value={stats.assists || 0} max={Math.max(stats.assists || 0, 10)} />
              <StatBar label="Κίτρινες Κάρτες" value={stats.yellow_cards || 0} max={Math.max(stats.yellow_cards || 0, 10)} />
              <StatBar label="Λεπτά Αγώνα" value={stats.minutes_played || 0} max={Math.max(stats.minutes_played || 0, 2700)} />
            </div>
          </div>
        )}

        {activeTab === "biography" && (
          <div data-testid="player-biography-tab">
            <h2 className="font-['Bebas_Neue'] text-xl text-white mb-6">Βιογραφικό</h2>

            {/* Info details */}
            <div className="card p-6 mb-6">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Ονοματεπώνυμο</span><span className="text-white">{player.name}</span></div>
                {player.date_of_birth && <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Ημ. Γέννησης</span><span className="text-white">{player.date_of_birth}</span></div>}
                {player.nationality && <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Εθνικότητα</span><span className="text-white">{player.nationality}</span></div>}
                {player.height && <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Ύψος</span><span className="text-white">{player.height}</span></div>}
                {player.weight && <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Βάρος</span><span className="text-white">{player.weight}</span></div>}
                {player.preferred_foot && <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Πόδι</span><span className="text-white">{player.preferred_foot === 'Right' ? 'Δεξί' : player.preferred_foot === 'Left' ? 'Αριστερό' : 'Αμφίπλευρο'}</span></div>}
                <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Αριθμός</span><span className="text-[#F5A623] font-bold">{player.number}</span></div>
                <div className="flex justify-between border-b border-[#1e1e1e] pb-2"><span className="text-zinc-500">Θέση</span><span className="text-white">{positionGr[player.position] || player.position}</span></div>
              </div>
            </div>

            {/* Bio text */}
            {player.bio && (
              <div className="card p-6 mb-6">
                <p className="text-zinc-400 text-sm leading-relaxed">{player.bio}</p>
              </div>
            )}

            {/* Previous Clubs */}
            {player.previous_clubs && player.previous_clubs.length > 0 && (
              <div>
                <h3 className="font-['Bebas_Neue'] text-lg text-white mb-3">Προηγούμενοι Σύλλογοι</h3>
                <div className="space-y-2">
                  {player.previous_clubs.map((club, i) => (
                    <div key={i} className="card p-4 flex justify-between items-center">
                      <span className="text-white font-medium text-sm">{club.club_name}</span>
                      <span className="text-zinc-500 text-xs">{club.from_year} - {club.to_year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back to team link */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <Link to="/team" className="text-zinc-500 hover:text-[#F5A623] text-sm flex items-center gap-1 transition-colors" data-testid="back-to-team">
          <ChevronRight size={14} className="rotate-180" /> Επιστροφή στην Ομάδα
        </Link>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
