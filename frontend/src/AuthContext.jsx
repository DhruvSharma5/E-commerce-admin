import { createContext, useContext, useEffect, useState } from 'react';
import { api, refreshAccessToken, setAccessToken } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know if a session exists

  // On page load the in-memory token is gone, so try to restore the session via the refresh cookie
  useEffect(() => {
    (async () => {
      try {
        await refreshAccessToken();
        const { user } = await api('/auth/me');
        setUser(user);
      } catch { /* not logged in */ }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = (form) => api('/auth/register', { method: 'POST', body: form, auth: false });

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* clear locally anyway */ }
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
