import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users, Calendar, Newspaper, Trophy, GraduationCap, Mail,
  LogOut, Plus, Edit2, Trash2, X, Save, BarChart3, Building2,
  MapPin, Archive, UserCog, Zap, RefreshCw, Activity, AlertCircle,
  Check, Clock, ChevronRight, Settings
} from "lucide-react";
import { getSoundForEvent, playMatchWhistle, playWhistleSound } from "../utils/sounds";
import ImageUpload from "../components/ImageUpload";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== SHARED UI COMPONENTS ====================
const FormModal = ({ title, onClose, onSave, children, saving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" data-testid="form-modal" onClick={onClose}>
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#141414] z-10 rounded-t-lg">
        <h2 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">{title}</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10" data-testid="modal-close"><X size={18} /></button>
      </div>
      <div className="p-6 space-y-4">{children}</div>
      <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a] sticky bottom-0 bg-[#141414] rounded-b-lg">
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
    <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>
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
      <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">{title}</h2>
      {count !== undefined && <span className="text-xs text-zinc-500">{count} εγγραφές</span>}
    </div>
    <div className="flex gap-2 items-center">{children}</div>
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
    <Icon size={48} strokeWidth={1} />
    <p className="mt-3 text-sm">{text}</p>
  </div>
);

// ==================== DASHBOARD TAB ====================
const DashboardTab = ({ stats, onTabChange }) => {
  const cards = [
    { label: "Α' Ομάδα", value: stats.first_team_players, icon: Users, color: "#3B82F6", tab: "players" },
    { label: "Ακαδημία", value: stats.academy_players, icon: GraduationCap, color: "#10B981", tab: "academy" },
    { label: "Staff", value: stats.staff_members, icon: UserCog, color: "#8B5CF6", tab: "staff" },
    { label: "Αγώνες", value: stats.total_fixtures, icon: Calendar, color: "#F5A623", tab: "fixtures" },
    { label: "Νέα", value: stats.news_articles, icon: Newspaper, color: "#06B6D4", tab: "news" },
    { label: "Μηνύματα", value: stats.unread_messages, icon: Mail, color: "#EF4444", tab: "messages" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide mb-6">Πίνακας Ελέγχου</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <button key={i} onClick={() => onTabChange(c.tab)} className="admin-stat-card group text-left" data-testid={`stat-${c.label}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{backgroundColor: c.color + '18'}}>
                <c.icon size={18} style={{color: c.color}} />
              </div>
              <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </div>
            <div className="font-['Bebas_Neue'] text-3xl text-white">{c.value ?? 0}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{c.label}</div>
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
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
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

  const filtered = filter === "all" ? players : filter === "first_team" ? players.filter(p => p.team_type === "First Team") : players.filter(p => p.team_type === "Academy");

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
              <tr key={p.id}>
                <td className="font-mono text-zinc-500">{p.number}</td>
                <td>{p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 object-cover rounded-full" /> : <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center"><Users size={12} className="text-zinc-700" /></div>}</td>
                <td className="font-medium text-white">{p.name}</td>
                <td className="text-zinc-400">{p.position}</td>
                <td className="text-zinc-400">{p.age}</td>
                <td><span className={`admin-badge ${p.team_type === 'Academy' ? 'admin-badge-green' : 'admin-badge-blue'}`}>{p.team_type === 'First Team' ? "Α'" : 'Ακαδ.'}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="admin-icon-btn" data-testid={`edit-player-${p.id}`}><Edit2 size={13} /></button>
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
    { id: "livescore", label: "Live Score", icon: Zap },
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
      default: return <DashboardTab stats={data.stats} onTabChange={setActiveTab} />;
    }
  };

  const liveCount = data.fixtures.filter(f => f.status === 'Live').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="admin-page">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#111111] border-b border-[#1e1e1e] flex items-center px-4">
        <div className="flex items-center gap-3">
          <img src={CLUB_LOGO} alt="" className="w-8 h-8" />
          <div>
            <span className="font-['Bebas_Neue'] text-base text-white tracking-wide">LEFTERIA FC</span>
            <span className="text-[10px] text-[#F5A623] ml-2 tracking-widest">CMS</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-zinc-500 hidden sm:block">{user?.username}</span>
          <button onClick={onLogout} className="admin-icon-btn text-red-500/60 hover:text-red-400" data-testid="admin-logout"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="w-52 fixed left-0 top-14 bottom-0 bg-[#111111] border-r border-[#1e1e1e] hidden lg:flex flex-col overflow-y-auto">
          <nav className="py-2 flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all ${
                  activeTab === tab.id
                    ? 'text-[#F5A623] bg-[#F5A623]/8 border-r-2 border-[#F5A623]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/3'
                }`}
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {tab.id === "livescore" && liveCount > 0 && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
                {tab.id === "messages" && data.messages.length > 0 && (
                  <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{data.messages.length}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-[#111111] border-b border-[#1e1e1e] z-40 overflow-x-auto">
          <div className="flex p-1.5 gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 text-[11px] whitespace-nowrap rounded flex items-center gap-1 ${
                  activeTab === tab.id ? 'bg-[#F5A623]/15 text-[#F5A623]' : 'text-zinc-600 hover:text-zinc-400'
                }`}>
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-52 p-5 pt-16 lg:pt-5 min-h-[calc(100vh-56px)]">
          <div className="max-w-6xl mx-auto">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
