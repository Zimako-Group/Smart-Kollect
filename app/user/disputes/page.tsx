// app/user/disputes/page.tsx
"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  User2,
  XCircle,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Sample data for disputes
const disputesData = [
  {
    id: "DSP-1001",
    debtorName: "John Smith",
    debtorId: "DEB-1001",
    accountNumber: "ACC-5001",
    amount: 12500,
    dateOpened: "2025-02-15T14:30:00",
    status: "Open",
    priority: "High",
    category: "Incorrect Amount",
    assignedTo: "Sarah Johnson",
    description:
      "Customer disputes the amount charged, claims it should be R8,500 instead of R12,500.",
    attachments: 2,
    messages: 4,
    lastUpdated: "2025-03-05T09:15:00",
    timeline: [
      {
        date: "2025-02-15T14:30:00",
        action: "Dispute opened",
        user: "John Smith",
        details: "Initial dispute filed by customer",
      },
      {
        date: "2025-02-16T10:45:00",
        action: "Assigned",
        user: "System",
        details: "Automatically assigned to Sarah Johnson",
      },
      {
        date: "2025-02-20T11:30:00",
        action: "Document added",
        user: "John Smith",
        details: "Customer uploaded original invoice",
      },
      {
        date: "2025-03-05T09:15:00",
        action: "Message",
        user: "Sarah Johnson",
        details: "Requested additional documentation from customer",
      },
    ],
  },
  {
    id: "DSP-1002",
    debtorName: "Sarah Williams",
    debtorId: "DEB-1002",
    accountNumber: "ACC-5002",
    amount: 8750,
    dateOpened: "2025-02-20T09:45:00",
    status: "Under Review",
    priority: "Medium",
    category: "Payment Not Reflected",
    assignedTo: "Michael Ndlovu",
    description:
      "Customer claims payment was made on Feb 15 but not reflected in the system.",
    attachments: 1,
    messages: 2,
    lastUpdated: "2025-03-01T13:20:00",
    timeline: [
      {
        date: "2025-02-20T09:45:00",
        action: "Dispute opened",
        user: "Sarah Williams",
        details: "Initial dispute filed by customer",
      },
      {
        date: "2025-02-21T08:30:00",
        action: "Assigned",
        user: "System",
        details: "Automatically assigned to Michael Ndlovu",
      },
      {
        date: "2025-02-25T14:15:00",
        action: "Document added",
        user: "Sarah Williams",
        details: "Customer uploaded proof of payment",
      },
      {
        date: "2025-03-01T13:20:00",
        action: "Status change",
        user: "Michael Ndlovu",
        details: "Changed status from Open to Under Review",
      },
    ],
  },
  {
    id: "DSP-1003",
    debtorName: "Michael Ndlovu",
    debtorId: "DEB-1003",
    accountNumber: "ACC-5003",
    amount: 5200,
    dateOpened: "2025-02-10T11:15:00",
    status: "Resolved",
    priority: "Low",
    category: "Account Closure",
    assignedTo: "David Moyo",
    description: "Customer disputes debt as account was closed in January.",
    attachments: 3,
    messages: 6,
    lastUpdated: "2025-03-07T10:30:00",
    timeline: [
      {
        date: "2025-02-10T11:15:00",
        action: "Dispute opened",
        user: "Michael Ndlovu",
        details: "Initial dispute filed by customer",
      },
      {
        date: "2025-02-11T09:30:00",
        action: "Assigned",
        user: "System",
        details: "Automatically assigned to David Moyo",
      },
      {
        date: "2025-02-15T13:45:00",
        action: "Document added",
        user: "Michael Ndlovu",
        details: "Customer uploaded account closure confirmation",
      },
      {
        date: "2025-03-01T10:20:00",
        action: "Status change",
        user: "David Moyo",
        details: "Changed status from Open to Under Review",
      },
      {
        date: "2025-03-07T10:30:00",
        action: "Status change",
        user: "David Moyo",
        details: "Changed status from Under Review to Resolved",
      },
    ],
  },
  {
    id: "DSP-1004",
    debtorName: "Elizabeth Dlamini",
    debtorId: "DEB-1004",
    accountNumber: "ACC-5004",
    amount: 15800,
    dateOpened: "2025-02-25T15:20:00",
    status: "Open",
    priority: "Critical",
    category: "Identity Theft",
    assignedTo: "Sarah Johnson",
    description:
      "Customer claims they never opened this account and suspects identity theft.",
    attachments: 4,
    messages: 3,
    lastUpdated: "2025-03-06T14:10:00",
    timeline: [
      {
        date: "2025-02-25T15:20:00",
        action: "Dispute opened",
        user: "Elizabeth Dlamini",
        details: "Initial dispute filed by customer",
      },
      {
        date: "2025-02-26T08:15:00",
        action: "Assigned",
        user: "System",
        details: "Automatically assigned to Sarah Johnson",
      },
      {
        date: "2025-03-01T09:30:00",
        action: "Priority change",
        user: "Sarah Johnson",
        details: "Changed priority from High to Critical",
      },
      {
        date: "2025-03-06T14:10:00",
        action: "Message",
        user: "Sarah Johnson",
        details: "Requested police case number from customer",
      },
    ],
  },
  {
    id: "DSP-1005",
    debtorName: "Robert Chen",
    debtorId: "DEB-1005",
    accountNumber: "ACC-5005",
    amount: 9300,
    dateOpened: "2025-02-18T10:05:00",
    status: "Escalated",
    priority: "High",
    category: "Billing Error",
    assignedTo: "David Moyo",
    description:
      "Customer disputes multiple charges for the same service in February.",
    attachments: 2,
    messages: 5,
    lastUpdated: "2025-03-04T11:25:00",
    timeline: [
      {
        date: "2025-02-18T10:05:00",
        action: "Dispute opened",
        user: "Robert Chen",
        details: "Initial dispute filed by customer",
      },
      {
        date: "2025-02-19T09:20:00",
        action: "Assigned",
        user: "System",
        details: "Automatically assigned to David Moyo",
      },
      {
        date: "2025-02-28T14:30:00",
        action: "Status change",
        user: "David Moyo",
        details: "Changed status from Open to Under Review",
      },
      {
        date: "2025-03-04T11:25:00",
        action: "Status change",
        user: "David Moyo",
        details: "Changed status from Under Review to Escalated",
      },
    ],
  },
];

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "Open":
      return "bg-blue-500/20 text-blue-500 border-blue-500/20";
    case "Under Review":
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
    case "Resolved":
      return "bg-green-500/20 text-green-500 border-green-500/20";
    case "Escalated":
      return "bg-red-500/20 text-red-500 border-red-500/20";
    case "Closed":
      return "bg-slate-500/20 text-slate-500 border-slate-500/20";
    default:
      return "bg-slate-500/20 text-slate-500 border-slate-500/20";
  }
};

