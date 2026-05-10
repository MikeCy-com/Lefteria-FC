import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users, Calendar, Newspaper, Trophy, GraduationCap, Mail,
  LogOut, Plus, Edit2, Trash2, X, Save, BarChart3, Building2,
  MapPin, Archive, UserCog, Zap, RefreshCw, Activity, AlertCircle,
  Check, Clock, ChevronRight, ChevronDown, Settings, Image, ArrowLeftRight,
  Package, ShoppingCart, Ticket, Shield, ClipboardList, Eye, MessageSquare, Dumbbell, Target, Star,
  Euro, Video, Landmark, Upload, Handshake
} from "lucide-react";
import { getSoundForEvent, playMatchWhistle, playWhistleSound } from "../utils/sounds";
import ImageUpload from "../components/ImageUpload";
import InlineAttendance from "./admin/InlineAttendance";
import AdminCalendarTab from "./admin/CalendarTab";
import AdminAttendanceTab from "./admin/AttendanceTab";
import AdminWallTab from "./admin/WallTab";
import TrainingSessionsPanel from "./admin/TrainingSessionsPanel";
import PlayerDevelopmentPanel from "./admin/PlayerDevelopmentPanel";
import PlayerEvaluationPanel from "./admin/PlayerEvaluationPanel";
import FinancialDashboard from "./admin/FinancialDashboard";
import SponsorsTab from "./admin/SponsorsTab";
import VideoAnalyticsPanel from "./admin/VideoAnalyticsPanel";
import ResourceManagement from "./admin/ResourceManagement";
import SectionDashboard from "./admin/SectionDashboard";
import { OpponentsTab as ScopedOpponentsTab, VenuesTab as ScopedVenuesTab } from "./admin/ScopedManagement";
import TeamsTab from "./admin/TeamsTab";
import EnhancedAcademyTab from "./admin/EnhancedAcademyTab";
import RegistrationsTab from "./admin/RegistrationsTab";
import { AdminProductsTab, AdminTicketsTab, AdminOrdersTab } from "./admin/ShopTabs";

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
        <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">{stripGreekAccents(title)}</h2>
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

const stripGreekAccents = (text) => {
  if (typeof text !== 'string') return text;
  const map = {'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','Ά':'Α','Έ':'Ε','Ή':'Η','Ί':'Ι','Ό':'Ο','Ύ':'Υ','Ώ':'Ω','ΐ':'ι','ΰ':'υ'};
  return text.replace(/[άέήίόύώΆΈΉΊΌΎΏΐΰ]/g, c => map[c] || c);
};

