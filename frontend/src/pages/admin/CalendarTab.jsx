import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, X, Save, RefreshCw, Trash2, Edit2, MapPin, Clock, Users, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

const EVENT_TYPES = [
  { value: "training", label: "Προπόνηση", color: "#3B82F6", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "match", label: "Αγώνας", color: "#F5A623", bg: "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20" },
  { value: "meeting", label: "Συνάντηση", color: "#A855F7", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "other", label: "Άλλο", color: "#6B7280", bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
];

const getTypeInfo = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[3];

const AdminCalendarTab = ({ teams = [], academyGroups = [] }) => {
  const [events, setEvents] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({
    title: "", type: "training", team_id: "", academy_group_id: "",
    date: "", end_date: "", location: "", description: "",
  });

  const fetchData = async () => {
    try {
      const [eventsRes, calRes] = await Promise.all([
        axios.get(`${API}/admin/events`, { headers: getAuthHeaders() }),
        axios.get(`${API}/calendar`),
      ]);
      setEvents(eventsRes.data);
      setCalendarItems(calRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = (date = null) => {
    setEditEvent(null);
    setForm({
      title: "", type: "training", team_id: "", academy_group_id: "",
      date: date || "", end_date: "", location: "", description: "",
    });
    setShowForm(true);
  };

  const openEdit = (ev) => {
    if (ev.source === "fixture") return; // Can't edit fixtures here
    setEditEvent(ev);
    setForm({
      title: ev.title, type: ev.type, team_id: ev.team_id || "",
      academy_group_id: ev.academy_group_id || "",
      date: ev.date || "", end_date: ev.end_date || "",
      location: ev.location || "", description: ev.description || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date) return alert("Τίτλος και ημερομηνία απαιτούνται");
    setSaving(true);
    try {
      if (editEvent) {
        await axios.put(`${API}/admin/events/${editEvent.id}`, form, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API}/admin/events`, form, { headers: getAuthHeaders() });
      }
      setShowForm(false);
      fetchData();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή;")) return;
    try {
      await axios.delete(`${API}/admin/events/${id}`, { headers: getAuthHeaders() });
      fetchData();
    } catch (e) { alert("Σφάλμα"); }
  };

  // Calendar grid logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const monthNames = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
  const dayNames = ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"];

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarItems.filter(e => e.date && e.date.startsWith(dateStr));
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const allGroups = [...teams.map(t => ({ id: t.id, name: t.name, type: "team" })), ...academyGroups.map(g => ({ id: g.id, name: g.name, type: "academy" }))];

  const dayItems = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div data-testid="admin-calendar-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">Ημερολογιο</h1>
          <p className="text-zinc-500 text-sm">{events.length} εκδηλώσεις</p>
        </div>
        <button onClick={() => openCreate()} className="admin-btn-primary" data-testid="add-event-btn">
          <Plus size={14} /> Νέα Εκδήλωση
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-3 bg-[#121212] border border-[#262626] rounded-xl overflow-hidden" data-testid="calendar-grid">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-[#262626]">
            <button onClick={prevMonth} className="admin-icon-btn"><ChevronLeft size={18} /></button>
            <h2 className="font-['Bebas_Neue'] text-2xl text-white">{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} className="admin-icon-btn"><ChevronRight size={18} /></button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[#262626]">
            {dayNames.map(d => (
              <div key={d} className="p-2 text-center text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{d}</div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-[#1a1a1a] bg-[#0a0a0a]/50" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay === day;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[90px] border-b border-r border-[#1a1a1a] p-1.5 cursor-pointer transition-colors hover:bg-white/[0.02] ${isSelected ? 'bg-white/[0.05]' : ''}`}
                  data-testid={`calendar-day-${day}`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#F5A623] text-black' : 'text-zinc-400'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const info = getTypeInfo(ev.type);
                      return (
                        <div
                          key={ev.id}
                          className="text-[9px] px-1.5 py-0.5 rounded truncate border"
                          style={{ borderColor: `${info.color}30`, backgroundColor: `${info.color}10`, color: info.color }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-zinc-600 pl-1">+{dayEvents.length - 3} ακόμα</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Day Detail / Upcoming */}
        <div className="xl:col-span-1 space-y-4">
          {selectedDay ? (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-4" data-testid="day-detail-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-['Bebas_Neue'] text-xl text-white">{selectedDay} {monthNames[month]}</h3>
                <button onClick={() => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}T17:00`;
                  openCreate(dateStr);
                }} className="admin-icon-btn text-[#F5A623]" data-testid="add-event-on-day"><Plus size={16} /></button>
              </div>
              {dayItems.length > 0 ? (
                <div className="space-y-2">
                  {dayItems.map(ev => {
                    const info = getTypeInfo(ev.type);
                    return (
                      <div key={ev.id} className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] group" data-testid={`day-event-${ev.id}`}>
                        <div className="flex items-start justify-between mb-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${info.bg}`}>{info.label}</span>
                          {ev.source !== "fixture" && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(ev)} className="admin-icon-btn p-1"><Edit2 size={11} /></button>
                              <button onClick={() => handleDelete(ev.id)} className="admin-icon-btn p-1 text-red-400"><Trash2 size={11} /></button>
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm text-white font-medium">{ev.title}</h4>
                        {ev.date && <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1"><Clock size={10} /> {new Date(ev.date).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</p>}
                        {ev.location && <p className="text-[10px] text-zinc-500 flex items-center gap-1"><MapPin size={10} /> {ev.location}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-4">Δεν υπάρχουν εκδηλώσεις</p>
              )}
            </div>
          ) : (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-4">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Επομενες</h3>
              <div className="space-y-2">
                {calendarItems.filter(e => e.date && e.date >= todayStr).slice(0, 8).map(ev => {
                  const info = getTypeInfo(ev.type);
                  return (
                    <div key={ev.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.03]">
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: info.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{ev.title}</p>
                        <p className="text-[10px] text-zinc-500">{ev.date ? new Date(ev.date).toLocaleDateString('el-GR', { day: '2-digit', month: 'short' }) : ""}</p>
                      </div>
                    </div>
                  );
                })}
                {calendarItems.filter(e => e.date && e.date >= todayStr).length === 0 && (
                  <p className="text-zinc-600 text-sm text-center py-4">Δεν υπάρχουν εκδηλώσεις</p>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-4">
            <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Τυποι</h4>
            <div className="space-y-1.5">
              {EVENT_TYPES.map(t => (
                <div key={t.value} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: t.color }} />
                  <span className="text-xs text-zinc-400">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" data-testid="event-form-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white">{editEvent ? "Επεξεργασια" : "Νεα Εκδηλωση"}</h2>
              <button onClick={() => setShowForm(false)} className="admin-icon-btn"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Τιτλος *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                  placeholder="Π.χ. Προπόνηση U12" data-testid="event-title-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Τυπος</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                    data-testid="event-type-select">
                    {EVENT_TYPES.filter(t => t.value !== "match").map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ομαδα</label>
                  <select value={form.team_id || form.academy_group_id || ""} onChange={e => {
                    const sel = allGroups.find(g => g.id === e.target.value);
                    if (sel?.type === "team") setForm({...form, team_id: sel.id, academy_group_id: ""});
                    else if (sel?.type === "academy") setForm({...form, team_id: "", academy_group_id: sel.id});
                    else setForm({...form, team_id: "", academy_group_id: ""});
                  }} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                    data-testid="event-group-select">
                    <option value="">Όλος ο Σύλλογος</option>
                    {allGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.type === "team" ? "Ομάδα" : "Ακαδημία"})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ημερομηνια *</label>
                  <input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                    data-testid="event-date-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ληξη</label>
                  <input type="datetime-local" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Τοποθεσια</label>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                  placeholder="Γήπεδο Αετού" data-testid="event-location-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Περιγραφη</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none resize-none" rows={2}
                  data-testid="event-description-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-event-btn">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarTab;
