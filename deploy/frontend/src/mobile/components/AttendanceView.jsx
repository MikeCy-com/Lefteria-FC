import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { noAccent } from "./SharedComponents";
import {
  CheckCircle, XCircle, User, Users, ArrowLeft, Loader2, Lock
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

const AttendanceView = ({ eventId, eventType, eventTitle, onBack, playerIds }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API}/mobile/attendance/${eventId}?event_type=${eventType}`,
        { headers: getHeaders() }
      );
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [eventId, eventType, getHeaders]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const markAttendance = async (playerId, status) => {
    setSubmitting(playerId + status);
    try {
      await axios.post(`${API}/mobile/attendance/mark`, {
        event_id: eventId,
        player_id: playerId,
        status,
        event_type: eventType,
      }, { headers: getHeaders() });
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.roster = prev.roster.map(p =>
          p.id === playerId ? { ...p, attendance_status: status, marked_by: user.role } : p
        );
        const present = updated.roster.filter(r => r.attendance_status === "present").length;
        const absent = updated.roster.filter(r => r.attendance_status === "absent").length;
        updated.summary = {
          total: updated.roster.length,
          present,
          absent,
          unmarked: updated.roster.length - present - absent,
        };
        return updated;
      });
    } catch (e) {
      const msg = e.response?.data?.detail || "Σφαλμα";
      alert(msg);
    }
    finally { setSubmitting(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[40vh]">
      <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const role = user?.role;
  const isCoachOrMgmt = role === "coach" || role === "management";
  const roster = data?.roster || [];
  const summary = data?.summary || {};
  const isLocked = data?.is_locked || false;

  // For player/parent: filter to only their players
  const visibleRoster = isCoachOrMgmt
    ? roster
    : roster.filter(p => playerIds?.includes(p.id));

  const presentPct = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  return (
    <div className="px-4 pt-4 pb-4" data-testid="attendance-view">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-attendance">
        <ArrowLeft size={16} /> Πισω
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Users size={18} className="text-[#F5A623]" />
          <p className="text-base font-bold text-white">Παρουσιες</p>
        </div>
        {eventTitle && <p className="text-xs text-zinc-400">{noAccent(eventTitle)}</p>}
      </div>

      {/* Lock Notice */}
      {isLocked && (
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-3 mb-4 flex items-center gap-2" data-testid="attendance-locked">
          <Lock size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">Οι παρουσιες εχουν κλειδωθει - το γεγονος εχει περασει</p>
        </div>
      )}

      {/* Summary Stats */}
      {isCoachOrMgmt && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{summary.present || 0}</p>
            <p className="text-[10px] text-zinc-500">Παροντες</p>
          </div>
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-red-400">{summary.absent || 0}</p>
            <p className="text-[10px] text-zinc-500">Αποντες</p>
          </div>
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-zinc-400">{summary.unmarked || 0}</p>
            <p className="text-[10px] text-zinc-500">Χωρις σημανση</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isCoachOrMgmt && summary.total > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-zinc-500">Παρουσια</p>
            <p className="text-[10px] text-[#F5A623] font-medium">{presentPct}%</p>
          </div>
          <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${presentPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Roster */}
      <div className="space-y-1.5" data-testid="attendance-roster">
        {visibleRoster.map(player => {
          const status = player.attendance_status;
          const isMarking = submitting?.startsWith(player.id);
          return (
            <div
              key={player.id}
              className={`bg-[#111] border rounded-2xl p-3 flex items-center gap-3 transition-colors ${
                status === "present" ? "border-emerald-500/20" :
                status === "absent" ? "border-red-500/20" :
                "border-white/[0.06]"
              }`}
              data-testid={`attendance-player-${player.id}`}
            >
              {/* Player Info */}
              {player.image_url ? (
                <img src={imgUrl(player.image_url)} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-zinc-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{noAccent(player.name)}</p>
                <div className="flex items-center gap-1.5">
                  {player.number && <span className="text-[9px] text-zinc-500 font-mono">#{player.number}</span>}
                  {player.position && <span className="text-[9px] text-zinc-600">{player.position}</span>}
                </div>
              </div>

              {/* Attendance Buttons */}
              {isLocked ? (
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  status === "present" ? "bg-emerald-500/15 text-emerald-400" :
                  status === "absent" ? "bg-red-500/15 text-red-400" :
                  "bg-zinc-500/15 text-zinc-500"
                }`}>
                  {status === "present" ? "Παρων" : status === "absent" ? "Απων" : "—"}
                </span>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => markAttendance(player.id, "present")}
                    disabled={!!isMarking}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      status === "present"
                        ? "bg-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30"
                    }`}
                    data-testid={`att-present-${player.id}`}
                  >
                    {isMarking && submitting === player.id + "present" ? (
                      <Loader2 size={14} className="animate-spin text-white" />
                    ) : (
                      <CheckCircle size={15} className={status === "present" ? "text-white" : "text-emerald-400"} />
                    )}
                  </button>
                  <button
                    onClick={() => markAttendance(player.id, "absent")}
                    disabled={!!isMarking}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      status === "absent"
                        ? "bg-red-500 shadow-lg shadow-red-500/20"
                        : "bg-white/[0.04] border border-white/[0.08] hover:border-red-500/30"
                    }`}
                    data-testid={`att-absent-${player.id}`}
                  >
                    {isMarking && submitting === player.id + "absent" ? (
                      <Loader2 size={14} className="animate-spin text-white" />
                    ) : (
                      <XCircle size={15} className={status === "absent" ? "text-white" : "text-red-400"} />
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {visibleRoster.length === 0 && (
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 text-center">
            <Users size={28} className="text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Δεν βρεθηκαν παικτες</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceView;
