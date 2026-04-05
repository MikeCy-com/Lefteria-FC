import { useState, useEffect, useMemo } from "react";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users, MapPin, Clock, Trophy, Target, Shield, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import axios from "axios";

const OUR_TEAM = "ΛΕΥΤΕΡΙΑ 2024";
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const resolveImg = (url) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
};

// ==================== TAB BAR ====================
const TeamTabBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Επισκόπηση" },
    { id: "roster", label: "Ρόστερ" },
    { id: "results", label: "Αποτελέσματα" },
    { id: "schedule", label: "Πρόγραμμα" },
    { id: "gallery", label: "Γκαλερί" },
    { id: "venues", label: "Γήπεδα" },
  ];

  return (
    <div className="border-b border-[#262626] bg-[#0a0a0a] sticky top-[72px] z-30" data-testid="team-tab-bar">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-4 text-center whitespace-nowrap transition-colors ${
                activeTab === tab.id ? "text-[#F5A623]" : "text-zinc-500 hover:text-zinc-300"
              }`}
              data-testid={`team-tab-${tab.id}`}
            >
              <span className="text-[10px] tracking-[0.2em] uppercase block">Η Ομάδα</span>
              <span className="font-['Bebas_Neue'] text-lg tracking-wide">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F5A623]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ players, fixtures, standings, staff }) => {
  const lefteriaStanding = standings.find(s => s.team_name === OUR_TEAM);
  const ourFixtures = fixtures.filter(f => f.home_team === OUR_TEAM || f.away_team === OUR_TEAM);
  const completedFixtures = ourFixtures.filter(f => f.status === "Completed");
  const allCompletedFixtures = fixtures.filter(f => f.status === "Completed");
  const lastMatch = completedFixtures[0];

  // Games history: count W/D/L
  const gamesHistory = useMemo(() => {
    let won = 0, drawn = 0, lost = 0;
    completedFixtures.forEach(f => {
      const isHome = f.home_team === OUR_TEAM;
      const hs = f.home_score || 0;
      const as = f.away_score || 0;
      if (isHome) {
        if (hs > as) won++; else if (hs < as) lost++; else drawn++;
      } else {
        if (as > hs) won++; else if (as < hs) lost++; else drawn++;
      }
    });
    return { won, drawn, lost, total: won + drawn + lost };
  }, [completedFixtures]);

  // Team stats from standings
  const teamStats = lefteriaStanding ? {
    goalsFor: lefteriaStanding.goals_for || 0,
    goalsAgainst: lefteriaStanding.goals_against || 0,
    cleanSheets: completedFixtures.filter(f => {
      const isHome = f.home_team === OUR_TEAM;
      return isHome ? (f.away_score === 0) : (f.home_score === 0);
    }).length,
    avgGoals: completedFixtures.length > 0
      ? (completedFixtures.reduce((acc, f) => {
          const isHome = f.home_team === OUR_TEAM;
          return acc + (isHome ? (f.home_score || 0) : (f.away_score || 0));
        }, 0) / completedFixtures.length).toFixed(1)
      : "0.0",
  } : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" data-testid="overview-tab">
      {/* Team Description */}
      <p className="text-zinc-400 text-sm leading-relaxed mb-10 max-w-4xl">
        Η LEFTERIA FC εκπροσωπεί το πάθος και το πνεύμα του ποδοσφαίρου στη Λεμεσό. 
        Οι παίκτες μας είναι γεμάτοι αποφασιστικότητα, ενέργεια και αγάπη για το παιχνίδι. 
        Υπό την καθοδήγηση έμπειρων προπονητών, συνεχίζουν να αναπτύσσουν δεξιότητες, 
        ομαδικότητα και αθλητικό πνεύμα εβδομάδα με εβδομάδα.
      </p>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Game Scoreboard */}
          <div className="card overflow-hidden" data-testid="game-scoreboard">
            <div className="border-l-[3px] border-[#F5A623] p-5">
              <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">Τελευταίος Αγώνας</h3>
            </div>
            {lastMatch ? (
              <div className="px-5 pb-5">
                <div className="text-xs text-zinc-500 mb-4">
                  {new Date(lastMatch.match_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {lastMatch.venue && ` — ${lastMatch.venue}`}
                </div>
                <div className="flex items-center justify-center gap-6 py-6">
                  <div className="text-center flex-1">
                    <div className={`font-['Bebas_Neue'] text-2xl ${lastMatch.home_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-white'}`}>
                      {lastMatch.home_team}
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] px-8 py-4 border border-[#262626]">
                    <span className="font-['Bebas_Neue'] text-4xl text-white">{lastMatch.home_score} - {lastMatch.away_score}</span>
                  </div>
                  <div className="text-center flex-1">
                    <div className={`font-['Bebas_Neue'] text-2xl ${lastMatch.away_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-white'}`}>
                      {lastMatch.away_team}
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-zinc-500 uppercase tracking-wider">Τελικό Σκορ</div>
              </div>
            ) : (
              <div className="px-5 pb-5 text-zinc-600 text-sm">Δεν υπάρχουν ολοκληρωμένοι αγώνες</div>
            )}
          </div>

          {/* Main Roster */}
          <div className="card overflow-hidden" data-testid="main-roster-preview">
            <div className="border-l-[3px] border-[#F5A623] p-5 flex items-center justify-between">
              <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">Ρόστερ</h3>
              <button
                onClick={() => document.querySelector('[data-testid="team-tab-roster"]')?.click()}
                className="text-xs border border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500 px-3 py-1.5 transition-colors"
                data-testid="view-all-players"
              >
                Όλοι οι Παίκτες
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="roster-table-preview">
                <thead>
                  <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-wider border-b border-[#1e1e1e]">
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">Παίκτης</th>
                    <th className="p-3">Θέση</th>
                    <th className="p-3 text-center">Ηλικία</th>
                    <th className="p-3 text-center">Εθν.</th>
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, 8).map(p => {
                    const img = resolveImg(p.image_url);
                    return (
                      <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                        <td className="p-3 text-zinc-500 font-medium">{p.number}</td>
                        <td className="p-3">
                          <Link to={`/player/${p.id}`} className="flex items-center gap-3 hover:text-[#F5A623] transition-colors">
                            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Users size={14} className="text-zinc-700" />}
                            </div>
                            <span className="text-white font-medium text-xs uppercase tracking-wide">{p.name}</span>
                          </Link>
                        </td>
                        <td className="p-3 text-zinc-400 text-xs">
                          {p.position === 'Goalkeeper' ? 'Τερμ.' : p.position === 'Defender' ? 'Αμυν.' : p.position === 'Midfielder' ? 'Μέσος' : 'Επιθ.'}
                        </td>
                        <td className="p-3 text-center text-zinc-500 text-xs">{p.age || '-'}</td>
                        <td className="p-3 text-center text-zinc-500 text-xs">{p.nationality || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Games History */}
          <div className="card overflow-hidden" data-testid="games-history">
            <div className="border-l-[3px] border-[#F5A623] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">Ιστορικό</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> Ν</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500" /> Ι</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Η</span>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              {gamesHistory.total > 0 ? (
                <div className="space-y-3 mt-2">
                  {/* Bar chart */}
                  <div className="flex items-end gap-2 h-24">
                    {[
                      { label: "Ν", value: gamesHistory.won, color: "bg-green-500" },
                      { label: "Ι", value: gamesHistory.drawn, color: "bg-yellow-500" },
                      { label: "Η", value: gamesHistory.lost, color: "bg-red-500" },
                    ].map(bar => (
                      <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-white font-medium">{bar.value}</span>
                        <div
                          className={`w-full ${bar.color} rounded-t transition-all`}
                          style={{ height: `${gamesHistory.total > 0 ? Math.max((bar.value / gamesHistory.total) * 100, 4) : 4}%` }}
                        />
                        <span className="text-[10px] text-zinc-500">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-xs text-zinc-500 pt-2 border-t border-[#1e1e1e]">
                    {gamesHistory.total} αγώνες
                  </div>
                </div>
              ) : (
                <p className="text-zinc-600 text-xs py-4">Δεν υπάρχουν δεδομένα</p>
              )}
            </div>
          </div>

          {/* Latest Results */}
          <div className="card overflow-hidden" data-testid="latest-results-preview">
            <div className="border-l-[3px] border-[#F5A623] p-5 flex items-center justify-between">
              <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">Αποτελέσματα</h3>
              <button
                onClick={() => document.querySelector('[data-testid="team-tab-results"]')?.click()}
                className="text-xs border border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500 px-3 py-1.5 transition-colors"
                data-testid="view-all-matches"
              >
                Όλοι οι Αγώνες
              </button>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              {completedFixtures.slice(0, 4).map(f => (
                <Link to={`/match/${f.id}`} key={f.id} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-[#111] transition-colors block">
                  <span className="text-zinc-500 w-16">{new Date(f.match_date).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}</span>
                  <span className={`flex-1 ${f.home_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.home_team}</span>
                  <span className="font-['Bebas_Neue'] text-sm text-white px-2">{f.home_score}-{f.away_score}</span>
                  <span className={`flex-1 text-right ${f.away_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.away_team}</span>
                </Link>
              ))}
              {completedFixtures.length === 0 && <p className="px-5 py-4 text-zinc-600 text-xs">Χωρίς αποτελέσματα</p>}
            </div>
          </div>

          {/* Team Statistics */}
          <div className="card overflow-hidden" data-testid="team-statistics">
            <div className="border-l-[3px] border-[#F5A623] p-5">
              <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">Στατιστικά Ομάδας</h3>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {teamStats ? (
                <>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Γκολ Υπέρ</span><span className="text-white font-medium">{teamStats.goalsFor}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Γκολ Κατά</span><span className="text-white font-medium">{teamStats.goalsAgainst}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Μ.Ο. Γκολ/Αγώνα</span><span className="text-[#F5A623] font-medium">{teamStats.avgGoals}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Clean Sheets</span><span className="text-white font-medium">{teamStats.cleanSheets}</span></div>
                  {lefteriaStanding && (
                    <>
                      <div className="pt-2 border-t border-[#1e1e1e]" />
                      <div className="flex justify-between text-sm"><span className="text-zinc-500">Βαθμοί</span><span className="text-[#F5A623] font-bold text-lg">{lefteriaStanding.points}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-zinc-500">Θέση</span><span className="text-white font-medium">{standings.findIndex(s => s.team_name === OUR_TEAM) + 1}η</span></div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-zinc-600 text-xs py-2">Δεν υπάρχουν δεδομένα</p>
              )}
            </div>
          </div>

          {/* Staff Preview */}
          {staff.length > 0 && (
            <div className="card overflow-hidden" data-testid="staff-preview">
              <div className="border-l-[3px] border-[#F5A623] p-5">
                <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">Τεχνικό Επιτελείο</h3>
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {staff.slice(0, 4).map(s => {
                  const roleLabels = {
                    "Head Coach": "Προπονητής", "Assistant Coach": "Βοηθός",
                    "Goalkeeper Coach": "Προπ. Τερμ.", "Fitness Coach": "Γυμναστής",
                    "Physiotherapist": "Φυσιοθεραπευτής", "Team Manager": "Διευθυντής",
                  };
                  return (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between text-sm">
                      <span className="text-white">{s.name}</span>
                      <span className="text-[10px] text-[#F5A623] tracking-wider uppercase">{roleLabels[s.role] || s.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== ROSTER TAB ====================
const RosterTab = ({ players }) => {
  const positions = ["all", "Goalkeeper", "Defender", "Midfielder", "Forward"];
  const posLabels = { all: "Όλοι", Goalkeeper: "Τερματοφύλακες", Defender: "Αμυντικοί", Midfielder: "Μέσοι", Forward: "Επιθετικοί" };
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? players : players.filter(p => p.position === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" data-testid="roster-tab">
      {/* Position filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            className={`text-xs px-4 py-2 border transition-colors ${filter === pos ? 'bg-[#F5A623] text-black border-[#F5A623]' : 'border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500'}`}
            data-testid={`roster-filter-${pos}`}
          >
            {posLabels[pos]}
          </button>
        ))}
      </div>

      {/* Player Table */}
      <div className="card overflow-hidden">
        <div className="border-l-[3px] border-[#F5A623] p-5">
          <h3 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">
            {filter === 'all' ? 'Πρώτη Ομάδα' : posLabels[filter]} — Σεζόν 2025/26
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="full-roster-table">
            <thead>
              <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-wider border-b border-[#1e1e1e]">
                <th className="p-4">Παίκτης</th>
                <th className="p-4 text-center">Θέση</th>
                <th className="p-4 text-center">Γκολ</th>
                <th className="p-4 text-center">Ασίστ</th>
                <th className="p-4 text-center">Λεπτά</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const img = resolveImg(p.image_url);
                const stats = p.statistics || {};
                return (
                  <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors" data-testid={`roster-player-${p.id}`}>
                    <td className="p-4">
                      <Link to={`/player/${p.id}`} className="flex items-center gap-3 hover:text-[#F5A623] transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Users size={16} className="text-zinc-700" />}
                        </div>
                        <span className="text-white font-medium text-xs uppercase tracking-wide">{p.name}</span>
                      </Link>
                    </td>
                    <td className="p-4 text-center text-zinc-400 text-xs">
                      {p.position === 'Goalkeeper' ? 'Τερμ.' : p.position === 'Defender' ? 'Αμυν.' : p.position === 'Midfielder' ? 'Μέσος' : 'Επιθ.'}
                    </td>
                    <td className="p-4 text-center text-zinc-300">{stats.goals || 0}</td>
                    <td className="p-4 text-center text-zinc-300">{stats.assists || 0}</td>
                    <td className="p-4 text-center text-zinc-300">{stats.minutes_played || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== RESULTS TAB ====================
const ResultsTab = ({ fixtures }) => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? fixtures : fixtures.filter(f => f.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" data-testid="results-tab">
      <div className="flex gap-2 flex-wrap mb-8">
        {[
          { value: "all", label: "Όλοι" },
          { value: "Completed", label: "Ολοκληρωμένοι" },
          { value: "Scheduled", label: "Προγραμματισμένοι" },
        ].map(s => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`text-xs px-4 py-2 border transition-colors ${filter === s.value ? 'bg-[#F5A623] text-black border-[#F5A623]' : 'border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500'}`}
            data-testid={`results-filter-${s.value}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(f => (
          <Link to={`/match/${f.id}`} key={f.id} className="card p-5 flex items-center justify-between hover:border-[#F5A623]/30 transition-colors cursor-pointer" data-testid={`result-${f.id}`}>
            <span className="text-xs text-zinc-500 w-20">
              {new Date(f.match_date).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
            <div className="flex items-center gap-3 flex-1 justify-center">
              <span className={`text-sm font-medium text-right flex-1 ${f.home_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.home_team}</span>
              <div className="bg-[#1a1a1a] border border-[#262626] px-4 py-2 min-w-[70px] text-center">
                <span className="font-['Bebas_Neue'] text-lg text-white">
                  {f.status === 'Completed' ? `${f.home_score} - ${f.away_score}` : 'vs'}
                </span>
              </div>
              <span className={`text-sm font-medium text-left flex-1 ${f.away_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.away_team}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ml-4 ${
              f.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
              f.status === 'Live' ? 'bg-red-500/10 text-red-400' :
              'bg-zinc-800 text-zinc-400'
            }`}>{f.status === 'Completed' ? 'Ολοκλ.' : f.status === 'Live' ? 'LIVE' : 'Προγρ.'}</span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-zinc-500 text-center py-8">Δεν υπάρχουν αγώνες</p>}
      </div>
    </div>
  );
};

// ==================== SCHEDULE TAB ====================
const ScheduleTab = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fixtures, setFixtures] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    const fetchCal = async () => {
      try {
        const res = await axios.get(`${API}/calendar?month=${month}&year=${year}`);
        setFixtures(res.data);
      } catch (e) { console.error(e); }
    };
    fetchCal();
  }, [month, year]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));

  const monthNames = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
  const dayNames = ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"];
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const today = new Date();

  const getFixturesForDay = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return fixtures.filter(f => f.match_date && f.match_date.startsWith(dateStr));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" data-testid="schedule-tab">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="text-zinc-400 hover:text-[#F5A623] p-2 transition-colors" data-testid="schedule-prev-month"><ChevronLeft size={24} /></button>
        <h2 className="font-['Bebas_Neue'] text-2xl text-white">{monthNames[month - 1]} {year}</h2>
        <button onClick={nextMonth} className="text-zinc-400 hover:text-[#F5A623] p-2 transition-colors" data-testid="schedule-next-month"><ChevronRight size={24} /></button>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-[#111]">
          {dayNames.map(d => (
            <div key={d} className="p-3 text-center text-xs text-zinc-500 font-medium uppercase tracking-wider border-b border-[#1e1e1e]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[80px] sm:min-h-[100px] bg-[#0a0a0a] border-b border-r border-[#1a1a1a]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayFixtures = getFixturesForDay(day);
            const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
            return (
              <div key={day} className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-[#1a1a1a] ${isToday ? 'bg-[#F5A623]/5' : 'bg-[#0d0d0d]'} hover:bg-[#111] transition-colors`} data-testid={`schedule-day-${day}`}>
                <span className={`text-xs font-medium ${isToday ? 'text-[#F5A623] font-bold' : 'text-zinc-500'}`}>{day}</span>
                <div className="mt-1 space-y-1">
                  {dayFixtures.map(f => (
                    <div key={f.id} className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate ${
                      f.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                      f.status === 'Live' ? 'bg-red-500/15 text-red-400' :
                      'bg-[#F5A623]/10 text-[#F5A623]'
                    }`}>
                      {f.status === 'Completed' ? `${f.home_score}-${f.away_score}` : ''} {f.home_team === OUR_TEAM ? `vs ${f.away_team}` : `@ ${f.home_team}`}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly fixtures list */}
      {fixtures.length > 0 && (
        <div className="mt-8 space-y-2">
          <h3 className="font-['Bebas_Neue'] text-lg text-white mb-3">Αγώνες {monthNames[month - 1]}</h3>
          {fixtures.map(f => (
            <div key={f.id} className="card p-4 flex items-center justify-between text-sm">
              <span className="text-xs text-zinc-500 w-20">{new Date(f.match_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}</span>
              <div className="flex-1 flex items-center gap-2 justify-center">
                <span className={f.home_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-zinc-300'}>{f.home_team}</span>
                <span className="text-zinc-600 text-xs">vs</span>
                <span className={f.away_team === OUR_TEAM ? 'text-[#F5A623]' : 'text-zinc-300'}>{f.away_team}</span>
              </div>
              {f.status === 'Completed' && <span className="font-['Bebas_Neue'] text-white">{f.home_score}-{f.away_score}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== VENUES TAB ====================
const VenuesTab = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await axios.get(`${API}/venues`);
        setVenues(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchVenues();
  }, []);

  const getEmbedUrl = (venue) => {
    if (venue.latitude && venue.longitude) {
      return `https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&z=15&output=embed`;
    }
    if (venue.map_url && venue.map_url.includes("embed")) return venue.map_url;
    return `https://maps.google.com/maps?q=${encodeURIComponent(venue.name + ', ' + venue.city + ', ' + venue.country)}&z=15&output=embed`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" data-testid="venues-tab">
      <div className="space-y-8">
        {venues.map(venue => (
          <div key={venue.id} className="card overflow-hidden" data-testid={`venue-${venue.id}`}>
            <div className="aspect-[21/9] bg-[#1a1a1a]">
              <iframe
                src={getEmbedUrl(venue)}
                width="100%" height="100%"
                style={{ border: 0 }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={venue.name}
              />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-['Bebas_Neue'] text-2xl text-white">{venue.name}</h2>
                    {venue.is_home_ground && <span className="text-[10px] bg-[#F5A623]/15 text-[#F5A623] px-2 py-0.5 rounded">Έδρα</span>}
                  </div>
                  <p className="text-zinc-400 text-sm flex items-center gap-1"><MapPin size={14} /> {venue.address}, {venue.city}, {venue.country}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {venue.capacity && (
                  <div className="card p-4 text-center">
                    <div className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">{venue.capacity.toLocaleString()}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Χωρητικότητα</div>
                  </div>
                )}
                {venue.surface && (
                  <div className="card p-4 text-center">
                    <div className="text-sm text-white font-medium">{venue.surface}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Επιφάνεια</div>
                  </div>
                )}
                {venue.is_home_ground && (
                  <div className="card p-4 text-center">
                    <div className="text-sm text-[#F5A623] font-medium">LEFTERIA FC</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Έδρα</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && venues.length === 0 && <p className="text-zinc-500 text-center py-16">Δεν υπάρχουν γήπεδα</p>}
      </div>
    </div>
  );
};

// ==================== GALLERY TAB ====================
const GalleryTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lightbox, setLightbox] = useState(null);

  const categories = ["Match Day", "Training", "Team Events", "Academy", "Fans", "Other"];
  const catLabels = { "Match Day": "Αγώνας", "Training": "Προπόνηση", "Team Events": "Εκδηλώσεις", "Academy": "Ακαδημία", "Fans": "Φίλαθλοι", "Other": "Άλλο" };

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await axios.get(`${API}/gallery`);
        setItems(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchGallery();
  }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" data-testid="gallery-tab">
      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-4 py-2 border transition-colors ${filter === "all" ? "bg-[#F5A623] text-black border-[#F5A623]" : "border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500"}`}
          data-testid="gallery-filter-all"
        >Όλα</button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-4 py-2 border transition-colors ${filter === cat ? "bg-[#F5A623] text-black border-[#F5A623]" : "border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500"}`}
            data-testid={`gallery-filter-${cat.toLowerCase().replace(/\s/g, '-')}`}
          >{catLabels[cat]}</button>
        ))}
      </div>

      {/* Photo Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="group cursor-pointer overflow-hidden"
              onClick={() => setLightbox(idx)}
              data-testid={`gallery-photo-${item.id}`}
            >
              <div className="aspect-square overflow-hidden bg-[#1a1a1a] relative">
                <img
                  src={resolveImg(item.image_url)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.is_featured && (
                  <span className="absolute top-2 left-2 text-[9px] bg-[#F5A623] text-black px-2 py-0.5 font-medium">FEATURED</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-3 w-full">
                    <p className="text-white text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[10px] text-[#F5A623]">{catLabels[item.category] || item.category}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-sm">{loading ? "" : "Δεν υπάρχουν φωτογραφίες σε αυτή την κατηγορία"}</p>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          data-testid="gallery-lightbox"
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl z-10"
            onClick={() => setLightbox(null)}
            data-testid="lightbox-close"
          >&times;</button>

          {/* Prev / Next */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-2 z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              data-testid="lightbox-prev"
            ><ChevronLeft size={32} /></button>
          )}
          {lightbox < filtered.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-2 z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              data-testid="lightbox-next"
            ><ChevronRight size={32} /></button>
          )}

          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveImg(filtered[lightbox].image_url)}
              alt={filtered[lightbox].title}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
              data-testid="lightbox-image"
            />
            <div className="text-center mt-3">
              <p className="text-white font-medium text-sm">{filtered[lightbox].title}</p>
              {filtered[lightbox].description && <p className="text-zinc-400 text-xs mt-1">{filtered[lightbox].description}</p>}
              <p className="text-[10px] text-[#F5A623] mt-1">{catLabels[filtered[lightbox].category] || filtered[lightbox].category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN TEAM HUB PAGE ====================
const TeamHubPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [players, setPlayers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [playersRes, fixturesRes, standingsRes, staffRes] = await Promise.all([
          axios.get(`${API}/players?team_type=First%20Team`),
          axios.get(`${API}/fixtures?limit=200`),
          axios.get(`${API}/standings`),
          axios.get(`${API}/staff`),
        ]);
        setPlayers(playersRes.data);
        // Sort fixtures: most recent first
        setFixtures(fixturesRes.data.sort((a, b) => new Date(b.match_date) - new Date(a.match_date)));
        setStandings(standingsRes.data);
        setStaff(staffRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen">
        <section className="py-16 px-6 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto">
            <span className="text-xs text-[#F5A623] tracking-[0.3em] uppercase">Σεζόν 2025/26</span>
            <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white mt-2">Πρώτη <span className="text-[#F5A623]">Ομάδα</span></h1>
          </div>
        </section>
        <div className="flex items-center justify-center min-h-[300px]"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen" data-testid="team-hub-page">
      {/* Hero */}
      <section className="py-16 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs text-[#F5A623] tracking-[0.3em] uppercase">Σεζόν 2025/26</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white mt-2">
            Πρώτη <span className="text-[#F5A623]">Ομάδα</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-3 max-w-2xl">
            Γνωρίστε τους παίκτες που εκπροσωπούν την LEFTERIA FC στον Α' Όμιλο του ΠΑΑΟΚ.
          </p>
        </div>
      </section>

      {/* Tab Bar */}
      <TeamTabBar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Tab Content */}
      <div className="bg-[#050505] min-h-[400px]">
        {activeTab === "overview" && <OverviewTab players={players} fixtures={fixtures} standings={standings} staff={staff} />}
        {activeTab === "roster" && <RosterTab players={players} />}
        {activeTab === "results" && <ResultsTab fixtures={fixtures} />}
        {activeTab === "schedule" && <ScheduleTab />}
        {activeTab === "gallery" && <GalleryTab />}
        {activeTab === "venues" && <VenuesTab />}
      </div>
    </div>
  );
};

export default TeamHubPage;
