import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import {
  ArrowLeft, Send, Users, User, MessageCircle, Plus, Search, Shield
} from "lucide-react";
import { stripGreekAccents } from "../../utils/greekText";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

const ChatPage = () => {
  const { user, getHeaders } = useMobileAuth();
  const [view, setView] = useState("list"); // list, conversation, new
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/mobile/conversations`, { headers: getHeaders() });
      setConversations(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (convoId) => {
    try {
      const res = await axios.get(`${API}/mobile/conversations/${convoId}/messages`, { headers: getHeaders() });
      setMessages(res.data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error(e); }
  }, [getHeaders]);

  // Poll for new messages when in conversation view
  useEffect(() => {
    if (view === "conversation" && selectedConvo) {
      fetchMessages(selectedConvo.id);
      pollRef.current = setInterval(() => fetchMessages(selectedConvo.id), 5000);
      return () => clearInterval(pollRef.current);
    }
  }, [view, selectedConvo, fetchMessages]);

  const openConvo = (convo) => {
    setSelectedConvo(convo);
    setView("conversation");
  };

  const openTeamChat = async (groupId) => {
    try {
      const res = await axios.post(`${API}/mobile/team-chat/${groupId}`, {}, { headers: getHeaders() });
      openConvo(res.data);
    } catch (e) { console.error(e); }
  };

  const startPrivateChat = async (otherUserId) => {
    try {
      const res = await axios.post(`${API}/mobile/conversations`, { other_user_id: otherUserId, type: "private" }, { headers: getHeaders() });
      openConvo(res.data);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedConvo) return;
    setSending(true);
    try {
      await axios.post(`${API}/mobile/conversations/${selectedConvo.id}/messages`, { content: newMsg.trim() }, { headers: getHeaders() });
      setNewMsg("");
      fetchMessages(selectedConvo.id);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const loadMembers = async () => {
    try {
      // Get parent dashboard to find groups
      const dashRes = await axios.get(`${API}/mobile/parent/dashboard`, { headers: getHeaders() });
      const groups = dashRes.data?.groups || [];
      let allMembers = [];
      for (const g of groups) {
        const res = await axios.get(`${API}/mobile/team-members/${g.id}`, { headers: getHeaders() });
        (res.data?.members || []).forEach(m => {
          if (m.id !== user.id && !allMembers.find(x => x.id === m.id)) allMembers.push(m);
        });
      }
      setTeamMembers(allMembers);
    } catch (e) { console.error(e); }
  };

  // ==================== NEW CONVERSATION ====================
  if (view === "new") {
    const filtered = teamMembers.filter(m =>
      !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <div className="pb-6" data-testid="new-chat-view">
        <div className="px-4 pt-3 pb-3 border-b border-[#1e1e1e]">
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-3">
            <ArrowLeft size={16} /> Πίσω
          </button>
          <h2 className="text-white font-bold text-lg mb-3">Νέο Μήνυμα</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Αναζήτηση..."
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623]/30 outline-none"
              data-testid="member-search" />
          </div>
        </div>
        <div className="px-4 pt-3 space-y-1.5">
          {filtered.map(m => (
            <button key={m.id} onClick={() => startPrivateChat(m.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#151515] hover:border-[#2a2a2a] text-left transition-all"
              data-testid={`member-${m.id}`}>
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                {imgUrl(m.avatar_url) ? <img src={imgUrl(m.avatar_url)} alt="" className="w-full h-full object-cover" />
                  : <span className="text-zinc-500 font-bold text-sm">{m.name?.charAt(0)}</span>}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{m.name}</p>
                <p className="text-[10px] text-zinc-500 capitalize">{m.role === "parent" ? "Γονέας" : m.role === "coach" ? "Προπονητής" : m.role}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-zinc-600 text-sm text-center py-8">Δεν βρέθηκαν μέλη</p>}
        </div>
      </div>
    );
  }

  // ==================== CONVERSATION ====================
  if (view === "conversation" && selectedConvo) {
    const isTeam = selectedConvo.type === "team";
    const convoTitle = isTeam
      ? stripGreekAccents(selectedConvo.group_name || "Ομαδική Συζήτηση")
      : selectedConvo.other_user?.name || "Συζήτηση";

    return (
      <div className="flex flex-col h-[calc(100vh-120px)]" data-testid="conversation-view">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] flex-shrink-0">
          <button onClick={() => { setView("list"); clearInterval(pollRef.current); fetchConversations(); }}
            className="text-zinc-400" data-testid="chat-back-btn">
            <ArrowLeft size={18} />
          </button>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isTeam ? "bg-emerald-500/15" : "bg-[#1a1a1a]"}`}>
            {isTeam ? <Users size={16} className="text-emerald-400" />
              : imgUrl(selectedConvo.other_user?.avatar_url) ? <img src={imgUrl(selectedConvo.other_user.avatar_url)} alt="" className="w-9 h-9 rounded-full object-cover" />
              : <span className="text-zinc-500 font-bold text-xs">{convoTitle?.charAt(0)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{convoTitle}</p>
            <p className="text-[10px] text-zinc-500">{isTeam ? "Ομαδική συζήτηση" : "Ιδιωτικό μήνυμα"}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <MessageCircle size={32} className="mb-2" />
              <p className="text-sm">Ξεκινήστε τη συζήτηση</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user.id;
            const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id);
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                {!isMe && showAvatar && (
                  <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    {imgUrl(msg.sender_avatar) ? <img src={imgUrl(msg.sender_avatar)} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[10px] font-bold text-zinc-500">{msg.sender_name?.charAt(0)}</span>}
                  </div>
                )}
                {!isMe && !showAvatar && <div className="w-7 flex-shrink-0" />}
                <div className={`max-w-[75%] ${isMe ? "order-first" : ""}`}>
                  {!isMe && showAvatar && isTeam && (
                    <p className="text-[10px] text-zinc-500 mb-0.5 ml-1">{msg.sender_name}</p>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl ${
                    isMe ? "bg-[#F5A623] text-black rounded-br-md" : "bg-[#1a1a1a] text-white rounded-bl-md"
                  }`}>
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  </div>
                  <p className={`text-[9px] text-zinc-600 mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#1e1e1e] flex-shrink-0 bg-[#0a0a0a]">
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Γράψτε μήνυμα..."
            className="flex-1 bg-[#111] border border-[#1e1e1e] rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623]/30 outline-none"
            data-testid="message-input" />
          <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              newMsg.trim() ? "bg-[#F5A623] text-black" : "bg-[#1a1a1a] text-zinc-600"
            }`} data-testid="send-btn">
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ==================== CONVERSATION LIST ====================
  // Get user's groups for team chats
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/mobile/parent/dashboard`, { headers: getHeaders() });
        setGroups(res.data?.groups || []);
      } catch (e) {}
    })();
  }, [getHeaders]);

  return (
    <div className="pb-6" data-testid="chat-list">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Μηνύματα</h2>
        <button onClick={() => { setView("new"); loadMembers(); }}
          className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center"
          data-testid="new-chat-btn">
          <Plus size={16} className="text-black" />
        </button>
      </div>

      {/* Team Chats */}
      {groups.length > 0 && (
        <div className="px-4 mt-2">
          <p className="text-zinc-500 text-[10px] font-bold tracking-wider mb-2">ΟΜΑΔΙΚΕΣ ΣΥΖΗΤΗΣΕΙΣ</p>
          <div className="space-y-1.5">
            {groups.map(g => {
              const teamConvo = conversations.find(c => c.type === "team" && c.group_id === g.id);
              return (
                <button key={g.id} onClick={() => openTeamChat(g.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#151515] hover:border-emerald-500/20 text-left transition-all"
                  data-testid={`team-chat-${g.id}`}>
                  <div className="w-11 h-11 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{stripGreekAccents(g.name)}</p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {teamConvo?.last_message ? teamConvo.last_message.content?.slice(0, 40) : "Ξεκινήστε τη συζήτηση"}
                    </p>
                  </div>
                  {teamConvo?.last_message && (
                    <span className="text-[9px] text-zinc-600 flex-shrink-0">
                      {new Date(teamConvo.last_message.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Private Chats */}
      {conversations.filter(c => c.type === "private").length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-zinc-500 text-[10px] font-bold tracking-wider mb-2">ΙΔΙΩΤΙΚΑ ΜΗΝΥΜΑΤΑ</p>
          <div className="space-y-1.5">
            {conversations.filter(c => c.type === "private").map(c => (
              <button key={c.id} onClick={() => openConvo(c)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#151515] hover:border-[#2a2a2a] text-left transition-all"
                data-testid={`private-chat-${c.id}`}>
                <div className="w-11 h-11 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {imgUrl(c.other_user?.avatar_url)
                    ? <img src={imgUrl(c.other_user.avatar_url)} alt="" className="w-full h-full object-cover" />
                    : <span className="text-zinc-500 font-bold text-sm">{c.other_user?.name?.charAt(0)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{c.other_user?.name || "—"}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{c.last_message?.content?.slice(0, 40) || "—"}</p>
                </div>
                {c.last_message && (
                  <span className="text-[9px] text-zinc-600 flex-shrink-0">
                    {new Date(c.last_message.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#F5A623]/30 border-t-[#F5A623] rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <MessageCircle size={40} className="mb-3" />
          <p className="text-sm">Δεν υπάρχουν μηνύματα</p>
          <p className="text-xs text-zinc-700 mt-1">Πατήστε + για νέο μήνυμα</p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
