import { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import axios from "axios";
import { Menu, X, Trophy, Users, Calendar, Newspaper, Mail, Shield, ChevronRight, MapPin, Clock, Home as HomeIcon, Info, GraduationCap, Settings, ChevronDown, Phone, Facebook, Twitter, Instagram, Youtube, ArrowRight, Star, Target, Heart, Lock, LogOut, Eye, EyeOff, Bell, BellOff, Ticket, ShoppingCart, User, Handshake, Share2, Download, Copy, Cake } from "lucide-react";
import AdminPanel from "./pages/AdminPanel";
import TeamHubPage from "./pages/TeamHubPage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import MatchReportPage from "./pages/MatchReportPage";
import NewShopPage from "./pages/NewShopPage";
import VotePage from "./pages/VotePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import RegistrationPage from "./pages/RegistrationPage";
import TrialsPage from "./pages/TrialsPage";
import StaffProfilePage from "./pages/StaffProfilePage";
import AcademyGroupPage from "./pages/AcademyGroupPage";
import AcademyLandingPage from "./pages/AcademyLandingPage";
import AcademyPhilosophyPage from "./pages/AcademyPhilosophyPage";
import { SponsorsPage, SponsorDetailPage } from "./pages/SponsorsPage";
import NewsArticlePage from "./pages/NewsArticlePage";
import { PastSeasonsPage, ArchivedSeasonDetailPage } from "./pages/PastSeasonsPage";
import SponsorSpotlight from "./components/SponsorSpotlight";
import { playerLink, formatAcademyDisplayName } from "./utils/playerHelpers";
import { CustomerAuthProvider, useAuth } from "./context/CustomerAuth";
import { MobileAuthProvider } from "./mobile/MobileAuthContext";
import MobileApp from "./mobile/MobileApp";
import MobileLoginPage from "./mobile/pages/MobileLoginPage";
import { playGoalSound, sendBrowserNotification, requestNotificationPermission } from "./utils/sounds";
import { subscribeToPush, unsubscribeFromPush, getSubscriptionState } from "./utils/pushNotifications";
import { buildIsOurTeam, isOurTeam as defaultIsOurTeam } from "./utils/team";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const OUR_TEAM = "ΛΕΥΤΕΡΙΑ 2024";

// Default matcher (falls back to "ΛΕΥΤΕΡΙΑ" / "LEFTERIA" needles when no club data available).
// HomePage and other pages that fetch /api/club should call buildIsOurTeam(club) for the dynamic version.
const isOurTeam = defaultIsOurTeam;

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

const useAdminAuth = () => useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAdminAuth();
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
  const [pushState, setPushState] = useState('loading');
  const [pushInfo, setPushInfo] = useState(null); // {title, body} for info modal
  const location = useLocation();
  const { user, cartCount } = useAuth();

  // Detect iOS Safari
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    getSubscriptionState().then(setPushState);
  }, []);

  const handlePushToggle = async () => {
    // iOS Safari without PWA install — show instructions
    if (isIOS && !isStandalone) {
      setPushInfo({
        title: "Ειδοποιήσεις στο iPhone",
        body: "Για να λαμβάνεις ειδοποιήσεις στο iPhone, πρόσθεσε την εφαρμογή στην αρχική οθόνη:\n\n1. Πάτησε το κουμπί Κοινοποίηση (□↑) στο Safari\n2. Επίλεξε «Στην αρχική οθόνη»\n3. Άνοιξε την εφαρμογή από την αρχική οθόνη και ξαναπάτα το κουδουνάκι",
      });
      return;
    }
    if (pushState === 'unsupported') {
      setPushInfo({
        title: "Μη υποστηριζόμενος περιηγητής",
        body: "Ο περιηγητής σου δεν υποστηρίζει ειδοποιήσεις. Δοκίμασε με Chrome, Edge, Firefox ή Safari (σε iPhone, πρώτα εγκατέστησε την εφαρμογή στην αρχική οθόνη).",
      });
      return;
    }
    if (pushState === 'denied') {
      setPushInfo({
        title: "Ειδοποιήσεις αποκλεισμένες",
        body: "Έχεις απορρίψει τις ειδοποιήσεις. Για να τις ενεργοποιήσεις:\n\n• Στο κινητό: Ρυθμίσεις περιηγητή → Ιστοσελίδες → lefteriafc.cy → Ειδοποιήσεις → Να επιτρέπονται\n• Στον υπολογιστή: πάτα το εικονίδιο 🔒 ή ⓘ στη γραμμή διεύθυνσης → Ειδοποιήσεις → Να επιτρέπονται",
      });
      return;
    }
    if (pushState === 'subscribed') {
      await unsubscribeFromPush();
      setPushState('unsubscribed');
      setPushInfo({ title: "Απενεργοποιήθηκε", body: "Δεν θα λαμβάνεις πλέον ειδοποιήσεις από την LEFTERIA FC." });
    } else {
      const sub = await subscribeToPush();
      if (sub) {
        setPushState('subscribed');
        setPushInfo({
          title: "Ενεργοποιήθηκαν!",
          body: "Θα λαμβάνεις ειδοποιήσεις για αγώνες, αποτελέσματα και νέα — ακόμη και όταν δεν είσαι στην ιστοσελίδα.",
        });
      } else {
        setPushState('denied');
        setPushInfo({
          title: "Αδυναμία ενεργοποίησης",
          body: "Παρακαλούμε επίτρεψε τις ειδοποιήσεις στον περιηγητή σου και δοκίμασε ξανά.",
        });
      }
    }
  };

  const navLinks = [
    { path: "/", label: "Αρχικη", icon: HomeIcon },
    { path: "/about", label: "Σχετικα", icon: Info },
    { path: "/team", label: "Ομαδα", icon: Users },
    { label: "Ακαδημια", icon: GraduationCap, dropdown: [
      { path: "/academy", label: "Lefteria FC Academy" },
      { path: "/academy/philosophy", label: "Η Φιλοσοφια μας" },
      { path: "/academy/groups", label: "Ηλικιακα Τμηματα" },
      { path: "/academy/registration", label: "Εγγραφες" },
    ]},
    { label: "Χορηγοι", icon: Handshake, dropdown: [
      { path: "/sponsors/first-team", label: "Χορηγοι Πρωτης Ομαδας" },
      { path: "/sponsors/academy", label: "Χορηγοι Ακαδημιας" },
      { path: "/contact", label: "Γινε Χορηγος" },
    ]},
    { path: "/news", label: "Νεα", icon: Newspaper },
    { path: "/shop", label: "Καταστημα", icon: ShoppingCart },
    { path: "/contact", label: "Επικοινωνια", icon: Mail },
  ];

  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);

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
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              link.dropdown ? (
                <div key={link.label} className="relative" onMouseEnter={() => setOpenDropdown(link.label)} onMouseLeave={() => setOpenDropdown(null)}>
                  <button
                    className={`nav-link font-['Bebas_Neue'] text-lg tracking-wider flex items-center gap-1 ${
                      location.pathname.startsWith(link.dropdown[0]?.path?.split('/').slice(0,2).join('/')) ? "text-[#F5A623]" : "text-white"
                    }`}
                    data-testid={`nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform ${openDropdown === link.label ? "rotate-180" : ""}`} />
                  </button>
                  {openDropdown === link.label && (
                    <div className="absolute top-full left-0 pt-1 z-50">
                      <div className="w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden" data-testid={`dropdown-${link.label.toLowerCase()}`}>
                        {link.dropdown.map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={() => setOpenDropdown(null)}
                            className={`block px-5 py-3 text-sm transition-colors hover:bg-white/5 hover:text-[#F5A623] border-b border-white/[0.04] last:border-0 ${
                              location.pathname === sub.path ? "text-[#F5A623] bg-white/[0.03]" : "text-zinc-300"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
              )
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Push Notification Bell — always visible; click shows guidance on iOS/denied/unsupported */}
            {pushState !== 'loading' && (
              <button
                onClick={handlePushToggle}
                className={`p-2.5 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  pushState === 'subscribed'
                    ? 'text-[#F5A623] hover:bg-[#F5A623]/10'
                    : 'text-zinc-400 hover:text-[#F5A623] hover:bg-white/5'
                }`}
                title={pushState === 'subscribed' ? 'Απενεργοποίηση ειδοποιήσεων' : 'Ενεργοποίηση ειδοποιήσεων'}
                data-testid="push-notification-bell"
                aria-label="Ειδοποιήσεις"
              >
                {pushState === 'subscribed' ? <Bell size={20} /> : <BellOff size={20} />}
              </button>
            )}

            {/* Shopping Cart */}
            <Link to="/cart" className="relative p-2 rounded-full text-zinc-400 hover:text-[#F5A623] hover:bg-white/5 transition-colors" data-testid="nav-cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-black text-[9px] font-bold rounded-full flex items-center justify-center" data-testid="cart-badge">{cartCount}</span>
              )}
            </Link>

            {/* Profile / Login */}
            {user ? (
              <Link to="/profile" className="p-2 rounded-full bg-[#F5A623]/10 text-[#F5A623] hover:bg-[#F5A623]/20 transition-colors" data-testid="nav-profile">
                <User size={20} />
              </Link>
            ) : (
              <Link to="/login" className="p-2 rounded-full text-zinc-400 hover:text-[#F5A623] hover:bg-white/5 transition-colors" data-testid="nav-login">
                <User size={20} />
              </Link>
            )}

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
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 top-[72px] bg-black/95 backdrop-blur-xl transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        data-testid="mobile-menu"
      >
        <nav className="flex flex-col p-6 gap-2">
          {navLinks.map((link) => (
            link.dropdown ? (
              <div key={link.label}>
                <button
                  onClick={() => setOpenMobileDropdown(openMobileDropdown === link.label ? null : link.label)}
                  className="w-full flex items-center justify-between py-4 border-b border-white/10"
                >
                  <span className="flex items-center gap-4 font-['Bebas_Neue'] text-2xl tracking-wider text-white">
                    <link.icon size={24} />
                    {link.label}
                  </span>
                  <ChevronDown size={18} className={`text-zinc-400 transition-transform ${openMobileDropdown === link.label ? "rotate-180" : ""}`} />
                </button>
                {openMobileDropdown === link.label && (
                  <div className="pl-12 flex flex-col">
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => { setIsOpen(false); setOpenMobileDropdown(null); }}
                        className={`py-3 text-base border-b border-white/5 ${
                          location.pathname === sub.path ? "text-[#F5A623]" : "text-zinc-400"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
            )
          ))}
          <Link to={user ? "/profile" : "/login"} onClick={() => setIsOpen(false)}
            className="flex items-center gap-4 py-4 border-b border-white/10 font-['Bebas_Neue'] text-2xl tracking-wider text-white">
            <User size={24} />
            {user ? "Προφιλ" : "Συνδεση"}
          </Link>
        </nav>
      </div>

      {/* Push notification info modal */}
      {pushInfo && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setPushInfo(null)}
          data-testid="push-info-modal"
        >
          <div
            className="bg-[#161616] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center">
                  <Bell size={18} className="text-[#F5A623]" />
                </div>
                <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide" data-testid="push-info-title">{pushInfo.title}</h3>
              </div>
              <button onClick={() => setPushInfo(null)} className="text-zinc-400 hover:text-white p-1" data-testid="push-info-close">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 pb-5 text-zinc-300 text-sm whitespace-pre-line leading-relaxed" data-testid="push-info-body">{pushInfo.body}</div>
            <div className="px-5 pb-5">
              <button onClick={() => setPushInfo(null)} className="w-full py-3 rounded-md bg-[#F5A623] text-black font-bold hover:bg-[#e6981f] transition-colors" data-testid="push-info-ok">
                Εντάξει
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Footer
const TikTokIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.78 20.1a6.34 6.34 0 0 0 10.86-4.43V7.93a8.16 8.16 0 0 0 4.77 1.52V6a4.86 4.86 0 0 1-1.82-.27"/>
  </svg>
);

