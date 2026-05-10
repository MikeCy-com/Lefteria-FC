import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus, Edit2, Trash2, X, RefreshCw, Save, Check, Euro, Calendar, AlertCircle,
  ChevronDown, ChevronUp, Receipt, Filter, Users, Clock,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const TYPE_LABELS = {
  training: "Προπονήσεις",
  event: "Εκδήλωση",
  grassroots: "Grassroots",
  registration: "Εγγραφή",
  equipment: "Εξοπλισμός",
  tournament: "Τουρνουά",
  transport: "Μεταφορά",
  other: "Άλλο",
};
const TYPE_COLORS = {
  training: "#10B981",
  event: "#A855F7",
  grassroots: "#F5A623",
  registration: "#3B82F6",
  equipment: "#06B6D4",
  tournament: "#EAB308",
  transport: "#EF4444",
  other: "#71717A",
};
const STATUS_LABELS = { pending: "Εκκρεμεί", paid: "Πληρώθηκε", overdue: "Ληγμένη", cancelled: "Ακυρώθηκε" };

const Field = ({ label, children }) => (
  <div>
    <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);
const AdminInput = (p) => <input {...p} className={`admin-input w-full ${p.className || ""}`} />;
const AdminSelect = (p) => <select {...p} className={`admin-input w-full ${p.className || ""}`} />;
const AdminTextarea = (p) => <textarea {...p} className={`admin-input w-full ${p.className || ""}`} />;

const Modal = ({ title, onClose, children, footer, size = "md" }) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div className={`bg-[#0a0a0a] border border-[#262626] rounded-xl w-full ${size === "lg" ? "max-w-4xl" : "max-w-2xl"} max-h-[92vh] overflow-hidden flex flex-col`}>
      <div className="px-6 py-4 border-b border-[#262626] flex justify-between items-center">
        <h3 className="font-['Bebas_Neue'] text-2xl text-[#F5A623] tracking-wide">{title}</h3>
        <button onClick={onClose} className="admin-icon-btn"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
      {footer && <div className="px-6 py-4 border-t border-[#262626] flex justify-end gap-2">{footer}</div>}
    </div>
  </div>
);

