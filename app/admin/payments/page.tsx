"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Calendar,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Plus,
  Banknote,
  Receipt,
  CalendarClock,
  BadgePercent,
  FileText,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateDisplay } from "@/components/DateDisplay";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define types for your data
type PaymentStatus = 'successful' | 'pending' | 'failed' | 'active' | 'at_risk';

interface Debtor {
  name: string;
  accountId: string;
  avatar: string;
}

interface Payment {
  id: string;
  debtor: Debtor;
  amount: number;
  date: string;
  method: string;
  status: PaymentStatus;
  reference: string;
}

interface PaymentPlan {
  id: string;
  debtor: Debtor;
  totalAmount: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  nextPayment: string;
  status: PaymentStatus;
  progress: number;
}

export default function PaymentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("recent");

  // Mock data for payments
  const recentPayments: Payment[] = [
    {
      id: "PAY-2025-0308",
      debtor: {
        name: "Sarah Johnson",
        accountId: "ACC-7823",
        avatar: "/avatars/sarah.jpg",
      },
      amount: 1250.00,
      date: "2025-03-08",
      method: "Credit Card",
      status: "successful",
      reference: "REF-78923",
    },
    {
      id: "PAY-2025-0307",
      debtor: {
        name: "Michael Thompson",
        accountId: "ACC-4562",
        avatar: "/avatars/michael.jpg",
      },
      amount: 750.50,
      date: "2025-03-07",
      method: "EFT",
      status: "successful",
      reference: "REF-45672",
    },
    {
      id: "PAY-2025-0307",
      debtor: {
        name: "David Nkosi",
        accountId: "ACC-3421",
        avatar: "/avatars/david.jpg",
      },
      amount: 2100.00,
      date: "2025-03-07",
      method: "Debit Order",
      status: "successful",
      reference: "REF-34218",
    },
    {
      id: "PAY-2025-0306",
      debtor: {
        name: "Thabo Molefe",
        accountId: "ACC-9087",
        avatar: "/avatars/thabo.jpg",
      },
      amount: 450.00,
      date: "2025-03-06",
      method: "EFT",
      status: "pending",
      reference: "REF-90873",
    },
    {
      id: "PAY-2025-0305",
      debtor: {
        name: "Lerato Dlamini",
        accountId: "ACC-6754",
        avatar: "/avatars/lerato.jpg",
      },
      amount: 1800.00,
      date: "2025-03-05",
      method: "Credit Card",
      status: "successful",
      reference: "REF-67542",
    },
  ];

  const paymentPlans: PaymentPlan[] = [
    {
      id: "PLAN-2025-0245",
      debtor: {
        name: "Nomsa Khumalo",
        accountId: "ACC-5432",
        avatar: "/avatars/nomsa.jpg",
      },
      totalAmount: 12500.00,
      monthlyAmount: 1250.00,
      startDate: "2025-01-15",
      endDate: "2025-11-15",
      nextPayment: "2025-04-15",
      status: "active",
      progress: 30,
    },
    {
      id: "PLAN-2025-0187",
      debtor: {
        name: "John Smith",
        accountId: "ACC-3219",
        avatar: "/avatars/john.jpg",
      },
      totalAmount: 8400.00,
      monthlyAmount: 700.00,
      startDate: "2025-02-01",
      endDate: "2026-01-01",
      nextPayment: "2025-04-01",
      status: "active",
      progress: 16,
    },
    {
      id: "PLAN-2025-0134",
      debtor: {
        name: "Precious Ndlovu",
        accountId: "ACC-7865",
        avatar: "/avatars/precious.jpg",
      },
      totalAmount: 5600.00,
      monthlyAmount: 800.00,
      startDate: "2025-01-10",
      endDate: "2025-08-10",
      nextPayment: "2025-04-10",
      status: "at_risk",
      progress: 37,
    },
  ];

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "successful":
        return (
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800/40">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Successful
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-900/20 text-amber-400 border-amber-800/40">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800/40">
            <AlertCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800/40">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Active
          </Badge>
        );
      case "at_risk":
        return (
          <Badge variant="outline" className="bg-amber-900/20 text-amber-400 border-amber-800/40">
            <AlertCircle className="h-3 w-3 mr-1" /> At Risk
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Payment Management
          </h1>
          <DateDisplay />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/40 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-900/60 p-2 shadow-md">
                <Banknote className="h-4 w-4 text-green-400" />
              </div>
              <CardTitle className="text-sm font-medium">Total Payments (Today)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-slate-200">R5,450.50</div>
            <p className="text-xs flex items-center text-slate-400">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-400" />
              <span className="text-green-400 font-medium">12.5%</span>
              <span className="ml-1">vs yesterday</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/40 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-900/60 p-2 shadow-md">
                <Receipt className="h-4 w-4 text-blue-400" />
              </div>
              <CardTitle className="text-sm font-medium">Transactions (Today)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-slate-200">7</div>
            <p className="text-xs flex items-center text-slate-400">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-400" />
              <span className="text-green-400 font-medium">3</span>
              <span className="ml-1">more than yesterday</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/40 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-purple-900/60 p-2 shadow-md">
                <BadgePercent className="h-4 w-4 text-purple-400" />
              </div>
              <CardTitle className="text-sm font-medium">Active Payment Plans</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-slate-200">42</div>
            <p className="text-xs flex items-center text-slate-400">
              <span className="text-purple-400 font-medium">R67,450</span>
              <span className="ml-1">total value</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/40 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-900/60 p-2 shadow-md">
                <CalendarClock className="h-4 w-4 text-amber-400" />
              </div>
              <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-slate-200">15</div>
            <p className="text-xs flex items-center text-slate-400">
              <span className="text-amber-400 font-medium">R18,750</span>
              <span className="ml-1">expected this week</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by debtor name, account or reference..."
              className="pl-9 bg-slate-900/40 border-slate-700/50 focus-visible:ring-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-slate-900/40 border-slate-700/50">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="eft">EFT</SelectItem>
                <SelectItem value="debit_order">Debit Order</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="border-slate-700/50">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-slate-700/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recent" className="space-y-4" onValueChange={setSelectedTab}>
          <TabsList className="bg-slate-900/40 border border-slate-800/60">
            <TabsTrigger value="recent" className="data-[state=active]:bg-slate-800">
              Recent Payments
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-slate-800">
              Payment Plans
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-slate-800">
              Scheduled Payments
            </TabsTrigger>
          </TabsList>

          {/* Recent Payments Tab */}
          <TabsContent value="recent" className="space-y-4">
            <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Debtor</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Amount</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Method</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Reference</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((payment, index) => (
                        <tr 
                          key={`${payment.id}-${index}`} 
                          className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-slate-700/50">
                                <AvatarFallback className="bg-slate-800 text-slate-300">
                                  {payment.debtor.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm text-slate-200">{payment.debtor.name}</div>
                                <div className="text-xs text-slate-400">{payment.debtor.accountId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-green-400">R{payment.amount.toFixed(2)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-300">{new Date(payment.date).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-300">{payment.method}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-400 font-mono">{payment.reference}</div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Debtor</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Total Amount</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Monthly Payment</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Next Payment</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Progress</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentPlans.map((plan, index) => (
                        <tr 
                          key={`${plan.id}-${index}`} 
                          className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-slate-700/50">
                                <AvatarFallback className="bg-slate-800 text-slate-300">
                                  {plan.debtor.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm text-slate-200">{plan.debtor.name}</div>
                                <div className="text-xs text-slate-400">{plan.debtor.accountId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-300">R{plan.totalAmount.toFixed(2)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-green-400">R{plan.monthlyAmount.toFixed(2)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-300">{new Date(plan.nextPayment).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                                  style={{ width: `${plan.progress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-slate-400">{plan.progress}% complete</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(plan.status)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Payments Tab */}
          <TabsContent value="scheduled" className="space-y-4">
            <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
              <CardContent className="py-10">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="rounded-full bg-slate-800/80 p-3">
                    <Calendar className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300">No Scheduled Payments</h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    There are no manually scheduled payments at the moment. Scheduled payments will appear here when created.
                  </p>
                  <Button className="mt-2 bg-gradient-to-r from-blue-600 to-blue-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule a Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}