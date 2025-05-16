import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'doctor' | 'patient';
  specialization?: string;
  profilePicture?: string;
  bio?: string;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onlineUsers: number[];
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  toggleTwoFactorAuth: (enabled: boolean) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/login', { username, password });
      const userData = await response.json();
      setUser(userData);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/register', userData);
      const newUser = await response.json();
      setUser(newUser);
      toast({
        title: "Registration Successful",
        description: `Welcome, ${newUser.fullName}!`,
      });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest('POST', '/api/logout', {});
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/update-password', {
        currentPassword,
        newPassword
      });
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated",
      });
      return true;
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: "Password Update Failed",
        description: error instanceof Error ? error.message : "Could not update password",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleTwoFactorAuth = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/toggle-2fa', { enabled });
      const data = await response.json();
      
      toast({
        title: enabled ? "Two-Factor Authentication Enabled" : "Two-Factor Authentication Disabled",
        description: data.message,
      });
      return true;
    } catch (error) {
      console.error('Two-factor authentication toggle error:', error);
      toast({
        title: "Two-Factor Authentication Update Failed",
        description: error instanceof Error ? error.message : "Could not update two-factor authentication settings",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up WebSocket for online status tracking
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let socket: WebSocket | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    // Function to create and setup a new WebSocket connection
    const connectWebSocket = () => {
      // Clear any existing reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      // Create new WebSocket
      socket = new WebSocket(wsUrl);
      
      socket.addEventListener("open", () => {
        console.log("Online status WebSocket connected");
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Register with user ID
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "register",
            userId: user.id
          }));
        }
      });
      
      socket.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received in AuthContext:", data);
          
          if (data.type === "online_status") {
            setOnlineUsers(data.onlineUsers || []);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });
      
      socket.addEventListener("close", () => {
        console.log("WebSocket connection closed, attempting to reconnect...");
        // Exponential backoff for reconnection (max 30 seconds)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        
        // Schedule reconnection
        reconnectTimeout = setTimeout(() => {
          if (user) { // Only reconnect if still logged in
            connectWebSocket();
          }
        }, delay);
      });
      
      socket.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
        // The close event will fire after this, triggering reconnect
      });
    };
    
    // Initial connection
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        onlineUsers,
        login,
        register,
        logout,
        updatePassword,
        toggleTwoFactorAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
