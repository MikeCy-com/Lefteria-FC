import { Heart, Target, Users, Shield, Star, Zap } from "lucide-react";

const AcademyPhilosophyPage = () => {
  return (
    <div className="min-h-screen bg-black" data-testid="philosophy-page">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Ακαδημια Lefteria FC</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white tracking-wide">
            Η ΦΙΛΟΣΟΦΙΑ <span className="text-[#F5A623]">ΜΑΣ</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mt-6 leading-relaxed">
            Πιστευουμε οτι καθε νεος αθλητης αξιζει ενα περιβαλλον που τον αναπτυσσει ολοπλευρα — τεχνικα, τακτικα, σωματικα και ψυχολογικα.
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
              { icon: Heart, title: "ΠΑΘΟΣ", desc: "Καλλιεργουμε την αγαπη για το ποδοσφαιρο. Καθε προπονηση ειναι μια ευκαιρια να ζησεις τη χαρα του αθληματος." },
              { icon: Shield, title: "ΠΕΙΘΑΡΧΙΑ", desc: "Μαθαινουμε στους νεους αθλητες τη σημασια της δεσμευσης, της συνεπειας και του σεβασμου." },
              { icon: Users, title: "ΟΜΑΔΙΚΟΤΗΤΑ", desc: "Το ποδοσφαιρο ειναι ομαδικο αθλημα. Χτιζουμε δεσμους, εμπιστοσυνη και συνεργασια." },
              { icon: Target, title: "ΑΝΑΠΤΥΞΗ", desc: "Καθε παικτης εχει ατομικο πλανο αναπτυξης. Εστιαζουμε στη βελτιωση, οχι μονο στο αποτελεσμα." },
              { icon: Star, title: "ΑΡΙΣΤΕΙΑ", desc: "Στοχευουμε στο υψηλοτερο επιπεδο σε ο,τι κανουμε. Απο την προπονηση μεχρι τη συμπεριφορα." },
              { icon: Zap, title: "ΚΑΙΝΟΤΟΜΙΑ", desc: "Χρησιμοποιουμε συγχρονες μεθοδους προπονησης και τεχνολογια για την αναπτυξη των αθλητων." },
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
              { title: "Εξατομικευμενη Αναπτυξη", desc: "Καθε παικτης αξιολογειται ξεχωριστα. Δημιουργουμε ατομικα πλανα αναπτυξης με βαση τις αναγκες και τα δυνατα σημεια του καθε αθλητη." },
              { title: "Δομημενο Προγραμμα", desc: "Ακολουθουμε ενα επιστημονικα τεκμηριωμενο προγραμμα προπονησης που εξελισσεται αναλογα με την ηλικια και το επιπεδο καθε ομαδας." },
              { title: "Ασφαλες Περιβαλλον", desc: "Η ασφαλεια και η ευημερια των αθλητων μας ειναι η πρωτη μας προτεραιοτητα. Καθε παιδι πρεπει να νιωθει ασφαλες." },
              { title: "Συνεργασια με Γονεις", desc: "Οι γονεις ειναι αναποσπαστο μερος του ταξιδιου. Παρεχουμε τακτικη ενημερωση, αξιολογησεις και ανοιχτη επικοινωνια." },
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
