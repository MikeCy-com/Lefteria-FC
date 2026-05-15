import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Clock, MapPin, Trophy, Flag, AlertTriangle, ArrowLeftRight, Video, Target } from "lucide-react";
import axios from "axios";
import { buildIsOurTeam } from "../utils/team";
import ShareButton from "../components/ShareButton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const OUR_TEAM = "ΛΕΥΤΕΡΙΑ 2024";

// Event type config: icon, color, label
const eventConfig = {
  goal: { icon: Target, color: "text-green-400", bg: "bg-green-500/15", label: "Γκολ" },
  penalty_scored: { icon: Target, color: "text-green-400", bg: "bg-green-500/15", label: "Πέναλτι (Γκολ)" },
  penalty_missed: { icon: Target, color: "text-red-400", bg: "bg-red-500/15", label: "Πέναλτι (Χαμένο)" },
  own_goal: { icon: Target, color: "text-red-400", bg: "bg-red-500/15", label: "Αυτογκόλ" },
  yellow_card: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/15", label: "Κίτρινη" },
  red_card: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/15", label: "Κόκκινη" },
  second_yellow: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/15", label: "2η Κίτρινη" },
  substitution: { icon: ArrowLeftRight, color: "text-blue-400", bg: "bg-blue-500/15", label: "Αλλαγή" },
  var_decision: { icon: Video, color: "text-purple-400", bg: "bg-purple-500/15", label: "VAR" },
};

