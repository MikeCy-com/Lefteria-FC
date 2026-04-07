import { useState, useEffect, useCallback } from "react";
import { Plus, X, Save, RefreshCw, Trash2, Edit2, Clock, Dumbbell, Tag, Users, ChevronDown, ChevronRight, Calendar, MapPin } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

const TAGS = [
  { value: "possession", label: "Κατοχή", color: "#3B82F6" },
  { value: "attacking", label: "Επίθεση", color: "#EF4444" },
  { value: "defending", label: "Άμυνα", color: "#10B981" },
  { value: "1v1", label: "1 εναντίον 1", color: "#F59E0B" },
  { value: "set_pieces", label: "Στημένα", color: "#8B5CF6" },
  { value: "fitness", label: "Φυσική Κατάσταση", color: "#EC4899" },
  { value: "shooting", label: "Σουτ", color: "#F97316" },
  { value: "passing", label: "Πάσες", color: "#06B6D4" },
  { value: "goalkeeping", label: "Τερματοφυλακή", color: "#6366F1" },
];

const INTENSITY_MAP = {
  low: { label: "Χαμηλή", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  medium: { label: "Μέτρια", color: "text-[#F5A623]", bg: "bg-[#F5A623]/10 border-[#F5A623]/20" },
  high: { label: "Υψηλή", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const TrainingSessionsPanel = ({ teamId, academyGroupId, facilities = [] }) => {
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    title: "", date: "", start_time: "16:00", duration_minutes: 90, intensity: "medium",
    venue: "", venue_id: "", location: "", location_url: "", arrival_time: "",
    tags: [], notes: "", player_count: 0,
    exercises: [{ name: "", description: "", duration_minutes: 15, equipment: "" }],
  });
  const [bulkForm, setBulkForm] = useState({
    title: "Προπόνηση",
    days_of_week: [],
    start_time: "16:00",
    duration_minutes: 60,
    intensity: "medium",
    season_start: "",
    season_end: "",
    venue: "", venue_id: "", location: "", location_url: "", arrival_time: "",
    tags: [],
    notes: "",
  });

  const fetchSessions = useCallback(async () => {
    try {
      const params = teamId ? `team_id=${teamId}` : `academy_group_id=${academyGroupId}`;
      const res = await axios.get(`${API}/admin/training-sessions?${params}`, { headers: getAuthHeaders() });
      setSessions(res.data);
    } catch (e) { console.error(e); }
  }, [teamId, academyGroupId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openCreate = () => {
    setEditSession(null);
    setForm({
      title: "", date: "", start_time: "16:00", duration_minutes: 90, intensity: "medium",
      venue: "", venue_id: "", location: "", location_url: "", arrival_time: "",
      tags: [], notes: "", player_count: 0,
      exercises: [{ name: "", description: "", duration_minutes: 15, equipment: "" }],
    });
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditSession(s);
    setForm({
      title: s.title, date: s.date || "", start_time: s.start_time || "16:00",
      duration_minutes: s.duration_minutes || 90, intensity: s.intensity || "medium",
      venue: s.venue || "", venue_id: s.venue_id || "", location: s.location || "",
      location_url: s.location_url || "", arrival_time: s.arrival_time || "",
      tags: s.tags || [], notes: s.notes || "", player_count: s.player_count || 0,
      exercises: s.exercises?.length ? s.exercises : [{ name: "", description: "", duration_minutes: 15, equipment: "" }],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) return alert("Τίτλος απαιτείται");
    setSaving(true);
    try {
      const payload = { ...form, team_id: teamId || null, academy_group_id: academyGroupId || null,
        exercises: form.exercises.filter(e => e.name.trim()),
      };
      if (editSession) {
        await axios.put(`${API}/admin/training-sessions/${editSession.id}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API}/admin/training-sessions`, payload, { headers: getAuthHeaders() });
      }
      setShowForm(false);
      fetchSessions();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή;")) return;
    try {
      await axios.delete(`${API}/admin/training-sessions/${id}`, { headers: getAuthHeaders() });
      fetchSessions();
    } catch (e) { alert("Σφάλμα"); }
  };

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const addExercise = () => {
    setForm(prev => ({ ...prev, exercises: [...prev.exercises, { name: "", description: "", duration_minutes: 15, equipment: "" }] }));
  };

  const updateExercise = (idx, field, value) => {
    setForm(prev => ({ ...prev, exercises: prev.exercises.map((e, i) => i === idx ? { ...e, [field]: value } : e) }));
  };

  const removeExercise = (idx) => {
    setForm(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== idx) }));
  };

  const handleBulkCreate = async () => {
    if (!bulkForm.days_of_week.length || !bulkForm.season_start || !bulkForm.season_end) {
      alert("Επιλέξτε μέρες, ημερομηνία έναρξης και λήξης σεζόν");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/admin/training-sessions/bulk`, {
        ...bulkForm,
        team_id: teamId || null,
        academy_group_id: academyGroupId || null,
      }, { headers: getAuthHeaders() });
      alert(`Δημιουργήθηκαν ${res.data.count} προπονήσεις!`);
      setShowBulkForm(false);
      fetchSessions();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  const toggleBulkDay = (day) => {
    setBulkForm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day) ? prev.days_of_week.filter(d => d !== day) : [...prev.days_of_week, day],
    }));
  };

  const selectFacility = (facId, target) => {
    const fac = facilities.find(f => f.id === facId);
    if (!fac) return;
    if (target === "form") {
      setForm(prev => ({ ...prev, venue: fac.name, venue_id: fac.id, location: fac.address || prev.location }));
    } else {
      setBulkForm(prev => ({ ...prev, venue: fac.name, venue_id: fac.id, location: fac.address || prev.location }));
    }
  };

  const DAYS = [
    { value: 0, label: "Δευτέρα" }, { value: 1, label: "Τρίτη" }, { value: 2, label: "Τετάρτη" },
    { value: 3, label: "Πέμπτη" }, { value: 4, label: "Παρασκευή" }, { value: 5, label: "Σάββατο" },
    { value: 6, label: "Κυριακή" },
  ];

  // Venue/Location fields shared between single and bulk forms
  const VenueFields = ({ values, onChange }) => (
    <div className="space-y-3 border-t border-[#262626] pt-4 mt-2">
      <h4 className="text-white text-xs font-semibold flex items-center gap-1.5"><MapPin size={13} className="text-[#F5A623]" /> Γήπεδο</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Γήπεδο</label>
          <select value={values.venue_id || ""} onChange={e => {
            if (e.target.value) {
              const fac = facilities.find(f => f.id === e.target.value);
              if (fac) onChange({ ...values, venue: fac.name, venue_id: fac.id, location_url: fac.location_url || values.location_url });
            } else {
              onChange({ ...values, venue_id: "" });
            }
          }} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none" data-testid="training-venue-select">
            <option value="">-- Επιλέξτε ή πληκτρολογήστε --</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input value={values.venue || ""} onChange={e => onChange({ ...values, venue: e.target.value })}
            placeholder="Ή πληκτρολογήστε γήπεδο" className="w-full mt-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-1.5 text-xs text-zinc-300 focus:border-[#F5A623] outline-none" data-testid="training-venue-input" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Ώρα Προσέλευσης</label>
          <input type="time" value={values.arrival_time || ""} onChange={e => onChange({ ...values, arrival_time: e.target.value })}
            className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none" data-testid="training-arrival-time" />
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Google Maps Link</label>
        <input value={values.location_url || ""} onChange={e => onChange({ ...values, location_url: e.target.value })}
          placeholder="https://maps.google.com/..." className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none" data-testid="training-location-url" />
      </div>
    </div>
  );

  return (
    <div data-testid="training-sessions-panel">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-sm font-medium">{sessions.length} Προπονήσεις</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkForm(true)} className="admin-btn-ghost text-xs" data-testid="bulk-training-btn">
            <Calendar size={12} /> Πρόγραμμα Σεζόν
          </button>
          <button onClick={openCreate} className="admin-btn-primary" data-testid="add-training-btn">
            <Plus size={14} /> Νέα Προπόνηση
          </button>
        </div>
      </div>

      {/* Bulk Season Creation Form */}
      {showBulkForm && (
        <div className="bg-[#0e0e0e] border border-[#F5A623]/30 rounded-xl p-5 mb-4 space-y-4" data-testid="bulk-training-form">
          <h4 className="text-white font-medium text-sm flex items-center gap-2"><Calendar size={16} className="text-[#F5A623]" /> Πρόγραμμα Σεζόν</h4>
          <p className="text-xs text-zinc-500">Δημιουργήστε αυτόματα εβδομαδιαίες προπονήσεις για ολόκληρη τη σεζόν.</p>
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Τίτλος</label>
            <input value={bulkForm.title} onChange={e => setBulkForm({...bulkForm, title: e.target.value})} className="admin-input w-full" data-testid="bulk-title" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Ημέρες Εβδομάδας *</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => (
                <button key={d.value} onClick={() => toggleBulkDay(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${bulkForm.days_of_week.includes(d.value) ? 'bg-[#F5A623] text-black border-[#F5A623]' : 'bg-[#1a1a1a] text-zinc-400 border-[#262626] hover:border-zinc-500'}`}
                  data-testid={`bulk-day-${d.value}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Ώρα Έναρξης</label>
              <input type="time" value={bulkForm.start_time} onChange={e => setBulkForm({...bulkForm, start_time: e.target.value})} className="admin-input w-full" data-testid="bulk-start-time" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Διάρκεια (λεπτά)</label>
              <input type="number" value={bulkForm.duration_minutes} onChange={e => setBulkForm({...bulkForm, duration_minutes: parseInt(e.target.value) || 60})} className="admin-input w-full" data-testid="bulk-duration" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Έναρξη Σεζόν *</label>
              <input type="date" value={bulkForm.season_start} onChange={e => setBulkForm({...bulkForm, season_start: e.target.value})} className="admin-input w-full" data-testid="bulk-season-start" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Λήξη Σεζόν *</label>
              <input type="date" value={bulkForm.season_end} onChange={e => setBulkForm({...bulkForm, season_end: e.target.value})} className="admin-input w-full" data-testid="bulk-season-end" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Ένταση</label>
            <select value={bulkForm.intensity} onChange={e => setBulkForm({...bulkForm, intensity: e.target.value})} className="admin-input w-full">
              <option value="low">Χαμηλή</option><option value="medium">Μέτρια</option><option value="high">Υψηλή</option>
            </select>
          </div>
          {/* Venue/Location for bulk */}
          <VenueFields values={bulkForm} onChange={vals => setBulkForm(prev => ({ ...prev, ...vals }))} />
          <div className="flex gap-2 pt-2">
            <button onClick={handleBulkCreate} disabled={saving} className="admin-btn-primary flex-1" data-testid="bulk-create-btn">
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Δημιουργία...</> : <><Calendar size={14} /> Δημιουργία Προγράμματος</>}
            </button>
            <button onClick={() => setShowBulkForm(false)} className="admin-btn-ghost">Ακύρωση</button>
          </div>
        </div>
      )}

      {sessions.length > 0 ? (
        <div className="space-y-2">
          {sessions.map(s => {
            const intensity = INTENSITY_MAP[s.intensity] || INTENSITY_MAP.medium;
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden" data-testid={`training-${s.id}`}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                  <div className={`w-1 h-10 rounded-full ${s.intensity === 'high' ? 'bg-red-500' : s.intensity === 'low' ? 'bg-emerald-500' : 'bg-[#F5A623]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{s.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${intensity.bg}`}>{intensity.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      {s.date && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(s.date).toLocaleDateString('el-GR')}</span>}
                      {s.start_time && <span>{s.start_time}</span>}
                      <span>{s.duration_minutes} λεπτά</span>
                      {s.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {s.venue}</span>}
                      {s.exercises?.length > 0 && <span>{s.exercises.length} ασκήσεις</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                    {(s.tags || []).slice(0, 3).map(tag => {
                      const t = TAGS.find(x => x.value === tag);
                      return t ? (
                        <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: `${t.color}40`, color: t.color, backgroundColor: `${t.color}10` }}>
                          {t.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(s)} className="admin-icon-btn"><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(s.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                  {isExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[#1e1e1e] p-4 space-y-4">
                    {/* Location info */}
                    {(s.venue || s.location || s.arrival_time) && (
                      <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
                        {s.venue && <span className="flex items-center gap-1"><MapPin size={12} className="text-[#F5A623]" /> {s.venue}</span>}
                        {s.location && <span>{s.location}</span>}
                        {s.location_url && <a href={s.location_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1"><MapPin size={10} /> Χάρτης</a>}
                        {s.arrival_time && <span className="flex items-center gap-1"><Clock size={12} /> Προσέλευση: {s.arrival_time}</span>}
                      </div>
                    )}
                    {s.notes && (
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Σημειώσεις</span>
                        <p className="text-sm text-zinc-300 mt-1">{s.notes}</p>
                      </div>
                    )}
                    {s.exercises?.length > 0 && (
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Ασκήσεις ({s.exercises.length})</span>
                        <div className="space-y-2">
                          {s.exercises.map((ex, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#121212] border border-[#1e1e1e]">
                              <span className="font-['Bebas_Neue'] text-lg text-zinc-700 w-6 text-center">{i + 1}</span>
                              <div className="flex-1">
                                <p className="text-sm text-white font-medium">{ex.name}</p>
                                {ex.description && <p className="text-xs text-zinc-400 mt-0.5">{ex.description}</p>}
                                <div className="flex gap-3 mt-1 text-[10px] text-zinc-500">
                                  <span>{ex.duration_minutes} λεπτά</span>
                                  {ex.equipment && <span>Εξοπλισμός: {ex.equipment}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-12 text-center">
          <Dumbbell size={36} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Δεν υπάρχουν προπονήσεις</p>
        </div>
      )}

      {/* Training Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-8 overflow-y-auto" data-testid="training-form-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white">{editSession ? "Επεξεργασία Προπόνησης" : "Νέα Προπόνηση"}</h2>
              <button onClick={() => setShowForm(false)} className="admin-icon-btn"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Τίτλος *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                    placeholder="Π.χ. Τεχνική Προπόνηση" data-testid="training-title-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Ημερομηνία</label>
                  <input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                    data-testid="training-date-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Διάρκεια (λεπτά)</label>
                    <input type="number" min="15" max="240" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value) || 90})}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                      data-testid="training-duration-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Ένταση</label>
                    <select value={form.intensity} onChange={e => setForm({...form, intensity: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                      data-testid="training-intensity-select">
                      <option value="low">Χαμηλή</option>
                      <option value="medium">Μέτρια</option>
                      <option value="high">Υψηλή</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Venue / Location */}
              <VenueFields values={form} onChange={vals => setForm(prev => ({ ...prev, ...vals }))} />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Θεματολογία</label>
                <div className="flex flex-wrap gap-1.5" data-testid="training-tags">
                  {TAGS.map(tag => (
                    <button key={tag.value} type="button" onClick={() => toggleTag(tag.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        form.tags.includes(tag.value)
                          ? 'border-opacity-60 font-medium'
                          : 'border-opacity-20 opacity-50 hover:opacity-80'
                      }`}
                      style={{
                        borderColor: tag.color,
                        color: form.tags.includes(tag.value) ? tag.color : '#9CA3AF',
                        backgroundColor: form.tags.includes(tag.value) ? `${tag.color}15` : 'transparent',
                      }}
                      data-testid={`tag-${tag.value}`}>
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Ασκήσεις</label>
                  <button type="button" onClick={addExercise} className="text-[10px] text-[#F5A623] hover:underline" data-testid="add-exercise-btn">+ Προσθήκη</button>
                </div>
                <div className="space-y-2">
                  {form.exercises.map((ex, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] space-y-2" data-testid={`exercise-${i}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600 font-mono w-5">{i + 1}.</span>
                        <input value={ex.name} onChange={e => updateExercise(i, "name", e.target.value)}
                          placeholder="Όνομα άσκησης" className="flex-1 bg-transparent border-b border-[#333] px-1 py-1 text-sm text-white focus:border-[#F5A623] outline-none" />
                        <input type="number" min="1" max="60" value={ex.duration_minutes} onChange={e => updateExercise(i, "duration_minutes", parseInt(e.target.value) || 15)}
                          className="w-16 bg-transparent border-b border-[#333] px-1 py-1 text-sm text-white text-center focus:border-[#F5A623] outline-none" />
                        <span className="text-[10px] text-zinc-500">λεπτά</span>
                        {form.exercises.length > 1 && (
                          <button type="button" onClick={() => removeExercise(i)} className="admin-icon-btn p-1 text-red-500/50 hover:text-red-400"><X size={12} /></button>
                        )}
                      </div>
                      <div className="flex gap-2 pl-7">
                        <input value={ex.description} onChange={e => updateExercise(i, "description", e.target.value)}
                          placeholder="Περιγραφή (προαιρετικό)" className="flex-1 bg-transparent border-b border-[#1e1e1e] px-1 py-0.5 text-xs text-zinc-400 focus:border-[#F5A623] outline-none" />
                        <input value={ex.equipment} onChange={e => updateExercise(i, "equipment", e.target.value)}
                          placeholder="Εξοπλισμός" className="w-32 bg-transparent border-b border-[#1e1e1e] px-1 py-0.5 text-xs text-zinc-400 focus:border-[#F5A623] outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Σημειώσεις</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none resize-none" rows={2}
                  data-testid="training-notes-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-training-btn">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingSessionsPanel;
