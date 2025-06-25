"use client";

import { useState } from "react";
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
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Filter,
  Info,
  Layers,
  MessageSquare,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Sliders,
  User2,
  X,
} from "lucide-react";

// Sample data for chargebacks
const chargebacksData = [
  {
    id: "CB-1001",
    accountNumber: "ACC-78945",
    debtorName: "John Smith",
    amount: 3500,
    dateOpened: "2025-03-01T14:30:00",
    status: "Under Investigation",
    priority: "High",
    category: "Unauthorized Transaction",
    merchantName: "TechGadgets Online",
    transactionDate: "2025-02-28T10:15:00",
    cardNumber: "**** **** **** 5678",
    assignedTo: "Sarah Johnson",
    description:
      "Customer claims they did not authorize this purchase and the card was in their possession.",
    attachments: 3,
    messages: 5,
    lastUpdated: "2025-03-07T11:20:00",
    timeline: [
      {
        date: "2025-03-01T14:30:00",
        action: "Chargeback initiated",
        user: "John Smith",
        details: "Customer reported unauthorized transaction",
      },
      {
        date: "2025-03-02T09:15:00",
        action: "Case assigned",
        user: "System",
        details: "Automatically assigned to Sarah Johnson",
      },
      {
        date: "2025-03-03T11:30:00",
        action: "Merchant notified",
        user: "Sarah Johnson",
        details: "Notification sent to TechGadgets Online",
      },
      {
        date: "2025-03-05T15:45:00",
        action: "Merchant response",
        user: "TechGadgets Online",
        details: "Merchant provided transaction logs and delivery confirmation",
      },
      {
        date: "2025-03-07T11:20:00",
        action: "Evidence review",
        user: "Sarah Johnson",
        details: "Reviewing evidence from both parties",
      },
    ],
    evidence: [
      {
        type: "Customer Statement",
        dateSubmitted: "2025-03-01T14:30:00",
        submittedBy: "John Smith",
        filename: "customer_statement.pdf",
      },
      {
        type: "Transaction Receipt",
        dateSubmitted: "2025-03-05T15:45:00",
        submittedBy: "TechGadgets Online",
        filename: "transaction_receipt.pdf",
      },
      {
        type: "Delivery Confirmation",
        dateSubmitted: "2025-03-05T15:45:00",
        submittedBy: "TechGadgets Online",
        filename: "delivery_confirmation.jpg",
      },
    ],
  },
  {
    id: "CB-1002",
    accountNumber: "ACC-65432",
    debtorName: "Sarah Williams",
    amount: 1200,
    dateOpened: "2025-02-25T09:45:00",
    status: "Pending Customer Info",
    priority: "Medium",
    category: "Product Not Received",
    merchantName: "Fashion Boutique",
    transactionDate: "2025-02-15T13:20:00",
    cardNumber: "**** **** **** 4321",
    assignedTo: "Michael Ndlovu",
    description:
      "Customer paid for clothing items but claims the package was never delivered.",
    attachments: 2,
    messages: 3,
    lastUpdated: "2025-03-06T10:30:00",
    timeline: [
      {
        date: "2025-02-25T09:45:00",
        action: "Chargeback initiated",
        user: "Sarah Williams",
        details: "Customer reported non-receipt of goods",
      },
      {
        date: "2025-02-26T08:30:00",
        action: "Case assigned",
        user: "System",
        details: "Automatically assigned to Michael Ndlovu",
      },
      {
        date: "2025-02-28T14:15:00",
        action: "Merchant notified",
        user: "Michael Ndlovu",
        details: "Notification sent to Fashion Boutique",
      },
      {
        date: "2025-03-04T11:20:00",
        action: "Merchant response",
        user: "Fashion Boutique",
        details: "Merchant provided tracking information",
      },
      {
        date: "2025-03-06T10:30:00",
        action: "Customer information requested",
        user: "Michael Ndlovu",
        details: "Requested delivery address confirmation from customer",
      },
    ],
    evidence: [
      {
        type: "Order Confirmation",
        dateSubmitted: "2025-02-25T09:45:00",
        submittedBy: "Sarah Williams",
        filename: "order_confirmation.pdf",
      },
      {
        type: "Tracking Information",
        dateSubmitted: "2025-03-04T11:20:00",
        submittedBy: "Fashion Boutique",
        filename: "tracking_info.pdf",
      },
    ],
  },
  {
    id: "CB-1003",
    accountNumber: "ACC-23456",
    debtorName: "Michael Ndlovu",
    amount: 5000,
    dateOpened: "2025-02-20T16:15:00",
    status: "Resolved in Customer Favor",
    priority: "Low",
    category: "Duplicate Charge",
    merchantName: "Hotel Luxe",
    transactionDate: "2025-02-10T12:00:00",
    cardNumber: "**** **** **** 7890",
    assignedTo: "David Moyo",
    description: "Customer was charged twice for the same hotel booking.",
    attachments: 4,
    messages: 6,
    lastUpdated: "2025-03-05T14:20:00",
    timeline: [
      {
        date: "2025-02-20T16:15:00",
        action: "Chargeback initiated",
        user: "Michael Ndlovu",
        details: "Customer reported duplicate charge",
      },
      {
        date: "2025-02-21T09:30:00",
        action: "Case assigned",
        user: "System",
        details: "Automatically assigned to David Moyo",
      },
      {
        date: "2025-02-22T11:45:00",
        action: "Merchant notified",
        user: "David Moyo",
        details: "Notification sent to Hotel Luxe",
      },
      {
        date: "2025-02-28T10:20:00",
        action: "Merchant response",
        user: "Hotel Luxe",
        details: "Merchant acknowledged the error",
      },
      {
        date: "2025-03-05T14:20:00",
        action: "Case resolved",
        user: "David Moyo",
        details: "Chargeback approved in customer's favor",
      },
    ],
    evidence: [
      {
        type: "Bank Statement",
        dateSubmitted: "2025-02-20T16:15:00",
        submittedBy: "Michael Ndlovu",
        filename: "bank_statement.pdf",
      },
      {
        type: "Hotel Booking",
        dateSubmitted: "2025-02-20T16:15:00",
        submittedBy: "Michael Ndlovu",
        filename: "hotel_booking.pdf",
      },
      {
        type: "Merchant Acknowledgment",
        dateSubmitted: "2025-02-28T10:20:00",
        submittedBy: "Hotel Luxe",
        filename: "error_acknowledgment.pdf",
      },
      {
        type: "Refund Confirmation",
        dateSubmitted: "2025-03-05T14:20:00",
        submittedBy: "Hotel Luxe",
        filename: "refund_confirmation.pdf",
      },
    ],
  },
  {
    id: "CB-1004",
    accountNumber: "ACC-34567",
    debtorName: "Elizabeth Dlamini",
    amount: 8500,
    dateOpened: "2025-03-02T10:30:00",
    status: "Resolved in Merchant Favor",
    priority: "High",
    category: "Product Quality Dispute",
    merchantName: "Premium Electronics",
    transactionDate: "2025-02-20T15:45:00",
    cardNumber: "**** **** **** 1234",
    assignedTo: "Sarah Johnson",
    description:
      "Customer claims the laptop purchased was defective, but merchant provided evidence it was damaged by customer.",
    attachments: 5,
    messages: 8,
    lastUpdated: "2025-03-07T16:15:00",
    timeline: [
      {
        date: "2025-03-02T10:30:00",
        action: "Chargeback initiated",
        user: "Elizabeth Dlamini",
        details: "Customer reported defective product",
      },
      {
        date: "2025-03-03T08:45:00",
        action: "Case assigned",
        user: "System",
        details: "Automatically assigned to Sarah Johnson",
      },
      {
        date: "2025-03-04T11:30:00",
        action: "Merchant notified",
        user: "Sarah Johnson",
        details: "Notification sent to Premium Electronics",
      },
      {
        date: "2025-03-06T09:15:00",
        action: "Merchant response",
        user: "Premium Electronics",
        details: "Merchant provided evidence of customer damage",
      },
      {
        date: "2025-03-07T16:15:00",
        action: "Case resolved",
        user: "Sarah Johnson",
        details: "Chargeback denied, resolved in merchant's favor",
      },
    ],
    evidence: [
      {
        type: "Product Photos",
        dateSubmitted: "2025-03-02T10:30:00",
        submittedBy: "Elizabeth Dlamini",
        filename: "defective_laptop.jpg",
      },
      {
        type: "Purchase Receipt",
        dateSubmitted: "2025-03-02T10:30:00",
        submittedBy: "Elizabeth Dlamini",
        filename: "receipt.pdf",
      },
      {
        type: "Inspection Report",
        dateSubmitted: "2025-03-06T09:15:00",
        submittedBy: "Premium Electronics",
        filename: "inspection_report.pdf",
      },
      {
        type: "Damage Photos",
        dateSubmitted: "2025-03-06T09:15:00",
        submittedBy: "Premium Electronics",
        filename: "liquid_damage_evidence.jpg",
      },
      {
        type: "Warranty Terms",
        dateSubmitted: "2025-03-06T09:15:00",
        submittedBy: "Premium Electronics",
        filename: "warranty_terms.pdf",
      },
    ],
  },
  {
    id: "CB-1005",
    accountNumber: "ACC-87654",
    debtorName: "Robert Chen",
    amount: 2300,
    dateOpened: "2025-02-28T13:45:00",
    status: "Under Investigation",
    priority: "Medium",
    category: "Subscription Cancellation",
    merchantName: "FitnessPro Monthly",
    transactionDate: "2025-02-25T08:30:00",
    cardNumber: "**** **** **** 9876",
    assignedTo: "David Moyo",
    description:
      "Customer claims they cancelled their subscription but were still charged for the month.",
    attachments: 2,
    messages: 4,
    lastUpdated: "2025-03-06T15:30:00",
    timeline: [
      {
        date: "2025-02-28T13:45:00",
        action: "Chargeback initiated",
        user: "Robert Chen",
        details: "Customer reported unauthorized subscription charge",
      },
      {
        date: "2025-03-01T09:20:00",
        action: "Case assigned",
        user: "System",
        details: "Automatically assigned to David Moyo",
      },
      {
        date: "2025-03-02T10:15:00",
        action: "Merchant notified",
        user: "David Moyo",
        details: "Notification sent to FitnessPro Monthly",
      },
      {
        date: "2025-03-05T14:30:00",
        action: "Merchant response",
        user: "FitnessPro Monthly",
        details: "Merchant provided subscription terms and activity logs",
      },
      {
        date: "2025-03-06T15:30:00",
        action: "Evidence review",
        user: "David Moyo",
        details: "Reviewing cancellation evidence from both parties",
      },
    ],
    evidence: [
      {
        type: "Cancellation Email",
        dateSubmitted: "2025-02-28T13:45:00",
        submittedBy: "Robert Chen",
        filename: "cancellation_email.pdf",
      },
      {
        type: "Subscription Terms",
        dateSubmitted: "2025-03-05T14:30:00",
        submittedBy: "FitnessPro Monthly",
        filename: "subscription_terms.pdf",
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
    case "Under Investigation":
      return "bg-amber-500/20 text-amber-500 border-amber-500/20";
    case "Pending Customer Info":
      return "bg-blue-500/20 text-blue-500 border-blue-500/20";
    case "Resolved in Customer Favor":
      return "bg-green-500/20 text-green-500 border-green-500/20";
    case "Resolved in Merchant Favor":
      return "bg-red-500/20 text-red-500 border-red-500/20";
    default:
      return "bg-slate-500/20 text-slate-500 border-slate-500/20";
  }
};

// Helper function to get priority color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-500/20 text-red-500 border-red-500/20";
    case "Medium":
      return "bg-amber-500/20 text-amber-500 border-amber-500/20";
    case "Low":
      return "bg-green-500/20 text-green-500 border-green-500/20";
    default:
      return "bg-slate-500/20 text-slate-500 border-slate-500/20";
  }
};

