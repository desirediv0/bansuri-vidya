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
import { useRouter } from "next/navigation";

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
  const authCheckInProgress = useRef(false);
  const lastCheckTime = useRef(0);
  const router = useRouter();

  const checkAuth = async (forceCheck = false): Promise<boolean> => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      return isAuthenticated;
    }

    // If we've checked recently (within 5 seconds) and not forcing a check, return current state
    const now = Date.now();
    if (!forceCheck && now - lastCheckTime.current < 5000) {
      return isAuthenticated;
    }

    authCheckInProgress.current = true;
    setIsLoading(true);

    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      const response = await checkAuthService();
      if (response && response.success) {
        setIsAuthenticated(true);
        setUser(response?.user || null);
        lastCheckTime.current = now;
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        Cookies.remove("accessToken");
        return false;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
      setUser(null);
      Cookies.remove("accessToken");
      return false;
    } finally {
      setIsLoading(false);
      authCheckInProgress.current = false;
    }
  };

  // Initial auth check
  useEffect(() => {
    checkAuth(true);
  }, []);

  const logout = () => {
    Cookies.remove("accessToken");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/auth");
  };

  // Setup axios interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        config.withCredentials = true;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

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
