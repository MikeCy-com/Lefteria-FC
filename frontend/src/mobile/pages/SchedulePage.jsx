import { useState, useEffect } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check, X as XIcon, HelpCircle } from "lucide-react";

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

  useEffect(() => {
    const role = user?.role;
    const endpoint = role === "coach" ? "coach" : role === "player" ? "player" : role === "management" ? "management" : "parent";
    axios.get(`${API}/mobile/${endpoint}/dashboard`, { headers: getHeaders() })
      .then(res => {
        setEvents(res.data.events || []);
        setFixtures(res.data.fixtures || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getHeaders, user]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const allItems = [
    ...events.map(e => ({ ...e, type: "event", sortDate: e.date })),
    ...fixtures.map(f => ({ ...f, type: "fixture", sortDate: f.match_date })),
  ].sort((a, b) => (a.sortDate || "").localeCompare(b.sortDate || ""));

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const dayItems = allItems.filter(item => (item.date || item.match_date || "").startsWith(selectedDateStr));

  const hasItems = (day) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return allItems.some(item => (item.date || item.match_date || "").startsWith(ds));
  };

  const typeColors = { training: "bg-blue-500", match: "bg-emerald-500", meeting: "bg-purple-500", fixture: "bg-emerald-500", other: "bg-zinc-500" };

  return (
    <div className="px-4 pb-20" data-testid="schedule-page">
      {/* Month Navigator */}
      <div className="flex items-center justify-between py-3">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 text-zinc-400"><ChevronLeft size={20} /></button>
        <h2 className="text-white font-medium">{MONTHS_GR[month]} {year}</h2>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 text-zinc-400"><ChevronRight size={20} /></button>
      </div>

      {/* Mini Calendar */}
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-3 mb-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS_GR.map(d => <div key={d} className="text-center text-[10px] text-zinc-600 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);
            const isToday = new Date().toISOString().split("T")[0] === dateObj.toISOString().split("T")[0];
            const isSelected = selectedDate.toISOString().split("T")[0] === dateObj.toISOString().split("T")[0];
            const has = hasItems(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateObj)}
                className={`relative h-9 rounded-lg text-sm transition-colors ${
                  isSelected ? "bg-[#F5A623] text-black font-bold" :
                  isToday ? "bg-[#F5A623]/20 text-[#F5A623]" :
                  "text-zinc-400 hover:bg-[#1a1a1a]"
                }`}
              >
                {day}
                {has && !isSelected && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F5A623]" />}
              </button>
            );
          })}
        </div>
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
          {dayItems.map(item => (
            <div key={item.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`w-1 h-12 rounded-full ${typeColors[item.event_type || item.type] || typeColors.other}`} />
              <div className="flex-1">
                <p className="text-sm text-white">{item.title || `vs ${item.opponent || item.away_team}`}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  {item.start_time && <><Clock size={10} /><span>{item.start_time}</span></>}
                  {item.location && <><MapPin size={10} /><span>{item.location}</span></>}
                  {item.type === "fixture" && item.home_score !== undefined && (
                    <span className="text-white font-bold ml-2">{item.home_score} - {item.away_score}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming List */}
      <h3 className="text-white font-medium text-sm mt-6 mb-2">Επερχόμενα</h3>
      <div className="space-y-2">
        {allItems.filter(i => (i.date || i.match_date || "") >= new Date().toISOString().split("T")[0]).slice(0, 10).map(item => (
          <div key={item.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`w-1 h-10 rounded-full ${typeColors[item.event_type || item.type] || typeColors.other}`} />
            <div className="flex-1">
              <p className="text-sm text-white">{item.title || `vs ${item.opponent || item.away_team}`}</p>
              <span className="text-xs text-zinc-500">
                {new Date((item.date || item.match_date) + "T00:00:00").toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
                {item.start_time && ` • ${item.start_time}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchedulePage;
