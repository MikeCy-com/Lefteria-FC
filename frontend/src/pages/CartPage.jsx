import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/CustomerAuth";
import axios from "axios";
import { ArrowLeft, Trash2, Minus, Plus, ShoppingCart } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartPage = () => {
  const { user, getAuthHeaders, refreshCart } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API}/cart`, { headers: getAuthHeaders() });
      setCart(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchCart();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateQty = async (productId, size, newQty) => {
    try {
      await axios.put(`${API}/cart/item/${productId}?size=${encodeURIComponent(size)}`, { quantity: newQty }, { headers: getAuthHeaders() });
      await fetchCart();
      await refreshCart();
    } catch {}
  };

  const removeItem = async (productId, size) => {
    try {
      await axios.delete(`${API}/cart/item/${productId}?size=${encodeURIComponent(size)}`, { headers: getAuthHeaders() });
      await fetchCart();
      await refreshCart();
    } catch {}
  };

  if (!user) return null;
  if (loading) return <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="cart-page">
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/shop" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors"><ArrowLeft size={14} /> Συνέχεια Αγορών</Link>

          <h1 className="font-['Bebas_Neue'] text-3xl text-white mb-8" data-testid="cart-title">Καλάθι Αγορών</h1>

          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400 text-sm mb-4">Το καλάθι σας είναι άδειο</p>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-[#F5A623] text-black font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors" data-testid="cart-shop-link">Αγορά Τώρα</Link>
            </div>
          ) : (
            <>
              <div className="space-y-3" data-testid="cart-items">
                {cart.items.map((item, i) => (
                  <div key={`${item.product_id}-${item.size}-${i}`} className="flex items-center gap-4 bg-[#111] border border-[#1a1a1a] rounded-lg p-4" data-testid={`cart-item-${i}`}>
                    <div className="w-16 h-16 rounded-lg bg-[#1a1a1a] overflow-hidden flex-shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{item.name}</div>
                      {item.size && <div className="text-zinc-500 text-xs mt-0.5">Μέγεθος: {item.size}</div>}
                      <div className="text-[#F5A623] text-sm mt-1">{item.price.toFixed(2)}&#8364;</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product_id, item.size, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center border border-[#333] rounded text-zinc-400 hover:text-white hover:border-[#F5A623] transition-colors" data-testid={`qty-minus-${i}`}><Minus size={12} /></button>
                      <span className="text-white text-sm w-6 text-center" data-testid={`qty-${i}`}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, item.size, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center border border-[#333] rounded text-zinc-400 hover:text-white hover:border-[#F5A623] transition-colors" data-testid={`qty-plus-${i}`}><Plus size={12} /></button>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-semibold">{item.subtotal.toFixed(2)}&#8364;</div>
                      <button onClick={() => removeItem(item.product_id, item.size)} className="text-zinc-500 hover:text-red-400 transition-colors mt-1" data-testid={`remove-${i}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-[#111] border border-[#222] rounded-lg p-5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Σύνολο</span>
                  <span className="font-['Bebas_Neue'] text-2xl text-[#F5A623]" data-testid="cart-total">{cart.total.toFixed(2)}&#8364;</span>
                </div>
                <Link to="/checkout" className="block w-full text-center mt-4 bg-[#F5A623] text-black font-semibold text-sm py-3 rounded-lg hover:bg-[#e6951a] transition-colors" data-testid="checkout-btn">
                  Ολοκλήρωση Παραγγελίας
                </Link>
                <p className="text-zinc-500 text-xs text-center mt-2">Πληρωμή κατά την παραλαβή</p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default CartPage;