const TabHeader = ({ title, count, children }) => (
  <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
    <div>
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">{stripGreekAccents(title)}</h2>
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

// ==================== PLAYER ATTENDANCE STATS ====================
const PlayerAttendanceStats = ({ playerId }) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!playerId) return;
    axios.get(`${API}/admin/attendance/stats?player_id=${playerId}`, { headers: getAuthHeaders() })
      .then(res => setStats(res.data))
      .catch(() => {});
  }, [playerId]);

  const hasOld = stats?.player_stats?.length > 0;
  const hasNew = stats?.attendance_stats?.length > 0;
  if (!hasOld && !hasNew) return null;

  const ps = hasOld ? stats.player_stats[0] : null;
  const as_ = hasNew ? stats.attendance_stats[0] : null;

  return (
    <div className="mt-6 bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="player-attendance-stats">
      <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Παρουσιες</h3>

      {/* Mobile Attendance (present/absent) */}
      {as_ && (
        <div className="mb-5">
          <p className="text-xs text-zinc-400 mb-3 font-medium uppercase tracking-wider">Καταγραφη Παρουσιων</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-3 text-center">
              <p className="text-2xl font-['Bebas_Neue'] text-emerald-400">{as_.present || 0}</p>
              <p className="text-[10px] text-zinc-500">Παρων</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-3 text-center">
              <p className="text-2xl font-['Bebas_Neue'] text-red-400">{as_.absent || 0}</p>
              <p className="text-[10px] text-zinc-500">Απων</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-3 text-center">
              <p className="text-2xl font-['Bebas_Neue'] text-[#F5A623]">{as_.attendance_pct || 0}%</p>
              <p className="text-[10px] text-zinc-500">Ποσοστο</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all" style={{ width: `${as_.attendance_pct || 0}%` }} />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5">Συνολο: {as_.total || 0} (προπονησεις + αγωνες + εκδηλωσεις)</p>
        </div>
      )}

      {/* RSVP Availability (going/not_going) */}
      {ps && (
        <div>
          {as_ && <p className="text-xs text-zinc-400 mb-3 font-medium uppercase tracking-wider">Διαθεσιμοτητα (RSVP)</p>}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-2xl font-['Bebas_Neue'] text-emerald-400">{ps.going || 0}</p>
              <p className="text-[10px] text-zinc-500">Παω</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-['Bebas_Neue'] text-red-400">{ps.not_going || 0}</p>
              <p className="text-[10px] text-zinc-500">Δεν παω</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-['Bebas_Neue'] text-zinc-400">{ps.no_response || 0}</p>
              <p className="text-[10px] text-zinc-500">Χ. Απαντ.</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-['Bebas_Neue'] text-[#F5A623]">{ps.attendance_rate || 0}%</p>
              <p className="text-[10px] text-zinc-500">Ποσοστο</p>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${ps.attendance_rate || 0}%` }} />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Συνολο: {ps.total || 0} εκδηλωσεις</p>
        </div>
      )}
    </div>
  );
};

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
    parent_email: player.parent_email || "", phone: player.phone || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const age = calcAge(form.date_of_birth);
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
                  <button onClick={() => { setForm({ name: player.name || "", number: player.number || "", position: player.position || "Midfielder", nationality: player.nationality || "Cyprus", age: player.age || "", team_type: player.team_type || "First Team", academy_group_id: player.academy_group_id || "", image_url: player.image_url || "", bio: player.bio || "", height: player.height || "", weight: player.weight || "", preferred_foot: player.preferred_foot || "Right", date_of_birth: player.date_of_birth || "", joined_date: player.joined_date || "", contract_until: player.contract_until || "", parent_name: player.parent_name || "", parent_phone: player.parent_phone || "", parent_email: player.parent_email || "", phone: player.phone || "" }); setEditing(false); }} className="admin-btn-ghost" data-testid="cancel-edit-btn">Ακύρωση</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!editing ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="player-personal-info">
            <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Προσωπικα Στοιχεια</h3>
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

          {isAcademy && (player.parent_name || player.parent_phone || player.parent_email) && (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="player-parent-info">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Γονεας / Κηδεμονας</h3>
              <InfoRow label="Ονοματεπώνυμο" value={player.parent_name} />
              <InfoRow label="Τηλέφωνο" value={player.parent_phone} />
              <InfoRow label="Email" value={player.parent_email} />
            </div>
          )}

          {player.bio && (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 lg:col-span-2 xl:col-span-3" data-testid="player-bio-section">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Βιογραφικο</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{player.bio}</p>
            </div>
          )}
        </div>

        {/* Development & Evaluation - below info cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-6">
            <PlayerDevelopmentPanel playerId={player.id} />
          </div>
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-6">
            <PlayerEvaluationPanel playerId={player.id} />
          </div>
        </div>

        {/* Attendance Stats */}
        <PlayerAttendanceStats playerId={player.id} />
        </>
      ) : (
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 lg:p-8" data-testid="player-edit-form">
          <h3 className="font-['Bebas_Neue'] text-xl text-white mb-6">Επεξεργασια Στοιχειων</h3>
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
              <Field label="Ημ. Γέννησης">
                <AdminInput type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                {form.date_of_birth && <span className="text-xs text-[#10B981] mt-1 block">Ηλικία: {calcAge(form.date_of_birth)} ετών</span>}
              </Field>
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
            <div className="border-t border-[#262626] pt-5">
              <h4 className="text-white text-sm font-semibold mb-4">Mobile App</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Κινητό Παίκτη (για Mobile App)"><AdminInput value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+357 99 xxxxxx" data-testid="player-phone-input" /></Field>
              </div>
            </div>
            <ImageUpload currentUrl={form.image_url} onImageChange={url => setForm({...form, image_url: url})} playerId={player.id} />
            <Field label="Βιογραφικό"><AdminTextarea rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></Field>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MATCH STATS MODAL ====================
const MatchStatsModal = ({ fixture, players = [], onClose, onSaved }) => {
  const [homeScore, setHomeScore] = useState(fixture.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(fixture.away_score ?? 0);
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Load existing stats if any
        const res = await axios.get(`${API}/admin/fixtures/${fixture.id}/player-stats`, { headers: getAuthHeaders() });
        const saved = res.data?.performances || [];
        // Build performances list from players, merging any saved data
        const perfs = players.map(p => {
          const existing = saved.find(s => s.player_id === p.id);
          return existing ? { ...existing, player_name: p.name } : {
            player_id: p.id, player_name: p.name,
            minutes_played: 0, goals: 0, assists: 0,
            yellow_card: false, red_card: false, appeared: false,
          };
        });
        // Mark appeared for existing entries
        perfs.forEach(p => { if (saved.find(s => s.player_id === p.player_id)) p.appeared = true; });
        setPerformances(perfs);
      } catch (e) {
        // No saved stats - init empty
        setPerformances(players.map(p => ({
          player_id: p.id, player_name: p.name,
          minutes_played: 0, goals: 0, assists: 0,
          yellow_card: false, red_card: false, appeared: false,
        })));
      }
      setLoading(false);
    };
    init();
  }, [fixture.id, players]);

  const updatePerf = (idx, field, value) => {
    setPerformances(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1) Update fixture score/status
      await axios.put(`${API}/admin/fixtures/${fixture.id}`, {
        ...fixture, home_score: homeScore, away_score: awayScore, status: "Completed",
      }, { headers: getAuthHeaders() });

      // 2) Save player stats (only appeared players)
      const appeared = performances.filter(p => p.appeared);
      if (appeared.length > 0) {
        await axios.post(`${API}/admin/fixtures/${fixture.id}/player-stats`, {
          performances: appeared.map(p => ({
            player_id: p.player_id, player_name: p.player_name,
            minutes_played: parseInt(p.minutes_played) || 0,
            goals: parseInt(p.goals) || 0, assists: parseInt(p.assists) || 0,
            yellow_card: !!p.yellow_card, red_card: !!p.red_card,
          })),
        }, { headers: getAuthHeaders() });
      }

      onSaved();
      onClose();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα αποθήκευσης"); }
    finally { setSaving(false); }
  };

  const appearedCount = performances.filter(p => p.appeared).length;
  const totalGoals = performances.reduce((s, p) => s + (p.appeared ? (parseInt(p.goals) || 0) : 0), 0);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-10 overflow-y-auto" data-testid="match-stats-modal">
      <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-4xl mx-4 mb-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262626]">
          <div>
            <h2 className="font-['Bebas_Neue'] text-2xl text-white">Στατιστικα Αγωνα</h2>
            <span className="text-xs text-zinc-500">{new Date(fixture.match_date).toLocaleDateString('el-GR')} - {fixture.venue}</span>
          </div>
          <button onClick={onClose} className="admin-icon-btn" data-testid="close-match-stats"><X size={18} /></button>
        </div>

        {/* Score Input */}
        <div className="p-5 border-b border-[#262626]">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <span className="text-sm text-zinc-400 block mb-1">{fixture.home_team}</span>
              <input
                type="number" min="0" value={homeScore}
                onChange={e => setHomeScore(parseInt(e.target.value) || 0)}
                className="w-20 h-14 text-center font-['Bebas_Neue'] text-3xl bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-[#F5A623] outline-none"
                data-testid="home-score-input"
              />
            </div>
            <span className="font-['Bebas_Neue'] text-3xl text-zinc-600 mt-5">-</span>
            <div className="text-center">
              <span className="text-sm text-zinc-400 block mb-1">{fixture.away_team}</span>
              <input
                type="number" min="0" value={awayScore}
                onChange={e => setAwayScore(parseInt(e.target.value) || 0)}
                className="w-20 h-14 text-center font-['Bebas_Neue'] text-3xl bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-[#F5A623] outline-none"
                data-testid="away-score-input"
              />
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium text-sm">Παίκτες ({appearedCount} συμμετοχές, {totalGoals} γκολ)</h3>
            <button onClick={() => setPerformances(prev => prev.map(p => ({...p, appeared: true, minutes_played: p.appeared ? p.minutes_played : 90})))}
              className="text-xs text-[#F5A623] hover:underline" data-testid="select-all-players">Όλοι συμμετείχαν</button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-zinc-500"><RefreshCw size={20} className="animate-spin mx-auto" /></div>
          ) : (
            <div className="max-h-[45vh] overflow-y-auto space-y-1">
              {/* Header row */}
              <div className="grid grid-cols-[32px_1fr_60px_60px_60px_36px_36px] gap-2 px-3 py-2 text-[10px] text-zinc-600 uppercase tracking-wider sticky top-0 bg-[#121212]">
                <span></span><span>Παικτης</span><span className="text-center">Λεπτα</span>
                <span className="text-center">Γκολ</span><span className="text-center">Ασιστ</span>
                <span className="text-center">Κ</span><span className="text-center">Α</span>
              </div>
              {performances.map((p, i) => (
                <div key={p.player_id}
                  className={`grid grid-cols-[32px_1fr_60px_60px_60px_36px_36px] gap-2 px-3 py-2 rounded-lg items-center transition-colors ${p.appeared ? 'bg-white/[0.04]' : 'opacity-50'}`}
                  data-testid={`player-stat-row-${p.player_id}`}
                >
                  <input type="checkbox" checked={p.appeared}
                    onChange={e => updatePerf(i, 'appeared', e.target.checked)}
                    className="w-4 h-4 accent-[#F5A623] cursor-pointer" data-testid={`player-appeared-${p.player_id}`} />
                  <span className="text-sm text-white truncate">{p.player_name}</span>
                  <input type="number" min="0" max="120" value={p.minutes_played} disabled={!p.appeared}
                    onChange={e => updatePerf(i, 'minutes_played', e.target.value)}
                    className="w-full h-8 text-center text-sm bg-[#0a0a0a] border border-[#333] rounded text-white disabled:opacity-30 focus:border-[#F5A623] outline-none"
                    data-testid={`player-minutes-${p.player_id}`} />
                  <input type="number" min="0" max="20" value={p.goals} disabled={!p.appeared}
                    onChange={e => updatePerf(i, 'goals', e.target.value)}
                    className="w-full h-8 text-center text-sm bg-[#0a0a0a] border border-[#333] rounded text-white disabled:opacity-30 focus:border-emerald-500 outline-none"
                    data-testid={`player-goals-${p.player_id}`} />
                  <input type="number" min="0" max="20" value={p.assists} disabled={!p.appeared}
                    onChange={e => updatePerf(i, 'assists', e.target.value)}
                    className="w-full h-8 text-center text-sm bg-[#0a0a0a] border border-[#333] rounded text-white disabled:opacity-30 focus:border-blue-500 outline-none"
                    data-testid={`player-assists-${p.player_id}`} />
                  <input type="checkbox" checked={p.yellow_card} disabled={!p.appeared}
                    onChange={e => updatePerf(i, 'yellow_card', e.target.checked)}
                    className="w-4 h-4 mx-auto accent-yellow-500 cursor-pointer disabled:opacity-30"
                    data-testid={`player-yellow-${p.player_id}`} />
                  <input type="checkbox" checked={p.red_card} disabled={!p.appeared}
                    onChange={e => updatePerf(i, 'red_card', e.target.checked)}
                    className="w-4 h-4 mx-auto accent-red-500 cursor-pointer disabled:opacity-30"
                    data-testid={`player-red-${p.player_id}`} />
                </div>
              ))}
              {performances.length === 0 && (
                <p className="text-center text-zinc-500 py-6 text-sm">Δεν υπάρχουν παίκτες σε αυτή την ομάδα</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
          <button onClick={onClose} className="admin-btn-ghost" data-testid="cancel-match-stats">Ακύρωση</button>
          <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-match-stats">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
          </button>
        </div>
      </div>
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
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide mb-6">Πινακας Ελεγχου</h2>
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
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider">Συμβαντα Αγωνα ({events.length})</h3>
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
              <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Σκορερ</h4>
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
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider">Στατιστικα Αγωνα</h3>
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
            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Γρηγορες Ενεργειες</h4>
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
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Ολοκληρωμενοι</h3>
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
  const calcAge = (dob) => { if (!dob) return ""; try { return Math.floor((new Date() - new Date(dob)) / 31557600000); } catch { return ""; } };
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
      const payload = { ...form, number: parseInt(form.number) || 0, age: parseInt(calcAge(form.date_of_birth)) || parseInt(form.age) || 0 };
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
            <Field label="Ημ. Γέννησης *">
              <AdminInput type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} data-testid="player-dob-input" />
              {form.date_of_birth && <span className="text-xs text-[#10B981] mt-1 block">Ηλικία: {calcAge(form.date_of_birth)} ετών</span>}
            </Field>
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
              <span className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">{stripGreekAccents(g.name)}</span>
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
            <Field label="Όνομα *"><AdminInput placeholder="U12" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="group-name-input" /></Field>
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
  const emptyStaff = { name: "", role: "Head Coach", nationality: "Cyprus", team_type: "First Team", image_url: "", bio: "", phone: "" };
  const [form, setForm] = useState(emptyStaff);
  const roles = { "Head Coach": "Προπονητής", "Assistant Coach": "Βοηθός", "Goalkeeper Coach": "Προπ. Τερμ.", "Fitness Coach": "Γυμναστής", "Physiotherapist": "Φυσιοθ.", "Team Manager": "Διευθυντής", "Youth Coach": "Προπ. Νέων", "Scout": "Ανιχνευτής" };

  const openCreate = () => { setForm(emptyStaff); setEditStaff(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ name: s.name, role: s.role, nationality: s.nationality || "Cyprus", team_type: s.team_type || "First Team", image_url: s.image_url || "", bio: s.bio || "", phone: s.phone || "" }); setEditStaff(s); setShowForm(true); };

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
          <thead><tr><th></th><th>Όνομα</th><th>Ρόλος</th><th>Τηλέφωνο</th><th>Ομάδα</th><th></th></tr></thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td>{s.image_url ? <img src={s.image_url} alt="" className="w-8 h-8 object-cover rounded-full" /> : <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center"><UserCog size={12} className="text-zinc-700" /></div>}</td>
                <td className="font-medium text-white">{s.name}</td>
                <td className="text-zinc-400">{roles[s.role] || s.role}</td>
                <td className="text-zinc-500 text-xs">{s.phone || "—"}</td>
                <td><span className="admin-badge admin-badge-default">{s.team_type === 'First Team' ? "Α'" : 'Ακαδ.'}</span></td>
                <td><div className="flex gap-1"><button onClick={() => openEdit(s)} className="admin-icon-btn"><Edit2 size={13} /></button><button onClick={() => handleDelete(s.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button></div></td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={6}><EmptyState icon={UserCog} text="Δεν υπάρχουν μέλη" /></td></tr>}
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
const FixturesTab = ({ fixtures, opponents = [], facilities = [], players = [], onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editFixture, setEditFixture] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [oppForm, setOppForm] = useState({ name: "", logo_url: "", venue: "", location: "", location_url: "" });
  const [oppSaving, setOppSaving] = useState(false);
  const [expandedFixtureId, setExpandedFixtureId] = useState(null);
  const emptyFixture = { home_team: "LEFTERIA FC", away_team: "", away_team_logo: "", home_score: "", away_score: "", match_date: "", match_time: "", arrival_time: "", venue: "", venue_id: "", location: "", location_url: "", competition: "ΠΑΑΟΚ Α' Όμιλος", season: "2025/26", status: "Scheduled", attendance: "", referee: "", opponent_id: "" };
  const [form, setForm] = useState(emptyFixture);

  const openCreate = () => { setForm(emptyFixture); setEditFixture(null); setShowForm(true); };
  const openEdit = (f) => { setForm({ home_team: f.home_team, away_team: f.away_team, away_team_logo: f.away_team_logo || "", home_score: f.home_score ?? "", away_score: f.away_score ?? "", match_date: f.match_date ? f.match_date.split('T')[0] : "", match_time: f.match_time || "", arrival_time: f.arrival_time || "", venue: f.venue, venue_id: f.venue_id || "", location: f.location || "", location_url: f.location_url || "", competition: f.competition, season: f.season || "2025/26", status: f.status, attendance: f.attendance ?? "", referee: f.referee || "", opponent_id: f.opponent_id || "" }); setEditFixture(f); setShowForm(true); };

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

  const handleSaveOpponent = async () => {
    if (!oppForm.name) return;
    setOppSaving(true);
    try {
      await axios.post(`${API}/admin/opponents`, oppForm, { headers: getAuthHeaders() });
      setShowOpponentModal(false);
      setOppForm({ name: "", logo_url: "", venue: "", location: "", location_url: "" });
      onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setOppSaving(false); }
  };

  const handleOppLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(`${API}/admin/opponents/upload-logo`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setOppForm({ ...oppForm, logo_url: res.data.url });
    } catch (e) { alert("Σφάλμα ανεβάσματος"); }
  };

  const selectOpponent = (oppId) => {
    const opp = opponents.find(o => o.id === oppId);
    if (opp) {
      setForm({ ...form, away_team: opp.name, away_team_logo: opp.logo_url, opponent_id: opp.id, location_url: opp.location_url || form.location_url });
    }
  };

  const selectVenue = (facId) => {
    const fac = facilities.find(f => f.id === facId);
    if (fac) {
      setForm({ ...form, venue: fac.name, venue_id: fac.id, location_url: fac.location_url || form.location_url });
    }
  };

  return (
    <div data-testid="admin-fixtures-tab">
      <TabHeader title="Αγώνες" count={fixtures.length}>
        <button onClick={() => setShowOpponentModal(true)} className="admin-btn-ghost text-xs" data-testid="manage-opponents-btn"><Plus size={12} /> Αντίπαλος</button>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-fixture-btn"><Plus size={14} /> Νέος Αγώνας</button>
      </TabHeader>
      <div className="space-y-2" data-testid="admin-fixtures-list">
        {fixtures.map(f => {
          const isExpanded = expandedFixtureId === f.id;
          return (
            <div key={f.id} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden" data-testid={`fixture-card-${f.id}`}>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpandedFixtureId(isExpanded ? null : f.id)}>
                <div className={`w-1 h-10 rounded-full ${f.status === 'Completed' ? 'bg-emerald-500' : f.status === 'Live' ? 'bg-red-500' : 'bg-[#F5A623]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.home_team}</span>
                    <span className="font-['Bebas_Neue'] text-zinc-400 text-sm">{f.status === 'Completed' || f.status === 'Live' ? `${f.home_score ?? 0} - ${f.away_score ?? 0}` : 'vs'}</span>
                    <div className="flex items-center gap-1.5">
                      {f.away_team_logo && <img src={f.away_team_logo.startsWith("http") ? f.away_team_logo : `${process.env.REACT_APP_BACKEND_URL}${f.away_team_logo}`} alt="" className="w-4 h-4 rounded-full object-cover" />}
                      <span className={`text-sm font-medium ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.away_team}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ml-1 ${f.status === 'Completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : f.status === 'Live' ? 'border-red-500/30 text-red-400 bg-red-500/10 animate-pulse' : 'border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10'}`}>
                      {f.status === 'Completed' ? 'Ολοκλ.' : f.status === 'Live' ? 'LIVE' : 'Προγρ.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    {f.match_date && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(f.match_date).toLocaleDateString('el-GR')}</span>}
                    {f.match_time && <span>{f.match_time}</span>}
                    {f.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {f.venue}</span>}
                    {f.arrival_time && <span className="flex items-center gap-1"><Clock size={10} /> Άφιξη: {f.arrival_time}</span>}
                    {f.competition && <span className="flex items-center gap-1"><Trophy size={10} /> {f.competition}</span>}
                  </div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(f)} className="admin-icon-btn" data-testid={`edit-fixture-${f.id}`}><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(f.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400" data-testid={`delete-fixture-${f.id}`}><Trash2 size={12} /></button>
                </div>
                {isExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
              </div>
              {isExpanded && (
                <div className="border-t border-[#1e1e1e] p-4 space-y-4">
                  {(f.venue || f.location_url || f.referee) && (
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
                      {f.venue && <span className="flex items-center gap-1"><MapPin size={12} className="text-[#F5A623]" /> {f.venue}</span>}
                      {f.location_url && <a href={f.location_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1"><MapPin size={10} /> Χάρτης</a>}
                      {f.referee && <span className="flex items-center gap-1"><Shield size={12} /> Διαιτητής: {f.referee}</span>}
                    </div>
                  )}
                  <div className="border-t border-[#1e1e1e] pt-3 mt-2">
                    <InlineAttendance eventId={f.id} players={players} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showForm && (
        <FormModal title={editFixture ? "Επεξεργασία Αγώνα" : "Νέος Αγώνας"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Γηπεδούχος *"><AdminInput value={form.home_team} onChange={e => setForm({...form, home_team: e.target.value})} data-testid="fixture-home-input" /></Field>
          <Field label="Αντίπαλος *">
            <AdminSelect value={form.opponent_id} onChange={e => selectOpponent(e.target.value)} data-testid="fixture-opponent-select">
              <option value="">— Επιλέξτε ή πληκτρολογήστε —</option>
              {opponents.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </AdminSelect>
            <AdminInput value={form.away_team} onChange={e => setForm({...form, away_team: e.target.value})} placeholder="Ή πληκτρολογήστε όνομα" className="mt-1" data-testid="fixture-away-input" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ημερομηνία *"><AdminInput type="date" value={form.match_date} onChange={e => setForm({...form, match_date: e.target.value})} data-testid="fixture-date-input" /></Field>
            <Field label="Ώρα Έναρξης"><AdminInput type="time" value={form.match_time} onChange={e => setForm({...form, match_time: e.target.value})} /></Field>
            <Field label="Ώρα Άφιξης"><AdminInput type="time" value={form.arrival_time} onChange={e => setForm({...form, arrival_time: e.target.value})} data-testid="fixture-arrival-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Σκορ Γηπ."><AdminInput type="number" value={form.home_score} onChange={e => setForm({...form, home_score: e.target.value})} /></Field>
            <Field label="Σκορ Φιλ."><AdminInput type="number" value={form.away_score} onChange={e => setForm({...form, away_score: e.target.value})} /></Field>
          </div>
          <Field label="Γήπεδο">
            <AdminSelect value={form.venue_id} onChange={e => selectVenue(e.target.value)} data-testid="fixture-venue-select">
              <option value="">— Επιλέξτε ή πληκτρολογήστε —</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </AdminSelect>
            <AdminInput value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="Ή πληκτρολογήστε γήπεδο" className="mt-1" />
          </Field>
          <Field label="Google Maps Link"><AdminInput value={form.location_url} onChange={e => setForm({...form, location_url: e.target.value})} placeholder="https://maps.google.com/..." data-testid="fixture-location-url" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Διοργάνωση"><AdminInput value={form.competition} onChange={e => setForm({...form, competition: e.target.value})} /></Field>
            <Field label="Κατάσταση">
              <AdminSelect value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Scheduled">Προγραμματισμένος</option><option value="Live">Live</option><option value="Completed">Ολοκληρωμένος</option><option value="Postponed">Αναβλήθηκε</option>
              </AdminSelect>
            </Field>
          </div>
        </FormModal>
      )}
      {showOpponentModal && (
        <FormModal title="Νέος Αντίπαλος" onClose={() => setShowOpponentModal(false)} onSave={handleSaveOpponent} saving={oppSaving}>
          <Field label="Όνομα *"><AdminInput value={oppForm.name} onChange={e => setOppForm({...oppForm, name: e.target.value})} data-testid="opp-name" /></Field>
          <Field label="Logo">
            <div className="flex items-center gap-3">
              {oppForm.logo_url && <img src={oppForm.logo_url.startsWith("http") ? oppForm.logo_url : `${process.env.REACT_APP_BACKEND_URL}${oppForm.logo_url}`} alt="" className="w-10 h-10 rounded-full object-cover" />}
              <label className="admin-btn-ghost text-xs cursor-pointer">
                Ανέβασμα Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleOppLogoUpload} />
              </label>
            </div>
          </Field>
          <Field label="Γήπεδο"><AdminInput value={oppForm.venue} onChange={e => setOppForm({...oppForm, venue: e.target.value})} /></Field>
          <Field label="Google Maps"><AdminInput value={oppForm.location_url} onChange={e => setOppForm({...oppForm, location_url: e.target.value})} placeholder="https://maps.google.com/..." /></Field>
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
          <Field label="Περιεχόμενο *">
            <AdminTextarea rows={10} value={form.content} onChange={e => setForm({...form, content: e.target.value})} data-testid="news-content-input" placeholder={"# Επικεφαλιδα\n\nΓραψτε το κειμενο σας εδω.\n\n## Υποτιτλος\n\nΕνας ακομα παραγραφος.\n\n![Λεζαντα εικονας](https://example.com/photo.jpg)\n\n[Δειτε περισσοτερα](https://lefteriafc.cy)\n\n- Σημειο 1\n- Σημειο 2\n- Σημειο 3"} />
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Υποστηρίζεται <span className="text-[#F5A623]">Markdown</span>: <code className="text-zinc-300">**έντονα**</code>, <code className="text-zinc-300">*πλάγια*</code>, <code className="text-zinc-300">## τίτλοι</code>, <code className="text-zinc-300">[κείμενο](url)</code> για συνδέσμους, <code className="text-zinc-300">![alt](url)</code> για εικόνες, <code className="text-zinc-300">- λίστες</code>.
            </p>
          </Field>
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

      {/* First Team Social Media */}
      <div className="admin-card p-6 mt-4 space-y-4" data-testid="first-team-social-section">
        <div className="border-b border-[#262626] pb-3 mb-2">
          <h3 className="font-['Bebas_Neue'] text-xl text-[#F5A623] tracking-wide">Social Media — Πρωτη Ομαδα</h3>
          <p className="text-xs text-zinc-500 mt-1">Συνδέσεις που εμφανίζονται στο footer για την Πρώτη Ομάδα.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Facebook"><AdminInput placeholder="https://facebook.com/..." value={form.first_team_facebook || ""} onChange={e => setForm({...form, first_team_facebook: e.target.value})} data-testid="first-team-facebook" /></Field>
          <Field label="Instagram"><AdminInput placeholder="https://instagram.com/..." value={form.first_team_instagram || ""} onChange={e => setForm({...form, first_team_instagram: e.target.value})} data-testid="first-team-instagram" /></Field>
          <Field label="Twitter / X"><AdminInput placeholder="https://twitter.com/..." value={form.first_team_twitter || ""} onChange={e => setForm({...form, first_team_twitter: e.target.value})} data-testid="first-team-twitter" /></Field>
          <Field label="YouTube"><AdminInput placeholder="https://youtube.com/..." value={form.first_team_youtube || ""} onChange={e => setForm({...form, first_team_youtube: e.target.value})} data-testid="first-team-youtube" /></Field>
          <Field label="TikTok"><AdminInput placeholder="https://tiktok.com/@..." value={form.first_team_tiktok || ""} onChange={e => setForm({...form, first_team_tiktok: e.target.value})} data-testid="first-team-tiktok" /></Field>
        </div>
      </div>

      {/* Academy Social Media */}
      <div className="admin-card p-6 mt-4 space-y-4" data-testid="academy-social-section">
        <div className="border-b border-[#262626] pb-3 mb-2">
          <h3 className="font-['Bebas_Neue'] text-xl text-[#10B981] tracking-wide">Social Media — Ακαδημια</h3>
          <p className="text-xs text-zinc-500 mt-1">Ξεχωριστές συνδέσεις για την Ακαδημία (αν διαφέρουν από την Α' ομάδα).</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Facebook"><AdminInput placeholder="https://facebook.com/..." value={form.academy_facebook || ""} onChange={e => setForm({...form, academy_facebook: e.target.value})} data-testid="academy-facebook" /></Field>
          <Field label="Instagram"><AdminInput placeholder="https://instagram.com/..." value={form.academy_instagram || ""} onChange={e => setForm({...form, academy_instagram: e.target.value})} data-testid="academy-instagram" /></Field>
          <Field label="Twitter / X"><AdminInput placeholder="https://twitter.com/..." value={form.academy_twitter || ""} onChange={e => setForm({...form, academy_twitter: e.target.value})} data-testid="academy-twitter" /></Field>
          <Field label="YouTube"><AdminInput placeholder="https://youtube.com/..." value={form.academy_youtube || ""} onChange={e => setForm({...form, academy_youtube: e.target.value})} data-testid="academy-youtube" /></Field>
          <Field label="TikTok"><AdminInput placeholder="https://tiktok.com/@..." value={form.academy_tiktok || ""} onChange={e => setForm({...form, academy_tiktok: e.target.value})} data-testid="academy-tiktok" /></Field>
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

// ==================== MAIN ADMIN PANEL ====================

const AdminPanel = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState(["club_section", "academy_section", "shop_section", "settings_section"]);
  const [data, setData] = useState({
    stats: {}, players: [], fixtures: [], news: [], standings: [],
    academyGroups: [], staff: [], venues: [], seasons: [], messages: [], club: {},
    teams: [], opponents: [], facilities: []
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]);
  };

  const fetchAll = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [stats, players, fixtures, news, standings, groups, staffRes, venues, seasons, messages, club, teamsRes, opponentsRes, facilitiesRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`, { headers }),
        axios.get(`${API}/players?is_active=true`),
        axios.get(`${API}/fixtures?limit=500`),
        axios.get(`${API}/news`),
        axios.get(`${API}/standings`),
        axios.get(`${API}/academy-groups`),
        axios.get(`${API}/staff`),
        axios.get(`${API}/venues`),
        axios.get(`${API}/seasons`),
        axios.get(`${API}/admin/contact`, { headers }),
        axios.get(`${API}/club`),
        axios.get(`${API}/teams`),
        axios.get(`${API}/admin/opponents`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/facilities`, { headers }).catch(() => ({ data: [] })),
      ]);
      setData({
        stats: stats.data, players: players.data, fixtures: fixtures.data,
        news: news.data, standings: standings.data, academyGroups: groups.data,
        staff: staffRes.data, venues: venues.data, seasons: seasons.data,
        messages: messages.data, club: club.data, teams: teamsRes.data,
        opponents: opponentsRes.data, facilities: facilitiesRes.data
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
    { type: "group", id: "club_section", label: "Συλλόγος", icon: Building2, dashboard: "club_dashboard", items: [
      { id: "teams", label: "Ομάδες", icon: Shield },
      { id: "club_opponents", label: "Αντίπαλοι", icon: Shield },
      { id: "club_venues", label: "Γήπεδα", icon: MapPin },
    ]},
    { type: "group", id: "academy_section", label: "Ακαδημία", icon: GraduationCap, dashboard: "academy_dashboard", items: [
      { id: "academy", label: "Ομάδες", icon: Users },
      { id: "registrations", label: "Εγγραφές", icon: ClipboardList },
      { id: "academy_opponents", label: "Αντίπαλοι", icon: Shield },
      { id: "academy_venues", label: "Γήπεδα", icon: MapPin },
    ]},
    { type: "divider" },
    { type: "item", id: "news", label: "Νέα", icon: Newspaper },
    { type: "item", id: "wall", label: "Ανακοινώσεις", icon: MessageSquare },
    { type: "item", id: "messages", label: "Μηνύματα", icon: Mail },
    { type: "item", id: "sponsors", label: "Χορηγοί", icon: Handshake },
    { type: "divider" },
    { type: "group", id: "management_section", label: "Διαχείριση", icon: Landmark, items: [
      { id: "financial", label: "Οικονομικά", icon: Euro },
      { id: "resources", label: "Εγκαταστάσεις", icon: MapPin },
    ]},
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
      case "club_dashboard": return <SectionDashboard scope="club" teams={data.teams} academyGroups={data.academyGroups} opponents={data.opponents} facilities={data.facilities} />;
      case "academy_dashboard": return <SectionDashboard scope="academy" teams={data.teams} academyGroups={data.academyGroups} opponents={data.opponents} facilities={data.facilities} />;
      case "club_opponents": return <ScopedOpponentsTab opponents={data.opponents} teamType="First Team" onRefresh={fetchAll} />;
      case "club_venues": return <ScopedVenuesTab facilities={data.facilities} teamType="First Team" onRefresh={fetchAll} />;
      case "academy_opponents": return <ScopedOpponentsTab opponents={data.opponents} teamType="Academy" onRefresh={fetchAll} />;
      case "academy_venues": return <ScopedVenuesTab facilities={data.facilities} teamType="Academy" onRefresh={fetchAll} />;
      case "teams": return <TeamsTab teams={data.teams} players={data.players} fixtures={data.fixtures} staff={data.staff} standings={data.standings} opponents={data.opponents} facilities={data.facilities} onRefresh={fetchAll} onTabChange={setActiveTab} StandingsTab={StandingsTab} AdminPlayerProfile={AdminPlayerProfile} MatchStatsModal={MatchStatsModal} />;
      case "standings": return <StandingsTab standings={data.standings} onRefresh={fetchAll} />;
      case "academy": return <EnhancedAcademyTab groups={data.academyGroups} players={data.players} opponents={data.opponents} facilities={data.facilities} onRefresh={fetchAll} AdminPlayerProfile={AdminPlayerProfile} MatchStatsModal={MatchStatsModal} />;
      case "registrations": return <RegistrationsTab academyGroups={data.academyGroups} onRefresh={fetchAll} />;
      case "news": return <NewsTab news={data.news} onRefresh={fetchAll} />;
      case "gallery": return <GalleryTab onRefresh={fetchAll} />;
      case "messages": return <MessagesTab messages={data.messages} onRefresh={fetchAll} />;
      case "calendar": return <AdminCalendarTab teams={data.teams} academyGroups={data.academyGroups} />;
      case "attendance": return <AdminAttendanceTab teams={data.teams} academyGroups={data.academyGroups} players={data.players} />;
      case "wall": return <AdminWallTab teams={data.teams} academyGroups={data.academyGroups} />;
      case "financial": return <FinancialDashboard teams={data.teams} academyGroups={data.academyGroups} players={data.players} />;
      case "resources": return <ResourceManagement teams={data.teams} academyGroups={data.academyGroups} />;
      case "shop_products": return <AdminProductsTab />;
      case "shop_tickets": return <AdminTicketsTab />;
      case "shop_orders": return <AdminOrdersTab />;
      case "settings_club": return <ClubProfileTab club={data.club} onRefresh={fetchAll} />;
      case "settings_seasons": return <SeasonsTab seasons={data.seasons} onRefresh={fetchAll} />;
      case "settings_venues": return <VenuesTab venues={data.venues} onRefresh={fetchAll} />;
      // Legacy tabs (accessible from dashboard stats)
      case "players": return <PlayersTab players={data.players} academyGroups={data.academyGroups} onRefresh={fetchAll} />;
      case "staff": return <StaffTab staff={data.staff} onRefresh={fetchAll} />;
      case "fixtures": return <FixturesTab fixtures={data.fixtures} opponents={data.opponents} facilities={data.facilities} players={data.players} onRefresh={fetchAll} />;
      case "club": return <ClubProfileTab club={data.club} onRefresh={fetchAll} />;
      case "venues": return <VenuesTab venues={data.venues} onRefresh={fetchAll} />;
      case "seasons": return <SeasonsTab seasons={data.seasons} onRefresh={fetchAll} />;
      case "sponsors": return <SponsorsTab />;
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
                const hasActiveChild = isTabInGroup(item.items) || (item.dashboard && activeTab === item.dashboard);
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (item.dashboard) {
                          setActiveTab(item.dashboard);
                          if (!isExpanded) toggleGroup(item.id);
                        } else {
                          toggleGroup(item.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                        hasActiveChild || (item.dashboard && activeTab === item.dashboard) ? 'text-[#F5A623]' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      data-testid={`admin-group-${item.id}`}
                    >
                      <item.icon size={15} />
                      <span className="flex-1 text-left">{stripGreekAccents(item.label)}</span>
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
