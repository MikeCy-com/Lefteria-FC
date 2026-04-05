import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/CustomerAuth";
import axios from "axios";
import { ArrowLeft, CheckCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CheckoutPage = () => {
  const { user, getAuthHeaders, refreshCart } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ shipping_name: "", shipping_address: "", shipping_city: "", shipping_postal_code: "", shipping_phone: "", notes: "" });

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const headers = getAuthHeaders();
    Promise.all([
      axios.get(`${API}/cart`, { headers }),
      axios.get(`${API}/customer/me`, { headers }),
    ]).then(([cartRes, meRes]) => {
      setCart(cartRes.data);
      if (cartRes.data.items.length === 0) { navigate("/cart"); return; }
      setForm(f => ({
        ...f,
        shipping_name: meRes.data.name || "",
        shipping_address: meRes.data.address || "",
        shipping_city: meRes.data.city || "",
        shipping_postal_code: meRes.data.postal_code || "",
        shipping_phone: meRes.data.phone || "",
      }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const res = await axios.post(`${API}/orders`, form, { headers: getAuthHeaders() });
      setSuccess(true);
      setOrderId(res.data.order_id);
      await refreshCart();
    } catch (err) {
      setError(err.response?.data?.detail || "Σφάλμα κατά την υποβολή");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>;

  if (success) return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6" data-testid="order-success">
      <div className="text-center max-w-sm">
        <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
        <h1 className="font-['Bebas_Neue'] text-3xl text-white mb-2">Η παραγγελία σας καταχωρήθηκε!</h1>
        <p className="text-zinc-400 text-sm mb-2">Αριθμός: #{orderId.slice(0, 8)}</p>
        <p className="text-zinc-500 text-xs mb-6">Η πληρωμή θα γίνει κατά την παραλαβή. Θα ενημερωθείτε για την κατάσταση.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/profile" className="border border-[#F5A623] text-[#F5A623] text-sm px-6 py-2.5 rounded-lg hover:bg-[#F5A623]/10 transition-colors" data-testid="view-orders-btn">Οι παραγγελίες μου</Link>
          <Link to="/shop" className="bg-[#F5A623] text-black font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors">Συνέχεια</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="checkout-page">
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/cart" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors"><ArrowLeft size={14} /> Καλάθι</Link>
          <h1 className="font-['Bebas_Neue'] text-3xl text-white mb-8" data-testid="checkout-title">Ολοκλήρωση Παραγγελίας</h1>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

          <div className="grid lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4" data-testid="checkout-form">
              <h3 className="font-['Bebas_Neue'] text-lg text-zinc-400">Στοιχεία Αποστολής</h3>
              {[
                { key: "shipping_name", label: "Ονοματεπώνυμο", required: true },
                { key: "shipping_address", label: "Διεύθυνση", required: true },
                { key: "shipping_city", label: "Πόλη", required: true },
                { key: "shipping_postal_code", label: "Τ.Κ.", required: true },
                { key: "shipping_phone", label: "Τηλέφωνο", required: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-zinc-400 mb-1 block">{f.label}</label>
                  <input value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#F5A623] focus:outline-none" data-testid={`checkout-${f.key}`} />
                </div>
              ))}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Σημειώσεις (προαιρετικά)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#F5A623] focus:outline-none resize-none" data-testid="checkout-notes" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-[#F5A623] text-black font-semibold text-sm py-3 rounded-lg hover:bg-[#e6951a] transition-colors disabled:opacity-50" data-testid="place-order-btn">
                {submitting ? "Υποβολή..." : "Υποβολή Παραγγελίας"}
              </button>
              <p className="text-zinc-500 text-xs text-center">Πληρωμή κατά την παραλαβή</p>
            </form>

            <div className="bg-[#111] border border-[#222] rounded-lg p-5 h-fit">
              <h3 className="font-['Bebas_Neue'] text-lg text-zinc-400 mb-4">Σύνοψη</h3>
              <div className="space-y-2">
                {cart.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white truncate">{item.name} {item.size && `(${item.size})`} x{item.quantity}</span>
                    <span className="text-zinc-400 flex-shrink-0 ml-2">{item.subtotal.toFixed(2)}&#8364;</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#222] mt-3 pt-3 flex justify-between">
                <span className="text-zinc-400 text-sm">Σύνολο</span>
                <span className="font-['Bebas_Neue'] text-xl text-[#F5A623]" data-testid="checkout-total">{cart.total.toFixed(2)}&#8364;</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CheckoutPage;
