import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users, Calendar, Newspaper, Trophy, GraduationCap, Mail,
  LogOut, Plus, Edit2, Trash2, X, Save, BarChart3, Building2,
  MapPin, Archive, UserCog, Zap, RefreshCw, Activity, AlertCircle,
  Check, Clock, ChevronRight, ChevronDown, Settings, Image, ArrowLeftRight,
  Package, ShoppingCart, Ticket, Shield, ClipboardList, Eye
} from "lucide-react";
import { getSoundForEvent, playMatchWhistle, playWhistleSound } from "../utils/sounds";
import ImageUpload from "../components/ImageUpload";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const authH = getAuthHeaders;

// ==================== SHARED UI COMPONENTS ====================
const FormModal = ({ title, onClose, onSave, children, saving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" data-testid="form-modal" onClick={onClose}>
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10 rounded-t-lg">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">{title}</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10" data-testid="modal-close"><X size={18} /></button>
      </div>
      <div className="p-6 space-y-5">{children}</div>
      <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a] sticky bottom-0 bg-[#161616] rounded-b-lg">
        <button onClick={onSave} disabled={saving} className="admin-btn-primary flex-1" data-testid="modal-save">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
        </button>
        <button onClick={onClose} className="admin-btn-ghost flex-1" data-testid="modal-cancel">Ακύρωση</button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const AdminInput = ({ className = "", ...props }) => (
  <input className={`admin-input ${className}`} {...props} />
);

const AdminSelect = ({ className = "", ...props }) => (
  <select className={`admin-input ${className}`} {...props} />
);

const AdminTextarea = ({ className = "", ...props }) => (
  <textarea className={`admin-input ${className}`} {...props} />
);

const TabHeader = ({ title, count, children }) => (
  <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
    <div>
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">{title}</h2>
      {count !== undefined && <span className="text-sm text-zinc-400">{count} εγγραφές</span>}
    </div>
    <div className="flex gap-2 items-center">{children}</div>
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
    <Icon size={48} strokeWidth={1} />
    <p className="mt-3 text-base">{text}</p>
  </div>
);

// ==================== ADMIN PLAYER PROFILE VIEW ====================
const AdminPlayerProfile = ({ player, academyGroups = [], onBack, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAcademy = player.team_type === "Academy";
  const calcAge = (dob) => { if (!dob) return ""; try { return Math.floor((new Date() - new Date(dob)) / 31557600000); } catch { return ""; } };
  const positionGr = { Goalkeeper: "Τερματοφύλακας", Defender: "Αμυντικός", Midfielder: "Μέσος", Forward: "Επιθετικός" };
  const resolveImg = (url) => { if (!url) return null; return url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`; };

  const [form, setForm] = useState({
    name: player.name || "", number: player.number || "", position: player.position || "Midfielder",
    nationality: player.nationality || "Cyprus", age: player.age || "",
    team_type: player.team_type || "First Team", academy_group_id: player.academy_group_id || "",
    image_url: player.image_url || "", bio: player.bio || "", height: player.height || "",
    weight: player.weight || "", preferred_foot: player.preferred_foot || "Right",
    date_of_birth: player.date_of_birth || "", joined_date: player.joined_date || "",
    contract_until: player.contract_until || "",
    parent_name: player.parent_name || "", parent_phone: player.parent_phone || "",
    parent_email: player.parent_email || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const age = isAcademy ? calcAge(form.date_of_birth) : form.age;
      const payload = { ...form, number: parseInt(form.number) || 0, age: parseInt(age) || 0 };
      if (isAcademy) {
        payload.academy_group_ids = player.academy_group_ids?.length ? player.academy_group_ids : (player.academy_group_id ? [player.academy_group_id] : []);
      }
      await axios.put(`${API}/admin/players/${player.id}`, payload, { headers: getAuthHeaders() });
      onRefresh(); setEditing(false);
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Διαγραφή παίκτη;")) return;
    try { await axios.delete(`${API}/admin/players/${player.id}`, { headers: getAuthHeaders() }); onBack(); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const imgUrl = resolveImg(editing ? form.image_url : player.image_url);
  const groupName = player.academy_group_name || academyGroups.find(g => g.id === player.academy_group_id)?.name || "";

  const InfoRow = ({ label, value }) => value ? (
    <div className="flex justify-between items-center py-2.5 border-b border-[#1e1e1e] last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  ) : null;

  return (
    <div data-testid="admin-player-profile">
      <button onClick={onBack} className="admin-btn-ghost text-sm mb-6" data-testid="back-to-players">
        <ChevronRight size={14} className="rotate-180" /> Πίσω στη λίστα
      </button>

      {/* Hero Header */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden mb-6">
        <div className="relative h-28 bg-gradient-to-r from-[#F5A623]/20 via-[#0a0a0a] to-[#0a0a0a]">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#121212] to-transparent" />
        </div>
        <div className="px-6 lg:px-8 pb-6 -mt-14 relative z-10">
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div className="w-28 h-28 rounded-xl bg-[#1a1a1a] border-4 border-[#121212] overflow-hidden flex-shrink-0">
              {imgUrl ? (
                <img src={imgUrl} alt="" className="w-full h-full object-cover" data-testid="admin-player-photo" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Users size={36} className="text-zinc-700" /></div>
              )}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-['Bebas_Neue'] text-5xl text-[#F5A623] leading-none">{player.number}</span>
                <h1 className="font-['Bebas_Neue'] text-3xl lg:text-4xl text-white leading-none" data-testid="admin-player-name">{player.name}</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="admin-badge admin-badge-default">{positionGr[player.position] || player.position}</span>
                <span className={`admin-badge ${isAcademy ? 'admin-badge-green' : 'admin-badge-blue'}`}>{isAcademy ? 'Ακαδημία' : "Α' Ομάδα"}</span>
                {isAcademy && groupName && <span className="admin-badge admin-badge-default">{groupName}</span>}
                {player.nationality && <span className="text-sm text-zinc-400 ml-1">{player.nationality}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!editing ? (
                <>
                  <button onClick={() => setEditing(true)} className="admin-btn-primary" data-testid="edit-profile-btn"><Edit2 size={14} /> Επεξεργασία</button>
                  <button onClick={handleDelete} className="admin-btn-ghost text-red-400 border-red-500/30 hover:border-red-500/50" data-testid="delete-profile-btn"><Trash2 size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-profile-btn">
                    {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
                  </button>
                  <button onClick={() => { setForm({ name: player.name || "", number: player.number || "", position: player.position || "Midfielder", nationality: player.nationality || "Cyprus", age: player.age || "", team_type: player.team_type || "First Team", academy_group_id: player.academy_group_id || "", image_url: player.image_url || "", bio: player.bio || "", height: player.height || "", weight: player.weight || "", preferred_foot: player.preferred_foot || "Right", date_of_birth: player.date_of_birth || "", joined_date: player.joined_date || "", contract_until: player.contract_until || "", parent_name: player.parent_name || "", parent_phone: player.parent_phone || "", parent_email: player.parent_email || "" }); setEditing(false); }} className="admin-btn-ghost" data-testid="cancel-edit-btn">Ακύρωση</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!editing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="player-personal-info">
            <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Προσωπικά Στοιχεία</h3>
            <InfoRow label="Ονοματεπώνυμο" value={player.name} />
            <InfoRow label="Αριθμός" value={String(player.number)} />
            <InfoRow label="Θέση" value={positionGr[player.position] || player.position} />
            <InfoRow label="Εθνικότητα" value={player.nationality} />
            {player.date_of_birth && <InfoRow label="Ημ. Γέννησης" value={new Date(player.date_of_birth).toLocaleDateString('el-GR')} />}
            <InfoRow label="Ηλικία" value={player.age ? `${player.age} ετών` : calcAge(player.date_of_birth) ? `${calcAge(player.date_of_birth)} ετών` : null} />
            <InfoRow label="Ύψος" value={player.height} />
            <InfoRow label="Βάρος" value={player.weight} />
            <InfoRow label="Πόδι" value={player.preferred_foot === 'Right' ? 'Δεξί' : player.preferred_foot === 'Left' ? 'Αριστερό' : player.preferred_foot} />
          </div>

          <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="player-team-info">
            <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Πληροφορίες Ομάδας</h3>
            <InfoRow label="Τύπος" value={isAcademy ? "Ακαδημία" : "Α' Ομάδα"} />
            {isAcademy && <InfoRow label="Ομάδα Ακαδημίας" value={groupName} />}
            {player.academy_group_ids?.length > 1 && (
              <div className="py-2.5 border-b border-[#1e1e1e]">
                <span className="text-sm text-zinc-500 block mb-2">Εγγεγραμμένος σε:</span>
                <div className="flex flex-wrap gap-1.5">
                  {player.academy_group_ids.map(gid => {
                    const g = academyGroups.find(ag => ag.id === gid);
                    return g ? <span key={gid} className="admin-badge admin-badge-green text-xs">{g.name}</span> : null;
                  })}
                </div>
              </div>
            )}
            {player.joined_date && <InfoRow label="Ημ. Ένταξης" value={player.joined_date} />}
            {player.contract_until && <InfoRow label="Συμβόλαιο έως" value={player.contract_until} />}
          </div>

          {isAcademy && (player.parent_name || player.parent_phone || player.parent_email) && (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="player-parent-info">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Γονέας / Κηδεμόνας</h3>
              <InfoRow label="Ονοματεπώνυμο" value={player.parent_name} />
              <InfoRow label="Τηλέφωνο" value={player.parent_phone} />
              <InfoRow label="Email" value={player.parent_email} />
            </div>
          )}

          {player.bio && (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 lg:col-span-2 xl:col-span-3" data-testid="player-bio-section">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Βιογραφικό</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{player.bio}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 lg:p-8" data-testid="player-edit-form">
          <h3 className="font-['Bebas_Neue'] text-xl text-white mb-6">Επεξεργασία Στοιχείων</h3>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Ονοματεπώνυμο *"><AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="profile-name-input" /></Field>
              <Field label="Αριθμός *"><AdminInput type="number" value={form.number} onChange={e => setForm({...form, number: e.target.value})} data-testid="profile-number-input" /></Field>
              <Field label="Θέση">
                <AdminSelect value={form.position} onChange={e => setForm({...form, position: e.target.value})}>
                  <option value="Goalkeeper">Τερματοφύλακας</option><option value="Defender">Αμυντικός</option><option value="Midfielder">Μέσος</option><option value="Forward">Επιθετικός</option>
                </AdminSelect>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Εθνικότητα"><AdminInput value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></Field>
              {isAcademy ? (
                <Field label="Ημ. Γέννησης">
                  <AdminInput type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                  {form.date_of_birth && <span className="text-xs text-[#10B981] mt-1 block">Ηλικία: {calcAge(form.date_of_birth)} ετών</span>}
                </Field>
              ) : (
                <Field label="Ηλικία"><AdminInput type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} /></Field>
              )}
              <Field label="Πόδι">
                <AdminSelect value={form.preferred_foot} onChange={e => setForm({...form, preferred_foot: e.target.value})}>
                  <option value="Right">Δεξί</option><option value="Left">Αριστερό</option><option value="Both">Αμφίπλευρο</option>
                </AdminSelect>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Ύψος"><AdminInput placeholder="1.85m" value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></Field>
              <Field label="Βάρος"><AdminInput placeholder="78kg" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></Field>
              {!isAcademy && (
                <Field label="Ομάδα">
                  <AdminSelect value={form.team_type} onChange={e => setForm({...form, team_type: e.target.value})}>
                    <option value="First Team">Α' Ομάδα</option><option value="Academy">Ακαδημία</option>
                  </AdminSelect>
                </Field>
              )}
            </div>
            {isAcademy && (
              <div className="border-t border-[#262626] pt-5">
                <h4 className="text-white text-sm font-semibold mb-4">Γονέας / Κηδεμόνας</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="Ονοματεπώνυμο"><AdminInput value={form.parent_name} onChange={e => setForm({...form, parent_name: e.target.value})} /></Field>
                  <Field label="Τηλέφωνο"><AdminInput value={form.parent_phone} onChange={e => setForm({...form, parent_phone: e.target.value})} /></Field>
                  <Field label="Email"><AdminInput type="email" value={form.parent_email} onChange={e => setForm({...form, parent_email: e.target.value})} /></Field>
                </div>
              </div>
            )}
            <ImageUpload currentUrl={form.image_url} onImageChange={url => setForm({...form, image_url: url})} playerId={player.id} />
            <Field label="Βιογραφικό"><AdminTextarea rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></Field>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== DASHBOARD TAB ====================
const DashboardTab = ({ stats, onTabChange }) => {
  const cards = [
    { label: "Ομάδες", value: stats.teams_count, icon: Shield, color: "#F5A623", tab: "teams" },
    { label: "Α' Ομάδα", value: stats.first_team_players, icon: Users, color: "#3B82F6", tab: "teams" },
    { label: "Ακαδημία", value: stats.academy_players, icon: GraduationCap, color: "#10B981", tab: "academy" },
    { label: "Αγώνες", value: stats.total_fixtures, icon: Calendar, color: "#F5A623", tab: "teams" },
    { label: "Νέα", value: stats.news_articles, icon: Newspaper, color: "#06B6D4", tab: "news" },
    { label: "Μηνύματα", value: stats.unread_messages, icon: Mail, color: "#EF4444", tab: "messages" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide mb-6">Πίνακας Ελέγχου</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <button key={i} onClick={() => onTabChange(c.tab)} className="admin-stat-card group text-left" data-testid={`stat-${c.label}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: c.color + '18'}}>
                <c.icon size={20} style={{color: c.color}} />
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
            </div>
            <div className="font-['Bebas_Neue'] text-4xl text-white">{c.value ?? 0}</div>
            <div className="text-sm text-zinc-300 mt-1">{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ==================== LIVE SCORE TAB ====================
// ==================== MATCH CONTROL CENTER ====================
const EVENT_LABELS = {
  goal: { label: "Γκολ", icon: "⚽", color: "text-green-400" },
  penalty_scored: { label: "Πέναλτι (Γκολ)", icon: "⚽", color: "text-green-400" },
  penalty_missed: { label: "Πέναλτι (Χαμένο)", icon: "❌", color: "text-red-400" },
  own_goal: { label: "Αυτογκόλ", icon: "⚽", color: "text-orange-400" },
  yellow_card: { label: "Κίτρινη", icon: "🟡", color: "text-yellow-400" },
  red_card: { label: "Κόκκινη", icon: "🔴", color: "text-red-500" },
  second_yellow: { label: "2η Κίτρινη", icon: "🟡🔴", color: "text-red-400" },
  substitution: { label: "Αλλαγή", icon: "🔄", color: "text-blue-400" },
  var_decision: { label: "VAR", icon: "📺", color: "text-purple-400" },
};

const MatchControlCenter = ({ fixture, players, onRefresh, onBack }) => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eventForm, setEventForm] = useState({ event_type: "goal", minute: "", added_time: "", team: "home", player_name: "", secondary_player_name: "", description: "" });

  const fetchMatchData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [evRes, stRes] = await Promise.all([
        axios.get(`${API}/admin/fixtures/${fixture.id}/events`, { headers }),
        axios.get(`${API}/admin/fixtures/${fixture.id}/stats`, { headers }),
      ]);
      setEvents(evRes.data);
      setStats(stRes.data);
    } catch (e) { console.error(e); }
  }, [fixture.id]);

  useEffect(() => { fetchMatchData(); }, [fetchMatchData]);

  const updateLiveScore = async (field, value) => {
    try {
      await axios.put(`${API}/admin/fixtures/${fixture.id}/live-score`, { [field]: parseInt(value) || 0 }, { headers: getAuthHeaders() });
      onRefresh();
    } catch (e) { alert("Σφάλμα"); }
  };

  const setMatchStatus = async (status) => {
    try {
      await axios.put(`${API}/admin/fixtures/${fixture.id}/live-score`, { status, home_score: fixture.home_score ?? 0, away_score: fixture.away_score ?? 0 }, { headers: getAuthHeaders() });
      // Play whistle for status changes
      if (status === 'Live' || status === 'Completed') playMatchWhistle();
      else if (status === 'Half Time') playWhistleSound();
      onRefresh();
    } catch (e) { alert("Σφάλμα"); }
  };

  const addEvent = async () => {
    if (!eventForm.minute) return alert("Λεπτό απαιτείται");
    setSaving(true);
    try {
      const payload = { ...eventForm, minute: parseInt(eventForm.minute), added_time: eventForm.added_time ? parseInt(eventForm.added_time) : null };
      await axios.post(`${API}/admin/fixtures/${fixture.id}/events`, payload, { headers: getAuthHeaders() });
      // Play sound effect for the event
      const soundFn = getSoundForEvent(eventForm.event_type);
      if (soundFn) soundFn();
      setShowEventForm(false);
      setEventForm({ event_type: "goal", minute: "", added_time: "", team: "home", player_name: "", secondary_player_name: "", description: "" });
      fetchMatchData();
      onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const deleteEvent = async (eventId) => {
    if (!confirm("Διαγραφή συμβάντος;")) return;
    try {
      await axios.delete(`${API}/admin/fixtures/${fixture.id}/events/${eventId}`, { headers: getAuthHeaders() });
      fetchMatchData();
      onRefresh();
    } catch (e) { alert("Σφάλμα"); }
  };

  const updateStat = async (field, value) => {
    try {
      await axios.put(`${API}/admin/fixtures/${fixture.id}/stats`, { [field]: parseInt(value) || 0 }, { headers: getAuthHeaders() });
      fetchMatchData();
    } catch (e) { console.error(e); }
  };

  const isLive = fixture.status === "Live" || fixture.status === "Half Time";
  const homeEvents = events.filter(e => e.team === "home");
  const awayEvents = events.filter(e => e.team === "away");

  return (
    <div data-testid="match-control-center">
      {/* Back Button */}
      <button onClick={onBack} className="admin-btn-ghost text-xs mb-4" data-testid="back-to-list">
        <ChevronRight size={13} className="rotate-180" /> Πίσω στους αγώνες
      </button>

      {/* Match Header */}
      <div className={`admin-card p-6 mb-4 ${isLive ? 'border-red-500/30' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500">{fixture.competition} | {new Date(fixture.match_date).toLocaleDateString('el-GR')}</span>
          {isLive && <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>{fixture.status === 'Half Time' ? 'ΗΜΙΧΡΟΝΟ' : 'LIVE'}{stats?.match_minute ? ` ${stats.match_minute}'` : ''}</span>}
          {fixture.status === 'Completed' && <span className="badge-completed text-xs">Ολοκληρωμένος</span>}
        </div>

        <div className="flex items-center justify-center gap-6 my-4">
          <div className="flex-1 text-right">
            <span className={`font-['Bebas_Neue'] text-2xl ${fixture.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{fixture.home_team}</span>
          </div>
          <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-xl px-5 py-3">
            <input type="number" min="0" value={fixture.home_score ?? 0} onChange={e => updateLiveScore('home_score', e.target.value)}
              className="w-12 h-10 bg-transparent text-center text-white font-['Bebas_Neue'] text-4xl border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              data-testid="mcc-home-score" />
            <span className="text-zinc-600 font-bold text-xl">:</span>
            <input type="number" min="0" value={fixture.away_score ?? 0} onChange={e => updateLiveScore('away_score', e.target.value)}
              className="w-12 h-10 bg-transparent text-center text-white font-['Bebas_Neue'] text-4xl border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              data-testid="mcc-away-score" />
          </div>
          <div className="flex-1">
            <span className={`font-['Bebas_Neue'] text-2xl ${fixture.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{fixture.away_team}</span>
          </div>
        </div>

        {/* Status Controls */}
        <div className="flex gap-2 justify-center flex-wrap">
          {fixture.status === 'Scheduled' && <button onClick={() => setMatchStatus('Live')} className="admin-btn-sm bg-red-500/20 text-red-400 hover:bg-red-500/30" data-testid="start-match-btn"><Zap size={12} /> Έναρξη Αγώνα</button>}
          {fixture.status === 'Live' && <button onClick={() => setMatchStatus('Half Time')} className="admin-btn-sm bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" data-testid="half-time-btn"><Clock size={12} /> Ημίχρονο</button>}
          {fixture.status === 'Half Time' && <button onClick={() => setMatchStatus('Live')} className="admin-btn-sm bg-red-500/20 text-red-400 hover:bg-red-500/30" data-testid="second-half-btn"><Zap size={12} /> Β' Ημίχρονο</button>}
          {(fixture.status === 'Live' || fixture.status === 'Half Time') && <button onClick={() => setMatchStatus('Completed')} className="admin-btn-sm bg-green-500/20 text-green-400 hover:bg-green-500/30" data-testid="end-match-btn"><Check size={12} /> Τέλος Αγώνα</button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Events Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Event Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider">Συμβάντα Αγώνα ({events.length})</h3>
            <button onClick={() => setShowEventForm(true)} className="admin-btn-primary text-xs" data-testid="add-event-btn"><Plus size={13} /> Νέο Συμβάν</button>
          </div>

          {/* Events Timeline */}
          <div className="admin-card divide-y divide-[#1e1e1e]">
            {events.length === 0 && <div className="p-8 text-center text-zinc-600 text-sm">Δεν υπάρχουν συμβάντα</div>}
            {events.map(ev => {
              const meta = EVENT_LABELS[ev.event_type] || { label: ev.event_type, icon: "•", color: "text-zinc-400" };
              return (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02]" data-testid={`event-${ev.id}`}>
                  <span className="font-mono text-xs text-zinc-500 w-12 text-right flex-shrink-0">{ev.minute}'{ev.added_time ? `+${ev.added_time}` : ''}</span>
                  <span className="text-sm w-5 text-center">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${meta.color}`}>{ev.player_name || ''}</span>
                    {ev.event_type === 'substitution' && ev.secondary_player_name && (
                      <span className="text-xs text-zinc-500 ml-1"> (→ {ev.secondary_player_name})</span>
                    )}
                    <span className="text-xs text-zinc-600 ml-2">{meta.label}</span>
                    {ev.description && <span className="text-xs text-zinc-700 ml-1">| {ev.description}</span>}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${ev.team === 'home' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {ev.team === 'home' ? 'Γηπ.' : 'Φιλ.'}
                  </span>
                  <button onClick={() => deleteEvent(ev.id)} className="admin-icon-btn text-red-500/40 hover:text-red-400 flex-shrink-0"><Trash2 size={12} /></button>
                </div>
              );
            })}
          </div>

          {/* Scorer Summary */}
          {events.filter(e => ['goal', 'penalty_scored', 'own_goal'].includes(e.event_type)).length > 0 && (
            <div className="admin-card p-4">
              <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Σκόρερ</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-zinc-600 mb-2 block">{fixture.home_team}</span>
                  {homeEvents.filter(e => ['goal', 'penalty_scored'].includes(e.event_type)).map(e => (
                    <div key={e.id} className="text-sm text-white">{e.player_name} <span className="text-zinc-500">{e.minute}'</span> {e.event_type === 'penalty_scored' && <span className="text-zinc-600">(πεν.)</span>}</div>
                  ))}
                  {awayEvents.filter(e => e.event_type === 'own_goal').map(e => (
                    <div key={e.id} className="text-sm text-orange-400">{e.player_name} <span className="text-zinc-500">{e.minute}'</span> <span className="text-zinc-600">(αυτ.)</span></div>
                  ))}
                </div>
                <div>
                  <span className="text-xs text-zinc-600 mb-2 block">{fixture.away_team}</span>
                  {awayEvents.filter(e => ['goal', 'penalty_scored'].includes(e.event_type)).map(e => (
                    <div key={e.id} className="text-sm text-white">{e.player_name} <span className="text-zinc-500">{e.minute}'</span> {e.event_type === 'penalty_scored' && <span className="text-zinc-600">(πεν.)</span>}</div>
                  ))}
                  {homeEvents.filter(e => e.event_type === 'own_goal').map(e => (
                    <div key={e.id} className="text-sm text-orange-400">{e.player_name} <span className="text-zinc-500">{e.minute}'</span> <span className="text-zinc-600">(αυτ.)</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Match Stats */}
        <div className="space-y-4">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider">Στατιστικά Αγώνα</h3>
          {stats && (
            <div className="admin-card p-4 space-y-3">
              <StatRow label="Λεπτό" home={stats.match_minute} isMinute onUpdate={(v) => updateStat('match_minute', v)} />
              <div className="border-t border-[#1e1e1e] pt-3">
                <StatRow label="Κατοχή %" home={stats.home_possession} away={stats.away_possession} isPossession onUpdate={(field, v) => updateStat(field, v)} />
              </div>
              <StatRow label="Σουτ" home={stats.home_shots} away={stats.away_shots} onUpdate={(field, v) => updateStat(field, v)} fieldBase="shots" />
              <StatRow label="Στόχο" home={stats.home_shots_on_target} away={stats.away_shots_on_target} onUpdate={(field, v) => updateStat(field, v)} fieldBase="shots_on_target" />
              <StatRow label="Κόρνερ" home={stats.home_corners} away={stats.away_corners} onUpdate={(field, v) => updateStat(field, v)} fieldBase="corners" />
              <StatRow label="Φάουλ" home={stats.home_fouls} away={stats.away_fouls} onUpdate={(field, v) => updateStat(field, v)} fieldBase="fouls" />
              <StatRow label="Οφσάιντ" home={stats.home_offsides} away={stats.away_offsides} onUpdate={(field, v) => updateStat(field, v)} fieldBase="offsides" />
              <StatRow label="Αποκρούσεις" home={stats.home_saves} away={stats.away_saves} onUpdate={(field, v) => updateStat(field, v)} fieldBase="saves" />
            </div>
          )}

          {/* Quick Event Buttons */}
          <div className="admin-card p-4">
            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Γρήγορες Ενέργειες</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: "goal", label: "Γκολ", icon: "⚽" },
                { type: "yellow_card", label: "Κίτρινη", icon: "🟡" },
                { type: "red_card", label: "Κόκκινη", icon: "🔴" },
                { type: "substitution", label: "Αλλαγή", icon: "🔄" },
                { type: "penalty_scored", label: "Πέναλτι", icon: "⚽" },
                { type: "own_goal", label: "Αυτογκόλ", icon: "⚽" },
              ].map(btn => (
                <button key={btn.type} onClick={() => { setEventForm({...eventForm, event_type: btn.type}); setShowEventForm(true); }}
                  className="admin-btn-ghost text-xs justify-center" data-testid={`quick-${btn.type}`}>
                  <span>{btn.icon}</span> {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showEventForm && (
        <FormModal title="Νέο Συμβάν" onClose={() => setShowEventForm(false)} onSave={addEvent} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Τύπος *">
              <AdminSelect value={eventForm.event_type} onChange={e => setEventForm({...eventForm, event_type: e.target.value})} data-testid="event-type-select">
                <option value="goal">Γκολ</option>
                <option value="penalty_scored">Πέναλτι (Γκολ)</option>
                <option value="penalty_missed">Πέναλτι (Χαμένο)</option>
                <option value="own_goal">Αυτογκόλ</option>
                <option value="yellow_card">Κίτρινη Κάρτα</option>
                <option value="red_card">Κόκκινη Κάρτα</option>
                <option value="second_yellow">2η Κίτρινη</option>
                <option value="substitution">Αλλαγή</option>
                <option value="var_decision">VAR</option>
              </AdminSelect>
            </Field>
            <Field label="Ομάδα *">
              <AdminSelect value={eventForm.team} onChange={e => setEventForm({...eventForm, team: e.target.value})} data-testid="event-team-select">
                <option value="home">{fixture.home_team} (Γηπ.)</option>
                <option value="away">{fixture.away_team} (Φιλ.)</option>
              </AdminSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Λεπτό *"><AdminInput type="number" min="1" max="120" placeholder="45" value={eventForm.minute} onChange={e => setEventForm({...eventForm, minute: e.target.value})} data-testid="event-minute-input" /></Field>
            <Field label="Πρόσθετος χρόνος"><AdminInput type="number" min="0" placeholder="0" value={eventForm.added_time} onChange={e => setEventForm({...eventForm, added_time: e.target.value})} /></Field>
          </div>
          <Field label="Παίκτης">
            <AdminInput placeholder="Όνομα παίκτη" value={eventForm.player_name} onChange={e => setEventForm({...eventForm, player_name: e.target.value})} data-testid="event-player-input" list="player-suggestions" />
            <datalist id="player-suggestions">
              {players.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
          </Field>
          {eventForm.event_type === 'substitution' && (
            <Field label="Αντικαταστάτης (Εισερχόμενος)">
              <AdminInput placeholder="Όνομα παίκτη" value={eventForm.secondary_player_name} onChange={e => setEventForm({...eventForm, secondary_player_name: e.target.value})} data-testid="event-sub-player-input" list="player-suggestions" />
            </Field>
          )}
          <Field label="Σημείωση"><AdminInput placeholder="Προαιρετικό" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} /></Field>
        </FormModal>
      )}
    </div>
  );
};

// Stat Row Component for match stats
const StatRow = ({ label, home, away, onUpdate, fieldBase, isPossession, isMinute }) => {
  if (isMinute) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <input type="number" min="0" max="120" value={home || 0} onChange={e => onUpdate(parseInt(e.target.value) || 0)}
          className="w-14 h-7 bg-[#0a0a0a] text-center text-white text-sm border border-[#222] rounded outline-none focus:border-[#F5A623] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          data-testid="stat-minute" />
      </div>
    );
  }

  if (isPossession) {
    return (
      <div className="flex items-center gap-2">
        <input type="number" min="0" max="100" value={home || 50} onChange={e => onUpdate('home_possession', parseInt(e.target.value) || 0)}
          className="w-12 h-7 bg-[#0a0a0a] text-center text-white text-sm border border-[#222] rounded outline-none focus:border-[#F5A623] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-full bg-[#F5A623] transition-all" style={{ width: `${home || 50}%` }}></div>
        </div>
        <span className="text-xs text-zinc-500 w-8 text-right">{away || 50}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input type="number" min="0" value={home || 0} onChange={e => onUpdate(`home_${fieldBase}`, parseInt(e.target.value) || 0)}
        className="w-10 h-7 bg-[#0a0a0a] text-center text-white text-sm border border-[#222] rounded outline-none focus:border-[#F5A623] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      <span className="flex-1 text-center text-xs text-zinc-500">{label}</span>
      <input type="number" min="0" value={away || 0} onChange={e => onUpdate(`away_${fieldBase}`, parseInt(e.target.value) || 0)}
        className="w-10 h-7 bg-[#0a0a0a] text-center text-white text-sm border border-[#222] rounded outline-none focus:border-[#F5A623] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
    </div>
  );
};

// Live Score Tab (with Match Selector -> Control Center)
const LiveScoreTab = ({ fixtures, players, onRefresh }) => {
  const [selectedFixture, setSelectedFixture] = useState(null);

  // Auto-select live match if any
  useEffect(() => {
    const live = fixtures.find(f => f.status === 'Live' || f.status === 'Half Time');
    if (live && !selectedFixture) setSelectedFixture(live);
  }, [fixtures, selectedFixture]);

  if (selectedFixture) {
    const current = fixtures.find(f => f.id === selectedFixture.id) || selectedFixture;
    return <MatchControlCenter fixture={current} players={players} onRefresh={onRefresh} onBack={() => setSelectedFixture(null)} />;
  }

  const upcoming = fixtures.filter(f => f.status === 'Scheduled' || f.status === 'Live' || f.status === 'Half Time').sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const completed = fixtures.filter(f => f.status === 'Completed').sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

  return (
    <div data-testid="admin-livescore-tab">
      <TabHeader title="Live Score">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Activity size={14} /> Επιλέξτε αγώνα</span>
      </TabHeader>

      {upcoming.length === 0 && <EmptyState icon={Calendar} text="Δεν υπάρχουν προγραμματισμένοι αγώνες" />}

      <div className="space-y-2 mb-8">
        {upcoming.map(f => (
          <button key={f.id} onClick={() => setSelectedFixture(f)} className={`admin-card p-4 w-full text-left hover:border-[#F5A623]/40 transition-colors ${f.status === 'Live' || f.status === 'Half Time' ? 'border-red-500/40 bg-red-500/5' : ''}`} data-testid={`select-fixture-${f.id}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{new Date(f.match_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })} | {f.competition}</span>
              {(f.status === 'Live' || f.status === 'Half Time') && <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>{f.status === 'Half Time' ? 'HT' : 'LIVE'}</span>}
              {f.status === 'Scheduled' && <span className="admin-badge admin-badge-default text-[10px]">Προγρ.</span>}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className={`font-['Bebas_Neue'] text-lg ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.home_team}</span>
              <span className="font-['Bebas_Neue'] text-xl text-white">{f.home_score ?? 0} : {f.away_score ?? 0}</span>
              <span className={`font-['Bebas_Neue'] text-lg ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.away_team}</span>
            </div>
          </button>
        ))}
      </div>

      {completed.length > 0 && (
        <>
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Ολοκληρωμένοι</h3>
          <div className="space-y-2">
            {completed.slice(0, 5).map(f => (
              <button key={f.id} onClick={() => setSelectedFixture(f)} className="admin-card px-4 py-3 flex items-center justify-between w-full text-left hover:border-zinc-700 transition-colors">
                <span className="text-xs text-zinc-500">{new Date(f.match_date).toLocaleDateString('el-GR')}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.home_team}</span>
                  <span className="font-['Bebas_Neue'] text-lg text-white">{f.home_score} - {f.away_score}</span>
                  <span className={`text-sm ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.away_team}</span>
                </div>
                <span className="badge-completed text-xs">Ολοκλ.</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== PLAYERS TAB ====================
const PlayersTab = ({ players, academyGroups, onRefresh }) => {
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showTransfer, setShowTransfer] = useState(null);
  const [transferForm, setTransferForm] = useState({ from_team: 'LEFTERIA FC', to_team: '', transfer_date: '', transfer_type: 'Out', fee: '', notes: '' });
  const [savingTransfer, setSavingTransfer] = useState(false);
  const emptyPlayer = {
    name: "", number: "", position: "Midfielder", nationality: "Cyprus", age: "",
    team_type: "First Team", academy_group_id: "", image_url: "", bio: "",
    height: "", weight: "", preferred_foot: "Right", date_of_birth: "",
    joined_date: "", contract_until: ""
  };
  const [form, setForm] = useState(emptyPlayer);

  const openCreate = () => { setForm(emptyPlayer); setEditPlayer(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name || "", number: p.number || "", position: p.position || "Midfielder",
      nationality: p.nationality || "Cyprus", age: p.age || "",
      team_type: p.team_type || "First Team", academy_group_id: p.academy_group_id || "",
      image_url: p.image_url || "", bio: p.bio || "", height: p.height || "",
      weight: p.weight || "", preferred_foot: p.preferred_foot || "Right",
      date_of_birth: p.date_of_birth || "", joined_date: p.joined_date || "",
      contract_until: p.contract_until || ""
    });
    setEditPlayer(p); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, number: parseInt(form.number) || 0, age: parseInt(form.age) || 0 };
      if (editPlayer) await axios.put(`${API}/admin/players/${editPlayer.id}`, payload, { headers });
      else await axios.post(`${API}/admin/players`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή παίκτη;")) return;
    try { await axios.delete(`${API}/admin/players/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const handleTransfer = async () => {
    if (!transferForm.to_team || !transferForm.transfer_date) { alert("Συμπληρώστε ομάδα και ημερομηνία"); return; }
    setSavingTransfer(true);
    try {
      await axios.post(`${API}/admin/players/${showTransfer.id}/transfer`, {
        player_id: showTransfer.id,
        player_name: showTransfer.name,
        ...transferForm,
      }, { headers: getAuthHeaders() });
      setShowTransfer(null);
      onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSavingTransfer(false); }
  };

  const openTransfer = (p) => {
    setTransferForm({ from_team: 'LEFTERIA FC', to_team: '', transfer_date: new Date().toISOString().split('T')[0], transfer_type: 'Out', fee: '', notes: '' });
    setShowTransfer(p);
  };

  const filtered = filter === "all" ? players : filter === "first_team" ? players.filter(p => p.team_type === "First Team") : players.filter(p => p.team_type === "Academy");

  // If viewing a player, show profile
  if (viewingPlayer) {
    const freshPlayer = players.find(p => p.id === viewingPlayer.id) || viewingPlayer;
    return <AdminPlayerProfile player={freshPlayer} academyGroups={academyGroups} onBack={() => setViewingPlayer(null)} onRefresh={onRefresh} />;
  }

  return (
    <div data-testid="admin-players-tab">
      <TabHeader title="Παίκτες" count={players.length}>
        <AdminSelect value={filter} onChange={e => setFilter(e.target.value)} className="w-auto text-xs" data-testid="player-filter">
          <option value="all">Όλοι</option>
          <option value="first_team">Α' Ομάδα</option>
          <option value="academy">Ακαδημία</option>
        </AdminSelect>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-player-btn"><Plus size={14} /> Νέος Παίκτης</button>
      </TabHeader>

      <div className="admin-table-wrap">
        <table className="admin-table" data-testid="admin-players-table">
          <thead><tr><th>#</th><th></th><th>Όνομα</th><th>Θέση</th><th>Ηλικία</th><th>Ομάδα</th><th></th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => setViewingPlayer(p)}>
                <td className="font-mono text-zinc-500">{p.number}</td>
                <td>{p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 object-cover rounded-full" /> : <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center"><Users size={12} className="text-zinc-700" /></div>}</td>
                <td className="font-medium text-[#F5A623] hover:underline" data-testid={`view-player-${p.id}`}>{p.name}</td>
                <td className="text-zinc-400">{p.position}</td>
                <td className="text-zinc-400">{p.age}</td>
                <td><span className={`admin-badge ${p.team_type === 'Academy' ? 'admin-badge-green' : 'admin-badge-blue'}`}>{p.team_type === 'First Team' ? "Α'" : 'Ακαδ.'}</span></td>
                <td>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="admin-icon-btn" data-testid={`edit-player-${p.id}`}><Edit2 size={13} /></button>
                    <button onClick={() => openTransfer(p)} className="admin-icon-btn text-blue-500/60 hover:text-blue-400" data-testid={`transfer-player-${p.id}`} title="Μεταγραφή"><ArrowLeftRight size={13} /></button>
                    <button onClick={() => handleDelete(p.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400" data-testid={`delete-player-${p.id}`}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <FormModal title={editPlayer ? "Επεξεργασία Παίκτη" : "Νέος Παίκτης"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Όνομα *"><AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="player-name-input" /></Field>
            <Field label="Αριθμός *"><AdminInput type="number" value={form.number} onChange={e => setForm({...form, number: e.target.value})} data-testid="player-number-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Θέση *">
              <AdminSelect value={form.position} onChange={e => setForm({...form, position: e.target.value})} data-testid="player-position-select">
                <option value="Goalkeeper">Τερματοφύλακας</option><option value="Defender">Αμυντικός</option><option value="Midfielder">Μέσος</option><option value="Forward">Επιθετικός</option>
              </AdminSelect>
            </Field>
            <Field label="Εθνικότητα"><AdminInput value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ηλικία *"><AdminInput type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} data-testid="player-age-input" /></Field>
            <Field label="Ύψος"><AdminInput placeholder="1.85m" value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></Field>
            <Field label="Βάρος"><AdminInput placeholder="78kg" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ομάδα">
              <AdminSelect value={form.team_type} onChange={e => setForm({...form, team_type: e.target.value})} data-testid="player-team-type-select">
                <option value="First Team">Α' Ομάδα</option><option value="Academy">Ακαδημία</option>
              </AdminSelect>
            </Field>
            {form.team_type === "Academy" && (
              <Field label="Ομάδα Ακαδημίας">
                <AdminSelect value={form.academy_group_id} onChange={e => setForm({...form, academy_group_id: e.target.value})}>
                  <option value="">-- Καμία --</option>
                  {academyGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.age_range})</option>)}
                </AdminSelect>
              </Field>
            )}
          </div>
          <ImageUpload currentUrl={form.image_url} onImageChange={url => setForm({...form, image_url: url})} playerId={editPlayer?.id} />
          <Field label="Βιογραφικό"><AdminTextarea rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></Field>
        </FormModal>
      )}
      {showTransfer && (
        <FormModal title={`Μεταγραφή: ${showTransfer.name}`} onClose={() => setShowTransfer(null)} onSave={handleTransfer} saving={savingTransfer}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Τύπος Μεταγραφής *">
              <AdminSelect value={transferForm.transfer_type} onChange={e => setTransferForm({...transferForm, transfer_type: e.target.value})} data-testid="transfer-type-select">
                <option value="Out">Αποχώρηση</option>
                <option value="In">Απόκτηση</option>
                <option value="Loan Out">Δανεισμός (Εξ.)</option>
                <option value="Loan In">Δανεισμός (Εισ.)</option>
              </AdminSelect>
            </Field>
            <Field label="Ημερομηνία *"><AdminInput type="date" value={transferForm.transfer_date} onChange={e => setTransferForm({...transferForm, transfer_date: e.target.value})} data-testid="transfer-date-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Από"><AdminInput value={transferForm.from_team} onChange={e => setTransferForm({...transferForm, from_team: e.target.value})} data-testid="transfer-from-input" /></Field>
            <Field label="Προς *"><AdminInput value={transferForm.to_team} onChange={e => setTransferForm({...transferForm, to_team: e.target.value})} data-testid="transfer-to-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Αντίτιμο"><AdminInput placeholder="Ελεύθερος / €10.000" value={transferForm.fee} onChange={e => setTransferForm({...transferForm, fee: e.target.value})} /></Field>
            <Field label="Σημειώσεις"><AdminInput value={transferForm.notes} onChange={e => setTransferForm({...transferForm, notes: e.target.value})} /></Field>
          </div>
        </FormModal>
      )}
    </div>
  );
};

// ==================== ACADEMY GROUPS TAB ====================
const AcademyGroupsTab = ({ groups, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyGroup = { name: "", age_range: "", coach_name: "", training_schedule: "", description: "", max_players: 25, season: "2025/26" };
  const [form, setForm] = useState(emptyGroup);

  const openCreate = () => { setForm(emptyGroup); setEditGroup(null); setShowForm(true); };
  const openEdit = (g) => { setForm({ name: g.name, age_range: g.age_range, coach_name: g.coach_name || "", training_schedule: g.training_schedule, description: g.description, max_players: g.max_players, season: g.season || "2025/26" }); setEditGroup(g); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, max_players: parseInt(form.max_players) || 25 };
      if (editGroup) await axios.put(`${API}/admin/academy-groups/${editGroup.id}`, payload, { headers });
      else await axios.post(`${API}/admin/academy-groups`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή ομάδας;")) return;
    try { await axios.delete(`${API}/admin/academy-groups/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-academy-tab">
      <TabHeader title="Ομάδες Ακαδημίας" count={groups.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-academy-group-btn"><Plus size={14} /> Νέα Ομάδα</button>
      </TabHeader>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map(g => (
          <div key={g.id} className="admin-card p-5" data-testid={`academy-group-${g.id}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">{g.name}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(g)} className="admin-icon-btn"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(g.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
            <span className="admin-badge admin-badge-default mb-2">{g.age_range}</span>
            <p className="text-zinc-300 text-sm mb-1">{g.coach_name}</p>
            <p className="text-zinc-600 text-xs flex items-center gap-1"><Clock size={11} /> {g.training_schedule}</p>
          </div>
        ))}
      </div>
      {showForm && (
        <FormModal title={editGroup ? "Επεξεργασία" : "Νέα Ομάδα"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Όνομα *"><AdminInput placeholder="U18" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="group-name-input" /></Field>
            <Field label="Ηλικίες *"><AdminInput placeholder="16-18 ετών" value={form.age_range} onChange={e => setForm({...form, age_range: e.target.value})} /></Field>
          </div>
          <Field label="Προπονητής"><AdminInput value={form.coach_name} onChange={e => setForm({...form, coach_name: e.target.value})} /></Field>
          <Field label="Πρόγραμμα"><AdminInput value={form.training_schedule} onChange={e => setForm({...form, training_schedule: e.target.value})} /></Field>
          <Field label="Περιγραφή"><AdminTextarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
        </FormModal>
      )}
    </div>
  );
};

// ==================== STAFF TAB ====================
const StaffTab = ({ staff, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyStaff = { name: "", role: "Head Coach", nationality: "Cyprus", team_type: "First Team", image_url: "", bio: "" };
  const [form, setForm] = useState(emptyStaff);
  const roles = { "Head Coach": "Προπονητής", "Assistant Coach": "Βοηθός", "Goalkeeper Coach": "Προπ. Τερμ.", "Fitness Coach": "Γυμναστής", "Physiotherapist": "Φυσιοθ.", "Team Manager": "Διευθυντής", "Youth Coach": "Προπ. Νέων", "Scout": "Ανιχνευτής" };

  const openCreate = () => { setForm(emptyStaff); setEditStaff(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ name: s.name, role: s.role, nationality: s.nationality || "Cyprus", team_type: s.team_type || "First Team", image_url: s.image_url || "", bio: s.bio || "" }); setEditStaff(s); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (editStaff) await axios.put(`${API}/admin/staff/${editStaff.id}`, form, { headers });
      else await axios.post(`${API}/admin/staff`, form, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/staff/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-staff-tab">
      <TabHeader title="Τεχνικό Επιτελείο" count={staff.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-staff-btn"><Plus size={14} /> Νέο Μέλος</button>
      </TabHeader>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th></th><th>Όνομα</th><th>Ρόλος</th><th>Ομάδα</th><th></th></tr></thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td>{s.image_url ? <img src={s.image_url} alt="" className="w-8 h-8 object-cover rounded-full" /> : <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center"><UserCog size={12} className="text-zinc-700" /></div>}</td>
                <td className="font-medium text-white">{s.name}</td>
                <td className="text-zinc-400">{roles[s.role] || s.role}</td>
                <td><span className="admin-badge admin-badge-default">{s.team_type === 'First Team' ? "Α'" : 'Ακαδ.'}</span></td>
                <td><div className="flex gap-1"><button onClick={() => openEdit(s)} className="admin-icon-btn"><Edit2 size={13} /></button><button onClick={() => handleDelete(s.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button></div></td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={5}><EmptyState icon={UserCog} text="Δεν υπάρχουν μέλη" /></td></tr>}
          </tbody>
        </table>
      </div>
      {showForm && (
        <FormModal title={editStaff ? "Επεξεργασία" : "Νέο Μέλος"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Όνομα *"><AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="staff-name-input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ρόλος"><AdminSelect value={form.role} onChange={e => setForm({...form, role: e.target.value})}>{Object.entries(roles).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</AdminSelect></Field>
            <Field label="Εθνικότητα"><AdminInput value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></Field>
          </div>
          <Field label="Ομάδα"><AdminSelect value={form.team_type} onChange={e => setForm({...form, team_type: e.target.value})}><option value="First Team">Α' Ομάδα</option><option value="Academy">Ακαδημία</option></AdminSelect></Field>
          <Field label="URL Φωτογραφίας"><AdminInput value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></Field>
          <Field label="Βιογραφικό"><AdminTextarea rows={2} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></Field>
        </FormModal>
      )}
    </div>
  );
};

// ==================== FIXTURES TAB ====================
const FixturesTab = ({ fixtures, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editFixture, setEditFixture] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyFixture = { home_team: "LEFTERIA FC", away_team: "", home_score: "", away_score: "", match_date: "", match_time: "", venue: "Γήπεδο Αετού", competition: "ΠΑΑΟΚ Α' Όμιλος", season: "2025/26", status: "Scheduled", attendance: "", referee: "" };
  const [form, setForm] = useState(emptyFixture);

  const openCreate = () => { setForm(emptyFixture); setEditFixture(null); setShowForm(true); };
  const openEdit = (f) => { setForm({ home_team: f.home_team, away_team: f.away_team, home_score: f.home_score ?? "", away_score: f.away_score ?? "", match_date: f.match_date ? f.match_date.split('T')[0] : "", match_time: f.match_time || "", venue: f.venue, competition: f.competition, season: f.season || "2025/26", status: f.status, attendance: f.attendance ?? "", referee: f.referee || "" }); setEditFixture(f); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, home_score: form.home_score !== "" ? parseInt(form.home_score) : null, away_score: form.away_score !== "" ? parseInt(form.away_score) : null, attendance: form.attendance !== "" ? parseInt(form.attendance) : null, match_date: form.match_date + (form.match_time ? `T${form.match_time}:00Z` : "T15:00:00Z") };
      if (editFixture) await axios.put(`${API}/admin/fixtures/${editFixture.id}`, payload, { headers });
      else await axios.post(`${API}/admin/fixtures`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/fixtures/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-fixtures-tab">
      <TabHeader title="Αγώνες" count={fixtures.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-fixture-btn"><Plus size={14} /> Νέος Αγώνας</button>
      </TabHeader>
      <div className="admin-table-wrap">
        <table className="admin-table" data-testid="admin-fixtures-table">
          <thead><tr><th>Ημ/νία</th><th>Γηπεδούχος</th><th>Σκορ</th><th>Φιλοξ.</th><th>Κατάσταση</th><th></th></tr></thead>
          <tbody>
            {fixtures.map(f => (
              <tr key={f.id}>
                <td className="text-xs text-zinc-500">{new Date(f.match_date).toLocaleDateString('el-GR')}</td>
                <td className={f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623] font-medium' : 'text-zinc-300'}>{f.home_team}</td>
                <td className="font-['Bebas_Neue'] text-white">{f.status === 'Completed' || f.status === 'Live' ? `${f.home_score ?? 0} - ${f.away_score ?? 0}` : '-'}</td>
                <td className={f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623] font-medium' : 'text-zinc-300'}>{f.away_team}</td>
                <td><span className={f.status === 'Completed' ? 'badge-completed' : f.status === 'Live' ? 'badge-live' : 'admin-badge admin-badge-default'}>{f.status === 'Completed' ? 'Ολοκλ.' : f.status === 'Live' ? 'LIVE' : 'Προγρ.'}</span></td>
                <td><div className="flex gap-1"><button onClick={() => openEdit(f)} className="admin-icon-btn"><Edit2 size={13} /></button><button onClick={() => handleDelete(f.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <FormModal title={editFixture ? "Επεξεργασία Αγώνα" : "Νέος Αγώνας"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Γηπεδούχος *"><AdminInput value={form.home_team} onChange={e => setForm({...form, home_team: e.target.value})} data-testid="fixture-home-input" /></Field>
            <Field label="Φιλοξενούμενος *"><AdminInput value={form.away_team} onChange={e => setForm({...form, away_team: e.target.value})} data-testid="fixture-away-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ημερομηνία *"><AdminInput type="date" value={form.match_date} onChange={e => setForm({...form, match_date: e.target.value})} data-testid="fixture-date-input" /></Field>
            <Field label="Ώρα"><AdminInput type="time" value={form.match_time} onChange={e => setForm({...form, match_time: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Σκορ Γηπ."><AdminInput type="number" value={form.home_score} onChange={e => setForm({...form, home_score: e.target.value})} /></Field>
            <Field label="Σκορ Φιλ."><AdminInput type="number" value={form.away_score} onChange={e => setForm({...form, away_score: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Γήπεδο"><AdminInput value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} /></Field>
            <Field label="Διοργάνωση"><AdminInput value={form.competition} onChange={e => setForm({...form, competition: e.target.value})} /></Field>
          </div>
          <Field label="Κατάσταση">
            <AdminSelect value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="Scheduled">Προγραμματισμένος</option><option value="Live">Live</option><option value="Completed">Ολοκληρωμένος</option><option value="Postponed">Αναβλήθηκε</option>
            </AdminSelect>
          </Field>
        </FormModal>
      )}
    </div>
  );
};

// ==================== STANDINGS TAB ====================
const StandingsTab = ({ standings, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editStanding, setEditStanding] = useState(null);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showColConfig, setShowColConfig] = useState(false);
  const [colConfig, setColConfig] = useState(null);
  const [savingCols, setSavingCols] = useState(false);
  const emptyStanding = { team_name: "", team_logo: "", played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, competition: "ΠΑΑΟΚ Α' Όμιλος", season: "2025/26", form: "" };
  const [form, setForm] = useState(emptyStanding);

  useEffect(() => {
    axios.get(`${API}/settings/standings-columns`).then(r => setColConfig(r.data)).catch(() => {});
  }, []);

  const openCreate = () => { setForm(emptyStanding); setEditStanding(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ team_name: s.team_name, team_logo: s.team_logo || "", played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, goals_for: s.goals_for, goals_against: s.goals_against, points: s.points, competition: s.competition, season: s.season || "2025/26", form: s.form || "" }); setEditStanding(s); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, played: +form.played, won: +form.won, drawn: +form.drawn, lost: +form.lost, goals_for: +form.goals_for, goals_against: +form.goals_against, points: +form.points };
      if (editStanding) await axios.put(`${API}/admin/standings/${editStanding.id}`, payload, { headers });
      else await axios.post(`${API}/admin/standings`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/standings/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const handleRecalculate = async () => {
    if (!confirm("Αυτό θα ξαναϋπολογίσει ολόκληρη τη βαθμολογία από τα αποτελέσματα. Συνέχεια;")) return;
    setRecalculating(true);
    try {
      const res = await axios.post(`${API}/admin/standings/recalculate`, {}, { headers: getAuthHeaders() });
      alert(res.data.message);
      onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setRecalculating(false); }
  };

  const handleSaveColumns = async () => {
    setSavingCols(true);
    try {
      await axios.put(`${API}/admin/settings/standings-columns`, colConfig, { headers: getAuthHeaders() });
      setShowColConfig(false);
    } catch (e) { alert("Σφάλμα αποθήκευσης"); } finally { setSavingCols(false); }
  };

  const toggleCol = (key) => setColConfig(prev => ({ ...prev, [key]: !prev[key] }));

  const colLabels = {
    played: "Αγώνες (Αγ)", won: "Νίκες (Ν)", drawn: "Ισοπαλίες (Ι)", lost: "Ήττες (Η)",
    goals_for: "Γκολ Υπέρ (ΓΥ)", goals_against: "Γκολ Κατά (ΓΚ)",
    goal_difference: "Διαφορά Γκολ (ΔΓ)", points: "Βαθμοί (Βαθ)", form: "Φόρμα"
  };

  return (
    <div data-testid="admin-standings-tab">
      <TabHeader title="Βαθμολογία" count={standings.length}>
        <button onClick={() => setShowColConfig(true)} className="admin-btn-ghost text-xs" data-testid="column-config-btn">
          <Settings size={13} /> Στήλες
        </button>
        <button onClick={handleRecalculate} disabled={recalculating} className="admin-btn-ghost text-xs" data-testid="recalculate-btn">
          <RefreshCw size={13} className={recalculating ? 'animate-spin' : ''} /> {recalculating ? 'Υπολογισμός...' : 'Επανυπολογισμός'}
        </button>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-standing-btn"><Plus size={14} /> Νέα Ομάδα</button>
      </TabHeader>
      <div className="admin-table-wrap">
        <table className="admin-table" data-testid="admin-standings-table">
          <thead><tr><th>#</th><th>Ομάδα</th><th>Αγ</th><th>Ν</th><th>Ι</th><th>Η</th><th>ΓΥ</th><th>ΓΚ</th><th>ΔΓ</th><th>Βαθ</th><th></th></tr></thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.id} className={s.team_name === 'LEFTERIA FC' ? 'bg-[#F5A623]/5' : ''}>
                <td className="text-zinc-500">{s.position || i + 1}</td>
                <td className={`font-medium ${s.team_name === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{s.team_name}</td>
                <td>{s.played}</td><td>{s.won}</td><td>{s.drawn}</td><td>{s.lost}</td>
                <td>{s.goals_for}</td><td>{s.goals_against}</td>
                <td className={s.goal_difference > 0 ? 'text-green-400' : s.goal_difference < 0 ? 'text-red-400' : ''}>{s.goal_difference > 0 ? '+' : ''}{s.goal_difference}</td>
                <td className="font-bold text-[#F5A623]">{s.points}</td>
                <td><div className="flex gap-1"><button onClick={() => openEdit(s)} className="admin-icon-btn"><Edit2 size={13} /></button><button onClick={() => handleDelete(s.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <FormModal title={editStanding ? "Επεξεργασία" : "Νέα Εγγραφή"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Ομάδα *"><AdminInput value={form.team_name} onChange={e => setForm({...form, team_name: e.target.value})} data-testid="standing-team-input" /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Αγώνες"><AdminInput type="number" value={form.played} onChange={e => setForm({...form, played: e.target.value})} /></Field>
            <Field label="Νίκες"><AdminInput type="number" value={form.won} onChange={e => setForm({...form, won: e.target.value})} /></Field>
            <Field label="Ισοπαλίες"><AdminInput type="number" value={form.drawn} onChange={e => setForm({...form, drawn: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ήττες"><AdminInput type="number" value={form.lost} onChange={e => setForm({...form, lost: e.target.value})} /></Field>
            <Field label="ΓΥ"><AdminInput type="number" value={form.goals_for} onChange={e => setForm({...form, goals_for: e.target.value})} /></Field>
            <Field label="ΓΚ"><AdminInput type="number" value={form.goals_against} onChange={e => setForm({...form, goals_against: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Βαθμοί"><AdminInput type="number" value={form.points} onChange={e => setForm({...form, points: e.target.value})} /></Field>
            <Field label="Φόρμα"><AdminInput placeholder="WWDLW" value={form.form} onChange={e => setForm({...form, form: e.target.value})} /></Field>
          </div>
        </FormModal>
      )}
      {showColConfig && colConfig && (
        <FormModal title="Ρυθμίσεις Στηλών Βαθμολογίας" onClose={() => setShowColConfig(false)} onSave={handleSaveColumns} saving={savingCols}>
          <p className="text-xs text-zinc-500 mb-4">Επιλέξτε ποιες στήλες θα εμφανίζονται στη δημόσια βαθμολογία.</p>
          <div className="space-y-2">
            {Object.entries(colLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded bg-[#111] hover:bg-[#161616] transition-colors cursor-pointer" data-testid={`col-toggle-${key}`}>
                <input
                  type="checkbox"
                  checked={colConfig[key] || false}
                  onChange={() => toggleCol(key)}
                  className="w-4 h-4 accent-[#F5A623] rounded"
                />
                <span className="text-sm text-zinc-300">{label}</span>
                {key === 'points' && <span className="text-[10px] text-[#F5A623] ml-auto">Συνιστάται</span>}
              </label>
            ))}
          </div>
        </FormModal>
      )}
    </div>
  );
};

// ==================== NEWS TAB ====================
const NewsTab = ({ news, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editNews, setEditNews] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyNews = { title: "", content: "", excerpt: "", image_url: "", category: "Νέα", is_featured: false };
  const [form, setForm] = useState(emptyNews);

  const openCreate = () => { setForm(emptyNews); setEditNews(null); setShowForm(true); };
  const openEdit = (n) => { setForm({ title: n.title, content: n.content, excerpt: n.excerpt, image_url: n.image_url || "", category: n.category || "Νέα", is_featured: n.is_featured || false }); setEditNews(n); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (editNews) await axios.put(`${API}/admin/news/${editNews.id}`, form, { headers });
      else await axios.post(`${API}/admin/news`, form, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/news/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-news-tab">
      <TabHeader title="Νέα" count={news.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-news-btn"><Plus size={14} /> Νέο Άρθρο</button>
      </TabHeader>
      <div className="space-y-2">
        {news.map(n => (
          <div key={n.id} className="admin-card px-4 py-3 flex items-center gap-4">
            {n.image_url && <img src={n.image_url} alt="" className="w-14 h-10 object-cover rounded flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 items-center mb-0.5">
                <span className="admin-badge admin-badge-default text-[10px]">{n.category}</span>
                {n.is_featured && <span className="admin-badge admin-badge-gold text-[10px]">Featured</span>}
              </div>
              <h3 className="text-sm text-white font-medium truncate">{n.title}</h3>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(n)} className="admin-icon-btn"><Edit2 size={13} /></button>
              <button onClick={() => handleDelete(n.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <FormModal title={editNews ? "Επεξεργασία" : "Νέο Άρθρο"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Τίτλος *"><AdminInput value={form.title} onChange={e => setForm({...form, title: e.target.value})} data-testid="news-title-input" /></Field>
          <Field label="Περίληψη *"><AdminInput value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} /></Field>
          <Field label="Περιεχόμενο *"><AdminTextarea rows={5} value={form.content} onChange={e => setForm({...form, content: e.target.value})} data-testid="news-content-input" /></Field>
          <Field label="URL Εικόνας"><AdminInput value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Κατηγορία"><AdminSelect value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="Νέα">Νέα</option><option value="Αποτελέσματα">Αποτελέσματα</option><option value="Μεταγραφές">Μεταγραφές</option><option value="Ακαδημία">Ακαδημία</option></AdminSelect></Field>
            <Field label="Featured"><label className="flex items-center gap-2 mt-2 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="accent-[#F5A623] w-4 h-4" /><span className="text-zinc-300 text-sm">Προτεινόμενο</span></label></Field>
          </div>
        </FormModal>
      )}
    </div>
  );
};

// ==================== VENUES TAB ====================
const VenuesTab = ({ venues, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editVenue, setEditVenue] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyVenue = { name: "", address: "", city: "Λεμεσός", country: "Κύπρος", capacity: "", surface: "", image_url: "", map_url: "", is_home_ground: false };
  const [form, setForm] = useState(emptyVenue);

  const openCreate = () => { setForm(emptyVenue); setEditVenue(null); setShowForm(true); };
  const openEdit = (v) => { setForm({ name: v.name, address: v.address, city: v.city, country: v.country, capacity: v.capacity ?? "", surface: v.surface || "", image_url: v.image_url || "", map_url: v.map_url || "", is_home_ground: v.is_home_ground || false }); setEditVenue(v); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, capacity: form.capacity !== "" ? parseInt(form.capacity) : null };
      if (editVenue) await axios.put(`${API}/admin/venues/${editVenue.id}`, payload, { headers });
      else await axios.post(`${API}/admin/venues`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/venues/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-venues-tab">
      <TabHeader title="Γήπεδα" count={venues.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-venue-btn"><Plus size={14} /> Νέο Γήπεδο</button>
      </TabHeader>
      <div className="grid sm:grid-cols-2 gap-3">
        {venues.map(v => (
          <div key={v.id} className="admin-card p-5" data-testid={`venue-${v.id}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-white">{v.name}</h3>
              <div className="flex gap-1"><button onClick={() => openEdit(v)} className="admin-icon-btn"><Edit2 size={13} /></button><button onClick={() => handleDelete(v.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button></div>
            </div>
            {v.is_home_ground && <span className="admin-badge admin-badge-gold text-[10px] mb-2">Έδρα</span>}
            <p className="text-zinc-500 text-xs flex items-center gap-1"><MapPin size={11} /> {v.city}, {v.country}</p>
            {v.surface && <p className="text-zinc-600 text-xs mt-1">{v.surface}</p>}
          </div>
        ))}
        {venues.length === 0 && <EmptyState icon={MapPin} text="Δεν υπάρχουν γήπεδα" />}
      </div>
      {showForm && (
        <FormModal title={editVenue ? "Επεξεργασία" : "Νέο Γήπεδο"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Όνομα *"><AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="venue-name-input" /></Field>
          <Field label="Διεύθυνση *"><AdminInput value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Πόλη"><AdminInput value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></Field>
            <Field label="Χώρα"><AdminInput value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Χωρητικότητα"><AdminInput type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></Field>
            <Field label="Επιφάνεια"><AdminInput placeholder="Φυσικός Χλοοτάπητας" value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} /></Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_home_ground} onChange={e => setForm({...form, is_home_ground: e.target.checked})} className="accent-[#F5A623] w-4 h-4" /><span className="text-zinc-300 text-sm">Έδρα</span></label>
        </FormModal>
      )}
    </div>
  );
};

// ==================== SEASONS TAB ====================
const SeasonsTab = ({ seasons, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editSeason, setEditSeason] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptySeason = { name: "", start_date: "", end_date: "", is_current: false, competitions: "", achievements: "", final_position: "" };
  const [form, setForm] = useState(emptySeason);

  const openCreate = () => { setForm(emptySeason); setEditSeason(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ name: s.name, start_date: s.start_date || "", end_date: s.end_date || "", is_current: s.is_current || false, competitions: (s.competitions || []).join(", "), achievements: (s.achievements || []).join(", "), final_position: s.final_position ?? "" }); setEditSeason(s); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, competitions: form.competitions ? form.competitions.split(",").map(s => s.trim()).filter(Boolean) : [], achievements: form.achievements ? form.achievements.split(",").map(s => s.trim()).filter(Boolean) : [], final_position: form.final_position !== "" ? parseInt(form.final_position) : null };
      if (editSeason) await axios.put(`${API}/admin/seasons/${editSeason.id}`, payload, { headers });
      else await axios.post(`${API}/admin/seasons`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/seasons/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-seasons-tab">
      <TabHeader title="Σεζόν" count={seasons.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-season-btn"><Plus size={14} /> Νέα Σεζόν</button>
      </TabHeader>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {seasons.map(s => (
          <div key={s.id} className="admin-card p-5" data-testid={`season-${s.id}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-['Bebas_Neue'] text-xl text-white">{s.name}</h3>
              <div className="flex gap-1"><button onClick={() => openEdit(s)} className="admin-icon-btn"><Edit2 size={13} /></button><button onClick={() => handleDelete(s.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button></div>
            </div>
            {s.is_current && <span className="admin-badge admin-badge-green text-[10px] mb-1">Τρέχουσα</span>}
            <p className="text-zinc-500 text-xs">{s.start_date} - {s.end_date}</p>
          </div>
        ))}
        {seasons.length === 0 && <EmptyState icon={Archive} text="Δεν υπάρχουν σεζόν" />}
      </div>
      {showForm && (
        <FormModal title={editSeason ? "Επεξεργασία" : "Νέα Σεζόν"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Όνομα *"><AdminInput placeholder="2025/26" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="season-name-input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Έναρξη"><AdminInput type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></Field>
            <Field label="Λήξη"><AdminInput type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></Field>
          </div>
          <Field label="Διοργανώσεις (κόμμα)"><AdminInput value={form.competitions} onChange={e => setForm({...form, competitions: e.target.value})} /></Field>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_current} onChange={e => setForm({...form, is_current: e.target.checked})} className="accent-[#F5A623] w-4 h-4" /><span className="text-zinc-300 text-sm">Τρέχουσα σεζόν</span></label>
        </FormModal>
      )}
    </div>
  );
};

// ==================== CLUB PROFILE TAB ====================
const ClubProfileTab = ({ club, onRefresh }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(club || {});
  useEffect(() => { if (club) setForm(club); }, [club]);

  const handleSave = async () => {
    setSaving(true);
    try { await axios.put(`${API}/admin/club`, form, { headers: getAuthHeaders() }); onRefresh(); alert("Αποθηκεύτηκε!"); } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  return (
    <div data-testid="admin-club-tab">
      <TabHeader title="Προφίλ Συλλόγου">
        <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-club-btn">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
        </button>
      </TabHeader>
      <div className="admin-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Όνομα"><AdminInput value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="Ελληνικό"><AdminInput value={form.greek_name || ""} onChange={e => setForm({...form, greek_name: e.target.value})} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Ίδρυση"><AdminInput type="number" value={form.founded || ""} onChange={e => setForm({...form, founded: parseInt(e.target.value) || 0})} /></Field>
          <Field label="Γήπεδο"><AdminInput value={form.stadium || ""} onChange={e => setForm({...form, stadium: e.target.value})} /></Field>
          <Field label="Πόλη"><AdminInput value={form.city || ""} onChange={e => setForm({...form, city: e.target.value})} /></Field>
        </div>
        <Field label="Logo URL"><AdminInput value={form.logo_url || ""} onChange={e => setForm({...form, logo_url: e.target.value})} /></Field>
        <Field label="Περιγραφή"><AdminTextarea rows={3} value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><AdminInput value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} /></Field>
          <Field label="Τηλέφωνο"><AdminInput value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
        </div>
      </div>
    </div>
  );
};

// ==================== MESSAGES TAB ====================
const MessagesTab = ({ messages, onRefresh }) => {
  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/contact/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-messages-tab">
      <TabHeader title="Μηνύματα" count={messages.length} />
      {messages.length === 0 && <EmptyState icon={Mail} text="Δεν υπάρχουν μηνύματα" />}
      <div className="space-y-2">
        {messages.map(m => (
          <div key={m.id} className="admin-card px-5 py-4" data-testid={`message-${m.id}`}>
            <div className="flex justify-between items-start mb-2">
              <div><span className="text-white text-sm font-medium">{m.name}</span><span className="text-zinc-600 text-xs ml-2">{m.email}</span></div>
              <div className="flex items-center gap-2"><span className="text-zinc-600 text-xs">{new Date(m.created_at).toLocaleDateString('el-GR')}</span><button onClick={() => handleDelete(m.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button></div>
            </div>
            <span className="admin-badge admin-badge-default text-[10px] mb-1.5">{m.subject}</span>
            <p className="text-zinc-400 text-sm">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== GALLERY TAB ====================
const GalleryTab = ({ onRefresh: parentRefresh }) => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");
  const categories = ["Match Day", "Training", "Team Events", "Academy", "Fans", "Other"];
  const catLabels = { "Match Day": "Αγώνας", "Training": "Προπόνηση", "Team Events": "Εκδηλώσεις", "Academy": "Ακαδημία", "Fans": "Φίλαθλοι", "Other": "Άλλο" };
  const emptyForm = { title: "", image_url: "", category: "Other", description: "", player_id: "", match_id: "", tags: [], is_featured: false };
  const [form, setForm] = useState(emptyForm);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/gallery`);
      setItems(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const openCreate = () => { setForm(emptyForm); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ title: item.title, image_url: item.image_url, category: item.category, description: item.description || "", player_id: item.player_id || "", match_id: item.match_id || "", tags: item.tags || [], is_featured: item.is_featured });
    setEditItem(item); setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/admin/gallery/upload`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setForm(prev => ({ ...prev, image_url: res.data.image_url }));
    } catch (e) { alert("Σφάλμα μεταφόρτωσης"); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.title || !form.image_url) { alert("Τίτλος και εικόνα απαιτούνται"); return; }
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (editItem) await axios.put(`${API}/admin/gallery/${editItem.id}`, form, { headers });
      else await axios.post(`${API}/admin/gallery`, form, { headers });
      setShowForm(false); fetchGallery();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή φωτογραφίας;")) return;
    try { await axios.delete(`${API}/admin/gallery/${id}`, { headers: getAuthHeaders() }); fetchGallery(); } catch (e) { alert("Σφάλμα"); }
  };

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);
  const BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const resolveImg = (url) => url && (url.startsWith("http") ? url : `${BASE_URL}${url}`);

  return (
    <div data-testid="admin-gallery-tab">
      <TabHeader title="Γκαλερί" count={items.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-gallery-btn"><Plus size={14} /> Νέα Φωτογραφία</button>
      </TabHeader>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setFilter("all")} className={`text-xs px-3 py-1.5 border transition-colors ${filter === "all" ? "bg-[#F5A623] text-black border-[#F5A623]" : "border-[#333] text-zinc-400 hover:text-white"}`} data-testid="gallery-filter-all">Όλα</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`text-xs px-3 py-1.5 border transition-colors ${filter === cat ? "bg-[#F5A623] text-black border-[#F5A623]" : "border-[#333] text-zinc-400 hover:text-white"}`} data-testid={`gallery-filter-${cat.toLowerCase().replace(/\s/g, '-')}`}>
            {catLabels[cat]}
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(item => (
          <div key={item.id} className="bg-[#111] border border-[#1e1e1e] rounded overflow-hidden group" data-testid={`gallery-item-${item.id}`}>
            <div className="aspect-square relative overflow-hidden">
              <img src={resolveImg(item.image_url)} alt={item.title} className="w-full h-full object-cover" />
              {item.is_featured && <span className="absolute top-2 left-2 text-[9px] bg-[#F5A623] text-black px-1.5 py-0.5 rounded">Featured</span>}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => openEdit(item)} className="admin-icon-btn bg-white/10"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="admin-icon-btn bg-white/10 text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="p-2">
              <p className="text-white text-xs font-medium truncate">{item.title}</p>
              <p className="text-[10px] text-[#F5A623]">{catLabels[item.category] || item.category}</p>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-zinc-600 text-center py-12">Δεν υπάρχουν φωτογραφίες</p>}

      {/* Form Modal */}
      {showForm && (
        <FormModal title={editItem ? "Επεξεργασία Φωτογραφίας" : "Νέα Φωτογραφία"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Τίτλος *"><AdminInput value={form.title} onChange={e => setForm({...form, title: e.target.value})} data-testid="gallery-title-input" /></Field>
          <Field label="Εικόνα *">
            <div className="space-y-2">
              <AdminInput value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="URL εικόνας ή μεταφόρτωση" data-testid="gallery-url-input" />
              <label className={`inline-flex items-center gap-2 text-xs px-3 py-2 border border-dashed border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" data-testid="gallery-file-input" />
                {uploading ? "Μεταφόρτωση..." : "Επιλογή αρχείου"}
              </label>
              {form.image_url && <img src={resolveImg(form.image_url)} alt="" className="w-20 h-20 object-cover rounded mt-1" />}
            </div>
          </Field>
          <Field label="Κατηγορία">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-input" data-testid="gallery-category-select">
              {categories.map(c => <option key={c} value={c}>{catLabels[c]}</option>)}
            </select>
          </Field>
          <Field label="Περιγραφή"><AdminInput value={form.description} onChange={e => setForm({...form, description: e.target.value})} data-testid="gallery-desc-input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ID Παίκτη (προαιρ.)"><AdminInput value={form.player_id} onChange={e => setForm({...form, player_id: e.target.value})} placeholder="Σύνδεση με παίκτη" /></Field>
            <Field label="ID Αγώνα (προαιρ.)"><AdminInput value={form.match_id} onChange={e => setForm({...form, match_id: e.target.value})} placeholder="Σύνδεση με αγώνα" /></Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="accent-[#F5A623]" data-testid="gallery-featured-check" />
            <span className="text-sm text-zinc-300">Featured φωτογραφία</span>
          </label>
        </FormModal>
      )}
    </div>
  );
};

// ==================== TEAMS TAB (with drill-down) ====================
const TeamsTab = ({ teams, players, fixtures, staff, standings, onRefresh, onTabChange }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState("roster");
  const emptyForm = { name: "", level: "Α' Ομάδα", description: "" };
  const [form, setForm] = useState(emptyForm);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const emptyPlayer = { name: "", number: "", position: "Midfielder", nationality: "Cyprus", age: "", image_url: "", bio: "", height: "", weight: "", preferred_foot: "Right" };
  const [playerForm, setPlayerForm] = useState(emptyPlayer);
  // Gallery state
  const [galleryItems, setGalleryItems] = useState([]);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title: "", image_url: "", category: "Match Day", description: "" });
  const [savingGallery, setSavingGallery] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const openCreateTeam = () => { setForm(emptyForm); setEditTeam(null); setShowForm(true); };
  const openEditTeam = (t) => { setForm({ name: t.name, level: t.level, description: t.description || "" }); setEditTeam(t); setShowForm(true); };

  const handleSaveTeam = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (editTeam) await axios.put(`${API}/admin/teams/${editTeam.id}`, form, { headers });
      else await axios.post(`${API}/admin/teams`, form, { headers });
      setShowForm(false); setEditTeam(null); onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Διαγραφή ομάδας; Οι παίκτες θα αφαιρεθούν.")) return;
    try { await axios.delete(`${API}/admin/teams/${id}`, { headers: getAuthHeaders() }); if (selectedTeam?.id === id) setSelectedTeam(null); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const openCreatePlayer = () => { setPlayerForm({...emptyPlayer}); setEditPlayer(null); setShowPlayerForm(true); };
  const openEditPlayer = (p) => {
    setPlayerForm({ name: p.name || "", number: p.number || "", position: p.position || "Midfielder", nationality: p.nationality || "Cyprus", age: p.age || "", image_url: p.image_url || "", bio: p.bio || "", height: p.height || "", weight: p.weight || "", preferred_foot: p.preferred_foot || "Right" });
    setEditPlayer(p); setShowPlayerForm(true);
  };

  const handleSavePlayer = async () => {
    setSavingPlayer(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...playerForm, number: parseInt(playerForm.number) || 0, age: parseInt(playerForm.age) || 0, team_type: "First Team", team_id: selectedTeam.id };
      if (editPlayer) await axios.put(`${API}/admin/players/${editPlayer.id}`, payload, { headers });
      else await axios.post(`${API}/admin/players`, payload, { headers });
      setShowPlayerForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSavingPlayer(false); }
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm("Διαγραφή παίκτη;")) return;
    try { await axios.delete(`${API}/admin/players/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  // Gallery functions
  const fetchGallery = useCallback(async () => {
    if (!selectedTeam) return;
    try {
      const res = await axios.get(`${API}/gallery?team_id=${selectedTeam.id}`);
      setGalleryItems(res.data);
    } catch (e) { console.error(e); }
  }, [selectedTeam]);

  useEffect(() => { if (detailTab === "gallery" && selectedTeam) fetchGallery(); }, [detailTab, selectedTeam, fetchGallery]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await axios.post(`${API}/admin/gallery/upload`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setGalleryForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch (e) { alert("Σφάλμα μεταφόρτωσης"); } finally { setUploadingFile(false); }
  };

  const handleSaveGallery = async () => {
    setSavingGallery(true);
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API}/admin/gallery`, { ...galleryForm, team_id: selectedTeam.id }, { headers });
      setShowGalleryForm(false); fetchGallery();
      setGalleryForm({ title: "", image_url: "", category: "Match Day", description: "" });
    } catch (e) { alert("Σφάλμα"); } finally { setSavingGallery(false); }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/gallery/${id}`, { headers: getAuthHeaders() }); fetchGallery(); } catch (e) { alert("Σφάλμα"); }
  };

  useEffect(() => {
    if (selectedTeam) {
      const updated = teams.find(t => t.id === selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    }
  }, [teams]);

  if (selectedTeam) {
    const teamPlayers = players.filter(p => p.team_id === selectedTeam.id);
    const teamFixtures = fixtures.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
    const teamStaff = staff.filter(s => s.team_type === "First Team");

    // Player profile view within team drill-down
    if (viewingPlayer) {
      const freshPlayer = players.find(p => p.id === viewingPlayer.id) || viewingPlayer;
      return (
        <div data-testid="team-detail-view">
          <AdminPlayerProfile player={freshPlayer} onBack={() => setViewingPlayer(null)} onRefresh={onRefresh} />
        </div>
      );
    }

    return (
      <div data-testid="team-detail-view">
        <button onClick={() => setSelectedTeam(null)} className="admin-btn-ghost text-sm mb-4" data-testid="back-to-teams">
          <ChevronRight size={14} className="rotate-180" /> Πίσω στις ομάδες
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-['Bebas_Neue'] text-4xl text-[#F5A623] tracking-wide">{selectedTeam.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="admin-badge admin-badge-gold">{selectedTeam.level}</span>
              {selectedTeam.description && <span className="text-zinc-300 text-sm">{selectedTeam.description}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-1 mb-6 border-b border-[#262626] pb-0 overflow-x-auto">
          {[
            { id: "roster", label: "Ρόστερ", icon: Users, count: teamPlayers.length },
            { id: "schedule", label: "Πρόγραμμα", icon: Calendar, count: teamFixtures.length },
            { id: "team_staff", label: "Staff", icon: UserCog, count: teamStaff.length },
            { id: "standings_tab", label: "Βαθμολογία", icon: Trophy, count: standings?.length || 0 },
            { id: "gallery", label: "Γκαλερί", icon: Image, count: galleryItems.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setDetailTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] whitespace-nowrap ${
                detailTab === tab.id ? 'border-[#F5A623] text-[#F5A623]' : 'border-transparent text-zinc-400 hover:text-white'
              }`} data-testid={`team-tab-${tab.id}`}>
              <tab.icon size={15} /> {tab.label}
              <span className="text-xs ml-1 opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {detailTab === "roster" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={openCreatePlayer} className="admin-btn-primary" data-testid="add-team-player-btn"><Plus size={14} /> Νέος Παίκτης</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="team-players-table">
                <thead><tr><th>#</th><th></th><th>Όνομα</th><th>Θέση</th><th>Ηλικία</th><th></th></tr></thead>
                <tbody>
                  {teamPlayers.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => setViewingPlayer(p)}>
                      <td className="font-mono text-zinc-400">{p.number}</td>
                      <td>{p.image_url ? <img src={p.image_url} alt="" className="w-9 h-9 object-cover rounded-full" /> : <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center"><Users size={14} className="text-zinc-600" /></div>}</td>
                      <td className="font-medium text-[#F5A623] hover:underline" data-testid={`view-team-player-${p.id}`}>{p.name}</td>
                      <td className="text-zinc-300">{p.position}</td>
                      <td className="text-zinc-300">{p.age}</td>
                      <td>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditPlayer(p)} className="admin-icon-btn" data-testid={`edit-team-player-${p.id}`}><Edit2 size={14} /></button>
                          <button onClick={() => handleDeletePlayer(p.id)} className="admin-icon-btn text-red-500/70 hover:text-red-400" data-testid={`delete-team-player-${p.id}`}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {teamPlayers.length === 0 && <tr><td colSpan={6}><EmptyState icon={Users} text="Δεν υπάρχουν παίκτες" /></td></tr>}
                </tbody>
              </table>
            </div>
            {showPlayerForm && (
              <FormModal title={editPlayer ? "Επεξεργασία Παίκτη" : "Νέος Παίκτης"} onClose={() => setShowPlayerForm(false)} onSave={handleSavePlayer} saving={savingPlayer}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Όνομα *"><AdminInput value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} data-testid="team-player-name" /></Field>
                  <Field label="Αριθμός *"><AdminInput type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} data-testid="team-player-number" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Θέση *">
                    <AdminSelect value={playerForm.position} onChange={e => setPlayerForm({...playerForm, position: e.target.value})}>
                      <option value="Goalkeeper">Τερματοφύλακας</option><option value="Defender">Αμυντικός</option><option value="Midfielder">Μέσος</option><option value="Forward">Επιθετικός</option>
                    </AdminSelect>
                  </Field>
                  <Field label="Εθνικότητα"><AdminInput value={playerForm.nationality} onChange={e => setPlayerForm({...playerForm, nationality: e.target.value})} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Ηλικία *"><AdminInput type="number" value={playerForm.age} onChange={e => setPlayerForm({...playerForm, age: e.target.value})} /></Field>
                  <Field label="Ύψος"><AdminInput placeholder="1.85m" value={playerForm.height} onChange={e => setPlayerForm({...playerForm, height: e.target.value})} /></Field>
                  <Field label="Βάρος"><AdminInput placeholder="78kg" value={playerForm.weight} onChange={e => setPlayerForm({...playerForm, weight: e.target.value})} /></Field>
                </div>
                <ImageUpload currentUrl={playerForm.image_url} onImageChange={url => setPlayerForm({...playerForm, image_url: url})} playerId={editPlayer?.id} />
                <Field label="Βιογραφικό"><AdminTextarea rows={2} value={playerForm.bio} onChange={e => setPlayerForm({...playerForm, bio: e.target.value})} /></Field>
              </FormModal>
            )}
          </div>
        )}

        {detailTab === "schedule" && (
          <div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="team-fixtures-table">
                <thead><tr><th>Ημ/νία</th><th>Γηπεδούχος</th><th>Σκορ</th><th>Φιλοξ.</th><th>Κατάσταση</th></tr></thead>
                <tbody>
                  {teamFixtures.map(f => (
                    <tr key={f.id}>
                      <td className="text-sm text-zinc-400">{new Date(f.match_date).toLocaleDateString('el-GR')}</td>
                      <td className={f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623] font-medium' : 'text-zinc-200'}>{f.home_team}</td>
                      <td className="font-['Bebas_Neue'] text-lg text-white">{f.status === 'Completed' || f.status === 'Live' ? `${f.home_score ?? 0} - ${f.away_score ?? 0}` : '-'}</td>
                      <td className={f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623] font-medium' : 'text-zinc-200'}>{f.away_team}</td>
                      <td><span className={f.status === 'Completed' ? 'badge-completed' : f.status === 'Live' ? 'badge-live' : 'admin-badge admin-badge-default'}>{f.status === 'Completed' ? 'Ολοκλ.' : f.status === 'Live' ? 'LIVE' : 'Προγρ.'}</span></td>
                    </tr>
                  ))}
                  {teamFixtures.length === 0 && <tr><td colSpan={5}><EmptyState icon={Calendar} text="Δεν υπάρχουν αγώνες" /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === "team_staff" && (
          <div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="team-staff-table">
                <thead><tr><th></th><th>Όνομα</th><th>Ρόλος</th></tr></thead>
                <tbody>
                  {teamStaff.map(s => (
                    <tr key={s.id}>
                      <td>{s.image_url ? <img src={s.image_url} alt="" className="w-9 h-9 object-cover rounded-full" /> : <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center"><UserCog size={14} className="text-zinc-600" /></div>}</td>
                      <td className="font-medium text-white">{s.name}</td>
                      <td className="text-zinc-300">{s.role}</td>
                    </tr>
                  ))}
                  {teamStaff.length === 0 && <tr><td colSpan={3}><EmptyState icon={UserCog} text="Δεν υπάρχουν μέλη staff" /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === "standings_tab" && (
          <StandingsTab standings={standings} onRefresh={onRefresh} />
        )}

        {detailTab === "gallery" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowGalleryForm(true)} className="admin-btn-primary" data-testid="add-team-gallery-btn"><Plus size={14} /> Νέα Φωτογραφία</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryItems.map(item => (
                <div key={item.id} className="bg-[#151515] border border-[#262626] rounded-lg overflow-hidden group" data-testid={`gallery-item-${item.id}`}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="admin-badge admin-badge-default text-xs">{item.category}</span>
                      <button onClick={() => handleDeleteGallery(item.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {galleryItems.length === 0 && <div className="col-span-full"><EmptyState icon={Image} text="Δεν υπάρχουν φωτογραφίες" /></div>}
            </div>
            {showGalleryForm && (
              <FormModal title="Νέα Φωτογραφία" onClose={() => setShowGalleryForm(false)} onSave={handleSaveGallery} saving={savingGallery}>
                <Field label="Τίτλος *"><AdminInput value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} /></Field>
                <Field label="Εικόνα *">
                  <div className="flex gap-2">
                    <AdminInput value={galleryForm.image_url} onChange={e => setGalleryForm({...galleryForm, image_url: e.target.value})} placeholder="URL εικόνας" className="flex-1" />
                    <label className="admin-btn-ghost cursor-pointer flex items-center">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      {uploadingFile ? <RefreshCw size={14} className="animate-spin" /> : "Upload"}
                    </label>
                  </div>
                </Field>
                <Field label="Κατηγορία">
                  <AdminSelect value={galleryForm.category} onChange={e => setGalleryForm({...galleryForm, category: e.target.value})}>
                    <option value="Match Day">Match Day</option><option value="Training">Training</option><option value="Team Events">Team Events</option><option value="Fans">Fans</option><option value="Other">Other</option>
                  </AdminSelect>
                </Field>
                <Field label="Περιγραφή"><AdminInput value={galleryForm.description} onChange={e => setGalleryForm({...galleryForm, description: e.target.value})} /></Field>
              </FormModal>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="admin-teams-tab">
      <TabHeader title="Ομάδες" count={teams.length}>
        <button onClick={openCreateTeam} className="admin-btn-primary" data-testid="add-team-btn"><Plus size={14} /> Νέα Ομάδα</button>
      </TabHeader>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <div key={team.id} className="admin-card p-6 cursor-pointer hover:border-[#F5A623]/40 transition-colors group" onClick={() => { setSelectedTeam(team); setDetailTab("roster"); }} data-testid={`team-card-${team.id}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-['Bebas_Neue'] text-2xl text-white group-hover:text-[#F5A623] transition-colors">{team.name}</h3>
                <span className="admin-badge admin-badge-gold mt-1">{team.level}</span>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEditTeam(team)} className="admin-icon-btn" data-testid={`edit-team-${team.id}`}><Edit2 size={14} /></button>
                <button onClick={() => handleDeleteTeam(team.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400" data-testid={`delete-team-${team.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
            {team.description && <p className="text-zinc-400 text-sm mb-3">{team.description}</p>}
            <div className="flex gap-3 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Users size={14} /> {team.player_count || 0} παίκτες</span>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#F5A623] ml-auto transition-colors" />
            </div>
          </div>
        ))}
        {teams.length === 0 && <EmptyState icon={Shield} text="Δεν υπάρχουν ομάδες" />}
      </div>
      {showForm && (
        <FormModal title={editTeam ? "Επεξεργασία Ομάδας" : "Νέα Ομάδα"} onClose={() => setShowForm(false)} onSave={handleSaveTeam} saving={saving}>
          <Field label="Όνομα *"><AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="team-name-input" /></Field>
          <Field label="Επίπεδο">
            <AdminSelect value={form.level} onChange={e => setForm({...form, level: e.target.value})} data-testid="team-level-select">
              <option value="Α' Ομάδα">Α' Ομάδα</option>
              <option value="Εφεδρική">Εφεδρική</option>
              <option value="Νέων">Νέων</option>
            </AdminSelect>
          </Field>
          <Field label="Περιγραφή"><AdminTextarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} data-testid="team-desc-input" /></Field>
        </FormModal>
      )}
    </div>
  );
};

// ==================== ENHANCED ACADEMY TAB (full CRUD + drill-down) ====================
const EnhancedAcademyTab = ({ groups, players, onRefresh }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState("roster");
  const emptyGroup = { name: "", age_range: "", coach_name: "", training_schedule: "", description: "", max_players: 25, season: "2025/26" };
  const [form, setForm] = useState(emptyGroup);

  // Player CRUD state
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const emptyPlayer = { name: "", number: "", position: "Midfielder", nationality: "Cyprus", date_of_birth: "", image_url: "", bio: "", height: "", weight: "", preferred_foot: "Right", parent_name: "", parent_phone: "", parent_email: "" };
  const [playerForm, setPlayerForm] = useState(emptyPlayer);

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferPlayer, setTransferPlayer] = useState(null);
  const [transferGroupIds, setTransferGroupIds] = useState([]);
  const [savingTransfer, setSavingTransfer] = useState(false);

  // Fixtures state
  const [groupFixtures, setGroupFixtures] = useState([]);
  const [showFixtureForm, setShowFixtureForm] = useState(false);
  const [fixtureForm, setFixtureForm] = useState({ home_team: "LEFTERIA FC", away_team: "", match_date: "", venue: "", competition: "", season: "2025/26" });
  const [savingFixture, setSavingFixture] = useState(false);
  const [editFixture, setEditFixture] = useState(null);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState([]);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title: "", image_url: "", category: "Training", description: "" });
  const [savingGallery, setSavingGallery] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Group CRUD
  const openCreate = () => { setForm(emptyGroup); setEditGroup(null); setShowForm(true); };
  const openEdit = (g) => { setForm({ name: g.name, age_range: g.age_range, coach_name: g.coach_name || "", training_schedule: g.training_schedule, description: g.description, max_players: g.max_players, season: g.season || "2025/26" }); setEditGroup(g); setShowForm(true); };
  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, max_players: parseInt(form.max_players) || 25 };
      if (editGroup) await axios.put(`${API}/admin/academy-groups/${editGroup.id}`, payload, { headers });
      else await axios.post(`${API}/admin/academy-groups`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };
  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Διαγραφή ομάδας;")) return;
    try { await axios.delete(`${API}/admin/academy-groups/${id}`, { headers: getAuthHeaders() }); if (selectedGroup?.id === id) setSelectedGroup(null); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  // Player CRUD
  const calcAge = (dob) => { if (!dob) return ""; try { return Math.floor((new Date() - new Date(dob)) / 31557600000); } catch { return ""; } };

  const openCreatePlayer = () => { setPlayerForm({...emptyPlayer}); setEditPlayer(null); setShowPlayerForm(true); };
  const openEditPlayer = (p) => {
    setPlayerForm({
      name: p.name || "", number: p.number || "", position: p.position || "Midfielder", nationality: p.nationality || "Cyprus",
      date_of_birth: p.date_of_birth || "", image_url: p.image_url || "", bio: p.bio || "",
      height: p.height || "", weight: p.weight || "", preferred_foot: p.preferred_foot || "Right",
      parent_name: p.parent_name || "", parent_phone: p.parent_phone || "", parent_email: p.parent_email || ""
    });
    setEditPlayer(p); setShowPlayerForm(true);
  };
  const handleSavePlayer = async () => {
    setSavingPlayer(true);
    try {
      const headers = getAuthHeaders();
      const age = calcAge(playerForm.date_of_birth);
      const payload = {
        ...playerForm, number: parseInt(playerForm.number) || 0, age: parseInt(age) || 0,
        team_type: "Academy", academy_group_id: selectedGroup.id, academy_group_ids: [selectedGroup.id]
      };
      if (editPlayer) {
        payload.academy_group_ids = editPlayer.academy_group_ids?.length ? editPlayer.academy_group_ids : [selectedGroup.id];
        await axios.put(`${API}/admin/players/${editPlayer.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/players`, payload, { headers });
      }
      setShowPlayerForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSavingPlayer(false); }
  };
  const handleDeletePlayer = async (id) => {
    if (!window.confirm("Διαγραφή παίκτη;")) return;
    try { await axios.delete(`${API}/admin/players/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  // Transfer
  const openTransfer = (p) => {
    setTransferPlayer(p);
    setTransferGroupIds(p.academy_group_ids?.length ? [...p.academy_group_ids] : (p.academy_group_id ? [p.academy_group_id] : []));
    setShowTransfer(true);
  };
  const toggleTransferGroup = (gid) => {
    setTransferGroupIds(prev => prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]);
  };
  const handleTransfer = async () => {
    if (transferGroupIds.length === 0) { alert("Επιλέξτε τουλάχιστον μία ομάδα"); return; }
    setSavingTransfer(true);
    try {
      await axios.post(`${API}/admin/players/${transferPlayer.id}/transfer`, { group_ids: transferGroupIds, primary_group_id: transferGroupIds[0] }, { headers: getAuthHeaders() });
      setShowTransfer(false); onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setSavingTransfer(false); }
  };

  // Fixtures
  const fetchFixtures = useCallback(async () => {
    if (!selectedGroup) return;
    try { const res = await axios.get(`${API}/academy-groups/${selectedGroup.id}/fixtures`); setGroupFixtures(res.data); } catch (e) { console.error(e); }
  }, [selectedGroup]);
  useEffect(() => { if (detailTab === "schedule" && selectedGroup) fetchFixtures(); }, [detailTab, selectedGroup, fetchFixtures]);

  const openCreateFixture = () => { setFixtureForm({ home_team: "LEFTERIA FC", away_team: "", match_date: "", venue: "", competition: "", season: "2025/26" }); setEditFixture(null); setShowFixtureForm(true); };
  const handleSaveFixture = async () => {
    setSavingFixture(true);
    try {
      await axios.post(`${API}/admin/academy-groups/${selectedGroup.id}/fixtures`, fixtureForm, { headers: getAuthHeaders() });
      setShowFixtureForm(false); fetchFixtures();
    } catch (e) { alert("Σφάλμα"); } finally { setSavingFixture(false); }
  };
  const handleUpdateFixture = async (fid, data) => {
    try { await axios.put(`${API}/admin/fixtures/${fid}`, data, { headers: getAuthHeaders() }); fetchFixtures(); } catch (e) { alert("Σφάλμα"); }
  };
  const handleDeleteFixture = async (fid) => {
    if (!window.confirm("Διαγραφή αγώνα;")) return;
    try { await axios.delete(`${API}/admin/fixtures/${fid}`, { headers: getAuthHeaders() }); fetchFixtures(); } catch (e) { alert("Σφάλμα"); }
  };

  // Gallery
  const fetchGallery = useCallback(async () => {
    if (!selectedGroup) return;
    try { const res = await axios.get(`${API}/gallery?academy_group_id=${selectedGroup.id}`); setGalleryItems(res.data); } catch (e) { console.error(e); }
  }, [selectedGroup]);
  useEffect(() => { if (detailTab === "gallery" && selectedGroup) fetchGallery(); }, [detailTab, selectedGroup, fetchGallery]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingFile(true);
    try { const fd = new FormData(); fd.append("file", file); const res = await axios.post(`${API}/admin/gallery/upload`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } }); setGalleryForm(prev => ({...prev, image_url: res.data.url})); } catch (e) { alert("Σφάλμα"); } finally { setUploadingFile(false); }
  };
  const handleSaveGallery = async () => {
    setSavingGallery(true);
    try { await axios.post(`${API}/admin/gallery`, {...galleryForm, academy_group_id: selectedGroup.id}, { headers: getAuthHeaders() }); setShowGalleryForm(false); fetchGallery(); setGalleryForm({ title: "", image_url: "", category: "Training", description: "" }); } catch (e) { alert("Σφάλμα"); } finally { setSavingGallery(false); }
  };
  const handleDeleteGallery = async (id) => { if (!window.confirm("Διαγραφή;")) return; try { await axios.delete(`${API}/admin/gallery/${id}`, { headers: getAuthHeaders() }); fetchGallery(); } catch (e) { alert("Σφάλμα"); } };

  // ── Drill-down view ──
  if (selectedGroup) {
    const groupPlayers = players.filter(p =>
      p.academy_group_id === selectedGroup.id ||
      (p.academy_group_ids && p.academy_group_ids.includes(selectedGroup.id))
    );

    // Player profile view within academy drill-down
    if (viewingPlayer) {
      const freshPlayer = players.find(p => p.id === viewingPlayer.id) || viewingPlayer;
      return (
        <div data-testid="academy-detail-view">
          <AdminPlayerProfile player={freshPlayer} academyGroups={groups} onBack={() => setViewingPlayer(null)} onRefresh={onRefresh} />
        </div>
      );
    }

    return (
      <div data-testid="academy-detail-view">
        <button onClick={() => setSelectedGroup(null)} className="admin-btn-ghost text-sm mb-4" data-testid="back-to-academy">
          <ChevronRight size={14} className="rotate-180" /> Πίσω στις ομάδες
        </button>
        <div className="mb-6">
          <h2 className="font-['Bebas_Neue'] text-4xl text-[#10B981] tracking-wide">{selectedGroup.name}</h2>
          <div className="flex items-center gap-3 mt-2 text-sm text-zinc-300 flex-wrap">
            <span className="admin-badge admin-badge-green">{selectedGroup.age_range}</span>
            {selectedGroup.coach_name && <span>Προπονητής: {selectedGroup.coach_name}</span>}
            {selectedGroup.training_schedule && <span className="flex items-center gap-1"><Clock size={14} /> {selectedGroup.training_schedule}</span>}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#262626] pb-0 overflow-x-auto">
          {[
            { id: "roster", label: "Ρόστερ", icon: Users, count: groupPlayers.length },
            { id: "schedule", label: "Αγώνες", icon: Calendar, count: groupFixtures.length },
            { id: "gallery", label: "Γκαλερί", icon: Image, count: galleryItems.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setDetailTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] whitespace-nowrap ${
                detailTab === tab.id ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-zinc-400 hover:text-white'
              }`} data-testid={`academy-tab-${tab.id}`}>
              <tab.icon size={15} /> {tab.label}
              <span className="text-xs ml-1 opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* ── Roster ── */}
        {detailTab === "roster" && (
          <div>
            <div className="flex justify-end mb-4 gap-2">
              <button onClick={openCreatePlayer} className="admin-btn-primary" data-testid="add-academy-player-btn"><Plus size={14} /> Νέος Παίκτης</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="academy-players-table">
                <thead><tr><th>#</th><th></th><th>Όνομα</th><th>Θέση</th><th>Ηλικία</th><th>Γονέας</th><th>Τηλ.</th><th></th></tr></thead>
                <tbody>
                  {groupPlayers.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => setViewingPlayer(p)}>
                      <td className="font-mono text-zinc-400">{p.number}</td>
                      <td>{p.image_url ? <img src={p.image_url} alt="" className="w-9 h-9 object-cover rounded-full" /> : <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center"><Users size={14} className="text-zinc-600" /></div>}</td>
                      <td className="font-medium text-[#10B981] hover:underline" data-testid={`view-academy-player-${p.id}`}>{p.name}</td>
                      <td className="text-zinc-300">{p.position}</td>
                      <td className="text-zinc-300">{p.age || calcAge(p.date_of_birth) || "-"}</td>
                      <td className="text-zinc-400 text-sm">{p.parent_name || "-"}</td>
                      <td className="text-zinc-400 text-sm">{p.parent_phone || "-"}</td>
                      <td>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditPlayer(p)} className="admin-icon-btn" data-testid={`edit-academy-player-${p.id}`}><Edit2 size={14} /></button>
                          <button onClick={() => openTransfer(p)} className="admin-icon-btn text-blue-400/70 hover:text-blue-300" title="Μεταφορά" data-testid={`transfer-player-${p.id}`}><ArrowLeftRight size={14} /></button>
                          <button onClick={() => handleDeletePlayer(p.id)} className="admin-icon-btn text-red-500/70 hover:text-red-400" data-testid={`delete-academy-player-${p.id}`}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {groupPlayers.length === 0 && <tr><td colSpan={8}><EmptyState icon={Users} text="Δεν υπάρχουν παίκτες" /></td></tr>}
                </tbody>
              </table>
            </div>

            {/* Player Form Modal */}
            {showPlayerForm && (
              <FormModal title={editPlayer ? "Επεξεργασία Παίκτη" : "Νέος Παίκτης"} onClose={() => setShowPlayerForm(false)} onSave={handleSavePlayer} saving={savingPlayer}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ονοματεπώνυμο *"><AdminInput value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} data-testid="academy-player-name" /></Field>
                  <Field label="Αριθμός"><AdminInput type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} data-testid="academy-player-number" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ημ. Γέννησης *">
                    <AdminInput type="date" value={playerForm.date_of_birth} onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})} data-testid="academy-player-dob" />
                    {playerForm.date_of_birth && <span className="text-xs text-[#10B981] mt-1 block">Ηλικία: {calcAge(playerForm.date_of_birth)} ετών</span>}
                  </Field>
                  <Field label="Θέση">
                    <AdminSelect value={playerForm.position} onChange={e => setPlayerForm({...playerForm, position: e.target.value})}>
                      <option value="Goalkeeper">Τερματοφύλακας</option><option value="Defender">Αμυντικός</option><option value="Midfielder">Μέσος</option><option value="Forward">Επιθετικός</option>
                    </AdminSelect>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Εθνικότητα"><AdminInput value={playerForm.nationality} onChange={e => setPlayerForm({...playerForm, nationality: e.target.value})} /></Field>
                  <Field label="Ύψος"><AdminInput placeholder="1.45m" value={playerForm.height} onChange={e => setPlayerForm({...playerForm, height: e.target.value})} /></Field>
                  <Field label="Βάρος"><AdminInput placeholder="35kg" value={playerForm.weight} onChange={e => setPlayerForm({...playerForm, weight: e.target.value})} /></Field>
                </div>
                <ImageUpload currentUrl={playerForm.image_url} onImageChange={url => setPlayerForm({...playerForm, image_url: url})} playerId={editPlayer?.id} />
                <div className="border-t border-[#262626] pt-4 mt-2">
                  <h4 className="text-white text-sm font-semibold mb-3">Στοιχεία Γονέα / Κηδεμόνα</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ονοματεπώνυμο"><AdminInput value={playerForm.parent_name} onChange={e => setPlayerForm({...playerForm, parent_name: e.target.value})} data-testid="academy-player-parent-name" /></Field>
                    <Field label="Τηλέφωνο"><AdminInput value={playerForm.parent_phone} onChange={e => setPlayerForm({...playerForm, parent_phone: e.target.value})} data-testid="academy-player-parent-phone" /></Field>
                  </div>
                  <Field label="Email"><AdminInput type="email" value={playerForm.parent_email} onChange={e => setPlayerForm({...playerForm, parent_email: e.target.value})} data-testid="academy-player-parent-email" /></Field>
                </div>
                <Field label="Βιογραφικό"><AdminTextarea rows={2} value={playerForm.bio} onChange={e => setPlayerForm({...playerForm, bio: e.target.value})} /></Field>
              </FormModal>
            )}

            {/* Transfer Modal */}
            {showTransfer && transferPlayer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowTransfer(false)}>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="transfer-modal">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a]">
                    <h2 className="font-['Bebas_Neue'] text-2xl text-white">Μεταφορά: {transferPlayer.name}</h2>
                    <button onClick={() => setShowTransfer(false)} className="text-zinc-400 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-3">
                    <p className="text-sm text-zinc-400 mb-2">Επιλέξτε τις ομάδες στις οποίες ανήκει ο παίκτης:</p>
                    {groups.map(g => (
                      <label key={g.id} className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#262626] rounded-lg cursor-pointer hover:border-[#10B981]/40 transition-colors" data-testid={`transfer-group-${g.id}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${transferGroupIds.includes(g.id) ? 'bg-[#10B981] border-[#10B981]' : 'border-[#444]'}`}>
                          {transferGroupIds.includes(g.id) && <Check size={13} className="text-black" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" checked={transferGroupIds.includes(g.id)} onChange={() => toggleTransferGroup(g.id)} className="hidden" />
                        <div>
                          <span className="text-white text-sm font-medium">{g.name}</span>
                          <span className="text-zinc-500 text-xs ml-2">{g.age_range}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a]">
                    <button onClick={handleTransfer} disabled={savingTransfer} className="admin-btn-primary flex-1" data-testid="confirm-transfer-btn">
                      {savingTransfer ? "Μεταφορά..." : "Αποθήκευση"}
                    </button>
                    <button onClick={() => setShowTransfer(false)} className="admin-btn-ghost flex-1">Ακύρωση</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Schedule / Fixtures ── */}
        {detailTab === "schedule" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={openCreateFixture} className="admin-btn-primary" data-testid="add-academy-fixture-btn"><Plus size={14} /> Νέος Αγώνας</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="academy-fixtures-table">
                <thead><tr><th>Ημ/νία</th><th>Γηπεδούχος</th><th>Σκορ</th><th>Φιλοξ.</th><th>Κατάσταση</th><th></th></tr></thead>
                <tbody>
                  {groupFixtures.map(f => (
                    <tr key={f.id}>
                      <td className="text-sm text-zinc-400">{new Date(f.match_date).toLocaleDateString('el-GR')}</td>
                      <td className={f.home_team === 'LEFTERIA FC' ? 'text-[#10B981] font-medium' : 'text-zinc-200'}>{f.home_team}</td>
                      <td className="font-['Bebas_Neue'] text-lg text-white">
                        {f.status === 'Completed' ? `${f.home_score ?? 0} - ${f.away_score ?? 0}` : '-'}
                      </td>
                      <td className={f.away_team === 'LEFTERIA FC' ? 'text-[#10B981] font-medium' : 'text-zinc-200'}>{f.away_team}</td>
                      <td>
                        <span className={f.status === 'Completed' ? 'badge-completed' : 'admin-badge admin-badge-default'}>
                          {f.status === 'Completed' ? 'Ολοκλ.' : 'Προγρ.'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {f.status === 'Scheduled' && (
                            <button onClick={() => handleUpdateFixture(f.id, { status: "Completed", home_score: parseInt(prompt("Σκορ γηπεδούχου:") || "0"), away_score: parseInt(prompt("Σκορ φιλοξ.:") || "0") })}
                              className="admin-icon-btn text-green-400/70 hover:text-green-300" title="Καταχώρηση Σκορ"><Check size={14} /></button>
                          )}
                          <button onClick={() => handleDeleteFixture(f.id)} className="admin-icon-btn text-red-500/70 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {groupFixtures.length === 0 && <tr><td colSpan={6}><EmptyState icon={Calendar} text="Δεν υπάρχουν αγώνες" /></td></tr>}
                </tbody>
              </table>
            </div>
            {showFixtureForm && (
              <FormModal title="Νέος Αγώνας" onClose={() => setShowFixtureForm(false)} onSave={handleSaveFixture} saving={savingFixture}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Γηπεδούχος *"><AdminInput value={fixtureForm.home_team} onChange={e => setFixtureForm({...fixtureForm, home_team: e.target.value})} /></Field>
                  <Field label="Φιλοξενούμενος *"><AdminInput value={fixtureForm.away_team} onChange={e => setFixtureForm({...fixtureForm, away_team: e.target.value})} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ημ/νία & Ώρα *"><AdminInput type="datetime-local" value={fixtureForm.match_date} onChange={e => setFixtureForm({...fixtureForm, match_date: e.target.value})} /></Field>
                  <Field label="Γήπεδο"><AdminInput value={fixtureForm.venue} onChange={e => setFixtureForm({...fixtureForm, venue: e.target.value})} /></Field>
                </div>
                <Field label="Διοργάνωση"><AdminInput value={fixtureForm.competition} onChange={e => setFixtureForm({...fixtureForm, competition: e.target.value})} placeholder="Πρωτάθλημα U12" /></Field>
              </FormModal>
            )}
          </div>
        )}

        {/* ── Gallery ── */}
        {detailTab === "gallery" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowGalleryForm(true)} className="admin-btn-primary" data-testid="add-academy-gallery-btn"><Plus size={14} /> Νέα Φωτογραφία</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryItems.map(item => (
                <div key={item.id} className="bg-[#151515] border border-[#262626] rounded-lg overflow-hidden group">
                  <div className="aspect-[4/3] overflow-hidden"><img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="admin-badge admin-badge-default text-xs">{item.category}</span>
                      <button onClick={() => handleDeleteGallery(item.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {galleryItems.length === 0 && <div className="col-span-full"><EmptyState icon={Image} text="Δεν υπάρχουν φωτογραφίες" /></div>}
            </div>
            {showGalleryForm && (
              <FormModal title="Νέα Φωτογραφία" onClose={() => setShowGalleryForm(false)} onSave={handleSaveGallery} saving={savingGallery}>
                <Field label="Τίτλος *"><AdminInput value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} /></Field>
                <Field label="Εικόνα *">
                  <div className="flex gap-2">
                    <AdminInput value={galleryForm.image_url} onChange={e => setGalleryForm({...galleryForm, image_url: e.target.value})} placeholder="URL εικόνας" className="flex-1" />
                    <label className="admin-btn-ghost cursor-pointer flex items-center"><input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />{uploadingFile ? <RefreshCw size={14} className="animate-spin" /> : "Upload"}</label>
                  </div>
                </Field>
                <Field label="Περιγραφή"><AdminInput value={galleryForm.description} onChange={e => setGalleryForm({...galleryForm, description: e.target.value})} /></Field>
              </FormModal>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Group List View ──
  return (
    <div data-testid="admin-academy-enhanced-tab">
      <TabHeader title="Ομάδες Ακαδημίας" count={groups.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-academy-group-btn"><Plus size={14} /> Νέα Ομάδα</button>
      </TabHeader>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => {
          const playerCount = players.filter(p => p.academy_group_id === g.id || (p.academy_group_ids && p.academy_group_ids.includes(g.id))).length;
          return (
            <div key={g.id} className="admin-card p-6 cursor-pointer hover:border-[#10B981]/40 transition-colors group" onClick={() => { setSelectedGroup(g); setDetailTab("roster"); }} data-testid={`academy-group-${g.id}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-['Bebas_Neue'] text-2xl text-[#10B981] group-hover:text-white transition-colors">{g.name}</span>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(g)} className="admin-icon-btn"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteGroup(g.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <span className="admin-badge admin-badge-green mb-2">{g.age_range}</span>
              <p className="text-zinc-200 text-sm mb-1">{g.coach_name}</p>
              <p className="text-zinc-400 text-sm flex items-center gap-1"><Clock size={13} /> {g.training_schedule}</p>
              <div className="flex items-center mt-3 text-sm text-zinc-400">
                <Users size={13} className="mr-1" /> {playerCount} παίκτες
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#10B981] ml-auto transition-colors" />
              </div>
            </div>
          );
        })}
        {groups.length === 0 && <EmptyState icon={GraduationCap} text="Δεν υπάρχουν ομάδες ακαδημίας" />}
      </div>
      {showForm && (
        <FormModal title={editGroup ? "Επεξεργασία" : "Νέα Ομάδα"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Όνομα *"><AdminInput placeholder="U18" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="group-name-input" /></Field>
            <Field label="Ηλικίες *"><AdminInput placeholder="16-18 ετών" value={form.age_range} onChange={e => setForm({...form, age_range: e.target.value})} /></Field>
          </div>
          <Field label="Προπονητής"><AdminInput value={form.coach_name} onChange={e => setForm({...form, coach_name: e.target.value})} /></Field>
          <Field label="Πρόγραμμα"><AdminInput value={form.training_schedule} onChange={e => setForm({...form, training_schedule: e.target.value})} /></Field>
          <Field label="Περιγραφή"><AdminTextarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
        </FormModal>
      )}
    </div>
  );
};

// ==================== REGISTRATIONS TAB ====================
const RegistrationsTab = ({ academyGroups, onRefresh }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [assignGroupId, setAssignGroupId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const url = filterStatus === "all" ? `${API}/admin/registrations` : `${API}/admin/registrations?status=${filterStatus}`;
      const res = await axios.get(url, { headers });
      setRegistrations(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleStatus = async (regId, status) => {
    setProcessing(true);
    try {
      const headers = getAuthHeaders();
      const body = { status, admin_notes: adminNotes };
      if (status === "approved" && assignGroupId) body.assigned_group_id = assignGroupId;
      await axios.put(`${API}/admin/registrations/${regId}/status`, body, { headers });
      fetchRegistrations(); setSelectedReg(null); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setProcessing(false); }
  };

  const handleDelete = async (regId) => {
    if (!window.confirm("Διαγραφή εγγραφής;")) return;
    try {
      await axios.delete(`${API}/admin/registrations/${regId}`, { headers: getAuthHeaders() });
      fetchRegistrations(); if (selectedReg?.id === regId) setSelectedReg(null);
    } catch (e) { alert("Σφάλμα"); }
  };

  const statusBadge = (s) => {
    const map = { pending: "admin-badge admin-badge-gold", approved: "admin-badge admin-badge-green", rejected: "admin-badge admin-badge-default" };
    const labels = { pending: "Εκκρεμεί", approved: "Εγκρίθηκε", rejected: "Απορρίφθηκε" };
    return <span className={map[s] || map.pending}>{labels[s] || s}</span>;
  };

  if (selectedReg) {
    const r = selectedReg;
    return (
      <div data-testid="registration-detail-view">
        <button onClick={() => setSelectedReg(null)} className="admin-btn-ghost text-sm mb-4" data-testid="back-to-registrations">
          <ChevronRight size={14} className="rotate-180" /> Πίσω στις εγγραφές
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-['Bebas_Neue'] text-3xl text-white">{r.player_first_name} {r.player_last_name}</h2>
            <div className="flex items-center gap-3 mt-1">{statusBadge(r.status)} <span className="text-zinc-400 text-sm">{new Date(r.created_at).toLocaleDateString("el-GR")}</span></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Player Info */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Στοιχεία Παίκτη</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Ημ. Γέννησης</span><span className="text-white">{r.player_dob}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Φύλο</span><span className="text-white">{r.player_gender === "male" ? "Αγόρι" : "Κορίτσι"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Διεύθυνση</span><span className="text-white">{r.player_address}, {r.player_city} {r.player_postal_code}</span></div>
            </div>
          </div>
          {/* Parent Info */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Γονέας / Κηδεμόνας</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Όνομα</span><span className="text-white">{r.parent_name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Σχέση</span><span className="text-white">{r.parent_relationship}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Τηλ.</span><span className="text-white">{r.parent_phone}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Email</span><span className="text-white">{r.parent_email}</span></div>
            </div>
          </div>
          {/* Emergency */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Έκτακτη Ανάγκη</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Όνομα</span><span className="text-white">{r.emergency_name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Τηλ.</span><span className="text-white">{r.emergency_phone}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Σχέση</span><span className="text-white">{r.emergency_relationship || "-"}</span></div>
            </div>
          </div>
          {/* Medical */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Ιατρικά</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Αλλεργίες</span><span className="text-white">{r.has_allergies ? r.allergies_details || "Ναι" : "Όχι"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Παθήσεις</span><span className="text-white">{r.has_conditions ? r.conditions_details || "Ναι" : "Όχι"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Φάρμακα</span><span className="text-white">{r.has_medication ? r.medication_details || "Ναι" : "Όχι"}</span></div>
            </div>
          </div>
          {/* Consents */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Συγκαταθέσεις</h3>
            <div className="space-y-1.5 text-sm">
              {[
                ["Συμμετοχή", r.consent_participation],
                ["Ιατρική Εξ.", r.consent_medical_auth],
                ["GDPR", r.consent_gdpr],
                ["Οπτικοακ. Υλικό", r.consent_media],
                ["Ευθύνη", r.consent_liability],
                ["Οικον. Όροι", r.consent_financial],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-zinc-400">{l}</span><span className={v ? "text-green-400" : v === false ? "text-red-400" : "text-zinc-600"}>{v === true ? "Ναι" : v === false ? "Όχι" : "-"}</span></div>
              ))}
            </div>
          </div>
          {/* Payment & Signature */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Πληρωμή & Υπογραφή</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Πληρωμή</span><span className="text-white">{r.payment_method === "cash" ? "Μετρητά" : r.payment_method === "card" ? "Κάρτα" : "Μεταφορά"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Ημ/νία</span><span className="text-white">{r.signature_date}</span></div>
            </div>
            {r.signature_data && (
              <div className="mt-3 border border-[#262626] rounded-lg p-2 bg-[#0d0d0d]">
                <img src={r.signature_data} alt="Υπογραφή" className="h-16 mx-auto" />
              </div>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        {r.status === "pending" && (
          <div className="admin-card p-5 mt-4" data-testid="admin-actions">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Ενέργειες</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1.5">Ανάθεση σε Ομάδα Ακαδημίας</label>
                <select className="admin-input" value={assignGroupId} onChange={e => setAssignGroupId(e.target.value)} data-testid="assign-group-select">
                  <option value="">-- Επιλέξτε ομάδα --</option>
                  {academyGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.age_range})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-1.5">Σημειώσεις</label>
                <textarea className="admin-input" rows={2} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Σημειώσεις διαχειριστή..." data-testid="admin-notes" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleStatus(r.id, "approved")} disabled={processing} className="admin-btn-primary flex-1" data-testid="approve-btn">
                  <Check size={14} /> Έγκριση
                </button>
                <button onClick={() => handleStatus(r.id, "rejected")} disabled={processing} className="admin-btn-ghost flex-1 border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50" data-testid="reject-btn">
                  <X size={14} /> Απόρριψη
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="admin-registrations-tab">
      <TabHeader title="Εγγραφές Ακαδημίας" count={registrations.length}>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filterStatus === s ? 'bg-[#F5A623]/15 text-[#F5A623]' : 'text-zinc-400 hover:text-white'}`}
              data-testid={`filter-${s}`}>
              {s === "all" ? "Όλες" : s === "pending" ? "Εκκρεμεί" : s === "approved" ? "Εγκρίθηκαν" : "Απορρίφθηκαν"}
            </button>
          ))}
        </div>
      </TabHeader>
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Φόρτωση...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table" data-testid="registrations-table">
            <thead><tr><th>Παίκτης</th><th>Γονέας</th><th>Τηλ.</th><th>Ημ/νία</th><th>Κατάσταση</th><th></th></tr></thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r.id} className="cursor-pointer" onClick={() => { setSelectedReg(r); setAssignGroupId(r.assigned_group_id || ""); setAdminNotes(r.admin_notes || ""); }}>
                  <td className="font-medium text-white">{r.player_first_name} {r.player_last_name}</td>
                  <td className="text-zinc-300">{r.parent_name}</td>
                  <td className="text-zinc-300">{r.parent_phone}</td>
                  <td className="text-zinc-400 text-sm">{new Date(r.created_at).toLocaleDateString("el-GR")}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDelete(r.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && <tr><td colSpan={6}><EmptyState icon={ClipboardList} text="Δεν υπάρχουν εγγραφές" /></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN ADMIN PANEL ====================

// ==================== ADMIN PRODUCTS TAB ====================
const AdminProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: 0, image_url: "", category: "clothing", sizes: [], in_stock: true, delivery_options: ["Παραλαβή", "Αποστολή"] });
  const [loading, setLoading] = useState(true);
  const [sizeInput, setSizeInput] = useState("");

  const fetch = async () => {
    try { const res = await axios.get(`${API}/admin/products`, { headers: authH() }); setProducts(res.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setForm({ name: "", description: "", price: 0, image_url: "", category: "clothing", sizes: [], in_stock: true, delivery_options: ["Παραλαβή", "Αποστολή"] }); setEditing(null); setSizeInput(""); };

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/admin/products/${editing}`, form, { headers: authH() });
      } else {
        await axios.post(`${API}/admin/products`, form, { headers: authH() });
      }
      resetForm();
      fetch();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (p) => { setEditing(p.id); setForm({ name: p.name, description: p.description || "", price: p.price, image_url: p.image_url || "", category: p.category || "clothing", sizes: p.sizes || [], in_stock: p.in_stock !== false, delivery_options: p.delivery_options || ["Παραλαβή", "Αποστολή"] }); };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή προϊόντος;")) return;
    try { await axios.delete(`${API}/admin/products/${id}`, { headers: authH() }); fetch(); } catch {}
  };

  const addSize = () => { if (sizeInput.trim() && !form.sizes.includes(sizeInput.trim())) { setForm({ ...form, sizes: [...form.sizes, sizeInput.trim()] }); setSizeInput(""); } };
  const removeSize = (s) => setForm({ ...form, sizes: form.sizes.filter(x => x !== s) });

  return (
    <div data-testid="admin-products-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Διαχείριση Προϊόντων</h2>
      </div>

      {/* Form */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-6">
        <h3 className="text-sm text-zinc-400 mb-3">{editing ? "Επεξεργασία Προϊόντος" : "Νέο Προϊόν"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Όνομα" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="product-name-input" />
          <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} placeholder="Τιμή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="product-price-input" />
          <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="URL Εικόνας" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white">
            <option value="clothing">Ρουχισμός</option>
            <option value="accessories">Αξεσουάρ</option>
          </select>
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Περιγραφή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white md:col-span-2" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-zinc-500">Μεγέθη:</span>
          {form.sizes.map(s => (
            <span key={s} className="flex items-center gap-1 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded">
              {s} <button onClick={() => removeSize(s)} className="text-zinc-500 hover:text-red-400"><X size={10} /></button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSize())} placeholder="π.χ. XL" className="bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-xs text-white w-16" />
            <button onClick={addSize} className="text-[#F5A623] text-xs">+</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-zinc-500">Παράδοση:</span>
          {["Παραλαβή", "Αποστολή"].map(d => (
            <label key={d} className="flex items-center gap-1 text-xs text-zinc-300">
              <input type="checkbox" checked={form.delivery_options.includes(d)} onChange={e => {
                const opts = e.target.checked ? [...form.delivery_options, d] : form.delivery_options.filter(x => x !== d);
                setForm({...form, delivery_options: opts});
              }} /> {d}
            </label>
          ))}
          <label className="flex items-center gap-1 text-xs text-zinc-300 ml-4">
            <input type="checkbox" checked={form.in_stock} onChange={e => setForm({...form, in_stock: e.target.checked})} /> Σε απόθεμα
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="bg-[#F5A623] text-black text-sm font-semibold px-4 py-2 rounded hover:bg-[#e6951a] transition-colors" data-testid="product-save-btn">
            {editing ? "Ενημέρωση" : "Δημιουργία"}
          </button>
          {editing && <button onClick={resetForm} className="text-zinc-400 text-sm px-4 py-2 hover:text-white">Ακύρωση</button>}
        </div>
      </div>

      {/* List */}
      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto"></div></div> : (
        <div className="space-y-2" data-testid="products-list">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              {p.image_url && <img src={p.image_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{p.name}</div>
                <div className="text-zinc-500 text-xs">{p.price.toFixed(2)}&#8364; &middot; {p.sizes?.join(", ") || "Χωρίς μεγέθη"} {!p.in_stock && <span className="text-red-400">Εξαντλημένο</span>}</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handleEdit(p)} className="p-1.5 text-zinc-500 hover:text-[#F5A623]" data-testid={`edit-product-${p.id}`}><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-zinc-500 hover:text-red-400" data-testid={`delete-product-${p.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== ADMIN TICKETS TAB ====================
const AdminTicketsTab = () => {
  const [tickets, setTickets] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: 0, ticket_type: "match", fixture_id: "", available: true, max_quantity: 200 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tRes, fRes] = await Promise.all([
        axios.get(`${API}/admin/tickets`, { headers: authH() }),
        axios.get(`${API}/fixtures?limit=50`, { headers: authH() }),
      ]);
      setTickets(tRes.data);
      setFixtures(fRes.data.filter(f => f.status === "Scheduled"));
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ name: "", description: "", price: 0, ticket_type: "match", fixture_id: "", available: true, max_quantity: 200 }); setEditing(null); };

  const handleSave = async () => {
    try {
      const payload = { ...form, fixture_id: form.fixture_id || null };
      if (editing) {
        await axios.put(`${API}/admin/tickets/${editing}`, payload, { headers: authH() });
      } else {
        await axios.post(`${API}/admin/tickets`, payload, { headers: authH() });
      }
      resetForm();
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (t) => { setEditing(t.id); setForm({ name: t.name, description: t.description || "", price: t.price, ticket_type: t.ticket_type, fixture_id: t.fixture_id || "", available: t.available, max_quantity: t.max_quantity || 200 }); };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή εισιτηρίου;")) return;
    try { await axios.delete(`${API}/admin/tickets/${id}`, { headers: authH() }); fetchData(); } catch {}
  };

  const typeLabels = { match: "Αγώνα", seasonal: "Διαρκείας" };

  return (
    <div data-testid="admin-tickets-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Διαχείριση Εισιτηρίων</h2>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-6">
        <h3 className="text-sm text-zinc-400 mb-3">{editing ? "Επεξεργασία" : "Νέο Εισιτήριο"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Όνομα" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="ticket-name-input" />
          <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} placeholder="Τιμή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="ticket-price-input" />
          <select value={form.ticket_type} onChange={e => setForm({...form, ticket_type: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white">
            <option value="match">Αγώνα</option>
            <option value="seasonal">Διαρκείας</option>
          </select>
          <input type="number" value={form.max_quantity} onChange={e => setForm({...form, max_quantity: parseInt(e.target.value) || 0})} placeholder="Μέγιστη ποσότητα" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" />
          {form.ticket_type === "match" && (
            <select value={form.fixture_id} onChange={e => setForm({...form, fixture_id: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white md:col-span-2">
              <option value="">Επιλέξτε αγώνα...</option>
              {fixtures.map(f => (
                <option key={f.id} value={f.id}>{f.home_team} vs {f.away_team} — {new Date(f.match_date).toLocaleDateString("el-GR")}</option>
              ))}
            </select>
          )}
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Περιγραφή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white md:col-span-2" />
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-1 text-xs text-zinc-300"><input type="checkbox" checked={form.available} onChange={e => setForm({...form, available: e.target.checked})} /> Διαθέσιμο</label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="bg-[#F5A623] text-black text-sm font-semibold px-4 py-2 rounded hover:bg-[#e6951a]" data-testid="ticket-save-btn">{editing ? "Ενημέρωση" : "Δημιουργία"}</button>
          {editing && <button onClick={resetForm} className="text-zinc-400 text-sm px-4 py-2 hover:text-white">Ακύρωση</button>}
        </div>
      </div>

      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto"></div></div> : (
        <div className="space-y-2" data-testid="tickets-list">
          {tickets.map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${t.ticket_type === "seasonal" ? "bg-[#F5A623]/10" : "bg-blue-500/10"}`}>
                <Ticket size={16} className={t.ticket_type === "seasonal" ? "text-[#F5A623]" : "text-blue-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{t.name}</div>
                <div className="text-zinc-500 text-xs">{t.price.toFixed(2)}&#8364; &middot; {typeLabels[t.ticket_type]} &middot; {t.available ? "Διαθέσιμο" : "Μη διαθέσιμο"}</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handleEdit(t)} className="p-1.5 text-zinc-500 hover:text-[#F5A623]"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== ADMIN ORDERS TAB ====================
const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try { const res = await axios.get(`${API}/admin/orders`, { headers: authH() }); setOrders(res.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try { await axios.put(`${API}/admin/orders/${orderId}/status?status=${status}`, {}, { headers: authH() }); fetchOrders(); } catch {}
  };

  const statuses = [
    { value: "pending", label: "Σε αναμονή", color: "text-yellow-400" },
    { value: "processing", label: "Επεξεργασία", color: "text-blue-400" },
    { value: "shipped", label: "Απεστάλη", color: "text-purple-400" },
    { value: "completed", label: "Ολοκληρώθηκε", color: "text-green-400" },
    { value: "cancelled", label: "Ακυρώθηκε", color: "text-red-400" },
  ];

  return (
    <div data-testid="admin-orders-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Παραγγελίες</h2>
        <button onClick={fetchOrders} className="text-zinc-400 hover:text-[#F5A623] transition-colors"><RefreshCw size={16} /></button>
      </div>

      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto"></div></div> : orders.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Δεν υπάρχουν παραγγελίες</div>
      ) : (
        <div className="space-y-3" data-testid="orders-list">
          {orders.map(o => {
            const st = statuses.find(s => s.value === o.status) || statuses[0];
            return (
              <div key={o.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4" data-testid={`admin-order-${o.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-zinc-500">#{o.id.slice(0, 8)} &middot; {new Date(o.created_at).toLocaleDateString("el-GR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="text-white text-sm font-medium mt-0.5">{o.user_name} <span className="text-zinc-500 font-normal">({o.user_email})</span></div>
                  </div>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    className={`bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-xs ${st.color}`} data-testid={`order-status-${o.id}`}>
                    {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1 mb-3">
                  {o.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-zinc-300">{item.name} {item.size && `(${item.size})`} x{item.quantity}</span>
                      <span className="text-zinc-500">{item.subtotal.toFixed(2)}&#8364;</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                  <div className="text-xs text-zinc-500">
                    {o.shipping?.name && <span>{o.shipping.name}, {o.shipping.city}</span>}
                    {o.shipping?.phone && <span className="ml-2">{o.shipping.phone}</span>}
                  </div>
                  <span className="text-sm font-semibold text-[#F5A623]">{o.total.toFixed(2)}&#8364;</span>
                </div>
                {o.notes && <div className="text-xs text-zinc-500 mt-2 italic">Σημείωση: {o.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


const AdminPanel = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState(["club_section", "academy_section", "shop_section", "settings_section"]);
  const [data, setData] = useState({
    stats: {}, players: [], fixtures: [], news: [], standings: [],
    academyGroups: [], staff: [], venues: [], seasons: [], messages: [], club: {},
    teams: []
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]);
  };

  const fetchAll = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [stats, players, fixtures, news, standings, groups, staffRes, venues, seasons, messages, club, teamsRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`, { headers }),
        axios.get(`${API}/players?is_active=true`),
        axios.get(`${API}/fixtures`),
        axios.get(`${API}/news`),
        axios.get(`${API}/standings`),
        axios.get(`${API}/academy-groups`),
        axios.get(`${API}/staff`),
        axios.get(`${API}/venues`),
        axios.get(`${API}/seasons`),
        axios.get(`${API}/admin/contact`, { headers }),
        axios.get(`${API}/club`),
        axios.get(`${API}/teams`),
      ]);
      setData({
        stats: stats.data, players: players.data, fixtures: fixtures.data,
        news: news.data, standings: standings.data, academyGroups: groups.data,
        staff: staffRes.data, venues: venues.data, seasons: seasons.data,
        messages: messages.data, club: club.data, teams: teamsRes.data
      });
    } catch (e) {
      console.error("Error fetching admin data:", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Grouped sidebar config
  const sidebarConfig = [
    { type: "item", id: "dashboard", label: "Πίνακας", icon: BarChart3 },
    { type: "item", id: "livescore", label: "Live Score", icon: Zap },
    { type: "divider" },
    { type: "group", id: "club_section", label: "Συλλόγος", icon: Building2, items: [
      { id: "teams", label: "Ομάδες", icon: Shield },
    ]},
    { type: "group", id: "academy_section", label: "Ακαδημία", icon: GraduationCap, items: [
      { id: "academy", label: "Ομάδες", icon: Users },
      { id: "registrations", label: "Εγγραφές", icon: ClipboardList },
    ]},
    { type: "divider" },
    { type: "item", id: "news", label: "Νέα", icon: Newspaper },
    { type: "item", id: "messages", label: "Μηνύματα", icon: Mail },
    { type: "divider" },
    { type: "group", id: "shop_section", label: "Κατάστημα", icon: ShoppingCart, items: [
      { id: "shop_products", label: "Προϊόντα", icon: Package },
      { id: "shop_tickets", label: "Εισιτήρια", icon: Ticket },
      { id: "shop_orders", label: "Παραγγελίες", icon: ShoppingCart },
    ]},
    { type: "group", id: "settings_section", label: "Ρυθμίσεις", icon: Settings, items: [
      { id: "settings_club", label: "Πληροφορίες", icon: Building2 },
      { id: "settings_seasons", label: "Σεζόν", icon: Archive },
      { id: "settings_venues", label: "Γήπεδα", icon: MapPin },
    ]},
  ];

  // Flat tabs for mobile
  const mobileTabs = sidebarConfig.flatMap(item => {
    if (item.type === "item") return [item];
    if (item.type === "group") return item.items;
    return [];
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]" data-testid="admin-loading">
      <div className="text-center">
        <img src={CLUB_LOGO} alt="" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <div className="spinner"></div>
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab stats={data.stats} onTabChange={setActiveTab} />;
      case "livescore": return <LiveScoreTab fixtures={data.fixtures} players={data.players} onRefresh={fetchAll} />;
      case "teams": return <TeamsTab teams={data.teams} players={data.players} fixtures={data.fixtures} staff={data.staff} standings={data.standings} onRefresh={fetchAll} onTabChange={setActiveTab} />;
      case "standings": return <StandingsTab standings={data.standings} onRefresh={fetchAll} />;
      case "academy": return <EnhancedAcademyTab groups={data.academyGroups} players={data.players} onRefresh={fetchAll} />;
      case "registrations": return <RegistrationsTab academyGroups={data.academyGroups} onRefresh={fetchAll} />;
      case "news": return <NewsTab news={data.news} onRefresh={fetchAll} />;
      case "gallery": return <GalleryTab onRefresh={fetchAll} />;
      case "messages": return <MessagesTab messages={data.messages} onRefresh={fetchAll} />;
      case "shop_products": return <AdminProductsTab />;
      case "shop_tickets": return <AdminTicketsTab />;
      case "shop_orders": return <AdminOrdersTab />;
      case "settings_club": return <ClubProfileTab club={data.club} onRefresh={fetchAll} />;
      case "settings_seasons": return <SeasonsTab seasons={data.seasons} onRefresh={fetchAll} />;
      case "settings_venues": return <VenuesTab venues={data.venues} onRefresh={fetchAll} />;
      // Legacy tabs (accessible from dashboard stats)
      case "players": return <PlayersTab players={data.players} academyGroups={data.academyGroups} onRefresh={fetchAll} />;
      case "staff": return <StaffTab staff={data.staff} onRefresh={fetchAll} />;
      case "fixtures": return <FixturesTab fixtures={data.fixtures} onRefresh={fetchAll} />;
      case "club": return <ClubProfileTab club={data.club} onRefresh={fetchAll} />;
      case "venues": return <VenuesTab venues={data.venues} onRefresh={fetchAll} />;
      case "seasons": return <SeasonsTab seasons={data.seasons} onRefresh={fetchAll} />;
      default: return <DashboardTab stats={data.stats} onTabChange={setActiveTab} />;
    }
  };

  const liveCount = data.fixtures.filter(f => f.status === 'Live').length;

  // Check if a tab is active within a group
  const isTabInGroup = (groupItems) => groupItems.some(sub => activeTab === sub.id);

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="admin-page">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#121212] border-b border-[#262626] flex items-center px-4">
        <div className="flex items-center gap-3">
          <img src={CLUB_LOGO} alt="" className="w-8 h-8" />
          <div>
            <span className="font-['Bebas_Neue'] text-lg text-white tracking-wide">LEFTERIA FC</span>
            <span className="text-[11px] text-[#F5A623] ml-2 tracking-widest font-medium">CMS</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-zinc-400 hidden sm:block">{user?.username}</span>
          <button onClick={onLogout} className="admin-icon-btn text-red-500/70 hover:text-red-400" data-testid="admin-logout"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar - Grouped */}
        <aside className="w-56 fixed left-0 top-14 bottom-0 bg-[#121212] border-r border-[#262626] hidden lg:flex flex-col overflow-y-auto">
          <nav className="py-2 flex-1">
            {sidebarConfig.map((item, idx) => {
              if (item.type === "divider") return <div key={idx} className="h-px bg-[#262626] my-3 mx-3" />;

              if (item.type === "item") return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                    activeTab === item.id
                      ? 'text-[#F5A623] bg-[#F5A623]/10 border-r-2 border-[#F5A623]'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid={`admin-tab-${item.id}`}
                >
                  <item.icon size={17} />
                  <span className="font-medium">{item.label}</span>
                  {item.id === "livescore" && liveCount > 0 && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                  {item.id === "messages" && data.messages.length > 0 && (
                    <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{data.messages.length}</span>
                  )}
                </button>
              );

              if (item.type === "group") {
                const isExpanded = expandedGroups.includes(item.id);
                const hasActiveChild = isTabInGroup(item.items);
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleGroup(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                        hasActiveChild ? 'text-[#F5A623]' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      data-testid={`admin-group-${item.id}`}
                    >
                      <item.icon size={15} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                    </button>
                    {isExpanded && (
                      <div className="pb-1">
                        {item.items.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setActiveTab(sub.id)}
                            className={`w-full flex items-center gap-2.5 pl-10 pr-3 py-2.5 text-sm transition-all ${
                              activeTab === sub.id
                                ? 'text-[#F5A623] bg-[#F5A623]/10 border-r-2 border-[#F5A623]'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            data-testid={`admin-tab-${sub.id}`}
                          >
                            <sub.icon size={15} />
                            <span>{sub.label}</span>
                            {sub.id === "registrations" && data.stats.pending_registrations > 0 && (
                              <span className="ml-auto text-[10px] bg-[#F5A623]/20 text-[#F5A623] px-1.5 py-0.5 rounded-full font-semibold">{data.stats.pending_registrations}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </nav>
        </aside>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-[#121212] border-b border-[#262626] z-40 overflow-x-auto">
          <div className="flex p-2 gap-1">
            {mobileTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs whitespace-nowrap rounded flex items-center gap-1.5 font-medium ${
                  activeTab === tab.id ? 'bg-[#F5A623]/15 text-[#F5A623]' : 'text-zinc-400 hover:text-zinc-200'
                }`}>
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 p-6 pt-18 lg:pt-6 min-h-[calc(100vh-56px)]">
          <div>
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
