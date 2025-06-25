"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  BarChart2, 
  Settings, 
  Bell, 
  User, 
  LogOut,
  Home,
  FileText,
  Calendar,
  CreditCard,
  BanknoteIcon,
  Megaphone,
  HelpCircle,
  Database,
  Link as LinkIcon,
  CheckSquare,
  Table,
  TrendingUp,
  UserCircle
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Protect admin routes
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Only redirect if we've confirmed the user isn't an admin
    if (user === null) {
      // User is definitely not logged in
      router.push("/login");
    } else if (user && user.role !== "admin") {
      // User is logged in but not an admin
      router.push("/");
    } else if (user && user.role === "admin") {
      // User is an admin, mark auth as checked
      setAuthChecked(true);
    }
  }, [user, router]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    router.push("/"); // Redirect to main landing page
  };

  const { isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render anything if user is not an admin
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-dashboard flex h-screen">
      <style jsx global>{`
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      
      {/* Sidebar */}
      <div 
        className={`sidebar transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } flex flex-col h-screen`}
      >
        <div className="p-5 flex items-center justify-between border-b border-white/5 shrink-0">
          {!collapsed && (
            <div className="flex items-center">
              <span className="text-xl font-bold gradient-text">SmartKollect</span>
              <span className="text-xs ml-2 text-white/60"></span>
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
          <div className={`${!collapsed ? "mb-3 px-3" : "mb-3 flex justify-center"}`}>
            {!collapsed ? (
              <p className="text-s font-medium text-white/40 uppercase tracking-wider">Admin</p>
            ) : null}
          </div>
          <ul className="space-y-0.5">
            <li>
              <Link 
                href="/admin/dashboard" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <BarChart2 size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/accounts" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <Database size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Accounts</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/reports" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <FileText size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Reports</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/payments" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <CreditCard size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Payments</span>}
              </Link>
            </li>

            <li>
              <Link 
                href="/admin/campaigns" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <Megaphone size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Campaigns</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/teams" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <Users size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Team Management</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/test-allocation" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <CheckSquare size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Acc Allocation</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/monthly-performance" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <TrendingUp size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Monthly Performance</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/db-inspector" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <Table size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">DB Inspector</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/customers" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <UserCircle size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Customers</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/help" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <HelpCircle size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Help Center</span>}
              </Link>
            </li>
          </ul>

          <div className={`${!collapsed ? "mt-10 mb-6 px-3" : "mt-10 mb-6 flex justify-center"}`}>
            {!collapsed ? (
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">System</p>
            ) : null}
          </div>
          <ul className="space-y-1">
            <li>
              <Link 
                href="/admin/settings" 
                className="nav-link flex items-center px-3 py-2 rounded-lg"
              >
                <Settings size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Settings</span>}
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                className="nav-link w-full flex items-center px-3 py-2 rounded-lg text-left"
              >
                <LogOut size={collapsed ? 20 : 18} />
                {!collapsed && <span className="ml-3">Sign Out</span>}
              </button>
            </li>
          </ul>
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-white/5 shrink-0">
            <div className="card p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-white/60">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-md border-b border-white/5 shadow-sm z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-medium text-white">Mahikeng Local Municipality</h1>
            
            <div className="flex items-center space-x-5">
              {/* Notifications */}
              <Link href="/admin/notifications" className="p-2 rounded-full hover:bg-white/5 relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-white">
                    <User size={18} className="text-primary" />
                  </div>
                  <span className="text-sm">{user.name}</span>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-black/80 backdrop-blur-xl rounded-lg shadow-lg py-2 z-20 border border-white/10">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-white/60">{user.email}</p>
                    </div>
                    <Link href="/admin/profile" className="block px-4 py-2 text-sm hover:bg-white/5">
                      Your Profile
                    </Link>
                    <Link href="/admin/settings" className="block px-4 py-2 text-sm hover:bg-white/5">
                      Settings
                    </Link>
                    <div className="border-t border-white/5 mt-2 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/5"
                      >
                        <div className="flex items-center">
                          <LogOut size={16} className="mr-2" />
                          <span>Sign out</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}