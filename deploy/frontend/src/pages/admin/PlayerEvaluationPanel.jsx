import { useState, useEffect, useCallback } from "react";
import { Plus, X, Save, RefreshCw, Trash2, Star, TrendingUp } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

const RATING_CATEGORIES = [
  { key: "technical", label: "Τεχνική", color: "#3B82F6" },
  { key: "tactical", label: "Τακτική", color: "#F5A623" },
  { key: "physical", label: "Φυσική", color: "#10B981" },
  { key: "mental", label: "Ψυχολογία", color: "#A855F7" },
  { key: "teamwork", label: "Ομαδικότητα", color: "#EC4899" },
];

const RatingBar = ({ value, maxValue = 10, color }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="flex-1 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${(value / maxValue) * 100}%`, backgroundColor: color }} />
    </div>
    <span className="font-['Bebas_Neue'] text-base w-6 text-right" style={{ color }}>{value}</span>
  </div>
);

const RatingInput = ({ value, onChange, color, label }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-zinc-400 w-24">{label}</span>
    <input type="range" min="1" max="10" value={value} onChange={e => onChange(parseInt(e.target.value))}
      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
      style={{ accentColor: color, background: `linear-gradient(to right, ${color} ${(value / 10) * 100}%, #1a1a1a ${(value / 10) * 100}%)` }} />
    <span className="font-['Bebas_Neue'] text-lg w-6 text-right" style={{ color }}>{value}</span>
  </div>
);

