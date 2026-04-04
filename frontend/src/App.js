import { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import axios from "axios";
import { Menu, X, Trophy, Users, Calendar, Newspaper, Mail, Shield, ChevronRight, MapPin, Clock, Home as HomeIcon, Info, GraduationCap, Settings, ChevronDown, Phone, Facebook, Twitter, Instagram, Youtube, ArrowRight, Star, Target, Heart, Lock, LogOut, Eye, EyeOff } from "lucide-react";
import AdminPanel from "./pages/AdminPanel";
import TeamHubPage from "./pages/TeamHubPage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import { playGoalSound, sendBrowserNotification, requestNotificationPermission } from "./utils/sounds";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not auth, object = auth
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(false);
        setLoading(false);
        return;
      }
      
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem("token");
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post(`${API}/auth/login`, { username, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (e) {}
    localStorage.removeItem("token");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

// ==================== COMPONENTS ====================

// Navigation (Admin removed)
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { path: "/", label: "Αρχική", icon: HomeIcon },
    { path: "/about", label: "Σχετικά", icon: Info },
    { path: "/team", label: "Ομάδα", icon: Users },
    { path: "/academy", label: "Ακαδημία", icon: GraduationCap },
    { path: "/fixtures", label: "Αγώνες", icon: Calendar },
    { path: "/news", label: "Νέα", icon: Newspaper },
    { path: "/contact", label: "Επικοινωνία", icon: Mail },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-black/90 border-b border-white/10" : "bg-transparent"
      }`}
      data-testid="main-navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <img src={CLUB_LOGO} alt="Lefteria FC" className="h-16 w-16 object-contain" />
            <div className="hidden sm:block">
              <span className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">LEFTERIA FC</span>
              <span className="block text-sm text-[#F5A623] tracking-widest">ΛΕΥΤΕΡΙΑ</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link font-['Bebas_Neue'] text-lg tracking-wider ${
                  location.pathname === link.path ? "text-[#F5A623] active" : "text-white"
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2"
            data-testid="mobile-menu-toggle"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 top-[72px] bg-black/95 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        data-testid="mobile-menu"
      >
        <nav className="flex flex-col p-6 gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-4 py-4 border-b border-white/10 font-['Bebas_Neue'] text-2xl tracking-wider ${
                location.pathname === link.path ? "text-[#F5A623]" : "text-white"
              }`}
            >
              <link.icon size={24} />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

