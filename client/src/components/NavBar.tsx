import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  UserCircle,
  Menu, 
  X,
  LogOut,
  MessageSquare,
  Home,
  Activity,
  Heart,
  Calculator,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";

export default function NavBar() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5 mr-2" /> },
    { 
      href: "/chat", 
      label: "Messages", 
      icon: <MessageSquare className="h-5 w-5 mr-2" />,
      badge: totalUnread > 0 ? totalUnread : null 
    },
  ];

  // External AHA PREVENT Calculator link in dropdown menu
  const handleOpenAHACalculator = () => {
    window.open('https://professional.heart.org/en/guidelines-and-statements/prevent-calculator', '_blank');
  };

  return (
    <nav className="bg-primary text-primary-foreground fixed w-full h-16 top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard">
            <a className="flex items-center">
              <Heart className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">HealthLink</span>
            </a>
          </Link>
        </div>

        {/* Mobile menu button */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost">
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar className="w-full h-full" onItemClick={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop links */}
        {!isMobile && (
          <div className="hidden md:flex space-x-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className={`px-3 py-2 rounded-md flex items-center relative ${
                  location === link.href 
                    ? "bg-primary-foreground text-primary font-medium" 
                    : "hover:bg-primary-foreground/10"
                }`}>
                  {link.icon}
                  {link.label}

                  {link.badge && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </a>
              </Link>
            ))}
          </div>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.fullName} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-10 w-10" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.fullName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <a className="w-full cursor-pointer">Profile</a>
              </Link>
            </DropdownMenuItem>

            {user?.role === 'doctor' && (
              <DropdownMenuItem onClick={handleOpenAHACalculator} className="cursor-pointer">
                <Calculator className="h-4 w-4 mr-2 text-blue-600" />
                <span className="flex-1">AHA PREVENT Calculator</span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}