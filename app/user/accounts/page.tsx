"use client";

import { useState } from "react";
import {
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart4,
  Filter,
  Search,
  Download,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample data for accounts
const accountsData = [
  {
    id: "ACC-1001",
    name: "Personal Loan Collections",
    totalDebt: 1250000.0,
    collected: 780500.0,
    target: 950000.0,
    accounts: 145,
    activeAccounts: 98,
    settledAccounts: 32,
    legalAccounts: 15,
    recentTransactions: [
      {
        id: "TRX-5001",
        debtorName: "John Smith",
        debtorId: "DEB-1001",
        amount: 1500.0,
        date: "2025-03-08T09:15:00",
        status: "completed",
        method: "EFT",
      },
      {
        id: "TRX-5002",
        debtorName: "Michael Ndlovu",
        debtorId: "DEB-1003",
        amount: 3500.0,
        date: "2025-03-07T14:30:00",
        status: "completed",
        method: "Debit Order",
      },
      {
        id: "TRX-5003",
        debtorName: "Priya Naidoo",
        debtorId: "DEB-1004",
        amount: 5000.0,
        date: "2025-03-06T11:45:00",
        status: "completed",
        method: "Credit Card",
      },
      {
        id: "TRX-5004",
        debtorName: "Sarah Williams",
        debtorId: "DEB-1002",
        amount: 2200.0,
        date: "2025-03-05T16:20:00",
        status: "failed",
        method: "Debit Order",
      },
      {
        id: "TRX-5005",
        debtorName: "Thabo Mkhize",
        debtorId: "DEB-1006",
        amount: 1800.0,
        date: "2025-03-04T10:10:00",
        status: "completed",
        method: "Cash Deposit",
      },
    ],
    monthlyCollection: [
      { month: "Oct 2024", amount: 105000.0 },
      { month: "Nov 2024", amount: 118500.0 },
      { month: "Dec 2024", amount: 95000.0 },
      { month: "Jan 2025", amount: 142000.0 },
      { month: "Feb 2025", amount: 155000.0 },
      { month: "Mar 2025", amount: 165000.0 },
    ],
  },
  {
    id: "ACC-1002",
    name: "Credit Card Collections",
    totalDebt: 875000.0,
    collected: 425000.0,
    target: 650000.0,
    accounts: 210,
    activeAccounts: 175,
    settledAccounts: 15,
    legalAccounts: 20,
    recentTransactions: [
      {
        id: "TRX-6001",
        debtorName: "Lerato Molefe",
        debtorId: "DEB-2001",
        amount: 2500.0,
        date: "2025-03-08T10:30:00",
        status: "completed",
        method: "EFT",
      },
      {
        id: "TRX-6002",
        debtorName: "James Peterson",
        debtorId: "DEB-2003",
        amount: 1800.0,
        date: "2025-03-07T13:15:00",
        status: "completed",
        method: "Debit Order",
      },
      {
        id: "TRX-6003",
        debtorName: "Nomsa Dlamini",
        debtorId: "DEB-2004",
        amount: 3200.0,
        date: "2025-03-06T09:45:00",
        status: "failed",
        method: "Credit Card",
      },
    ],
    monthlyCollection: [
      { month: "Oct 2024", amount: 65000.0 },
      { month: "Nov 2024", amount: 72000.0 },
      { month: "Dec 2024", amount: 58000.0 },
      { month: "Jan 2025", amount: 85000.0 },
      { month: "Feb 2025", amount: 78000.0 },
      { month: "Mar 2025", amount: 67000.0 },
    ],
  },
  {
    id: "ACC-1003",
    name: "Home Loan Collections",
    totalDebt: 3250000.0,
    collected: 1450000.0,
    target: 1800000.0,
    accounts: 85,
    activeAccounts: 65,
    settledAccounts: 10,
    legalAccounts: 10,
    recentTransactions: [
      {
        id: "TRX-7001",
        debtorName: "Sipho Nkosi",
        debtorId: "DEB-3001",
        amount: 7500.0,
        date: "2025-03-08T11:20:00",
        status: "completed",
        method: "EFT",
      },
      {
        id: "TRX-7002",
        debtorName: "Elizabeth van Wyk",
        debtorId: "DEB-3002",
        amount: 8200.0,
        date: "2025-03-07T15:45:00",
        status: "completed",
        method: "Debit Order",
      },
    ],
    monthlyCollection: [
      { month: "Oct 2024", amount: 210000.0 },
      { month: "Nov 2024", amount: 225000.0 },
      { month: "Dec 2024", amount: 195000.0 },
      { month: "Jan 2025", amount: 265000.0 },
      { month: "Feb 2025", amount: 280000.0 },
      { month: "Mar 2025", amount: 275000.0 },
    ],
  },
];

export default function AccountsPage() {
  const [selectedAccount, setSelectedAccount] = useState(accountsData[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getCollectionProgress = (collected: number, target: number) => {
    const percentage = Math.min(Math.round((collected / target) * 100), 100);
    let color = "bg-blue-600";

    if (percentage >= 100) {
      color = "bg-green-600";
    } else if (percentage >= 75) {
      color = "bg-blue-600";
    } else if (percentage >= 50) {
      color = "bg-yellow-600";
    } else {
      color = "bg-red-600";
    }

    return {
      percentage,
      color,
    };
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-200 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Accounts Management
          </h1>
          <p className="text-slate-400">
            Manage debt collection accounts and track financial performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accountsData.map((account) => {
          const progress = getCollectionProgress(
            account.collected,
            account.target
          );

          return (
            <Card
              key={account.id}
              className={`bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm hover:bg-slate-900/60 transition-all cursor-pointer ${
                selectedAccount.id === account.id
                  ? "ring-2 ring-blue-500/50"
                  : ""
              }`}
              onClick={() => setSelectedAccount(account)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{account.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  {account.id} • {account.accounts} accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-400">
                        Collection Progress
                      </span>
                      <span className="text-sm font-medium">
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progress.color} rounded-full transition-all duration-500 ease-in-out`}
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>
                        {formatCurrency(account.collected)} of{" "}
                        {formatCurrency(account.target)}
                      </span>
                      <span>Target</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-slate-800/40 p-2 rounded-md border border-slate-700/40">
                      <p className="text-xs text-slate-500">Active</p>
                      <p className="text-lg font-medium text-slate-200">
                        {account.activeAccounts}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 p-2 rounded-md border border-slate-700/40">
                      <p className="text-xs text-slate-500">Settled</p>
                      <p className="text-lg font-medium text-slate-200">
                        {account.settledAccounts}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 p-2 rounded-md border border-slate-700/40">
                      <p className="text-xs text-slate-500">Legal</p>
                      <p className="text-lg font-medium text-slate-200">
                        {account.legalAccounts}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{selectedAccount.name}</CardTitle>
              <CardDescription className="text-slate-400">
                Account ID: {selectedAccount.id}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="march">
                <SelectTrigger className="w-[180px] h-9 bg-slate-800 border-slate-700 text-sm">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="march">March 2025</SelectItem>
                  <SelectItem value="february">February 2025</SelectItem>
                  <SelectItem value="january">January 2025</SelectItem>
                  <SelectItem value="december">December 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="overview"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-3 bg-slate-800/40 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-blue-400" />
                      Total Debt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(selectedAccount.totalDebt)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Across {selectedAccount.accounts} accounts
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                      Total Collected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(selectedAccount.collected)}
                    </div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/20 text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +8.5% from last month
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                      Monthly Target
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(selectedAccount.target)}
                    </div>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-slate-500">
                        {Math.round(
                          (selectedAccount.collected / selectedAccount.target) *
                            100
                        )}
                        % of target reached
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Monthly Collections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] flex items-end justify-between gap-2">
                      {selectedAccount.monthlyCollection.map((month) => {
                        const maxAmount = Math.max(
                          ...selectedAccount.monthlyCollection.map(
                            (m) => m.amount
                          )
                        );
                        const height = (month.amount / maxAmount) * 100;

                        return (
                          <div
                            key={month.month}
                            className="flex flex-col items-center"
                          >
                            <div
                              className="w-12 bg-blue-600/80 hover:bg-blue-500 rounded-t-sm transition-all"
                              style={{ height: `${height}%` }}
                            ></div>
                            <div className="text-xs text-slate-400 mt-2 whitespace-nowrap">
                              {month.month}
                            </div>
                            <div className="text-xs font-medium mt-1">
                              {formatCurrency(month.amount).replace("ZAR", "R")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Account Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="relative h-[250px] w-[250px]">
                      {/* This is a simplified pie chart visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative h-[200px] w-[200px] rounded-full overflow-hidden">
                          <div
                            className="absolute bg-blue-500"
                            style={{
                              width: "100%",
                              height: "100%",
                              clipPath:
                                "polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)",
                            }}
                          ></div>
                          <div
                            className="absolute bg-green-500"
                            style={{
                              width: "100%",
                              height: "100%",
                              clipPath: "polygon(50% 50%, 0 0, 50% 0)",
                            }}
                          ></div>
                          <div
                            className="absolute bg-purple-500"
                            style={{
                              width: "100%",
                              height: "100%",
                              clipPath: "polygon(50% 50%, 50% 0, 100% 0)",
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-slate-900 rounded-full h-[120px] w-[120px] flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {selectedAccount.accounts}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Total Accounts
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0">
                        <div className="flex justify-center gap-4 text-xs">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-blue-500 rounded-sm mr-1"></div>
                            <span>
                              Active ({selectedAccount.activeAccounts})
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-green-500 rounded-sm mr-1"></div>
                            <span>
                              Settled ({selectedAccount.settledAccounts})
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-purple-500 rounded-sm mr-1"></div>
                            <span>Legal ({selectedAccount.legalAccounts})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <div className="flex justify-between mb-4">
                <div className="relative w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="w-full bg-slate-800 border-slate-700 pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-700"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] h-9 bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-800/50">
                    <TableRow className="hover:bg-slate-800/80 border-slate-700">
                      <TableHead className="text-slate-400 font-medium">
                        Transaction ID
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        Debtor
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        Amount
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        Date & Time
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        Method
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAccount.recentTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-slate-800/40 border-slate-800"
                      >
                        <TableCell className="font-medium">
                          {transaction.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {transaction.debtorName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {transaction.debtorId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.method}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(transaction.status)}
                            <span className="ml-2 capitalize">
                              {transaction.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Print Receipt
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Contact Debtor
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem className="text-red-500">
                                  Reverse Transaction
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-slate-500">
                  Showing {selectedAccount.recentTransactions.length} of{" "}
                  {selectedAccount.recentTransactions.length} transactions
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-slate-700"
                  >
                    1
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-500"
                  >
                    2
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-500"
                  >
                    3
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                      Collection Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {Math.round(
                        (selectedAccount.collected /
                          selectedAccount.totalDebt) *
                          100
                      )}
                      %
                    </div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/20 text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +2.5% from last month
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart4 className="h-5 w-5 mr-2 text-blue-400" />
                      Average Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {formatCurrency(2800)}
                    </div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20 text-xs">
                        Steady
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-purple-400" />
                      Settlement Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {Math.round(
                        (selectedAccount.settledAccounts /
                          selectedAccount.accounts) *
                          100
                      )}
                      %
                    </div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20 text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +1.2% from last month
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/40 border-slate-700/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Collection Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-2">
                    {/* Simplified chart visualization */}
                    <div className="w-full h-full flex items-end justify-between relative">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-slate-500">
                        <div>R300K</div>
                        <div>R200K</div>
                        <div>R100K</div>
                        <div>R0</div>
                      </div>

                      {/* Chart content */}
                      <div className="absolute left-16 right-0 top-0 bottom-0 flex items-end justify-between">
                        {selectedAccount.monthlyCollection.map(
                          (month, index) => {
                            const maxAmount = 300000; // Max value for scaling
                            const height = (month.amount / maxAmount) * 100;
                            const targetHeight =
                              (selectedAccount.target / 6 / maxAmount) * 100;

                            return (
                              <div
                                key={month.month}
                                className="flex flex-col items-center relative w-full"
                              >
                                {/* Target line */}
                                {index ===
                                  selectedAccount.monthlyCollection.length -
                                    1 && (
                                  <div
                                    className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/50"
                                    style={{ bottom: `${targetHeight}%` }}
                                  >
                                    <div className="absolute right-0 -top-6 text-xs text-red-400">
                                      Monthly Target
                                    </div>
                                  </div>
                                )}

                                {/* Bar */}
                                <div className="w-16 relative">
                                  <div
                                    className={`w-full ${
                                      month.amount >= selectedAccount.target / 6
                                        ? "bg-green-600/80"
                                        : "bg-blue-600/80"
                                    } rounded-t-sm transition-all`}
                                    style={{ height: `${height}%` }}
                                  ></div>
                                </div>

                                {/* X-axis label */}
                                <div className="text-xs text-slate-400 mt-2">
                                  {month.month}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-blue-500 rounded-sm mr-2"></div>
                            <span className="text-sm">EFT</span>
                          </div>
                          <span className="text-sm font-medium">45%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: "45%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-green-500 rounded-sm mr-2"></div>
                            <span className="text-sm">Debit Order</span>
                          </div>
                          <span className="text-sm font-medium">30%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: "30%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-purple-500 rounded-sm mr-2"></div>
                            <span className="text-sm">Credit Card</span>
                          </div>
                          <span className="text-sm font-medium">15%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: "15%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-yellow-500 rounded-sm mr-2"></div>
                            <span className="text-sm">Cash Deposit</span>
                          </div>
                          <span className="text-sm font-medium">10%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: "10%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Collection Strategies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-md border border-slate-700/40">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Payment Plans</h4>
                            <p className="text-xs text-slate-400">
                              Structured repayment schedules
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">
                          40% Success
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-md border border-slate-700/40">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Settlement Offers</h4>
                            <p className="text-xs text-slate-400">
                              Discounted lump sum payments
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                          35% Success
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-md border border-slate-700/40">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                            <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Legal Notices</h4>
                            <p className="text-xs text-slate-400">
                              Formal legal communications
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
                          15% Success
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            New Settlement Offer
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle>Create Settlement Offer</DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate a new settlement offer for a debtor account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Debtor Account</label>
              <Select>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select a debtor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="deb-1001">
                    John Smith (DEB-1001)
                  </SelectItem>
                  <SelectItem value="deb-1002">
                    Sarah Williams (DEB-1002)
                  </SelectItem>
                  <SelectItem value="deb-1003">
                    Michael Ndlovu (DEB-1003)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Original Debt Amount
              </label>
              <Input
                type="text"
                value="R 45,000.00"
                disabled
                className="bg-slate-800/50 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Settlement Percentage
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="range"
                  min="50"
                  max="90"
                  defaultValue="70"
                  className="bg-slate-800 border-slate-700"
                />
                <span className="font-medium w-12 text-center">70%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Settlement Amount</label>
              <Input
                type="text"
                value="R 31,500.00"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valid Until</label>
              <Input
                type="date"
                defaultValue="2025-03-22"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="w-full h-20 rounded-md bg-slate-800 border border-slate-700 p-2 text-sm"
                placeholder="Add any additional notes or terms..."
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-700">
                Cancel
              </Button>
            </DialogTrigger>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
              Generate Offer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
