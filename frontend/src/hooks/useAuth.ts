import { useState, useEffect, useCallback } from 'react';
import { authService, FarmerUser } from '../services/authService';

export function useAuth() {
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [user, setUser] = useState<FarmerUser | null>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());

  const syncAuth = useCallback(() => {
    const isAuth = authService.isAuthenticated();
    setToken(authService.getToken());
    setUser(authService.getCurrentUser());
    setIsAuthenticated(isAuth);
  }, []);

  useEffect(() => {
    syncAuth();
    const handleUnauthorized = () => syncAuth();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [syncAuth]);

  const login = useCallback(async (email: string, pass: string) => {
    const res = await authService.login(email, pass);
    setToken(res.token);
    setUser(res.farmer);
    setIsAuthenticated(true);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout
  };
}