const Footer = () => {
  const [club, setClub] = useState(null);
  useEffect(() => {
    axios.get(`${API}/club`).then(res => setClub(res.data)).catch(() => {});
  }, []);

  const renderSocialIcons = (prefix, label) => {
    const socials = [
      { Icon: Facebook, key: `${prefix}facebook` },
      { Icon: Instagram, key: `${prefix}instagram` },
      { Icon: Twitter, key: `${prefix}twitter` },
      { Icon: Youtube, key: `${prefix}youtube` },
      { Icon: TikTokIcon, key: `${prefix}tiktok` },
    ];
    const active = socials.filter(s => club?.[s.key]);
    if (active.length === 0) return null;
    return (
      <div className="mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
        <div className="flex gap-3">
          {active.map(({ Icon, key }) => (
            <a key={key} href={club[key].startsWith("http") ? club[key] : `https://${club[key]}`} target="_blank" rel="noreferrer" data-testid={`footer-${key}`}
              className="w-10 h-10 bg-[#1F1F1F] border border-[#262626] flex items-center justify-center hover:bg-[#F5A623] hover:border-[#F5A623] hover:text-black transition-all">
              <Icon size={18} />
            </a>
          ))}
        </div>
      </div>
    );
  };

  const hasFirstTeamSocial = club && (club.first_team_facebook || club.first_team_instagram || club.first_team_twitter || club.first_team_youtube || club.first_team_tiktok);
  const hasAcademySocial = club && (club.academy_facebook || club.academy_instagram || club.academy_twitter || club.academy_youtube || club.academy_tiktok);

  return (
  <footer className="bg-[#0a0a0a] border-t border-[#262626]" data-testid="footer">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
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
            Αφοσιωμένοι στην αριστεία εντός και εκτός γηπέδου. Χτίζουμε πρωταθλητές μέσα από πάθος, πειθαρχία και ομαδικότητα.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Γρηγοροι Συνδεσμοι</h4>
          <ul className="space-y-3">
            {[
              { name: "Πρώτη Ομάδα", path: "/team" },
              { name: "Ακαδημία", path: "/academy" },
              { name: "Αποτελέσματα", path: "/team?tab=results" },
              { name: "Πρόγραμμα", path: "/team?tab=schedule" },
              { name: "Γήπεδα", path: "/team?tab=venues" },
              { name: "Νέα", path: "/news" },
              { name: "Παλαιότερες Σεζόν", path: "/seasons" },
              { name: "Εισιτήρια", path: "/shop" },
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
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Επικοινωνια</h4>
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
          <h4 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-6 tracking-wider">Ακολουθησε μας</h4>
          {hasFirstTeamSocial && renderSocialIcons("first_team_", "Πρωτη Ομαδα")}
          {hasAcademySocial && renderSocialIcons("academy_", "Ακαδημια")}
          {!hasFirstTeamSocial && !hasAcademySocial && (
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
          )}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[#262626] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-zinc-500 text-sm">© 2024 LEFTERIA FC. Με επιφύλαξη κάθε δικαιώματος.</p>
      </div>
    </div>
  </footer>
  );
};

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
  const [cols, setCols] = useState({ played: true, won: true, drawn: true, lost: true, goals_for: false, goals_against: false, goal_difference: true, points: true, form: false });
  // Player of the Month
  const [potmResults, setPotmResults] = useState({ results: [], total_votes: 0, month_key: "" });
  // Birthdays
  const [birthdayPlayers, setBirthdayPlayers] = useState([]);
  const [birthdayCardPlayer, setBirthdayCardPlayer] = useState(null);
  // First Team Trials
  const [trialSettings, setTrialSettings] = useState(null);
  // Club profile (used to identify "our team" in standings/fixtures by name)
  const [club, setClub] = useState(null);
  const isOurTeamDynamic = buildIsOurTeam(club);

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
        
        const [fixturesRes, standingsRes, newsRes, liveRes, colsRes, birthdayRes, potmResultsRes, trialsSettingsRes, clubRes] = await Promise.all([
          axios.get(`${API}/fixtures?limit=5`),
          axios.get(`${API}/standings`),
          axios.get(`${API}/news?limit=3`),
          axios.get(`${API}/live-match`),
          axios.get(`${API}/settings/standings-columns`),
          axios.get(`${API}/players/birthdays`),
          axios.get(`${API}/votes/potm/results`),
          axios.get(`${API}/trials/settings`).catch(() => ({ data: null })),
          axios.get(`${API}/club`).catch(() => ({ data: null })),
        ]);
        setFixtures(fixturesRes.data);
        setStandings(standingsRes.data);
        setNews(newsRes.data);
        if (liveRes.data.active) setLiveMatch(liveRes.data);
        setCols(colsRes.data);
        setBirthdayPlayers(birthdayRes.data);
        setPotmResults(potmResultsRes.data);
        setTrialSettings(trialsSettingsRes.data);
        setClub(clubRes.data);
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

  const resolveImg = (url) => url && url.startsWith("/api/") ? `${BACKEND_URL}${url}` : url;

  const monthNames = ["Ιανουαριου", "Φεβρουαριου", "Μαρτιου", "Απριλιου", "Μαϊου", "Ιουνιου", "Ιουλιου", "Αυγουστου", "Σεπτεμβριου", "Οκτωβριου", "Νοεμβριου", "Δεκεμβριου"];
  const currentMonthName = monthNames[new Date().getMonth()];
  const posLabels = { Goalkeeper: "Τερμ.", Defender: "Αμυν.", Midfielder: "Μέσος", Forward: "Επιθ." };

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
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32">
          <div className="max-w-3xl">
            <span className="badge badge-primary mb-6 animate-fadeInUp">Ιδρ. 2024</span>
            <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl lg:text-7xl text-white mb-6 animate-fadeInUp animation-delay-200">
              Καλως Ηρθατε στην<br/>
              <span className="text-[#F5A623]">LEFTERIA FC</span>
            </h1>
            <p className="text-lg text-zinc-300 mb-8 animate-fadeInUp animation-delay-400 max-w-xl">
              Χτίζουμε πρωταθλητές μέσα από το πάθος, την πειθαρχία και την ομαδικότητα. Ελάτε μαζί μας στο ταξίδι προς την κορυφή.
            </p>
            <div className="flex flex-wrap gap-4 animate-fadeInUp animation-delay-600">
              <Link to="/team" className="btn-primary" data-testid="hero-view-team">
                Δες την Ομαδα
                <ArrowRight size={18} />
              </Link>
              <Link to="/academy" className="btn-secondary" data-testid="hero-join-academy">
                Ακαδημια
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
                  <span className={`font-['Bebas_Neue'] text-xl ${isOurTeamDynamic(liveMatch.fixture.home_team) ? 'text-[#F5A623]' : 'text-white'}`}>
                    {liveMatch.fixture.home_team}
                  </span>
                </div>
                <div className="bg-[#111] rounded-lg px-4 py-2">
                  <span className="font-['Bebas_Neue'] text-3xl text-white">
                    {liveMatch.fixture.home_score ?? 0} <span className="text-zinc-600">:</span> {liveMatch.fixture.away_score ?? 0}
                  </span>
                </div>
                <div className="flex-1">
                  <span className={`font-['Bebas_Neue'] text-xl ${isOurTeamDynamic(liveMatch.fixture.away_team) ? 'text-[#F5A623]' : 'text-white'}`}>
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
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {(() => {
              const us = standings.find((s) => isOurTeamDynamic(s.team_name));
              const pos = us ? standings.indexOf(us) + 1 : 0;
              return [
                { label: "Θεση Πρωταθληματος", value: pos > 0 ? `${pos}η` : "-" },
                { label: "Αγωνες", value: us ? us.played : "-" },
                { label: "Γκολ", value: us ? us.goals_for : "-" },
                { label: "Βαθμοι", value: us ? us.points : "-" },
              ];
            })().map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-['Bebas_Neue'] text-3xl md:text-4xl text-[#F5A623]">{stat.value}</div>
                <div className="text-sm text-zinc-400 tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Fixtures */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-[#050505]" data-testid="fixtures-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="badge badge-secondary mb-3">Προγραμμα</span>
              <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white">
                Τελευταιοι <span className="text-[#F5A623]">Αγωνες</span>
              </h2>
            </div>
            <Link to="/team?tab=results" className="hidden md:flex items-center gap-2 text-[#F5A623] hover:underline text-sm">
              Όλοι οι Αγώνες <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-2">
            {fixtures.slice(0, 4).map((fixture) => (
              <div 
                key={fixture.id} 
                className={`bg-[#111] rounded-lg border border-[#1a1a1a] px-3 sm:px-5 py-3 sm:py-4 hover:border-[#333] transition-colors ${fixture.status === 'Live' ? 'border-red-500/30' : ''}`}
                data-testid={`fixture-${fixture.id}`}
              >
                  <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-500 w-16 sm:w-20 flex-shrink-0">
                    {new Date(fixture.match_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center justify-center flex-1 gap-2 sm:gap-3 min-w-0">
                    <span className={`font-medium text-xs sm:text-sm text-right flex-1 truncate ${isOurTeamDynamic(fixture.home_team) ? 'text-[#F5A623]' : 'text-white'}`}>
                      {fixture.home_team}
                    </span>
                    <div className="bg-[#1a1a1a] rounded px-2 sm:px-3 py-1 min-w-[50px] sm:min-w-[60px] text-center flex-shrink-0">
                      {fixture.status === 'Completed' ? (
                        <span className="font-['Bebas_Neue'] text-base sm:text-lg text-white">{fixture.home_score} - {fixture.away_score}</span>
                      ) : (
                        <span className="text-xs text-zinc-500">VS</span>
                      )}
                    </div>
                    <span className={`font-medium text-xs sm:text-sm text-left flex-1 truncate ${isOurTeamDynamic(fixture.away_team) ? 'text-[#F5A623]' : 'text-white'}`}>
                      {fixture.away_team}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600 w-24 text-right flex-shrink-0 hidden sm:block truncate">{fixture.venue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Birthday Celebrations — Compact Rotating Ticker */}
      {birthdayPlayers.length > 0 && (
        <section className="py-10 px-6 bg-[#0a0a0a] border-t border-[#1a1a1a]" data-testid="birthday-section">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <span className="badge badge-secondary mb-3">Γενεθλια {currentMonthName}</span>
              <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white">
                Χρονια <span className="text-[#F5A623]">Πολλα!</span>
              </h2>
            </div>
            <div className="relative overflow-hidden">
              <div className="birthday-ticker flex gap-8 items-center">
                {[...birthdayPlayers, ...birthdayPlayers].map((p, i) => (
                  <button
                    type="button"
                    key={`${p.id}-${i}`}
                    onClick={() => setBirthdayCardPlayer(p)}
                    className="flex items-center gap-3 flex-shrink-0 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 rounded-md"
                    data-testid={`birthday-player-${p.id}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] overflow-hidden border border-[#333] group-hover:border-[#F5A623] transition-colors flex-shrink-0">
                      {p.image_url ? (
                        <img src={resolveImg(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#F5A623]/40 font-bold">{p.number}</div>
                      )}
                    </div>
                    <div className="whitespace-nowrap">
                      <span className="text-sm text-white group-hover:text-[#F5A623] transition-colors font-medium">{p.name}</span>
                      <span className="text-xs text-zinc-500 ml-2">{p.birthday_day}/{String(new Date().getMonth() + 1).padStart(2, '0')} — {p.age} ετών</span>
                    </div>
                    <Cake size={14} className="text-[#F5A623]/60 group-hover:text-[#F5A623] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Player of the Month — Compact Top 3 */}
      <section className="py-14 px-6 bg-[#050505]" data-testid="potm-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="badge badge-secondary mb-3">Ψηφοφορια</span>
              <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white">
                Παικτης του <span className="text-[#F5A623]">Μηνα</span>
              </h2>
            </div>
            <Link to="/vote" className="hidden md:flex items-center gap-2 text-[#F5A623] hover:underline text-sm" data-testid="potm-vote-link">
              Ψήφισε <ArrowRight size={14} />
            </Link>
          </div>

          {potmResults.results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="potm-top3">
                {potmResults.results.slice(0, 3).map((r, idx) => {
                  const pct = potmResults.total_votes > 0 ? Math.round((r.votes / potmResults.total_votes) * 100) : 0;
                  const medals = ["border-[#F5A623]", "border-zinc-400", "border-amber-700"];
                  return (
                    <div key={r.player_id} className={`flex items-center gap-4 p-4 bg-[#111] rounded-lg border ${medals[idx] || 'border-[#222]'}`} data-testid={`potm-top-${idx + 1}`}>
                      <span className="font-['Bebas_Neue'] text-2xl text-zinc-500 w-6 text-center">{idx + 1}</span>
                      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0 border border-[#333]">
                        {r.image_url ? (
                          <img src={resolveImg(r.image_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">#{r.number}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{r.player_name}</div>
                        <div className="mt-1 w-full bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-[#F5A623] rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <span className="text-sm text-[#F5A623] font-mono">{r.votes}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-4">
                <span className="text-zinc-500 text-xs">Σύνολο ψήφων: {potmResults.total_votes}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-400 text-sm mb-4">Δεν υπάρχουν ψήφοι ακόμα. Γίνε ο πρώτος!</p>
              <Link to="/vote" className="btn-primary inline-flex" data-testid="potm-vote-cta">
                Ψηφισε Τωρα <ArrowRight size={16} />
              </Link>
            </div>
          )}

          <Link to="/vote" className="flex md:hidden items-center justify-center gap-2 text-[#F5A623] hover:underline text-sm mt-6" data-testid="potm-vote-link-mobile">
            Ψήφισε Τώρα <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* League Table */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-[#0a0a0a]" data-testid="standings-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
            {/* Standings Table */}
            <div className="min-w-0">
              <span className="badge badge-secondary mb-3">ΠΑΑΟΚ Α' Ομιλος</span>
              <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white mb-6">
                Βαθμολογια
              </h2>
              
              <div className="overflow-x-auto">
                <table className="standings-table" data-testid="standings-table">
                  <thead>
                    <tr>
                      <th>Θ</th>
                      <th>Ομάδα</th>
                      {cols.played && <th>Αγ</th>}
                      {cols.won && <th>Ν</th>}
                      {cols.drawn && <th>Ι</th>}
                      {cols.lost && <th>Η</th>}
                      {cols.goals_for && <th>ΓΥ</th>}
                      {cols.goals_against && <th>ΓΚ</th>}
                      {cols.goal_difference && <th>ΔΓ</th>}
                      {cols.form && <th>Φόρμα</th>}
                      {cols.points && <th>Βαθ</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, idx) => (
                      <tr 
                        key={team.id} 
                        className={isOurTeamDynamic(team.team_name) ? 'team-highlight' : ''}
                      >
                        <td className="font-bold">{idx + 1}</td>
                        <td className="font-semibold">
                          <div className="flex items-center gap-2">
                            {team.team_logo && <img src={team.team_logo} alt="" className="w-5 h-5 object-contain" />}
                            <span>{team.team_name}</span>
                          </div>
                        </td>
                        {cols.played && <td>{team.played}</td>}
                        {cols.won && <td>{team.won}</td>}
                        {cols.drawn && <td>{team.drawn}</td>}
                        {cols.lost && <td>{team.lost}</td>}
                        {cols.goals_for && <td>{team.goals_for}</td>}
                        {cols.goals_against && <td>{team.goals_against}</td>}
                        {cols.goal_difference && <td className={team.goal_difference > 0 ? 'text-green-500' : team.goal_difference < 0 ? 'text-red-500' : ''}>
                          {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                        </td>}
                        {cols.form && <td className="text-xs">{team.form || '-'}</td>}
                        {cols.points && <td className="font-bold text-[#F5A623]">{team.points}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Latest News */}
            <div>
              <span className="badge badge-secondary mb-3">Ενημερωση</span>
              <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white mb-6">
                Τελευταια Νεα
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

      {/* Sponsor Spotlight */}
      <SponsorSpotlight />

      {/* First Team Trials CTA — admin toggleable */}
      {trialSettings?.open && (
        <section className="py-16 md:py-20 px-4 md:px-6 bg-gradient-to-br from-[#F5A623]/10 via-[#0a0a0a] to-[#0a0a0a] border-y border-[#F5A623]/20" data-testid="home-trials-cta">
          <div className="max-w-4xl mx-auto text-center">
            <span className="badge badge-primary mb-6">Πρωτη Ομαδα</span>
            <h2 className="font-['Bebas_Neue'] text-3xl md:text-5xl text-white mb-4" data-testid="home-trials-headline">
              {trialSettings.headline}
            </h2>
            <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto" data-testid="home-trials-subtitle">
              {trialSettings.subtitle}
            </p>
            <Link to="/trials" className="btn-primary" data-testid="home-trials-cta-btn">
              {trialSettings.button_text} <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}

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
          <span className="badge badge-primary mb-6">Αναπτυξη Νεων</span>
          <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white mb-6">
            Ελα στην <span className="text-[#F5A623]">Ακαδημια</span>
          </h2>
          <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
            Από U6 έως U12, η ακαδημία μας αναπτύσσει νέα ταλέντα με προπονητές και εγκαταστάσεις υψηλού επιπέδου. Ξεκίνα το ταξίδι σου για να γίνεις επαγγελματίας ποδοσφαιριστής.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/academy" className="btn-primary" data-testid="home-academy-explore-btn">
              Εξερευνησε την Ακαδημια <ArrowRight size={18} />
            </Link>
            <Link to="/academy/registration" className="btn-secondary" data-testid="home-academy-registration-btn">
              Εγγραφη Αθλητη
            </Link>
          </div>
        </div>
      </section>
      {birthdayCardPlayer && (
        <BirthdayCardModal player={birthdayCardPlayer} onClose={() => setBirthdayCardPlayer(null)} />
      )}
    </div>
  );
};

// ==================== BIRTHDAY CARD MODAL ====================
const BirthdayCardModal = ({ player, onClose }) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const formats = [
    { key: "landscape", label: "Facebook / WhatsApp", className: "aspect-[1200/630]" },
    { key: "square",    label: "Instagram Feed",      className: "aspect-square" },
    { key: "story",     label: "Story / TikTok",      className: "aspect-[9/16] max-h-[60vh] mx-auto" },
  ];
  const [active, setActive] = useState("landscape");
  const [copied, setCopied] = useState(false);
  const shareUrl = `${origin}/api/og/player/${player.id}/birthday`;
  const imageUrl = `${origin}/api/og/player/${player.id}/birthday.png?fmt=${active}`;
  const text = `Χρόνια Πολλά ${player.name}! Από την οικογένεια LEFTERIA FC 🎂`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const downloadCurrent = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `birthday-${player.name.replace(/\s+/g, "-")}-${active}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const enc = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(text);
  const whatsapp = `https://wa.me/?text=${t}%20${enc}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${enc}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={onClose} data-testid="birthday-modal">
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626] sticky top-0 bg-[#0f0f0f] z-10">
          <h3 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide flex items-center gap-2">
            <Cake size={18} className="text-[#F5A623]" /> Καρτα Γενεθλιων — {player.name}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none" data-testid="birthday-close" aria-label="Κλεισιμο">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format selector */}
          <div className="flex flex-wrap gap-2">
            {formats.map(f => (
              <button
                key={f.key}
                onClick={() => setActive(f.key)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${active === f.key ? 'bg-[#F5A623] text-black border-[#F5A623] font-semibold' : 'bg-[#0a0a0a] text-zinc-300 border-[#262626] hover:border-[#F5A623]/60'}`}
                data-testid={`birthday-fmt-${f.key}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-lg overflow-hidden border border-[#262626] bg-[#050505] flex items-center justify-center">
            <img
              src={imageUrl}
              alt={`Καρτα γενεθλιων ${player.name}`}
              className={`block ${formats.find(f => f.key === active)?.className} w-auto object-contain`}
              data-testid="birthday-preview-img"
            />
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Επιλεξε format αναλογα με την πλατφορμα. Για Instagram & TikTok πατα <strong className="text-zinc-300">Καταβασταση</strong> και ανεβασε την εικονα απο την εφαρμογη.
            Για WhatsApp & Facebook ο συνδεσμος ανοιγει αυτοματα με την landscape εικονα ως preview.
          </p>

          {/* Share actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button onClick={downloadCurrent} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-[#F5A623] text-black text-sm font-semibold hover:bg-[#FF8C00] transition-colors" data-testid="birthday-download">
              <Download size={14} /> Καταβασταση
            </button>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-[#1a1a1a] border border-[#262626] text-zinc-200 text-sm hover:border-[#25D366]/60 hover:text-white transition-colors" data-testid="birthday-whatsapp">
              <Share2 size={14} /> WhatsApp
            </a>
            <a href={facebook} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-[#1a1a1a] border border-[#262626] text-zinc-200 text-sm hover:border-[#1877F2]/60 hover:text-white transition-colors" data-testid="birthday-facebook">
              <Share2 size={14} /> Facebook
            </a>
            <button onClick={copyLink} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-[#1a1a1a] border border-[#262626] text-zinc-200 text-sm hover:border-[#F5A623]/60 hover:text-white transition-colors" data-testid="birthday-copy">
              <Copy size={14} /> {copied ? "Αντιγραφηκε!" : "Αντιγραφη"}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f]">
            <Link to={playerLink(player)} className="text-xs text-[#F5A623] hover:underline" data-testid="birthday-view-profile">
              Δες το προφιλ του παικτη →
            </Link>
            <span className="text-[10px] text-zinc-600">{player.team_type === "Academy" ? "Ακαδημια" : "Α' Ομαδα"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
const AboutPage = () => (
  <div className="pt-24 min-h-screen" data-testid="about-page">
    {/* Hero */}
    <section className="py-10 md:py-20 px-4 md:px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <span className="badge badge-secondary mb-4">Η Ιστορια μας</span>
        <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mb-6">
          Σχετικα με την <span className="text-[#F5A623]">LEFTERIA FC</span>
        </h1>
        <p className="text-xl text-zinc-300 max-w-3xl">
          Ιδρύθηκε το 2024, η ΛΕΥΤΕΡΙΑ FC ενσαρκώνει το πνεύμα του πάθους, της αριστείας 
          και της κοινότητας στο κυπριακό ποδόσφαιρο.
        </p>
      </div>
    </section>

    {/* History */}
    <section className="py-10 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
        <div>
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">Η Ιστορια μας</h2>
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
    <section className="py-10 md:py-20 px-4 md:px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-12 text-center">Οι Αξιες μας</h2>
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
    <section className="py-10 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          <div>
            <span className="badge badge-secondary mb-4">Εδρα</span>
            <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">Γηπεδο Αετου</h2>
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
              src="https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/vq6hm4ij_unnamed%20%282%29.webp"
              alt="Γήπεδο Αετού"
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
        className="py-20 md:py-32 px-4 md:px-6 relative"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1622659097574-c814ee26068e?w=1600)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <span className="badge badge-primary mb-4">Ανάπτυξη Νέων</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mb-6">
            LEFTERIA FC <span className="text-[#F5A623]">Ακαδημια</span>
          </h1>
          <p className="text-lg text-zinc-300 max-w-3xl">
            Αναπτύσσουμε την επόμενη γενιά ταλέντων του κυπριακού ποδοσφαίρου μέσω 
            κορυφαίας προπόνησης, εγκαταστάσεων και πορείας προς τον επαγγελματισμό.
          </p>
        </div>
      </section>

      {/* Age Groups */}
      <section className="py-10 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-12 section-heading">Ηλικιακες Κατηγοριες</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {academyInfo.map((group) => (
              <Link to={`/academy/${group.id}`} key={group.id} className="card p-6 hover:border-[#F5A623]/30 transition-all duration-300 group" data-testid={`academy-${group.name}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-['Bebas_Neue'] text-4xl text-[#F5A623]">{group.name}</span>
                  <span className="badge badge-secondary">{group.age_range}</span>
                </div>
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-2">Προπονητης: {group.coach_name}</h3>
                <p className="text-zinc-400 text-sm mb-4">{group.description}</p>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Clock size={14} />
                  <span>{group.training_schedule}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Σεζόν {group.season}</span>
                  <span className="text-xs text-[#F5A623] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Δες περισσότερα <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Academy Philosophy */}
      <section className="py-10 md:py-20 px-4 md:px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <div>
              <span className="badge badge-secondary mb-4">Φιλοσοφια</span>
              <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-6 section-heading">
                Η Αναπτυξιακη μας Φιλοσοφια
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
                        <Link to={playerLink(player)} key={player.id} className="card p-4 hover:border-[#F5A623]/30 transition-colors" data-testid={`academy-player-${player.id}`}>
                          <span className="text-xs text-[#F5A623] tracking-wider">{player.position === 'Goalkeeper' ? 'Τερμ.' : player.position === 'Defender' ? 'Αμυν.' : player.position === 'Midfielder' ? 'Μέσος' : 'Επιθ.'}</span>
                          <h4 className="font-['Bebas_Neue'] text-lg text-white">{formatAcademyDisplayName(player.name)}</h4>
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
      <section className="py-10 md:py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="badge badge-primary mb-4">Ακαδημια Ποδοσφαιρου</span>
          <h2 className="font-['Bebas_Neue'] text-4xl text-white mb-4">
            Εντυπο <span className="text-[#F5A623]">Εγγραφης</span>
          </h2>
          <p className="text-zinc-300 mb-8">
            Συμπληρώστε τη φόρμα για να εγγράψετε τον αθλητή στην ακαδημία.
          </p>
          <Link to="/academy/registration" className="btn-primary" data-testid="academy-registration-cta-btn">
            Εγγραφη Αθλητη <ArrowRight size={18} />
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
  const [club, setClub] = useState(null);
  const isOurTeamDynamic = buildIsOurTeam(club);

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const [res, clubRes] = await Promise.all([
          axios.get(`${API}/fixtures?limit=50`),
          axios.get(`${API}/club`).catch(() => ({ data: null })),
        ]);
        setFixtures(res.data);
        setClub(clubRes.data);
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
      <section className="py-10 md:py-20 px-4 md:px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Σεζον 2025/26</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mb-6">
            Αγωνες & <span className="text-[#F5A623]">Αποτελεσματα</span>
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
                    isOurTeamDynamic(fixture.home_team) ? 'text-[#F5A623]' : 'text-white'
                  }`}>
                    {fixture.home_team}
                  </h3>
                  {isOurTeamDynamic(fixture.home_team) && (
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
                    isOurTeamDynamic(fixture.away_team) ? 'text-[#F5A623]' : 'text-white'
                  }`}>
                    {fixture.away_team}
                  </h3>
                  {isOurTeamDynamic(fixture.away_team) && (
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
      <section className="py-10 md:py-20 px-4 md:px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Τελευταια Ενημερωση</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mb-6">
            Τα <span className="text-[#F5A623]">Νεα</span> μας
          </h1>
        </div>
      </section>

      {/* Featured */}
      {featuredNews && (
        <section className="py-10 md:py-12 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <Link
              to={`/news/${featuredNews.id}`}
              className="card group cursor-pointer overflow-hidden block"
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
            </Link>
          </div>
        </section>
      )}

      {/* News Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherNews.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="card group cursor-pointer news-card overflow-hidden block"
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
              </Link>
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
      <section className="py-10 md:py-10 md:py-20 px-4 md:px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Επικοινωνηστε Μαζι Μας</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mb-6">
            <span className="text-[#F5A623]">Επικοινωνια</span>
          </h1>
        </div>
      </section>

      <section className="py-10 md:py-10 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8 section-heading">
                Πληροφοριες Συλλογου
              </h2>
              <div className="space-y-6">
                <div className="card p-6 flex items-start gap-4">
                  <MapPin className="text-[#F5A623] flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Διευθυνση</h3>
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
                    <h3 className="font-['Bebas_Neue'] text-lg text-white">Ωρες Γραφειου</h3>
                    <p className="text-zinc-400">Δευτέρα - Παρασκευή: 9:00 - 18:00<br/>Σάββατο: 10:00 - 14:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8 section-heading">
                Στειλτε Μηνυμα
              </h2>
              
              {submitted ? (
                <div className="card p-8 text-center" data-testid="contact-success">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChevronRight className="text-green-500" size={32} />
                  </div>
                  <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-2">Το Μηνυμα Εσταλη!</h3>
                  <p className="text-zinc-400">Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary mt-6"
                  >
                    Στειλε Αλλο Μηνυμα
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
                    {submitting ? "Αποστολη..." : "Αποστολη Μηνυματος"}
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
  const { login, user } = useAdminAuth();
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
          <h1 className="font-['Bebas_Neue'] text-4xl text-white">Συνδεση Διαχειριστη</h1>
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
                  Συνδεση...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={18} />
                  Συνδεση
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
  const { user, logout } = useAdminAuth();
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

// ==================== SCROLL TO TOP ====================
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ==================== APP ====================
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <CustomerAuthProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes with nav + footer */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/team" element={<PublicLayout><TeamHubPage /></PublicLayout>} />
            <Route path="/academy" element={<PublicLayout><AcademyLandingPage /></PublicLayout>} />
            <Route path="/academy/philosophy" element={<PublicLayout><AcademyPhilosophyPage /></PublicLayout>} />
            <Route path="/academy/groups" element={<PublicLayout><AcademyPage /></PublicLayout>} />
            <Route path="/academy/registration" element={<PublicLayout><RegistrationPage /></PublicLayout>} />
            <Route path="/trials" element={<PublicLayout><TrialsPage /></PublicLayout>} />
            <Route path="/staff/:staffId" element={<PublicLayout><StaffProfilePage /></PublicLayout>} />
            <Route path="/academy/:groupId" element={<PublicLayout><AcademyGroupPage /></PublicLayout>} />
            <Route path="/sponsors/first-team" element={<PublicLayout><SponsorsPage type="first_team" /></PublicLayout>} />
            <Route path="/sponsors/academy" element={<PublicLayout><SponsorsPage type="academy" /></PublicLayout>} />
            <Route path="/sponsors/:sponsorId" element={<PublicLayout><SponsorDetailPage /></PublicLayout>} />
            <Route path="/fixtures" element={<Navigate to="/team?tab=results" replace />} />
            <Route path="/news" element={<PublicLayout><NewsPage /></PublicLayout>} />
            <Route path="/news/:newsId" element={<PublicLayout><NewsArticlePage /></PublicLayout>} />
            <Route path="/seasons" element={<PublicLayout><PastSeasonsPage /></PublicLayout>} />
            <Route path="/seasons/:archiveId" element={<PublicLayout><ArchivedSeasonDetailPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><NewShopPage /></PublicLayout>} />
            <Route path="/vote" element={<PublicLayout><VotePage /></PublicLayout>} />
            <Route path="/player/:playerId" element={<PublicLayout><PlayerProfilePage /></PublicLayout>} />
            <Route path="/match/:fixtureId" element={<PublicLayout><MatchReportPage /></PublicLayout>} />
            {/* Auth routes */}
            <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
            <Route path="/profile" element={<PublicLayout><ProfilePage /></PublicLayout>} />
            <Route path="/cart" element={<PublicLayout><CartPage /></PublicLayout>} />
            <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
            {/* Legacy redirects */}
            <Route path="/calendar" element={<Navigate to="/team?tab=schedule" replace />} />
            <Route path="/venues" element={<Navigate to="/team?tab=venues" replace />} />
            <Route path="/seasons" element={<Navigate to="/team?tab=overview" replace />} />
            <Route path="/staff" element={<Navigate to="/team?tab=overview" replace />} />
            {/* Mobile App routes - standalone, no website nav/footer */}
            <Route path="/app/login" element={<MobileAuthProvider><MobileLoginPage /></MobileAuthProvider>} />
            <Route path="/app" element={<MobileAuthProvider><MobileApp /></MobileAuthProvider>} />
            <Route path="/app/*" element={<MobileAuthProvider><MobileApp /></MobileAuthProvider>} />
            {/* Admin routes - NO nav/footer */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
        </CustomerAuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
