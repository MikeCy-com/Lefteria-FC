import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users, Calendar, Plus, Edit2, Trash2, X, ChevronRight, ChevronDown,
  Image, UserCog, Trophy, MapPin, RefreshCw, Shield, Dumbbell, Video, Upload, Clock
} from "lucide-react";
import ImageUpload from "../../components/ImageUpload";
import InlineAttendance from "./InlineAttendance";
import TrainingSessionsPanel from "./TrainingSessionsPanel";
import VideoAnalyticsPanel from "./VideoAnalyticsPanel";
import { API, getAuthHeaders, stripGreekAccents, FormModal, Field, AdminInput, AdminSelect, AdminTextarea, TabHeader, EmptyState } from "./shared";

const TeamsTab = ({ players, teams, fixtures, staff, standings, opponents = [], facilities = [], onRefresh, onTabChange, StandingsTab, AdminPlayerProfile, MatchStatsModal }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState("roster");
  const emptyForm = { name: "", level: "Α' Ομάδα", description: "", banner_url: "" };
  const [form, setForm] = useState(emptyForm);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const emptyPlayer = { name: "", number: "", position: "Midfielder", nationality: "Cyprus", age: "", image_url: "", bio: "", height: "", weight: "", preferred_foot: "Right", date_of_birth: "" };
  const [playerForm, setPlayerForm] = useState(emptyPlayer);
  const calcAge = (dob) => { if (!dob) return ""; try { return Math.floor((new Date() - new Date(dob)) / 31557600000); } catch { return ""; } };
  const [galleryItems, setGalleryItems] = useState([]);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title: "", image_url: "", category: "Match Day", description: "" });
  const [savingGallery, setSavingGallery] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [expandedTeamFixtureId, setExpandedTeamFixtureId] = useState(null);

  const openCreateTeam = () => { setForm(emptyForm); setEditTeam(null); setShowForm(true); };
  const openEditTeam = (t) => { setForm({ name: t.name, level: t.level, description: t.description || "", banner_url: t.banner_url || "" }); setEditTeam(t); setShowForm(true); };

  const handleSaveTeam = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (editTeam) await axios.put(`${API}/admin/teams/${editTeam.id}`, form, { headers });
      else await axios.post(`${API}/admin/teams`, form, { headers });
      setShowForm(false); setEditTeam(null); onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Διαγραφή ομάδας; Οι παίκτες θα αφαιρεθούν.")) return;
    try { await axios.delete(`${API}/admin/teams/${id}`, { headers: getAuthHeaders() }); if (selectedTeam?.id === id) setSelectedTeam(null); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const openCreatePlayer = () => { setPlayerForm({...emptyPlayer}); setEditPlayer(null); setShowPlayerForm(true); };
  const openEditPlayer = (p) => {
    setPlayerForm({ name: p.name || "", number: p.number || "", position: p.position || "Midfielder", nationality: p.nationality || "Cyprus", age: p.age || "", image_url: p.image_url || "", bio: p.bio || "", height: p.height || "", weight: p.weight || "", preferred_foot: p.preferred_foot || "Right", date_of_birth: p.date_of_birth || "" });
    setEditPlayer(p); setShowPlayerForm(true);
  };

  const handleSavePlayer = async () => {
    setSavingPlayer(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...playerForm, number: parseInt(playerForm.number) || 0, age: parseInt(calcAge(playerForm.date_of_birth)) || parseInt(playerForm.age) || 0, team_type: "First Team", team_id: selectedTeam.id };
      if (editPlayer) await axios.put(`${API}/admin/players/${editPlayer.id}`, payload, { headers });
      else await axios.post(`${API}/admin/players`, payload, { headers });
      setShowPlayerForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSavingPlayer(false); }
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm("Διαγραφή παίκτη;")) return;
    try { await axios.delete(`${API}/admin/players/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const fetchGallery = useCallback(async () => {
    if (!selectedTeam) return;
    try {
      const res = await axios.get(`${API}/gallery?team_id=${selectedTeam.id}`);
      setGalleryItems(res.data);
    } catch (e) { console.error(e); }
  }, [selectedTeam]);

  useEffect(() => { if (detailTab === "gallery" && selectedTeam) fetchGallery(); }, [detailTab, selectedTeam, fetchGallery]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await axios.post(`${API}/admin/gallery/upload`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setGalleryForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch (e) { alert("Σφάλμα μεταφόρτωσης"); } finally { setUploadingFile(false); }
  };

  const handleSaveGallery = async () => {
    setSavingGallery(true);
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API}/admin/gallery`, { ...galleryForm, team_id: selectedTeam.id }, { headers });
      setShowGalleryForm(false); fetchGallery();
      setGalleryForm({ title: "", image_url: "", category: "Match Day", description: "" });
    } catch (e) { alert("Σφάλμα"); } finally { setSavingGallery(false); }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm("Διαγραφή;")) return;
    try { await axios.delete(`${API}/admin/gallery/${id}`, { headers: getAuthHeaders() }); fetchGallery(); } catch (e) { alert("Σφάλμα"); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/admin/upload-image`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setForm(prev => ({ ...prev, banner_url: res.data.image_url || res.data.url }));
    } catch (err) { alert("Σφάλμα ανεβάσματος"); } finally { setUploadingBanner(false); }
  };

  useEffect(() => {
    if (selectedTeam) {
      const updated = teams.find(t => t.id === selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    }
  }, [teams]);

  if (selectedTeam) {
    const teamPlayers = players.filter(p => p.team_id === selectedTeam.id);
    const teamFixtures = fixtures.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
    const teamStaff = staff.filter(s => s.team_type === "First Team");

    if (viewingPlayer) {
      const freshPlayer = players.find(p => p.id === viewingPlayer.id) || viewingPlayer;
      return (
        <div data-testid="team-detail-view">
          <AdminPlayerProfile player={freshPlayer} onBack={() => setViewingPlayer(null)} onRefresh={onRefresh} />
        </div>
      );
    }

    return (
      <div data-testid="team-detail-view">
        <button onClick={() => setSelectedTeam(null)} className="admin-btn-ghost text-sm mb-4" data-testid="back-to-teams">
          <ChevronRight size={14} className="rotate-180" /> Πίσω στις ομάδες
        </button>
        {selectedTeam.banner_url && (
          <div className="h-32 rounded-xl overflow-hidden mb-4 border border-[#262626]">
            <img src={selectedTeam.banner_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${selectedTeam.banner_url}` : selectedTeam.banner_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-['Bebas_Neue'] text-4xl text-[#F5A623] tracking-wide">{stripGreekAccents(selectedTeam.name)}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="admin-badge admin-badge-gold">{selectedTeam.level}</span>
              {selectedTeam.description && <span className="text-zinc-300 text-sm">{selectedTeam.description}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-1 mb-6 border-b border-[#262626] pb-0 overflow-x-auto">
          {[
            { id: "roster", label: "Ρόστερ", icon: Users, count: teamPlayers.length },
            { id: "schedule", label: "Πρόγραμμα", icon: Calendar, count: teamFixtures.length },
            { id: "training", label: "Προπονήσεις", icon: Dumbbell, count: null },
            { id: "videos", label: "Βίντεο", icon: Video, count: null },
            { id: "team_staff", label: "Staff", icon: UserCog, count: teamStaff.length },
            { id: "standings_tab", label: "Βαθμολογία", icon: Trophy, count: standings?.length || 0 },
            { id: "gallery", label: "Γκαλερί", icon: Image, count: galleryItems.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setDetailTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] whitespace-nowrap ${
                detailTab === tab.id ? 'border-[#F5A623] text-[#F5A623]' : 'border-transparent text-zinc-400 hover:text-white'
              }`} data-testid={`team-tab-${tab.id}`}>
              <tab.icon size={15} /> {tab.label}
              <span className="text-xs ml-1 opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {detailTab === "roster" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={openCreatePlayer} className="admin-btn-primary" data-testid="add-team-player-btn"><Plus size={14} /> Νέος Παίκτης</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="team-players-table">
                <thead><tr><th>#</th><th></th><th>Όνομα</th><th>Θέση</th><th>Ηλικία</th><th></th></tr></thead>
                <tbody>
                  {teamPlayers.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => setViewingPlayer(p)}>
                      <td className="font-mono text-zinc-400">{p.number}</td>
                      <td>{p.image_url ? <img src={p.image_url} alt="" className="w-9 h-9 object-cover rounded-full" /> : <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center"><Users size={14} className="text-zinc-600" /></div>}</td>
                      <td className="font-medium text-[#F5A623] hover:underline" data-testid={`view-team-player-${p.id}`}>{p.name}</td>
                      <td className="text-zinc-300">{p.position}</td>
                      <td className="text-zinc-300">{p.age}</td>
                      <td>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditPlayer(p)} className="admin-icon-btn" data-testid={`edit-team-player-${p.id}`}><Edit2 size={14} /></button>
                          <button onClick={() => handleDeletePlayer(p.id)} className="admin-icon-btn text-red-500/70 hover:text-red-400" data-testid={`delete-team-player-${p.id}`}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {teamPlayers.length === 0 && <tr><td colSpan={6}><EmptyState icon={Users} text="Δεν υπάρχουν παίκτες" /></td></tr>}
                </tbody>
              </table>
            </div>
            {showPlayerForm && (
              <FormModal title={editPlayer ? "Επεξεργασία Παίκτη" : "Νέος Παίκτης"} onClose={() => setShowPlayerForm(false)} onSave={handleSavePlayer} saving={savingPlayer}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Όνομα *"><AdminInput value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} data-testid="team-player-name" /></Field>
                  <Field label="Αριθμός *"><AdminInput type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} data-testid="team-player-number" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Θέση *">
                    <AdminSelect value={playerForm.position} onChange={e => setPlayerForm({...playerForm, position: e.target.value})}>
                      <option value="Goalkeeper">Τερματοφύλακας</option><option value="Defender">Αμυντικός</option><option value="Midfielder">Μέσος</option><option value="Forward">Επιθετικός</option>
                    </AdminSelect>
                  </Field>
                  <Field label="Εθνικότητα"><AdminInput value={playerForm.nationality} onChange={e => setPlayerForm({...playerForm, nationality: e.target.value})} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Ημ. Γέννησης *">
                    <AdminInput type="date" value={playerForm.date_of_birth} onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})} />
                    {playerForm.date_of_birth && <span className="text-xs text-[#10B981] mt-1 block">Ηλικία: {calcAge(playerForm.date_of_birth)} ετών</span>}
                  </Field>
                  <Field label="Ύψος"><AdminInput placeholder="1.85m" value={playerForm.height} onChange={e => setPlayerForm({...playerForm, height: e.target.value})} /></Field>
                  <Field label="Βάρος"><AdminInput placeholder="78kg" value={playerForm.weight} onChange={e => setPlayerForm({...playerForm, weight: e.target.value})} /></Field>
                </div>
                <ImageUpload currentUrl={playerForm.image_url} onImageChange={url => setPlayerForm({...playerForm, image_url: url})} playerId={editPlayer?.id} />
                <Field label="Βιογραφικό"><AdminTextarea rows={2} value={playerForm.bio} onChange={e => setPlayerForm({...playerForm, bio: e.target.value})} /></Field>
              </FormModal>
            )}
          </div>
        )}

        {detailTab === "schedule" && (
          <div className="space-y-2" data-testid="team-fixtures-list">
            {teamFixtures.map(f => {
              const isExp = expandedTeamFixtureId === f.id;
              return (
                <div key={f.id} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden" data-testid={`team-fixture-card-${f.id}`}>
                  <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpandedTeamFixtureId(isExp ? null : f.id)}>
                    <div className={`w-1 h-10 rounded-full ${f.status === 'Completed' ? 'bg-emerald-500' : f.status === 'Live' ? 'bg-red-500' : 'bg-[#F5A623]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.home_team}</span>
                        <span className="font-['Bebas_Neue'] text-zinc-400 text-sm">{f.status === 'Completed' || f.status === 'Live' ? `${f.home_score ?? 0} - ${f.away_score ?? 0}` : 'vs'}</span>
                        <span className={`text-sm font-medium ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.away_team}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ml-1 ${f.status === 'Completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : f.status === 'Live' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10'}`}>
                          {f.status === 'Completed' ? 'Ολοκλ.' : f.status === 'Live' ? 'LIVE' : 'Προγρ.'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        {f.match_date && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(f.match_date).toLocaleDateString('el-GR')}</span>}
                        {f.match_time && <span>{f.match_time}</span>}
                        {f.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {f.venue}</span>}
                      </div>
                    </div>
                    {isExp ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                  </div>
                  {isExp && (
                    <div className="border-t border-[#1e1e1e] p-4">
                      <InlineAttendance eventId={f.id} players={teamPlayers} />
                    </div>
                  )}
                </div>
              );
            })}
            {teamFixtures.length === 0 && (
              <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-12 text-center">
                <Calendar size={36} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Δεν υπάρχουν αγώνες</p>
              </div>
            )}
          </div>
        )}

        {detailTab === "training" && (
          <TrainingSessionsPanel teamId={selectedTeam.id} facilities={facilities} players={teamPlayers} />
        )}

        {detailTab === "videos" && (
          <VideoAnalyticsPanel teamId={selectedTeam.id} players={teamPlayers} />
        )}

        {detailTab === "team_staff" && (
          <div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="team-staff-table">
                <thead><tr><th></th><th>Όνομα</th><th>Ρόλος</th></tr></thead>
                <tbody>
                  {teamStaff.map(s => (
                    <tr key={s.id}>
                      <td>{s.image_url ? <img src={s.image_url} alt="" className="w-9 h-9 object-cover rounded-full" /> : <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center"><UserCog size={14} className="text-zinc-600" /></div>}</td>
                      <td className="font-medium text-white">{s.name}</td>
                      <td className="text-zinc-300">{s.role}</td>
                    </tr>
                  ))}
                  {teamStaff.length === 0 && <tr><td colSpan={3}><EmptyState icon={UserCog} text="Δεν υπάρχουν μέλη staff" /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === "standings_tab" && (
          <StandingsTab standings={standings} onRefresh={onRefresh} />
        )}

        {detailTab === "gallery" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowGalleryForm(true)} className="admin-btn-primary" data-testid="add-team-gallery-btn"><Plus size={14} /> Νέα Φωτογραφία</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryItems.map(item => (
                <div key={item.id} className="bg-[#151515] border border-[#262626] rounded-lg overflow-hidden group" data-testid={`gallery-item-${item.id}`}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="admin-badge admin-badge-default text-xs">{item.category}</span>
                      <button onClick={() => handleDeleteGallery(item.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {galleryItems.length === 0 && <div className="col-span-full"><EmptyState icon={Image} text="Δεν υπάρχουν φωτογραφίες" /></div>}
            </div>
            {showGalleryForm && (
              <FormModal title="Νέα Φωτογραφία" onClose={() => setShowGalleryForm(false)} onSave={handleSaveGallery} saving={savingGallery}>
                <Field label="Τίτλος *"><AdminInput value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} /></Field>
                <Field label="Εικόνα *">
                  <div className="flex gap-2">
                    <AdminInput value={galleryForm.image_url} onChange={e => setGalleryForm({...galleryForm, image_url: e.target.value})} placeholder="URL εικόνας" className="flex-1" />
                    <label className="admin-btn-ghost cursor-pointer flex items-center">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      {uploadingFile ? <RefreshCw size={14} className="animate-spin" /> : "Upload"}
                    </label>
                  </div>
                </Field>
                <Field label="Κατηγορία">
                  <AdminSelect value={galleryForm.category} onChange={e => setGalleryForm({...galleryForm, category: e.target.value})}>
                    <option value="Match Day">Match Day</option><option value="Training">Training</option><option value="Team Events">Team Events</option><option value="Fans">Fans</option><option value="Other">Other</option>
                  </AdminSelect>
                </Field>
                <Field label="Περιγραφή"><AdminInput value={galleryForm.description} onChange={e => setGalleryForm({...galleryForm, description: e.target.value})} /></Field>
              </FormModal>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="admin-teams-tab">
      <TabHeader title="Ομάδες" count={teams.length}>
        <button onClick={openCreateTeam} className="admin-btn-primary" data-testid="add-team-btn"><Plus size={14} /> Νέα Ομάδα</button>
      </TabHeader>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <div key={team.id} className="admin-card overflow-hidden cursor-pointer hover:border-[#F5A623]/40 transition-colors group" onClick={() => { setSelectedTeam(team); setDetailTab("roster"); }} data-testid={`team-card-${team.id}`}>
            {team.banner_url && (
              <div className="h-24 overflow-hidden">
                <img src={team.banner_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${team.banner_url}` : team.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-['Bebas_Neue'] text-2xl text-white group-hover:text-[#F5A623] transition-colors">{stripGreekAccents(team.name)}</h3>
                  <span className="admin-badge admin-badge-gold mt-1">{team.level}</span>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEditTeam(team)} className="admin-icon-btn" data-testid={`edit-team-${team.id}`}><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteTeam(team.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400" data-testid={`delete-team-${team.id}`}><Trash2 size={14} /></button>
                </div>
              </div>
              {team.description && <p className="text-zinc-400 text-sm mb-3">{team.description}</p>}
              <div className="flex gap-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><Users size={14} /> {team.player_count || 0} παίκτες</span>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#F5A623] ml-auto transition-colors" />
              </div>
            </div>
          </div>
        ))}
        {teams.length === 0 && <EmptyState icon={Shield} text="Δεν υπάρχουν ομάδες" />}
      </div>
      {showForm && (
        <FormModal title={editTeam ? "Επεξεργασία Ομάδας" : "Νέα Ομάδα"} onClose={() => setShowForm(false)} onSave={handleSaveTeam} saving={saving}>
          <Field label="Όνομα *"><AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="team-name-input" /></Field>
          <Field label="Επίπεδο">
            <AdminSelect value={form.level} onChange={e => setForm({...form, level: e.target.value})} data-testid="team-level-select">
              <option value="Α' Ομάδα">Α' Ομάδα</option>
              <option value="Εφεδρική">Εφεδρική</option>
              <option value="Νέων">Νέων</option>
            </AdminSelect>
          </Field>
          <Field label="Περιγραφή"><AdminTextarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} data-testid="team-desc-input" /></Field>
          <Field label="Banner Ομάδας">
            <div className="flex items-center gap-3">
              {form.banner_url && (
                <div className="relative h-16 w-32 rounded overflow-hidden border border-[#262626]">
                  <img src={form.banner_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${form.banner_url}` : form.banner_url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({...form, banner_url: ""})} className="absolute top-0.5 right-0.5 bg-black/60 rounded p-0.5 text-red-400 hover:text-red-300"><X size={12} /></button>
                </div>
              )}
              <label className="admin-btn-ghost cursor-pointer flex items-center gap-1.5" data-testid="team-banner-upload">
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                {uploadingBanner ? <RefreshCw size={14} className="animate-spin" /> : <><Upload size={14} /> {form.banner_url ? "Αλλαγή" : "Ανέβασμα"}</>}
              </label>
            </div>
            <AdminInput value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})} placeholder="Ή επικολλήστε URL" className="mt-2" data-testid="team-banner-url" />
          </Field>
        </FormModal>
      )}
    </div>
  );
};

export default TeamsTab;
