import { useState, useEffect } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { LoadingSpinner, ErrorState, SectionHeader, EventCard, AnnouncementCard, EmptyCard } from "../components/SharedComponents";
import {
  Target, Trophy, Clock, Star, TrendingUp, Calendar, BarChart3, RefreshCw
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PlayerDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/mobile/player/dashboard`, { headers: getHeaders() })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getHeaders]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <ErrorState />;

  const player = data.player;
  const stats = data.stats || {};

  return (
    <div className="px-4 pb-20 space-y-4" data-testid="player-dashboard">
      {/* Player Hero */}
      <div className="bg-gradient-to-br from-[#F5A623]/10 to-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-5 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0">
            {player?.image_url ? (
              <img src={player.image_url.startsWith("http") ? player.image_url : `${process.env.REACT_APP_BACKEND_URL}${player.image_url}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#F5A623] text-2xl font-bold">{player?.name?.[0]}</div>
            )}
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">{player?.name || user?.name}</h2>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              {player?.number && <span className="text-[#F5A623] font-bold">#{player.number}</span>}
              {player?.position && <span>{player.position}</span>}
            </div>
            {player?.academy_group_name && (
              <span className="text-xs text-emerald-400 mt-1 inline-block">{player.academy_group_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Season Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox icon={Target} label="Γκολ" value={stats.goals || 0} color="text-emerald-400" />
        <StatBox icon={Star} label="Ασίστ" value={stats.assists || 0} color="text-blue-400" />
        <StatBox icon={Trophy} label="Αγώνες" value={stats.appearances || 0} color="text-[#F5A623]" />
        <StatBox icon={Clock} label="Λεπτά" value={stats.minutes || 0} color="text-purple-400" />
      </div>

      {/* Development Plans */}
      {data.development_plans?.length > 0 && (
        <>
          <SectionHeader title="Πλάνο Ανάπτυξης" />
          <div className="space-y-2">
            {data.development_plans.slice(0, 3).map(plan => (
              <div key={plan.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-white">{plan.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${plan.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {plan.status === 'completed' ? 'Ολοκληρώθηκε' : 'Σε εξέλιξη'}
                  </span>
                </div>
                {plan.progress !== undefined && (
                  <div className="w-full h-1.5 bg-[#1e1e1e] rounded-full mt-2">
                    <div className="h-full bg-[#F5A623] rounded-full transition-all" style={{ width: `${plan.progress || 0}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Evaluations */}
      {data.evaluations?.length > 0 && (
        <>
          <SectionHeader title="Αξιολογήσεις" />
          <div className="space-y-2">
            {data.evaluations.slice(0, 2).map(ev => (
              <div key={ev.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">{ev.period || ev.title}</p>
                  {ev.overall_rating && (
                    <div className="flex items-center gap-1 text-[#F5A623]">
                      <Star size={14} />
                      <span className="text-sm font-bold">{ev.overall_rating}/10</span>
                    </div>
                  )}
                </div>
                {ev.notes && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{ev.notes}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Schedule */}
      <SectionHeader title="Πρόγραμμα" onMore={() => onTabChange("schedule")} />
      {data.events?.length > 0 ? (
        <div className="space-y-2">
          {data.events.slice(0, 3).map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyCard text="Δεν υπάρχουν επερχόμενα γεγονότα" />
      )}

      {/* Recent Matches */}
      {data.fixtures?.length > 0 && (
        <>
          <SectionHeader title="Πρόσφατοι Αγώνες" />
          <div className="space-y-2">
            {data.fixtures.slice(0, 3).map(fix => (
              <div key={fix.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">vs {fix.opponent || fix.away_team}</p>
                  <span className="text-xs text-zinc-500">{fix.match_date}</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {fix.home_score !== undefined ? `${fix.home_score} - ${fix.away_score}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Announcements */}
      <SectionHeader title="Ανακοινώσεις" onMore={() => onTabChange("news")} />
      {data.announcements?.length > 0 ? (
        <div className="space-y-2">
          {data.announcements.slice(0, 2).map(post => (
            <AnnouncementCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyCard text="Δεν υπάρχουν ανακοινώσεις" />
      )}
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, color }) => (
  <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-3 text-center">
    <Icon size={16} className={`${color} mx-auto mb-1`} />
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-[9px] text-zinc-500">{label}</p>
  </div>
);

export default PlayerDashboard;
