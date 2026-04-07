import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Shield, Users, Trophy, Dumbbell, Filter } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

const EVENT_COLORS = {
  training: { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
  match: { bg: "bg-[#F5A623]/15", border: "border-[#F5A623]/30", text: "text-[#F5A623]", dot: "bg-[#F5A623]" },
  meeting: { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-500" },
  other: { bg: "bg-zinc-500/15", border: "border-zinc-500/30", text: "text-zinc-400", dot: "bg-zinc-500" },
};

const MONTHS_GR = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
const DAYS_GR = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

// Shared Section Dashboard with scoped Calendar
const SectionDashboard = ({ scope, teams = [], academyGroups = [], opponents = [], facilities = [] }) => {
  const isClub = scope === "club";
  const accentColor = isClub ? "#F5A623" : "#10B981";
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [filterTeamId, setFilterTeamId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [eventsRes, trainRes, fixRes] = await Promise.all([
        axios.get(`${API}/admin/events`, { headers }),
        axios.get(`${API}/admin/training-sessions`, { headers }),
        axios.get(`${API}/fixtures`),
      ]);
      setEvents(eventsRes.data || []);
      setTrainingSessions(trainRes.data || []);
      setFixtures(fixRes.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Scope filtering
  const scopeTeamIds = isClub ? teams.map(t => t.id) : [];
  const scopeGroupIds = isClub ? [] : academyGroups.map(g => g.id);

  const filteredTraining = trainingSessions.filter(s => {
    if (isClub) return s.team_id && scopeTeamIds.includes(s.team_id);
    return s.academy_group_id && scopeGroupIds.includes(s.academy_group_id);
  }).filter(s => !filterTeamId || s.team_id === filterTeamId || s.academy_group_id === filterTeamId);

  const filteredFixtures = fixtures.filter(f => {
    if (isClub) return f.team_id && scopeTeamIds.includes(f.team_id);
    return f.academy_group_id && scopeGroupIds.includes(f.academy_group_id);
  }).filter(f => !filterTeamId || f.team_id === filterTeamId || f.academy_group_id === filterTeamId);

  const filteredEvents = events.filter(ev => {
    if (isClub) return ev.team_id && scopeTeamIds.includes(ev.team_id);
    return ev.academy_group_id && scopeGroupIds.includes(ev.academy_group_id);
  }).filter(ev => !filterTeamId || ev.team_id === filterTeamId || ev.academy_group_id === filterTeamId);

  // Build calendar items
  const allCalendarItems = [
    ...filteredTraining.map(s => ({ date: s.date?.split("T")[0], type: "training", title: s.title, time: s.start_time, venue: s.venue, id: s.id })),
    ...filteredFixtures.map(f => ({ date: f.match_date?.split("T")[0], type: "match", title: `${f.home_team} vs ${f.away_team}`, time: f.match_time, venue: f.venue, id: f.id })),
    ...filteredEvents.map(ev => ({ date: ev.date?.split("T")[0], type: ev.type || "other", title: ev.title, time: ev.start_time || "", venue: ev.location || "", id: ev.id })),
  ];

  // Calendar rendering
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const getEventsForDay = (d) => allCalendarItems.filter(e => e.date === getDateStr(d));

  const selectedDateStr = selectedDay ? getDateStr(selectedDay) : null;
  const selectedEvents = selectedDay ? allCalendarItems.filter(e => e.date === selectedDateStr) : [];

  // Stats
  const scopedOpponents = opponents.filter(o => isClub ? o.team_type === "First Team" : o.team_type === "Academy");
  const scopedVenues = facilities.filter(f => isClub ? f.team_type === "First Team" : f.team_type === "Academy");
  const upcomingFixtures = filteredFixtures.filter(f => f.match_date && new Date(f.match_date) >= today).length;
  const totalTraining = filteredTraining.length;

  // Filter options
  const filterOptions = isClub ? teams : academyGroups;

  return (
    <div data-testid={`${scope}-dashboard`}>
      {/* Header with stats */}
      <div className="mb-6">
        <h2 className="font-['Bebas_Neue'] text-3xl tracking-wide" style={{ color: accentColor }}>
          {isClub ? "Σύλλογος" : "Ακαδημία"} — Πίνακας Ελέγχου
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="admin-card p-4 text-center">
            <p className="text-2xl font-['Bebas_Neue']" style={{ color: accentColor }}>{isClub ? teams.length : academyGroups.length}</p>
            <p className="text-xs text-zinc-500">Ομάδες</p>
          </div>
          <div className="admin-card p-4 text-center">
            <p className="text-2xl font-['Bebas_Neue']" style={{ color: accentColor }}>{upcomingFixtures}</p>
            <p className="text-xs text-zinc-500">Επερχόμενοι Αγώνες</p>
          </div>
          <div className="admin-card p-4 text-center">
            <p className="text-2xl font-['Bebas_Neue']" style={{ color: accentColor }}>{totalTraining}</p>
            <p className="text-xs text-zinc-500">Προπονήσεις</p>
          </div>
          <div className="admin-card p-4 text-center">
            <p className="text-2xl font-['Bebas_Neue']" style={{ color: accentColor }}>{scopedOpponents.length}</p>
            <p className="text-xs text-zinc-500">Αντίπαλοι</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-zinc-500" />
        <select value={filterTeamId} onChange={e => setFilterTeamId(e.target.value)} className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-1.5 text-sm text-white focus:outline-none" style={{ borderColor: filterTeamId ? accentColor : undefined }} data-testid={`${scope}-filter`}>
          <option value="">Όλες οι ομάδες</option>
          {filterOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {/* Calendar */}
      <div className="admin-card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="admin-icon-btn"><ChevronLeft size={18} /></button>
          <h3 className="font-['Bebas_Neue'] text-xl text-white">{MONTHS_GR[month]} {year}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="admin-icon-btn"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-px">
          {DAYS_GR.map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-semibold text-zinc-500 uppercase">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="h-20" />;
            const dayEvents = getEventsForDay(day);
            const isToday = getDateStr(day) === todayStr;
            const isSelected = selectedDay === day;
            return (
              <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-20 p-1 border border-[#1a1a1a] rounded cursor-pointer transition-colors ${
                  isSelected ? 'bg-white/5 border-[' + accentColor + ']/40' : 'hover:bg-white/[0.02]'
                }`}>
                <span className={`text-[11px] font-medium block ${isToday ? 'text-[#F5A623] font-bold' : 'text-zinc-400'}`}>{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev, j) => {
                    const c = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                    return <div key={j} className={`h-1.5 rounded-full ${c.dot}`} title={ev.title} />;
                  })}
                  {dayEvents.length > 3 && <span className="text-[8px] text-zinc-500">+{dayEvents.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-[#1a1a1a]">
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-blue-500" /> Προπόνηση</span>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-[#F5A623]" /> Αγώνας</span>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-purple-500" /> Συνάντηση</span>
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="mt-4 admin-card p-5">
          <h4 className="text-sm font-medium text-white mb-3">{selectedDay} {MONTHS_GR[month]} {year}</h4>
          {selectedEvents.length === 0 ? (
            <p className="text-zinc-500 text-sm">Δεν υπάρχουν εκδηλώσεις αυτή την ημέρα.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => {
                const c = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                return (
                  <div key={i} className={`p-3 rounded-lg border ${c.bg} ${c.border}`}>
                    <div className="flex items-center gap-2">
                      {ev.type === "match" ? <Trophy size={14} className={c.text} /> : ev.type === "training" ? <Dumbbell size={14} className={c.text} /> : <CalendarIcon size={14} className={c.text} />}
                      <span className={`text-sm font-medium ${c.text}`}>{ev.title}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-zinc-500">
                      {ev.time && <span className="flex items-center gap-1"><Clock size={9} /> {ev.time}</span>}
                      {ev.venue && <span className="flex items-center gap-1"><MapPin size={9} /> {ev.venue}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events list */}
      <div className="mt-4 admin-card p-5">
        <h4 className="text-sm font-medium text-white mb-3">Επερχόμενες Εκδηλώσεις</h4>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {allCalendarItems
            .filter(e => e.date && e.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 15)
            .map((ev, i) => {
              const c = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className={`w-1 h-8 rounded-full ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{ev.title}</p>
                    <div className="flex gap-2 text-[10px] text-zinc-500">
                      <span>{new Date(ev.date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}</span>
                      {ev.time && <span>{ev.time}</span>}
                      {ev.venue && <span>{ev.venue}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          {allCalendarItems.filter(e => e.date && e.date >= todayStr).length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-4">Δεν υπάρχουν επερχόμενες εκδηλώσεις</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionDashboard;
