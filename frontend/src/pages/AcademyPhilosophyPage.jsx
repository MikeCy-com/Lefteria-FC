import { Heart, Target, Users, Shield, Star, Zap } from "lucide-react";

const AcademyPhilosophyPage = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-32 px-6 text-center" data-testid="philosophy-hero">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <span className="text-[#F5A623] text-sm font-medium tracking-widest">ΑΚΑΔΗΜΙΑ LEFTERIA FC</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white mt-3 mb-6 tracking-wide">Η ΦΙΛΟΣΟΦΙΑ ΜΑΣ</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Στην Ακαδημία Lefteria FC πιστεύουμε ότι κάθε νέος αθλητής αξίζει ένα περιβάλλον που τον αναπτύσσει ολόπλευρα — τεχνικά, τακτικά, σωματικά και ψυχολογικά.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Heart,
              title: "ΠΑΘΟΣ",
              desc: "Καλλιεργούμε την αγάπη για το ποδόσφαιρο. Κάθε προπόνηση είναι μια ευκαιρία να ζήσεις τη χαρά του αθλήματος.",
              color: "#EF4444",
            },
            {
              icon: Shield,
              title: "ΠΕΙΘΑΡΧΙΑ",
              desc: "Μαθαίνουμε στους νέους αθλητές τη σημασία της δέσμευσης, της συνέπειας και του σεβασμού.",
              color: "#F5A623",
            },
            {
              icon: Users,
              title: "ΟΜΑΔΙΚΟΤΗΤΑ",
              desc: "Το ποδόσφαιρο είναι ομαδικό άθλημα. Χτίζουμε δεσμούς, εμπιστοσύνη και συνεργασία μεταξύ των παικτών.",
              color: "#3B82F6",
            },
            {
              icon: Target,
              title: "ΑΝΑΠΤΥΞΗ",
              desc: "Κάθε παίκτης έχει ατομικό πλάνο ανάπτυξης. Εστιάζουμε στη βελτίωση, όχι μόνο στο αποτέλεσμα.",
              color: "#10B981",
            },
            {
              icon: Star,
              title: "ΑΡΙΣΤΕΙΑ",
              desc: "Στοχεύουμε στο υψηλότερο επίπεδο σε ό,τι κάνουμε. Από την προπόνηση μέχρι τη συμπεριφορά εκτός γηπέδου.",
              color: "#8B5CF6",
            },
            {
              icon: Zap,
              title: "ΚΑΙΝΟΤΟΜΙΑ",
              desc: "Χρησιμοποιούμε σύγχρονες μεθόδους προπόνησης και τεχνολογία για την ανάπτυξη των αθλητών μας.",
              color: "#06B6D4",
            },
          ].map((val, i) => (
            <div key={i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-8" data-testid={`value-${i}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${val.color}15` }}>
                <val.icon size={22} style={{ color: val.color }} />
              </div>
              <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-3">{val.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Approach */}
      <section className="border-t border-white/[0.06] py-20 px-6" data-testid="approach-section">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-['Bebas_Neue'] text-4xl text-white text-center mb-12">Η ΠΡΟΣΕΓΓΙΣΗ ΜΑΣ</h2>
          <div className="space-y-6">
            {[
              {
                title: "Εξατομικευμένη Ανάπτυξη",
                desc: "Κάθε παίκτης αξιολογείται ξεχωριστά. Δημιουργούμε ατομικά πλάνα ανάπτυξης με βάση τις ανάγκες και τα δυνατά σημεία του κάθε αθλητή.",
              },
              {
                title: "Δομημένο Πρόγραμμα",
                desc: "Ακολουθούμε ένα επιστημονικά τεκμηριωμένο πρόγραμμα προπόνησης που εξελίσσεται ανάλογα με την ηλικία και το επίπεδο κάθε ομάδας.",
              },
              {
                title: "Ασφαλές Περιβάλλον",
                desc: "Η ασφάλεια και η ευημερία των αθλητών μας είναι η πρώτη μας προτεραιότητα. Κάθε παιδί πρέπει να νιώθει ασφαλές και αποδεκτό.",
              },
              {
                title: "Συνεργασία με Γονείς",
                desc: "Οι γονείς είναι αναπόσπαστο μέρος του ταξιδιού. Παρέχουμε τακτική ενημέρωση, αξιολογήσεις και ανοιχτή επικοινωνία.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/[0.04] rounded-xl p-6 flex gap-5">
                <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#F5A623] font-['Bebas_Neue'] text-lg">{i + 1}</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AcademyPhilosophyPage;
