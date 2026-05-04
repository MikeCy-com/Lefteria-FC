import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Ticket, ShoppingBag, MapPin, Phone, Mail, Clock, ChevronRight, Star, Shield } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ShopPage = () => {
  const [clubInfo, setClubInfo] = useState(null);
  const [nextMatches, setNextMatches] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [clubRes, fixRes] = await Promise.all([
          axios.get(`${API}/club-profile`),
          axios.get(`${API}/fixtures?limit=5`),
        ]);
        setClubInfo(clubRes.data);
        setNextMatches(fixRes.data.filter(f => f.status === "Scheduled").slice(0, 3));
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  const merchandise = [
    { id: 1, name: "Φανέλα Εντός Έδρας 2025/26", price: "€45", category: "Εμφάνιση", badge: "Νέο" },
    { id: 2, name: "Φανέλα Εκτός Έδρας 2025/26", price: "€45", category: "Εμφάνιση", badge: null },
    { id: 3, name: "Σορτσάκι Αγώνα", price: "€25", category: "Εμφάνιση", badge: null },
    { id: 4, name: "Κασκόλ ΛΕΥΤΕΡΙΑ", price: "€15", category: "Αξεσουάρ", badge: "Δημοφιλές" },
    { id: 5, name: "Καπέλο με Λογότυπο", price: "€12", category: "Αξεσουάρ", badge: null },
    { id: 6, name: "Μπρελόκ ΛΕΥΤΕΡΙΑ 2024", price: "€5", category: "Αξεσουάρ", badge: null },
  ];

  return (
    <div className="pt-24 min-h-screen bg-[#050505]" data-testid="shop-page">
      {/* Hero */}
      <section className="py-16 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs text-[#F5A623] tracking-[0.3em] uppercase">Υποστηριξε την Ομαδα</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white mt-2">
            Εισιτηρια & <span className="text-[#F5A623]">Merchandise</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-3 max-w-2xl">
            Απόκτησε εισιτήρια για τους αγώνες μας και στήριξε τη ΛΕΥΤΕΡΙΑ 2024 
            με τα επίσημα προϊόντα του συλλόγου.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-10">
            {/* Tickets Section */}
            <div data-testid="tickets-section">
              <div className="flex items-center gap-3 mb-6">
                <Ticket size={22} className="text-[#F5A623]" />
                <h2 className="font-['Bebas_Neue'] text-2xl text-white">Εισιτηρια</h2>
              </div>

              {nextMatches.length > 0 ? (
                <div className="space-y-3">
                  {nextMatches.map(m => (
                    <div key={m.id} className="card p-5 flex items-center justify-between" data-testid={`ticket-match-${m.id}`}>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">
                          {new Date(m.match_date).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div className="text-white font-medium text-sm">{m.home_team} vs {m.away_team}</div>
                        {m.venue && <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {m.venue}</div>}
                      </div>
                      <span className="text-[10px] bg-[#F5A623]/15 text-[#F5A623] px-3 py-1.5 rounded uppercase tracking-wider">Συντομα</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <Ticket size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm mb-2">Δεν υπάρχουν προγραμματισμένοι εντός έδρας αγώνες αυτή τη στιγμή.</p>
                  <p className="text-zinc-500 text-xs">Τα εισιτήρια θα είναι διαθέσιμα πριν από κάθε εντός έδρας αγώνα.</p>
                </div>
              )}

              <div className="card p-6 mt-4 border-l-[3px] border-[#F5A623]" data-testid="ticket-info">
                <h3 className="font-['Bebas_Neue'] text-lg text-white mb-3">Πληροφοριες Εισιτηριων</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Star size={14} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <div><span className="text-white">Γενική Είσοδος:</span> <span className="text-[#F5A623] font-bold">€5</span></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star size={14} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <div><span className="text-white">Μαθητικό / Φοιτητικό:</span> <span className="text-[#F5A623] font-bold">€3</span></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star size={14} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <div><span className="text-white">Παιδιά κάτω των 12:</span> <span className="text-[#F5A623] font-bold">Δωρεάν</span></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                    <p className="text-zinc-400">Τα εισιτήρια διατίθενται στο γήπεδο την ημέρα του αγώνα, 1 ώρα πριν την έναρξη.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchandise Section */}
            <div data-testid="merchandise-section">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag size={22} className="text-[#F5A623]" />
                <h2 className="font-['Bebas_Neue'] text-2xl text-white">Επισημα Προϊοντα</h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {merchandise.map(item => (
                  <div key={item.id} className="card overflow-hidden group" data-testid={`merch-item-${item.id}`}>
                    <div className="aspect-square bg-gradient-to-br from-[#111] to-[#1a1a1a] flex items-center justify-center relative">
                      <Shield size={48} className="text-zinc-800 group-hover:text-[#F5A623]/20 transition-colors" />
                      {item.badge && (
                        <span className="absolute top-3 left-3 text-[9px] bg-[#F5A623] text-black px-2 py-0.5 font-medium uppercase">{item.badge}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-[#F5A623] uppercase tracking-wider mb-1">{item.category}</p>
                      <h3 className="text-white text-sm font-medium mb-2">{item.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="font-['Bebas_Neue'] text-xl text-[#F5A623]">{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-5 mt-4 text-center" data-testid="merch-contact">
                <p className="text-zinc-400 text-sm mb-2">
                  Για αγορά προϊόντων, επικοινωνήστε μαζί μας ή επισκεφθείτε μας στο γήπεδο.
                </p>
                <Link to="/contact" className="text-[#F5A623] text-sm hover:underline inline-flex items-center gap-1" data-testid="merch-contact-link">
                  Επικοινωνία <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* Contact card */}
            <div className="card p-6 border-l-[3px] border-[#F5A623]" data-testid="shop-contact-card">
              <h3 className="font-['Bebas_Neue'] text-lg text-white mb-4">Επικοινωνια</h3>
              <div className="space-y-3 text-sm">
                {clubInfo?.phone && (
                  <a href={`tel:${clubInfo.phone}`} className="flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] transition-colors">
                    <Phone size={14} className="text-[#F5A623]" /> {clubInfo.phone}
                  </a>
                )}
                {clubInfo?.email && (
                  <a href={`mailto:${clubInfo.email}`} className="flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] transition-colors">
                    <Mail size={14} className="text-[#F5A623]" /> {clubInfo.email}
                  </a>
                )}
                {clubInfo?.address && (
                  <div className="flex items-start gap-2 text-zinc-400">
                    <MapPin size={14} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <span>{clubInfo.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Season Pass */}
            <div className="card overflow-hidden" data-testid="season-pass">
              <div className="bg-gradient-to-r from-[#F5A623]/10 to-transparent p-6">
                <h3 className="font-['Bebas_Neue'] text-xl text-[#F5A623]">Καρτα Διαρκειας</h3>
                <p className="text-zinc-400 text-xs mt-1">Σεζόν 2025/26</p>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="font-['Bebas_Neue'] text-4xl text-[#F5A623]">€40</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Ολοι οι Εντος Εδρας Αγωνες</div>
                </div>
                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2"><Star size={10} className="text-[#F5A623]" /> Είσοδος σε όλους τους αγώνες έδρας</div>
                  <div className="flex items-center gap-2"><Star size={10} className="text-[#F5A623]" /> Προτεραιότητα στη θέση σας</div>
                  <div className="flex items-center gap-2"><Star size={10} className="text-[#F5A623]" /> 10% έκπτωση στα επίσημα προϊόντα</div>
                </div>
                <Link to="/contact" className="block text-center mt-4 bg-[#F5A623] text-black text-xs font-bold py-2.5 px-4 hover:bg-[#e09520] transition-colors" data-testid="season-pass-btn">
                  Ρωτήστε Μας
                </Link>
              </div>
            </div>

            {/* Payment info */}
            <div className="card p-5">
              <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Τροποι Πληρωμης</h4>
              <div className="space-y-2 text-sm text-zinc-400">
                <div>Μετρητά (στο γήπεδο)</div>
                <div>Τραπεζική Κατάθεση</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
