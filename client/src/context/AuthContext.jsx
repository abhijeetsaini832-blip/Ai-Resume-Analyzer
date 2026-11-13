import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!localStorage.getItem('token'));

  // Restore session on load
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    authApi.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setBooting(false));
  }, []);

  // Axios interceptor fires this when the token is rejected
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const handleAuth = useCallback((data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (creds) => handleAuth(await authApi.login(creds)), [handleAuth]);
  const register = useCallback(async (body) => handleAuth(await authApi.register(body)), [handleAuth]);
  const logout = useCallback(() => { localStorage.removeItem('token'); setUser(null); }, []);

  const value = useMemo(() => ({ user, booting, login, register, logout }), [user, booting, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
