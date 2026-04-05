import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/CustomerAuth";
import axios from "axios";
import { ShoppingCart, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NewShopPage = () => {
  const { user, getAuthHeaders, refreshCart } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    axios.get(`${API}/products`).then(res => setProducts(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product) => {
    if (!user) { setMsg("Πρέπει να συνδεθείτε για να αγοράσετε"); setTimeout(() => setMsg(""), 3000); return; }
    if (product.sizes?.length && !selectedSizes[product.id]) { setMsg("Επιλέξτε μέγεθος"); setTimeout(() => setMsg(""), 3000); return; }
    setAdding(product.id);
    try {
      await axios.post(`${API}/cart/add`, {
        product_id: product.id,
        quantity: 1,
        size: selectedSizes[product.id] || ""
      }, { headers: getAuthHeaders() });
      await refreshCart();
      setMsg("Προστέθηκε στο καλάθι!");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e.response?.data?.detail || "Σφάλμα");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setAdding(null);
    }
  };

  if (loading) return <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="shop-page">
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors"><ArrowLeft size={14} /> Αρχική</Link>

          <div className="mb-10">
            <span className="badge badge-primary mb-3" style={{ display: 'inline-block', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: '#F5A623', color: '#000', borderRadius: '2px', fontWeight: 600 }}>Ρουχισμός</span>
            <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mt-2" data-testid="shop-title">
              Επίσημα <span className="text-[#F5A623]">Προϊόντα</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-2">Αποκτήστε τον επίσημο εξοπλισμό της ΛΕΥΤΕΡΙΑ FC</p>
          </div>

          {msg && (
            <div className={`mb-6 p-3 rounded-lg text-sm ${msg.includes("Σφάλμα") || msg.includes("Πρέπει") || msg.includes("Επιλέξτε") ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-green-500/10 border border-green-500/30 text-green-400"}`} data-testid="shop-msg">
              {msg}
              {msg.includes("Πρέπει") && <Link to="/login" className="ml-2 underline text-[#F5A623]">Σύνδεση</Link>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="products-grid">
            {products.map(p => (
              <div key={p.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg overflow-hidden group hover:border-[#333] transition-colors" data-testid={`product-${p.id}`}>
                <div className="aspect-square bg-[#1a1a1a] overflow-hidden">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                </div>
                <div className="p-4">
                  <h3 className="font-['Bebas_Neue'] text-lg text-white">{p.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1 mb-3">{p.description}</p>
                  <div className="flex items-end justify-between">
                    <span className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">{p.price.toFixed(2)}&#8364;</span>
                  </div>
                  {p.sizes?.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {p.sizes.map(s => (
                        <button key={s} onClick={() => setSelectedSizes({ ...selectedSizes, [p.id]: s })}
                          className={`px-2.5 py-1 text-xs rounded border transition-colors ${selectedSizes[p.id] === s ? "bg-[#F5A623] text-black border-[#F5A623]" : "border-[#333] text-zinc-400 hover:border-[#F5A623]"}`}
                          data-testid={`size-${p.id}-${s}`}>{s}</button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => handleAddToCart(p)} disabled={adding === p.id}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-[#F5A623] text-black font-semibold text-sm py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors disabled:opacity-50"
                    data-testid={`add-to-cart-${p.id}`}>
                    <ShoppingCart size={14} />
                    {adding === p.id ? "Προσθήκη..." : "Προσθήκη στο Καλάθι"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-[#111] border border-[#222] rounded-lg p-6 text-center">
            <p className="text-zinc-400 text-sm">Η πληρωμή γίνεται κατά την παραλαβή. Για ερωτήσεις επικοινωνήστε μαζί μας.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewShopPage;
