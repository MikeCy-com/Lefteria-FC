import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ==================== EVENTS CALENDAR ====================
export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/calendar?month=${month}&year=${year}`);
        setFixtures(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchCalendar();
  }, [month, year]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));

  const monthNames = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
  const dayNames = ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"];

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday=0
  const today = new Date();

  const getFixturesForDay = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return fixtures.filter(f => f.match_date && f.match_date.startsWith(dateStr));
  };

  return (
    <div className="pt-28 min-h-screen bg-[#050505] pb-16" data-testid="calendar-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-xs text-[#F5A623] tracking-[0.3em] uppercase">Προγραμμα</span>
          <h1 className="font-['Bebas_Neue'] text-4xl sm:text-5xl text-white mt-2">Ημερολογιο Αγωνων</h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-zinc-400 hover:text-[#F5A623] p-2 transition-colors" data-testid="prev-month"><ChevronLeft size={24} /></button>
          <h2 className="font-['Bebas_Neue'] text-2xl text-white">{monthNames[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="text-zinc-400 hover:text-[#F5A623] p-2 transition-colors" data-testid="next-month"><ChevronRight size={24} /></button>
        </div>

        {/* Calendar Grid */}
        <div className="card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-[#111]">
            {dayNames.map(d => (
              <div key={d} className="p-3 text-center text-xs text-zinc-500 font-medium uppercase tracking-wider border-b border-[#1e1e1e]">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells before month starts */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] bg-[#0a0a0a] border-b border-r border-[#1a1a1a]"></div>
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayFixtures = getFixturesForDay(day);
              const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;

              return (
                <div key={day} className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-[#1a1a1a] ${isToday ? 'bg-[#F5A623]/5' : 'bg-[#0d0d0d]'} hover:bg-[#111] transition-colors`} data-testid={`cal-day-${day}`}>
                  <span className={`text-xs font-medium ${isToday ? 'text-[#F5A623] font-bold' : 'text-zinc-500'}`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayFixtures.map(f => (
                      <Link to={`/fixtures`} key={f.id} className={`block text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate ${
                        f.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                        f.status === 'Live' || f.status === 'Half Time' ? 'bg-red-500/15 text-red-400' :
                        'bg-[#F5A623]/10 text-[#F5A623]'
                      }`}>
                        {f.status === 'Completed' ? `${f.home_score}-${f.away_score}` : ''} {f.home_team === 'LEFTERIA FC' ? `vs ${f.away_team}` : `@ ${f.home_team}`}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming list below calendar */}
        {fixtures.length > 0 && (
          <div className="mt-8">
            <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Αγωνες {monthNames[month - 1]}</h3>
            <div className="space-y-2">
              {fixtures.map(f => (
                <div key={f.id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500 w-20">{new Date(f.match_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}</span>
                    <span className={`font-medium text-sm ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.home_team}</span>
                    <span className="text-zinc-600 text-xs">vs</span>
                    <span className={`font-medium text-sm ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.away_team}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {f.status === 'Completed' && <span className="font-['Bebas_Neue'] text-lg text-white">{f.home_score} - {f.away_score}</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      f.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                      f.status === 'Live' ? 'bg-red-500/10 text-red-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>{f.status === 'Completed' ? 'Ολοκλ.' : f.status === 'Live' ? 'LIVE' : 'Προγρ.'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== VENUE PAGE ====================
export const VenuePage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/venues`);
        setVenues(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const getEmbedUrl = (venue) => {
    if (venue.latitude && venue.longitude) {
      return `https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&z=15&output=embed`;
    }
    if (venue.map_url) {
      // Try to extract embed URL from Google Maps links
      if (venue.map_url.includes("embed")) return venue.map_url;
      return `https://maps.google.com/maps?q=${encodeURIComponent(venue.name + ' ' + venue.city)}&z=15&output=embed`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(venue.name + ', ' + venue.city + ', ' + venue.country)}&z=15&output=embed`;
  };

  return (
    <div className="pt-28 min-h-screen bg-[#050505] pb-16" data-testid="venue-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs text-[#F5A623] tracking-[0.3em] uppercase">Εγκαταστασεις</span>
          <h1 className="font-['Bebas_Neue'] text-4xl sm:text-5xl text-white mt-2">Γηπεδα</h1>
        </div>

        <div className="space-y-8">
          {venues.map(venue => (
            <div key={venue.id} className="card overflow-hidden" data-testid={`venue-${venue.id}`}>
              {/* Map */}
              <div className="aspect-[21/9] bg-[#1a1a1a]">
                <iframe
                  src={getEmbedUrl(venue)}
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={venue.name}
                ></iframe>
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
                      <div className="text-[10px] text-zinc-500 uppercase">Χωρητικοτητα</div>
                    </div>
                  )}
                  {venue.surface && (
                    <div className="card p-4 text-center">
                      <div className="text-sm text-white font-medium">{venue.surface}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">Επιφανεια</div>
                    </div>
                  )}
                  {venue.is_home_ground && (
                    <div className="card p-4 text-center">
                      <div className="text-sm text-[#F5A623] font-medium">LEFTERIA FC</div>
                      <div className="text-[10px] text-zinc-500 uppercase">Εδρα</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && venues.length === 0 && (
            <p className="text-zinc-500 text-center py-16">Δεν υπάρχουν γήπεδα</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SEASON ARCHIVES ====================
export const SeasonsPage = () => {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonFixtures, setSeasonFixtures] = useState([]);
  const [seasonStandings, setSeasonStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/seasons`);
        const sorted = res.data.sort((a, b) => b.name.localeCompare(a.name));
        setSeasons(sorted);
        if (sorted.length > 0) setSelectedSeason(sorted[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    const fetchSeasonData = async () => {
      try {
        const [fixRes, standRes] = await Promise.all([
          axios.get(`${API}/fixtures?season=${encodeURIComponent(selectedSeason.name)}`),
          axios.get(`${API}/standings?season=${encodeURIComponent(selectedSeason.name)}`),
        ]);
        setSeasonFixtures(fixRes.data);
        setSeasonStandings(standRes.data);
      } catch (e) { console.error(e); }
    };
    fetchSeasonData();
  }, [selectedSeason]);

  return (
    <div className="pt-28 min-h-screen bg-[#050505] pb-16" data-testid="seasons-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs text-[#F5A623] tracking-[0.3em] uppercase">Ιστορικο</span>
          <h1 className="font-['Bebas_Neue'] text-4xl sm:text-5xl text-white mt-2">Αρχειο Σεζον</h1>
        </div>

        {/* Season Selector */}
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {seasons.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSeason(s)}
              className={`px-4 py-2 text-sm font-['Bebas_Neue'] tracking-wide transition-all ${
                selectedSeason?.id === s.id ? 'bg-[#F5A623] text-black' : 'bg-[#111] text-zinc-400 hover:text-white border border-[#262626]'
              }`}
              data-testid={`season-btn-${s.id}`}
            >
              {s.name} {s.is_current ? '(Τρεχουσα)' : ''}
            </button>
          ))}
        </div>

        {selectedSeason && (
          <div className="space-y-8">
            {/* Season Info */}
            <div className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-['Bebas_Neue'] text-3xl text-white">{selectedSeason.name}</h2>
                  <p className="text-zinc-500 text-sm">{selectedSeason.start_date} - {selectedSeason.end_date}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {selectedSeason.competitions?.map((c, i) => (
                    <span key={i} className="text-xs bg-[#F5A623]/10 text-[#F5A623] px-3 py-1 rounded">{c}</span>
                  ))}
                </div>
              </div>
              {selectedSeason.achievements?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#262626]">
                  <h3 className="text-xs text-zinc-500 uppercase mb-2">Επιτευγματα</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSeason.achievements.map((a, i) => (
                      <span key={i} className="text-sm text-white bg-[#1a1a1a] px-3 py-1 rounded">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedSeason.final_position && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-zinc-500 text-sm">Τελική θέση:</span>
                  <span className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">{selectedSeason.final_position}η</span>
                </div>
              )}
            </div>

            {/* Standings */}
            {seasonStandings.length > 0 && (
              <div>
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Βαθμολογια</h3>
                <div className="card overflow-hidden">
                  <table className="standings-table" data-testid="season-standings">
                    <thead>
                      <tr><th>#</th><th>Ομάδα</th><th>Αγ</th><th>Ν</th><th>Ι</th><th>Η</th><th>ΓΥ</th><th>ΓΚ</th><th>ΔΓ</th><th>Βαθ</th></tr>
                    </thead>
                    <tbody>
                      {seasonStandings.map((team, idx) => (
                        <tr key={team.id} className={team.team_name === 'LEFTERIA FC' ? 'team-highlight' : ''}>
                          <td className="font-bold">{idx + 1}</td>
                          <td className="font-semibold">
                            <div className="flex items-center gap-2">
                              {team.team_logo && <img src={team.team_logo} alt="" className="w-5 h-5 object-contain" />}
                              <span>{team.team_name}</span>
                            </div>
                          </td>
                          <td>{team.played}</td><td>{team.won}</td><td>{team.drawn}</td><td>{team.lost}</td>
                          <td>{team.goals_for}</td><td>{team.goals_against}</td>
                          <td className={team.goal_difference > 0 ? 'text-green-500' : team.goal_difference < 0 ? 'text-red-500' : ''}>{team.goal_difference > 0 ? '+' : ''}{team.goal_difference}</td>
                          <td className="font-bold text-[#F5A623]">{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results */}
            {seasonFixtures.length > 0 && (
              <div>
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Αποτελεσματα ({seasonFixtures.length} αγωνες)</h3>
                <div className="space-y-2">
                  {seasonFixtures.map(f => (
                    <div key={f.id} className="card p-4 flex items-center justify-between">
                      <span className="text-xs text-zinc-500 w-20">{new Date(f.match_date).toLocaleDateString('el-GR')}</span>
                      <div className="flex items-center gap-3 flex-1 justify-center">
                        <span className={`text-sm font-medium ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.home_team}</span>
                        <span className="font-['Bebas_Neue'] text-lg text-white min-w-[60px] text-center">
                          {f.status === 'Completed' ? `${f.home_score} - ${f.away_score}` : 'vs'}
                        </span>
                        <span className={`text-sm font-medium ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-zinc-300'}`}>{f.away_team}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        f.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>{f.status === 'Completed' ? 'Ολοκλ.' : 'Προγρ.'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && seasons.length === 0 && (
          <p className="text-zinc-500 text-center py-16">Δεν υπάρχουν σεζόν</p>
        )}
      </div>
    </div>
  );
};

// ==================== STAFF PAGE (P3) ====================
export const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/staff`);
        setStaff(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const roleLabels = {
    "Head Coach": "Προπονητής", "Assistant Coach": "Βοηθός Προπονητή",
    "Goalkeeper Coach": "Προπονητής Τερματοφυλάκων", "Fitness Coach": "Γυμναστής",
    "Physiotherapist": "Φυσιοθεραπευτής", "Team Manager": "Διευθυντής Ομάδας",
    "Youth Coach": "Προπονητής Νέων", "Scout": "Ανιχνευτής"
  };

  const BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  const firstTeam = staff.filter(s => s.team_type === 'First Team');
  const academy = staff.filter(s => s.team_type === 'Academy');

  const renderGroup = (title, members) => (
    members.length > 0 && (
      <div className="mb-10">
        <h2 className="font-['Bebas_Neue'] text-xl text-[#F5A623] mb-4">{title}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(s => {
            const imgUrl = resolveUrl(s.image_url);
            return (
              <div key={s.id} className="card overflow-hidden group" data-testid={`staff-${s.id}`}>
                <div className="aspect-[4/3] bg-[#1A1A1A] relative overflow-hidden">
                  {imgUrl ? (
                    <img src={imgUrl} alt={s.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-zinc-700 text-4xl font-['Bebas_Neue']">{s.name[0]}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-[10px] text-[#F5A623] tracking-widest uppercase">{roleLabels[s.role] || s.role}</span>
                  <h3 className="font-['Bebas_Neue'] text-xl text-white mt-0.5">{s.name}</h3>
                  {s.nationality && <p className="text-zinc-500 text-xs mt-1">{s.nationality}</p>}
                  {s.bio && <p className="text-zinc-400 text-xs mt-2 line-clamp-3">{s.bio}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )
  );

  return (
    <div className="pt-28 min-h-screen bg-[#050505] pb-16" data-testid="staff-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs text-[#F5A623] tracking-[0.3em] uppercase">Τεχνικο Τιμ</span>
          <h1 className="font-['Bebas_Neue'] text-4xl sm:text-5xl text-white mt-2">Τεχνικο Επιτελειο</h1>
        </div>

        {renderGroup("Α' Ομάδα", firstTeam)}
        {renderGroup("Ακαδημία", academy)}

        {!loading && staff.length === 0 && (
          <p className="text-zinc-500 text-center py-16">Δεν υπάρχουν μέλη τεχνικού επιτελείου</p>
        )}
      </div>
    </div>
  );
};
