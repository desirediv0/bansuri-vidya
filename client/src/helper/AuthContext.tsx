"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { checkAuthService } from "@/helper/checkAuthService";
import axios from "axios";
import Cookies from "js-cookie";

interface AuthContextType {
  isAuthenticated: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => void;
  user: {
    id: string;
    name: string;
    role?: string;
  } | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  const checkAuth = async (): Promise<boolean> => {
    // If we've already checked auth, don't check again
    if (hasCheckedAuth.current) {
      return isAuthenticated;
    }

    try {
      const response = await checkAuthService();
      if (response && response.success) {
        setIsAuthenticated(true);
        setUser(response?.user || null);
        hasCheckedAuth.current = true;
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        hasCheckedAuth.current = true;
        return false;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
      setUser(null);
      hasCheckedAuth.current = true;
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      checkAuth();
    }
  }, []); // Only run once on mount

  const logout = () => {
    Cookies.remove("accessToken");
    setIsAuthenticated(false);
    setUser(null);
    hasCheckedAuth.current = false; // Reset the check flag on logout
  };

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      config.withCredentials = true;
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, checkAuth, logout, user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
