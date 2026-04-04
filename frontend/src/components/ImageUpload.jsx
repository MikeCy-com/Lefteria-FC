import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ImageUpload = ({ currentUrl, onImageChange, playerId, label = "Φωτογραφία" }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState("upload"); // "upload" or "url"
  const fileRef = useRef(null);

  const resolveUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/api/uploads") || url.startsWith("/uploads")) return `${BASE_URL}${url}`;
    return url;
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Μόνο αρχεία εικόνας (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Μέγιστο μέγεθος: 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const headers = getAuthHeaders();
      let url;
      
      if (playerId) {
        const res = await fetch(`${API}/admin/players/${playerId}/upload-image`, {
          method: "POST",
          headers,
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Upload failed");
        url = data.image_url;
      } else {
        const res = await fetch(`${API}/admin/upload-image`, {
          method: "POST",
          headers,
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Upload failed");
        url = data.image_url;
      }
      
      onImageChange(url);
    } catch (e) {
      alert(e.message || "Σφάλμα ανεβάσματος");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
      setUrlInput("");
    }
  };

  const displayUrl = resolveUrl(currentUrl);

  return (
    <div data-testid="image-upload">
      <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>
      
      {/* Mode Toggle */}
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={() => setMode("upload")}
          className={`text-[10px] px-2 py-1 rounded ${mode === "upload" ? "bg-[#F5A623]/15 text-[#F5A623]" : "text-zinc-600 hover:text-zinc-400"}`}>
          Ανέβασμα
        </button>
        <button type="button" onClick={() => setMode("url")}
          className={`text-[10px] px-2 py-1 rounded ${mode === "url" ? "bg-[#F5A623]/15 text-[#F5A623]" : "text-zinc-600 hover:text-zinc-400"}`}>
          URL
        </button>
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
            dragOver ? "border-[#F5A623] bg-[#F5A623]/5" : "border-[#222] hover:border-[#444] bg-[#0a0a0a]"
          }`}
          data-testid="upload-dropzone"
        >
          {uploading ? (
            <div className="py-2">
              <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-zinc-500 mt-2">Ανέβασμα...</p>
            </div>
          ) : displayUrl ? (
            <div className="flex items-center gap-3">
              <img src={displayUrl} alt="" className="w-16 h-16 object-cover rounded" />
              <div className="flex-1 text-left">
                <p className="text-xs text-zinc-400">Κάντε κλικ ή σύρετε για αλλαγή</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); onImageChange(""); }} className="text-red-500/60 hover:text-red-400 p-1" data-testid="remove-image">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="py-3">
              <Upload size={20} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500">Σύρετε εικόνα ή κάντε κλικ</p>
              <p className="text-[10px] text-zinc-700 mt-1">JPEG, PNG, WebP (max 5MB)</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} data-testid="file-input" />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#0a0a0a] border border-[#222] text-white px-3 py-2 text-sm rounded-lg outline-none focus:border-[#F5A623]"
            placeholder="https://..."
            value={urlInput || currentUrl || ""}
            onChange={e => { setUrlInput(e.target.value); onImageChange(e.target.value); }}
            data-testid="image-url-input"
          />
          {displayUrl && (
            <img src={displayUrl} alt="" className="w-10 h-10 object-cover rounded" />
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
