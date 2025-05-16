import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import NavBar from "./NavBar";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();

  // Determine if we should show the sidebar (only on authenticated routes)
  const isAuthRoute = !["/", "/login", "/register"].includes(location);

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <NavBar />}
      
      <div className="flex">
        {isAuthenticated && isAuthRoute && !isMobile && (
          <Sidebar className="w-64 min-w-64 h-[calc(100vh-4rem)]" />
        )}
        
        <main className={`flex-grow ${isAuthRoute ? 'pt-16' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
