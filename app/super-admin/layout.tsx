"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Settings, 
  Database, 
  Shield, 
  Activity,
  BarChart3,
  Globe,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Bell,
  Search,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/super-admin', icon: Activity },
  { name: 'Tenants', href: '/super-admin/tenants', icon: Building2 },
  { name: 'Users', href: '/super-admin/users', icon: Users },
  { name: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
  { name: 'System', href: '/super-admin/system', icon: Database },
  { name: 'Security', href: '/super-admin/security', icon: Shield },
  { name: 'Global Settings', href: '/super-admin/settings', icon: Settings },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={cn("min-h-screen", darkMode ? "dark bg-gray-950" : "bg-gray-50")}>
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Globe className="h-8 w-8 text-purple-200" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
              <span className="text-xl font-bold text-white">Super Admin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-purple-200" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                      : "text-purple-100 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive ? "text-yellow-400" : "text-purple-200"
                  )} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 shadow-2xl">
          <div className="flex h-16 items-center px-6 backdrop-blur-sm bg-black/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe className="h-9 w-9 text-purple-200" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Super Admin</span>
                <p className="text-xs text-purple-200">Global Control Center</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                            (item.href !== '/super-admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                      : "text-purple-100 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive ? "text-yellow-400" : "text-purple-200"
                  )} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-purple-700 p-4">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
              <p className="text-sm font-medium text-white">System Status</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs text-purple-100">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-purple-800/20 bg-white/5 backdrop-blur-xl px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6 text-purple-400" />
          </button>
          
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Search tenants, users, settings..."
                className="w-full rounded-lg bg-purple-900/20 pl-10 pr-4 py-2 text-sm text-purple-100 placeholder-purple-400 border border-purple-700/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg p-2 text-purple-400 hover:bg-purple-900/20 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button className="relative rounded-lg p-2 text-purple-400 hover:bg-purple-900/20 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-purple-500">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                      {user?.name?.charAt(0) || 'SA'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-purple-950 border-purple-800" align="end">
                <DropdownMenuLabel className="text-purple-100">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || 'Super Admin'}</p>
                    <p className="text-xs text-purple-400">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-purple-800" />
                <DropdownMenuItem className="text-purple-100 hover:bg-purple-900 hover:text-white">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-purple-100 hover:bg-purple-900 hover:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-800" />
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
