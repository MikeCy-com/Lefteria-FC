import { Link } from "react-router-dom";
import { GraduationCap, ChevronRight, Users, BookOpen, ClipboardList, Trophy } from "lucide-react";

const CLUB_LOGO = "/api/uploads/club_logo.png";

const AcademyLandingPage = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-32 px-6 text-center" data-testid="academy-hero">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5A623]/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 mb-6">
            <GraduationCap size={16} className="text-[#F5A623]" />
            <span className="text-[#F5A623] text-sm font-medium tracking-wider">ΑΚΑΔΗΜΙΑ</span>
          </div>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mb-4 tracking-wide">LEFTERIA FC ACADEMY</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Η Ακαδημία της Lefteria FC είναι αφιερωμένη στην ανάπτυξη νέων ποδοσφαιριστών. Χτίζουμε χαρακτήρα, πειθαρχία και αγάπη για το άθλημα μέσα από ένα δομημένο πρόγραμμα προπόνησης.
          </p>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              path: "/academy/philosophy",
              icon: BookOpen,
              title: "Η ΦΙΛΟΣΟΦΙΑ ΜΑΣ",
              desc: "Μάθε για τις αξίες και την προσέγγισή μας στην ανάπτυξη νέων παικτών.",
              color: "#F5A623",
            },
            {
              path: "/academy/groups",
              icon: Users,
              title: "ΗΛΙΚΙΑΚΑ ΤΜΗΜΑΤΑ",
              desc: "Δες τα τμήματα U6 έως U12 και βρες αυτό που ταιριάζει στο παιδί σου.",
              color: "#10B981",
            },
            {
              path: "/academy/registration",
              icon: ClipboardList,
              title: "ΕΓΓΡΑΦΕΣ",
              desc: "Κάνε εγγραφή στην Ακαδημία μας και γίνε μέρος της οικογένειας Lefteria.",
              color: "#3B82F6",
            },
            {
              path: "/team",
              icon: Trophy,
              title: "Η ΠΡΩΤΗ ΟΜΑΔΑ",
              desc: "Γνώρισε την πρώτη ομάδα και δες πού στοχεύουν οι παίκτες μας.",
              color: "#8B5CF6",
            },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group bg-[#111] border border-white/[0.06] rounded-2xl p-8 hover:border-white/10 transition-all"
              data-testid={`academy-link-${item.title.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon size={22} style={{ color: item.color }} />
              </div>
              <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-2 group-hover:text-[#F5A623] transition-colors">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              <div className="flex items-center gap-1 mt-4 text-[#F5A623] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Περισσότερα <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "4", label: "Ηλικιακά Τμήματα" },
            { value: "25+", label: "Αθλητές" },
            { value: "3x", label: "Προπονήσεις / Εβδομάδα" },
            { value: "100%", label: "Αφοσίωση" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="font-['Bebas_Neue'] text-4xl text-[#F5A623]">{stat.value}</p>
              <p className="text-zinc-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AcademyLandingPage;
