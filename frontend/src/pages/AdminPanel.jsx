import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Users, Calendar, Newspaper, Trophy, GraduationCap, Mail,
  LogOut, Plus, Edit2, Trash2, X, Save, BarChart3, Building2,
  MapPin, Archive, UserCog, ChevronDown, ChevronUp, Eye
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== FORM MODAL ====================
const FormModal = ({ title, onClose, onSave, children, saving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" data-testid="form-modal">
    <div className="bg-[#111111] border border-[#262626] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-[#262626] sticky top-0 bg-[#111111] z-10">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white">{title}</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="modal-close"><X size={24} /></button>
      </div>
      <div className="p-6 space-y-4">{children}</div>
      <div className="flex gap-3 p-6 border-t border-[#262626] sticky bottom-0 bg-[#111111]">
        <button onClick={onSave} disabled={saving} className="btn-primary flex-1" data-testid="modal-save">
          <Save size={16} /> {saving ? "Αποθήκευση..." : "Αποθήκευση"}
        </button>
        <button onClick={onClose} className="btn-secondary flex-1" data-testid="modal-cancel">Ακύρωση</button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm text-zinc-400 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputClass = "w-full bg-[#1A1A1A] border border-[#333] text-white px-3 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none transition-colors";
const selectClass = inputClass;

// ==================== DASHBOARD TAB ====================
const DashboardTab = ({ stats }) => {
  const cards = [
    { label: "Παίκτες Α' Ομάδας", value: stats.first_team_players, icon: Users, color: "text-blue-400" },
    { label: "Παίκτες Ακαδημίας", value: stats.academy_players, icon: GraduationCap, color: "text-green-400" },
    { label: "Τεχνικό Επιτελείο", value: stats.staff_members, icon: UserCog, color: "text-purple-400" },
    { label: "Αγώνες", value: stats.total_fixtures, icon: Calendar, color: "text-orange-400" },
    { label: "Άρθρα Νέων", value: stats.news_articles, icon: Newspaper, color: "text-cyan-400" },
    { label: "Ομάδες Ακαδημίας", value: stats.academy_groups, icon: GraduationCap, color: "text-yellow-400" },
    { label: "Μηνύματα", value: stats.unread_messages, icon: Mail, color: "text-red-400" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-6">Πίνακας Ελέγχου</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-5" data-testid={`stat-${c.label.replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <c.icon size={22} className={c.color} />
            </div>
            <div className="font-['Bebas_Neue'] text-3xl text-white">{c.value ?? 0}</div>
            <div className="text-xs text-zinc-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== PLAYERS TAB ====================
const PlayersTab = ({ players, academyGroups, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const emptyPlayer = {
    name: "", number: "", position: "Midfielder", nationality: "Cyprus", age: "",
    team_type: "First Team", academy_group_id: "", image_url: "", bio: "",
    height: "", weight: "", preferred_foot: "Right", date_of_birth: "",
    joined_date: "", contract_until: "", instagram: "", twitter: "", facebook: ""
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
      contract_until: p.contract_until || "", instagram: p.instagram || "",
      twitter: p.twitter || "", facebook: p.facebook || ""
    });
    setEditPlayer(p);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, number: parseInt(form.number) || 0, age: parseInt(form.age) || 0 };
      if (editPlayer) {
        await axios.put(`${API}/admin/players/${editPlayer.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/players`, payload, { headers });
      }
      setShowForm(false);
      onRefresh();
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα αποθήκευσης");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή παίκτη;")) return;
    try {
      await axios.delete(`${API}/admin/players/${id}`, { headers: getAuthHeaders() });
      onRefresh();
    } catch (e) { alert("Σφάλμα διαγραφής"); }
  };

  const filtered = filter === "all" ? players :
    filter === "first_team" ? players.filter(p => p.team_type === "First Team") :
    players.filter(p => p.team_type === "Academy");

  return (
    <div data-testid="admin-players-tab">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Παίκτες ({players.length})</h2>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className={selectClass + " w-auto"} data-testid="player-filter">
            <option value="all">Όλοι</option>
            <option value="first_team">Α' Ομάδα</option>
            <option value="academy">Ακαδημία</option>
          </select>
          <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-player-btn"><Plus size={16} /> Νέος Παίκτης</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="standings-table" data-testid="admin-players-table">
          <thead><tr><th>#</th><th>Εικόνα</th><th>Όνομα</th><th>Θέση</th><th>Ηλικία</th><th>Ομάδα</th><th>Ενέργειες</th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.number}</td>
                <td>
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-[#1F1F1F] flex items-center justify-center rounded"><Users size={16} className="text-zinc-600" /></div>
                  )}
                </td>
                <td className="font-semibold">{p.name}</td>
                <td>{p.position}</td>
                <td>{p.age}</td>
                <td>
                  <span className={`badge ${p.team_type === 'Academy' ? 'badge-primary' : 'badge-secondary'}`}>
                    {p.team_type === 'First Team' ? "Α' Ομάδα" : 'Ακαδημία'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-[#F5A623] hover:text-[#d48f1e]" data-testid={`edit-player-${p.id}`}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-400" data-testid={`delete-player-${p.id}`}><Trash2 size={16} /></button>
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
            <Field label="Όνομα *"><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="player-name-input" /></Field>
            <Field label="Αριθμός *"><input type="number" className={inputClass} value={form.number} onChange={e => setForm({...form, number: e.target.value})} data-testid="player-number-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Θέση *">
              <select className={selectClass} value={form.position} onChange={e => setForm({...form, position: e.target.value})} data-testid="player-position-select">
                <option value="Goalkeeper">Τερματοφύλακας</option>
                <option value="Defender">Αμυντικός</option>
                <option value="Midfielder">Μέσος</option>
                <option value="Forward">Επιθετικός</option>
              </select>
            </Field>
            <Field label="Εθνικότητα"><input className={inputClass} value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ηλικία *"><input type="number" className={inputClass} value={form.age} onChange={e => setForm({...form, age: e.target.value})} data-testid="player-age-input" /></Field>
            <Field label="Ύψος"><input className={inputClass} placeholder="π.χ. 1.85m" value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></Field>
            <Field label="Βάρος"><input className={inputClass} placeholder="π.χ. 78kg" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ομάδα">
              <select className={selectClass} value={form.team_type} onChange={e => setForm({...form, team_type: e.target.value})} data-testid="player-team-type-select">
                <option value="First Team">Α' Ομάδα</option>
                <option value="Academy">Ακαδημία</option>
              </select>
            </Field>
            {form.team_type === "Academy" && (
              <Field label="Ομάδα Ακαδημίας">
                <select className={selectClass} value={form.academy_group_id} onChange={e => setForm({...form, academy_group_id: e.target.value})}>
                  <option value="">-- Καμία --</option>
                  {academyGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.age_range})</option>)}
                </select>
              </Field>
            )}
          </div>
          <Field label="Προτιμώμενο πόδι">
            <select className={selectClass} value={form.preferred_foot} onChange={e => setForm({...form, preferred_foot: e.target.value})}>
              <option value="Right">Δεξί</option>
              <option value="Left">Αριστερό</option>
              <option value="Both">Αμφίπλευρο</option>
            </select>
          </Field>
          <Field label="URL Φωτογραφίας"><input className={inputClass} placeholder="https://..." value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} data-testid="player-image-input" /></Field>
          <Field label="Βιογραφικό"><textarea className={inputClass} rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ημ. Γέννησης"><input type="date" className={inputClass} value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></Field>
            <Field label="Ημ. Εγγραφής"><input type="date" className={inputClass} value={form.joined_date} onChange={e => setForm({...form, joined_date: e.target.value})} /></Field>
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
  const openEdit = (g) => {
    setForm({ name: g.name, age_range: g.age_range, coach_name: g.coach_name || "", training_schedule: g.training_schedule, description: g.description, max_players: g.max_players, season: g.season || "2025/26" });
    setEditGroup(g); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, max_players: parseInt(form.max_players) || 25 };
      if (editGroup) {
        await axios.put(`${API}/admin/academy-groups/${editGroup.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/academy-groups`, payload, { headers });
      }
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή ομάδας;")) return;
    try { await axios.delete(`${API}/admin/academy-groups/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-academy-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Ομάδες Ακαδημίας ({groups.length})</h2>
        <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-academy-group-btn"><Plus size={16} /> Νέα Ομάδα</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => (
          <div key={g.id} className="card p-6" data-testid={`academy-group-${g.id}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="font-['Bebas_Neue'] text-3xl text-[#F5A623]">{g.name}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(g)} className="text-[#F5A623] hover:text-[#d48f1e]"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(g.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
            <span className="badge badge-secondary mb-2">{g.age_range}</span>
            <p className="text-white text-sm mb-1">Προπονητής: {g.coach_name}</p>
            <p className="text-zinc-400 text-xs mb-2">{g.training_schedule}</p>
            <p className="text-zinc-500 text-xs">{g.description}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title={editGroup ? "Επεξεργασία Ομάδας" : "Νέα Ομάδα"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Όνομα *"><input className={inputClass} placeholder="π.χ. U18" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="group-name-input" /></Field>
            <Field label="Ηλικιακό εύρος *"><input className={inputClass} placeholder="π.χ. 16-18 ετών" value={form.age_range} onChange={e => setForm({...form, age_range: e.target.value})} /></Field>
          </div>
          <Field label="Όνομα Προπονητή"><input className={inputClass} value={form.coach_name} onChange={e => setForm({...form, coach_name: e.target.value})} /></Field>
          <Field label="Πρόγραμμα Προπόνησης"><input className={inputClass} value={form.training_schedule} onChange={e => setForm({...form, training_schedule: e.target.value})} /></Field>
          <Field label="Περιγραφή"><textarea className={inputClass} rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Μέγιστος αριθμός παικτών"><input type="number" className={inputClass} value={form.max_players} onChange={e => setForm({...form, max_players: e.target.value})} /></Field>
            <Field label="Σεζόν"><input className={inputClass} value={form.season} onChange={e => setForm({...form, season: e.target.value})} /></Field>
          </div>
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
  const emptyStaff = { name: "", role: "Head Coach", nationality: "Cyprus", team_type: "First Team", image_url: "", bio: "", joined_date: "" };
  const [form, setForm] = useState(emptyStaff);

  const roles = ["Head Coach", "Assistant Coach", "Goalkeeper Coach", "Fitness Coach", "Physiotherapist", "Team Manager", "Youth Coach", "Scout"];
  const roleLabels = { "Head Coach": "Προπονητής", "Assistant Coach": "Βοηθός Προπονητή", "Goalkeeper Coach": "Προπονητής Τερματοφυλάκων", "Fitness Coach": "Γυμναστής", "Physiotherapist": "Φυσιοθεραπευτής", "Team Manager": "Διευθυντής Ομάδας", "Youth Coach": "Προπονητής Νέων", "Scout": "Ανιχνευτής" };

  const openCreate = () => { setForm(emptyStaff); setEditStaff(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({ name: s.name, role: s.role, nationality: s.nationality || "Cyprus", team_type: s.team_type || "First Team", image_url: s.image_url || "", bio: s.bio || "", joined_date: s.joined_date || "" });
    setEditStaff(s); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (editStaff) {
        await axios.put(`${API}/admin/staff/${editStaff.id}`, form, { headers });
      } else {
        await axios.post(`${API}/admin/staff`, form, { headers });
      }
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή μέλους;")) return;
    try { await axios.delete(`${API}/admin/staff/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-staff-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Τεχνικό Επιτελείο ({staff.length})</h2>
        <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-staff-btn"><Plus size={16} /> Νέο Μέλος</button>
      </div>

      <div className="overflow-x-auto">
        <table className="standings-table">
          <thead><tr><th>Εικόνα</th><th>Όνομα</th><th>Ρόλος</th><th>Ομάδα</th><th>Ενέργειες</th></tr></thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td>{s.image_url ? <img src={s.image_url} alt="" className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-[#1F1F1F] rounded flex items-center justify-center"><UserCog size={16} className="text-zinc-600" /></div>}</td>
                <td className="font-semibold">{s.name}</td>
                <td>{roleLabels[s.role] || s.role}</td>
                <td><span className="badge badge-secondary">{s.team_type === 'First Team' ? "Α' Ομάδα" : 'Ακαδημία'}</span></td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-[#F5A623]"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={5} className="text-center text-zinc-500 py-8">Δεν υπάρχουν μέλη</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <FormModal title={editStaff ? "Επεξεργασία Μέλους" : "Νέο Μέλος"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Όνομα *"><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="staff-name-input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ρόλος *">
              <select className={selectClass} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                {roles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
              </select>
            </Field>
            <Field label="Εθνικότητα"><input className={inputClass} value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></Field>
          </div>
          <Field label="Ομάδα">
            <select className={selectClass} value={form.team_type} onChange={e => setForm({...form, team_type: e.target.value})}>
              <option value="First Team">Α' Ομάδα</option>
              <option value="Academy">Ακαδημία</option>
            </select>
          </Field>
          <Field label="URL Φωτογραφίας"><input className={inputClass} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></Field>
          <Field label="Βιογραφικό"><textarea className={inputClass} rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></Field>
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
  const emptyFixture = {
    home_team: "LEFTERIA FC", away_team: "", home_score: "", away_score: "",
    match_date: "", match_time: "", venue: "Γήπεδο Αετού",
    competition: "ΠΑΑΟΚ Α' Όμιλος", season: "2025/26", status: "Scheduled",
    attendance: "", referee: ""
  };
  const [form, setForm] = useState(emptyFixture);

  const openCreate = () => { setForm(emptyFixture); setEditFixture(null); setShowForm(true); };
  const openEdit = (f) => {
    setForm({
      home_team: f.home_team, away_team: f.away_team,
      home_score: f.home_score ?? "", away_score: f.away_score ?? "",
      match_date: f.match_date ? f.match_date.split('T')[0] : "",
      match_time: f.match_time || "", venue: f.venue,
      competition: f.competition, season: f.season || "2025/26",
      status: f.status, attendance: f.attendance ?? "", referee: f.referee || ""
    });
    setEditFixture(f); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = {
        ...form,
        home_score: form.home_score !== "" ? parseInt(form.home_score) : null,
        away_score: form.away_score !== "" ? parseInt(form.away_score) : null,
        attendance: form.attendance !== "" ? parseInt(form.attendance) : null,
        match_date: form.match_date + (form.match_time ? `T${form.match_time}:00Z` : "T15:00:00Z"),
      };
      if (editFixture) {
        await axios.put(`${API}/admin/fixtures/${editFixture.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/fixtures`, payload, { headers });
      }
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή αγώνα;")) return;
    try { await axios.delete(`${API}/admin/fixtures/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-fixtures-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Αγώνες ({fixtures.length})</h2>
        <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-fixture-btn"><Plus size={16} /> Νέος Αγώνας</button>
      </div>

      <div className="overflow-x-auto">
        <table className="standings-table" data-testid="admin-fixtures-table">
          <thead><tr><th>Ημ/νία</th><th>Γηπεδούχος</th><th>Φιλοξενούμενος</th><th>Σκορ</th><th>Κατάσταση</th><th>Ενέργειες</th></tr></thead>
          <tbody>
            {fixtures.map(f => (
              <tr key={f.id}>
                <td className="text-sm">{new Date(f.match_date).toLocaleDateString('el-GR')}</td>
                <td className={f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623] font-semibold' : ''}>{f.home_team}</td>
                <td className={f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623] font-semibold' : ''}>{f.away_team}</td>
                <td>{f.status === 'Completed' ? `${f.home_score} - ${f.away_score}` : '-'}</td>
                <td><span className={`badge ${f.status === 'Completed' ? 'bg-green-900/50 text-green-400' : f.status === 'Live' ? 'bg-red-900/50 text-red-400' : 'badge-secondary'}`}>
                  {f.status === 'Completed' ? 'Ολοκληρώθηκε' : f.status === 'Scheduled' ? 'Προγρ.' : f.status}
                </span></td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(f)} className="text-[#F5A623]"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-500"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <FormModal title={editFixture ? "Επεξεργασία Αγώνα" : "Νέος Αγώνας"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Γηπεδούχος *"><input className={inputClass} value={form.home_team} onChange={e => setForm({...form, home_team: e.target.value})} data-testid="fixture-home-input" /></Field>
            <Field label="Φιλοξενούμενος *"><input className={inputClass} value={form.away_team} onChange={e => setForm({...form, away_team: e.target.value})} data-testid="fixture-away-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ημερομηνία *"><input type="date" className={inputClass} value={form.match_date} onChange={e => setForm({...form, match_date: e.target.value})} data-testid="fixture-date-input" /></Field>
            <Field label="Ώρα"><input type="time" className={inputClass} value={form.match_time} onChange={e => setForm({...form, match_time: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Σκορ Γηπεδούχου"><input type="number" className={inputClass} value={form.home_score} onChange={e => setForm({...form, home_score: e.target.value})} /></Field>
            <Field label="Σκορ Φιλοξενούμενου"><input type="number" className={inputClass} value={form.away_score} onChange={e => setForm({...form, away_score: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Γήπεδο"><input className={inputClass} value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} /></Field>
            <Field label="Διοργάνωση"><input className={inputClass} value={form.competition} onChange={e => setForm({...form, competition: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Κατάσταση">
              <select className={selectClass} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Scheduled">Προγραμματισμένος</option>
                <option value="Live">Live</option>
                <option value="Completed">Ολοκληρωμένος</option>
                <option value="Postponed">Αναβλήθηκε</option>
              </select>
            </Field>
            <Field label="Σεζόν"><input className={inputClass} value={form.season} onChange={e => setForm({...form, season: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Θεατές"><input type="number" className={inputClass} value={form.attendance} onChange={e => setForm({...form, attendance: e.target.value})} /></Field>
            <Field label="Διαιτητής"><input className={inputClass} value={form.referee} onChange={e => setForm({...form, referee: e.target.value})} /></Field>
          </div>
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
  const emptyStanding = { team_name: "", team_logo: "", played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, competition: "ΠΑΑΟΚ Α' Όμιλος", season: "2025/26", form: "" };
  const [form, setForm] = useState(emptyStanding);

  const openCreate = () => { setForm(emptyStanding); setEditStanding(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({ team_name: s.team_name, team_logo: s.team_logo || "", played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, goals_for: s.goals_for, goals_against: s.goals_against, points: s.points, competition: s.competition, season: s.season || "2025/26", form: s.form || "" });
    setEditStanding(s); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, played: +form.played, won: +form.won, drawn: +form.drawn, lost: +form.lost, goals_for: +form.goals_for, goals_against: +form.goals_against, points: +form.points };
      if (editStanding) {
        await axios.put(`${API}/admin/standings/${editStanding.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/standings`, payload, { headers });
      }
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/standings/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-standings-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Βαθμολογία ({standings.length})</h2>
        <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-standing-btn"><Plus size={16} /> Νέα Ομάδα</button>
      </div>

      <div className="overflow-x-auto">
        <table className="standings-table" data-testid="admin-standings-table">
          <thead><tr><th>#</th><th>Ομάδα</th><th>Αγ</th><th>Ν</th><th>Ι</th><th>Η</th><th>ΓΥ</th><th>ΓΚ</th><th>ΔΓ</th><th>Βαθ</th><th>Ενέργειες</th></tr></thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.id} className={s.team_name === 'LEFTERIA FC' ? 'team-highlight' : ''}>
                <td>{s.position || i + 1}</td>
                <td className="font-semibold">{s.team_name}</td>
                <td>{s.played}</td><td>{s.won}</td><td>{s.drawn}</td><td>{s.lost}</td>
                <td>{s.goals_for}</td><td>{s.goals_against}</td>
                <td className={s.goal_difference > 0 ? 'text-green-500' : s.goal_difference < 0 ? 'text-red-500' : ''}>{s.goal_difference > 0 ? '+' : ''}{s.goal_difference}</td>
                <td className="font-bold text-[#F5A623]">{s.points}</td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-[#F5A623]"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <FormModal title={editStanding ? "Επεξεργασία" : "Νέα Εγγραφή"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ομάδα *"><input className={inputClass} value={form.team_name} onChange={e => setForm({...form, team_name: e.target.value})} data-testid="standing-team-input" /></Field>
            <Field label="Logo URL"><input className={inputClass} value={form.team_logo} onChange={e => setForm({...form, team_logo: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Αγώνες"><input type="number" className={inputClass} value={form.played} onChange={e => setForm({...form, played: e.target.value})} /></Field>
            <Field label="Νίκες"><input type="number" className={inputClass} value={form.won} onChange={e => setForm({...form, won: e.target.value})} /></Field>
            <Field label="Ισοπαλίες"><input type="number" className={inputClass} value={form.drawn} onChange={e => setForm({...form, drawn: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ήττες"><input type="number" className={inputClass} value={form.lost} onChange={e => setForm({...form, lost: e.target.value})} /></Field>
            <Field label="Γκολ Υπέρ"><input type="number" className={inputClass} value={form.goals_for} onChange={e => setForm({...form, goals_for: e.target.value})} /></Field>
            <Field label="Γκολ Κατά"><input type="number" className={inputClass} value={form.goals_against} onChange={e => setForm({...form, goals_against: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Βαθμοί"><input type="number" className={inputClass} value={form.points} onChange={e => setForm({...form, points: e.target.value})} /></Field>
            <Field label="Διοργάνωση"><input className={inputClass} value={form.competition} onChange={e => setForm({...form, competition: e.target.value})} /></Field>
            <Field label="Φόρμα"><input className={inputClass} placeholder="π.χ. WWDLW" value={form.form} onChange={e => setForm({...form, form: e.target.value})} /></Field>
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
  const openEdit = (n) => {
    setForm({ title: n.title, content: n.content, excerpt: n.excerpt, image_url: n.image_url || "", category: n.category || "Νέα", is_featured: n.is_featured || false });
    setEditNews(n); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (editNews) {
        await axios.put(`${API}/admin/news/${editNews.id}`, form, { headers });
      } else {
        await axios.post(`${API}/admin/news`, form, { headers });
      }
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/news/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-news-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Νέα ({news.length})</h2>
        <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-news-btn"><Plus size={16} /> Νέο Άρθρο</button>
      </div>

      <div className="grid gap-4">
        {news.map(n => (
          <div key={n.id} className="card p-5 flex justify-between items-start gap-4">
            <div className="flex gap-4 flex-1 min-w-0">
              {n.image_url && <img src={n.image_url} alt="" className="w-20 h-14 object-cover flex-shrink-0" />}
              <div className="min-w-0">
                <div className="flex gap-2 items-center mb-1">
                  <span className="badge badge-secondary text-xs">{n.category}</span>
                  {n.is_featured && <span className="badge badge-primary text-xs">Προτεινόμενο</span>}
                </div>
                <h3 className="font-['Bebas_Neue'] text-lg text-white truncate">{n.title}</h3>
                <p className="text-zinc-400 text-xs mt-1 truncate">{n.excerpt}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(n)} className="text-[#F5A623]"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(n.id)} className="text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title={editNews ? "Επεξεργασία Άρθρου" : "Νέο Άρθρο"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Τίτλος *"><input className={inputClass} value={form.title} onChange={e => setForm({...form, title: e.target.value})} data-testid="news-title-input" /></Field>
          <Field label="Περίληψη *"><input className={inputClass} value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} /></Field>
          <Field label="Περιεχόμενο *"><textarea className={inputClass} rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} data-testid="news-content-input" /></Field>
          <Field label="URL Εικόνας"><input className={inputClass} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Κατηγορία">
              <select className={selectClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="Νέα">Νέα</option>
                <option value="Αποτελέσματα">Αποτελέσματα</option>
                <option value="Μεταγραφές">Μεταγραφές</option>
                <option value="Ακαδημία">Ακαδημία</option>
              </select>
            </Field>
            <Field label="Προτεινόμενο">
              <label className="flex items-center gap-3 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="w-5 h-5 accent-[#F5A623]" />
                <span className="text-white text-sm">Εμφάνιση ως προτεινόμενο</span>
              </label>
            </Field>
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
  const openEdit = (v) => {
    setForm({ name: v.name, address: v.address, city: v.city, country: v.country, capacity: v.capacity ?? "", surface: v.surface || "", image_url: v.image_url || "", map_url: v.map_url || "", is_home_ground: v.is_home_ground || false });
    setEditVenue(v); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, capacity: form.capacity !== "" ? parseInt(form.capacity) : null };
      if (editVenue) {
        await axios.put(`${API}/admin/venues/${editVenue.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/venues`, payload, { headers });
      }
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/venues/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-venues-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Γήπεδα ({venues.length})</h2>
        <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-venue-btn"><Plus size={16} /> Νέο Γήπεδο</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {venues.map(v => (
          <div key={v.id} className="card p-6" data-testid={`venue-${v.id}`}>
            {v.image_url && <img src={v.image_url} alt="" className="w-full h-32 object-cover mb-4" />}
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-['Bebas_Neue'] text-xl text-white">{v.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(v)} className="text-[#F5A623]"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(v.id)} className="text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            {v.is_home_ground && <span className="badge badge-primary text-xs mb-2">Έδρα</span>}
            <p className="text-zinc-400 text-sm"><MapPin size={14} className="inline mr-1" />{v.address}, {v.city}</p>
            {v.surface && <p className="text-zinc-500 text-xs mt-1">Επιφάνεια: {v.surface}</p>}
            {v.capacity && <p className="text-zinc-500 text-xs">Χωρητικότητα: {v.capacity}</p>}
          </div>
        ))}
        {venues.length === 0 && <p className="text-zinc-500 col-span-2 text-center py-8">Δεν υπάρχουν γήπεδα</p>}
      </div>

      {showForm && (
        <FormModal title={editVenue ? "Επεξεργασία Γηπέδου" : "Νέο Γήπεδο"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Όνομα *"><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="venue-name-input" /></Field>
          <Field label="Διεύθυνση *"><input className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Πόλη"><input className={inputClass} value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></Field>
            <Field label="Χώρα"><input className={inputClass} value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Χωρητικότητα"><input type="number" className={inputClass} value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></Field>
            <Field label="Επιφάνεια"><input className={inputClass} placeholder="π.χ. Φυσικός Χλοοτάπητας" value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} /></Field>
          </div>
          <Field label="URL Εικόνας"><input className={inputClass} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></Field>
          <Field label="URL Χάρτη"><input className={inputClass} placeholder="Google Maps URL" value={form.map_url} onChange={e => setForm({...form, map_url: e.target.value})} /></Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_home_ground} onChange={e => setForm({...form, is_home_ground: e.target.checked})} className="w-5 h-5 accent-[#F5A623]" />
            <span className="text-white text-sm">Είναι η έδρα μας</span>
          </label>
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
  const openEdit = (s) => {
    setForm({ name: s.name, start_date: s.start_date || "", end_date: s.end_date || "", is_current: s.is_current || false, competitions: (s.competitions || []).join(", "), achievements: (s.achievements || []).join(", "), final_position: s.final_position ?? "" });
    setEditSeason(s); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = {
        ...form,
        competitions: form.competitions ? form.competitions.split(",").map(s => s.trim()).filter(Boolean) : [],
        achievements: form.achievements ? form.achievements.split(",").map(s => s.trim()).filter(Boolean) : [],
        final_position: form.final_position !== "" ? parseInt(form.final_position) : null,
      };
      if (editSeason) {
        await axios.put(`${API}/admin/seasons/${editSeason.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/seasons`, payload, { headers });
      }
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/seasons/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-seasons-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Σεζόν ({seasons.length})</h2>
        <button onClick={openCreate} className="btn-primary text-sm" data-testid="add-season-btn"><Plus size={16} /> Νέα Σεζόν</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {seasons.map(s => (
          <div key={s.id} className="card p-6" data-testid={`season-${s.id}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-['Bebas_Neue'] text-2xl text-white">{s.name}</h3>
                {s.is_current && <span className="badge badge-primary text-xs">Τρέχουσα</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="text-[#F5A623]"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            <p className="text-zinc-400 text-xs">{s.start_date} - {s.end_date}</p>
            {s.competitions?.length > 0 && <p className="text-zinc-500 text-xs mt-1">Διοργανώσεις: {s.competitions.join(", ")}</p>}
            {s.final_position && <p className="text-[#F5A623] text-sm mt-2">Τελική θέση: {s.final_position}η</p>}
          </div>
        ))}
        {seasons.length === 0 && <p className="text-zinc-500 col-span-3 text-center py-8">Δεν υπάρχουν σεζόν</p>}
      </div>

      {showForm && (
        <FormModal title={editSeason ? "Επεξεργασία Σεζόν" : "Νέα Σεζόν"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Όνομα *"><input className={inputClass} placeholder="π.χ. 2025/26" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="season-name-input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Έναρξη *"><input type="date" className={inputClass} value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></Field>
            <Field label="Λήξη *"><input type="date" className={inputClass} value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></Field>
          </div>
          <Field label="Διοργανώσεις (χωρισμένες με κόμμα)"><input className={inputClass} value={form.competitions} onChange={e => setForm({...form, competitions: e.target.value})} /></Field>
          <Field label="Επιτεύγματα (χωρισμένα με κόμμα)"><input className={inputClass} value={form.achievements} onChange={e => setForm({...form, achievements: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Τελική θέση"><input type="number" className={inputClass} value={form.final_position} onChange={e => setForm({...form, final_position: e.target.value})} /></Field>
            <Field label="Τρέχουσα σεζόν">
              <label className="flex items-center gap-3 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.is_current} onChange={e => setForm({...form, is_current: e.target.checked})} className="w-5 h-5 accent-[#F5A623]" />
                <span className="text-white text-sm">Ναι</span>
              </label>
            </Field>
          </div>
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
    try {
      await axios.put(`${API}/admin/club`, form, { headers: getAuthHeaders() });
      onRefresh();
      alert("Το προφίλ ενημερώθηκε!");
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  return (
    <div data-testid="admin-club-tab">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl text-white">Προφίλ Συλλόγου</h2>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm" data-testid="save-club-btn">
          <Save size={16} /> {saving ? "Αποθήκευση..." : "Αποθήκευση"}
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Όνομα"><input className={inputClass} value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="Ελληνικό Όνομα"><input className={inputClass} value={form.greek_name || ""} onChange={e => setForm({...form, greek_name: e.target.value})} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Ίδρυση"><input type="number" className={inputClass} value={form.founded || ""} onChange={e => setForm({...form, founded: parseInt(e.target.value) || 0})} /></Field>
          <Field label="Γήπεδο"><input className={inputClass} value={form.stadium || ""} onChange={e => setForm({...form, stadium: e.target.value})} /></Field>
          <Field label="Πόλη"><input className={inputClass} value={form.city || ""} onChange={e => setForm({...form, city: e.target.value})} /></Field>
        </div>
        <Field label="Logo URL"><input className={inputClass} value={form.logo_url || ""} onChange={e => setForm({...form, logo_url: e.target.value})} /></Field>
        <Field label="Περιγραφή"><textarea className={inputClass} rows={4} value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><input className={inputClass} value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} /></Field>
          <Field label="Τηλέφωνο"><input className={inputClass} value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
        </div>
        <Field label="Ιστοσελίδα"><input className={inputClass} value={form.website || ""} onChange={e => setForm({...form, website: e.target.value})} /></Field>
        <h3 className="font-['Bebas_Neue'] text-xl text-[#F5A623] pt-4 border-t border-[#262626]">Κοινωνικά Δίκτυα</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Facebook"><input className={inputClass} value={form.facebook || ""} onChange={e => setForm({...form, facebook: e.target.value})} /></Field>
          <Field label="Instagram"><input className={inputClass} value={form.instagram || ""} onChange={e => setForm({...form, instagram: e.target.value})} /></Field>
          <Field label="Twitter"><input className={inputClass} value={form.twitter || ""} onChange={e => setForm({...form, twitter: e.target.value})} /></Field>
          <Field label="YouTube"><input className={inputClass} value={form.youtube || ""} onChange={e => setForm({...form, youtube: e.target.value})} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Κύριο Χρώμα"><input type="color" className="w-full h-10 cursor-pointer bg-transparent border border-[#333]" value={form.primary_color || "#F5A623"} onChange={e => setForm({...form, primary_color: e.target.value})} /></Field>
          <Field label="Δευτερεύον Χρώμα"><input type="color" className="w-full h-10 cursor-pointer bg-transparent border border-[#333]" value={form.secondary_color || "#000000"} onChange={e => setForm({...form, secondary_color: e.target.value})} /></Field>
        </div>
      </div>
    </div>
  );
};

// ==================== MESSAGES TAB ====================
const MessagesTab = ({ messages, onRefresh }) => {
  const handleDelete = async (id) => {
    if (!confirm("Διαγραφή μηνύματος;")) return;
    try { await axios.delete(`${API}/admin/contact/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  return (
    <div data-testid="admin-messages-tab">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-6">Μηνύματα ({messages.length})</h2>
      <div className="space-y-4">
        {messages.map(m => (
          <div key={m.id} className="card p-5" data-testid={`message-${m.id}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-semibold">{m.name}</h3>
                <p className="text-zinc-400 text-sm">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs">{new Date(m.created_at).toLocaleDateString('el-GR')}</span>
                <button onClick={() => handleDelete(m.id)} className="text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            <span className="badge badge-secondary mb-2">{m.subject}</span>
            <p className="text-zinc-300 text-sm">{m.message}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-zinc-500 text-center py-12">Δεν υπάρχουν μηνύματα</p>}
      </div>
    </div>
  );
};

// ==================== MAIN ADMIN PANEL ====================
const AdminPanel = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {}, players: [], fixtures: [], news: [], standings: [],
    academyGroups: [], staff: [], venues: [], seasons: [], messages: [], club: {}
  });

  const fetchAll = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [stats, players, fixtures, news, standings, groups, staffRes, venues, seasons, messages, club] = await Promise.all([
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
      ]);
      setData({
        stats: stats.data, players: players.data, fixtures: fixtures.data,
        news: news.data, standings: standings.data, academyGroups: groups.data,
        staff: staffRes.data, venues: venues.data, seasons: seasons.data,
        messages: messages.data, club: club.data
      });
    } catch (e) {
      console.error("Error fetching admin data:", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tabs = [
    { id: "dashboard", label: "Πίνακας", icon: BarChart3 },
    { id: "club", label: "Σύλλογος", icon: Building2 },
    { id: "players", label: "Παίκτες", icon: Users },
    { id: "academy", label: "Ακαδημία", icon: GraduationCap },
    { id: "staff", label: "Staff", icon: UserCog },
    { id: "fixtures", label: "Αγώνες", icon: Calendar },
    { id: "standings", label: "Βαθμολογία", icon: Trophy },
    { id: "news", label: "Νέα", icon: Newspaper },
    { id: "venues", label: "Γήπεδα", icon: MapPin },
    { id: "seasons", label: "Σεζόν", icon: Archive },
    { id: "messages", label: "Μηνύματα", icon: Mail },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]" data-testid="admin-loading">
      <div className="spinner"></div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab stats={data.stats} />;
      case "club": return <ClubProfileTab club={data.club} onRefresh={fetchAll} />;
      case "players": return <PlayersTab players={data.players} academyGroups={data.academyGroups} onRefresh={fetchAll} />;
      case "academy": return <AcademyGroupsTab groups={data.academyGroups} onRefresh={fetchAll} />;
      case "staff": return <StaffTab staff={data.staff} onRefresh={fetchAll} />;
      case "fixtures": return <FixturesTab fixtures={data.fixtures} onRefresh={fetchAll} />;
      case "standings": return <StandingsTab standings={data.standings} onRefresh={fetchAll} />;
      case "news": return <NewsTab news={data.news} onRefresh={fetchAll} />;
      case "venues": return <VenuesTab venues={data.venues} onRefresh={fetchAll} />;
      case "seasons": return <SeasonsTab seasons={data.seasons} onRefresh={fetchAll} />;
      case "messages": return <MessagesTab messages={data.messages} onRefresh={fetchAll} />;
      default: return <DashboardTab stats={data.stats} />;
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#050505]" data-testid="admin-page">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 admin-sidebar min-h-screen fixed left-0 top-24 hidden lg:block overflow-y-auto" style={{maxHeight: 'calc(100vh - 96px)'}}>
          <div className="p-5 border-b border-[#262626]">
            <h2 className="font-['Bebas_Neue'] text-lg text-[#F5A623]">Πάνελ Διαχείρισης</h2>
            <p className="text-xs text-zinc-500 mt-1">Καλώς ήρθες, {user?.username}</p>
          </div>
          <nav className="py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`admin-menu-item w-full ${activeTab === tab.id ? 'active' : ''}`}
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon size={17} />
                <span className="text-sm">{tab.label}</span>
                {tab.id === "messages" && data.messages.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{data.messages.length}</span>
                )}
              </button>
            ))}
            <button onClick={onLogout} className="admin-menu-item w-full text-red-400 hover:text-red-300 mt-2" data-testid="admin-logout">
              <LogOut size={17} />
              <span className="text-sm">Αποσύνδεση</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden fixed top-24 left-0 right-0 bg-[#111111] border-b border-[#262626] z-40 overflow-x-auto">
          <div className="flex p-2 gap-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'bg-[#F5A623] text-black' : 'bg-[#1F1F1F] text-white'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
            <button onClick={onLogout} className="px-3 py-1.5 text-xs whitespace-nowrap bg-red-900/50 text-red-400">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-60 p-6 pt-20 lg:pt-6">
          <div className="max-w-6xl mx-auto">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
