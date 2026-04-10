import { useState, useEffect } from "react";
import axios from "axios";
import { Edit2, Trash2, X, RefreshCw, Ticket } from "lucide-react";
import { API, getAuthHeaders } from "./shared";

const authH = getAuthHeaders;

export const AdminProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: 0, image_url: "", category: "clothing", sizes: [], in_stock: true, delivery_options: ["Παραλαβή", "Αποστολή"] });
  const [loading, setLoading] = useState(true);
  const [sizeInput, setSizeInput] = useState("");

  const fetch = async () => {
    try { const res = await axios.get(`${API}/admin/products`, { headers: authH() }); setProducts(res.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setForm({ name: "", description: "", price: 0, image_url: "", category: "clothing", sizes: [], in_stock: true, delivery_options: ["Παραλαβή", "Αποστολή"] }); setEditing(null); setSizeInput(""); };

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/admin/products/${editing}`, form, { headers: authH() });
      } else {
        await axios.post(`${API}/admin/products`, form, { headers: authH() });
      }
      resetForm();
      fetch();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (p) => { setEditing(p.id); setForm({ name: p.name, description: p.description || "", price: p.price, image_url: p.image_url || "", category: p.category || "clothing", sizes: p.sizes || [], in_stock: p.in_stock !== false, delivery_options: p.delivery_options || ["Παραλαβή", "Αποστολή"] }); };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή προϊόντος;")) return;
    try { await axios.delete(`${API}/admin/products/${id}`, { headers: authH() }); fetch(); } catch {}
  };

  const addSize = () => { if (sizeInput.trim() && !form.sizes.includes(sizeInput.trim())) { setForm({ ...form, sizes: [...form.sizes, sizeInput.trim()] }); setSizeInput(""); } };
  const removeSize = (s) => setForm({ ...form, sizes: form.sizes.filter(x => x !== s) });

  return (
    <div data-testid="admin-products-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Διαχείριση Προϊόντων</h2>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-6">
        <h3 className="text-sm text-zinc-400 mb-3">{editing ? "Επεξεργασία Προϊόντος" : "Νέο Προϊόν"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Όνομα" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="product-name-input" />
          <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} placeholder="Τιμή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="product-price-input" />
          <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="URL Εικόνας" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white">
            <option value="clothing">Ρουχισμός</option>
            <option value="accessories">Αξεσουάρ</option>
          </select>
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Περιγραφή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white md:col-span-2" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-zinc-500">Μεγέθη:</span>
          {form.sizes.map(s => (
            <span key={s} className="flex items-center gap-1 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded">
              {s} <button onClick={() => removeSize(s)} className="text-zinc-500 hover:text-red-400"><X size={10} /></button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSize())} placeholder="π.χ. XL" className="bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-xs text-white w-16" />
            <button onClick={addSize} className="text-[#F5A623] text-xs">+</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-zinc-500">Παράδοση:</span>
          {["Παραλαβή", "Αποστολή"].map(d => (
            <label key={d} className="flex items-center gap-1 text-xs text-zinc-300">
              <input type="checkbox" checked={form.delivery_options.includes(d)} onChange={e => {
                const opts = e.target.checked ? [...form.delivery_options, d] : form.delivery_options.filter(x => x !== d);
                setForm({...form, delivery_options: opts});
              }} /> {d}
            </label>
          ))}
          <label className="flex items-center gap-1 text-xs text-zinc-300 ml-4">
            <input type="checkbox" checked={form.in_stock} onChange={e => setForm({...form, in_stock: e.target.checked})} /> Σε απόθεμα
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="bg-[#F5A623] text-black text-sm font-semibold px-4 py-2 rounded hover:bg-[#e6951a] transition-colors" data-testid="product-save-btn">
            {editing ? "Ενημέρωση" : "Δημιουργία"}
          </button>
          {editing && <button onClick={resetForm} className="text-zinc-400 text-sm px-4 py-2 hover:text-white">Ακύρωση</button>}
        </div>
      </div>

      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto"></div></div> : (
        <div className="space-y-2" data-testid="products-list">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              {p.image_url && <img src={p.image_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{p.name}</div>
                <div className="text-zinc-500 text-xs">{p.price.toFixed(2)}&#8364; &middot; {p.sizes?.join(", ") || "Χωρίς μεγέθη"} {!p.in_stock && <span className="text-red-400">Εξαντλημένο</span>}</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handleEdit(p)} className="p-1.5 text-zinc-500 hover:text-[#F5A623]" data-testid={`edit-product-${p.id}`}><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-zinc-500 hover:text-red-400" data-testid={`delete-product-${p.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminTicketsTab = () => {
  const [tickets, setTickets] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: 0, ticket_type: "match", fixture_id: "", available: true, max_quantity: 200 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tRes, fRes] = await Promise.all([
        axios.get(`${API}/admin/tickets`, { headers: authH() }),
        axios.get(`${API}/fixtures?limit=50`, { headers: authH() }),
      ]);
      setTickets(tRes.data);
      setFixtures(fRes.data.filter(f => f.status === "Scheduled"));
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ name: "", description: "", price: 0, ticket_type: "match", fixture_id: "", available: true, max_quantity: 200 }); setEditing(null); };

  const handleSave = async () => {
    try {
      const payload = { ...form, fixture_id: form.fixture_id || null };
      if (editing) {
        await axios.put(`${API}/admin/tickets/${editing}`, payload, { headers: authH() });
      } else {
        await axios.post(`${API}/admin/tickets`, payload, { headers: authH() });
      }
      resetForm();
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (t) => { setEditing(t.id); setForm({ name: t.name, description: t.description || "", price: t.price, ticket_type: t.ticket_type, fixture_id: t.fixture_id || "", available: t.available, max_quantity: t.max_quantity || 200 }); };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή εισιτηρίου;")) return;
    try { await axios.delete(`${API}/admin/tickets/${id}`, { headers: authH() }); fetchData(); } catch {}
  };

  const typeLabels = { match: "Αγώνα", seasonal: "Διαρκείας" };

  return (
    <div data-testid="admin-tickets-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Διαχείριση Εισιτηρίων</h2>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-6">
        <h3 className="text-sm text-zinc-400 mb-3">{editing ? "Επεξεργασία" : "Νέο Εισιτήριο"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Όνομα" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="ticket-name-input" />
          <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} placeholder="Τιμή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" data-testid="ticket-price-input" />
          <select value={form.ticket_type} onChange={e => setForm({...form, ticket_type: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white">
            <option value="match">Αγώνα</option>
            <option value="seasonal">Διαρκείας</option>
          </select>
          <input type="number" value={form.max_quantity} onChange={e => setForm({...form, max_quantity: parseInt(e.target.value) || 0})} placeholder="Μέγιστη ποσότητα" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white" />
          {form.ticket_type === "match" && (
            <select value={form.fixture_id} onChange={e => setForm({...form, fixture_id: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white md:col-span-2">
              <option value="">Επιλέξτε αγώνα...</option>
              {fixtures.map(f => (
                <option key={f.id} value={f.id}>{f.home_team} vs {f.away_team} — {new Date(f.match_date).toLocaleDateString("el-GR")}</option>
              ))}
            </select>
          )}
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Περιγραφή" className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white md:col-span-2" />
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-1 text-xs text-zinc-300"><input type="checkbox" checked={form.available} onChange={e => setForm({...form, available: e.target.checked})} /> Διαθέσιμο</label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="bg-[#F5A623] text-black text-sm font-semibold px-4 py-2 rounded hover:bg-[#e6951a]" data-testid="ticket-save-btn">{editing ? "Ενημέρωση" : "Δημιουργία"}</button>
          {editing && <button onClick={resetForm} className="text-zinc-400 text-sm px-4 py-2 hover:text-white">Ακύρωση</button>}
        </div>
      </div>

      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto"></div></div> : (
        <div className="space-y-2" data-testid="tickets-list">
          {tickets.map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${t.ticket_type === "seasonal" ? "bg-[#F5A623]/10" : "bg-blue-500/10"}`}>
                <Ticket size={16} className={t.ticket_type === "seasonal" ? "text-[#F5A623]" : "text-blue-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{t.name}</div>
                <div className="text-zinc-500 text-xs">{t.price.toFixed(2)}&#8364; &middot; {typeLabels[t.ticket_type]} &middot; {t.available ? "Διαθέσιμο" : "Μη διαθέσιμο"}</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handleEdit(t)} className="p-1.5 text-zinc-500 hover:text-[#F5A623]"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try { const res = await axios.get(`${API}/admin/orders`, { headers: authH() }); setOrders(res.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try { await axios.put(`${API}/admin/orders/${orderId}/status?status=${status}`, {}, { headers: authH() }); fetchOrders(); } catch {}
  };

  const statuses = [
    { value: "pending", label: "Σε αναμονή", color: "text-yellow-400" },
    { value: "processing", label: "Επεξεργασία", color: "text-blue-400" },
    { value: "shipped", label: "Απεστάλη", color: "text-purple-400" },
    { value: "completed", label: "Ολοκληρώθηκε", color: "text-green-400" },
    { value: "cancelled", label: "Ακυρώθηκε", color: "text-red-400" },
  ];

  return (
    <div data-testid="admin-orders-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Παραγγελίες</h2>
        <button onClick={fetchOrders} className="text-zinc-400 hover:text-[#F5A623] transition-colors"><RefreshCw size={16} /></button>
      </div>

      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto"></div></div> : orders.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Δεν υπάρχουν παραγγελίες</div>
      ) : (
        <div className="space-y-3" data-testid="orders-list">
          {orders.map(o => {
            const st = statuses.find(s => s.value === o.status) || statuses[0];
            return (
              <div key={o.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4" data-testid={`admin-order-${o.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-zinc-500">#{o.id.slice(0, 8)} &middot; {new Date(o.created_at).toLocaleDateString("el-GR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="text-white text-sm font-medium mt-0.5">{o.user_name} <span className="text-zinc-500 font-normal">({o.user_email})</span></div>
                  </div>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    className={`bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-xs ${st.color}`} data-testid={`order-status-${o.id}`}>
                    {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1 mb-3">
                  {o.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-zinc-300">{item.name} {item.size && `(${item.size})`} x{item.quantity}</span>
                      <span className="text-zinc-500">{item.subtotal.toFixed(2)}&#8364;</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                  <div className="text-xs text-zinc-500">
                    {o.shipping?.name && <span>{o.shipping.name}, {o.shipping.city}</span>}
                    {o.shipping?.phone && <span className="ml-2">{o.shipping.phone}</span>}
                  </div>
                  <span className="text-sm font-semibold text-[#F5A623]">{o.total.toFixed(2)}&#8364;</span>
                </div>
                {o.notes && <div className="text-xs text-zinc-500 mt-2 italic">Σημείωση: {o.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
