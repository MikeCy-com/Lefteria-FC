import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { Menu, X, Trophy, Users, Calendar, Newspaper, Mail, Shield, ChevronRight, MapPin, Clock, Home as HomeIcon, Info, GraduationCap, Settings, ChevronDown, Phone, Facebook, Twitter, Instagram, Youtube, ArrowRight, Star, Target, Heart, Lock, LogOut, Eye, EyeOff } from "lucide-react";

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
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/about", label: "About", icon: Info },
    { path: "/team", label: "First Team", icon: Users },
    { path: "/academy", label: "Academy", icon: GraduationCap },
    { path: "/fixtures", label: "Fixtures", icon: Calendar },
    { path: "/news", label: "News", icon: Newspaper },
    { path: "/contact", label: "Contact", icon: Mail },
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
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Quick Links</h4>
          <ul className="space-y-3">
            {["First Team", "Academy", "Fixtures", "News", "Contact"].map((item) => (
              <li key={item}>
                <Link 
                  to={`/${item.toLowerCase().replace(' ', '-')}`} 
                  className="text-zinc-400 hover:text-[#F5A623] transition-colors text-sm flex items-center gap-2"
                >
                  <ChevronRight size={14} />
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Contact</h4>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex items-center gap-3">
              <MapPin size={16} className="text-[#F5A623]" />
              Lefteria Stadium, Athens, Greece
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-[#F5A623]" />
              +30 210 123 4567
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-[#F5A623]" />
              info@lefteriafc.gr
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Follow Us</h4>
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
        <p className="text-zinc-500 text-sm">© 2024 Lefteria FC. All rights reserved.</p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Seed data first
        await axios.post(`${API}/seed`);
        
        const [fixturesRes, standingsRes, newsRes] = await Promise.all([
          axios.get(`${API}/fixtures?limit=5`),
          axios.get(`${API}/standings`),
          axios.get(`${API}/news?limit=3`),
        ]);
        setFixtures(fixturesRes.data);
        setStandings(standingsRes.data);
        setNews(newsRes.data);
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
            <span className="badge badge-primary mb-6 animate-fadeInUp">Est. 2024</span>
            <h1 className="font-['Bebas_Neue'] text-6xl md:text-7xl lg:text-8xl text-white mb-6 animate-fadeInUp animation-delay-200">
              Welcome to<br/>
              <span className="text-[#F5A623]">Lefteria FC</span>
            </h1>
            <p className="text-xl text-zinc-300 mb-8 animate-fadeInUp animation-delay-400 max-w-xl">
              Building champions through passion, discipline, and teamwork. Join us on our journey to greatness.
            </p>
            <div className="flex flex-wrap gap-4 animate-fadeInUp animation-delay-600">
              <Link to="/team" className="btn-primary" data-testid="hero-view-team">
                View First Team
                <ArrowRight size={18} />
              </Link>
              <Link to="/academy" className="btn-secondary" data-testid="hero-join-academy">
                Join Academy
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "League Position", value: "2nd" },
              { label: "Matches Played", value: "18" },
              { label: "Goals Scored", value: "32" },
              { label: "Academy Players", value: "120+" },
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
              <span className="badge badge-secondary mb-4">Schedule</span>
              <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white section-heading">
                Latest Fixtures
              </h2>
            </div>
            <Link to="/fixtures" className="hidden md:flex items-center gap-2 text-[#F5A623] hover:underline">
              View All <ArrowRight size={16} />
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
                    <span className={`font-['Bebas_Neue'] text-xl ${fixture.home_team === 'Lefteria FC' ? 'text-[#F5A623]' : 'text-white'}`}>
                      {fixture.home_team}
                    </span>
                    <div className="match-score bg-[#1F1F1F] px-4 py-2">
                      {fixture.status === 'Completed' ? (
                        `${fixture.home_score} - ${fixture.away_score}`
                      ) : (
                        <span className="text-zinc-400 text-lg">VS</span>
                      )}
                    </div>
                    <span className={`font-['Bebas_Neue'] text-xl ${fixture.away_team === 'Lefteria FC' ? 'text-[#F5A623]' : 'text-white'}`}>
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
              <span className="badge badge-secondary mb-4">Super League 2</span>
              <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white section-heading mb-8">
                League Standings
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
                        className={team.team_name === 'Lefteria FC' ? 'team-highlight' : ''}
                      >
                        <td className="font-bold">{idx + 1}</td>
                        <td className="font-semibold">{team.team_name}</td>
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
              <span className="badge badge-secondary mb-4">Updates</span>
              <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white section-heading mb-8">
                Club News
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
                  View All News <ArrowRight size={16} />
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
          <span className="badge badge-primary mb-6">Youth Development</span>
          <h2 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white mb-6">
            Join Our <span className="text-[#F5A623]">Academy</span>
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            From U8 to U18, our academy develops young talents with world-class coaching and facilities. 
            Start your journey to becoming a professional footballer.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/academy" className="btn-primary">
              Explore Academy <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn-secondary">
              Register Interest
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
        <span className="badge badge-secondary mb-4">Our Story</span>
        <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
          About <span className="text-[#F5A623]">Lefteria FC</span>
        </h1>
        <p className="text-xl text-zinc-300 max-w-3xl">
          Founded in 2024, Lefteria FC (ΛΕΥΤΕΡΙΑ - meaning "Freedom" in Greek) embodies the spirit of 
          passion, excellence, and community in Greek football.
        </p>
      </div>
    </section>

    {/* History */}
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">Our History</h2>
          <div className="space-y-4 text-zinc-300">
            <p>
              Lefteria FC was established with a vision to create a football club that combines professional 
              excellence with community values. The dove in our crest symbolizes freedom and peace, while the 
              laurel wreath represents victory and achievement.
            </p>
            <p>
              Based in Athens, Greece, we compete in Super League 2 and have quickly established ourselves as 
              a competitive force with an ambitious academy program developing the next generation of Greek football talent.
            </p>
            <p>
              Our name "Lefteria" (ΛΕΥΤΕΡΙΑ) means "Freedom" in Greek, representing our philosophy of 
              free-flowing, attacking football and the freedom we give our young players to express themselves.
            </p>
          </div>
        </div>
        <div className="relative">
          <img 
            src={CLUB_LOGO} 
            alt="Lefteria FC Crest" 
            className="w-full max-w-md mx-auto"
          />
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-12 text-center">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Trophy, title: "Excellence", desc: "We strive for excellence in everything we do, on and off the pitch." },
            { icon: Heart, title: "Passion", desc: "Football is more than a game - it's our passion and way of life." },
            { icon: Target, title: "Ambition", desc: "We set high goals and work tirelessly to achieve them." },
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
            <span className="badge badge-secondary mb-4">Home Ground</span>
            <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">Lefteria Stadium</h2>
            <div className="space-y-4 text-zinc-300">
              <p>
                Our home, Lefteria Stadium, is a modern 5,000-seat venue located in the heart of Athens. 
                The stadium features state-of-the-art facilities including a natural grass pitch, 
                modern training areas, and excellent spectator amenities.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>5,000 capacity</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>Natural grass pitch</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>Modern training facilities</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="text-[#F5A623]" size={18} />
                  <span>VIP hospitality areas</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="aspect-video bg-[#1F1F1F] rounded-none overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1765130729366-b54d7b2c8ea2?w=800"
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
const TeamPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await axios.get(`${API}/players?is_academy=false`);
        setPlayers(res.data);
      } catch (e) {
        console.error("Error fetching players:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const filteredPlayers = filter === "all" 
    ? players 
    : players.filter(p => p.position === filter);

  const positions = ["all", "Goalkeeper", "Defender", "Midfielder", "Forward"];

  if (loading) return <Loading />;

  return (
    <div className="pt-24 min-h-screen" data-testid="team-page">
      {/* Hero */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">2025/26 Season</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            First <span className="text-[#F5A623]">Team</span>
          </h1>
          <p className="text-xl text-zinc-300 max-w-3xl">
            Meet the squad representing Lefteria FC in Super League 2.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 px-6 border-b border-[#262626]">
        <div className="max-w-7xl mx-auto">
          <div className="tab-list flex-wrap">
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setFilter(pos)}
                className={`tab-item ${filter === pos ? 'active' : ''}`}
                data-testid={`filter-${pos}`}
              >
                {pos === "all" ? "All Players" : pos + "s"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Players Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers.map((player) => (
              <div 
                key={player.id} 
                className="card player-card group"
                data-testid={`player-${player.id}`}
              >
                <div className="aspect-[3/4] bg-[#1F1F1F] relative overflow-hidden">
                  {player.image_url ? (
                    <img 
                      src={player.image_url} 
                      alt={player.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={64} className="text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 player-number font-['Bebas_Neue'] text-6xl text-white/20">
                    {player.number}
                  </div>
                </div>
                <div className="p-4 bg-[#111111]">
                  <span className="text-xs text-[#F5A623] tracking-wider uppercase">{player.position}</span>
                  <h3 className="font-['Bebas_Neue'] text-2xl text-white mt-1">{player.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-zinc-400 text-sm">
                    <span>{player.nationality}</span>
                    <span>•</span>
                    <span>{player.age} years</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Academy Page
const AcademyPage = () => {
  const [academyInfo, setAcademyInfo] = useState([]);
  const [academyPlayers, setAcademyPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, playersRes] = await Promise.all([
          axios.get(`${API}/academy`),
          axios.get(`${API}/players?is_academy=true`),
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
          <span className="badge badge-primary mb-4">Youth Development</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            Lefteria FC <span className="text-[#F5A623]">Academy</span>
          </h1>
          <p className="text-xl text-zinc-300 max-w-3xl">
            Developing the next generation of Greek football talent through world-class coaching, 
            facilities, and a pathway to professional football.
          </p>
        </div>
      </section>

      {/* Age Groups */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-12 section-heading">Age Groups</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {academyInfo.map((group) => (
              <div key={group.id} className="card p-6" data-testid={`academy-${group.age_group}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-['Bebas_Neue'] text-4xl text-[#F5A623]">{group.age_group}</span>
                  <span className="badge badge-secondary">
                    {group.current_players}/{group.max_players}
                  </span>
                </div>
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-2">Coach: {group.coach_name}</h3>
                <p className="text-zinc-400 text-sm mb-4">{group.description}</p>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Clock size={14} />
                  <span>{group.training_schedule}</span>
                </div>
                <div className="mt-4 bg-[#1F1F1F] h-2">
                  <div 
                    className="bg-[#F5A623] h-full transition-all duration-500"
                    style={{ width: `${(group.current_players / group.max_players) * 100}%` }}
                  ></div>
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
              <span className="badge badge-secondary mb-4">Philosophy</span>
              <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">
                Our Development Philosophy
              </h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  At Lefteria FC Academy, we believe in holistic player development. Our program focuses 
                  not just on technical skills, but also on tactical understanding, physical conditioning, 
                  and mental resilience.
                </p>
                <ul className="space-y-3">
                  {[
                    "Individual development over team results at youth level",
                    "Age-appropriate training methodologies",
                    "Education and football balance",
                    "Clear pathway to first team",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <ChevronRight className="text-[#F5A623] flex-shrink-0" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {academyPlayers.slice(0, 4).map((player) => (
                <div key={player.id} className="card p-4">
                  <span className="text-xs text-[#F5A623] tracking-wider">{player.age_group}</span>
                  <h4 className="font-['Bebas_Neue'] text-lg text-white">{player.name}</h4>
                  <span className="text-zinc-500 text-sm">{player.position}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-zinc-300 mb-8">
            Join Lefteria FC Academy and take the first step towards becoming a professional footballer.
          </p>
          <Link to="/contact" className="btn-primary">
            Register for Trials <ArrowRight size={18} />
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
          <span className="badge badge-secondary mb-4">2025/26 Season</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            Fixtures & <span className="text-[#F5A623]">Results</span>
          </h1>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 px-6 border-b border-[#262626]">
        <div className="max-w-7xl mx-auto">
          <div className="tab-list flex-wrap">
            {["all", "Scheduled", "Completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`tab-item ${filter === status ? 'active' : ''}`}
                data-testid={`filter-${status}`}
              >
                {status === "all" ? "All Matches" : status}
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
                    fixture.home_team === 'Lefteria FC' ? 'text-[#F5A623]' : 'text-white'
                  }`}>
                    {fixture.home_team}
                  </h3>
                  {fixture.home_team === 'Lefteria FC' && (
                    <span className="text-xs text-zinc-500">HOME</span>
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
                        {new Date(fixture.match_date).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-zinc-500">
                    {new Date(fixture.match_date).toLocaleDateString('en-GB', { 
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center md:text-left">
                  <h3 className={`font-['Bebas_Neue'] text-2xl ${
                    fixture.away_team === 'Lefteria FC' ? 'text-[#F5A623]' : 'text-white'
                  }`}>
                    {fixture.away_team}
                  </h3>
                  {fixture.away_team === 'Lefteria FC' && (
                    <span className="text-xs text-zinc-500">AWAY</span>
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
                    {fixture.status}
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
          <span className="badge badge-secondary mb-4">Latest Updates</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            Club <span className="text-[#F5A623]">News</span>
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
                  <span className="badge badge-primary mb-4 self-start">Featured</span>
                  <span className="text-sm text-[#F5A623] tracking-wider uppercase mb-2">{featuredNews.category}</span>
                  <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white group-hover:text-[#F5A623] transition-colors mb-4">
                    {featuredNews.title}
                  </h2>
                  <p className="text-zinc-400 mb-6">{featuredNews.excerpt}</p>
                  <span className="text-zinc-500 text-sm">
                    {new Date(featuredNews.created_at).toLocaleDateString('en-GB', { 
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
                    {new Date(item.created_at).toLocaleDateString('en-GB', { 
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
          <span className="badge badge-secondary mb-4">Get In Touch</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-6">
            Contact <span className="text-[#F5A623]">Us</span>
          </h1>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8 section-heading">
                Club Information
              </h2>
              <div className="space-y-6">
                <div className="card p-6 flex items-start gap-4">
                  <MapPin className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Address</h3>
                    <p className="text-zinc-400">Lefteria Stadium<br/>Athens, Greece 10557</p>
                  </div>
                </div>
                <div className="card p-6 flex items-start gap-4">
                  <Phone className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Phone</h3>
                    <p className="text-zinc-400">+30 210 123 4567</p>
                  </div>
                </div>
                <div className="card p-6 flex items-start gap-4">
                  <Mail className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Email</h3>
                    <p className="text-zinc-400">info@lefteriafc.gr</p>
                  </div>
                </div>
                <div className="card p-6 flex items-start gap-4">
                  <Clock className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Office Hours</h3>
                    <p className="text-zinc-400">Monday - Friday: 9:00 - 18:00<br/>Saturday: 10:00 - 14:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8 section-heading">
                Send a Message
              </h2>
              
              {submitted ? (
                <div className="card p-8 text-center" data-testid="contact-success">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChevronRight className="text-green-500" size={32} />
                  </div>
                  <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-2">Message Sent!</h3>
                  <p className="text-zinc-400">We'll get back to you as soon as possible.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary mt-6"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      required
                      data-testid="contact-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                      data-testid="contact-email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      data-testid="contact-subject"
                    >
                      <option value="">Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Academy Registration">Academy Registration</option>
                      <option value="Ticket Information">Ticket Information</option>
                      <option value="Partnership/Sponsorship">Partnership/Sponsorship</option>
                      <option value="Media Request">Media Request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Enter your message"
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
                    {submitting ? "Sending..." : "Send Message"}
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
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={CLUB_LOGO} alt="Lefteria FC" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="font-['Bebas_Neue'] text-4xl text-white">Admin Login</h1>
          <p className="text-zinc-400 mt-2">Enter your credentials to access the admin panel</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 text-sm" data-testid="login-error">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                data-testid="login-username"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={18} />
                  Login
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          <Link to="/" className="hover:text-[#F5A623]">← Back to website</Link>
        </p>
      </div>
    </div>
  );
};

// Admin Page (Protected)
const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("players");
  const [data, setData] = useState({ players: [], fixtures: [], news: [], standings: [], academy: [], messages: [] });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [players, fixtures, news, standings, academy, messages] = await Promise.all([
        axios.get(`${API}/players`),
        axios.get(`${API}/fixtures`),
        axios.get(`${API}/news`),
        axios.get(`${API}/standings`),
        axios.get(`${API}/academy`),
        axios.get(`${API}/admin/contact`, { headers }),
      ]);
      setData({
        players: players.data,
        fixtures: fixtures.data,
        news: news.data,
        standings: standings.data,
        academy: academy.data,
        messages: messages.data,
      });
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const tabs = [
    { id: "players", label: "Players", icon: Users },
    { id: "fixtures", label: "Fixtures", icon: Calendar },
    { id: "news", label: "News", icon: Newspaper },
    { id: "standings", label: "Standings", icon: Trophy },
    { id: "academy", label: "Academy", icon: GraduationCap },
    { id: "messages", label: "Messages", icon: Mail },
  ];

  const handleDelete = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API}/admin/${type}/${id}`, { headers });
      fetchData();
    } catch (e) {
      console.error("Error deleting:", e);
      alert("Error deleting item. Please try again.");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="pt-24 min-h-screen bg-[#050505]" data-testid="admin-page">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 admin-sidebar min-h-screen fixed left-0 top-24 hidden lg:block">
          <div className="p-6 border-b border-[#262626]">
            <h2 className="font-['Bebas_Neue'] text-xl text-[#F5A623]">Admin Panel</h2>
            <p className="text-xs text-zinc-500">Welcome, {user?.username}</p>
          </div>
          <nav className="py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`admin-menu-item w-full ${activeTab === tab.id ? 'active' : ''}`}
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="admin-menu-item w-full text-red-400 hover:text-red-300 mt-4"
              data-testid="admin-logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden fixed top-24 left-0 right-0 bg-[#111111] border-b border-[#262626] z-40 overflow-x-auto">
          <div className="flex p-2 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-[#F5A623] text-black' : 'bg-[#1F1F1F] text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm whitespace-nowrap bg-red-900/50 text-red-400"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 pt-20 lg:pt-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="font-['Bebas_Neue'] text-3xl text-white capitalize">
                {activeTab}
              </h1>
            </div>

            {/* Content Tables */}
            {activeTab === "players" && (
              <div className="overflow-x-auto">
                <table className="standings-table" data-testid="admin-players-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Age</th>
                      <th>Academy</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.players.map((player) => (
                      <tr key={player.id}>
                        <td>{player.number}</td>
                        <td className="font-semibold">{player.name}</td>
                        <td>{player.position}</td>
                        <td>{player.age}</td>
                        <td>
                          <span className={`badge ${player.is_academy ? 'badge-primary' : 'badge-secondary'}`}>
                            {player.is_academy ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDelete('players', player.id)}
                            className="text-red-500 hover:text-red-400"
                            data-testid={`delete-player-${player.id}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "fixtures" && (
              <div className="overflow-x-auto">
                <table className="standings-table" data-testid="admin-fixtures-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Home</th>
                      <th>Away</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fixtures.map((fixture) => (
                      <tr key={fixture.id}>
                        <td>{new Date(fixture.match_date).toLocaleDateString()}</td>
                        <td className={fixture.home_team === 'Lefteria FC' ? 'text-[#F5A623] font-semibold' : ''}>
                          {fixture.home_team}
                        </td>
                        <td className={fixture.away_team === 'Lefteria FC' ? 'text-[#F5A623] font-semibold' : ''}>
                          {fixture.away_team}
                        </td>
                        <td>
                          {fixture.status === 'Completed' ? `${fixture.home_score} - ${fixture.away_score}` : '-'}
                        </td>
                        <td>
                          <span className={`badge ${
                            fixture.status === 'Completed' ? 'bg-green-900/50 text-green-400' : 'badge-secondary'
                          }`}>
                            {fixture.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDelete('fixtures', fixture.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "news" && (
              <div className="grid gap-4">
                {data.news.map((item) => (
                  <div key={item.id} className="card p-6 flex justify-between items-start">
                    <div className="flex gap-4">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-20 h-20 object-cover" />
                      )}
                      <div>
                        <span className="badge badge-secondary mb-2">{item.category}</span>
                        <h3 className="font-['Bebas_Neue'] text-xl text-white">{item.title}</h3>
                        <p className="text-zinc-400 text-sm mt-1">{item.excerpt}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete('news', item.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "standings" && (
              <div className="overflow-x-auto">
                <table className="standings-table" data-testid="admin-standings-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>D</th>
                      <th>L</th>
                      <th>GF</th>
                      <th>GA</th>
                      <th>Pts</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.standings.map((team) => (
                      <tr key={team.id} className={team.team_name === 'Lefteria FC' ? 'team-highlight' : ''}>
                        <td className="font-semibold">{team.team_name}</td>
                        <td>{team.played}</td>
                        <td>{team.won}</td>
                        <td>{team.drawn}</td>
                        <td>{team.lost}</td>
                        <td>{team.goals_for}</td>
                        <td>{team.goals_against}</td>
                        <td className="font-bold text-[#F5A623]">{team.points}</td>
                        <td>
                          <button 
                            onClick={() => handleDelete('standings', team.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "academy" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.academy.map((group) => (
                  <div key={group.id} className="card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-['Bebas_Neue'] text-3xl text-[#F5A623]">{group.age_group}</span>
                      <button 
                        onClick={() => handleDelete('academy', group.id)}
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-white mb-1">Coach: {group.coach_name}</p>
                    <p className="text-zinc-400 text-sm">{group.training_schedule}</p>
                    <p className="text-zinc-500 text-sm mt-2">{group.current_players}/{group.max_players} players</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-4">
                {data.messages.map((msg) => (
                  <div key={msg.id} className="card p-6" data-testid={`message-${msg.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{msg.name}</h3>
                        <p className="text-zinc-400 text-sm">{msg.email}</p>
                      </div>
                      <span className="text-zinc-500 text-xs">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="badge badge-secondary mb-2">{msg.subject}</span>
                    <p className="text-zinc-300">{msg.message}</p>
                  </div>
                ))}
                {data.messages.length === 0 && (
                  <p className="text-zinc-500 text-center py-12">No messages yet</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// ==================== APP ====================
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/academy" element={<AcademyPage />} />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Routes>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