// Helper function to get priority color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Critical":
      return "bg-red-500/20 text-red-500 border-red-500/20";
    case "High":
      return "bg-orange-500/20 text-orange-500 border-orange-500/20";
    case "Medium":
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
    case "Low":
      return "bg-green-500/20 text-green-500 border-green-500/20";
    default:
      return "bg-slate-500/20 text-slate-500 border-slate-500/20";
  }
};

export default function DisputesPage() {
  const [selectedDispute, setSelectedDispute] = useState(disputesData[0]);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeTab, setActiveTab] = useState("overview");

  const handleDisputeSelect = (dispute: (typeof disputesData)[0]) => {
    setSelectedDispute(dispute);
    setViewMode("detail");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Flags</h1>
          <p className="text-slate-400 mt-1">
            Manage and resolve customer disputes efficiently
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
                <Plus className="h-4 w-4 mr-2" />
                New Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
              <DialogHeader>
                <DialogTitle>Create New Flag</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Register a new flag for a debtor account.
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
                    Dispute Category
                  </label>
                  <Select>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="incorrect-amount">
                        Incorrect Amount
                      </SelectItem>
                      <SelectItem value="payment-not-reflected">
                        Payment Not Reflected
                      </SelectItem>
                      <SelectItem value="account-closure">
                        Account Closure
                      </SelectItem>
                      <SelectItem value="identity-theft">
                        Identity Theft
                      </SelectItem>
                      <SelectItem value="billing-error">
                        Billing Error
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Disputed Amount</label>
                  <Input
                    type="text"
                    placeholder="R 0.00"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full h-24 rounded-md bg-slate-800 border border-slate-700 p-2 text-sm"
                    placeholder="Describe the dispute in detail..."
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-3 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          ></path>
                        </svg>
                        <p className="mb-1 text-sm text-slate-400">
                          <span className="font-medium">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">
                          PDF, PNG, JPG (MAX. 10MB)
                        </p>
                      </div>
                      <input type="file" className="hidden" multiple />
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-slate-700">
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
                  Create Dispute
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "list" ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Active Disputes</CardTitle>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="search"
                    placeholder="Search disputes..."
                    className="pl-8 bg-slate-800/50 border-slate-700 w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-slate-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px] h-9 border-slate-700 bg-slate-800/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="hover:bg-slate-800/50 border-slate-800">
                    <TableHead className="text-slate-400 font-medium">
                      <div className="flex items-center">
                        ID
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium">
                      Debtor
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium">
                      Category
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium">
                      Amount
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium">
                      Date Opened
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium">
                      Priority
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium">
                      Assigned To
                    </TableHead>
                    <TableHead className="text-slate-400 font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputesData.map((dispute) => (
                    <TableRow
                      key={dispute.id}
                      className="hover:bg-slate-800/40 border-slate-800 cursor-pointer"
                      onClick={() => handleDisputeSelect(dispute)}
                    >
                      <TableCell className="font-medium">
                        {dispute.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {dispute.debtorName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {dispute.debtorId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{dispute.category}</TableCell>
                      <TableCell>{formatCurrency(dispute.amount)}</TableCell>
                      <TableCell>
                        <div>
                          <div>{formatDate(dispute.dateOpened)}</div>
                          <div className="text-xs text-slate-500">
                            {formatTime(dispute.dateOpened)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(dispute.status)}>
                          {dispute.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(dispute.priority)}>
                          {dispute.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{dispute.assignedTo}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem className="cursor-pointer hover:bg-slate-700">
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-slate-700">
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-slate-700">
                              Reassign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem className="cursor-pointer text-red-500 hover:bg-slate-700 hover:text-red-500">
                              Close Dispute
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-slate-800 pt-4">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-300">1-5</span> of{" "}
              <span className="font-medium text-slate-300">12</span> disputes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700"
                disabled
              >
                Previous
              </Button>
              <Button variant="outline" size="sm" className="border-slate-700">
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => setViewMode("list")}
            >
              <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
              Back to List
            </Button>
            <Separator orientation="vertical" className="h-4 bg-slate-700" />
            <div className="text-sm text-slate-400">
              Dispute{" "}
              <span className="text-slate-300">{selectedDispute.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center">
                        <Flag className="h-5 w-5 mr-2 text-blue-400" />
                        {selectedDispute.category}
                      </CardTitle>
                      <CardDescription className="text-slate-400 mt-1">
                        Opened on {formatDate(selectedDispute.dateOpened)} at{" "}
                        {formatTime(selectedDispute.dateOpened)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(selectedDispute.status)}>
                        {selectedDispute.status}
                      </Badge>
                      <Badge
                        className={getPriorityColor(selectedDispute.priority)}
                      >
                        {selectedDispute.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-slate-800/50 p-1">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="communication">
                        Communication
                      </TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="pt-4 space-y-4">
                      <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/40">
                        <h3 className="font-medium mb-2">
                          Dispute Description
                        </h3>
                        <p className="text-slate-300 text-sm">
                          {selectedDispute.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/40">
                          <h3 className="font-medium mb-3">
                            Debtor Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Name:</span>
                              <span className="font-medium">
                                {selectedDispute.debtorName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">ID:</span>
                              <span className="font-medium">
                                {selectedDispute.debtorId}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Account:</span>
                              <span className="font-medium">
                                {selectedDispute.accountNumber}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Disputed Amount:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(selectedDispute.amount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/40">
                          <h3 className="font-medium mb-3">Dispute Details</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Status:</span>
                              <Badge
                                className={getStatusColor(
                                  selectedDispute.status
                                )}
                              >
                                {selectedDispute.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Priority:</span>
                              <Badge
                                className={getPriorityColor(
                                  selectedDispute.priority
                                )}
                              >
                                {selectedDispute.priority}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Assigned To:
                              </span>
                              <span className="font-medium">
                                {selectedDispute.assignedTo}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Last Updated:
                              </span>
                              <span className="font-medium">
                                {formatDate(selectedDispute.lastUpdated)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" className="border-slate-700">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                        <Button variant="outline" className="border-slate-700">
                          <Download className="h-4 w-4 mr-2" />
                          Export Details
                        </Button>
                        <Select>
                          <SelectTrigger className="w-[180px] border-slate-700 bg-slate-800/50">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="under-review">
                              Under Review
                            </SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="communication" className="pt-4">
                      <div className="space-y-4">
                        <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/40">
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/avatars/user1.png" />
                              <AvatarFallback className="bg-blue-600">
                                SJ
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <span className="font-medium">
                                    Sarah Johnson
                                  </span>
                                  <span className="text-slate-500 text-sm ml-2">
                                    Agent
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500">
                                  {formatDate(selectedDispute.lastUpdated)} at{" "}
                                  {formatTime(selectedDispute.lastUpdated)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">
                                Hello {selectedDispute.debtorName}, I've
                                reviewed your dispute regarding{" "}
                                {selectedDispute.category.toLowerCase()}. Could
                                you please provide additional documentation to
                                support your claim? This will help us resolve
                                this matter more quickly.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/avatars/user2.png" />
                              <AvatarFallback className="bg-emerald-600">
                                {selectedDispute.debtorName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <span className="font-medium">
                                    {selectedDispute.debtorName}
                                  </span>
                                  <span className="text-slate-500 text-sm ml-2">
                                    Customer
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500">
                                  {formatDate(selectedDispute.lastUpdated)} at{" "}
                                  {formatTime(selectedDispute.lastUpdated)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">
                                Thank you for your response. I've attached the
                                requested documentation to this dispute. Please
                                let me know if you need any additional
                                information from my side.
                              </p>
                              <div className="mt-2 flex gap-2">
                                <div className="bg-slate-700/50 rounded px-3 py-1.5 text-xs flex items-center">
                                  <Download className="h-3 w-3 mr-1.5" />
                                  invoice_feb2025.pdf
                                </div>
                                <div className="bg-slate-700/50 rounded px-3 py-1.5 text-xs flex items-center">
                                  <Download className="h-3 w-3 mr-1.5" />
                                  payment_proof.jpg
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <textarea
                              className="w-full h-24 rounded-md bg-slate-800 border border-slate-700 p-2 text-sm"
                              placeholder="Type your message here..."
                            ></textarea>
                            <div className="flex justify-between mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Attach File
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-blue-500"
                              >
                                Send Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">
                            Attached Documents ({selectedDispute.attachments})
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Upload Document
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-slate-800/40 rounded-md p-3 border border-slate-700/40 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-500/20 rounded-md flex items-center justify-center mr-3">
                                <Download className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  invoice_feb2025.pdf
                                </div>
                                <div className="text-xs text-slate-500">
                                  Uploaded by {selectedDispute.debtorName} • 2.4
                                  MB
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="bg-slate-800/40 rounded-md p-3 border border-slate-700/40 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-green-500/20 rounded-md flex items-center justify-center mr-3">
                                <Download className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  payment_proof.jpg
                                </div>
                                <div className="text-xs text-slate-500">
                                  Uploaded by {selectedDispute.debtorName} • 1.8
                                  MB
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="bg-slate-800/40 rounded-md p-3 border border-slate-700/40 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-purple-500/20 rounded-md flex items-center justify-center mr-3">
                                <Download className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  account_statement.pdf
                                </div>
                                <div className="text-xs text-slate-500">
                                  Uploaded by Sarah Johnson • 3.1 MB
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="pt-4">
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {selectedDispute.timeline.map((event, index) => (
                            <div key={index} className="relative pl-6 pb-4">
                              {index !==
                                selectedDispute.timeline.length - 1 && (
                                <div className="absolute top-2 left-2 bottom-0 w-0.5 bg-slate-700"></div>
                              )}
                              <div className="absolute top-2 left-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-blue-500"></div>
                              <div className="bg-slate-800/40 rounded-md p-3 border border-slate-700/40">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">
                                      {event.action}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      By {event.user}
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {formatDate(event.date)} at{" "}
                                    {formatTime(event.date)}
                                  </div>
                                </div>
                                <p className="text-sm mt-2 text-slate-300">
                                  {event.details}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t border-slate-800 pt-4">
                  <div className="w-full flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                      Last updated: {formatDate(selectedDispute.lastUpdated)} at{" "}
                      {formatTime(selectedDispute.lastUpdated)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="border-slate-700">
                        <User2 className="h-4 w-4 mr-2" />
                        Reassign
                      </Button>
                      <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resolve Dispute
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dispute Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">Status</div>
                    <Badge className={getStatusColor(selectedDispute.status)}>
                      {selectedDispute.status}
                    </Badge>
                  </div>
                  <Separator className="bg-slate-800" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">Priority</div>
                    <Badge
                      className={getPriorityColor(selectedDispute.priority)}
                    >
                      {selectedDispute.priority}
                    </Badge>
                  </div>
                  <Separator className="bg-slate-800" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">Category</div>
                    <div className="text-sm font-medium">
                      {selectedDispute.category}
                    </div>
                  </div>
                  <Separator className="bg-slate-800" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                      Disputed Amount
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(selectedDispute.amount)}
                    </div>
                  </div>
                  <Separator className="bg-slate-800" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">Date Opened</div>
                    <div className="text-sm font-medium">
                      {formatDate(selectedDispute.dateOpened)}
                    </div>
                  </div>
                  <Separator className="bg-slate-800" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">Assigned To</div>
                    <div className="text-sm font-medium">
                      {selectedDispute.assignedTo}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Activity Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-md bg-blue-500/20 flex items-center justify-center mr-3">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-sm">Messages</div>
                    </div>
                    <div className="text-xl font-semibold">
                      {selectedDispute.messages}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-md bg-purple-500/20 flex items-center justify-center mr-3">
                        <Download className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-sm">Attachments</div>
                    </div>
                    <div className="text-xl font-semibold">
                      {selectedDispute.attachments}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-md bg-yellow-500/20 flex items-center justify-center mr-3">
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="text-sm">Days Open</div>
                    </div>
                    <div className="text-xl font-semibold">
                      {Math.floor(
                        (new Date().getTime() -
                          new Date(selectedDispute.dateOpened).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Related Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-800/40 rounded-md p-3 border border-slate-700/40">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-blue-400 mr-2" />
                      <div className="text-sm font-medium">Account Details</div>
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Account Number:</span>
                        <span>{selectedDispute.accountNumber}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Account Type:</span>
                        <span>Credit Account</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Opening Date:</span>
                        <span>15 Jan 2025</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-blue-400 hover:text-blue-400 hover:bg-blue-400/10"
                    >
                      View Full Account
                    </Button>
                  </div>

                  <div className="bg-slate-800/40 rounded-md p-3 border border-slate-700/40">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-400 mr-2" />
                      <div className="text-sm font-medium">Payment History</div>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <div>R 2,500.00</div>
                          <div className="text-xs text-slate-500">
                            28 Feb 2025
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                          Paid
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <div>R 2,500.00</div>
                          <div className="text-xs text-slate-500">
                            31 Jan 2025
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                          Paid
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <div>R 2,500.00</div>
                          <div className="text-xs text-slate-500">
                            31 Dec 2024
                          </div>
                        </div>
                        <Badge className="bg-red-500/20 text-red-500 border-red-500/20">
                          Late
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-green-400 hover:text-green-400 hover:bg-green-400/10"
                    >
                      View Payment History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
