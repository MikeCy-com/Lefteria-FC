import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check, X as XIcon, HelpCircle, ExternalLink } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DAYS_GR = ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"];
const MONTHS_GR = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
  "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];

const SchedulePage = () => {
  const { getHeaders, user } = useMobileAuth();
  const [events, setEvents] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [myAvailability, setMyAvailability] = useState({});
  const [submitting, setSubmitting] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const role = user?.role;
      const endpoint = role === "coach" ? "coach" : role === "player" ? "player" : role === "management" ? "management" : "parent";
      const [dashRes, availRes] = await Promise.all([
        axios.get(`${API}/mobile/${endpoint}/dashboard`, { headers: getHeaders() }),
        axios.get(`${API}/mobile/my-availability`, { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);
      setEvents(dashRes.data.events || []);
      setFixtures(dashRes.data.fixtures || []);
      // Build availability map: {eventId: status}
      const avMap = {};
      (availRes.data || []).forEach(a => { avMap[a.event_id] = a.status; });
      setMyAvailability(avMap);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAvailability = async (eventId, playerId, status) => {
    setSubmitting(eventId);
    try {
      await axios.post(`${API}/mobile/availability`, {
        event_id: eventId,
        player_id: playerId,
        status: status,
      }, { headers: getHeaders() });
      setMyAvailability(prev => ({ ...prev, [eventId]: status }));
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

  // Get the player_id for availability
  const getPlayerId = () => {
    if (user?.role === "player") return user.linked_player_id;
    if (user?.role === "parent" && user.children_ids?.length) return user.children_ids[0];
    if (user?.linked_player_id) return user.linked_player_id;
    return null;
  };
  const playerId = getPlayerId();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const allItems = [
    ...events.map(e => ({ ...e, sortDate: e.date })),
    ...fixtures.filter(f => !events.some(e => e.id === f.id)).map(f => ({
      ...f,
      title: f.title || `vs ${f.opponent || f.away_team}`,
      date: f.match_date,
      start_time: f.match_time,
      location: f.venue,
      event_type: "match",
      type: "fixture",
      sortDate: f.match_date,
    })),
  ].sort((a, b) => (a.sortDate || "").localeCompare(b.sortDate || ""));

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const dayItems = allItems.filter(item => (item.date || item.match_date || "").startsWith(selectedDateStr));

  const hasItems = (day) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return allItems.some(item => (item.date || item.match_date || "").startsWith(ds));
  };

  const typeColors = {
    training: { bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-500", text: "text-blue-400" },
    match: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500", text: "text-emerald-400" },
    meeting: { bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-500", text: "text-purple-400" },
    fixture: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500", text: "text-emerald-400" },
    other: { bg: "bg-zinc-500/10", border: "border-zinc-500/30", dot: "bg-zinc-500", text: "text-zinc-400" },
  };

  const statusColors = {
    going: { bg: "bg-emerald-500", text: "Πάω" },
    not_going: { bg: "bg-red-500", text: "Δεν πάω" },
  };

  if (loading) return <div className="px-4 py-12 text-center text-zinc-500">Φόρτωση...</div>;

  return (
    <div className="px-4 pb-20" data-testid="schedule-page">
      {/* Month Navigator */}
      <div className="flex items-center justify-between py-3">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 text-zinc-400"><ChevronLeft size={20} /></button>
        <h2 className="text-white font-medium">{MONTHS_GR[month]} {year}</h2>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 text-zinc-400"><ChevronRight size={20} /></button>
      </div>

      {/* Mini Calendar */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {DAYS_GR.map(d => <div key={d} className="text-center text-[10px] text-zinc-600 py-1">{d}</div>)}
        {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = ds === selectedDateStr;
          const isToday = ds === new Date().toISOString().split("T")[0];
          const has = hasItems(day);
          return (
            <button key={day} onClick={() => setSelectedDate(new Date(year, month, day))}
              className={`h-9 rounded-lg text-xs font-medium relative ${
                isSelected ? "bg-emerald-500 text-white" : isToday ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5"
              }`}>
              {day}
              {has && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>

      {/* Day Details */}
      <h3 className="text-white font-medium text-sm mb-2">
        {selectedDate.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long" })}
      </h3>

      {dayItems.length === 0 ? (
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-8 text-center text-zinc-600 text-sm">
          Δεν υπάρχουν γεγονότα
        </div>
      ) : (
        <div className="space-y-2">
          {dayItems.map(item => {
            const c = typeColors[item.event_type || item.type] || typeColors.other;
            const avail = myAvailability[item.id];
            const isFuture = (item.date || item.match_date || "") >= new Date().toISOString().split("T")[0];
            return (
              <div key={item.id} className={`${c.bg} border ${c.border} rounded-xl px-4 py-3`} data-testid={`event-${item.id}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-12 rounded-full ${c.dot}`} />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{item.title || `vs ${item.opponent || item.away_team}`}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                      {(item.start_time || item.match_time) && <span className="flex items-center gap-1"><Clock size={10} /> {item.start_time || item.match_time}</span>}
                      {item.arrival_time && <span className="flex items-center gap-1"><Clock size={10} /> Άφιξη: {item.arrival_time}</span>}
                      {(item.location || item.venue) && <span className="flex items-center gap-1"><MapPin size={10} /> {item.location || item.venue}</span>}
                      {item.location_url && <a href={item.location_url} target="_blank" rel="noreferrer" className="text-blue-400 flex items-center gap-0.5"><ExternalLink size={9} /> Χάρτης</a>}
                    </div>
                  </div>
                </div>
                {/* Going / Not Going buttons for parents and players */}
                {playerId && isFuture && (user?.role === "parent" || user?.role === "player") && (
                  <div className="flex gap-2 mt-3 ml-4" data-testid={`availability-${item.id}`}>
                    <button
                      onClick={() => handleAvailability(item.id, playerId, "going")}
                      disabled={submitting === item.id}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        avail === "going"
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-[#1a1a1a] text-zinc-400 border border-[#333] hover:border-emerald-500/50"
                      }`}
                      data-testid={`going-btn-${item.id}`}>
                      <Check size={14} /> Πάω
                    </button>
                    <button
                      onClick={() => handleAvailability(item.id, playerId, "not_going")}
                      disabled={submitting === item.id}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        avail === "not_going"
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                          : "bg-[#1a1a1a] text-zinc-400 border border-[#333] hover:border-red-500/50"
                      }`}
                      data-testid={`not-going-btn-${item.id}`}>
                      <XIcon size={14} /> Δεν πάω
                    </button>
                    {avail && (
                      <span className={`flex items-center text-[10px] ml-1 ${avail === "going" ? "text-emerald-400" : "text-red-400"}`}>
                        {avail === "going" ? <Check size={10} /> : <XIcon size={10} />}
                        {statusColors[avail]?.text}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming List */}
      <h3 className="text-white font-medium text-sm mt-6 mb-2">Επερχόμενα</h3>
      <div className="space-y-2">
        {allItems.filter(i => (i.date || i.match_date || "") >= new Date().toISOString().split("T")[0]).slice(0, 10).map(item => {
          const c = typeColors[item.event_type || item.type] || typeColors.other;
          const avail = myAvailability[item.id];
          return (
            <div key={`up-${item.id}`} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-10 rounded-full ${c.dot}`} />
                <div className="flex-1">
                  <p className="text-sm text-white">{item.title || `vs ${item.opponent || item.away_team}`}</p>
                  <span className="text-xs text-zinc-500">
                    {new Date((item.date || item.match_date) + "T00:00:00").toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
                    {(item.start_time || item.match_time) && ` - ${item.start_time || item.match_time}`}
                  </span>
                </div>
                {avail && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${avail === "going" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {statusColors[avail]?.text}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SchedulePage;
