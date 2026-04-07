import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMobileAuth } from "../MobileAuthContext";
import { Phone, ArrowRight, Shield, RefreshCw } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

const ROLE_LABELS = {
  parent: "Γονέας / Κηδεμόνας",
  coach: "Προπονητής",
  player: "Παίκτης",
  management: "Διοίκηση",
};

const MobileLoginPage = () => {
  const { login } = useMobileAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("phone"); // phone, otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [roleDetected, setRoleDetected] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      setError("Εισάγετε τον αριθμό τηλεφώνου");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/mobile/auth/request-otp`, { phone: phone.trim() });
      setStep("otp");
      setRoleDetected(res.data.role_detected);
      setResendTimer(60);
      if (res.data.simulated && res.data.otp_debug) {
        setDebugOtp(res.data.otp_debug);
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Σφάλμα αποστολής OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/mobile/auth/verify-otp`, {
        phone: phone.trim(),
        code,
      });
      login(res.data.token, res.data.user);
      navigate("/app", { replace: true });
    } catch (e) {
      setError(e.response?.data?.detail || "Λάθος κωδικός");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const code = newOtp.join("");
    if (code.length === 6) {
      handleVerifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col" data-testid="mobile-login">
      {/* Status bar spacer */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src={CLUB_LOGO} alt="ΛΕΥΤΕΡΙΑ FC" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">ΛΕΥΤΕΡΙΑ FC</h1>
          <p className="text-zinc-500 text-sm mt-1">Academy App</p>
        </div>

        {step === "phone" ? (
          <div className="w-full max-w-sm space-y-5" data-testid="phone-step">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Αριθμός Τηλεφώνου</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                  placeholder="+357 99 123456"
                  className="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl px-10 py-3.5 text-white text-lg placeholder-zinc-600 focus:border-[#F5A623] focus:outline-none transition-colors"
                  autoFocus
                  data-testid="phone-input"
                />
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                Εισάγετε τον αριθμό που είναι καταχωρημένος στην ακαδημία
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm" data-testid="login-error">
                {error}
              </div>
            )}

            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full bg-[#F5A623] text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#e09620] transition-colors disabled:opacity-50"
              data-testid="request-otp-btn"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>Αποστολή Κωδικού <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-5" data-testid="otp-step">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#F5A623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={24} className="text-[#F5A623]" />
              </div>
              <h2 className="text-white text-lg font-medium">Εισάγετε τον κωδικό</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Στάλθηκε στο <span className="text-white">{phone}</span>
              </p>
              {roleDetected && (
                <span className="inline-block mt-2 text-xs bg-[#F5A623]/10 text-[#F5A623] px-3 py-1 rounded-full">
                  {ROLE_LABELS[roleDetected] || roleDetected}
                </span>
              )}
            </div>

            {/* OTP Input */}
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold bg-[#161616] border rounded-xl text-white focus:outline-none transition-colors ${
                    digit ? "border-[#F5A623]" : "border-[#2a2a2a] focus:border-[#F5A623]"
                  }`}
                  autoFocus={i === 0}
                  data-testid={`otp-digit-${i}`}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center" data-testid="otp-error">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex justify-center">
                <RefreshCw size={20} className="animate-spin text-[#F5A623]" />
              </div>
            )}

            {/* Debug OTP display (only in simulated mode) */}
            {debugOtp && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-center" data-testid="debug-otp">
                <p className="text-xs text-blue-400 mb-1">Κωδικός δοκιμής</p>
                <p className="text-2xl font-mono text-blue-300 tracking-[0.3em]">{debugOtp}</p>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <button
                onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); setDebugOtp(""); }}
                className="text-zinc-400 hover:text-white transition-colors"
                data-testid="back-to-phone"
              >
                Αλλαγή αριθμού
              </button>
              {resendTimer > 0 ? (
                <span className="text-zinc-600">Νέος κωδικός σε {resendTimer}s</span>
              ) : (
                <button
                  onClick={handleRequestOtp}
                  className="text-[#F5A623] hover:text-[#e09620] transition-colors"
                  data-testid="resend-otp"
                >
                  Αποστολή ξανά
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom branding */}
      <div className="text-center pb-6 text-xs text-zinc-700">
        ΛΕΥΤΕΡΙΑ FC Academy © {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default MobileLoginPage;
