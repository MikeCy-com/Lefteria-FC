import { useState, useEffect } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { Bell, RefreshCw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NewsPage = () => {
  const { getHeaders, user } = useMobileAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = user?.role;
    const endpoint = role === "coach" ? "coach" : role === "player" ? "player" : role === "management" ? "management" : "parent";
    axios.get(`${API}/mobile/${endpoint}/dashboard`, { headers: getHeaders() })
      .then(res => setPosts(res.data.announcements || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getHeaders, user]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-[#F5A623]" />
    </div>
  );

  return (
    <div className="px-4 pb-20" data-testid="news-page">
      <h2 className="text-white font-medium text-sm pt-3 pb-4">Ανακοινωσεις</h2>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <Bell size={36} strokeWidth={1} />
          <p className="mt-3 text-sm">Δεν υπαρχουν ανακοινωσεις</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
              {post.is_pinned && (
                <span className="text-[10px] text-[#F5A623] font-semibold uppercase tracking-wider mb-1 block">Σημαντικο</span>
              )}
              <h3 className="text-white font-medium">{post.title || "Ανακοινωση"}</h3>
              <p className="text-sm text-zinc-400 mt-2 whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                <img
                  src={post.image_url.startsWith("http") ? post.image_url : `${process.env.REACT_APP_BACKEND_URL}${post.image_url}`}
                  alt="" className="mt-3 rounded-xl w-full max-h-60 object-cover"
                />
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-zinc-600">{new Date(post.created_at).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" })}</span>
                {post.author && <span className="text-xs text-zinc-500">{post.author}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
