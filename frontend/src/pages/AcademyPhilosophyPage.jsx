import { Heart, Target, Users, Shield, Star, Zap } from "lucide-react";

const AcademyPhilosophyPage = () => {
  return (
    <div className="min-h-screen bg-black" data-testid="philosophy-page">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <span className="text-[#F5A623] text-sm font-medium tracking-[0.3em] block mb-4">ΑΚΑΔΗΜΙΑ LEFTERIA FC</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white tracking-wide">
            Η ΦΙΛΟΣΟΦΙΑ <span className="text-[#F5A623]">ΜΑΣ</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mt-6 leading-relaxed">
            Πιστεύουμε ότι κάθε νέος αθλητής αξίζει ένα περιβάλλον που τον αναπτύσσει ολόπλευρα — τεχνικά, τακτικά, σωματικά και ψυχολογικά.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>

      {/* Core Values */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-2">ΟΙ ΑΞΙΕΣ <span className="text-[#F5A623]">ΜΑΣ</span></h2>
          <div className="w-12 h-1 bg-[#F5A623] mb-10" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Heart, title: "ΠΑΘΟΣ", desc: "Καλλιεργούμε την αγάπη για το ποδόσφαιρο. Κάθε προπόνηση είναι μια ευκαιρία να ζήσεις τη χαρά του αθλήματος." },
              { icon: Shield, title: "ΠΕΙΘΑΡΧΙΑ", desc: "Μαθαίνουμε στους νέους αθλητές τη σημασία της δέσμευσης, της συνέπειας και του σεβασμού." },
              { icon: Users, title: "ΟΜΑΔΙΚΟΤΗΤΑ", desc: "Το ποδόσφαιρο είναι ομαδικό άθλημα. Χτίζουμε δεσμούς, εμπιστοσύνη και συνεργασία." },
              { icon: Target, title: "ΑΝΑΠΤΥΞΗ", desc: "Κάθε παίκτης έχει ατομικό πλάνο ανάπτυξης. Εστιάζουμε στη βελτίωση, όχι μόνο στο αποτέλεσμα." },
              { icon: Star, title: "ΑΡΙΣΤΕΙΑ", desc: "Στοχεύουμε στο υψηλότερο επίπεδο σε ό,τι κάνουμε. Από την προπόνηση μέχρι τη συμπεριφορά." },
              { icon: Zap, title: "ΚΑΙΝΟΤΟΜΙΑ", desc: "Χρησιμοποιούμε σύγχρονες μεθόδους προπόνησης και τεχνολογία για την ανάπτυξη των αθλητών." },
            ].map((val, i) => (
              <div key={i} className="bg-[#111] border border-[#262626] rounded-lg p-6" data-testid={`value-${i}`}>
                <val.icon size={24} className="text-[#F5A623] mb-4" />
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-2">{val.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>

      {/* Approach */}
      <section className="py-16 px-6" data-testid="approach-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-2">Η ΠΡΟΣΕΓΓΙΣΗ <span className="text-[#F5A623]">ΜΑΣ</span></h2>
          <div className="w-12 h-1 bg-[#F5A623] mb-10" />
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: "Εξατομικευμένη Ανάπτυξη", desc: "Κάθε παίκτης αξιολογείται ξεχωριστά. Δημιουργούμε ατομικά πλάνα ανάπτυξης με βάση τις ανάγκες και τα δυνατά σημεία του κάθε αθλητή." },
              { title: "Δομημένο Πρόγραμμα", desc: "Ακολουθούμε ένα επιστημονικά τεκμηριωμένο πρόγραμμα προπόνησης που εξελίσσεται ανάλογα με την ηλικία και το επίπεδο κάθε ομάδας." },
              { title: "Ασφαλές Περιβάλλον", desc: "Η ασφάλεια και η ευημερία των αθλητών μας είναι η πρώτη μας προτεραιότητα. Κάθε παιδί πρέπει να νιώθει ασφαλές." },
              { title: "Συνεργασία με Γονείς", desc: "Οι γονείς είναι αναπόσπαστο μέρος του ταξιδιού. Παρέχουμε τακτική ενημέρωση, αξιολογήσεις και ανοιχτή επικοινωνία." },
            ].map((item, i) => (
              <div key={i} className="bg-[#111] border border-[#262626] rounded-lg p-6 flex gap-5">
                <div className="w-10 h-10 rounded bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#F5A623] font-['Bebas_Neue'] text-xl">{i + 1}</span>
                </div>
                <div>
                  <h4 className="font-['Bebas_Neue'] text-lg text-white mb-2">{item.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
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
