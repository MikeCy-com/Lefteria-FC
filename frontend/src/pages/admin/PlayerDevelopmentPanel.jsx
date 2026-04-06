import { useState, useEffect, useCallback } from "react";
import { Plus, X, Save, RefreshCw, Trash2, Edit2, Target, CheckCircle, Circle, Pause, ChevronDown, ChevronRight } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

const CATEGORIES = [
  { value: "technical", label: "Τεχνική", color: "#3B82F6", icon: "T" },
  { value: "tactical", label: "Τακτική", color: "#F5A623", icon: "Τ" },
  { value: "physical", label: "Φυσική", color: "#10B981", icon: "Φ" },
  { value: "mental", label: "Ψυχολογική", color: "#A855F7", icon: "Ψ" },
];

const getCat = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[0];

const PlayerDevelopmentPanel = ({ playerId }) => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "technical", description: "", target_date: "", progress: 0,
    milestones: [{ text: "", completed: false }],
  });

  const fetchGoals = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/players/${playerId}/development`, { headers: getAuthHeaders() });
      setGoals(res.data);
    } catch (e) { console.error(e); }
  }, [playerId]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const openCreate = () => {
    setEditGoal(null);
    setForm({ title: "", category: "technical", description: "", target_date: "", progress: 0, milestones: [{ text: "", completed: false }] });
    setShowForm(true);
  };

  const openEdit = (g) => {
    setEditGoal(g);
    setForm({
      title: g.title, category: g.category, description: g.description || "",
      target_date: g.target_date || "", progress: g.progress || 0,
      milestones: g.milestones?.length ? g.milestones : [{ text: "", completed: false }],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) return alert("Τίτλος απαιτείται");
    setSaving(true);
    try {
      const payload = { ...form, milestones: form.milestones.filter(m => m.text.trim()) };
      if (editGoal) {
        await axios.put(`${API}/admin/development/${editGoal.id}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API}/admin/players/${playerId}/development`, payload, { headers: getAuthHeaders() });
      }
      setShowForm(false);
      fetchGoals();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή;")) return;
    try {
      await axios.delete(`${API}/admin/development/${id}`, { headers: getAuthHeaders() });
      fetchGoals();
    } catch (e) { alert("Σφάλμα"); }
  };

  const toggleMilestone = async (goal, mIdx) => {
    const updated = { ...goal, milestones: goal.milestones.map((m, i) => i === mIdx ? { ...m, completed: !m.completed } : m) };
    const completedCount = updated.milestones.filter(m => m.completed).length;
    updated.progress = Math.round((completedCount / updated.milestones.length) * 100);
    if (updated.progress === 100) updated.status = "completed";
    try {
      await axios.put(`${API}/admin/development/${goal.id}`, updated, { headers: getAuthHeaders() });
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const addMilestone = () => setForm(prev => ({ ...prev, milestones: [...prev.milestones, { text: "", completed: false }] }));
  const removeMilestone = (i) => setForm(prev => ({ ...prev, milestones: prev.milestones.filter((_, idx) => idx !== i) }));

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  return (
    <div data-testid="player-development-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-['Bebas_Neue'] text-xl text-white">Πλάνο Ανάπτυξης</h3>
        <button onClick={openCreate} className="admin-btn-primary text-xs" data-testid="add-goal-btn">
          <Plus size={12} /> Νέος Στόχος
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3 mb-6">
          {activeGoals.map(g => {
            const cat = getCat(g.category);
            return (
              <div key={g.id} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4" data-testid={`goal-${g.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}>
                      {cat.icon}
                    </div>
                    <div>
                      <h4 className="text-sm text-white font-medium">{g.title}</h4>
                      <span className="text-[9px] text-zinc-500">{cat.label} {g.target_date ? `| Στόχος: ${new Date(g.target_date).toLocaleDateString('el-GR')}` : ""}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="admin-icon-btn p-1"><Edit2 size={11} /></button>
                    <button onClick={() => handleDelete(g.id)} className="admin-icon-btn p-1 text-red-500/50"><Trash2 size={11} /></button>
                  </div>
                </div>

                {g.description && <p className="text-xs text-zinc-400 mb-3">{g.description}</p>}

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Πρόοδος</span>
                    <span style={{ color: cat.color }}>{g.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: cat.color }} />
                  </div>
                </div>

                {/* Milestones */}
                {g.milestones?.length > 0 && (
                  <div className="space-y-1.5">
                    {g.milestones.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => toggleMilestone(g, i)}
                        className="flex items-center gap-2 w-full text-left group"
                        data-testid={`milestone-${g.id}-${i}`}
                      >
                        {m.completed ? (
                          <CheckCircle size={14} style={{ color: cat.color }} />
                        ) : (
                          <Circle size={14} className="text-zinc-600 group-hover:text-zinc-400" />
                        )}
                        <span className={`text-xs ${m.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{m.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Ολοκληρωμένοι ({completedGoals.length})</h4>
          <div className="space-y-1.5">
            {completedGoals.map(g => {
              const cat = getCat(g.category);
              return (
                <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] opacity-60">
                  <CheckCircle size={14} style={{ color: cat.color }} />
                  <span className="text-xs text-zinc-400 flex-1">{g.title}</span>
                  <button onClick={() => handleDelete(g.id)} className="admin-icon-btn p-0.5 text-red-500/40"><Trash2 size={10} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-8 text-center">
          <Target size={32} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Δεν υπάρχουν στόχοι ανάπτυξης</p>
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" data-testid="goal-form-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h2 className="font-['Bebas_Neue'] text-xl text-white">{editGoal ? "Επεξεργασία Στόχου" : "Νέος Στόχος"}</h2>
              <button onClick={() => setShowForm(false)} className="admin-icon-btn"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Τίτλος *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                  placeholder="Π.χ. Βελτίωση αριστερού ποδιού" data-testid="goal-title-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Κατηγορία</label>
                  <div className="flex gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button key={cat.value} type="button" onClick={() => setForm({...form, category: cat.value})}
                        className={`flex-1 py-2 rounded-lg text-xs border transition-all text-center ${
                          form.category === cat.value ? 'font-medium' : 'opacity-40 hover:opacity-60'
                        }`}
                        style={{ borderColor: form.category === cat.value ? cat.color : '#333', color: cat.color, backgroundColor: form.category === cat.value ? `${cat.color}10` : 'transparent' }}
                        data-testid={`cat-${cat.value}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Στόχος Ημ.</label>
                  <input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Περιγραφή</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none resize-none" rows={2}
                  data-testid="goal-description-input" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Milestones</label>
                  <button type="button" onClick={addMilestone} className="text-[10px] text-[#F5A623] hover:underline">+ Προσθήκη</button>
                </div>
                <div className="space-y-1.5">
                  {form.milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Circle size={14} className="text-zinc-600 flex-shrink-0" />
                      <input value={m.text} onChange={e => {
                        const updated = [...form.milestones];
                        updated[i] = { ...updated[i], text: e.target.value };
                        setForm({...form, milestones: updated});
                      }} placeholder={`Milestone ${i + 1}`}
                        className="flex-1 bg-transparent border-b border-[#333] px-1 py-1 text-sm text-white focus:border-[#F5A623] outline-none" />
                      {form.milestones.length > 1 && (
                        <button type="button" onClick={() => removeMilestone(i)} className="admin-icon-btn p-0.5 text-red-500/40"><X size={11} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-goal-btn">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDevelopmentPanel;
