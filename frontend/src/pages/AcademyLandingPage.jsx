import { Link } from "react-router-dom";
import { GraduationCap, ChevronRight, Users, BookOpen, ClipboardList, Trophy } from "lucide-react";

const AcademyLandingPage = () => {
  return (
    <div className="min-h-screen bg-black" data-testid="academy-landing-page">
      {/* Hero - left aligned matching website style */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Ακαδημια Lefteria FC</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white tracking-wide">
            LEFTERIA FC <span className="text-[#F5A623]">ACADEMY</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mt-6 leading-relaxed">
            Η Ακαδημια της Lefteria FC ειναι αφιερωμενη στην αναπτυξη νεων ποδοσφαιριστων. Χτιζουμε χαρακτηρα, πειθαρχια και αγαπη για το αθλημα μεσα απο ενα δομημενο προγραμμα προπονησης.
          </p>
          <div className="flex gap-4 mt-8">
            <Link to="/academy/registration" className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5A623] text-black font-semibold rounded hover:bg-[#e6951a] transition-colors">
              ΕΓΓΡΑΦΗ <ChevronRight size={16} />
            </Link>
            <Link to="/academy/groups" className="inline-flex items-center gap-2 px-8 py-3 border border-white/20 text-white font-semibold rounded hover:bg-white/5 transition-colors">
              ΤΑ ΤΜΗΜΑΤΑ ΜΑΣ
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>

      {/* Navigation Cards */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-2">ΕΞΕΡΕΥΝΗΣΕ ΤΗΝ <span className="text-[#F5A623]">ΑΚΑΔΗΜΙΑ</span></h2>
          <div className="w-12 h-1 bg-[#F5A623] mb-10" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                path: "/academy/philosophy",
                icon: BookOpen,
                title: "Η ΦΙΛΟΣΟΦΙΑ ΜΑΣ",
                desc: "Μαθε για τις αξιες και την προσεγγιση μας στην αναπτυξη νεων παικτων.",
              },
              {
                path: "/academy/groups",
                icon: Users,
                title: "ΗΛΙΚΙΑΚΑ ΤΜΗΜΑΤΑ",
                desc: "Δες τα τμηματα U6 εως U12 και βρες αυτο που ταιριαζει στο παιδι σου.",
              },
              {
                path: "/academy/registration",
                icon: ClipboardList,
                title: "ΕΓΓΡΑΦΕΣ",
                desc: "Κανε εγγραφη και γινε μερος της οικογενειας Lefteria.",
              },
              {
                path: "/team",
                icon: Trophy,
                title: "Η ΠΡΩΤΗ ΟΜΑΔΑ",
                desc: "Γνωρισε την πρωτη ομαδα και δες που στοχευουν οι παικτες μας.",
              },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group bg-[#111] border border-[#262626] rounded-lg p-6 hover:border-[#F5A623]/30 transition-all"
                data-testid={`academy-link-${item.title}`}
              >
                <item.icon size={24} className="text-[#F5A623] mb-4" />
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-2 group-hover:text-[#F5A623] transition-colors">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                <span className="flex items-center gap-1 mt-4 text-[#F5A623] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Περισσοτερα <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "4", label: "Ηλικιακα Τμηματα" },
            { value: "25+", label: "Αθλητες" },
            { value: "3x", label: "Προπονησεις / Εβδομαδα" },
            { value: "100%", label: "Αφοσιωση" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="font-['Bebas_Neue'] text-5xl text-[#F5A623]">{stat.value}</p>
              <p className="text-zinc-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AcademyLandingPage;
