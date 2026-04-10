import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import {
  Users, Calendar, Euro, Clock, ChevronRight, ChevronDown, AlertCircle,
  CheckCircle, RefreshCw, Trophy, Star, Check, X as XIcon,
  MapPin, ExternalLink, Shield, User, TrendingUp, Target,
  ArrowLeft, HelpCircle, Briefcase
} from "lucide-react";
import { stripGreekAccents } from "../../utils/greekText";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

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

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><RefreshCw size={28} className="animate-spin text-[#F5A623]" /></div>;
  if (!data) return <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500"><AlertCircle size={40} className="mb-3" /><p className="text-sm">Σφάλμα φόρτωσης</p></div>;

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
      ...t, event_type: "training", title: t.title || "Προπόνηση",
    }));
    return [...fixtures, ...trainings].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  };

  // ===================== EVENT DETAIL =====================
  if (view === "event" && selectedEvent) {
    const ev = selectedEvent;
    const players = data.group_players?.[selectedGroup?.id] || data.children || [];
    const playerId = getPlayerId();
    const avail = myAvailability[ev.id];
    const typeColor = ev.event_type === "match" ? "#10B981" : ev.event_type === "training" ? "#3B82F6" : "#F5A623";
    const typeLabel = ev.event_type === "match" ? "Αγώνας" : ev.event_type === "training" ? "Προπόνηση" : "Γεγονός";
    const evDate = ev.date ? new Date(ev.date + (ev.date.includes("T") ? "" : "T00:00:00")) : null;
    const validDate = evDate && !isNaN(evDate.getTime());

    return (
      <div className="pb-6" data-testid="event-detail-view">
        <div className="px-4 pt-3">
          <button onClick={() => { setView(selectedGroup ? "team" : "home"); setSelectedEvent(null); }}
            className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="event-back-btn">
            <ArrowLeft size={16} /> Πίσω
          </button>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider"
            style={{ background: `${typeColor}12`, color: typeColor, border: `1px solid ${typeColor}25` }}>
            {typeLabel.toUpperCase()}
          </span>
          <h1 className="text-white text-xl font-bold mt-3 leading-tight">{ev.title}</h1>
        </div>

        {/* Going / Not Going */}
        {playerId && (
          <div className="mx-4 mt-5 bg-[#111] border border-[#1e1e1e] rounded-2xl p-5" data-testid="availability-prompt">
            <p className="text-zinc-400 text-sm mb-3">Θα είσαι εκεί;</p>
            <div className="flex gap-3">
              <button onClick={() => handleAvailability(ev.id, playerId, "going")} disabled={!!submitting}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  avail === "going" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "bg-[#1a1a1a] text-zinc-400 border border-[#2a2a2a]"
                }`} data-testid="going-btn">
                <Check size={18} /> Πάω
              </button>
              <button onClick={() => handleAvailability(ev.id, playerId, "not_going")} disabled={!!submitting}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  avail === "not_going" ? "bg-red-500 text-white shadow-lg shadow-red-500/25" : "bg-[#1a1a1a] text-zinc-400 border border-[#2a2a2a]"
                }`} data-testid="not-going-btn">
                <XIcon size={18} /> Δεν πάω
              </button>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="mx-4 mt-4 space-y-2">
          {validDate && <InfoCard icon={Calendar} color={typeColor} text={evDate.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />}
          {ev.start_time && <InfoCard icon={Clock} color={typeColor} text={`Ώρα: ${ev.start_time}`} />}
          {ev.arrival_time && <InfoCard icon={Clock} color="#F5A623" text={`Άφιξη: ${ev.arrival_time}`} />}
          {ev.location && <InfoCard icon={MapPin} color={typeColor} text={ev.location} link={ev.location_url} />}
          {ev.competition && <InfoCard icon={Trophy} color="#F5A623" text={ev.competition} />}
        </div>

        {/* Attendance */}
        <div className="mx-4 mt-5">
          <p className="text-zinc-500 text-[10px] font-bold tracking-wider mb-3">ΠΑΡΟΥΣΙΕΣ ({players.length})</p>
          <div className="space-y-1.5">
            {players.map(p => (
              <div key={p.id} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl ${myKidIds.has(p.id) ? "bg-[#F5A623]/5 border border-[#F5A623]/15" : "bg-[#0e0e0e] border border-[#151515]"}`}>
                <Avatar url={p.image_url} name={p.name} size={36} highlight={myKidIds.has(p.id)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${myKidIds.has(p.id) ? "text-[#F5A623]" : "text-white"}`}>{p.name}</p>
                  <p className="text-[10px] text-zinc-600">{p.position} {p.number ? `#${p.number}` : ""}</p>
                </div>
                {myKidIds.has(p.id) && avail && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${avail === "going" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {avail === "going" ? "Πάω" : "Δεν πάω"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===================== PLAYER PROFILE =====================
  if (view === "player" && selectedPlayer) {
    const p = selectedPlayer;
    const isMyKid = myKidIds.has(p.id);
    const playerFixtures = (data.fixtures || []).filter(f => f.academy_group_id && ((p.academy_group_ids || []).includes(f.academy_group_id) || f.academy_group_id === p.academy_group_id));
    const perfs = playerFixtures.flatMap(f => (f.player_performances || []).filter(pp => pp.player_id === p.id));
    const stats = { goals: 0, assists: 0, appearances: perfs.length, minutes: 0 };
    perfs.forEach(pp => { stats.goals += pp.goals || 0; stats.assists += pp.assists || 0; stats.minutes += pp.minutes || 0; });
    const totalF = playerFixtures.length;
    const totalT = (data.training_sessions || []).length;
    const matchRate = totalF > 0 ? Math.round((stats.appearances / totalF) * 100) : 0;
    const groupId = (p.academy_group_ids?.[0]) || p.academy_group_id;
    const groupSize = (data.group_players?.[groupId] || []).length;

    return (
      <div className="pb-6" data-testid="player-profile-view">
        <div className="px-4 pt-3">
          <button onClick={() => { setView(selectedGroup ? "team" : "home"); setSelectedPlayer(null); }}
            className="flex items-center gap-1.5 text-zinc-400 text-sm" data-testid="player-back-btn">
            <ArrowLeft size={16} /> Πίσω
          </button>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center pt-5 pb-6">
          <div className={`w-24 h-24 rounded-full overflow-hidden mb-3 ${isMyKid ? "ring-3 ring-[#F5A623] ring-offset-2 ring-offset-[#0a0a0a]" : "border-2 border-[#2a2a2a]"}`}>
            {imgUrl(p.image_url)
              ? <img src={imgUrl(p.image_url)} alt="" className="w-full h-full object-cover" />
              : <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${isMyKid ? "bg-[#F5A623]/10 text-[#F5A623]" : "bg-[#1a1a1a] text-zinc-500"}`}>{p.name?.charAt(0)}</div>
            }
          </div>
          <h2 className="text-white text-xl font-bold">{p.name}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            {p.number && <span className="text-xs bg-[#F5A623]/15 text-[#F5A623] px-2.5 py-0.5 rounded-full font-bold">#{p.number}</span>}
            {p.position && <span className="text-xs bg-[#1e1e1e] text-zinc-400 px-2.5 py-0.5 rounded-full">{p.position}</span>}
          </div>
          {isMyKid && <span className="text-[10px] text-[#F5A623]/60 mt-2 flex items-center gap-1"><Star size={10} className="fill-[#F5A623] text-[#F5A623]" /> Το παιδί μου</span>}
        </div>

        <div className="px-4 space-y-3">
          {/* Training % */}
          <StatBlock icon={Target} color="#3B82F6" label="Παρουσίες Προπόνησης" pct={isMyKid ? matchRate : null} rank={null} total={groupSize} />
          {/* Match % */}
          <StatBlock icon={Trophy} color="#10B981" label="Παρουσίες Αγώνων" pct={isMyKid ? matchRate : null} rank={null} total={groupSize} />

          {isMyKid ? (
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <MiniStat label="Γκολ" value={stats.goals} color="text-[#F5A623]" />
              <MiniStat label="Ασίστ" value={stats.assists} color="text-blue-400" />
              <MiniStat label="Λεπτά" value={stats.minutes} color="text-emerald-400" />
            </div>
          ) : (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 text-center">
              <HelpCircle size={28} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Τα αναλυτικά στατιστικά είναι διαθέσιμα<br/>μόνο για τα παιδιά σας</p>
            </div>
          )}

          {/* Parent info */}
          {isMyKid && user && (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 mt-2">
              <p className="text-[10px] text-zinc-600 mb-2 font-medium tracking-wide">ΓΟΝΕΑΣ / ΚΗΔΕΜΟΝΑΣ</p>
              <div className="flex items-center gap-3">
                <Avatar url={user.avatar_url} name={user.name} size={40} highlight />
                <div>
                  <p className="text-sm text-white font-medium">{user.name}</p>
                  <p className="text-[10px] text-zinc-500">{user.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===================== TEAM DETAIL =====================
  if (view === "team" && selectedGroup) {
    const g = selectedGroup;
    const players = data.group_players?.[g.id] || [];
    const events = buildEvents(g.id);
    const now = new Date().toISOString().split("T")[0];
    const upcoming = events.filter(e => (e.date || "") >= now);
    const completed = events.filter(e => (e.date || "") < now);
    const announcements = data.announcements || [];

    return (
      <div className="pb-6" data-testid="team-detail-view">
        {/* Banner */}
        <div className="relative">
          {g.banner_url ? (
            <div className="h-40 overflow-hidden">
              <img src={imgUrl(g.banner_url)} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-emerald-900/30 to-[#0a0a0a]" />
          )}
          <button onClick={() => { setView("home"); setSelectedGroup(null); setExpandedSections({ events: true, roster: false, staff: false, announcements: false }); }}
            className="absolute top-3 left-3 flex items-center gap-1 text-white/80 text-sm bg-black/50 backdrop-blur rounded-full px-3 py-1.5 z-10"
            data-testid="team-back-btn">
            <ArrowLeft size={14} />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-white text-2xl font-bold drop-shadow-lg">{stripGreekAccents(g.name)}</h2>
            <div className="flex items-center gap-3 text-[11px] text-zinc-300/80 mt-1">
              {g.coach_name && <span className="flex items-center gap-1"><User size={11} /> {g.coach_name}</span>}
              <span className="flex items-center gap-1"><Users size={11} /> {players.length}</span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-2">
          {/* UPCOMING */}
          <CollapsibleSection title="Επερχόμενα" count={upcoming.length} icon={Calendar} color="#3B82F6"
            open={expandedSections.events} onToggle={() => toggleSection("events")}>
            {upcoming.length > 0 ? upcoming.map(ev => (
              <EventCard key={ev.id} event={ev} avail={myAvailability[ev.id]}
                onClick={() => { setSelectedEvent(ev); setView("event"); }} />
            )) : <p className="text-zinc-600 text-xs py-4 text-center">Κανένα επερχόμενο</p>}
            {completed.length > 0 && (
              <>
                <p className="text-zinc-600 text-[10px] font-bold tracking-wider mt-4 mb-2">ΟΛΟΚΛΗΡΩΜΕΝΑ</p>
                {completed.slice(0, 5).map(ev => (
                  <EventCard key={ev.id} event={ev} avail={myAvailability[ev.id]} completed
                    onClick={() => { setSelectedEvent(ev); setView("event"); }} />
                ))}
              </>
            )}
          </CollapsibleSection>

          {/* ROSTER */}
          <CollapsibleSection title="Ρόστερ" count={players.length} icon={Users} color="#F5A623"
            open={expandedSections.roster} onToggle={() => toggleSection("roster")}>
            {players.map(p => (
              <button key={p.id} onClick={() => { setSelectedPlayer(p); setView("player"); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  myKidIds.has(p.id) ? "bg-[#F5A623]/5 border border-[#F5A623]/15" : "bg-[#0e0e0e] border border-[#151515]"
                } hover:border-[#333]`} data-testid={`player-card-${p.id}`}>
                <Avatar url={p.image_url} name={p.name} size={42} highlight={myKidIds.has(p.id)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${myKidIds.has(p.id) ? "text-[#F5A623]" : "text-white"}`}>{p.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                    {p.number && <span className="font-medium">#{p.number}</span>}
                    {p.position && <span>{p.position}</span>}
                  </div>
                </div>
                {myKidIds.has(p.id) && <Star size={13} className="text-[#F5A623] fill-[#F5A623]" />}
                <ChevronRight size={14} className="text-zinc-700" />
              </button>
            ))}
          </CollapsibleSection>

          {/* STAFF */}
          <CollapsibleSection title="Τεχνικό Επιτελείο" count={g.coach_name ? 1 : 0} icon={Briefcase} color="#10B981"
            open={expandedSections.staff} onToggle={() => toggleSection("staff")}>
            {g.coach_name && (
              <div className="flex items-center gap-3 px-3 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                <div className="w-11 h-11 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Briefcase size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{g.coach_name}</p>
                  <p className="text-[10px] text-emerald-400">Προπονητής</p>
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* ANNOUNCEMENTS */}
          {announcements.length > 0 && (
            <CollapsibleSection title="Ανακοινώσεις" count={announcements.length} icon={CheckCircle} color="#F5A623"
              open={expandedSections.announcements} onToggle={() => toggleSection("announcements")}>
              {announcements.map(post => (
                <div key={post.id} className="bg-[#0e0e0e] border border-[#151515] rounded-xl p-3.5">
                  {post.title && <p className="text-white text-sm font-medium mb-1">{post.title}</p>}
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">{post.content}</p>
                  <span className="text-[10px] text-zinc-600 mt-1.5 block">{new Date(post.created_at).toLocaleDateString("el-GR")}</span>
                </div>
              ))}
            </CollapsibleSection>
          )}
        </div>
      </div>
    );
  }

  // ===================== HOME =====================
  const totalOwed = data.financial_records?.filter(r => r.status !== "paid").reduce((s, r) => s + (r.amount || 0), 0) || 0;
  const allEvents = [];
  (data.groups || []).forEach(g => allEvents.push(...buildEvents(g.id)));
  allEvents.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const now = new Date().toISOString().split("T")[0];
  const nextEvents = allEvents.filter(e => (e.date || "") >= now).slice(0, 4);

  return (
    <div className="px-4 pb-6 space-y-5" data-testid="parent-dashboard">
      {/* Welcome */}
      <div className="pt-3">
        <p className="text-zinc-500 text-xs">Καλώς ήρθατε,</p>
        <h2 className="text-white text-xl font-bold">{user?.name}</h2>
      </div>

      {/* Team cards */}
      {(data.groups || []).map(group => {
        const kids = (data.children || []).filter(c => (c.academy_group_ids || []).includes(group.id) || c.academy_group_id === group.id);
        const playerCount = (data.group_players?.[group.id] || []).length;
        return (
          <button key={group.id} onClick={() => { setSelectedGroup(group); setView("team"); setExpandedSections({ events: true, roster: false, staff: false, announcements: false }); }}
            className="w-full text-left relative overflow-hidden rounded-2xl border border-[#1e1e1e] hover:border-emerald-500/30 transition-all group"
            data-testid={`team-card-${group.id}`}>
            {group.banner_url ? (
              <div className="h-32 overflow-hidden">
                <img src={imgUrl(group.banner_url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
              </div>
            ) : (
              <div className="h-28 bg-gradient-to-br from-emerald-900/20 to-[#0a0a0a]" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-white text-lg font-bold drop-shadow group-hover:text-emerald-400 transition-colors">{stripGreekAccents(group.name)}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-0.5">
                    <span className="flex items-center gap-1"><Users size={10} /> {playerCount}</span>
                    {group.coach_name && <span>{group.coach_name}</span>}
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {kids.slice(0, 3).map(k => (
                    <div key={k.id} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] overflow-hidden bg-[#F5A623]/10 flex items-center justify-center">
                      {imgUrl(k.image_url)
                        ? <img src={imgUrl(k.image_url)} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[10px] font-bold text-[#F5A623]">{k.name?.charAt(0)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* My kids */}
      <div>
        <p className="text-zinc-500 text-[10px] font-bold tracking-wider mb-2.5">ΤΑ ΠΑΙΔΙΑ ΜΟΥ</p>
        <div className="space-y-1.5">
          {(data.children || []).map(child => (
            <button key={child.id} onClick={() => { setSelectedPlayer(child); setView("player"); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#151515] hover:border-[#F5A623]/20 transition-all text-left"
              data-testid={`child-card-${child.id}`}>
              <Avatar url={child.image_url} name={child.name} size={40} highlight />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{child.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  {child.position && <span>{child.position}</span>}
                  {child.academy_group_name && <span className="text-emerald-400">{child.academy_group_name}</span>}
                </div>
              </div>
              <ChevronRight size={14} className="text-zinc-700" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onTabChange?.("schedule")} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 text-left">
          <Calendar size={18} className="text-blue-400 mb-2" />
          <p className="text-[10px] text-zinc-600">Επόμενο</p>
          <p className="text-base font-bold text-blue-400">
            {nextEvents[0] ? new Date(nextEvents[0].date + (nextEvents[0].date?.includes("T") ? "" : "T00:00:00")).toLocaleDateString("el-GR", { day: "numeric", month: "short" }) : "—"}
          </p>
          <p className="text-[10px] text-zinc-500 truncate">{nextEvents[0]?.title || "Κανένα"}</p>
        </button>
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
          <Euro size={18} className={`${totalOwed > 0 ? "text-red-400" : "text-emerald-400"} mb-2`} />
          <p className="text-[10px] text-zinc-600">Υπόλοιπο</p>
          <p className={`text-base font-bold ${totalOwed > 0 ? "text-red-400" : "text-emerald-400"}`}>€{totalOwed.toFixed(0)}</p>
          <p className="text-[10px] text-zinc-500">{totalOwed > 0 ? "Εκκρεμεί" : "Εντάξει"}</p>
        </div>
      </div>

      {/* Upcoming */}
      {nextEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-zinc-500 text-[10px] font-bold tracking-wider">ΕΠΕΡΧΟΜΕΝΑ</p>
            <button onClick={() => onTabChange?.("schedule")} className="text-[10px] text-[#F5A623] flex items-center gap-0.5">Όλα <ChevronRight size={10} /></button>
          </div>
          <div className="space-y-2">
            {nextEvents.map(ev => (
              <EventCard key={ev.id} event={ev} avail={myAvailability[ev.id]}
                onClick={() => { const grp = data.groups?.find(gg => gg.id === ev.academy_group_id); if (grp) setSelectedGroup(grp); setSelectedEvent(ev); setView("event"); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== SHARED COMPONENTS =====================
const Avatar = ({ url, name, size = 36, highlight = false }) => (
  <div className={`rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${highlight ? "bg-[#F5A623]/10" : "bg-[#1a1a1a]"}`}
    style={{ width: size, height: size }}>
    {imgUrl(url) ? <img src={imgUrl(url)} alt="" className="w-full h-full object-cover" />
      : <span className={`font-bold ${highlight ? "text-[#F5A623]" : "text-zinc-500"}`} style={{ fontSize: size * 0.38 }}>{name?.charAt(0)}</span>}
  </div>
);

const InfoCard = ({ icon: Icon, color, text, link }) => (
  <div className="flex items-center gap-3 bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3">
    <Icon size={16} style={{ color }} className="flex-shrink-0" />
    <p className="text-sm text-white flex-1">{text}</p>
    {link && <a href={link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 flex items-center gap-0.5 flex-shrink-0">Χάρτης <ExternalLink size={9} /></a>}
  </div>
);

const CollapsibleSection = ({ title, count, icon: Icon, color, open, onToggle, children }) => (
  <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" data-testid={`section-${title}`}>
      <Icon size={16} style={{ color }} />
      <span className="text-white text-sm font-medium flex-1">{title}</span>
      <span className="text-[10px] text-zinc-500 bg-[#1a1a1a] px-2 py-0.5 rounded-full">{count}</span>
      <ChevronDown size={14} className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="px-3 pb-3 space-y-1.5">{children}</div>}
  </div>
);

const EventCard = ({ event, avail, completed, onClick }) => {
  const c = { match: { accent: "#10B981", label: "Αγώνας" }, training: { accent: "#3B82F6", label: "Προπόνηση" } }[event.event_type] || { accent: "#F5A623", label: "Γεγονός" };
  const d = event.date ? new Date(event.date + (event.date.includes("T") ? "" : "T00:00:00")) : null;
  const valid = d && !isNaN(d.getTime());
  return (
    <button onClick={onClick} className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${completed ? "bg-[#090909] border-[#131313] opacity-50" : "bg-[#0e0e0e] border-[#181818] hover:border-[#2a2a2a]"}`}
      data-testid={`event-card-${event.id}`}>
      {valid && (
        <div className="flex flex-col items-center w-11 flex-shrink-0">
          <span className="text-[9px] text-zinc-500 leading-none">{d.toLocaleDateString("el-GR", { month: "short" }).replace(".", "")}</span>
          <span className="text-lg font-bold text-white leading-tight">{d.getDate()}</span>
          <span className="text-[8px] text-zinc-600">{d.toLocaleDateString("el-GR", { weekday: "short" })}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${c.accent}12`, color: c.accent }}>{c.label}</span>
          {avail && <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${avail === "going" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{avail === "going" ? "Πάω" : "Δεν πάω"}</span>}
        </div>
        <p className="text-[13px] text-white font-medium truncate">{event.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
          {event.start_time && <span className="flex items-center gap-0.5"><Clock size={9} /> {event.start_time}</span>}
          {event.location && <span className="flex items-center gap-0.5 truncate"><MapPin size={9} /> {event.location}</span>}
        </div>
      </div>
      <ChevronRight size={13} className="text-zinc-700 flex-shrink-0" />
    </button>
  );
};

const StatBlock = ({ icon: Icon, color, label, pct, rank, total }) => (
  <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
    <div className="flex items-center gap-1.5 mb-3">
      <Icon size={14} style={{ color }} />
      <span className="text-zinc-400 text-xs">{label}</span>
    </div>
    <div className="flex items-end justify-between">
      <div>
        <span className="text-4xl font-bold" style={{ color }}>{pct !== null ? pct : "—"}</span>
        {pct !== null && <span className="text-lg ml-0.5" style={{ color, opacity: 0.5 }}>%</span>}
      </div>
      {total > 0 && <div className="text-right"><p className="text-[10px] text-zinc-600">Κατάταξη</p><p className="text-lg font-bold text-zinc-400">—<span className="text-xs text-zinc-600">/{total}</span></p></div>}
    </div>
    <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full mt-3 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: pct !== null ? `${pct}%` : "0%", background: color }} />
    </div>
  </div>
);

const MiniStat = ({ label, value, color }) => (
  <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
  </div>
);

export default ParentDashboard;

// Legacy exports for other dashboards
const LoadingSpinner = () => <div className="flex items-center justify-center py-20"><RefreshCw size={24} className="animate-spin text-[#F5A623]" /></div>;
const ErrorState = () => <div className="flex flex-col items-center justify-center py-20 text-zinc-500"><AlertCircle size={32} /><p className="mt-2 text-sm">Σφάλμα</p></div>;
const QuickStat = ({ icon: Icon, label, value, sub, color, onClick }) => (<button onClick={onClick} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 text-left w-full"><Icon size={18} className={`${color} mb-2`} /><p className="text-xs text-zinc-500">{label}</p><p className={`text-lg font-semibold ${color}`}>{value}</p>{sub && <p className="text-xs text-zinc-600">{sub}</p>}</button>);
const SectionHeader = ({ title, onMore }) => (<div className="flex items-center justify-between mb-2"><h3 className="text-white font-semibold text-sm">{title}</h3>{onMore && <button onClick={onMore} className="text-[10px] text-[#F5A623] flex items-center gap-0.5">Όλα <ChevronRight size={10} /></button>}</div>);
const AnnouncementCard = ({ post }) => (<div className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3"><p className="text-sm text-white">{post.title || post.content?.slice(0,60)}</p><p className="text-xs text-zinc-500 mt-1 line-clamp-2">{post.content}</p></div>);
const EmptyCard = ({ text }) => <div className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-6 text-center text-zinc-600 text-sm">{text}</div>;
const EventItem = EventCard;
export { LoadingSpinner, ErrorState, QuickStat, SectionHeader, EventItem, EventCard, AnnouncementCard, EmptyCard };