// Footer
const Footer = () => (
  <footer className="bg-[#0a0a0a] border-t border-[#262626]" data-testid="footer">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Club Info */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <img src={CLUB_LOGO} alt="Lefteria FC" className="h-20 w-20 object-contain" />
            <div>
              <span className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">LEFTERIA FC</span>
              <span className="block text-sm text-[#F5A623] tracking-widest">EST. 2024</span>
            </div>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Dedicated to excellence on and off the pitch. Building champions through passion, discipline, and teamwork.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Γρήγοροι Σύνδεσμοι</h4>
          <ul className="space-y-3">
            {[
              { name: "Πρώτη Ομάδα", path: "/team" },
              { name: "Ακαδημία", path: "/academy" },
              { name: "Αγώνες", path: "/fixtures" },
              { name: "Πρόγραμμα", path: "/team?tab=schedule" },
              { name: "Γήπεδα", path: "/team?tab=venues" },
              { name: "Νέα", path: "/news" },
              { name: "Επικοινωνία", path: "/contact" },
            ].map((item) => (
              <li key={item.name}>
                <Link 
                  to={item.path} 
                  className="text-zinc-400 hover:text-[#F5A623] transition-colors text-sm flex items-center gap-2"
                >
                  <ChevronRight size={14} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Επικοινωνία</h4>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex items-center gap-3">
              <MapPin size={16} className="text-[#F5A623]" />
              Λεμεσός, Κύπρος
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-[#F5A623]" />
              info@lefteriafc.cy
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Ακολούθησέ μας</h4>
          <div className="flex gap-4">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 bg-[#1F1F1F] border border-[#262626] flex items-center justify-center hover:bg-[#F5A623] hover:border-[#F5A623] hover:text-black transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[#262626] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-zinc-500 text-sm">© 2024 LEFTERIA FC. Με επιφύλαξη κάθε δικαιώματος.</p>
      </div>
    </div>
  </footer>
);

// Loading Component
const Loading = () => (
  <div className="flex items-center justify-center min-h-[400px]" data-testid="loading">
    <div className="spinner"></div>
  </div>
);

// ==================== PAGES ====================

// Home Page
const HomePage = () => {
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [news, setNews] = useState([]);
  const [liveMatch, setLiveMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevScore, setPrevScore] = useState(null);

  const fetchLive = async () => {
    try {
      const res = await axios.get(`${API}/live-match`);
      if (res.data.active) {
        const newScore = `${res.data.fixture.home_score}-${res.data.fixture.away_score}`;
        // Play goal sound if score changed
        if (prevScore && prevScore !== newScore) {
          playGoalSound();
          sendBrowserNotification(
            "ΓΚΟΟΟΛ!",
            `${res.data.fixture.home_team} ${res.data.fixture.home_score} - ${res.data.fixture.away_score} ${res.data.fixture.away_team}`,
            CLUB_LOGO
          );
        }
        setPrevScore(newScore);
        setLiveMatch(res.data);
      } else {
        setLiveMatch(null);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Seed data first
        await axios.post(`${API}/seed`);
        
        const [fixturesRes, standingsRes, newsRes, liveRes] = await Promise.all([
          axios.get(`${API}/fixtures?limit=5`),
          axios.get(`${API}/standings`),
          axios.get(`${API}/news?limit=3`),
          axios.get(`${API}/live-match`),
        ]);
        setFixtures(fixturesRes.data);
        setStandings(standingsRes.data);
        setNews(newsRes.data);
        if (liveRes.data.active) setLiveMatch(liveRes.data);
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Auto-refresh live match every 30 seconds
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1765130729366-b54d7b2c8ea2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHw0fHxmb290YmFsbCUyMG1hdGNoJTIwc3RhZGl1bSUyMG5pZ2h0fGVufDB8fHx8MTc3NTMwODYzNnww&ixlib=rb-4.1.0&q=85)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="hero-section"
      >
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-3xl">
            <span className="badge badge-primary mb-6 animate-fadeInUp">Ιδρ. 2024</span>
            <h1 className="font-['Bebas_Neue'] text-6xl md:text-7xl lg:text-8xl text-white mb-6 animate-fadeInUp animation-delay-200">
              Καλώς Ήρθατε στην<br/>
              <span className="text-[#F5A623]">LEFTERIA FC</span>
            </h1>
            <p className="text-xl text-zinc-300 mb-8 animate-fadeInUp animation-delay-400 max-w-xl">
              Χτίζουμε πρωταθλητές μέσα από το πάθος, την πειθαρχία και την ομαδικότητα. Ελάτε μαζί μας στο ταξίδι προς την κορυφή.
            </p>
            <div className="flex flex-wrap gap-4 animate-fadeInUp animation-delay-600">
              <Link to="/team" className="btn-primary" data-testid="hero-view-team">
                Δες την Ομάδα
                <ArrowRight size={18} />
              </Link>
              <Link to="/academy" className="btn-secondary" data-testid="hero-join-academy">
                Ακαδημία
              </Link>
            </div>
          </div>
        </div>

        {/* Live Match Widget */}
        {liveMatch && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4" data-testid="live-match-widget">
            <div className="bg-black/90 backdrop-blur-xl border border-red-500/30 rounded-lg p-5 shadow-2xl cursor-pointer" onClick={requestNotificationPermission}>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {liveMatch.fixture.status === 'Half Time' ? 'ΗΜΙΧΡΟΝΟ' : 'LIVE'}
                  {liveMatch.stats?.match_minute ? ` ${liveMatch.stats.match_minute}'` : ''}
                </span>
                <span className="text-[10px] text-zinc-500">{liveMatch.fixture.competition}</span>
              </div>
              <div className="flex items-center justify-center gap-5">
                <div className="flex-1 text-right">
                  <span className={`font-['Bebas_Neue'] text-xl ${liveMatch.fixture.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>
                    {liveMatch.fixture.home_team}
                  </span>
                </div>
                <div className="bg-[#111] rounded-lg px-4 py-2">
                  <span className="font-['Bebas_Neue'] text-3xl text-white">
                    {liveMatch.fixture.home_score ?? 0} <span className="text-zinc-600">:</span> {liveMatch.fixture.away_score ?? 0}
                  </span>
                </div>
                <div className="flex-1">
                  <span className={`font-['Bebas_Neue'] text-xl ${liveMatch.fixture.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>
                    {liveMatch.fixture.away_team}
                  </span>
                </div>
              </div>
              {/* Goal scorers */}
              {liveMatch.events && liveMatch.events.filter(e => ['goal', 'penalty_scored', 'own_goal'].includes(e.event_type)).length > 0 && (
                <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
                  <div className="flex-1 text-right pr-6 space-y-0.5">
                    {liveMatch.events.filter(e => e.team === 'home' && ['goal', 'penalty_scored'].includes(e.event_type)).map((e, i) => (
                      <div key={i} className="text-xs text-zinc-400">{e.player_name} <span className="text-zinc-600">{e.minute}'</span></div>
                    ))}
                  </div>
                  <div className="flex-1 pl-6 space-y-0.5">
                    {liveMatch.events.filter(e => e.team === 'away' && ['goal', 'penalty_scored'].includes(e.event_type)).map((e, i) => (
                      <div key={i} className="text-xs text-zinc-400"><span className="text-zinc-600">{e.minute}'</span> {e.player_name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Θέση Πρωταθλήματος", value: "3η" },
              { label: "Αγώνες", value: "18" },
              { label: "Γκολ", value: "60" },
              { label: "Βαθμοί", value: "41" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-['Bebas_Neue'] text-3xl md:text-4xl text-[#F5A623]">{stat.value}</div>
                <div className="text-sm text-zinc-400 tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Fixtures */}
      <section className="py-20 px-6 bg-[#050505]" data-testid="fixtures-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="badge badge-secondary mb-4">Πρόγραμμα</span>
              <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white section-heading">
                Τελευταίοι Αγώνες
              </h2>
            </div>
            <Link to="/fixtures" className="hidden md:flex items-center gap-2 text-[#F5A623] hover:underline">
              Όλοι οι Αγώνες <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4">
            {fixtures.slice(0, 4).map((fixture) => (
              <div 
                key={fixture.id} 
                className={`card p-6 fixture-card ${fixture.status === 'Live' ? 'live' : ''}`}
                data-testid={`fixture-${fixture.id}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                    <span className="badge badge-secondary">{fixture.competition}</span>
                    <span className="text-zinc-400 text-sm">
                      {new Date(fixture.match_date).toLocaleDateString('en-GB', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 justify-center flex-1">
                    <span className={`font-['Bebas_Neue'] text-xl ${fixture.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>
                      {fixture.home_team}
                    </span>
                    <div className="match-score bg-[#1F1F1F] px-4 py-2">
                      {fixture.status === 'Completed' ? (
                        `${fixture.home_score} - ${fixture.away_score}`
                      ) : (
                        <span className="text-zinc-400 text-lg">VS</span>
                      )}
                    </div>
                    <span className={`font-['Bebas_Neue'] text-xl ${fixture.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>
                      {fixture.away_team}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end min-w-[150px]">
                    <MapPin size={16} className="text-zinc-500" />
                    <span className="text-zinc-400 text-sm">{fixture.venue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* League Table */}
      <section className="py-20 px-6 bg-[#0a0a0a]" data-testid="standings-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Standings Table */}
            <div>
              <span className="badge badge-secondary mb-4">ΠΑΑΟΚ Α' Όμιλος</span>
              <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white section-heading mb-8">
                Βαθμολογία
              </h2>
              
              <div className="overflow-x-auto">
                <table className="standings-table" data-testid="standings-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>D</th>
                      <th>L</th>
                      <th>GD</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, idx) => (
                      <tr 
                        key={team.id} 
                        className={team.team_name === 'LEFTERIA FC' ? 'team-highlight' : ''}
                      >
                        <td className="font-bold">{idx + 1}</td>
                        <td className="font-semibold">
                          <div className="flex items-center gap-2">
                            {team.team_logo && <img src={team.team_logo} alt="" className="w-5 h-5 object-contain" />}
                            <span>{team.team_name}</span>
                          </div>
                        </td>
                        <td>{team.played}</td>
                        <td>{team.won}</td>
                        <td>{team.drawn}</td>
                        <td>{team.lost}</td>
                        <td className={team.goal_difference > 0 ? 'text-green-500' : team.goal_difference < 0 ? 'text-red-500' : ''}>
                          {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                        </td>
                        <td className="font-bold text-[#F5A623]">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Latest News */}
            <div>
              <span className="badge badge-secondary mb-4">Ενημέρωση</span>
              <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white section-heading mb-8">
                Τελευταία Νέα
              </h2>
              
              <div className="space-y-6">
                {news.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/news/${item.id}`}
                    className="card block group news-card overflow-hidden"
                    data-testid={`news-${item.id}`}
                  >
                    <div className="flex gap-4">
                      {item.image_url && (
                        <div className="w-32 h-24 flex-shrink-0 overflow-hidden">
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1">
                        <span className="text-xs text-[#F5A623] tracking-wider uppercase">{item.category}</span>
                        <h3 className="font-['Bebas_Neue'] text-xl text-white group-hover:text-[#F5A623] transition-colors mt-1">
                          {item.title}
                        </h3>
                        <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{item.excerpt}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link to="/news" className="flex items-center gap-2 text-[#F5A623] hover:underline mt-4">
                  Όλα τα Νέα <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academy CTA */}
      <section 
        className="py-24 px-6 relative"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1622659097574-c814ee26068e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHw0fHx5b3V0aCUyMGtpZHMlMjBwbGF5aW5nJTIwZm9vdGJhbGwlMjBzb2NjZXJ8ZW58MHx8fHwxNzc1MzA4NjM2fDA&ixlib=rb-4.1.0&q=85)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="academy-cta"
      >
        <div className="absolute inset-0 bg-black/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="badge badge-primary mb-6">Ανάπτυξη Νέων</span>
          <h2 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white mb-6">
            Έλα στην <span className="text-[#F5A623]">Ακαδημία</span>
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Από U8 έως U18, η ακαδημία μας αναπτύσσει νέα ταλέντα με προπονητές και εγκαταστάσεις υψηλού επιπέδου. 
            Ξεκίνα το ταξίδι σου για να γίνεις επαγγελματίας ποδοσφαιριστής.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/academy" className="btn-primary">
              Εξερεύνησε την Ακαδημία <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn-secondary">
              Δήλωσε Ενδιαφέρον
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// About Page
const AboutPage = () => (
  <div className="pt-24 min-h-screen" data-testid="about-page">
    {/* Hero */}
    <section className="py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <span className="badge badge-secondary mb-4">Η Ιστορία μας</span>
        <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
          Σχετικά με την <span className="text-[#F5A623]">LEFTERIA FC</span>
        </h1>
        <p className="text-xl text-zinc-300 max-w-3xl">
          Ιδρύθηκε το 2024, η ΛΕΥΤΕΡΙΑ FC ενσαρκώνει το πνεύμα του πάθους, της αριστείας 
          και της κοινότητας στο κυπριακό ποδόσφαιρο.
        </p>
      </div>
    </section>

    {/* History */}
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">Η Ιστορία μας</h2>
          <div className="space-y-4 text-zinc-300">
            <p>
              Η LEFTERIA FC ιδρύθηκε με όραμα να δημιουργήσει έναν ποδοσφαιρικό σύλλογο που συνδυάζει 
              την επαγγελματική αριστεία με τις κοινοτικές αξίες. Το περιστέρι στο έμβλημά μας 
              συμβολίζει την ελευθερία και την ειρήνη, ενώ το στεφάνι δάφνης αντιπροσωπεύει 
              τη νίκη και το επίτευγμα.
            </p>
            <p>
              Με έδρα τη Λεμεσό της Κύπρου, αγωνιζόμαστε στον Α' Όμιλο του ΠΑΑΟΚ και έχουμε 
              καθιερωθεί γρήγορα ως μια ανταγωνιστική δύναμη, κατέχοντας την 3η θέση στη βαθμολογία 
              με εντυπωσιακό ρεκόρ 13 νικών, 2 ισοπαλιών και μόλις 3 ηττών.
            </p>
            <p>
              Το όνομά μας "ΛΕΥΤΕΡΙΑ" σημαίνει "Ελευθερία" στα ελληνικά, αντιπροσωπεύοντας τη 
              φιλοσοφία μας για ελεύθερο, επιθετικό ποδόσφαιρο και την ελευθερία που δίνουμε 
              στους παίκτες μας να εκφραστούν.
            </p>
          </div>
        </div>
        <div className="relative">
          <img 
            src={CLUB_LOGO} 
            alt="LEFTERIA FC Crest" 
            className="w-full max-w-md mx-auto"
          />
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-12 text-center">Οι Αξίες μας</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Trophy, title: "Αριστεία", desc: "Επιδιώκουμε την αριστεία σε όλα όσα κάνουμε, εντός και εκτός γηπέδου." },
            { icon: Heart, title: "Πάθος", desc: "Το ποδόσφαιρο είναι περισσότερο από ένα παιχνίδι - είναι το πάθος και ο τρόπος ζωής μας." },
            { icon: Target, title: "Φιλοδοξία", desc: "Θέτουμε υψηλούς στόχους και εργαζόμαστε ακούραστα για να τους επιτύχουμε." },
          ].map((value, i) => (
            <div key={i} className="card p-8 text-center">
              <value.icon size={48} className="text-[#F5A623] mx-auto mb-4" />
              <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-3">{value.title}</h3>
              <p className="text-zinc-400">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Stadium */}
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge badge-secondary mb-4">Έδρα</span>
            <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">Γήπεδο Αετού</h2>
            <div className="space-y-4 text-zinc-300">
              <p>
                Η έδρα μας, το Γήπεδο Αετού, βρίσκεται στην καρδιά της Λεμεσού. 
                Το γήπεδο διαθέτει σύγχρονες εγκαταστάσεις και φιλοξενεί τους 
                εντός έδρας αγώνες της ομάδας μας.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>Φυσικός χλοοτάπητας</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>Σύγχρονες προπονητικές εγκαταστάσεις</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>Αποδυτήρια υψηλών προδιαγραφών</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>Χώροι φιλοξενίας θεατών</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="aspect-video bg-[#1F1F1F] rounded-none overflow-hidden">
            <img 
              src="https://lefteriafc.cy/images/2026/02/22/639112112_122172212540791287_1953686296477132728_n.jpg"
              alt="Stadium"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
);

// Team Page
// Academy Page
const AcademyPage = () => {
  const [academyInfo, setAcademyInfo] = useState([]);
  const [academyPlayers, setAcademyPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, playersRes] = await Promise.all([
          axios.get(`${API}/academy-groups`),
          axios.get(`${API}/players?team_type=Academy`),
        ]);
        setAcademyInfo(infoRes.data);
        setAcademyPlayers(playersRes.data);
      } catch (e) {
        console.error("Error fetching academy data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="pt-24 min-h-screen" data-testid="academy-page">
      {/* Hero */}
      <section 
        className="py-32 px-6 relative"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1622659097574-c814ee26068e?w=1600)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <span className="badge badge-primary mb-4">Ανάπτυξη Νέων</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            LEFTERIA FC <span className="text-[#F5A623]">Ακαδημία</span>
          </h1>
          <p className="text-xl text-zinc-300 max-w-3xl">
            Αναπτύσσουμε την επόμενη γενιά ταλέντων του κυπριακού ποδοσφαίρου μέσω 
            κορυφαίας προπόνησης, εγκαταστάσεων και πορείας προς τον επαγγελματισμό.
          </p>
        </div>
      </section>

      {/* Age Groups */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-12 section-heading">Ηλικιακές Κατηγορίες</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {academyInfo.map((group) => (
              <div key={group.id} className="card p-6" data-testid={`academy-${group.name}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-['Bebas_Neue'] text-4xl text-[#F5A623]">{group.name}</span>
                  <span className="badge badge-secondary">{group.age_range}</span>
                </div>
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-2">Προπονητής: {group.coach_name}</h3>
                <p className="text-zinc-400 text-sm mb-4">{group.description}</p>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Clock size={14} />
                  <span>{group.training_schedule}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#262626]">
                  <span className="text-xs text-zinc-500">Σεζόν {group.season}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academy Philosophy */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge badge-secondary mb-4">Φιλοσοφία</span>
              <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">
                Η Αναπτυξιακή μας Φιλοσοφία
              </h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  Στην Ακαδημία της LEFTERIA FC πιστεύουμε στην ολιστική ανάπτυξη των παικτών. 
                  Το πρόγραμμά μας εστιάζει όχι μόνο στις τεχνικές δεξιότητες, αλλά και στην 
                  τακτική κατανόηση, τη φυσική κατάσταση και την ψυχική ανθεκτικότητα.
                </p>
                <ul className="space-y-3">
                  {[
                    "Ατομική ανάπτυξη πάνω από τα αποτελέσματα σε επίπεδο νέων",
                    "Μεθοδολογίες προπόνησης ανάλογα με την ηλικία",
                    "Ισορροπία εκπαίδευσης και ποδοσφαίρου",
                    "Σαφής πορεία προς την πρώτη ομάδα",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <ChevronRight className="text-[#F5A623] flex-shrink-0" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-6">
              {academyInfo.map(group => {
                const groupPlayers = academyPlayers.filter(p => p.academy_group_id === group.id || p.academy_group_name === group.name);
                return (
                  <div key={group.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-['Bebas_Neue'] text-lg text-[#F5A623]">{group.name}</span>
                      <span className="text-xs text-zinc-500">({group.age_range})</span>
                      <span className="text-xs text-zinc-600">| {group.coach_name}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {groupPlayers.map(player => (
                        <Link to={`/player/${player.id}`} key={player.id} className="card p-4 hover:border-[#F5A623]/30 transition-colors" data-testid={`academy-player-${player.id}`}>
                          <span className="text-xs text-[#F5A623] tracking-wider">{player.position === 'Goalkeeper' ? 'Τερμ.' : player.position === 'Defender' ? 'Αμυν.' : player.position === 'Midfielder' ? 'Μέσος' : 'Επιθ.'}</span>
                          <h4 className="font-['Bebas_Neue'] text-lg text-white">{player.name}</h4>
                          {player.age && <span className="text-zinc-500 text-sm">{player.age} ετών</span>}
                        </Link>
                      ))}
                      {groupPlayers.length === 0 && <p className="text-zinc-600 text-sm col-span-3">Δεν υπάρχουν παίκτες</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6">
            Έτοιμος να Ξεκινήσεις το Ταξίδι σου;
          </h2>
          <p className="text-zinc-300 mb-8">
            Γίνε μέλος της Ακαδημίας LEFTERIA FC και κάνε το πρώτο βήμα για να γίνεις επαγγελματίας ποδοσφαιριστής.
          </p>
          <Link to="/contact" className="btn-primary">
            Δήλωσε Συμμετοχή για Δοκιμαστικά <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

// Fixtures Page
const FixturesPage = () => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const res = await axios.get(`${API}/fixtures?limit=50`);
        setFixtures(res.data);
      } catch (e) {
        console.error("Error fetching fixtures:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, []);

  const filteredFixtures = filter === "all" 
    ? fixtures 
    : fixtures.filter(f => f.status === filter);

  if (loading) return <Loading />;

  return (
    <div className="pt-24 min-h-screen" data-testid="fixtures-page">
      {/* Hero */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Σεζόν 2025/26</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            Αγώνες & <span className="text-[#F5A623]">Αποτελέσματα</span>
          </h1>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 px-6 border-b border-[#262626]">
        <div className="max-w-7xl mx-auto">
          <div className="tab-list flex-wrap">
            {[
              { value: "all", label: "Όλοι οι Αγώνες" },
              { value: "Scheduled", label: "Προγραμματισμένοι" },
              { value: "Completed", label: "Ολοκληρωμένοι" }
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={`tab-item ${filter === status.value ? 'active' : ''}`}
                data-testid={`filter-${status.value}`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Fixtures List */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {filteredFixtures.map((fixture) => (
            <div 
              key={fixture.id} 
              className={`card p-6 fixture-card ${fixture.status === 'Live' ? 'live' : ''}`}
              data-testid={`fixture-item-${fixture.id}`}
            >
              <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center">
                {/* Home Team */}
                <div className="text-center md:text-right">
                  <h3 className={`font-['Bebas_Neue'] text-2xl ${
                    fixture.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'
                  }`}>
                    {fixture.home_team}
                  </h3>
                  {fixture.home_team === 'LEFTERIA FC' && (
                    <span className="text-xs text-zinc-500">ΕΝΤΟΣ</span>
                  )}
                </div>

                {/* Score */}
                <div className="text-center">
                  <div className="match-score bg-[#1F1F1F] px-6 py-3 inline-block">
                    {fixture.status === 'Completed' ? (
                      <span className="text-3xl">{fixture.home_score} - {fixture.away_score}</span>
                    ) : fixture.status === 'Live' ? (
                      <span className="text-3xl text-[#F5A623]">{fixture.home_score || 0} - {fixture.away_score || 0}</span>
                    ) : (
                      <span className="text-xl text-zinc-400">
                        {new Date(fixture.match_date).toLocaleTimeString('el-GR', { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-zinc-500">
                    {new Date(fixture.match_date).toLocaleDateString('el-GR', { 
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center md:text-left">
                  <h3 className={`font-['Bebas_Neue'] text-2xl ${
                    fixture.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'
                  }`}>
                    {fixture.away_team}
                  </h3>
                  {fixture.away_team === 'LEFTERIA FC' && (
                    <span className="text-xs text-zinc-500">ΕΚΤΟΣ</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#262626] flex flex-wrap gap-4 justify-between items-center text-sm">
                <div className="flex items-center gap-4">
                  <span className="badge badge-secondary">{fixture.competition}</span>
                  <span className={`badge ${
                    fixture.status === 'Completed' ? 'bg-green-900/50 text-green-400' : 
                    fixture.status === 'Live' ? 'bg-red-900/50 text-red-400' : 
                    'badge-secondary'
                  }`}>
                    {fixture.status === 'Completed' ? 'Ολοκληρώθηκε' : 
                     fixture.status === 'Scheduled' ? 'Προγραμματισμένος' : fixture.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <MapPin size={14} />
                  <span>{fixture.venue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// News Page
const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get(`${API}/news?limit=20`);
        setNews(res.data);
      } catch (e) {
        console.error("Error fetching news:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <Loading />;

  const featuredNews = news.find(n => n.is_featured);
  const otherNews = news.filter(n => !n.is_featured || n.id !== featuredNews?.id);

  return (
    <div className="pt-24 min-h-screen" data-testid="news-page">
      {/* Hero */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Τελευταία Ενημέρωση</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            Τα <span className="text-[#F5A623]">Νέα</span> μας
          </h1>
        </div>
      </section>

      {/* Featured */}
      {featuredNews && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div 
              className="card group cursor-pointer overflow-hidden"
              data-testid={`featured-news-${featuredNews.id}`}
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto overflow-hidden">
                  <img 
                    src={featuredNews.image_url || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"} 
                    alt={featuredNews.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <span className="badge badge-primary mb-4 self-start">Προτεινόμενο</span>
                  <span className="text-sm text-[#F5A623] tracking-wider uppercase mb-2">{featuredNews.category}</span>
                  <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white group-hover:text-[#F5A623] transition-colors mb-4">
                    {featuredNews.title}
                  </h2>
                  <p className="text-zinc-400 mb-6">{featuredNews.excerpt}</p>
                  <span className="text-zinc-500 text-sm">
                    {new Date(featuredNews.created_at).toLocaleDateString('el-GR', { 
                      day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* News Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherNews.map((item) => (
              <div 
                key={item.id} 
                className="card group cursor-pointer news-card overflow-hidden"
                data-testid={`news-item-${item.id}`}
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={item.image_url || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs text-[#F5A623] tracking-wider uppercase">{item.category}</span>
                  <h3 className="font-['Bebas_Neue'] text-xl text-white group-hover:text-[#F5A623] transition-colors mt-2 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-2 mb-4">{item.excerpt}</p>
                  <span className="text-zinc-500 text-xs">
                    {new Date(item.created_at).toLocaleDateString('el-GR', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Contact Page
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen" data-testid="contact-page">
      {/* Hero */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Επικοινωνήστε Μαζί Μας</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            <span className="text-[#F5A623]">Επικοινωνία</span>
          </h1>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8 section-heading">
                Πληροφορίες Συλλόγου
              </h2>
              <div className="space-y-6">
                <div className="card p-6 flex items-start gap-4">
                  <MapPin className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Διεύθυνση</h3>
                    <p className="text-zinc-400">Γήπεδο Αετού<br/>Λεμεσός, Κύπρος</p>
                  </div>
                </div>
                <div className="card p-6 flex items-start gap-4">
                  <Mail className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Email</h3>
                    <p className="text-zinc-400">info@lefteriafc.cy</p>
                  </div>
                </div>
                <div className="card p-6 flex items-start gap-4">
                  <Clock className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Ώρες Γραφείου</h3>
                    <p className="text-zinc-400">Δευτέρα - Παρασκευή: 9:00 - 18:00<br/>Σάββατο: 10:00 - 14:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8 section-heading">
                Στείλτε Μήνυμα
              </h2>
              
              {submitted ? (
                <div className="card p-8 text-center" data-testid="contact-success">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChevronRight className="text-green-500" size={32} />
                  </div>
                  <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-2">Το Μήνυμα Εστάλη!</h3>
                  <p className="text-zinc-400">Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary mt-6"
                  >
                    Στείλε Άλλο Μήνυμα
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Όνομα</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Εισάγετε το όνομά σας"
                      required
                      data-testid="contact-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Εισάγετε το email σας"
                      required
                      data-testid="contact-email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Θέμα</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      data-testid="contact-subject"
                    >
                      <option value="">Επιλέξτε θέμα</option>
                      <option value="Γενική Ερώτηση">Γενική Ερώτηση</option>
                      <option value="Εγγραφή Ακαδημίας">Εγγραφή Ακαδημίας</option>
                      <option value="Πληροφορίες Εισιτηρίων">Πληροφορίες Εισιτηρίων</option>
                      <option value="Συνεργασία/Χορηγία">Συνεργασία/Χορηγία</option>
                      <option value="Αίτημα Μέσων">Αίτημα Μέσων</option>
                      <option value="Άλλο">Άλλο</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Μήνυμα</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Γράψτε το μήνυμά σας"
                      rows={5}
                      required
                      data-testid="contact-message"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary w-full"
                    disabled={submitting}
                    data-testid="contact-submit"
                  >
                    {submitting ? "Αποστολή..." : "Αποστολή Μηνύματος"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Admin Login Page
const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await login(username, password);
      const from = location.state?.from?.pathname || "/admin";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Λάθος όνομα χρήστη ή κωδικός");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={CLUB_LOGO} alt="LEFTERIA FC" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="font-['Bebas_Neue'] text-4xl text-white">Σύνδεση Διαχειριστή</h1>
          <p className="text-zinc-400 mt-2">Εισάγετε τα στοιχεία σας για πρόσβαση στο πάνελ διαχείρισης</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 text-sm" data-testid="login-error">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Όνομα Χρήστη</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Εισάγετε όνομα χρήστη"
                required
                data-testid="login-username"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Κωδικός</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Εισάγετε κωδικό"
                  required
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Σύνδεση...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={18} />
                  Σύνδεση
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          <Link to="/" className="hover:text-[#F5A623]">← Επιστροφή στην ιστοσελίδα</Link>
        </p>
      </div>
    </div>
  );
};

// Admin Page (Protected) - Uses AdminPanel component
const AdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return <AdminPanel user={user} onLogout={handleLogout} />;
};

// Public Layout (with nav + footer)
const PublicLayout = ({ children }) => (
  <>
    <Navigation />
    {children}
    <Footer />
  </>
);

// ==================== APP ====================
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes with nav + footer */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/team" element={<PublicLayout><TeamHubPage /></PublicLayout>} />
            <Route path="/academy" element={<PublicLayout><AcademyPage /></PublicLayout>} />
            <Route path="/fixtures" element={<PublicLayout><FixturesPage /></PublicLayout>} />
            <Route path="/news" element={<PublicLayout><NewsPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
            <Route path="/player/:playerId" element={<PublicLayout><PlayerProfilePage /></PublicLayout>} />
            {/* Legacy redirects */}
            <Route path="/calendar" element={<Navigate to="/team?tab=schedule" replace />} />
            <Route path="/venues" element={<Navigate to="/team?tab=venues" replace />} />
            <Route path="/seasons" element={<Navigate to="/team?tab=overview" replace />} />
            <Route path="/staff" element={<Navigate to="/team?tab=overview" replace />} />
            {/* Admin routes - NO nav/footer */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
