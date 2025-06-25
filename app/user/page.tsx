"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  DollarSign,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PhoneCall,
  Banknote,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
  BadgePercent,
  Eye,
  Phone,
  CalendarClock,
  ListChecks,
  Receipt,
  BarChart2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateDisplay } from "@/components/DateDisplay";

export default function DashboardPage() {
  // Only have one return statement in your component
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Debt Collection Dashboard
          </h1>
          <DateDisplay />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Calendar className="h-4 w-4 mr-1" />
            This Month
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
          >
            <PhoneCall className="h-4 w-4 mr-1" />
            Start Calling
          </Button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-200">
          Performance Summary
        </h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Collections Card */}
          <div className="group relative overflow-hidden rounded-xl border border-green-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20 hover:translate-y-[-2px]">
            <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-900/60 p-2 shadow-md">
                    <Banknote className="h-4 w-4 text-green-400" />
                  </div>
                  <h3 className="font-medium text-green-400">
                    Collections (MTD)
                  </h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">
                  R145,231.89
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 20.1%
                  </span>
                  <span className="text-slate-400">vs target</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-800/40">
                  72% of goal
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-medium text-slate-300">72%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.3)]"
                    style={{ width: "72%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Cases Card */}
          <div className="group relative overflow-hidden rounded-xl border border-blue-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 hover:translate-y-[-2px]">
            <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-900/60 p-2 shadow-md">
                    <FileText className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="font-medium text-blue-400">Active Cases</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">237</div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-red-400 flex items-center mr-1 font-medium">
                    <ArrowDownRight className="h-3 w-3 mr-1" /> 3.5%
                  </span>
                  <span className="text-slate-400">from last week</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800/40">
                  42 high priority
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Priority breakdown</span>
                </div>
                <div className="flex h-2.5 w-full rounded-full overflow-hidden shadow-inner bg-slate-800/80">
                  <div className="h-full bg-gradient-to-r from-red-600 to-red-400 w-[30%]"></div>
                  <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 w-[45%]"></div>
                  <div className="h-full bg-gradient-to-r from-green-600 to-green-400 w-[25%]"></div>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-red-400 font-medium">High</span>
                  <span className="text-amber-400 font-medium">Medium</span>
                  <span className="text-green-400 font-medium">Low</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Rate Card */}
          <div className="group relative overflow-hidden rounded-xl border border-amber-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20 hover:translate-y-[-2px]">
            <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-amber-900/60 p-2 shadow-md">
                    <PhoneCall className="h-4 w-4 text-amber-400" />
                  </div>
                  <h3 className="font-medium text-amber-400">Contact Rate</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">63.2%</div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 5.7%
                  </span>
                  <span className="text-slate-400">vs last week</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-800/40">
                  89 calls today
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Success rate</span>
                  <span className="font-medium text-slate-300">63.2%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                    style={{ width: "63.2%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Plans Card */}
          <div className="group relative overflow-hidden rounded-xl border border-purple-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20 hover:translate-y-[-2px]">
            <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-purple-900/60 p-2 shadow-md">
                    <BadgePercent className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="font-medium text-purple-400">Payment Plans</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">42</div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 12.5%
                  </span>
                  <span className="text-slate-400">new this month</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-800/40">
                  R67,450 value
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Adherence rate</span>
                  <span className="font-medium text-slate-300">87%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_6px_rgba(147,51,234,0.3)]"
                    style={{ width: "87%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Center */}
      <Card className="overflow-hidden border-0 shadow-[0_4px_24px_0_rgba(0,0,0,0.08)]">
        <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Todays Action Center
              </CardTitle>
              <CardDescription className="mt-1">
                Your prioritized tasks for maximum collection efficiency
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View All Tasks
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-5 md:grid-cols-3">
            {/* Urgent Follow-ups Card */}
            <div className="group relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute transform rotate-45 bg-red-500 text-white text-xs font-bold py-1 right-[-35px] top-[15px] w-[135px] text-center">
                  URGENT
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-red-100 p-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="font-medium text-red-800">
                      Urgent Follow-ups
                    </h3>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-3xl font-bold text-red-700">18</div>
                  <div className="text-sm text-red-600 mb-1">
                    overdue promises
                  </div>
                </div>
                <p className="text-xs text-red-600 mb-4">
                  Customers who promised to pay but have not yet paid
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm"
                >
                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                  Call Now
                </Button>
              </div>
            </div>

            {/* Today's Callbacks Card */}
            <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-amber-100 p-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-medium text-amber-800">
                      Todays Callbacks
                    </h3>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-3xl font-bold text-amber-700">24</div>
                  <div className="text-sm text-amber-600 mb-1">
                    scheduled today
                  </div>
                </div>
                <p className="text-xs text-amber-600 mb-4">
                  Customers who requested callbacks for today
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm"
                >
                  <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                  View Schedule
                </Button>
              </div>
            </div>

            {/* Payment Plans Due Card */}
            <div className="relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-white to-green-50 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-100 p-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-green-800">
                      Payment Plans Due
                    </h3>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-3xl font-bold text-green-700">9</div>
                  <div className="text-sm text-green-600 mb-1">
                    installments due
                  </div>
                </div>
                <p className="text-xs text-green-600 mb-4">
                  Active payment plans with installments due today
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm"
                >
                  <ListChecks className="h-3.5 w-3.5 mr-1.5" />
                  Monitor Plans
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="cases" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList className="h-12 p-0.5 bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-700/30 shadow-md flex gap-1">
            <TabsTrigger
              value="cases"
              className="flex-1 relative px-3 py-2 text-sm font-medium text-slate-300 rounded-lg data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300 data-[state=active]:shadow data-[state=active]:border-b-2 data-[state=active]:border-blue-400 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-blue-900/60 p-1.5 mr-2 shadow-sm">
                  <AlertCircle className="h-3.5 w-3.5 text-blue-300" />
                </div>
                <span>Priority Cases</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex-1 relative px-3 py-2 text-sm font-medium text-slate-300 rounded-lg data-[state=active]:bg-green-900/30 data-[state=active]:text-green-300 data-[state=active]:shadow data-[state=active]:border-b-2 data-[state=active]:border-green-400 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-green-900/60 p-1.5 mr-2 shadow-sm">
                  <Receipt className="h-3.5 w-3.5 text-green-300" />
                </div>
                <span>Recent Payments</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex-1 relative px-3 py-2 text-sm font-medium text-slate-300 rounded-lg data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 data-[state=active]:shadow data-[state=active]:border-b-2 data-[state=active]:border-purple-400 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-purple-900/60 p-1.5 mr-2 shadow-sm">
                  <BarChart2 className="h-3.5 w-3.5 text-purple-300" />
                </div>
                <span>Your Performance</span>
              </div>
            </TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <TabsContent value="cases" className="space-y-4">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-full bg-blue-900/60 p-1.5 shadow-sm">
                  <AlertCircle className="h-4 w-4 text-blue-300" />
                </div>
                <CardTitle>High Priority Cases</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Cases requiring immediate attention based on amount and age
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    name: "John Smith",
                    amount: 12450.75,
                    days: 120,
                    status: "No Contact",
                    priority: "Critical",
                  },
                  {
                    id: 2,
                    name: "Sarah Johnson",
                    amount: 8750.25,
                    days: 90,
                    status: "Promised Payment",
                    priority: "High",
                  },
                  {
                    id: 3,
                    name: "Michael Brown",
                    amount: 15200.0,
                    days: 75,
                    status: "Disputed",
                    priority: "Critical",
                  },
                  {
                    id: 4,
                    name: "Emily Davis",
                    amount: 6300.5,
                    days: 60,
                    status: "Payment Plan",
                    priority: "Medium",
                  },
                  {
                    id: 5,
                    name: "David Wilson",
                    amount: 9800.0,
                    days: 45,
                    status: "Broken Promise",
                    priority: "High",
                  },
                ].map((debtor) => (
                  <div
                    key={debtor.id}
                    className="flex items-center justify-between border-b border-slate-700/50 pb-4 hover:bg-slate-800/30 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10 border-2 border-slate-700 shadow-md">
                        <AvatarFallback
                          className={
                            debtor.priority === "Critical"
                              ? "bg-gradient-to-br from-red-900 to-red-700 text-red-100"
                              : debtor.priority === "High"
                              ? "bg-gradient-to-br from-amber-900 to-amber-700 text-amber-100"
                              : "bg-gradient-to-br from-blue-900 to-blue-700 text-blue-100"
                          }
                        >
                          {debtor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-200">
                            {debtor.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              debtor.priority === "Critical"
                                ? "bg-red-900/40 text-red-300 border-red-700/50"
                                : debtor.priority === "High"
                                ? "bg-amber-900/40 text-amber-300 border-amber-700/50"
                                : "bg-blue-900/40 text-blue-300 border-blue-700/50"
                            }
                          >
                            {debtor.priority}
                          </Badge>
                        </div>
                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                          <span className="font-medium text-slate-300">
                            R
                            {debtor.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span>•</span>
                          <span>{debtor.days} days</span>
                          <span>•</span>
                          <span>{debtor.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full bg-slate-800/70 hover:bg-slate-700/70 text-slate-300"
                      >
                        <PhoneCall className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 bg-slate-800/70 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-slate-100"
                      >
                        View Case
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-full bg-green-900/60 p-1.5 shadow-sm">
                  <Receipt className="h-4 w-4 text-green-300" />
                </div>
                <CardTitle>Recent Payments</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Payments received in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    name: "Robert Taylor",
                    amount: 2500.0,
                    date: "2025-03-07",
                    method: "EFT",
                  },
                  {
                    id: 2,
                    name: "Jennifer Adams",
                    amount: 1200.5,
                    date: "2025-03-06",
                    method: "Credit Card",
                  },
                  {
                    id: 3,
                    name: "Thomas Johnson",
                    amount: 3750.25,
                    date: "2025-03-05",
                    method: "Debit Order",
                  },
                  {
                    id: 4,
                    name: "Lisa Williams",
                    amount: 950.0,
                    date: "2025-03-04",
                    method: "EFT",
                  },
                  {
                    id: 5,
                    name: "Kevin Martin",
                    amount: 1800.75,
                    date: "2025-03-03",
                    method: "Credit Card",
                  },
                ].map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b border-slate-700/50 pb-4 hover:bg-slate-800/30 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-900 to-emerald-700 flex items-center justify-center shadow-md">
                        <CheckCircle2 className="h-5 w-5 text-green-200" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          Payment from {payment.name}
                        </p>
                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                          <span>
                            {new Date(payment.date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{payment.method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-700/30">
                      +R
                      {payment.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-full bg-purple-900/60 p-1.5 shadow-sm">
                  <BarChart2 className="h-4 w-4 text-purple-300" />
                </div>
                <CardTitle>Your Performance Metrics</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Your collection performance for the current month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/40">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        Collection Rate
                      </span>
                      <span className="text-sm font-medium text-blue-300">
                        68%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                        style={{ width: "68%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>Target: 65%</span>
                      <span className="text-green-400">+3% above target</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        Contact Rate
                      </span>
                      <span className="text-sm font-medium text-green-300">
                        72%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                        style={{ width: "72%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>Target: 70%</span>
                      <span className="text-green-400">+2% above target</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        Promise to Pay Conversion
                      </span>
                      <span className="text-sm font-medium text-amber-300">
                        58%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                        style={{ width: "58%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>Target: 60%</span>
                      <span className="text-red-400">-2% below target</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/40">
                    <h3 className="text-sm font-medium mb-3 text-slate-300 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-300" />
                      Monthly Collection Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">Collected</p>
                        <p className="text-lg font-bold text-blue-300">
                          R145,231.89
                        </p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">Target</p>
                        <p className="text-lg font-bold text-slate-300">
                          R200,000.00
                        </p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">
                          Cases Closed
                        </p>
                        <p className="text-lg font-bold text-green-300">37</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">
                          New Payment Plans
                        </p>
                        <p className="text-lg font-bold text-purple-300">42</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/40">
                    <h3 className="text-sm font-medium mb-3 text-slate-300 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-300" />
                      Your Ranking
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-amber-100 font-bold text-xl shadow-lg border-2 border-amber-600/50">
                        #2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-300">
                          Top Performer
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          You are in the top 10% of collectors
                        </p>
                        <div className="mt-2 bg-amber-900/30 text-amber-300 text-xs py-1 px-2 rounded-full inline-flex items-center gap-1 border border-amber-700/30">
                          <TrendingUp className="h-3 w-3" />
                          <span>Up 3 positions this month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
