import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  User,
  Heart,
  Users,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  
  // Fetch conversations to get unread message count
  const { data: conversations = [] } = useQuery<any[]>({ 
    queryKey: ['/api/conversations'],
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Calculate total unread messages
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const unreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
      setTotalUnread(unreadCount);
    } else {
      setTotalUnread(0);
    }
  }, [conversations]);
  
  const isDoctor = user?.role === "doctor";
  
  const sidebarItems = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
    },
    {
      href: "/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Messages",
      badge: totalUnread > 0 ? totalUnread : null
    },
    {
      href: "/disease-predictor",
      icon: <Activity className="h-5 w-5" />,
      label: "Heart Disease Predictor",
    },
    {
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      label: "Profile",
    },
  ];
  
  // Add patients list for doctors
  if (isDoctor) {
    sidebarItems.splice(3, 0, {
      href: "/my-patients",
      icon: <Users className="h-5 w-5" />,
      label: "My Patients",
    });
  }

  return (
    <aside className={cn("bg-muted py-4 flex flex-col", className)}>
      <div className="px-4 py-2 mb-6">
        <div className="flex items-center">
          <Heart className="h-8 w-8 text-primary mr-2" />
          <span className="font-bold text-xl">HealthLink</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {user?.role === "doctor" ? "Doctor Portal" : "Patient Portal"}
        </div>
      </div>

      <nav className="space-y-1 px-2 flex-1">
        {sidebarItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md relative",
                location === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-background hover:text-primary",
              )}
              onClick={onItemClick}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="ml-3">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </a>
          </Link>
        ))}
      </nav>

      <div className="mt-auto px-4 py-4">
        <div className="flex items-center">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.fullName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
