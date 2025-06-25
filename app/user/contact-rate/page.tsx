"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  PhoneCall,
  Phone,
  UserCheck,
  UserX,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Percent,
  Clock,
  Search,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactRatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("month");

  // Mock data for contact rate metrics with zero values
  const mockContactData = useMemo(() => {
    return {
      totalCalls: 0,
      rightPersonContacts: 0,
      wrongPersonContacts: 0,
      noContacts: 0,
      conversionRate: 0, // percentage
      previousMonthConversionRate: 0, // percentage
      dailyCallTarget: 50,
      averageDailyCalls: 0,
      callsByDay: [
        { day: "Mon", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { day: "Tue", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { day: "Wed", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { day: "Thu", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { day: "Fri", total: 0, rpc: 0, wpc: 0, noContact: 0 }
      ],
      callsByHour: [
        { hour: "9AM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "10AM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "11AM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "12PM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "1PM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "2PM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "3PM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "4PM", total: 0, rpc: 0, wpc: 0, noContact: 0 },
        { hour: "5PM", total: 0, rpc: 0, wpc: 0, noContact: 0 }
      ]
    };
  }, []);

  // Calculate percentages
  const rpcPercentage = (mockContactData.rightPersonContacts / mockContactData.totalCalls) * 100;
  const wpcPercentage = (mockContactData.wrongPersonContacts / mockContactData.totalCalls) * 100;
  const noContactPercentage = (mockContactData.noContacts / mockContactData.totalCalls) * 100;
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return value.toFixed(1) + "%";
  };

  // Calculate conversion trend
  const conversionTrend = mockContactData.conversionRate - mockContactData.previousMonthConversionRate;
  const isPositiveTrend = conversionTrend >= 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-800"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-200">Contact Rate</h1>
            <p className="text-sm text-slate-400">View your call performance and contact metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={dateRange}
            onValueChange={(value) => setDateRange(value)}
            className="w-full md:w-auto"
          >
            <TabsList className="h-9 bg-slate-950/50 border border-slate-800 p-0.5">
              <TabsTrigger
                value="week"
                className="h-7 px-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className="h-7 px-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="quarter"
                className="h-7 px-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                Quarter
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="default"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Calls Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total Calls
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {mockContactData.totalCalls}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>0% from last month</span>
              </div>
              <Badge variant="outline" className="bg-amber-950/40 text-amber-400 border-amber-800/50">
                0 avg/day
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Daily target</span>
                <span className="font-medium text-slate-300">{mockContactData.averageDailyCalls}/{mockContactData.dailyCallTarget}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_6px_rgba(217,119,6,0.3)]"
                  style={{ width: `${(mockContactData.averageDailyCalls / mockContactData.dailyCallTarget) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RPC Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Right Person Contacts
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {mockContactData.rightPersonContacts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>0% from last month</span>
              </div>
              <Badge variant="outline" className="bg-green-950/40 text-green-400 border-green-800/50">
                {formatPercentage(rpcPercentage)} of total
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">RPC rate</span>
                <span className="font-medium text-slate-300">{formatPercentage(rpcPercentage)}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full shadow-[0_0_6px_rgba(22,163,74,0.3)]"
                  style={{ width: `${rpcPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WPC Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Wrong Person Contacts
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {mockContactData.wrongPersonContacts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>0% of total calls</span>
              </div>
              <Badge variant="outline" className="bg-orange-950/40 text-orange-400 border-orange-800/50">
                {formatPercentage(wpcPercentage)} of total
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">WPC rate</span>
                <span className="font-medium text-slate-300">{formatPercentage(wpcPercentage)}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_6px_rgba(234,88,12,0.3)]"
                  style={{ width: `${wpcPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Conversion Rate
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {formatPercentage(mockContactData.conversionRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>0% from last month</span>
              </div>
              <Badge variant="outline" className="bg-indigo-950/40 text-indigo-400 border-indigo-800/50">
                Target: 65%
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Progress to target</span>
                <span className="font-medium text-slate-300">{formatPercentage(mockContactData.conversionRate / 65 * 100)}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_6px_rgba(79,70,229,0.3)]"
                  style={{ width: `${(mockContactData.conversionRate / 65) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Distribution */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Contact Distribution</CardTitle>
            <CardDescription>
              Breakdown of call outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-52">
              <div className="relative w-44 h-44">
                {/* Contact Distribution Donut Chart */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background Circle */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth="12" 
                    />
                    
                    {/* RPC Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#rpcGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${2 * Math.PI * 40 * (rpcPercentage / 100)} ${2 * Math.PI * 40}`}
                      strokeDashoffset="0" 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* WPC Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#wpcGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${2 * Math.PI * 40 * (wpcPercentage / 100)} ${2 * Math.PI * 40}`}
                      strokeDashoffset={`-${2 * Math.PI * 40 * (rpcPercentage / 100)}`} 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* No Contact Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#noContactGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${2 * Math.PI * 40 * (noContactPercentage / 100)} ${2 * Math.PI * 40}`}
                      strokeDashoffset={`-${2 * Math.PI * 40 * ((rpcPercentage + wpcPercentage) / 100)}`} 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="rpcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#4ade80" />
                      </linearGradient>
                      <linearGradient id="wpcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#fb923c" />
                      </linearGradient>
                      <linearGradient id="noContactGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#64748b" />
                        <stop offset="100%" stopColor="#94a3b8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-200">
                    {formatPercentage(rpcPercentage)}
                  </span>
                  <span className="text-xs text-slate-400">RPC Rate</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-green-400 mr-2"></div>
                  <span className="text-xs text-slate-300">RPC</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{mockContactData.rightPersonContacts}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-600 to-orange-400 mr-2"></div>
                  <span className="text-xs text-slate-300">WPC</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{mockContactData.wrongPersonContacts}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-600 to-slate-400 mr-2"></div>
                  <span className="text-xs text-slate-300">No Contact</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{mockContactData.noContacts}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Call Trends */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Daily Call Trends</CardTitle>
            <CardDescription>
              Call performance by day of week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 pt-4">
              {/* Bar Chart */}
              <div className="h-full flex items-end justify-between px-2">
                {mockContactData.callsByDay.map((day, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="relative w-12">
                      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                        {/* No Contact */}
                        <div 
                          className="w-full bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-sm" 
                          style={{ height: `${day.noContact * 2}px` }}
                        ></div>
                        {/* WPC */}
                        <div 
                          className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm" 
                          style={{ height: `${day.wpc * 2}px` }}
                        ></div>
                        {/* RPC */}
                        <div 
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm" 
                          style={{ height: `${day.rpc * 2}px` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-green-600 to-green-400"></div>
                  <span className="text-xs text-slate-300">RPC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-orange-600 to-orange-400"></div>
                  <span className="text-xs text-slate-300">WPC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-slate-600 to-slate-400"></div>
                  <span className="text-xs text-slate-300">No Contact</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Hourly Performance */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Hourly Performance</CardTitle>
          <CardDescription>
            Call performance by time of day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* Line Chart */}
            <div className="relative h-full w-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-slate-400 py-4">
                <div>0</div>
                <div>0</div>
                <div>0</div>
                <div>0</div>
                <div>0</div>
              </div>
              
              {/* Chart area */}
              <div className="absolute left-10 right-0 top-0 bottom-0 border-l border-b border-slate-800">
                {/* Horizontal grid lines */}
                <div className="absolute left-0 right-0 top-1/4 border-t border-slate-800/50 h-0"></div>
                <div className="absolute left-0 right-0 top-2/4 border-t border-slate-800/50 h-0"></div>
                <div className="absolute left-0 right-0 top-3/4 border-t border-slate-800/50 h-0"></div>
                
                {/* X-axis labels */}
                <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-slate-400 transform translate-y-4">
                  {mockContactData.callsByHour.map((hour, index) => (
                    <div key={index} className="text-center" style={{ width: `${100 / mockContactData.callsByHour.length}%` }}>
                      {hour.hour}
                    </div>
                  ))}
                </div>
                
                {/* Total calls line */}
                <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="totalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M ${mockContactData.callsByHour.map((hour, index) => {
                      const x = (index / (mockContactData.callsByHour.length - 1)) * 100;
                      const y = 100 - (hour.total / 120) * 100;
                      return `${x}% ${y}%`;
                    }).join(' L ')}`}
                    fill="none"
                    stroke="url(#totalGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                
                {/* RPC line */}
                <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rpcLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M ${mockContactData.callsByHour.map((hour, index) => {
                      const x = (index / (mockContactData.callsByHour.length - 1)) * 100;
                      const y = 100 - (hour.rpc / 120) * 100;
                      return `${x}% ${y}%`;
                    }).join(' L ')}`}
                    fill="none"
                    stroke="url(#rpcLineGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                
                {/* Data points for total */}
                <div className="absolute inset-0">
                  {mockContactData.callsByHour.map((hour, index) => {
                    const x = (index / (mockContactData.callsByHour.length - 1)) * 100;
                    const y = 100 - (hour.total / 120) * 100;
                    return (
                      <div 
                        key={`total-${index}`}
                        className="absolute h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]"
                        style={{ 
                          left: `calc(${x}% - 4px)`, 
                          top: `calc(${y}% - 4px)`,
                        }}
                      ></div>
                    );
                  })}
                </div>
                
                {/* Data points for RPC */}
                <div className="absolute inset-0">
                  {mockContactData.callsByHour.map((hour, index) => {
                    const x = (index / (mockContactData.callsByHour.length - 1)) * 100;
                    const y = 100 - (hour.rpc / 120) * 100;
                    return (
                      <div 
                        key={`rpc-${index}`}
                        className="absolute h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                        style={{ 
                          left: `calc(${x}% - 4px)`, 
                          top: `calc(${y}% - 4px)`,
                        }}
                      ></div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-sky-600 to-sky-400"></div>
                <span className="text-xs text-slate-300">Total Calls</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-green-600 to-green-400"></div>
                <span className="text-xs text-slate-300">RPC</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Call Data */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Detailed Call Data</CardTitle>
              <CardDescription>
                Recent call outcomes and performance
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search calls..."
                className="pl-9 bg-slate-950/50 border-slate-800"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Date & Time</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Phone Number</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Duration</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Outcome</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Agent</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, index) => {
                  // Generate random mock data for the table
                  const date = new Date();
                  date.setHours(date.getHours() - index * 2);
                  
                  const outcomes = ["RPC", "WPC", "No Answer", "Voicemail", "Busy"];
                  const outcomeClasses = {
                    "RPC": "bg-green-950/40 text-green-400 border-green-800/50",
                    "WPC": "bg-orange-950/40 text-orange-400 border-orange-800/50",
                    "No Answer": "bg-slate-950/40 text-slate-400 border-slate-800/50",
                    "Voicemail": "bg-slate-950/40 text-slate-400 border-slate-800/50",
                    "Busy": "bg-red-950/40 text-red-400 border-red-800/50"
                  };
                  
                  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
                  const duration = outcome === "No Answer" || outcome === "Busy" ? "0:00" : 
                                   `${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
                  
                  const customers = [
                    "John Smith", "Emily Brown", "David Williams", "Sarah Johnson", 
                    "Michael Chen", "Jessica Lee", "Robert Kim", "Emma Davis",
                    "Thomas Wilson", "Olivia Martinez"
                  ];
                  
                  const agents = [
                    "Sarah Johnson", "Michael Chen", "Jessica Lee", 
                    "Robert Kim", "Emma Davis"
                  ];
                  
                  return (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-300">
                        {date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })} {' '}
                        {date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {customers[Math.floor(Math.random() * customers.length)]}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        +27 {Math.floor(Math.random() * 900 + 100)} {Math.floor(Math.random() * 900 + 100)} {Math.floor(Math.random() * 9000 + 1000)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{duration}</td>
                      <td className="py-3 px-4">
                        <div className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                          outcomeClasses[outcome as keyof typeof outcomeClasses]
                        )}>
                          {outcome}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {agents[Math.floor(Math.random() * agents.length)]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">
              Showing <span className="font-medium text-slate-300">0</span> of <span className="font-medium text-slate-300">0</span> calls
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 bg-slate-800/30 text-slate-500"
                disabled
              >
                1
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                2
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                3
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
