import { useState, useEffect, useRef } from "react";
import { Share2, MessageCircle, Facebook, Link as LinkIcon, Check, X } from "lucide-react";

/**
 * Share button for profile pages.
 * - kind:    "player" | "staff"
 * - id:      profile UUID (or slug--uuid — backend handles both)
 * - title:   optional override for the native share dialog title
 *
 * It shares a URL that points at the backend OG endpoint
 * (e.g. https://lefteriafc.cy/api/og/player/{id}) so that messaging apps
 * scrape rich OG cards (photo + name + role). Humans clicking the link
 * get redirected to the normal SPA profile page.
 */
export default function ShareButton({ kind, id, title }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // Use the OG endpoint so messengers scrape the rich card.
  // For player announcements pass kind="player-announce" to surface the
  // dynamically-generated "ΝΕΟ ΜΕΛΟΣ!" banner image.
  let shareUrl;
  if (!id) {
    shareUrl = origin;
  } else if (kind === "player-announce") {
    shareUrl = `${origin}/api/og/player/${id}/announce`;
  } else {
    shareUrl = `${origin}/api/og/${kind}/${id}`;
  }
  const shareTitle = title || "LEFTERIA FC";

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [open]);

  const handleNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return true;
      } catch {
        // user cancelled — fall through to menu
      }
    }
    return false;
  };

  const handleTrigger = async () => {
    const usedNative = await handleNative();
    if (!usedNative) setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback for old browsers
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      document.body.removeChild(ta);
    }
  };

  const enc = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(shareTitle);
  const whatsapp = `https://wa.me/?text=${text}%20${enc}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${enc}`;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={handleTrigger}
        className="btn-secondary text-xs"
        data-testid="share-button"
        aria-label="Κοινοποίηση"
      >
        <Share2 size={14} /> Κοινοποίηση
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-60 bg-[#161616] border border-[#2a2a2a] rounded-lg shadow-2xl z-50 overflow-hidden"
          data-testid="share-menu"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Κοινοποίηση</span>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white" aria-label="Κλείσιμο">
              <X size={14} />
            </button>
          </div>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-[#1f1f1f] hover:text-white transition-colors"
            data-testid="share-whatsapp"
          >
            <MessageCircle size={16} className="text-emerald-400" /> WhatsApp
          </a>
          <a
            href={facebook}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-[#1f1f1f] hover:text-white transition-colors"
            data-testid="share-facebook"
          >
            <Facebook size={16} className="text-[#1877F2]" /> Facebook
          </a>
          <button
            onClick={copy}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-[#1f1f1f] hover:text-white transition-colors"
            data-testid="share-copy"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <LinkIcon size={16} className="text-[#F5A623]" />}
            <span>{copied ? "Αντιγράφηκε!" : "Αντιγραφή Συνδέσμου"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
