import { useState, useEffect } from "react";
import { Users, Check, X as XIcon, Clock, RefreshCw, BarChart3, ChevronDown } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

const AdminAttendanceTab = ({ teams = [], academyGroups = [], players = [] }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [stats, setStats] = useState(null);
  const [markingEvent, setMarkingEvent] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState([]);
  const [saving, setSaving] = useState(false);

  const allGroups = [
    ...teams.map(t => ({ id: t.id, name: t.name, type: "team" })),
    ...academyGroups.map(g => ({ id: g.id, name: g.name, type: "academy" })),
  ];

  const fetchData = async (group) => {
    if (!group) return;
    try {
      const params = group.type === "team" ? `team_id=${group.id}` : `academy_group_id=${group.id}`;
      const [eventsRes, statsRes] = await Promise.all([
        axios.get(`${API}/events?${params}`),
        axios.get(`${API}/admin/attendance/stats?${params}`, { headers: getAuthHeaders() }),
      ]);
      // Also get fixtures
      const fixturesRes = group.type === "academy"
        ? await axios.get(`${API}/academy-groups/${group.id}/fixtures`)
        : await axios.get(`${API}/fixtures?team_id=${group.id}`);
      setEvents(eventsRes.data);
      setFixtures(fixturesRes.data || []);
      setStats(statsRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (selectedGroup) fetchData(selectedGroup); }, [selectedGroup]);

  const allEvents = [
    ...events.map(e => ({ ...e, source: "event", displayDate: e.date })),
    ...fixtures.map(f => ({ id: f.id, title: `${f.home_team} vs ${f.away_team}`, source: "fixture", displayDate: f.match_date, type: "match" })),
  ].sort((a, b) => (b.displayDate || "").localeCompare(a.displayDate || ""));

  const groupPlayers = selectedGroup
    ? players.filter(p => {
        if (selectedGroup.type === "team") return p.team_id === selectedGroup.id;
        return p.academy_group_id === selectedGroup.id || (p.academy_group_ids && p.academy_group_ids.includes(selectedGroup.id));
      })
    : [];

  const openMarkAttendance = async (event) => {
    setMarkingEvent(event);
    try {
      const existing = await axios.get(`${API}/admin/events/${event.id}/attendance`, { headers: getAuthHeaders() });
      const existingMap = {};
      (existing.data || []).forEach(r => { existingMap[r.player_id] = r.status; });
      setAttendanceForm(groupPlayers.map(p => ({
        player_id: p.id, player_name: p.name,
        status: existingMap[p.id] || "no_response",
      })));
    } catch {
      setAttendanceForm(groupPlayers.map(p => ({
        player_id: p.id, player_name: p.name, status: "no_response",
      })));
    }
  };

  const handleSaveAttendance = async () => {
    if (!markingEvent) return;
    setSaving(true);
    try {
      await axios.post(`${API}/admin/events/${markingEvent.id}/attendance`, {
        responses: attendanceForm,
      }, { headers: getAuthHeaders() });
      setMarkingEvent(null);
      if (selectedGroup) fetchData(selectedGroup);
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const updateStatus = (idx, status) => {
    setAttendanceForm(prev => prev.map((p, i) => i === idx ? { ...p, status } : p));
  };

  const overallGoing = stats?.overall?.going || 0;
  const overallNot = stats?.overall?.not_going || 0;
  const overallNr = stats?.overall?.no_response || 0;
  const overallTotal = overallGoing + overallNot + overallNr;
  const overallRate = overallTotal > 0 ? Math.round((overallGoing / overallTotal) * 100) : 0;

  return (
    <div data-testid="admin-attendance-tab">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">Παρουσιες</h1>
          <p className="text-zinc-500 text-sm">Παρακολούθηση συμμετοχής ανά ομάδα</p>
        </div>
      </div>

      {/* Group Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {allGroups.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              selectedGroup?.id === g.id
                ? 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/30'
                : 'bg-[#121212] text-zinc-400 border-[#262626] hover:border-zinc-500'
            }`}
            data-testid={`attendance-group-${g.id}`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {selectedGroup && stats ? (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 text-center" data-testid="attendance-rate-card">
              <div className="font-['Bebas_Neue'] text-4xl text-[#F5A623]">{overallRate}%</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Παρουσια</div>
            </div>
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 text-center">
              <div className="font-['Bebas_Neue'] text-4xl text-emerald-400">{overallGoing}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Παροντες</div>
            </div>
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 text-center">
              <div className="font-['Bebas_Neue'] text-4xl text-red-400">{overallNot}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Αποντες</div>
            </div>
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 text-center">
              <div className="font-['Bebas_Neue'] text-4xl text-zinc-500">{stats.total_events}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Εκδηλωσεις</div>
            </div>
          </div>

          {/* Attendance Rate Bar */}
          {overallTotal > 0 && (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5" data-testid="attendance-bar">
              <h3 className="text-white text-sm font-medium mb-3">Συνολική Παρουσία</h3>
              <div className="flex h-6 rounded-lg overflow-hidden">
                {overallGoing > 0 && <div className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-black" style={{ width: `${(overallGoing / overallTotal) * 100}%` }}>{overallGoing}</div>}
                {overallNot > 0 && <div className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(overallNot / overallTotal) * 100}%` }}>{overallNot}</div>}
                {overallNr > 0 && <div className="bg-zinc-600 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(overallNr / overallTotal) * 100}%` }}>{overallNr}</div>}
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-xs text-zinc-400">Παρόντες</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /><span className="text-xs text-zinc-400">Απόντες</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-zinc-600" /><span className="text-xs text-zinc-400">Χωρίς Απάντηση</span></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player Attendance Rates */}
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5" data-testid="player-attendance-list">
              <h3 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
                <Users size={16} className="text-[#F5A623]" /> Παρουσία ανά Παίκτη
              </h3>
              {stats.player_stats?.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {stats.player_stats.map(ps => (
                    <div key={ps.player_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{ps.player_name}</p>
                        <div className="flex h-1.5 rounded-full overflow-hidden mt-1 bg-[#1a1a1a]">
                          <div className="bg-emerald-500 transition-all" style={{ width: `${ps.attendance_rate}%` }} />
                        </div>
                      </div>
                      <span className={`font-['Bebas_Neue'] text-lg ${ps.attendance_rate >= 80 ? 'text-emerald-400' : ps.attendance_rate >= 50 ? 'text-[#F5A623]' : 'text-red-400'}`}>
                        {ps.attendance_rate}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-6">Δεν υπάρχουν δεδομένα</p>
              )}
            </div>

            {/* Events List for marking */}
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-5" data-testid="events-attendance-list">
              <h3 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#F5A623]" /> Εκδηλώσεις
              </h3>
              {allEvents.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {allEvents.map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] group" data-testid={`attendance-event-${ev.id}`}>
                      <div className={`w-1 h-8 rounded-full ${ev.type === 'match' ? 'bg-[#F5A623]' : ev.type === 'training' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{ev.title}</p>
                        <p className="text-[10px] text-zinc-500">{ev.displayDate ? new Date(ev.displayDate).toLocaleDateString('el-GR') : ""}</p>
                      </div>
                      <button onClick={() => openMarkAttendance(ev)} className="admin-btn-ghost text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`mark-attendance-${ev.id}`}>
                        <Check size={12} /> Παρουσίες
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-6">Δεν υπάρχουν εκδηλώσεις</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-16 text-center">
          <Users size={48} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">Επιλέξτε ομάδα για να δείτε τις παρουσίες</p>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {markingEvent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" data-testid="mark-attendance-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <div>
                <h2 className="font-['Bebas_Neue'] text-xl text-white">Καταγραφη Παρουσιων</h2>
                <p className="text-xs text-zinc-500">{markingEvent.title}</p>
              </div>
              <button onClick={() => setMarkingEvent(null)} className="admin-icon-btn"><XIcon size={18} /></button>
            </div>
            <div className="p-5">
              <div className="flex justify-end gap-2 mb-3">
                <button onClick={() => setAttendanceForm(prev => prev.map(p => ({...p, status: "going"})))}
                  className="text-[10px] text-emerald-400 hover:underline" data-testid="mark-all-going">Όλοι παρόντες</button>
                <span className="text-zinc-700">|</span>
                <button onClick={() => setAttendanceForm(prev => prev.map(p => ({...p, status: "not_going"})))}
                  className="text-[10px] text-red-400 hover:underline" data-testid="mark-all-absent">Όλοι απόντες</button>
              </div>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                {attendanceForm.map((p, i) => (
                  <div key={p.player_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0a0a0a]" data-testid={`attendance-row-${p.player_id}`}>
                    <span className="flex-1 text-sm text-white truncate">{p.player_name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => updateStatus(i, "going")}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${p.status === 'going' ? 'bg-emerald-500 text-black' : 'bg-[#1a1a1a] text-zinc-600 hover:text-emerald-400'}`}
                        data-testid={`mark-going-${p.player_id}`}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => updateStatus(i, "not_going")}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${p.status === 'not_going' ? 'bg-red-500 text-white' : 'bg-[#1a1a1a] text-zinc-600 hover:text-red-400'}`}
                        data-testid={`mark-not-going-${p.player_id}`}>
                        <XIcon size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {attendanceForm.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">Δεν υπάρχουν παίκτες</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setMarkingEvent(null)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleSaveAttendance} disabled={saving} className="admin-btn-primary" data-testid="save-attendance-btn">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Check size={14} /> Αποθήκευση</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceTab;
