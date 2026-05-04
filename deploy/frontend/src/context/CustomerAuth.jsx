import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx);
}

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const fetchMe = useCallback(async (token) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/customer/me`, { headers, withCredentials: true });
      setUser(res.data);
      // fetch cart count
      try {
        const cartRes = await axios.get(`${API}/cart/count`, { headers, withCredentials: true });
        setCartCount(cartRes.data.count);
      } catch { setCartCount(0); }
    } catch {
      setUser(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/customer/login`, { email, password }, { withCredentials: true });
    localStorage.setItem("customer_token", res.data.token);
    setUser({ id: res.data.id, name: res.data.name, email: res.data.email });
    // fetch cart count
    try {
      const cartRes = await axios.get(`${API}/cart/count`, { headers: { Authorization: `Bearer ${res.data.token}` }, withCredentials: true });
      setCartCount(cartRes.data.count);
    } catch { setCartCount(0); }
    return res.data;
  };

  const register = async (name, email, password, phone) => {
    const res = await axios.post(`${API}/customer/register`, { name, email, password, phone }, { withCredentials: true });
    localStorage.setItem("customer_token", res.data.token);
    setUser({ id: res.data.id, name: res.data.name, email: res.data.email });
    return res.data;
  };

  const logout = async () => {
    try { await axios.post(`${API}/customer/logout`, {}, { withCredentials: true }); } catch {}
    localStorage.removeItem("customer_token");
    setUser(null);
    setCartCount(0);
  };

  const refreshCart = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;
    try {
      const res = await axios.get(`${API}/cart/count`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      setCartCount(res.data.count);
    } catch { setCartCount(0); }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("customer_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, cartCount, refreshCart, getAuthHeaders }}>
      {children}
    </AuthCtx.Provider>
  );
}
