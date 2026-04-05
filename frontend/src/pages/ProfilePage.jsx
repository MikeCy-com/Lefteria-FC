import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/CustomerAuth";
import axios from "axios";
import { User, Package, Lock, LogOut, ChevronRight, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProfilePage = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const headers = getAuthHeaders();
    Promise.all([
      axios.get(`${API}/customer/me`, { headers }),
      axios.get(`${API}/orders`, { headers }),
    ]).then(([meRes, ordersRes]) => {
      setProfile(meRes.data);
      setForm(meRes.data);
      setOrders(ordersRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, navigate, getAuthHeaders]);

  const handleSave = async () => {
    setError(""); setMsg("");
    try {
      const res = await axios.put(`${API}/customer/profile`, {
        name: form.name, phone: form.phone, address: form.address, city: form.city, postal_code: form.postal_code
      }, { headers: getAuthHeaders() });
      setProfile(res.data);
      setEditing(false);
      setMsg("Αποθηκεύτηκε!");
    } catch (e) {
      setError(e.response?.data?.detail || "Σφάλμα");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await axios.post(`${API}/customer/change-password`, pwForm, { headers: getAuthHeaders() });
      setMsg("Ο κωδικός άλλαξε επιτυχώς!");
      setPwForm({ current_password: "", new_password: "" });
    } catch (e) {
      setError(e.response?.data?.detail || "Σφάλμα");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const statusLabels = { pending: "Σε αναμονή", processing: "Επεξεργασία", shipped: "Απεστάλη", completed: "Ολοκληρώθηκε", cancelled: "Ακυρώθηκε" };
  const statusColors = { pending: "text-yellow-400", processing: "text-blue-400", shipped: "text-purple-400", completed: "text-green-400", cancelled: "text-red-400" };

  if (!user) return null;
  if (loading) return <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>;

  const tabs = [
    { id: "profile", label: "Προφίλ", icon: User },
    { id: "orders", label: "Παραγγελίες", icon: Package },
    { id: "password", label: "Κωδικός", icon: Lock },
  ];

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="profile-page">
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors"><ArrowLeft size={14} /> Αρχική</Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-['Bebas_Neue'] text-3xl text-white" data-testid="profile-title">Ο Λογαριασμός μου</h1>
              <p className="text-zinc-500 text-sm">{profile?.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-zinc-400 hover:text-red-400 text-sm transition-colors" data-testid="logout-btn"><LogOut size={14} /> Αποσύνδεση</button>
          </div>

          {msg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{msg}</div>}
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

          <div className="flex gap-2 mb-8 border-b border-[#222] pb-3">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setMsg(""); setError(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${tab === t.id ? "bg-[#F5A623]/10 text-[#F5A623]" : "text-zinc-400 hover:text-white"}`} data-testid={`tab-${t.id}`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {tab === "profile" && profile && (
            <div className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="profile-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Ονοματεπώνυμο" },
                  { key: "phone", label: "Τηλέφωνο" },
                  { key: "address", label: "Διεύθυνση" },
                  { key: "city", label: "Πόλη" },
                  { key: "postal_code", label: "Τ.Κ." },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-zinc-400 mb-1 block">{f.label}</label>
                    <input value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} disabled={!editing}
                      className={`w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#F5A623] focus:outline-none ${!editing && "opacity-60"}`} data-testid={`profile-${f.key}`} />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                {editing ? (
                  <>
                    <button onClick={handleSave} className="bg-[#F5A623] text-black font-semibold text-sm px-6 py-2 rounded-lg hover:bg-[#e6951a] transition-colors" data-testid="profile-save">Αποθήκευση</button>
                    <button onClick={() => { setEditing(false); setForm(profile); }} className="text-zinc-400 text-sm hover:text-white transition-colors">Ακύρωση</button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="border border-[#F5A623] text-[#F5A623] text-sm px-6 py-2 rounded-lg hover:bg-[#F5A623]/10 transition-colors" data-testid="profile-edit">Επεξεργασία</button>
                )}
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div data-testid="orders-tab">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={40} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-400 text-sm">Δεν υπάρχουν παραγγελίες ακόμα</p>
                  <Link to="/shop" className="inline-flex items-center gap-2 text-[#F5A623] text-sm mt-3 hover:underline">Αγορά τώρα <ChevronRight size={14} /></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(o => (
                    <div key={o.id} className="bg-[#111] border border-[#222] rounded-lg p-4" data-testid={`order-${o.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-zinc-500">#{o.id.slice(0, 8)} &middot; {new Date(o.created_at).toLocaleDateString("el-GR")}</div>
                        <span className={`text-xs font-semibold ${statusColors[o.status] || "text-zinc-400"}`}>{statusLabels[o.status] || o.status}</span>
                      </div>
                      <div className="space-y-1">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-white">{item.name} {item.size && `(${item.size})`} x{item.quantity}</span>
                            <span className="text-zinc-400">{item.subtotal.toFixed(2)}&#8364;</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-3 pt-2 border-t border-[#222]">
                        <span className="text-xs text-zinc-400">{o.payment_method}</span>
                        <span className="text-sm font-semibold text-[#F5A623]">{o.total.toFixed(2)}&#8364;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "password" && (
            <form onSubmit={handleChangePassword} className="bg-[#111] border border-[#222] rounded-lg p-6 max-w-sm" data-testid="password-form">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Τρέχων κωδικός</label>
                  <input type="password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#F5A623] focus:outline-none" data-testid="current-password" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Νέος κωδικός</label>
                  <input type="password" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required minLength={6}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#F5A623] focus:outline-none" data-testid="new-password" />
                </div>
                <button type="submit" className="bg-[#F5A623] text-black font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors" data-testid="change-password-btn">Αλλαγή Κωδικού</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