const PlayerEvaluationPanel = ({ playerId }) => {
  const [evals, setEvals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    period: "", ratings: { technical: 5, tactical: 5, physical: 5, mental: 5, teamwork: 5 },
    strengths: "", areas_to_improve: "", coach_notes: "",
  });

  const fetchEvals = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/players/${playerId}/evaluations`, { headers: getAuthHeaders() });
      setEvals(res.data);
    } catch (e) { console.error(e); }
  }, [playerId]);

  useEffect(() => { fetchEvals(); }, [fetchEvals]);

  const months = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαϊ", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];
  const now = new Date();
  const defaultPeriod = `${months[now.getMonth()]} ${now.getFullYear()}`;

  const openCreate = () => {
    setForm({
      period: defaultPeriod, ratings: { technical: 5, tactical: 5, physical: 5, mental: 5, teamwork: 5 },
      strengths: "", areas_to_improve: "", coach_notes: "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.period) return alert("Περίοδος απαιτείται");
    setSaving(true);
    try {
      const overall = Math.round(Object.values(form.ratings).reduce((s, v) => s + v, 0) / RATING_CATEGORIES.length * 10) / 10;
      await axios.post(`${API}/admin/players/${playerId}/evaluations`, { ...form, overall }, { headers: getAuthHeaders() });
      setShowForm(false);
      fetchEvals();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή;")) return;
    try {
      await axios.delete(`${API}/admin/evaluations/${id}`, { headers: getAuthHeaders() });
      fetchEvals();
    } catch (e) { alert("Σφάλμα"); }
  };

  const updateRating = (key, value) => {
    setForm(prev => ({ ...prev, ratings: { ...prev.ratings, [key]: value } }));
  };

  return (
    <div data-testid="player-evaluation-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-['Bebas_Neue'] text-xl text-white">Αξιολογησεις</h3>
        <button onClick={openCreate} className="admin-btn-primary text-xs" data-testid="add-evaluation-btn">
          <Plus size={12} /> Νέα Αξιολόγηση
        </button>
      </div>

      {evals.length > 0 ? (
        <div className="space-y-4">
          {evals.map((ev, idx) => (
            <div key={ev.id} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden" data-testid={`eval-${ev.id}`}>
              <div className="flex items-center justify-between p-4 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center">
                    <span className="font-['Bebas_Neue'] text-lg text-[#F5A623]">{ev.overall}</span>
                  </div>
                  <div>
                    <span className="text-sm text-white font-medium">{ev.period}</span>
                    <div className="text-[9px] text-zinc-500">Αξιολογήθηκε από {ev.evaluated_by}</div>
                  </div>
                </div>
                <button onClick={() => handleDelete(ev.id)} className="admin-icon-btn text-red-500/50"><Trash2 size={12} /></button>
              </div>

              <div className="p-4 space-y-2.5">
                {RATING_CATEGORIES.map(cat => (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 w-24">{cat.label}</span>
                    <RatingBar value={ev.ratings?.[cat.key] || 0} color={cat.color} />
                  </div>
                ))}
              </div>

              {(ev.strengths || ev.areas_to_improve || ev.coach_notes) && (
                <div className="px-4 pb-4 space-y-2">
                  {ev.strengths && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <span className="text-[9px] text-emerald-400 uppercase tracking-wider block mb-0.5">Δυνατα Σημεια</span>
                      <p className="text-xs text-zinc-300">{ev.strengths}</p>
                    </div>
                  )}
                  {ev.areas_to_improve && (
                    <div className="p-2.5 rounded-lg bg-[#F5A623]/5 border border-[#F5A623]/10">
                      <span className="text-[9px] text-[#F5A623] uppercase tracking-wider block mb-0.5">Προς Βελτιωση</span>
                      <p className="text-xs text-zinc-300">{ev.areas_to_improve}</p>
                    </div>
                  )}
                  {ev.coach_notes && (
                    <div className="p-2.5 rounded-lg bg-[#1a1a1a]">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-0.5">Σημειωσεις Προπονητη</span>
                      <p className="text-xs text-zinc-300">{ev.coach_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Trend indicator vs previous eval */}
              {idx < evals.length - 1 && (
                <div className="px-4 pb-3">
                  {(() => {
                    const prev = evals[idx + 1];
                    const diff = (ev.overall || 0) - (prev.overall || 0);
                    if (diff === 0) return null;
                    return (
                      <span className={`text-[9px] flex items-center gap-1 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <TrendingUp size={10} className={diff < 0 ? 'rotate-180' : ''} />
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)} από {prev.period}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-8 text-center">
          <Star size={32} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Δεν υπάρχουν αξιολογήσεις</p>
        </div>
      )}

      {/* Evaluation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center overflow-y-auto" data-testid="eval-form-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-lg mx-4 my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h2 className="font-['Bebas_Neue'] text-xl text-white">Νεα Αξιολογηση</h2>
              <button onClick={() => setShowForm(false)} className="admin-icon-btn"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Περιοδος *</label>
                <input value={form.period} onChange={e => setForm({...form, period: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                  placeholder="Π.χ. Φεβ 2026" data-testid="eval-period-input" />
              </div>

              {/* Rating Sliders */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300 uppercase tracking-wider">Βαθμολογια (1-10)</label>
                {RATING_CATEGORIES.map(cat => (
                  <RatingInput key={cat.key} label={cat.label} value={form.ratings[cat.key]} color={cat.color}
                    onChange={(v) => updateRating(cat.key, v)} />
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-[#1e1e1e]">
                  <span className="text-xs text-zinc-400">Συνολική Βαθμολογία</span>
                  <span className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">
                    {(Object.values(form.ratings).reduce((s, v) => s + v, 0) / RATING_CATEGORIES.length).toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Δυνατα Σημεια</label>
                <textarea value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none resize-none" rows={2}
                  data-testid="eval-strengths-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Προς Βελτιωση</label>
                <textarea value={form.areas_to_improve} onChange={e => setForm({...form, areas_to_improve: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none resize-none" rows={2}
                  data-testid="eval-improve-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Σημειωσεις Προπονητη</label>
                <textarea value={form.coach_notes} onChange={e => setForm({...form, coach_notes: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none resize-none" rows={2}
                  data-testid="eval-notes-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-eval-btn">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerEvaluationPanel;