// ==================== STAT BAR ====================
const MatchStatBar = ({ label, home, away }) => {
  const total = (home || 0) + (away || 0);
  const homeWidth = total > 0 ? ((home || 0) / total) * 100 : 50;
  const awayWidth = total > 0 ? ((away || 0) / total) * 100 : 50;

  return (
    <div className="py-3" data-testid={`match-stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-white font-medium w-10 text-center">{home}</span>
        <span className="text-zinc-500 text-xs uppercase tracking-wider flex-1 text-center">{label}</span>
        <span className="text-white font-medium w-10 text-center">{away}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-[#1a1a1a] rounded-full overflow-hidden flex justify-end">
          <div className="bg-[#F5A623] rounded-full transition-all duration-500" style={{ width: `${homeWidth}%` }} />
        </div>
        <div className="flex-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="bg-zinc-400 rounded-full transition-all duration-500" style={{ width: `${awayWidth}%` }} />
        </div>
      </div>
    </div>
  );
};

// ==================== EVENT TIMELINE ITEM ====================
const TimelineEvent = ({ event, homeTeam, awayTeam }) => {
  const config = eventConfig[event.event_type] || eventConfig.goal;
  const Icon = config.icon;
  const isHome = event.team === "home";
  const teamName = isHome ? homeTeam : awayTeam;
  const isGoalEvent = ["goal", "penalty_scored", "own_goal"].includes(event.event_type);

  return (
    <div
      className={`flex items-start gap-4 ${isHome ? "" : "flex-row-reverse text-right"}`}
      data-testid={`event-${event.id}`}
    >
      {/* Content side */}
      <div className={`flex-1 ${isHome ? "text-left" : "text-right"}`}>
        <div className="flex items-center gap-2" style={{ justifyContent: isHome ? "flex-start" : "flex-end" }}>
          <span className={`text-sm font-medium ${isGoalEvent ? "text-[#F5A623]" : "text-white"}`}>
            {event.player_name || teamName}
          </span>
          {event.event_type === "substitution" && event.secondary_player_name && (
            <span className="text-zinc-500 text-xs">
              <ArrowLeftRight size={10} className="inline mx-1" />
              {event.secondary_player_name}
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-zinc-500 text-xs mt-0.5">{event.description}</p>
        )}
        <span className={`text-[10px] ${config.color} uppercase tracking-wider`}>{config.label}</span>
      </div>

      {/* Center: minute + icon */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 w-14">
        <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
          <Icon size={14} className={config.color} />
        </div>
        <span className="text-xs text-zinc-400 font-medium">
          {event.minute}'
          {event.added_time ? `+${event.added_time}` : ""}
        </span>
      </div>

      {/* Spacer for opposite side */}
      <div className="flex-1" />
    </div>
  );
};

// ==================== MATCH REPORT PAGE ====================
const MatchReportPage = () => {
  const { fixtureId } = useParams();
  const [data, setData] = useState(null);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOurTeam = useMemo(() => buildIsOurTeam(club), [club]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [res, clubRes] = await Promise.all([
          axios.get(`${API}/fixtures/${fixtureId}/detail`),
          axios.get(`${API}/club`).catch(() => ({ data: null })),
        ]);
        setData(res.data);
        setClub(clubRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchDetail();
  }, [fixtureId]);

  if (loading) return (
    <div className="pt-28 flex items-center justify-center min-h-screen bg-[#050505]">
      <div className="spinner" />
    </div>
  );

  if (!data || !data.fixture) return (
    <div className="pt-28 text-center min-h-screen bg-[#050505]">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white">Ο αγωνας δεν βρεθηκε</h2>
      <Link to="/team?tab=results" className="text-[#F5A623] hover:underline text-sm mt-2 inline-block">Επιστροφή στα Αποτελέσματα</Link>
    </div>
  );

  const { fixture, events = [], stats } = data;
  const matchDate = new Date(fixture.match_date);

  // Separate events into first half and second half
  const firstHalfEvents = events.filter(e => e.minute <= 45);
  const secondHalfEvents = events.filter(e => e.minute > 45);

  // Get goal events for scorers
  const goalEvents = events.filter(e => ["goal", "penalty_scored", "own_goal"].includes(e.event_type));
  const homeGoals = goalEvents.filter(e => (e.team === "home" && e.event_type !== "own_goal") || (e.team === "away" && e.event_type === "own_goal"));
  const awayGoals = goalEvents.filter(e => (e.team === "away" && e.event_type !== "own_goal") || (e.team === "home" && e.event_type === "own_goal"));

  return (
    <div className="pt-24 min-h-screen bg-[#050505] pb-16" data-testid="match-report-page">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to="/team?tab=results" className="text-zinc-500 hover:text-[#F5A623] text-sm flex items-center gap-1 transition-colors" data-testid="back-to-results">
          <ChevronRight size={14} className="rotate-180" /> Αποτελέσματα
        </Link>
        <ShareButton kind="match" id={fixture.id} title={`${fixture.home_team} vs ${fixture.away_team}`} />
      </div>

      {/* Match Header */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="card overflow-hidden" data-testid="match-header">
          {/* Competition / Date bar */}
          <div className="bg-[#111] px-3 sm:px-6 py-3 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Trophy size={12} className="text-[#F5A623]" />
              <span>{fixture.competition || "—"}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {matchDate.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {fixture.venue && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {fixture.venue}
                </span>
              )}
            </div>
          </div>

          {/* Score section */}
          <div className="px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              {/* Home team */}
              <div className="flex-1 text-center sm:text-right">
                <div className={`font-['Bebas_Neue'] text-2xl sm:text-3xl ${isOurTeam(fixture.home_team) ? 'text-[#F5A623]' : 'text-white'}`}>
                  {fixture.home_team}
                </div>
                {/* Home scorers */}
                <div className="mt-2 space-y-0.5">
                  {homeGoals.map((g, i) => (
                    <div key={i} className="text-xs text-zinc-400">
                      {g.player_name} {g.minute}'{g.added_time ? `+${g.added_time}` : ''} {g.event_type === 'penalty_scored' ? '(π)' : g.event_type === 'own_goal' ? '(αυτ.)' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div className="text-center" data-testid="match-score">
                <div className="bg-[#1a1a1a] border border-[#262626] px-8 sm:px-12 py-4 sm:py-6 inline-block">
                  <span className="font-['Bebas_Neue'] text-5xl sm:text-6xl text-white">
                    {fixture.home_score ?? 0} - {fixture.away_score ?? 0}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`text-[10px] px-3 py-1 rounded uppercase tracking-wider ${
                    fixture.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                    fixture.status === 'Live' ? 'bg-red-500/10 text-red-400 animate-pulse' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {fixture.status === 'Completed' ? 'Τελικο' : fixture.status === 'Live' ? 'LIVE' : fixture.status === 'Half Time' ? 'Ημιχρονο' : 'Προγρ.'}
                  </span>
                </div>
              </div>

              {/* Away team */}
              <div className="flex-1 text-center sm:text-left">
                <div className={`font-['Bebas_Neue'] text-2xl sm:text-3xl ${isOurTeam(fixture.away_team) ? 'text-[#F5A623]' : 'text-white'}`}>
                  {fixture.away_team}
                </div>
                {/* Away scorers */}
                <div className="mt-2 space-y-0.5">
                  {awayGoals.map((g, i) => (
                    <div key={i} className="text-xs text-zinc-400">
                      {g.player_name} {g.minute}'{g.added_time ? `+${g.added_time}` : ''} {g.event_type === 'penalty_scored' ? '(π)' : g.event_type === 'own_goal' ? '(αυτ.)' : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Match info row */}
          <div className="bg-[#111] px-6 py-3 flex items-center justify-center gap-6 text-xs text-zinc-500 border-t border-[#1e1e1e]">
            {fixture.referee && <span>Διαιτητής: <span className="text-zinc-300">{fixture.referee}</span></span>}
            {fixture.attendance && <span>Θεατές: <span className="text-zinc-300">{fixture.attendance.toLocaleString()}</span></span>}
            <span>Σεζόν: <span className="text-zinc-300">{fixture.season || '2025/26'}</span></span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* LEFT: Event Timeline */}
          <div>
            <h2 className="font-['Bebas_Neue'] text-xl text-white mb-4 flex items-center gap-2">
              <Flag size={18} className="text-[#F5A623]" />
              Χρονολογιο Αγωνα
            </h2>

            {events.length > 0 ? (
              <div className="card p-6" data-testid="event-timeline">
                {/* Team labels */}
                <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider mb-6 px-2">
                  <span className={isOurTeam(fixture.home_team) ? 'text-[#F5A623]' : ''}>{fixture.home_team}</span>
                  <span className={isOurTeam(fixture.away_team) ? 'text-[#F5A623]' : ''}>{fixture.away_team}</span>
                </div>

                {/* First half events */}
                {firstHalfEvents.length > 0 && (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest bg-[#111] px-3 py-1 rounded">1ο Ημιχρονο</span>
                    </div>
                    <div className="space-y-4 mb-6">
                      {firstHalfEvents.map(event => (
                        <TimelineEvent key={event.id} event={event} homeTeam={fixture.home_team} awayTeam={fixture.away_team} />
                      ))}
                    </div>
                  </>
                )}

                {/* Half time separator */}
                {events.length > 0 && (
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 border-t border-[#262626]" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Ημιχρονο</span>
                    <div className="flex-1 border-t border-[#262626]" />
                  </div>
                )}

                {/* Second half events */}
                {secondHalfEvents.length > 0 && (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest bg-[#111] px-3 py-1 rounded">2ο Ημιχρονο</span>
                    </div>
                    <div className="space-y-4">
                      {secondHalfEvents.map(event => (
                        <TimelineEvent key={event.id} event={event} homeTeam={fixture.home_team} awayTeam={fixture.away_team} />
                      ))}
                    </div>
                  </>
                )}

                {/* Full time */}
                {fixture.status === 'Completed' && (
                  <div className="flex items-center gap-3 mt-6">
                    <div className="flex-1 border-t border-[#262626]" />
                    <span className="text-[10px] text-[#F5A623] uppercase tracking-widest">Τελος Αγωνα</span>
                    <div className="flex-1 border-t border-[#262626]" />
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-zinc-500 text-sm">Δεν υπάρχουν καταγεγραμμένα γεγονότα για αυτόν τον αγώνα</p>
              </div>
            )}
          </div>

          {/* RIGHT: Match Statistics */}
          <div>
            <h2 className="font-['Bebas_Neue'] text-xl text-white mb-4">Στατιστικα Αγωνα</h2>

            {stats ? (
              <div className="card p-6" data-testid="match-statistics">
                {/* Team headers */}
                <div className="flex justify-between text-xs uppercase tracking-wider mb-4">
                  <span className={isOurTeam(fixture.home_team) ? 'text-[#F5A623]' : 'text-zinc-400'}>{fixture.home_team.length > 12 ? fixture.home_team.substring(0, 12) + '.' : fixture.home_team}</span>
                  <span className={isOurTeam(fixture.away_team) ? 'text-[#F5A623]' : 'text-zinc-400'}>{fixture.away_team.length > 12 ? fixture.away_team.substring(0, 12) + '.' : fixture.away_team}</span>
                </div>

                <div className="divide-y divide-[#1e1e1e]">
                  <MatchStatBar label="Κατοχή %" home={stats.home_possession} away={stats.away_possession} />
                  <MatchStatBar label="Σουτ" home={stats.home_shots} away={stats.away_shots} />
                  <MatchStatBar label="Στο στόχο" home={stats.home_shots_on_target} away={stats.away_shots_on_target} />
                  <MatchStatBar label="Κόρνερ" home={stats.home_corners} away={stats.away_corners} />
                  <MatchStatBar label="Φάουλ" home={stats.home_fouls} away={stats.away_fouls} />
                  <MatchStatBar label="Οφσάιντ" home={stats.home_offsides} away={stats.away_offsides} />
                  <MatchStatBar label="Αποκρούσεις" home={stats.home_saves} away={stats.away_saves} />
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-zinc-500 text-sm">Δεν υπάρχουν στατιστικά για αυτόν τον αγώνα</p>
              </div>
            )}

            {/* Quick summary card */}
            <div className="card p-5 mt-4" data-testid="match-summary">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Συνοψη</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Γκολ</span>
                  <span className="text-white">{(fixture.home_score ?? 0) + (fixture.away_score ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Γεγονότα</span>
                  <span className="text-white">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Κίτρινες</span>
                  <span className="text-yellow-400">{events.filter(e => e.event_type === 'yellow_card' || e.event_type === 'second_yellow').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Κόκκινες</span>
                  <span className="text-red-400">{events.filter(e => e.event_type === 'red_card' || e.event_type === 'second_yellow').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Αλλαγές</span>
                  <span className="text-white">{events.filter(e => e.event_type === 'substitution').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchReportPage;