const ChargesTab = ({ players = [], academyGroups = [], teams = [], onRefresh: parentRefresh }) => {
  const [charges, setCharges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPlayer, setFilterPlayer] = useState("");
  const [showSingleForm, setShowSingleForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [editCharge, setEditCharge] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        axios.get(`${API}/admin/charges`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/charges/summary`, { headers: getAuthHeaders() }),
      ]);
      setCharges(c.data || []);
      setSummary(s.data || null);
    } catch (e) { /* noop */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => charges.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterPlayer && c.player_id !== filterPlayer) return false;
    return true;
  }), [charges, filterStatus, filterType, filterPlayer]);

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή χρέωσης;")) return;
    await axios.delete(`${API}/admin/charges/${id}`, { headers: getAuthHeaders() });
    fetchData();
  };

  return (
    <div data-testid="admin-charges-tab">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">Χρεωσεις</h2>
          <p className="text-zinc-500 text-sm">Διαχείριση χρεώσεων παικτών — προπονήσεις, εκδηλώσεις, εγγραφές, εξοπλισμός κ.ά.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkForm(true)} className="admin-btn-ghost" data-testid="bulk-charges-btn"><Calendar size={14} /> Μηνιαίες Συνδρομές</button>
          <button onClick={() => { setEditCharge(null); setShowSingleForm(true); }} className="admin-btn-primary" data-testid="add-charge-btn"><Plus size={14} /> Νέα Χρέωση</button>
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="admin-card p-4"><div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1"><Clock size={12} /> Εκκρεμεί</div><div className="font-['Bebas_Neue'] text-3xl text-[#F5A623]">€{summary.pending_total.toFixed(2)}</div></div>
          <div className="admin-card p-4"><div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1"><AlertCircle size={12} /> Ληγμένη</div><div className="font-['Bebas_Neue'] text-3xl text-red-400">€{summary.overdue_total.toFixed(2)}</div></div>
          <div className="admin-card p-4"><div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1"><Check size={12} /> Πληρωμένα</div><div className="font-['Bebas_Neue'] text-3xl text-emerald-400">€{summary.paid_total.toFixed(2)}</div></div>
          <div className="admin-card p-4"><div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1"><Receipt size={12} /> Συνολικά</div><div className="font-['Bebas_Neue'] text-3xl text-white">{charges.length}</div></div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-card p-3 mb-3 flex gap-2 items-center flex-wrap">
        <Filter size={14} className="text-zinc-500" />
        <AdminSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="!w-auto text-xs">
          <option value="all">Όλα τα Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </AdminSelect>
        <AdminSelect value={filterType} onChange={e => setFilterType(e.target.value)} className="!w-auto text-xs">
          <option value="all">Όλοι οι Τύποι</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </AdminSelect>
        <AdminSelect value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)} className="!w-auto text-xs flex-1 max-w-xs">
          <option value="">Όλοι οι Παίκτες</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team_type === "First Team" ? "Α'" : "Ακαδ"})</option>)}
        </AdminSelect>
        <button onClick={() => { setFilterStatus("all"); setFilterType("all"); setFilterPlayer(""); }} className="text-xs text-zinc-500 hover:text-white">Καθαρισμός</button>
        <span className="ml-auto text-xs text-zinc-500">{filtered.length} αποτελέσματα</span>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0d0d0d] text-zinc-500 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Παίκτης</th>
              <th className="text-left px-4 py-3">Τύπος</th>
              <th className="text-left px-4 py-3">Περιγραφή / Περίοδος</th>
              <th className="text-right px-4 py-3">Ποσό</th>
              <th className="text-left px-4 py-3">Λήξη</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const color = TYPE_COLORS[c.type] || "#71717A";
              const isPaid = c.status === "paid";
              const isOverdue = c.status === "overdue" || (c.status === "pending" && c.due_date && new Date(c.due_date) < new Date());
              return (
                <tr key={c.id} className="border-t border-[#1a1a1a] hover:bg-white/[0.02]" data-testid={`charge-row-${c.id}`}>
                  <td className="px-4 py-3 text-white">{c.player_name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] border" style={{ borderColor: `${color}50`, color, backgroundColor: `${color}15` }}>{TYPE_LABELS[c.type] || c.type}</span></td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">
                    <div>{c.description}</div>
                    {c.period_label && <div className="text-zinc-600 text-[10px]">{c.period_label}</div>}
                  </td>
                  <td className="px-4 py-3 text-right font-['Bebas_Neue'] text-lg" style={{ color: isPaid ? "#10B981" : "#fff" }}>€{c.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.due_date ? new Date(c.due_date).toLocaleDateString("el-GR") : "—"}</td>
                  <td className="px-4 py-3">
                    {isPaid && <span className="text-emerald-400 text-xs flex items-center gap-1"><Check size={11} /> Πληρώθηκε</span>}
                    {!isPaid && isOverdue && <span className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={11} /> Ληγμένη</span>}
                    {!isPaid && !isOverdue && c.status === "pending" && <span className="text-[#F5A623] text-xs flex items-center gap-1"><Clock size={11} /> Εκκρεμεί</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {!isPaid && <button onClick={() => setShowPaymentModal(c)} className="admin-icon-btn text-emerald-400 hover:text-emerald-300" title="Σήμανση πληρωμής" data-testid={`pay-${c.id}`}><Check size={13} /></button>}
                      <button onClick={() => { setEditCharge(c); setShowSingleForm(true); }} className="admin-icon-btn" data-testid={`edit-charge-${c.id}`}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(c.id)} className="admin-icon-btn text-red-400/70 hover:text-red-400" data-testid={`delete-charge-${c.id}`}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-500"><Receipt size={32} className="mx-auto mb-2 text-zinc-700" /><p>Δεν υπάρχουν χρεώσεις.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showSingleForm && (
        <ChargeForm
          editCharge={editCharge}
          players={players}
          onClose={() => { setShowSingleForm(false); setEditCharge(null); }}
          onSaved={() => { setShowSingleForm(false); setEditCharge(null); fetchData(); }}
        />
      )}
      {showBulkForm && (
        <BulkMonthlyForm
          players={players}
          academyGroups={academyGroups}
          onClose={() => setShowBulkForm(false)}
          onSaved={() => { setShowBulkForm(false); fetchData(); }}
        />
      )}
      {showPaymentModal && (
        <PaymentModal
          charge={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onSaved={() => { setShowPaymentModal(null); fetchData(); }}
        />
      )}
    </div>
  );
};

// ===================== Single Charge Form =====================
const ChargeForm = ({ editCharge, players, onClose, onSaved }) => {
  const empty = { player_id: "", type: "other", description: "", amount: "", due_date: "", season: "2025/26", period_label: "", notes: "" };
  const [form, setForm] = useState(editCharge ? { ...empty, ...editCharge, amount: String(editCharge.amount) } : empty);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.player_id || !form.description || !form.amount) { alert("Παίκτης, περιγραφή και ποσό είναι υποχρεωτικά"); return; }
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editCharge) await axios.put(`${API}/admin/charges/${editCharge.id}`, payload, { headers });
      else await axios.post(`${API}/admin/charges`, payload, { headers });
      onSaved();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  return (
    <Modal
      title={editCharge ? "Επεξεργασία Χρέωσης" : "Νέα Χρέωση"}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="admin-btn-ghost text-xs">Άκυρο</button>
        <button onClick={save} disabled={saving} className="admin-btn-primary" data-testid="save-charge-btn">{saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Αποθήκευση</button>
      </>}
    >
      <Field label="Παίκτης *">
        <AdminSelect value={form.player_id} onChange={e => setForm({...form, player_id: e.target.value})} data-testid="charge-player-select">
          <option value="">— Επιλέξτε —</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team_type === "First Team" ? "Α'" : "Ακαδ"})</option>)}
        </AdminSelect>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Τύπος *">
          <AdminSelect value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </AdminSelect>
        </Field>
        <Field label="Ποσό (€) *"><AdminInput type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} data-testid="charge-amount-input" /></Field>
      </div>
      <Field label="Περιγραφή *"><AdminInput value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Συνδρομή Σεπτεμβρίου / Εκπαιδευτική Ημερίδα..." data-testid="charge-description-input" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ημερομηνία Λήξης"><AdminInput type="date" value={form.due_date || ""} onChange={e => setForm({...form, due_date: e.target.value})} /></Field>
        <Field label="Σεζόν"><AdminInput value={form.season || ""} onChange={e => setForm({...form, season: e.target.value})} /></Field>
      </div>
      <Field label="Περίοδος (προαιρετικό)"><AdminInput value={form.period_label || ""} onChange={e => setForm({...form, period_label: e.target.value})} placeholder="Σεπτέμβριος 2025" /></Field>
      <Field label="Σημειώσεις"><AdminTextarea rows={2} value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
    </Modal>
  );
};

// ===================== Bulk Monthly Form =====================
const BulkMonthlyForm = ({ players, academyGroups, onClose, onSaved }) => {
  const today = new Date();
  const defaultFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [form, setForm] = useState({
    type: "training",
    description: "Μηνιαία Συνδρομή Προπονήσεων",
    amount_per_month: 35,
    from_year_month: defaultFrom,
    to_year_month: `${today.getFullYear() + 1}-05`, // typical Sep–May
    due_day: 5,
    season: "2025/26",
    notes: "",
  });
  const [groupFilter, setGroupFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  // Generate months preview
  const months = useMemo(() => {
    const list = [];
    const GR = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαϊ", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];
    const [fy, fm] = form.from_year_month.split("-").map(Number);
    const [ty, tm] = form.to_year_month.split("-").map(Number);
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      list.push(`${GR[m - 1]} ${y}`);
      m += 1;
      if (m > 12) { m = 1; y += 1; }
      if (list.length > 36) break;
    }
    return list;
  }, [form.from_year_month, form.to_year_month]);

  const eligiblePlayers = useMemo(() => {
    if (groupFilter === "") return players;
    if (groupFilter === "all_first_team") return players.filter(p => p.team_type === "First Team");
    if (groupFilter === "all_academy") return players.filter(p => p.team_type === "Academy");
    if (groupFilter.startsWith("group:")) return players.filter(p => p.academy_group_id === groupFilter.slice(6));
    return players;
  }, [players, groupFilter]);

  const toggle = (id) => setSelected(arr => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  const allIds = eligiblePlayers.map(p => p.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));

  const totalCharges = selected.length * months.length;
  const totalAmount = totalCharges * (parseFloat(form.amount_per_month) || 0);

  const save = async () => {
    if (selected.length === 0) { alert("Επιλέξτε τουλάχιστον έναν παίκτη"); return; }
    if (!form.amount_per_month || form.amount_per_month <= 0) { alert("Συμπληρώστε ποσό > 0"); return; }
    if (!window.confirm(`Δημιουργία ${totalCharges} χρεώσεων (${selected.length} παίκτες × ${months.length} μήνες) συνολικού ποσού €${totalAmount.toFixed(2)};`)) return;
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API}/admin/charges/bulk-monthly`, {
        ...form,
        amount_per_month: parseFloat(form.amount_per_month),
        due_day: parseInt(form.due_day) || 5,
        player_ids: selected,
      }, { headers });
      onSaved();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  return (
    <Modal
      title="Μαζική Δημιουργία Μηνιαίων Συνδρομών"
      size="lg"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="admin-btn-ghost text-xs">Άκυρο</button>
        <button onClick={save} disabled={saving || selected.length === 0} className="admin-btn-primary" data-testid="save-bulk-btn">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
          Δημιουργία {totalCharges > 0 && `(${totalCharges} χρεώσεις, €${totalAmount.toFixed(2)})`}
        </button>
      </>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Τύπος">
          <AdminSelect value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </AdminSelect>
        </Field>
        <Field label="Ποσό ανά μήνα (€) *"><AdminInput type="number" step="0.01" value={form.amount_per_month} onChange={e => setForm({...form, amount_per_month: e.target.value})} data-testid="bulk-amount-input" /></Field>
      </div>
      <Field label="Περιγραφή"><AdminInput value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Από Μήνα"><AdminInput type="month" value={form.from_year_month} onChange={e => setForm({...form, from_year_month: e.target.value})} data-testid="bulk-from-input" /></Field>
        <Field label="Έως Μήνα"><AdminInput type="month" value={form.to_year_month} onChange={e => setForm({...form, to_year_month: e.target.value})} data-testid="bulk-to-input" /></Field>
        <Field label="Ημέρα Λήξης (Μήνα)"><AdminInput type="number" min="1" max="31" value={form.due_day} onChange={e => setForm({...form, due_day: e.target.value})} /></Field>
      </div>

      {/* Months preview */}
      {months.length > 0 && (
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Μηνες ({months.length})</p>
          <div className="flex flex-wrap gap-1">
            {months.map((m, i) => <span key={i} className="px-2 py-1 text-[11px] bg-[#1a1a1a] text-zinc-300 rounded">{m}</span>)}
          </div>
        </div>
      )}

      <div className="border-t border-[#262626] pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white font-medium flex items-center gap-2"><Users size={14} /> Παικτες</p>
          <div className="flex items-center gap-2">
            <AdminSelect value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="!w-auto text-xs">
              <option value="">Όλοι</option>
              <option value="all_first_team">Α' Ομάδα</option>
              <option value="all_academy">Ακαδημία (όλοι)</option>
              {academyGroups.map(g => <option key={g.id} value={`group:${g.id}`}>Ακαδημία: {g.name}</option>)}
            </AdminSelect>
            <button onClick={() => setSelected(allSelected ? selected.filter(id => !allIds.includes(id)) : [...new Set([...selected, ...allIds])])} className="text-xs text-[#F5A623] hover:underline whitespace-nowrap">
              {allSelected ? "Αποεπιλογή" : "Επιλογή Όλων"}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 mb-2">Επιλεγμένοι: {selected.length} / {eligiblePlayers.length}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-72 overflow-y-auto bg-[#0d0d0d] border border-[#1e1e1e] rounded p-2">
          {eligiblePlayers.map(p => {
            const checked = selected.includes(p.id);
            return (
              <label key={p.id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${checked ? 'bg-[#F5A623]/10 border border-[#F5A623]/30' : 'border border-transparent hover:bg-white/5'}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} className="accent-[#F5A623] w-3.5 h-3.5" data-testid={`bulk-player-${p.id}`} />
                <span className="font-['Bebas_Neue'] text-xs text-zinc-500 w-6">{p.number || ""}</span>
                <span className="text-xs text-white truncate flex-1">{p.name}</span>
                <span className="text-[9px] text-zinc-500">{p.team_type === "First Team" ? "Α'" : "Ακαδ"}</span>
              </label>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

// ===================== Payment Modal =====================
const PaymentModal = ({ charge, onClose, onSaved }) => {
  const [paid_amount, setPaidAmount] = useState(charge.amount);
  const [payment_method, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/admin/charges/${charge.id}/mark-paid`, {
        paid_amount: parseFloat(paid_amount),
        payment_method,
        notes: notes || null,
      }, { headers: getAuthHeaders() });
      onSaved();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };

  return (
    <Modal
      title={`Πληρωμή — ${charge.player_name}`}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="admin-btn-ghost text-xs">Άκυρο</button>
        <button onClick={save} disabled={saving} className="admin-btn-primary" data-testid="confirm-payment-btn">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} Καταχώρηση Πληρωμής
        </button>
      </>}
    >
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded p-3 mb-2">
        <p className="text-zinc-300 text-sm">{charge.description}</p>
        {charge.period_label && <p className="text-zinc-500 text-xs">{charge.period_label}</p>}
        <p className="text-[#F5A623] font-['Bebas_Neue'] text-2xl mt-2">€{charge.amount.toFixed(2)}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ποσό που πληρώθηκε (€)"><AdminInput type="number" step="0.01" value={paid_amount} onChange={e => setPaidAmount(e.target.value)} data-testid="paid-amount-input" /></Field>
        <Field label="Τρόπος Πληρωμής">
          <AdminSelect value={payment_method} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="cash">Μετρητά</option>
            <option value="bank">Τράπεζα</option>
            <option value="card">Κάρτα</option>
            <option value="online">Online</option>
            <option value="other">Άλλο</option>
          </AdminSelect>
        </Field>
      </div>
      <Field label="Σημειώσεις"><AdminTextarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    </Modal>
  );
};

export default ChargesTab;
