import { useState, useEffect } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { LoadingSpinner, ErrorState, SectionHeader, EventCard, AnnouncementCard, EmptyCard } from "./ParentDashboard";
import {
  Users, Calendar, ClipboardList, Dumbbell, RefreshCw, ChevronRight,
  CheckCircle, AlertCircle, Trophy, Clock, Plus, BarChart3
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CoachDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/mobile/coach/dashboard`, { headers: getHeaders() })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getHeaders]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <ErrorState />;

  const totalPlayers = data.players?.length || 0;
  const totalTeams = (data.teams?.length || 0) + (data.groups?.length || 0);
  const upcomingCount = data.events?.length || 0;

  return (
    <div className="px-4 pb-20 space-y-4" data-testid="coach-dashboard">
      {/* Welcome */}
      <div className="pt-2">
        <p className="text-zinc-500 text-sm">Γεια σου,</p>
        <h2 className="text-white text-xl font-semibold">{user?.name}</h2>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-3 text-center">
          <Users size={18} className="text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{totalPlayers}</p>
          <p className="text-[10px] text-zinc-500">Παίκτες</p>
        </div>
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-3 text-center">
          <Trophy size={18} className="text-[#F5A623] mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{totalTeams}</p>
          <p className="text-[10px] text-zinc-500">Ομάδες</p>
        </div>
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-3 text-center">
          <Calendar size={18} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{upcomingCount}</p>
          <p className="text-[10px] text-zinc-500">Επόμενα</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <SectionHeader title="Πρόγραμμα" onMore={() => onTabChange("schedule")} />
      {data.events?.length > 0 ? (
        <div className="space-y-2">
          {data.events.slice(0, 4).map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyCard text="Δεν υπάρχουν επερχόμενα γεγονότα" />
      )}

      {/* Training Sessions */}
      {data.training_sessions?.length > 0 && (
        <>
          <SectionHeader title="Προπονήσεις" />
          <div className="space-y-2">
            {data.training_sessions.slice(0, 3).map(session => (
              <div key={session.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Dumbbell size={18} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{session.title}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{session.date}</span>
                    {session.duration && <span>• {session.duration} λεπτά</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Teams Overview */}
      <SectionHeader title="Ομάδες" onMore={() => onTabChange("team")} />
      <div className="space-y-2">
        {data.teams?.map(team => (
          <div key={team.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                <Trophy size={14} className="text-[#F5A623]" />
              </div>
              <span className="text-sm text-white">{team.name}</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600" />
          </div>
        ))}
        {data.groups?.map(group => (
          <div key={group.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users size={14} className="text-emerald-400" />
              </div>
              <span className="text-sm text-white">{group.name}</span>
            </div>
            <span className="text-xs text-zinc-500">{data.players?.filter(p => p.academy_group_ids?.includes(group.id) || p.academy_group_id === group.id).length} παίκτες</span>
          </div>
        ))}
      </div>

      {/* Announcements */}
      <SectionHeader title="Ανακοινώσεις" onMore={() => onTabChange("news")} />
      {data.announcements?.length > 0 ? (
        <div className="space-y-2">
          {data.announcements.slice(0, 3).map(post => (
            <AnnouncementCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyCard text="Δεν υπάρχουν ανακοινώσεις" />
      )}
    </div>
  );
};

export default CoachDashboard;
