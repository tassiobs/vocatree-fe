import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import { apiClient } from '../services/api';
import { AuthMeResponse } from '../types/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle auth failure (when refresh fails)
  const handleAuthFailure = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Check authentication status on mount and when needed
  // This enables "close tab → come back days later → still logged in" (if refresh token is valid within 7 days)
  const checkAuth = useCallback(async () => {
    try {
      // Try to get current user info
      // If access token is still valid (within ~30 minutes), this succeeds
      const userData = await apiClient.getMe();
      
      // User is authenticated
      setUser({
        id: userData.id,
        email: userData.email,
        created_at: new Date().toISOString(),
      });
      setIsAuthenticated(true);
      return true;
    } catch (error: any) {
      // If 401, access token expired - try to refresh using refresh token
      // This handles: user closed tab hours/days ago, refresh token still valid (within 7 days)
      if (error.response?.status === 401) {
        try {
          // Attempt to refresh the access token using refresh token cookie
          // Refresh endpoint rotates refresh token, extending the 7-day window
          await apiClient.refresh();
          
          // Refresh succeeded - get user info with new access token
          const userData = await apiClient.getMe();
          setUser({
            id: userData.id,
            email: userData.email,
            created_at: new Date().toISOString(),
          });
          setIsAuthenticated(true);
          return true;
        } catch (refreshError: any) {
          // Refresh failed - refresh token expired (>7 days) or doesn't exist
          // User needs to log in again
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
      }
      
      // Other errors (network, etc.)
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Check auth status on mount (including when user returns after days)
  // This handles the "close tab → come back later → still logged in" scenario
  // Flow: Try /auth/me → if 401 (expired), try /auth/refresh → if refresh succeeds (refresh token valid within 7 days), user stays logged in
  useEffect(() => {
    checkAuth().finally(() => {
      setIsLoading(false);
    });
  }, [checkAuth]);

  // Set auth failure callback on API client
  useEffect(() => {
    apiClient.setOnAuthFailure(handleAuthFailure);
  }, [handleAuthFailure]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Sign in - cookies are set by backend automatically
      console.log('🔑 Step 1: Calling /auth/signin...');
      await apiClient.signIn({ email, password });
      console.log('✅ Step 1 complete: Signin successful, cookies should be set');
      
      // Verify auth by calling /auth/me (backend requirement)
      // Wait for cookies to be processed by browser
      // Cross-origin cookies may need more time to be set
      console.log('⏳ Step 2: Waiting for cookies to be processed...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Debug: Try to call debug endpoint to verify cookies are being sent
      try {
        console.log('🔍 Step 2.5: Testing if cookies are being sent...');
        const cookieDebug = await apiClient.debugCookies();
        console.log('✅ Cookie debug result (backend received cookies):', cookieDebug);
      } catch (debugError: any) {
        console.error('❌ Cookie debug failed:', {
          status: debugError.response?.status,
          data: debugError.response?.data,
        });
        console.error('⚠️ This suggests cookies are NOT being sent with requests!');
        console.error('⚠️ DIAGNOSIS: Check Network tab → /auth/me request → Request Headers');
        console.error('⚠️ If there is NO "Cookie:" header, cookies are not being sent');
        console.error('⚠️ SOLUTION: Backend MUST set cookies with SameSite=None; Secure (not SameSite=lax)');
      }
      
      // Get user info after successful login
      console.log('🔑 Step 3: Calling /auth/me to verify authentication...');
      const userData = await apiClient.getMe();
      console.log('✅ Step 3 complete: Got user info:', userData);
      
      setUser({
        id: userData.id,
        email: userData.email,
        created_at: new Date().toISOString(),
      });
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('❌ Login failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        step: 'Check Network tab → /auth/me request → Request Headers → Cookie: header',
      });
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Call logout endpoint to clear cookies on backend
      await apiClient.logout();
    } catch (error) {
      console.warn('Logout endpoint error:', error);
    } finally {
      // Clear local state regardless
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    token: user !== null ? 'cookie' : null, // Keep token for compatibility, using cookie authentication
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
