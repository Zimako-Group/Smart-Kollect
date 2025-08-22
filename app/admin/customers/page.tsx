"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { 
  getAllDebtors, 
  getDebtorStats, 
  bulkUpdateDebtors,
  bulkDeleteDebtors,
  exportDebtors,
  formatCurrency, 
  formatDate,
  type Debtor,
  type DebtorStats
} from "@/lib/admin-debtors-service";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Download, 
  Trash2, 
  Edit, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Filter,
  MoreHorizontal,
  Eye
} from "lucide-react";

export default function AdminCustomersPage() {
  const router = useRouter();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [stats, setStats] = useState<DebtorStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDebtors, setSelectedDebtors] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    riskLevel: "",
    accountType: "",
    minBalance: "",
    maxBalance: ""
  });

  const pageSize = 50;

  // Fetch debtors with current filters
  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    try {
      const filterParams = {
        searchTerm: searchTerm || undefined,
        riskLevel: filters.riskLevel as 'low' | 'medium' | 'high' | undefined,
        accountType: filters.accountType || undefined,
        minBalance: filters.minBalance ? parseFloat(filters.minBalance) : undefined,
        maxBalance: filters.maxBalance ? parseFloat(filters.maxBalance) : undefined,
      };

      const { debtors, totalCount, error } = await getAllDebtors(
        currentPage, 
        pageSize, 
        filterParams
      );
      
      if (error) {
        setError(error);
        setDebtors([]);
      } else {
        setDebtors(debtors);
        setTotalCount(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load debtors");
      setDebtors([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const { stats, error } = await getDebtorStats();
      if (error) {
        console.error("Failed to load stats:", error);
      } else {
        setStats(stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle search
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchDebtors();
  }, [fetchDebtors]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    // Convert "all" values back to empty strings for the API
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({
      riskLevel: "",
      accountType: "",
      minBalance: "",
      maxBalance: ""
    });
    setCurrentPage(1);
  }, []);

  // Handle selection
  const toggleSelection = useCallback((debtorId: string) => {
    setSelectedDebtors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(debtorId)) {
        newSet.delete(debtorId);
      } else {
        newSet.add(debtorId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedDebtors.size === debtors.length) {
      setSelectedDebtors(new Set());
    } else {
      setSelectedDebtors(new Set(debtors.map(d => d.id)));
    }
  }, [debtors, selectedDebtors.size]);

  // Handle bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (selectedDebtors.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDebtors.size} debtors? This action cannot be undone.`)) {
      return;
    }

    try {
      const { success, error } = await bulkDeleteDebtors(Array.from(selectedDebtors));
      if (success) {
        toast.success(`Successfully deleted ${selectedDebtors.size} debtors`);
        setSelectedDebtors(new Set());
        fetchDebtors();
        fetchStats();
      } else {
        toast.error(`Failed to delete debtors: ${error}`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  }, [selectedDebtors, fetchDebtors, fetchStats]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const filterParams = {
        searchTerm: searchTerm || undefined,
        riskLevel: filters.riskLevel as 'low' | 'medium' | 'high' | undefined,
        accountType: filters.accountType || undefined,
        minBalance: filters.minBalance ? parseFloat(filters.minBalance) : undefined,
        maxBalance: filters.maxBalance ? parseFloat(filters.maxBalance) : undefined,
      };

      const { csv, error } = await exportDebtors(filterParams);
      if (error) {
        toast.error(`Export failed: ${error}`);
        return;
      }

      // Download CSV file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `debtors-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
    } catch (err: any) {
      toast.error(`Export error: ${err.message}`);
    }
  }, [searchTerm, filters]);

  // Get risk badge variant
  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading && debtors.length === 0) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading debtors...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none py-6 space-y-6 px-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin - Debtors Management</h1>
          <p className="text-muted-foreground">
            Comprehensive debtor management with advanced admin controls
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Statistics cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-indigo-500 border-t-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Debtors</p>
                  <h3 className="text-2xl font-bold">{stats.total.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-indigo-500/20 rounded-full">
                  <Users className="h-5 w-5 text-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-rose-500 border-t-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                  <h3 className="text-2xl font-bold">{stats.highRisk.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-rose-500/20 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-green-500 border-t-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</h3>
                </div>
                <div className="p-2 bg-green-500/20 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-amber-500 border-t-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recently Added</p>
                  <h3 className="text-2xl font-bold">{stats.recentlyAdded.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-amber-500/20 rounded-full">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Search and filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Debtors</CardTitle>
          <CardDescription>
            Use advanced filters to find specific debtors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, account number, email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.riskLevel || undefined} onValueChange={(value) => handleFilterChange('riskLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.accountType || undefined} onValueChange={(value) => handleFilterChange('accountType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="BUSINESS MLM">Business</SelectItem>
                <SelectItem value="GOVERNMENT">Government</SelectItem>
                <SelectItem value="ESTATE LATE">Estate</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="Min Balance"
              value={filters.minBalance}
              onChange={(e) => handleFilterChange('minBalance', e.target.value)}
            />
            
            <Input
              type="number"
              placeholder="Max Balance"
              value={filters.maxBalance}
              onChange={(e) => handleFilterChange('maxBalance', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedDebtors.size > 0 && (
        <Card className="border-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedDebtors.size} debtor(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Debtors ({totalCount.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : debtors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No debtors found matching your criteria.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDebtors.size === debtors.length && debtors.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtors.map((debtor) => (
                    <TableRow key={debtor.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDebtors.has(debtor.id)}
                          onCheckedChange={() => toggleSelection(debtor.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{debtor.acc_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(debtor.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {debtor.name} {debtor.surname_company_trust}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {debtor.initials}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {debtor.email_addr_1 && (
                            <div>{debtor.email_addr_1}</div>
                          )}
                          {debtor.cell_number && (
                            <div>{debtor.cell_number}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(debtor.outstanding_balance || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(debtor.risk_level)}>
                          {debtor.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {debtor.account_type_description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/customers/${debtor.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
