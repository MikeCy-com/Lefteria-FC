import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import AttendanceView from "../components/AttendanceView";
import {
  Users, Calendar, Clock, ChevronRight, ChevronDown,
  CheckCircle, RefreshCw, Trophy, Star, Check, X as XIcon,
  MapPin, ExternalLink, Shield, User, TrendingUp, Target,
  ArrowLeft, Briefcase, Bell, Activity, Zap, Award, ClipboardCheck, Dumbbell
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;
const parseDate = (d) => { if (!d) return null; const s = d.includes("T") ? d : d + "T00:00:00"; const dt = new Date(s); return isNaN(dt.getTime()) ? null : dt; };

const ParentDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [myAvailability, setMyAvailability] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ events: true, roster: false, staff: false, announcements: false });

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, availRes] = await Promise.all([
        axios.get(`${API}/mobile/parent/dashboard`, { headers: getHeaders() }),
        axios.get(`${API}/mobile/my-availability`, { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);
      setData(dashRes.data);
      const avMap = {};
      (availRes.data || []).forEach(a => { avMap[a.event_id] = a.status; });
      setMyAvailability(avMap);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAvailability = async (eventId, playerId, status) => {
    setSubmitting(eventId + status);
    try {
      await axios.post(`${API}/mobile/availability`, { event_id: eventId, player_id: playerId, status }, { headers: getHeaders() });
      setMyAvailability(prev => ({ ...prev, [eventId]: status }));
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

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

  const myKidIds = new Set((data.children || []).map(c => c.id));
  const getPlayerId = () => {
    if (selectedPlayer?.id && myKidIds.has(selectedPlayer.id)) return selectedPlayer.id;
    if (data?.children?.[0]) return data.children[0].id;
    return null;
  };

  const buildEvents = (groupId) => {
    const fixtures = (data.fixtures || []).filter(f => f.academy_group_id === groupId).map(f => ({
      ...f, event_type: "match", title: `${f.home_team || "—"} vs ${f.away_team || "—"}`,
      date: f.match_date, start_time: f.match_time, location: f.venue, location_url: f.location_url,
    }));
    const trainings = (data.training_sessions || []).filter(t => t.academy_group_id === groupId).map(t => ({
      ...t, event_type: "training", title: t.title || "Προπονηση",
    }));
    return [...fixtures, ...trainings].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  };

  // ===================== ATTENDANCE VIEW =====================
  if (view === "attendance" && selectedEvent) {
    const kidIds = (data?.children || []).map(c => c.id);
    return (
      <AttendanceView
        eventId={selectedEvent.id}
        eventType={selectedEvent.event_type || "event"}
        eventTitle={selectedEvent.title}
        onBack={() => setView("event")}
        playerIds={kidIds}
      />
    );
  }

  // ===================== EVENT DETAIL =====================
  if (view === "event" && selectedEvent) {
    const ev = selectedEvent;
    const players = data.group_players?.[selectedGroup?.id] || data.children || [];
    const playerId = getPlayerId();
    const avail = myAvailability[ev.id];
    const isFuture = (ev.date || ev.match_date || "") >= new Date().toISOString().split("T")[0];

    return (
      <div className="px-4 pt-4 pb-4" data-testid="event-detail-view">
        <button onClick={() => { setView(selectedGroup ? "team" : "home"); setSelectedEvent(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-event">
          <ArrowLeft size={16} /> Πισω
        </button>

        <div className={`rounded-2xl overflow-hidden border ${ev.event_type === "match" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-blue-500/20 bg-blue-500/[0.04]"}`}>
          <div className="px-5 py-4">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${ev.event_type === "match" ? "text-emerald-400" : "text-blue-400"}`}>
              {ev.event_type === "match" ? "Αγωνας" : "Προπονηση"}
            </span>
            <h2 className="text-lg font-bold text-white mt-1">{ev.title}</h2>

            <div className="mt-4 space-y-2.5">
              {ev.date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">{parseDate(ev.date)?.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              )}
              {(ev.start_time || ev.match_time) && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">Εναρξη: {ev.start_time || ev.match_time}</span>
                  {ev.arrival_time && <span className="text-zinc-500 text-xs ml-2">Αφιξη: {ev.arrival_time}</span>}
                </div>
              )}
              {(ev.location || ev.venue) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">{ev.location || ev.venue}</span>
                  {ev.location_url && (
                    <a href={ev.location_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs ml-1 flex items-center gap-0.5"><ExternalLink size={10} /> Χαρτης</a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          {playerId && isFuture && (
            <div className="px-5 py-4 border-t border-white/[0.06]" data-testid="event-availability">
              <p className="text-xs text-zinc-400 mb-3 font-medium">Θα εισαι εκει;</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAvailability(ev.id, playerId, "going")}
                  disabled={!!submitting}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    avail === "going" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-[#1a1a1a] text-zinc-400 border border-white/[0.08]"
                  }`}
                  data-testid="event-going-btn"
                >
                  <Check size={16} /> Παω
                </button>
                <button
                  onClick={() => handleAvailability(ev.id, playerId, "not_going")}
                  disabled={!!submitting}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    avail === "not_going" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-[#1a1a1a] text-zinc-400 border border-white/[0.08]"
                  }`}
                  data-testid="event-not-going-btn"
                >
                  <XIcon size={16} /> Δεν παω
                </button>
              </div>
            </div>
          )}

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

  // ===================== PLAYER PROFILE =====================
  if (view === "player" && selectedPlayer) {
    const p = selectedPlayer;
    const isMyKid = myKidIds.has(p.id);
    const stats = p.statistics || {};

    return (
      <div className="px-4 pt-4 pb-4" data-testid="player-profile-view">
        <button onClick={() => { setView("team"); setSelectedPlayer(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-player">
          <ArrowLeft size={16} /> Πισω
        </button>

        <div className="flex flex-col items-center mb-6">
          {p.image_url ? (
            <img src={imgUrl(p.image_url)} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#F5A623]/30" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
              <User size={28} className="text-zinc-600" />
            </div>
          )}
          <h2 className="text-lg font-bold text-white mt-3">{p.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full font-medium">#{p.number}</span>
            <span className="text-xs text-zinc-400">{p.position}</span>
          </div>
        </div>

        {isMyKid && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: "Γκολ", value: stats.goals || 0, icon: Target, color: "text-[#F5A623]", bg: "bg-[#F5A623]/10" },
              { label: "Ασιστ", value: stats.assists || 0, icon: Star, color: "text-blue-400", bg: "bg-blue-500/10" },
              { label: "Λεπτα", value: stats.minutes_played || 0, icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 text-center">
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon size={15} className={s.color} />
                </div>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4 space-y-3">
          {p.date_of_birth && <InfoRow label="Ημ. Γεννησης" value={p.date_of_birth} />}
          {p.nationality && <InfoRow label="Εθνικοτητα" value={p.nationality} />}
          {p.height && <InfoRow label="Υψος" value={p.height} />}
          {p.weight && <InfoRow label="Βαρος" value={p.weight} />}
          {isMyKid && p.parent_name && <InfoRow label="Γονεας" value={p.parent_name} />}
        </div>
      </div>
    );
  }

  // ===================== TEAM DETAIL =====================
  if (view === "team" && selectedGroup) {
    const events = buildEvents(selectedGroup.id);
    const groupPlayers = data.group_players?.[selectedGroup.id] || [];
    const groupStaff = data.group_staff?.[selectedGroup.id] || [];
    const futureEvents = events.filter(e => (e.date || "") >= new Date().toISOString().split("T")[0]);
    const announcements = (data.announcements || []).filter(a => !a.academy_group_id || a.academy_group_id === selectedGroup.id);

    const sections = [
      { key: "events", label: "Επομενα Γεγονοτα", icon: Calendar, count: futureEvents.length, color: "text-emerald-400" },
      { key: "roster", label: "Ροστερ", icon: Users, count: groupPlayers.length, color: "text-[#F5A623]" },
      { key: "staff", label: "Προπονητες & Staff", icon: Briefcase, count: groupStaff.length, color: "text-blue-400" },
      { key: "announcements", label: "Ανακοινωσεις", icon: Bell, count: announcements.length, color: "text-purple-400" },
    ];

    return (
      <div className="px-4 pt-4 pb-4" data-testid="team-detail-view">
        <button onClick={() => { setView("home"); setSelectedGroup(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-team">
          <ArrowLeft size={16} /> Πισω
        </button>

        {/* Team Header */}
        {selectedGroup.banner_url && (
          <div className="h-28 rounded-2xl overflow-hidden mb-3 border border-white/[0.06]">
            <img src={imgUrl(selectedGroup.banner_url)} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-white">{selectedGroup.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full font-semibold">{selectedGroup.age_range}</span>
            {selectedGroup.coach_name && <span className="text-[10px] text-zinc-400">Προπ. {selectedGroup.coach_name}</span>}
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-2">
          {sections.map(sec => (
            <div key={sec.key} className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection(sec.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5"
                data-testid={`section-${sec.key}`}
              >
                <div className={`w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center`}>
                  <sec.icon size={16} className={sec.color} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-white">{sec.label}</span>
                  <span className="text-[10px] text-zinc-500 ml-2">({sec.count})</span>
                </div>
                {expandedSections[sec.key] ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
              </button>

              {expandedSections[sec.key] && (
                <div className="px-4 pb-3 border-t border-white/[0.04]">
                  {sec.key === "events" && (
                    <div className="pt-2 space-y-2">
                      {futureEvents.length === 0 ? (
                        <p className="text-zinc-600 text-xs py-3 text-center">Δεν υπαρχουν επομενα γεγονοτα</p>
                      ) : futureEvents.slice(0, 5).map(ev => (
                        <button key={ev.id} onClick={() => { setSelectedEvent(ev); setView("event"); }}
                          className="w-full text-left bg-white/[0.02] rounded-xl p-3 flex items-center gap-3" data-testid={`event-${ev.id}`}>
                          <div className={`w-1 h-10 rounded-full ${ev.event_type === "match" ? "bg-emerald-500" : "bg-blue-500"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{ev.title}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {ev.date && parseDate(ev.date)?.toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
                              {ev.start_time && ` · ${ev.start_time}`}
                            </p>
                          </div>
                          {myAvailability[ev.id] && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              myAvailability[ev.id] === "going" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            }`}>
                              {myAvailability[ev.id] === "going" ? "Παω" : "Οχι"}
                            </span>
                          )}
                          <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {sec.key === "roster" && (
                    <div className="pt-2 space-y-1.5">
                      {groupPlayers.length === 0 ? (
                        <p className="text-zinc-600 text-xs py-3 text-center">Δεν υπαρχουν παικτες</p>
                      ) : groupPlayers.map(p => (
                        <button key={p.id} onClick={() => { setSelectedPlayer(p); setView("player"); }}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors" data-testid={`player-${p.id}`}>
                          {p.image_url ? (
                            <img src={imgUrl(p.image_url)} alt="" className="w-9 h-9 rounded-xl object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center"><User size={14} className="text-zinc-600" /></div>
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <p className={`text-xs font-medium truncate ${myKidIds.has(p.id) ? "text-[#F5A623]" : "text-white"}`}>{p.name}</p>
                            <p className="text-[10px] text-zinc-500">{p.position}</p>
                          </div>
                          <span className="text-[10px] text-zinc-600 font-mono">#{p.number}</span>
                          <ChevronRight size={13} className="text-zinc-700" />
                        </button>
                      ))}
                    </div>
                  )}

                  {sec.key === "staff" && (
                    <div className="pt-2 space-y-1.5">
                      {groupStaff.length === 0 ? (
                        <p className="text-zinc-600 text-xs py-3 text-center">Δεν υπαρχουν μελη staff</p>
                      ) : groupStaff.map(s => (
                        <div key={s.id || s.name} className="flex items-center gap-3 p-2">
                          {s.image_url ? (
                            <img src={imgUrl(s.image_url)} alt="" className="w-9 h-9 rounded-xl object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center"><Briefcase size={14} className="text-zinc-600" /></div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-white">{s.name}</p>
                            <p className="text-[10px] text-blue-400">{s.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.key === "announcements" && (
                    <div className="pt-2 space-y-2">
                      {announcements.length === 0 ? (
                        <p className="text-zinc-600 text-xs py-3 text-center">Δεν υπαρχουν ανακοινωσεις</p>
                      ) : announcements.slice(0, 5).map((a, i) => (
                        <div key={a.id || i} className="bg-white/[0.02] rounded-xl p-3">
                          <p className="text-xs font-medium text-white">{a.title}</p>
                          {a.content && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{a.content}</p>}
                          {a.created_at && <p className="text-[9px] text-zinc-600 mt-1.5">{new Date(a.created_at).toLocaleDateString("el-GR")}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===================== HOME DASHBOARD =====================
  const allGroups = data.groups || [];
  const children = data.children || [];
  const allFixtures = data.fixtures || [];
  const upcomingFixtures = allFixtures.filter(f => (f.match_date || "") >= new Date().toISOString().split("T")[0] && f.status !== "Completed");
  const recentResults = allFixtures.filter(f => f.status === "Completed").slice(0, 3);
  const totalAttendance = Object.keys(myAvailability).length;
  const goingCount = Object.values(myAvailability).filter(v => v === "going").length;

  return (
    <div className="px-4 pt-5 pb-4" data-testid="parent-dashboard-home">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#e6951a] flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[#F5A623]/20">
            {(user?.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-zinc-500">Καλως ηρθες</p>
            <h1 className="text-base font-bold text-white leading-tight">{user?.name || "Γονεας"}</h1>
          </div>
        </div>
        <button className="w-9 h-9 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-center" data-testid="notifications-btn">
          <Bell size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Ομαδες", value: allGroups.length, icon: Shield, color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
          { label: "Αγωνες", value: upcomingFixtures.length, icon: Trophy, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
          { label: "Παρουσιες", value: totalAttendance > 0 ? `${Math.round(goingCount / totalAttendance * 100)}%` : "—", icon: Activity, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3" data-testid={`parent-stat-${stat.label}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Next Match Card */}
      {upcomingFixtures.length > 0 && (() => {
        const next = upcomingFixtures[0];
        const isHome = (next.home_team || "").toUpperCase().includes("LEFTERIA");
        return (
          <div className="mb-5">
            <SectionHeader title="Επομενος Αγωνας" />
            <div
              className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => onTabChange("matches")}
              data-testid="next-match-card"
            >
              <div className="bg-gradient-to-r from-[#F5A623]/[0.08] to-transparent px-4 py-1.5">
                <span className="text-[9px] font-semibold text-[#F5A623] uppercase tracking-wider">{next.competition || "Αγωνας"}</span>
              </div>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex flex-col items-center w-20">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${isHome ? "bg-[#F5A623]/15" : "bg-white/[0.04]"}`}>
                    <Shield size={16} className={isHome ? "text-[#F5A623]" : "text-zinc-500"} />
                  </div>
                  <span className={`text-[10px] font-medium text-center ${isHome ? "text-[#F5A623]" : "text-white"}`}>
                    {next.home_team?.slice(0, 12)}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 text-xs font-semibold tracking-widest">VS</p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {next.match_date && parseDate(next.match_date)?.toLocaleDateString("el-GR", { day: "numeric", month: "short" })}
                    {next.match_time && ` · ${next.match_time}`}
                  </p>
                </div>
                <div className="flex flex-col items-center w-20">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${!isHome ? "bg-[#F5A623]/15" : "bg-white/[0.04]"}`}>
                    <Shield size={16} className={!isHome ? "text-[#F5A623]" : "text-zinc-500"} />
                  </div>
                  <span className={`text-[10px] font-medium text-center ${!isHome ? "text-[#F5A623]" : "text-white"}`}>
                    {next.away_team?.slice(0, 12)}
                  </span>
                </div>
              </div>
              {next.venue && (
                <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <MapPin size={10} /> {next.venue}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* My Kids */}
      {children.length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Τα Παιδια Μου" />
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {children.map(kid => (
              <div
                key={kid.id}
                className="flex-shrink-0 w-[120px] bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex flex-col items-center cursor-pointer hover:border-[#F5A623]/30 transition-colors"
                onClick={() => {
                  const grp = allGroups.find(g => g.id === kid.academy_group_id || (kid.academy_group_ids || []).includes(g.id));
                  if (grp) { setSelectedGroup(grp); setView("team"); }
                }}
                data-testid={`kid-card-${kid.id}`}
              >
                {kid.image_url ? (
                  <img src={imgUrl(kid.image_url)} alt="" className="w-12 h-12 rounded-xl object-cover mb-2" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#F5A623]/10 flex items-center justify-center mb-2">
                    <User size={18} className="text-[#F5A623]" />
                  </div>
                )}
                <p className="text-xs font-medium text-white text-center truncate w-full">{kid.name?.split(" ")[0]}</p>
                <p className="text-[9px] text-zinc-500">#{kid.number} · {kid.position?.slice(0, 3)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Teams */}
      <div className="mb-5">
        <SectionHeader title="Ομαδες" action="Ολες" onAction={() => {}} />
        <div className="space-y-2">
          {allGroups.map(g => {
            const playerCount = (data.group_players?.[g.id] || []).length;
            return (
              <button
                key={g.id}
                onClick={() => { setSelectedGroup(g); setView("team"); setExpandedSections({ events: true, roster: false, staff: false, announcements: false }); }}
                className="w-full bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-[#F5A623]/20 transition-all group"
                data-testid={`group-card-${g.id}`}
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
                  <p className="text-sm font-semibold text-white group-hover:text-[#F5A623] transition-colors truncate">{g.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#F5A623] bg-[#F5A623]/10 px-1.5 py-0.5 rounded font-medium">{g.age_range}</span>
                    <span className="text-[10px] text-zinc-500">{playerCount} παικτες</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#F5A623] transition-colors flex-shrink-0" />
              </button>
            );
          })}
          {allGroups.length === 0 && (
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 text-center">
              <Shield size={28} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Δεν εχεις ομαδες ακομα</p>
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
                onClick={() => {
                  setSelectedEvent({ ...session, event_type: "training", title: session.title || "Προπονηση" });
                  setView("event");
                }}
                className="w-full text-left bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-[#F5A623]/20 transition-colors"
                data-testid={`parent-training-${session.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{session.title || "Προπονηση"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {session.date && parseDate(session.date)?.toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
                    {session.start_time && ` · ${session.start_time}`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Τελευταια Αποτελεσματα" action="Ολα" onAction={() => onTabChange("matches")} />
          <div className="space-y-2">
            {recentResults.map(f => {
              const isHome = (f.home_team || "").toUpperCase().includes("LEFTERIA");
              const ourScore = isHome ? f.home_score : f.away_score;
              const theirScore = isHome ? f.away_score : f.home_score;
              const won = ourScore > theirScore;
              const drew = ourScore === theirScore;
              return (
                <div key={f.id} className="bg-[#111] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3" data-testid={`result-${f.id}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    won ? "bg-emerald-500/15 text-emerald-400" : drew ? "bg-zinc-500/15 text-zinc-400" : "bg-red-500/15 text-red-400"
                  }`}>
                    {won ? "W" : drew ? "D" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{f.home_team} vs {f.away_team}</p>
                    <p className="text-[10px] text-zinc-500">{f.match_date && parseDate(f.match_date)?.toLocaleDateString("el-GR", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{f.home_score} - {f.away_score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ Shared Sub-components ============
const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-2.5">
    <h2 className="text-sm font-semibold text-white">{title}</h2>
    {action && (
      <button onClick={onAction} className="text-[10px] text-[#F5A623] font-medium">{action}</button>
    )}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-zinc-500">{label}</span>
    <span className="text-xs text-white font-medium">{value}</span>
  </div>
);

export default ParentDashboard;
