"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Download,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getDebtors } from "@/lib/debtors-service";
import { Skeleton } from "@/components/ui/skeleton";
import { DateDisplay } from "@/components/DateDisplay";

export default function AllAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Function to fetch accounts with pagination and filtering
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, any> = {};
      
      if (statusFilter && statusFilter !== 'all') {
        filters.account_status_code = statusFilter;
      }
      
      const { data, count, error } = await getDebtors(
        currentPage,
        pageSize,
        searchTerm,
        filters
      );
      
      if (error) {
        console.error("Error fetching accounts:", error);
        return;
      }
      
      setAccounts(data || []);
      setTotalAccounts(count || 0);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter]);
  
  // Fetch accounts on initial load and when filters change
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  
  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchAccounts();
  };
  
  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Default to descending for a new sort field
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'overdue':
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'suspended':
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case 'closed':
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Accounts</h1>
          <p className="text-muted-foreground">
            View and manage all debtor accounts in the system
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 w-full md:w-auto"
          onClick={() => router.push('/admin/accounts')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Account Management
        </Button>
      </div>
      {/* Filters and Search */}
      <Card className="border-slate-800 bg-slate-950/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search by name, account number, or ID..."
                  className="pl-9 bg-slate-900 border-slate-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-800">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-800">
                  <SelectValue placeholder="20 per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                className="bg-slate-800 hover:bg-slate-700"
                onClick={handleSearch}
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Accounts Table */}
      <Card className="border-slate-800 bg-slate-950/50">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle>Account List</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchAccounts} className="h-8">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
          <CardDescription>
            {isLoading
              ? "Loading accounts..."
              : `Showing ${accounts.length} of ${totalAccounts} accounts`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="hover:bg-slate-900/80 border-slate-800">
                  <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort("acc_number")}>
                    Account Number
                    {sortField === "acc_number" && (
                      sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    Customer Name
                    {sortField === "name" && (
                      sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                    )}
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("outstanding_balance")}>
                    Balance
                    {sortField === "outstanding_balance" && (
                      sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                    )}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  (Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="hover:bg-slate-900/80 border-slate-800">
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  )))
                ) : accounts.length > 0 ? (
                  accounts.map((account) => (
                    <TableRow key={account.id} className="hover:bg-slate-900/80 border-slate-800">
                      <TableCell className="font-medium">{account.acc_number}</TableCell>
                      <TableCell>
                        <div className="font-medium">{account.name || ""} {account.surname_company_trust || ""}</div>
                        <div className="text-xs text-slate-500">{account.id_number_1 || "No ID"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {account.cell_number && (
                            <div className="flex items-center text-xs">
                              <Phone className="h-3 w-3 mr-1 text-slate-500" />
                              <span>{account.cell_number}</span>
                            </div>
                          )}
                          {account.email_addr_1 && (
                            <div className="flex items-center text-xs">
                              <Mail className="h-3 w-3 mr-1 text-slate-500" />
                              <span className="truncate max-w-[150px]">{account.email_addr_1}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.outstanding_balance || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(account.account_status_description || "")}>
                          {account.account_status_description || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 hover:bg-indigo-900/20 hover:text-indigo-400 hover:border-indigo-800"
                            onClick={() => router.push(`/admin/accounts/${account.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800"
                            onClick={() => router.push(`/admin/accounts/allocate/${account.id}`)}
                          >
                            Allocate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="rounded-full bg-slate-800/60 p-3 mb-4">
                          <Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-1">No accounts found</h3>
                        <p className="text-sm text-slate-500 max-w-md">
                          No accounts match your current search and filter criteria. Try adjusting your filters or search term.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalAccounts > 0 && !isLoading && (
          <CardFooter className="flex justify-between items-center border-t border-slate-800 py-4">
            <div className="text-sm text-slate-500">
              Showing {accounts.length} of {totalAccounts} accounts
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }} 
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {/* Generate page numbers */}
                {Array.from({ length: Math.min(5, Math.ceil(totalAccounts / pageSize)) }, (_, i) => {
                  const pageNum = i + 1;
                  // Show first page, last page, current page, and pages around current
                  const totalPages = Math.ceil(totalAccounts / pageSize);
                  const showPage = 
                    pageNum === 1 || 
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                    
                  if (!showPage && pageNum === 2) {
                    return (
                      <PaginationItem key="ellipsis-1">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  if (!showPage && pageNum === totalPages - 1) {
                    return (
                      <PaginationItem key="ellipsis-2">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  if (!showPage) return null;
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      const totalPages = Math.ceil(totalAccounts / pageSize);
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }} 
                    className={currentPage >= Math.ceil(totalAccounts / pageSize) ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
