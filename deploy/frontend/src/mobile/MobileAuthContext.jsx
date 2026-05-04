import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MobileAuthContext = createContext(null);

export const useMobileAuth = () => useContext(MobileAuthContext);

export const MobileAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("mobile_token"));
  const [loading, setLoading] = useState(true);

  const getHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  useEffect(() => {
    if (token) {
      axios
        .get(`${API}/mobile/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem("mobile_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("mobile_token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("mobile_token");
    setToken(null);
    setUser(null);
  };

  return (
    <MobileAuthContext.Provider value={{ user, token, loading, login, logout, getHeaders }}>
      {children}
    </MobileAuthContext.Provider>
  );
};
