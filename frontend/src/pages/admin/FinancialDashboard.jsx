import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  DollarSign, TrendingUp, AlertCircle, Clock, CheckCircle, Plus, X, Save,
  RefreshCw, Search, Filter, Users, ChevronDown, CreditCard, Banknote,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CATEGORIES = [
  { value: "subscription", label: "Συνδρομή" },
  { value: "fee", label: "Δίδακτρα" },
  { value: "equipment", label: "Εξοπλισμός" },
  { value: "other", label: "Άλλο" },
];

const STATUSES = [
  { value: "pending", label: "Εκκρεμεί", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  { value: "paid", label: "Πληρώθηκε", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { value: "overdue", label: "Ληξιπρόθεσμο", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
];

const METHODS = [
  { value: "cash", label: "Μετρητά" },
  { value: "bank", label: "Τράπεζα" },
  { value: "card", label: "Κάρτα" },
];

const MONTHS_GR = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαι", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];

const FinancialDashboard = ({ teams = [], academyGroups = [], players = [] }) => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // overview, records, generate
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    player_id: "", player_name: "", team_id: "", academy_group_id: "",
    category: "subscription", description: "", amount: "", status: "pending",
    due_date: "", paid_date: "", payment_method: "", notes: "",
  });

  const [generateForm, setGenerateForm] = useState({
    academy_group_id: "", team_id: "", amount: "", due_date: "",
    description: "Μηνιαία συνδρομή", category: "subscription",
  });

  const fetchData = useCallback(async () => {
    try {
      const [recRes, stRes] = await Promise.all([
        axios.get(`${API}/admin/financial/records`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/financial/stats`, { headers: getAuthHeaders() }),
      ]);
      setRecords(recRes.data);
      setStats(stRes.data);
    } catch (e) {
      console.error("Financial fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.amount || !form.description) return;
    setSaving(true);
    try {
      if (editingRecord) {
        await axios.put(`${API}/admin/financial/records/${editingRecord.id}`, form, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API}/admin/financial/records`, form, { headers: getAuthHeaders() });
      }
      setShowModal(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (record) => {
    try {
      await axios.put(`${API}/admin/financial/records/${record.id}/pay`, {
        payment_method: "cash",
      }, { headers: getAuthHeaders() });
      fetchData();
    } catch (e) {
      alert("Σφάλμα");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή εγγραφής;")) return;
    try {
      await axios.delete(`${API}/admin/financial/records/${id}`, { headers: getAuthHeaders() });
      fetchData();
    } catch (e) {
      alert("Σφάλμα");
    }
  };

  const handleGenerateDues = async () => {
    const groupId = generateForm.academy_group_id;
    const teamId = generateForm.team_id;
    if (!generateForm.amount || !generateForm.due_date) {
      alert("Συμπληρώστε ποσό και ημερομηνία");
      return;
    }
    const matchingPlayers = players.filter(p => {
      if (groupId) return p.academy_group_ids?.includes(groupId) || p.academy_group_id === groupId;
      if (teamId) return p.team_id === teamId;
      return false;
    });
    if (!matchingPlayers.length) {
      alert("Δεν βρέθηκαν παίκτες");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/admin/financial/generate-dues`, {
        player_ids: matchingPlayers.map(p => p.id),
        amount: parseFloat(generateForm.amount),
        due_date: generateForm.due_date,
        description: generateForm.description,
        category: generateForm.category,
        team_id: teamId || undefined,
        academy_group_id: groupId || undefined,
      }, { headers: getAuthHeaders() });
      alert(`Δημιουργήθηκαν ${res.data.count} εγγραφές`);
      setView("records");
      fetchData();
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => setForm({
    player_id: "", player_name: "", team_id: "", academy_group_id: "",
    category: "subscription", description: "", amount: "", status: "pending",
    due_date: "", paid_date: "", payment_method: "", notes: "",
  });

  const openEdit = (record) => {
    setForm({ ...record });
    setEditingRecord(record);
    setShowModal(true);
  };

  const openCreate = () => {
    resetForm();
    setEditingRecord(null);
    setShowModal(true);
  };

  const filteredRecords = records.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    if (searchQuery && !r.player_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusInfo = (status) => STATUSES.find(s => s.value === status) || STATUSES[0];
  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-[#F5A623]" />
    </div>
  );

  const maxRevenue = stats ? Math.max(...stats.monthly_revenue.map(m => m.revenue), 1) : 1;

  return (
    <div data-testid="financial-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">Οικονομικά</h2>
          <span className="text-sm text-zinc-400">{records.length} εγγραφές</span>
        </div>
        <div className="flex gap-2 items-center">
          {["overview", "records", "generate"].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${view === v ? 'bg-[#F5A623] text-black' : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-[#262626]'}`}
              data-testid={`fin-view-${v}`}>
              {v === "overview" ? "Επισκόπηση" : v === "records" ? "Εγγραφές" : "Χρεώσεις"}
            </button>
          ))}
          <button onClick={openCreate} className="admin-btn-primary" data-testid="create-financial-record">
            <Plus size={14} /> Νέα εγγραφή
          </button>
        </div>
      </div>

      {/* Overview */}
      {view === "overview" && stats && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard icon={TrendingUp} label="Σύνολο Εσόδων" value={`€${stats.total_revenue.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`} color="text-emerald-400" bg="bg-emerald-500/10" />
            <KPICard icon={Clock} label="Εκκρεμή" value={`€${stats.total_pending.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`} sub={`${stats.pending_count} εγγραφές`} color="text-yellow-400" bg="bg-yellow-500/10" />
            <KPICard icon={AlertCircle} label="Ληξιπρόθεσμα" value={`€${stats.total_overdue.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`} sub={`${stats.overdue_count} εγγραφές`} color="text-red-400" bg="bg-red-500/10" />
            <KPICard icon={DollarSign} label="Αναμενόμενα" value={`€${stats.total_expected.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`} sub={`${stats.record_count} σύνολο`} color="text-[#F5A623]" bg="bg-[#F5A623]/10" />
          </div>

          {/* Revenue Chart */}
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="revenue-chart">
            <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Μηνιαία Έσοδα {new Date().getFullYear()}</h3>
            <div className="flex items-end gap-1 h-40">
              {stats.monthly_revenue.map((m, i) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-500">{m.revenue > 0 ? `€${m.revenue}` : ""}</span>
                  <div className="w-full bg-[#F5A623]/20 rounded-t relative" style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%` }}>
                    <div className="absolute inset-0 bg-[#F5A623] rounded-t opacity-60" style={{ height: `${(m.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-500">{MONTHS_GR[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown + Overdue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="category-breakdown">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Ανά Κατηγορία</h3>
              {Object.entries(stats.by_category).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.by_category).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between items-center py-2 border-b border-[#1e1e1e] last:border-0">
                      <span className="text-sm text-zinc-400">{getCategoryLabel(cat)}</span>
                      <span className="text-sm text-white font-medium">€{amount.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Δεν υπάρχουν δεδομένα</p>
              )}
            </div>

            <div className="bg-[#121212] border border-[#262626] rounded-xl p-6" data-testid="overdue-list">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-red-400" /> Ληξιπρόθεσμα
              </h3>
              {stats.overdue_records.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.overdue_records.map(r => (
                    <div key={r.id} className="flex justify-between items-center py-2 border-b border-[#1e1e1e] last:border-0">
                      <div>
                        <span className="text-sm text-white">{r.player_name}</span>
                        <span className="text-xs text-zinc-500 ml-2">{r.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-400 font-medium">€{r.amount}</span>
                        <button onClick={() => handleMarkPaid(r)} className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded" data-testid={`pay-overdue-${r.id}`}>
                          Πληρωμή
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle size={14} /> Κανένα ληξιπρόθεσμο</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      {view === "records" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Αναζήτηση παίκτη / περιγραφής..."
                className="admin-input pl-9 w-full" data-testid="fin-search" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="admin-input" data-testid="fin-filter-status">
              <option value="">Όλες οι καταστάσεις</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="admin-input" data-testid="fin-filter-category">
              <option value="">Όλες οι κατηγορίες</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="financial-records-table">
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-400 text-left">
                    <th className="px-4 py-3 font-medium">Παίκτης</th>
                    <th className="px-4 py-3 font-medium">Περιγραφή</th>
                    <th className="px-4 py-3 font-medium">Κατηγορία</th>
                    <th className="px-4 py-3 font-medium">Ποσό</th>
                    <th className="px-4 py-3 font-medium">Κατάσταση</th>
                    <th className="px-4 py-3 font-medium">Ημ. Οφειλής</th>
                    <th className="px-4 py-3 font-medium">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-zinc-500">Δεν βρέθηκαν εγγραφές</td></tr>
                  ) : (
                    filteredRecords.map(r => {
                      const st = getStatusInfo(r.status);
                      return (
                        <tr key={r.id} className="border-b border-[#1e1e1e] hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-white">{r.player_name || "—"}</td>
                          <td className="px-4 py-3 text-zinc-400">{r.description}</td>
                          <td className="px-4 py-3"><span className="text-zinc-300 text-xs">{getCategoryLabel(r.category)}</span></td>
                          <td className="px-4 py-3 text-white font-medium">€{parseFloat(r.amount).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded border ${st.bg} ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{r.due_date || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {r.status !== "paid" && (
                                <button onClick={() => handleMarkPaid(r)} className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded" data-testid={`pay-${r.id}`}>
                                  Πληρωμή
                                </button>
                              )}
                              <button onClick={() => openEdit(r)} className="text-xs text-zinc-400 hover:text-white border border-[#333] px-2 py-0.5 rounded" data-testid={`edit-${r.id}`}>
                                Επεξ.
                              </button>
                              <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-0.5 rounded" data-testid={`del-${r.id}`}>
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Generate Dues */}
      {view === "generate" && (
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 max-w-xl" data-testid="generate-dues-form">
          <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Μαζική Χρέωση Παικτών</h3>
          <p className="text-sm text-zinc-400 mb-6">Δημιουργήστε χρεώσεις για όλους τους παίκτες μιας ομάδας/ακαδημίας.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ακαδημία</label>
              <select value={generateForm.academy_group_id} onChange={e => setGenerateForm({ ...generateForm, academy_group_id: e.target.value, team_id: "" })} className="admin-input w-full" data-testid="gen-group">
                <option value="">— Επιλέξτε ομάδα ακαδημίας —</option>
                {academyGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ή Α' Ομάδα</label>
              <select value={generateForm.team_id} onChange={e => setGenerateForm({ ...generateForm, team_id: e.target.value, academy_group_id: "" })} className="admin-input w-full" data-testid="gen-team">
                <option value="">— Επιλέξτε ομάδα —</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ποσό (€)</label>
                <input type="number" value={generateForm.amount} onChange={e => setGenerateForm({ ...generateForm, amount: e.target.value })} className="admin-input w-full" placeholder="0.00" data-testid="gen-amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ημ. Οφειλής</label>
                <input type="date" value={generateForm.due_date} onChange={e => setGenerateForm({ ...generateForm, due_date: e.target.value })} className="admin-input w-full" data-testid="gen-due-date" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Περιγραφή</label>
              <input value={generateForm.description} onChange={e => setGenerateForm({ ...generateForm, description: e.target.value })} className="admin-input w-full" data-testid="gen-desc" />
            </div>
            <button onClick={handleGenerateDues} disabled={saving} className="admin-btn-primary w-full" data-testid="gen-submit">
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Δημιουργία...</> : <><Users size={14} /> Δημιουργία Χρεώσεων</>}
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10 rounded-t-lg">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white">{editingRecord ? "Επεξεργασία" : "Νέα Εγγραφή"}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Παίκτης</label>
                <select value={form.player_id} onChange={e => {
                  const p = players.find(pl => pl.id === e.target.value);
                  setForm({ ...form, player_id: e.target.value, player_name: p?.name || "" });
                }} className="admin-input w-full" data-testid="fin-player-select">
                  <option value="">— Επιλέξτε παίκτη —</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Κατηγορία</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="admin-input w-full" data-testid="fin-category">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Ποσό (€)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="admin-input w-full" data-testid="fin-amount" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Περιγραφή</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="admin-input w-full" data-testid="fin-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Κατάσταση</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="admin-input w-full" data-testid="fin-status">
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Ημ. Οφειλής</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="admin-input w-full" data-testid="fin-due-date" />
                </div>
              </div>
              {form.status === "paid" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Ημ. Πληρωμής</label>
                    <input type="date" value={form.paid_date} onChange={e => setForm({ ...form, paid_date: e.target.value })} className="admin-input w-full" data-testid="fin-paid-date" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Τρόπος Πληρωμής</label>
                    <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="admin-input w-full" data-testid="fin-method">
                      <option value="">—</option>
                      {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Σημειώσεις</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="admin-input w-full" rows={2} data-testid="fin-notes" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a]">
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary flex-1" data-testid="fin-save">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
              <button onClick={() => setShowModal(false)} className="admin-btn-ghost flex-1">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className={`${bg} border border-[#262626] rounded-xl p-5`} data-testid={`kpi-${label}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon size={20} className={color} />
      </div>
      <span className="text-sm text-zinc-400">{label}</span>
    </div>
    <div className={`font-['Bebas_Neue'] text-2xl ${color}`}>{value}</div>
    {sub && <span className="text-xs text-zinc-500">{sub}</span>}
  </div>
);

export default FinancialDashboard;