export default function ChargebacksPage() {
  const [selectedChargeback, setSelectedChargeback] = useState(
    chargebacksData[0]
  );
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeTab, setActiveTab] = useState("overview");

  const handleChargebackSelect = (chargeback: (typeof chargebacksData)[0]) => {
    setSelectedChargeback(chargeback);
    setViewMode("detail");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Chargeback Management
          </h1>
          <p className="text-slate-400 mt-1">
            Track and manage card transaction disputes
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
                New Chargeback
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle>Create New Chargeback</DialogTitle>
                <DialogDescription>
                  Enter the details of the new chargeback claim.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Debtor</label>
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
                    Chargeback Category
                  </label>
                  <Select>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="unauthorized-transaction">
                        Unauthorized Transaction
                      </SelectItem>
                      <SelectItem value="product-not-received">
                        Product Not Received
                      </SelectItem>
                      <SelectItem value="duplicate-charge">
                        Duplicate Charge
                      </SelectItem>
                      <SelectItem value="product-quality">
                        Product Quality Dispute
                      </SelectItem>
                      <SelectItem value="subscription-cancellation">
                        Subscription Cancellation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Merchant Name</label>
                    <Input
                      placeholder="Enter merchant name"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Transaction Date
                    </label>
                    <Input
                      type="date"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Card Number</label>
                    <Input
                      placeholder="**** **** **** 1234"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      placeholder="R 0.00"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full h-24 rounded-md bg-slate-800 border-slate-700 p-2 text-sm"
                    placeholder="Describe the chargeback reason in detail..."
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Evidence</label>
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
                <Button
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => {}}
                >
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
                  Submit Chargeback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search chargebacks..."
                    className="pl-9 bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-slate-700">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <Select>
                    <SelectTrigger className="w-[180px] border-slate-700 bg-slate-800/50">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="under-investigation">
                        Under Investigation
                      </SelectItem>
                      <SelectItem value="pending-customer">
                        Pending Customer Info
                      </SelectItem>
                      <SelectItem value="customer-favor">
                        Resolved in Customer Favor
                      </SelectItem>
                      <SelectItem value="merchant-favor">
                        Resolved in Merchant Favor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-800/50">
                    <TableRow className="hover:bg-slate-800/50">
                      <TableHead className="text-slate-400 font-medium">
                        ID
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        <div className="flex items-center">
                          Debtor
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        <div className="flex items-center">
                          Amount
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        Merchant
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        Category
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium">
                        <div className="flex items-center">
                          Date Opened
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-400 font-medium text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chargebacksData.map((chargeback) => (
                      <TableRow
                        key={chargeback.id}
                        className="hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => handleChargebackSelect(chargeback)}
                      >
                        <TableCell className="font-medium">
                          {chargeback.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-blue-600 text-xs">
                                {chargeback.debtorName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {chargeback.debtorName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {chargeback.accountNumber}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(chargeback.amount)}
                        </TableCell>
                        <TableCell>{chargeback.merchantName}</TableCell>
                        <TableCell>{chargeback.category}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(chargeback.status)}>
                            {chargeback.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(chargeback.dateOpened)}</div>
                          <div className="text-xs text-slate-500">
                            {formatTime(chargeback.dateOpened)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChargebackSelect(chargeback);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              className="border-slate-700"
              onClick={() => setViewMode("list")}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <h2 className="text-xl font-bold text-white">
              Chargeback {selectedChargeback.id}
            </h2>
            <Badge className={getStatusColor(selectedChargeback.status)}>
              {selectedChargeback.status}
            </Badge>
            <Badge className={getPriorityColor(selectedChargeback.priority)}>
              {selectedChargeback.priority}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    Chargeback Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue="overview"
                    className="w-full"
                    onValueChange={setActiveTab}
                  >
                    <TabsList className="grid w-full grid-cols-4 bg-slate-800">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="evidence">Evidence</TabsTrigger>
                      <TabsTrigger value="messages">Messages</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">Debtor</p>
                          <p className="font-medium">
                            {selectedChargeback.debtorName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">
                            Account Number
                          </p>
                          <p className="font-medium">
                            {selectedChargeback.accountNumber}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">Amount</p>
                          <p className="font-medium">
                            {formatCurrency(selectedChargeback.amount)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">Date Opened</p>
                          <p className="font-medium">
                            {formatDate(selectedChargeback.dateOpened)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">Merchant</p>
                          <p className="font-medium">
                            {selectedChargeback.merchantName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">Category</p>
                          <p className="font-medium">
                            {selectedChargeback.category}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">Card Number</p>
                          <p className="font-medium">
                            {selectedChargeback.cardNumber}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500">
                            Transaction Date
                          </p>
                          <p className="font-medium">
                            {formatDate(selectedChargeback.transactionDate)}
                          </p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-sm text-slate-500">Description</p>
                          <p className="font-medium">
                            {selectedChargeback.description}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="pt-4">
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {selectedChargeback.timeline.map((event, index) => (
                            <div key={index} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                  {event.action.includes("initiated") ? (
                                    <ShieldAlert className="h-4 w-4" />
                                  ) : event.action.includes("assigned") ? (
                                    <User2 className="h-4 w-4" />
                                  ) : event.action.includes("notified") ? (
                                    <MessageSquare className="h-4 w-4" />
                                  ) : event.action.includes("response") ? (
                                    <FileText className="h-4 w-4" />
                                  ) : event.action.includes("resolved") ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <Layers className="h-4 w-4" />
                                  )}
                                </div>
                                {index <
                                  selectedChargeback.timeline.length - 1 && (
                                  <div className="w-0.5 h-full bg-slate-800 mt-2"></div>
                                )}
                              </div>
                              <div className="space-y-1 pb-4">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{event.action}</p>
                                  <Badge
                                    variant="outline"
                                    className="border-slate-700"
                                  >
                                    {event.user}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-500">
                                  {event.details}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(event.date)}</span>
                                  <Clock className="h-3 w-3 ml-2" />
                                  <span>{formatTime(event.date)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="evidence" className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">
                            Evidence Files ({selectedChargeback.evidence.length}
                            )
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Add Evidence
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedChargeback.evidence.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 rounded-md bg-slate-800/50 border border-slate-800"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-md bg-blue-600/20 text-blue-500 flex items-center justify-center">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{item.type}</p>
                                  <p className="text-xs text-slate-500">
                                    {item.filename}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end text-xs text-slate-500">
                                <p>Submitted by: {item.submittedBy}</p>
                                <p>{formatDate(item.dateSubmitted)}</p>
                                <div className="flex gap-2 mt-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="messages" className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">
                            Communication History
                          </h3>
                          <Button
                            className="bg-gradient-to-r from-blue-600 to-blue-500"
                            size="sm"
                          >
                            <MessageSquare className="h-3 w-3 mr-2" />
                            New Message
                          </Button>
                        </div>
                        <div className="bg-slate-800/50 rounded-md p-4 border border-slate-800">
                          <p className="text-center text-sm text-slate-500">
                            Messages will appear here once communication begins.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    Resolution Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="border-slate-700">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Debtor
                      </Button>
                      <Button variant="outline" className="border-slate-700">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Merchant
                      </Button>
                      <Button variant="outline" className="border-slate-700">
                        <Shield className="h-4 w-4 mr-2" />
                        Request Evidence
                      </Button>
                      <Button variant="outline" className="border-slate-700">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Verify Transaction
                      </Button>
                    </div>
                    <Separator className="bg-slate-800" />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">
                        Resolution Decision
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve Chargeback
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700">
                          <X className="h-4 w-4 mr-2" />
                          Deny Chargeback
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    Case Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm text-slate-500">Assigned To</p>
                      <Badge variant="outline" className="border-slate-700">
                        {selectedChargeback.assignedTo}
                      </Badge>
                    </div>
                    <Separator className="bg-slate-800" />
                    <div className="flex justify-between">
                      <p className="text-sm text-slate-500">Last Updated</p>
                      <p className="text-sm">
                        {formatDate(selectedChargeback.lastUpdated)}
                      </p>
                    </div>
                    <Separator className="bg-slate-800" />
                    <div className="flex justify-between">
                      <p className="text-sm text-slate-500">Attachments</p>
                      <p className="text-sm">
                        {selectedChargeback.attachments}
                      </p>
                    </div>
                    <Separator className="bg-slate-800" />
                    <div className="flex justify-between">
                      <p className="text-sm text-slate-500">Messages</p>
                      <p className="text-sm">{selectedChargeback.messages}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-slate-700">
                    <Sliders className="h-4 w-4 mr-2" />
                    Update Case Status
                  </Button>
                  <Button variant="outline" className="w-full border-slate-700">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Reassign Case
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    Related Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Transaction Details</h3>
                    <div className="p-3 rounded-md bg-slate-800/50 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedChargeback.merchantName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(selectedChargeback.transactionDate)}
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3 bg-slate-700" />
                      <div className="flex justify-between text-sm">
                        <p className="text-slate-500">Transaction ID</p>
                        <p>TX-{Math.floor(Math.random() * 1000000)}</p>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <p className="text-slate-500">Amount</p>
                        <p>{formatCurrency(selectedChargeback.amount)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Customer History</h3>
                    <div className="p-3 rounded-md bg-slate-800/50 border border-slate-800">
                      <div className="flex justify-between text-sm">
                        <p className="text-slate-500">Previous Chargebacks</p>
                        <p>{Math.floor(Math.random() * 3)}</p>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <p className="text-slate-500">Account Age</p>
                        <p>{Math.floor(Math.random() * 5) + 1} years</p>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <p className="text-slate-500">Risk Score</p>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                          Low
                        </Badge>
                      </div>
                    </div>
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
