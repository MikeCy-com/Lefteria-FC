import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/CustomerAuth";
import axios from "axios";
import { ShoppingCart, ArrowLeft, Ticket, Calendar, MapPin, Crown } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NewShopPage = () => {
  const { user, getAuthHeaders, refreshCart } = useAuth();
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [ticketQtys, setTicketQtys] = useState({});
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("tickets");

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/products`),
      axios.get(`${API}/tickets`),
    ]).then(([prodRes, ticketRes]) => {
      setProducts(prodRes.data);
      setTickets(ticketRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showMsg = (text, duration = 3000) => { setMsg(text); setTimeout(() => setMsg(""), duration); };

  const handleAddToCart = async (product) => {
    if (!user) { showMsg("login"); return; }
    if (product.sizes?.length && !selectedSizes[product.id]) { showMsg("Επιλέξτε μέγεθος"); return; }
    setAdding(product.id);
    try {
      await axios.post(`${API}/cart/add`, { product_id: product.id, quantity: 1, size: selectedSizes[product.id] || "" }, { headers: getAuthHeaders() });
      await refreshCart();
      showMsg("Προστέθηκε στο καλάθι!", 2000);
    } catch (e) { showMsg(e.response?.data?.detail || "Σφάλμα"); }
    finally { setAdding(null); }
  };

  const handleAddTicket = async (ticket) => {
    if (!user) { showMsg("login"); return; }
    const qty = ticketQtys[ticket.id] || 1;
    setAdding(ticket.id);
    try {
      await axios.post(`${API}/cart/add-ticket`, { ticket_id: ticket.id, quantity: qty }, { headers: getAuthHeaders() });
      await refreshCart();
      showMsg("Το εισιτήριο προστέθηκε στο καλάθι!", 2000);
    } catch (e) { showMsg(e.response?.data?.detail || "Σφάλμα"); }
    finally { setAdding(null); }
  };

  if (loading) return <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>;

  const matchTickets = tickets.filter(t => t.ticket_type === "match");
  const seasonalTickets = tickets.filter(t => t.ticket_type === "seasonal");
  const isLoginMsg = msg === "login";

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="shop-page">
      <section className="py-10 md:py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors"><ArrowLeft size={14} /> Αρχική</Link>

          <div className="mb-8">
            <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white" data-testid="shop-title">
              Επισημο <span className="text-[#F5A623]">Καταστημα</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-2">Εισιτήρια αγώνων & επίσημα προϊόντα ΛΕΥΤΕΡΙΑ FC</p>
          </div>

          {msg && !isLoginMsg && (
            <div className={`mb-6 p-3 rounded-lg text-sm ${msg.includes("Σφάλμα") || msg.includes("Επιλέξτε") ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-green-500/10 border border-green-500/30 text-green-400"}`} data-testid="shop-msg">{msg}</div>
          )}
          {isLoginMsg && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm" data-testid="shop-msg">
              Πρέπει να συνδεθείτε για αγορές. <Link to="/login" className="underline text-[#F5A623]">Σύνδεση</Link>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-[#222] pb-3">
            <button onClick={() => setTab("tickets")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${tab === "tickets" ? "bg-[#F5A623]/10 text-[#F5A623]" : "text-zinc-400 hover:text-white"}`} data-testid="tab-tickets">
              <Ticket size={14} /> Εισιτήρια
            </button>
            <button onClick={() => setTab("merchandise")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${tab === "merchandise" ? "bg-[#F5A623]/10 text-[#F5A623]" : "text-zinc-400 hover:text-white"}`} data-testid="tab-merchandise">
              <ShoppingCart size={14} /> Ρουχισμός
            </button>
          </div>

          {/* TICKETS TAB */}
          {tab === "tickets" && (
            <div data-testid="tickets-section">
              {/* Seasonal Ticket */}
              {seasonalTickets.map(t => (
                <div key={t.id} className="mb-6 bg-gradient-to-r from-[#F5A623]/10 via-[#111] to-[#111] border border-[#F5A623]/20 rounded-lg p-5 md:p-6" data-testid={`ticket-${t.id}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                        <Crown size={20} className="text-[#F5A623]" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[#F5A623] uppercase tracking-widest mb-0.5">Εισιτηριο Διαρκειας</div>
                        <div className="font-['Bebas_Neue'] text-xl text-white">{t.name}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{t.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:ml-auto">
                      <div className="font-['Bebas_Neue'] text-3xl text-[#F5A623]">{t.price.toFixed(2)}&#8364;</div>
                      <div className="flex items-center gap-2">
                        <select value={ticketQtys[t.id] || 1} onChange={(e) => setTicketQtys({...ticketQtys, [t.id]: parseInt(e.target.value)})}
                          className="bg-[#0a0a0a] border border-[#333] rounded px-2 py-1.5 text-sm text-white" data-testid={`ticket-qty-${t.id}`}>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <button onClick={() => handleAddTicket(t)} disabled={adding === t.id}
                          className="bg-[#F5A623] text-black font-semibold text-sm px-5 py-2 rounded-lg hover:bg-[#e6951a] transition-colors disabled:opacity-50 whitespace-nowrap"
                          data-testid={`buy-ticket-${t.id}`}>
                          {adding === t.id ? "..." : "Αγορά"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Match Tickets */}
              {matchTickets.length > 0 ? (
                <div className="space-y-3" data-testid="match-tickets">
                  <h3 className="font-['Bebas_Neue'] text-lg text-zinc-400 tracking-wider">Εισιτηρια Αγωνων</h3>
                  {matchTickets.map(t => (
                    <div key={t.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#333] transition-colors" data-testid={`ticket-${t.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                            <Ticket size={16} className="text-[#F5A623]" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm truncate">{t.name}</div>
                            {t.fixture && (
                              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                                <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(t.fixture.match_date).toLocaleDateString("el-GR")}</span>
                                {t.fixture.venue && <span className="flex items-center gap-1 hidden sm:flex"><MapPin size={10} /> {t.fixture.venue}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="font-['Bebas_Neue'] text-xl text-[#F5A623]">{t.price.toFixed(2)}&#8364;</div>
                          <select value={ticketQtys[t.id] || 1} onChange={(e) => setTicketQtys({...ticketQtys, [t.id]: parseInt(e.target.value)})}
                            className="bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-sm text-white" data-testid={`ticket-qty-${t.id}`}>
                            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          <button onClick={() => handleAddTicket(t)} disabled={adding === t.id}
                            className="bg-[#F5A623] text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-[#e6951a] transition-colors disabled:opacity-50 whitespace-nowrap"
                            data-testid={`buy-ticket-${t.id}`}>
                            {adding === t.id ? "..." : "Αγορά"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                seasonalTickets.length === 0 && (
                  <div className="text-center py-12">
                    <Ticket size={40} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-sm">Δεν υπάρχουν διαθέσιμα εισιτήρια αυτή τη στιγμή</p>
                  </div>
                )
              )}

              <div className="mt-8 bg-[#111] border border-[#222] rounded-lg p-4 text-center">
                <p className="text-zinc-500 text-xs">Τα εισιτήρια μπορούν να αγοραστούν online ή στην είσοδο του γηπέδου. Η πληρωμή γίνεται κατά την παραλαβή.</p>
              </div>
            </div>
          )}

          {/* MERCHANDISE TAB */}
          {tab === "merchandise" && (
            <div data-testid="merchandise-section">
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
                      {p.delivery_options?.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {p.delivery_options.map(d => (
                            <span key={d} className="text-[9px] text-zinc-500 border border-[#333] rounded px-1.5 py-0.5">{d}</span>
                          ))}
                        </div>
                      )}
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

              <div className="mt-8 bg-[#111] border border-[#222] rounded-lg p-4 text-center">
                <p className="text-zinc-500 text-xs">Η πληρωμή γίνεται κατά την παραλαβή. Για ερωτήσεις επικοινωνήστε μαζί μας.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default NewShopPage;
