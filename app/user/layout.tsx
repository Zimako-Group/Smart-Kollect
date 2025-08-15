"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  Menu,
  PieChart,
  Search,
  Settings,
  Users,
  AlertTriangle,
  RotateCcw,
  Handshake,
  Download,
  Zap,
  Layers,
  MessageSquare,
  UserCircle,
  HelpCircle,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlobalAIButton } from "@/components/GlobalAIButton";
import { VoiceMicrophoneButton } from "@/components/VoiceMicrophoneButton";

const sidebarItems = [
  { name: "My Dashboard", icon: Home, path: "/user/dashboard" },
  { name: "All Customers", icon: Users, path: "/user/customers" },
  { name: "Flags", icon: Flag, path: "/user/flags" },
  { name: "Settlement Offers", icon: Handshake, path: "/user/settlement" },
  { name: "Segments", icon: Layers, path: "/user/segments" },
  { name: "Dynamic Rules", icon: Zap, path: "/user/rules" },
  { name: "Admin Template", icon: FileText, path: "/user/admin-template" },
  { name: "Help", icon: HelpCircle, path: "/user/help" },
  { name: "Settings", icon: Settings, path: "/user/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  // Debug logging for authentication state
  console.log('[USER-LAYOUT] Auth state:', { 
    isAuthenticated, 
    isLoading, 
    hasUser: !!user, 
    userRole: user?.role,
    pathname 
  });

  // Setup agent presence when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'agent') {
      // Create presence channel for this agent
      const channel = supabase.channel('agent-presence', {
        config: {
          presence: {
            key: user.id
          }
        }
      });

      // Track this agent's presence
      channel
        .on('presence', { event: 'sync' }, () => {
          console.log('Agent presence synced');
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Agent joined presence:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('Agent left presence:', leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track this agent as online
            await channel.track({
              user_id: user.id,
              role: 'agent',
              full_name: user.name,
              email: user.email,
              online_at: new Date().toISOString()
            });
            console.log('Agent presence tracked successfully');
          }
        });

      setPresenceChannel(channel);

      // Cleanup function
      return () => {
        if (channel) {
          channel.untrack();
          supabase.removeChannel(channel);
        }
      };
    }
  }, [isAuthenticated, user]);

  // Then add this effect
  useEffect(() => {
    setMounted(true);

    // Close mobile sidebar when route changes
    const handleRouteChange = () => {
      setMobileOpen(false);
    };

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    handleRouteChange();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect if not authenticated - with delay to prevent race condition
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Add a small delay to prevent race condition with AuthContext redirect
      const timeoutId = setTimeout(() => {
        console.log('[USER-LAYOUT] Redirecting unauthenticated user to home');
        router.push("/");
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading, router]);

  // Cleanup presence on unmount or logout
  useEffect(() => {
    return () => {
      if (presenceChannel) {
        presenceChannel.untrack();
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [presenceChannel]);

  // Show loading or nothing if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-card border-r shadow-sm transition-all duration-300 hidden md:block ${
          collapsed ? "w-[70px]" : "w-[240px]"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4 border-b shrink-0">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <CreditCard className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg gradient-text">SmartKollect</span>
              </div>
            )}
            {collapsed && <CreditCard className="h-6 w-6 text-primary mx-auto" />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={`ml-auto ${collapsed ? "rotate-180" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {sidebarItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm group transition-colors ${
                    pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item.name === "My Dashboard" ? (
                    <motion.div
                      whileHover={{
                        scale: 1.15,
                        rotate: 15,
                        y: -2,
                      }}
                      whileTap={{
                        scale: 0.95,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                        duration: 0.3,
                      }}
                      className="relative"
                    >
                      <motion.div
                        whileHover={{
                          filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))",
                        }}
                        transition={{
                          duration: 0.2,
                        }}
                      >
                        <item.icon
                          className={`h-5 w-5 ${
                            pathname === item.path
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-blue-400"
                          }`}
                        />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <item.icon
                      className={`h-5 w-5 transition-colors ${
                        pathname === item.path
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                  )}
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                  {!collapsed && pathname === item.path && (
                    <div className="ml-auto w-1.5 h-5 bg-primary rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t mt-auto shrink-0">
            {!collapsed ? (
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.png" alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">v1.4.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">v1.4.0</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.png" alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[240px] bg-card border-r shadow-sm transition-all duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg gradient-text">SmartKollect</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="ml-auto"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-3 px-3">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center px-3 py-3 rounded-md text-sm group transition-colors ${
                  pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.name === "My Dashboard" ? (
                  <motion.div
                    whileHover={{
                      scale: 1.15,
                      rotate: 15,
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.95,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17,
                      duration: 0.3,
                    }}
                    className="relative"
                  >
                    <motion.div
                      whileHover={{
                        filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))",
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          pathname === item.path
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-blue-400"
                        }`}
                      />
                    </motion.div>
                  </motion.div>
                ) : (
                  <item.icon
                    className={`h-5 w-5 transition-colors ${
                      pathname === item.path
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                )}
                <span className="ml-3 font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">v1.3.0</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "md:pl-[70px]" : "md:pl-[240px]"
        }`}
      >
        {/* Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-card/80 backdrop-blur-sm border-b flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 flex items-center mx-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-9 bg-background"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {/* Remove the notification badge since we don't have any notifications */}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto py-6">
                  {/* No notifications message */}
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">No Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      You don&apos;t have any notifications at the moment.
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer justify-center text-primary">
                  Refresh notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Voice Conversation Button */}
            <VoiceMicrophoneButton />
            
            {/* Zimako AI Button - Fixed position */}
            <GlobalAIButton fixed={true} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 flex items-center"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatar.png" alt="User" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-flex">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                <Link href="/user/settings" className="w-full">
                  <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                </Link>
                <Link href="/user/changelog" className="w-full">
                  <DropdownMenuItem className="cursor-pointer">Changelog</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
