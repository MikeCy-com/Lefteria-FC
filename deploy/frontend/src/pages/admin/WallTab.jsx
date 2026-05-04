import { useState, useEffect } from "react";
import { MessageSquare, Plus, X, Send, Heart, Pin, Trash2, RefreshCw, Image as ImageIcon, Users, Clock } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

const AdminWallTab = ({ teams = [], academyGroups = [] }) => {
  const [posts, setPosts] = useState([]);
  const [showComments, setShowComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ content: "", team_id: "", academy_group_id: "", image_url: "", pinned: false });

  const allGroups = [
    ...teams.map(t => ({ id: t.id, name: t.name, type: "team" })),
    ...academyGroups.map(g => ({ id: g.id, name: g.name, type: "academy" })),
  ];

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/admin/posts`, { headers: getAuthHeaders() });
      setPosts(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreatePost = async () => {
    if (!form.content.trim()) return alert("Γράψε κάτι!");
    setSaving(true);
    try {
      await axios.post(`${API}/admin/posts`, form, { headers: getAuthHeaders() });
      setShowForm(false);
      setForm({ content: "", team_id: "", academy_group_id: "", image_url: "", pinned: false });
      fetchPosts();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Διαγραφή;")) return;
    try {
      await axios.delete(`${API}/admin/posts/${id}`, { headers: getAuthHeaders() });
      fetchPosts();
    } catch (e) { alert("Σφάλμα"); }
  };

  const handleTogglePin = async (id) => {
    try {
      await axios.put(`${API}/admin/posts/${id}/pin`, {}, { headers: getAuthHeaders() });
      fetchPosts();
    } catch (e) { alert("Σφάλμα"); }
  };

  const loadComments = async (postId) => {
    if (showComments === postId) { setShowComments(null); return; }
    try {
      const res = await axios.get(`${API}/posts/${postId}/comments`);
      setComments(res.data);
      setShowComments(postId);
    } catch (e) { console.error(e); }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} λεπτά`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ώρες`;
    const days = Math.floor(hrs / 24);
    return `${days} ημέρες`;
  };

  const getGroupName = (post) => {
    if (post.team_id) return allGroups.find(g => g.id === post.team_id)?.name;
    if (post.academy_group_id) return allGroups.find(g => g.id === post.academy_group_id)?.name;
    return "Όλος ο Σύλλογος";
  };

  return (
    <div data-testid="admin-wall-tab">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">Ανακοινωσεις</h1>
          <p className="text-zinc-500 text-sm">{posts.length} δημοσιεύσεις</p>
        </div>
        <button onClick={() => setShowForm(true)} className="admin-btn-primary" data-testid="add-post-btn">
          <Plus size={14} /> Νέα Ανακοίνωση
        </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {posts.map(post => (
          <div
            key={post.id}
            className={`bg-[#121212] border rounded-xl overflow-hidden transition-colors ${post.pinned ? 'border-[#F5A623]/30' : 'border-[#262626]'}`}
            data-testid={`post-${post.id}`}
          >
            {/* Post Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
                  <Users size={16} className="text-[#F5A623]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{post.author_name}</span>
                    {post.pinned && <Pin size={12} className="text-[#F5A623]" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <Clock size={10} /> {timeAgo(post.created_at)} πριν
                    <span className="text-zinc-700">|</span>
                    <span>{getGroupName(post)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleTogglePin(post.id)} className={`admin-icon-btn ${post.pinned ? 'text-[#F5A623]' : ''}`} title="Καρφίτσωμα" data-testid={`pin-post-${post.id}`}>
                  <Pin size={14} />
                </button>
                <button onClick={() => handleDeletePost(post.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400" data-testid={`delete-post-${post.id}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden max-h-64">
                  <img src={post.image_url.startsWith("http") ? post.image_url : `${process.env.REACT_APP_BACKEND_URL}${post.image_url}`}
                    alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Post Footer */}
            <div className="flex items-center gap-4 px-4 pb-3 border-t border-[#1e1e1e] pt-3">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Heart size={13} /> {post.likes?.length || 0} likes
              </span>
              <button onClick={() => loadComments(post.id)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors" data-testid={`comments-btn-${post.id}`}>
                <MessageSquare size={13} /> {post.comment_count || 0} σχόλια
              </button>
            </div>

            {/* Comments Section */}
            {showComments === post.id && (
              <div className="border-t border-[#1e1e1e] p-4 bg-[#0a0a0a]" data-testid={`comments-section-${post.id}`}>
                {comments.length > 0 ? (
                  <div className="space-y-3 mb-3">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Users size={10} className="text-zinc-600" />
                        </div>
                        <div>
                          <span className="text-xs text-white font-medium">{c.author_name}</span>
                          <p className="text-xs text-zinc-400 mt-0.5">{c.content}</p>
                          <span className="text-[9px] text-zinc-600">{timeAgo(c.created_at)} πριν</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-xs text-center py-2">Δεν υπάρχουν σχόλια</p>
                )}
              </div>
            )}
          </div>
        ))}

        {posts.length === 0 && (
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-16 text-center">
            <MessageSquare size={48} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">Δεν υπάρχουν ανακοινώσεις</p>
            <p className="text-zinc-600 text-sm mt-1">Δημοσιεύστε την πρώτη ανακοίνωση του συλλόγου</p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" data-testid="create-post-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white">Νεα Ανακοινωση</h2>
              <button onClick={() => setShowForm(false)} className="admin-icon-btn"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Κειμενο *</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none resize-none" rows={4}
                  placeholder="Γράψε εδώ..." data-testid="post-content-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Ομαδα</label>
                <select value={form.team_id || form.academy_group_id || ""} onChange={e => {
                  const sel = allGroups.find(g => g.id === e.target.value);
                  if (sel?.type === "team") setForm({...form, team_id: sel.id, academy_group_id: ""});
                  else if (sel?.type === "academy") setForm({...form, team_id: "", academy_group_id: sel.id});
                  else setForm({...form, team_id: "", academy_group_id: ""});
                }} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                  data-testid="post-group-select">
                  <option value="">Όλος ο Σύλλογος</option>
                  {allGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 uppercase tracking-wider">Εικονα URL (προαιρετικο)</label>
                <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#F5A623] outline-none"
                  placeholder="https://..." data-testid="post-image-input" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => setForm({...form, pinned: e.target.checked})}
                  className="accent-[#F5A623]" data-testid="post-pinned-checkbox" />
                <span className="text-sm text-zinc-400">Καρφίτσωμα στην κορυφή</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleCreatePost} disabled={saving} className="admin-btn-primary" data-testid="publish-post-btn">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Δημοσίευση...</> : <><Send size={14} /> Δημοσίευση</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWallTab;
