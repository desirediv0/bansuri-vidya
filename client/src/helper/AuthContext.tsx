"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType["user"]>(null);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await checkAuthService();
      if (response && response.success) {
        setIsAuthenticated(true);
        setUser(response?.user || null);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const logout = () => {
    Cookies.remove("accessToken");
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

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
    <AuthContext.Provider value={{ isAuthenticated, checkAuth, logout, user }}>
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
