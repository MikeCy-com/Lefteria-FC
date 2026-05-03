import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import AttendanceView from "../components/AttendanceView";
import { noAccent } from "../components/SharedComponents";
import {
  Users, Calendar, Clock, ChevronRight, ChevronDown, Bell,
  Trophy, Shield, MapPin, ArrowLeft, Zap, User,
  Euro, TrendingUp, ClipboardList, FileText, CheckCircle, AlertCircle,
  Briefcase, BarChart3, ExternalLink, ClipboardCheck, Dumbbell
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;
const parseDate = (d) => { if (!d) return null; const s = d.includes("T") ? d : d + "T00:00:00"; const dt = new Date(s); return isNaN(dt.getTime()) ? null : dt; };
const fmtDate = (d, opts) => { const s = d?.toLocaleDateString("el-GR", opts); return s ? noAccent(s) : s; };

const ManagementDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ events: true, roster: false });

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/mobile/management/dashboard`, { headers: getHeaders() });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
      <Zap size={40} className="mb-3 text-zinc-700" />
      <p className="text-sm">Σφαλμα φορτωσης</p>
    </div>
  );

  const allGroups = [...(data.teams || []), ...(data.groups || [])];
  const fin = data.financial || {};
  const totalRevenue = fin.total_revenue || 0;
  const totalPending = fin.total_pending || 0;
  const totalOverdue = fin.total_overdue || 0;
  const registrations = data.registrations || [];
  const pendingRegs = registrations.filter(r => r.status === "pending" || !r.status);
  const approvedRegs = registrations.filter(r => r.status === "approved");

  // ===================== ATTENDANCE VIEW =====================
  if (view === "attendance" && selectedEvent) {
    return (
      <AttendanceView
        eventId={selectedEvent.id}
        eventType={selectedEvent.event_type || "event"}
        eventTitle={selectedEvent.title}
        onBack={() => setView("event")}
      />
    );
  }

  // ===================== EVENT DETAIL =====================
  if (view === "event" && selectedEvent) {
    const ev = selectedEvent;
    return (
      <div className="px-4 pt-4 pb-4" data-testid="mgmt-event-detail">
        <button onClick={() => { setView("home"); setSelectedEvent(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-event">
          <ArrowLeft size={16} /> Πισω
        </button>
        <div className={`rounded-2xl overflow-hidden border ${ev.event_type === "match" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-blue-500/20 bg-blue-500/[0.04]"}`}>
          <div className="px-5 py-4">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${ev.event_type === "match" ? "text-emerald-400" : "text-blue-400"}`}>
              {ev.event_type === "match" ? "Αγωνας" : "Γεγονος"}
            </span>
            <h2 className="text-xs font-bold text-white mt-1">{noAccent(ev.title) || "Γεγονος"}</h2>
            <div className="mt-4 space-y-2.5">
              {ev.date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">{fmtDate(parseDate(ev.date), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              )}
              {(ev.start_time || ev.match_time) && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">Εναρξη: {ev.start_time || ev.match_time}</span>
                </div>
              )}
              {(ev.location || ev.venue) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">{ev.location || ev.venue}</span>
                </div>
              )}
            </div>
          </div>
          {/* Attendance Button */}
          <div className="px-5 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => setView("attendance")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5A623] text-black text-sm font-semibold shadow-lg shadow-[#F5A623]/20 hover:bg-[#e6951a] transition-colors"
              data-testid="open-attendance-btn"
            >
              <ClipboardCheck size={16} />
              Παρουσιες
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== TEAM DETAIL =====================
  if (view === "team" && selectedGroup) {
    return (
      <div className="px-4 pt-4 pb-4" data-testid="mgmt-team-detail">
        <button onClick={() => { setView("home"); setSelectedGroup(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-team">
          <ArrowLeft size={16} /> Πισω
        </button>
        {selectedGroup.banner_url && (
          <div className="h-28 rounded-2xl overflow-hidden mb-3 border border-white/[0.06]">
            <img src={imgUrl(selectedGroup.banner_url)} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="mb-5">
          <h1 className="text-sm font-bold text-white">{noAccent(selectedGroup.name)}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {selectedGroup.age_range && <span className="text-[10px] text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full font-semibold">{selectedGroup.age_range}</span>}
            {selectedGroup.type && <span className="text-[10px] text-zinc-400">{selectedGroup.type}</span>}
          </div>
        </div>
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-xs text-zinc-400">Λεπτομερειες ομαδας διαθεσιμες στο CMS</p>
        </div>
      </div>
    );
  }

  // ===================== REGISTRATIONS DETAIL =====================
  if (view === "registrations") {
    return (
      <div className="px-4 pt-4 pb-4" data-testid="mgmt-registrations-detail">
        <button onClick={() => setView("home")} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-registrations">
          <ArrowLeft size={16} /> Πισω
        </button>
        <h1 className="text-sm font-bold text-white mb-4">Εγγραφες</h1>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-[#F5A623]">{pendingRegs.length}</p>
            <p className="text-[10px] text-zinc-500">Εκκρεμεις</p>
          </div>
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{approvedRegs.length}</p>
            <p className="text-[10px] text-zinc-500">Εγκεκριμενες</p>
          </div>
        </div>
        <div className="space-y-2">
          {registrations.map((reg, i) => (
            <div key={reg.id || i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3" data-testid={`mgmt-reg-${i}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                reg.status === "approved" ? "bg-emerald-500/10" : "bg-[#F5A623]/10"
              }`}>
                <User size={15} className={reg.status === "approved" ? "text-emerald-400" : "text-[#F5A623]"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{reg.player_name || reg.child_first_name || "—"}</p>
                <p className="text-[10px] text-zinc-500">{reg.created_at && noAccent(new Date(reg.created_at).toLocaleDateString("el-GR"))}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                reg.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-[#F5A623]/15 text-[#F5A623]"
              }`}>
                {reg.status === "approved" ? "Εγκριθηκε" : "Εκκρεμει"}
              </span>
            </div>
          ))}
          {registrations.length === 0 && (
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 text-center">
              <ClipboardList size={28} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Δεν υπαρχουν εγγραφες</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===================== HOME DASHBOARD =====================
  return (
    <div className="px-4 pt-5 pb-4" data-testid="management-dashboard-home">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F5A623] to-amber-700 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[#F5A623]/20">
            {(user?.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-zinc-500">Διοικηση</p>
            <h1 className="text-xs font-bold text-white leading-tight">{noAccent(user?.name) || "Manager"}</h1>
          </div>
        </div>
        <button className="w-9 h-9 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-center" data-testid="mgmt-notifications-btn">
          <Bell size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { label: "Παικτες", value: data.player_count || 0, icon: Users, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
          { label: "Ομαδες", value: allGroups.length, icon: Shield, color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
          { label: "Εγγραφες", value: pendingRegs.length, icon: ClipboardList, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", sub: "εκκρεμεις" },
          { label: "Εσοδα", value: `€${totalRevenue.toLocaleString()}`, icon: Euro, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3.5" data-testid={`mgmt-stat-${stat.label}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-sm font-bold text-white leading-none">{stat.value}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{stat.label}{stat.sub && <span className="text-zinc-600"> · {stat.sub}</span>}</p>
          </div>
        ))}
      </div>

      {/* Financial Overview */}
      <div className="mb-5">
        <SectionHeader title="Οικονομικη Επισκοπηση" />
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Εσοδα", value: totalRevenue, color: "text-emerald-400" },
              { label: "Εκκρεμη", value: totalPending, color: "text-[#F5A623]" },
              { label: "Ληξιπροθεσμα", value: totalOverdue, color: "text-red-400" },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-base font-bold ${item.color}`}>&euro;{item.value.toLocaleString()}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          {totalOverdue > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-[10px] text-red-400">{`€${totalOverdue.toLocaleString()}`} ληξιπροθεσμα</p>
            </div>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="mb-5">
        <SectionHeader title="Ομαδες" />
        <div className="space-y-2">
          {allGroups.map(g => (
            <button
              key={g.id}
              onClick={() => { setSelectedGroup(g); setView("team"); }}
              className="w-full bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-[#F5A623]/20 transition-all group"
              data-testid={`mgmt-group-${g.id}`}
            >
              {g.banner_url ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={imgUrl(g.banner_url)} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                  <Shield size={18} className="text-[#F5A623]" />
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-white group-hover:text-[#F5A623] transition-colors truncate">{noAccent(g.name)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {g.age_range && <span className="text-[10px] text-[#F5A623] bg-[#F5A623]/10 px-1.5 py-0.5 rounded font-medium">{g.age_range}</span>}
                  {g.type && <span className="text-[10px] text-zinc-500">{g.type}</span>}
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#F5A623] transition-colors flex-shrink-0" />
            </button>
          ))}
          {allGroups.length === 0 && (
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 text-center">
              <Shield size={28} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Δεν υπαρχουν ομαδες</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="mb-5">
        <SectionHeader title="Προσφατες Εγγραφες" action="Ολες" onAction={() => setView("registrations")} />
        <div className="space-y-2">
          {registrations.slice(0, 3).map((reg, i) => (
            <div key={reg.id || i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3" data-testid={`mgmt-recent-reg-${i}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                reg.status === "approved" ? "bg-emerald-500/10" : "bg-[#F5A623]/10"
              }`}>
                <User size={15} className={reg.status === "approved" ? "text-emerald-400" : "text-[#F5A623]"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{reg.player_name || reg.child_first_name || "—"}</p>
                <p className="text-[10px] text-zinc-500">{reg.created_at && noAccent(new Date(reg.created_at).toLocaleDateString("el-GR"))}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                reg.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-[#F5A623]/15 text-[#F5A623]"
              }`}>
                {reg.status === "approved" ? "OK" : "Νεα"}
              </span>
            </div>
          ))}
          {registrations.length === 0 && (
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 text-center">
              <ClipboardList size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Δεν υπαρχουν εγγραφες</p>
            </div>
          )}
        </div>
      </div>

      {/* Training Sessions */}
      {(data.training_sessions || []).length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Προπονησεις" />
          <div className="space-y-2">
            {data.training_sessions.slice(0, 3).map(session => (
              <button
                key={session.id}
                onClick={() => { setSelectedEvent({ ...session, event_type: "training", title: session.title || "Προπονηση" }); setView("event"); }}
                className="w-full text-left bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-[#F5A623]/20 transition-colors"
                data-testid={`mgmt-training-${session.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{noAccent(session.title) || "Προπονηση"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {session.date && fmtDate(parseDate(session.date), { weekday: "short", day: "numeric", month: "short" })}
                    {session.start_time && ` · ${session.start_time}`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {(data.events || []).length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Προγραμμα" action="Ολα" onAction={() => onTabChange("calendar")} />
          <div className="space-y-2">
            {data.events.slice(0, 3).map(ev => (
              <button
                key={ev.id}
                onClick={() => { setSelectedEvent(ev); setView("event"); }}
                className="w-full text-left bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-[#F5A623]/20 transition-colors"
                data-testid={`mgmt-event-${ev.id}`}
              >
                <div className={`w-1 h-10 rounded-full ${ev.event_type === "match" ? "bg-emerald-500" : "bg-blue-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{noAccent(ev.title) || "Γεγονος"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {ev.date && fmtDate(parseDate(ev.date), { weekday: "short", day: "numeric", month: "short" })}
                    {(ev.start_time || ev.match_time) && ` · ${ev.start_time || ev.match_time}`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {(data.announcements || []).length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Ανακοινωσεις" />
          <div className="space-y-2">
            {data.announcements.slice(0, 3).map((a, i) => (
              <div key={a.id || i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3" data-testid={`mgmt-announcement-${i}`}>
                <p className="text-xs font-medium text-white">{noAccent(a.title)}</p>
                {a.content && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{a.content}</p>}
                {a.created_at && <p className="text-[9px] text-zinc-600 mt-1.5">{noAccent(new Date(a.created_at).toLocaleDateString("el-GR"))}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-2.5">
    <h2 className="text-xs font-semibold text-white uppercase tracking-wide">{title}</h2>
    {action && (
      <button onClick={onAction} className="text-[10px] text-[#F5A623] font-medium">{action}</button>
    )}
  </div>
);

export default ManagementDashboard;
