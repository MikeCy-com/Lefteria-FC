import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/CustomerAuth";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, phone);
      navigate("/profile");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Σφάλμα εγγραφής");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6" data-testid="register-page">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Αρχική
        </Link>
        <h1 className="font-['Bebas_Neue'] text-3xl text-white mb-1" data-testid="register-title">Εγγραφη</h1>
        <p className="text-zinc-500 text-sm mb-6">Δημιουργήστε τον λογαριασμό σας</p>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm" data-testid="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Ονοματεπώνυμο</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623] focus:outline-none" placeholder="Γιώργος Παπαδόπουλος" data-testid="register-name" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623] focus:outline-none" placeholder="email@example.com" data-testid="register-email" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Τηλέφωνο (προαιρετικό)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623] focus:outline-none" placeholder="+357 99 123456" data-testid="register-phone" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Κωδικός (τουλάχιστον 6 χαρακτήρες)</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623] focus:outline-none pr-10" placeholder="********" data-testid="register-password" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#F5A623] text-black font-semibold text-sm py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors disabled:opacity-50" data-testid="register-submit">
            {loading ? "Εγγραφή..." : "Δημιουργία Λογαριασμού"}
          </button>
        </form>

        <p className="text-zinc-500 text-sm text-center mt-6">
          Έχετε ήδη λογαριασμό; <Link to="/login" className="text-[#F5A623] hover:underline" data-testid="register-login-link">Σύνδεση</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
