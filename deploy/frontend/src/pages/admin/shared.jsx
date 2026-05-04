import { useState } from "react";
import { X, Save, RefreshCw } from "lucide-react";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const stripGreekAccents = (text) => {
  if (typeof text !== 'string') return text;
  const map = {'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','Ά':'Α','Έ':'Ε','Ή':'Η','Ί':'Ι','Ό':'Ο','Ύ':'Υ','Ώ':'Ω','ΐ':'ι','ΰ':'υ'};
  return text.replace(/[άέήίόύώΆΈΉΊΌΎΏΐΰ]/g, c => map[c] || c);
};

export const FormModal = ({ title, onClose, onSave, children, saving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" data-testid="form-modal" onClick={onClose}>
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10 rounded-t-lg">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">{stripGreekAccents(title)}</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10" data-testid="modal-close"><X size={18} /></button>
      </div>
      <div className="p-6 space-y-5">{children}</div>
      <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a] sticky bottom-0 bg-[#161616] rounded-b-lg">
        <button onClick={onSave} disabled={saving} className="admin-btn-primary flex-1" data-testid="modal-save">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
        </button>
        <button onClick={onClose} className="admin-btn-ghost flex-1" data-testid="modal-cancel">Ακύρωση</button>
      </div>
    </div>
  </div>
);

export const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export const AdminInput = ({ className = "", ...props }) => (
  <input className={`admin-input ${className}`} {...props} />
);

export const AdminSelect = ({ className = "", ...props }) => (
  <select className={`admin-input ${className}`} {...props} />
);

export const AdminTextarea = ({ className = "", ...props }) => (
  <textarea className={`admin-input ${className}`} {...props} />
);

export const TabHeader = ({ title, count, children }) => (
  <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
    <div>
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">{stripGreekAccents(title)}</h2>
      {count !== undefined && <span className="text-sm text-zinc-400">{count} εγγραφές</span>}
    </div>
    <div className="flex gap-2 items-center">{children}</div>
  </div>
);

export const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
    <Icon size={48} strokeWidth={1} />
    <p className="mt-3 text-base">{text}</p>
  </div>
);
