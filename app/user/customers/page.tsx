"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Customer, getAllCustomers, searchCustomers, getCustomersByStatus, getAccountsWithOldPayments, getTotalOutstandingForOldPayments, formatCurrency, getCustomersByAccountType } from "@/lib/customer-service";
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { 
  Table, 
  TableBody, 
  TableCaption, 
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
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Phone, Mail, Eye, Filter, Users, AlertTriangle, CreditCard, CheckCircle, Banknote, Home, Building, Landmark, Hotel } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [chartAccountType, setChartAccountType] = useState<string | null>(null);
  const [riskDistribution, setRiskDistribution] = useState<{high: number, medium: number, low: number}>({high: 0, medium: 0, low: 0});
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    overdue: 0,
    active: 0,
    overduePayments: 0,
    totalOutstandingOverdue: 0
  });
  
  // Use a ref to store the overdue payments count to avoid dependency cycles
  const overduePaymentsRef = useRef(0);
  const totalOutstandingRef = useRef(0);
  
  const pageSize = 100; // Show 100 customers per page
  
  // Function to handle search - defined early to avoid reference errors
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setIsSearching(false);
      setActiveFilter(null);
      // We'll call fetchCustomers later after it's defined
      return;
    }
    
    setIsSearching(true);
    setActiveFilter(null);
    setLoading(true);
    
    try {
      // Use the updated searchCustomers function with pagination
      const { customers, totalCount, error } = await searchCustomers(searchTerm, currentPage, pageSize);
      
      if (error) {
        setError(error);
        setCustomers([]);
      } else {
        setCustomers(customers);
        setTotalCustomers(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while searching");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, pageSize]);
  
  // Function to filter customers by status - defined early to avoid reference errors
  const handleFilterByStatus = useCallback((status: string, resetPage: boolean = true) => {
    setLoading(true);
    setIsSearching(true);
    setActiveFilter(status);
    
    if (resetPage) {
      setCurrentPage(1);
    }
    
    // Use the updated getCustomersByStatus function with pagination
    getCustomersByStatus(status, currentPage, pageSize).then(({ customers, totalCount, error }) => {
      if (error) {
        setError(error);
        setCustomers([]);
      } else {
        setCustomers(customers);
        setTotalCustomers(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
      }
      setLoading(false);
    }).catch(err => {
      setError(err.message || "An error occurred while filtering by status");
      setLoading(false);
    });
  }, [currentPage, pageSize]);
  
  // Function to filter customers by account type
  const handleFilterByAccountType = useCallback((accountType: string, resetPage: boolean = true) => {
    setLoading(true);
    setIsSearching(true);
    setActiveFilter(`account-type-${accountType}`);
    
    // Set the account type for the chart (if it's one we want to show a chart for)
    if (accountType === "RESIDENTIAL" || accountType === "BUSINESS MLM") {
      setChartAccountType(accountType);
    } else {
      setChartAccountType(null);
    }
    
    if (resetPage) {
      setCurrentPage(1);
    }
    
    // Use the getCustomersByAccountType function with pagination
    getCustomersByAccountType(accountType, currentPage, pageSize).then(({ customers, totalCount, error }) => {
      if (error) {
        setError(error);
        setCustomers([]);
      } else {
        setCustomers(customers);
        setTotalCustomers(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
        
        // Calculate risk distribution for the filtered customers
        if (accountType === "RESIDENTIAL" || accountType === "BUSINESS MLM") {
          const highRisk = customers.filter(c => c.risk_level === 'high').length;
          const mediumRisk = customers.filter(c => c.risk_level === 'medium').length;
          const lowRisk = customers.filter(c => c.risk_level === 'low').length;
          
          setRiskDistribution({
            high: highRisk,
            medium: mediumRisk,
            low: lowRisk
          });
        }
      }
      setLoading(false);
    }).catch(err => {
      setError(err.message || `An error occurred while filtering by account type ${accountType}`);
      setLoading(false);
    });
  }, [currentPage, pageSize]);
  
  // Function to fetch customers - using useCallback to memoize the function
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Use the updated getAllCustomers function with pagination
      const { customers, totalCount, error } = await getAllCustomers(currentPage, pageSize);
      
      if (error) {
        setError(error);
        setCustomers([]);
      } else {
        setCustomers(customers);
        setTotalCustomers(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
        
        // If this is the first page, calculate customer statistics
        if (currentPage === 1 && !isSearching && !activeFilter) {
          // We need to make a separate call to get all customers for statistics
          // This is not ideal but necessary for accurate stats
          const statsQuery = await getAllCustomers(1, totalCount > 1000 ? 1000 : totalCount);
          
          if (!statsQuery.error) {
            const allCustomersForStats = statsQuery.customers;
            
            // Calculate customer statistics based on the sample
            const stats = {
              total: totalCount,
              highRisk: allCustomersForStats.filter(c => c.risk_level === 'high').length,
              mediumRisk: allCustomersForStats.filter(c => c.risk_level === 'medium').length,
              lowRisk: allCustomersForStats.filter(c => c.risk_level === 'low').length,
              overdue: allCustomersForStats.filter(c => 
                c.account_status_description?.toLowerCase().includes('overdue')
              ).length,
              active: allCustomersForStats.filter(c => 
                c.account_status_description?.toLowerCase().includes('active') ||
                !c.account_status_description
              ).length,
              overduePayments: overduePaymentsRef.current, // Use the ref value instead of state
              totalOutstandingOverdue: totalOutstandingRef.current // Preserve the total outstanding value
            };
            
            // If we're using a sample, extrapolate the stats
            if (totalCount > 1000) {
              const ratio = totalCount / 1000;
              stats.highRisk = Math.round(stats.highRisk * ratio);
              stats.mediumRisk = Math.round(stats.mediumRisk * ratio);
              stats.lowRisk = Math.round(stats.lowRisk * ratio);
              stats.overdue = Math.round(stats.overdue * ratio);
              stats.active = Math.round(stats.active * ratio);
            }
            
            setCustomerStats(stats);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, isSearching, activeFilter]);
  
  // Update handleSearch to use fetchCustomers now that it's defined
  const handleSearchWithFetch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setIsSearching(false);
      setActiveFilter(null);
      fetchCustomers();
      return;
    }
    
    await handleSearch();
  }, [searchTerm, handleSearch, fetchCustomers]);
  
  // Function to filter customers by risk level
  const filterByRiskLevel = useCallback((riskLevel: 'high' | 'medium' | 'low') => {
    setLoading(true);
    setIsSearching(true);
    setActiveFilter(`risk_${riskLevel}`);
    setCurrentPage(1);
    
    // For risk level filtering, we need to fetch all customers and filter client-side
    // because Supabase doesn't have a direct column for risk_level
    getAllCustomers(1, 1000).then(({ customers, totalCount }) => {
      const filtered = customers.filter(customer => customer.risk_level === riskLevel);
      
      // Estimate total count based on the ratio in our sample
      const estimatedTotal = Math.round((filtered.length / customers.length) * totalCount);
      
      setCustomers(filtered.slice(0, pageSize));
      setTotalCustomers(estimatedTotal);
      setTotalPages(Math.ceil(estimatedTotal / pageSize));
      setLoading(false);
    }).catch(err => {
      setError(err.message || "An error occurred while filtering by risk level");
      setLoading(false);
    });
  }, [pageSize]);

  // Function to filter by overdue status
  const filterByOverdue = useCallback(() => {
    setLoading(true);
    setIsSearching(true);
    setActiveFilter('overdue');
    setCurrentPage(1);
    
    handleFilterByStatus('delinquent', false);
  }, [handleFilterByStatus]);
  
  // Separate useEffect for fetching overdue payment accounts and total outstanding
  useEffect(() => {
    const fetchOverdueData = async () => {
      try {
        // Fetch both data points in parallel for better performance
        const [overdueResult, outstandingResult] = await Promise.all([
          getAccountsWithOldPayments(60, 1, 1),
          getTotalOutstandingForOldPayments(60)
        ]);
        
        // Update refs and state atomically to avoid race conditions
        overduePaymentsRef.current = overdueResult.totalCount;
        totalOutstandingRef.current = outstandingResult.totalOutstanding;
        
        setCustomerStats(prev => ({
          ...prev,
          overduePayments: overdueResult.totalCount,
          totalOutstandingOverdue: outstandingResult.totalOutstanding
        }));
      } catch (error) {
        console.error("Error fetching overdue data:", error);
      }
    };

    fetchOverdueData();
  }, []); // Run only once on component mount
  
  // Load customers on initial render and when page changes
  useEffect(() => {
    if (isSearching && searchTerm) {
      handleSearch();
    } else if (activeFilter) {
      if (activeFilter === 'overdue') {
        filterByOverdue();
      } else if (activeFilter.startsWith('risk_')) {
        const riskLevel = activeFilter.split('_')[1];
        filterByRiskLevel(riskLevel as 'high' | 'medium' | 'low');
      } else {
        handleFilterByStatus(activeFilter, false);
      }
    } else {
      fetchCustomers();
    }
  }, [fetchCustomers, currentPage, isSearching, searchTerm, activeFilter, handleSearch, handleFilterByStatus, filterByOverdue, filterByRiskLevel]);
  
  // Function to handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // The useEffect will trigger fetchCustomers or handleSearch based on isSearching
  }, []);
  
  // Function to clear search and reset to all customers
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setIsSearching(false);
    setActiveFilter(null);
    setCurrentPage(1);
    fetchCustomers();
  }, [fetchCustomers]);
  
  // Helper function to determine badge variant for risk level
  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline'; // Using outline with custom styling
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  
  // Helper function to determine badge variant for account status
  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'outline';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('overdue')) return 'destructive';
    if (statusLower.includes('legal')) return 'outline'; // Using outline with custom styling
    return 'outline';
  };
  
  return (
    <div className="w-full max-w-none py-6 space-y-6 px-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage and view all your customer accounts
          </p>
        </div>
      </div>
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers Card */}
        <Card className="bg-slate-800 border-indigo-500 border-t-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <h3 className="text-2xl font-bold">{customerStats.total}</h3>
              </div>
              <div className="p-2 bg-indigo-500/20 rounded-full">
                <Users className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="flex-1 flex items-center gap-2">
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20">
                  All Accounts
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                onClick={() => clearSearch()}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* High Risk Customers Card */}
        <Card className="bg-slate-800 border-rose-500 border-t-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <h3 className="text-2xl font-bold">{customerStats.highRisk}</h3>
              </div>
              <div className="p-2 bg-rose-500/20 rounded-full">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="flex-1 flex items-center gap-2">
                <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/50">
                  {((customerStats.highRisk / customerStats.total) * 100).toFixed(1)}% of Total
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                onClick={() => filterByRiskLevel('high')}
              >
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Overdue Accounts Card */}
        <Card className="bg-slate-800 border-amber-500 border-t-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Accounts</p>
                <h3 className="text-2xl font-bold">{customerStats.overduePayments}</h3>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-full">
                <CreditCard className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="flex-1 flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                  {((customerStats.overduePayments / customerStats.total) * 100).toFixed(1)}% of Total
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                onClick={() => filterByOverdue()}
              >
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Outstanding > 60 Days Card */}
        <Card className="bg-slate-800 border-green-500 border-t-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Outstanding &gt; 60 Days</p>
                <h3 className="text-2xl font-bold">{formatCurrency(customerStats.totalOutstandingOverdue || 0)}</h3>
              </div>
              <div className="p-2 bg-green-500/20 rounded-full">
                <Banknote className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="flex-1 flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-400 hover:bg-green-500/20">
                  {customerStats.overduePayments} Accounts
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                onClick={() => filterByOverdue()}
              >
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and filter section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
          <CardDescription>
            Search by name, email, phone number, ID number, or account number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchWithFetch()}
              />
            </div>
            <Button onClick={handleSearchWithFetch} disabled={loading}>
              {loading && isSearching ? "Searching..." : "Search"}
            </Button>
            {(isSearching || activeFilter) && (
              <Button variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </div>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={activeFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveFilter(null);
                setIsSearching(false);
                setCurrentPage(1);
                fetchCustomers();
              }}
              className="flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              All
            </Button>
            <Button
              variant={activeFilter === "risk_high" ? "default" : "outline"}
              size="sm"
              onClick={() => filterByRiskLevel("high")}
              className="flex items-center gap-1 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-600"
            >
              <AlertTriangle className="h-4 w-4" />
              High Risk
            </Button>
            <Button
              variant={activeFilter === "risk_medium" ? "default" : "outline"}
              size="sm"
              onClick={() => filterByRiskLevel("medium")}
              className="flex items-center gap-1 bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20 hover:text-orange-600"
            >
              <AlertTriangle className="h-4 w-4" />
              Medium Risk
            </Button>
            <Button
              variant={activeFilter === "risk_low" ? "default" : "outline"}
              size="sm"
              onClick={() => filterByRiskLevel("low")}
              className="flex items-center gap-1 bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 hover:text-green-600"
            >
              <CheckCircle className="h-4 w-4" />
              Low Risk
            </Button>
            {/* Overdue and Active filter buttons removed as requested */}
            
            {/* Account Type Filter Divider */}
            <div className="w-full mt-2 mb-1">
              <div className="flex items-center">
                <div className="h-px flex-1 bg-gray-700/30"></div>
                <span className="px-2 text-xs text-gray-400">Account Types</span>
                <div className="h-px flex-1 bg-gray-700/30"></div>
              </div>
            </div>
            
            {/* Account Type Filter Buttons */}
            <Button
              variant={activeFilter === "account-type-RESIDENTIAL" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterByAccountType("RESIDENTIAL")}
              className="flex items-center gap-1 bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-600"
            >
              <Home className="h-4 w-4" />
              Residential
            </Button>
            <Button
              variant={activeFilter === "account-type-BUSINESS MLM" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterByAccountType("BUSINESS MLM")}
              className="flex items-center gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-600"
            >
              <Building className="h-4 w-4" />
              Business
            </Button>
            {/* Government and Estate Late filter buttons removed as requested */}
          </div>
        </CardContent>
      </Card>
      
      {/* Risk Distribution Chart for Residential or Business Accounts */}
      {chartAccountType && (
        <Card className="mb-4 border-0 shadow-xl overflow-hidden bg-transparent backdrop-filter backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-lg border-b border-slate-700">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              {chartAccountType === "RESIDENTIAL" ? 
                <><Home className="h-5 w-5 text-purple-400" /> Residential</> : 
                <><Building className="h-5 w-5 text-blue-400" /> Business</>} Accounts Risk Distribution
            </CardTitle>
            <CardDescription className="text-slate-300">
              Breakdown of risk levels among {chartAccountType === "RESIDENTIAL" ? "residential" : "business"} accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-b-lg p-6 border border-slate-700/30">
            <div className="flex flex-col md:flex-row w-full items-center md:items-start justify-between gap-8">
              {/* Chart area */}
              <div className="w-full md:w-2/3">
                {typeof window !== 'undefined' && (
                  <Chart
                    type="donut"
                    height={350}
                    options={{
                      chart: {
                        dropShadow: {
                          enabled: true,
                          top: 0,
                          left: 0,
                          blur: 10,
                          opacity: 0.3,
                          color: '#000000'
                        },
                        animations: {
                          enabled: true,
                          speed: 800,
                          animateGradually: {
                            enabled: true,
                            delay: 150
                          },
                          dynamicAnimation: {
                            enabled: true,
                            speed: 350
                          }
                        },
                        background: 'transparent',
                        foreColor: '#a3a3a3'
                      },
                      labels: ['High Risk', 'Medium Risk', 'Low Risk'],
                      colors: ['#ef4444', '#f59e0b', '#10b981'],
                      fill: {
                        type: 'gradient',
                        gradient: {
                          shade: 'dark',
                          type: 'vertical',
                          shadeIntensity: 0.5,
                          gradientToColors: ['#ff0000', '#ff9800', '#00b37e'],
                          inverseColors: false,
                          opacityFrom: 1,
                          opacityTo: 1,
                          stops: [0, 100]
                        }
                      },
                      legend: {
                        show: false
                      },
                      stroke: {
                        width: 2,
                        colors: ['#111827']
                      },
                      responsive: [{
                        breakpoint: 480,
                        options: {
                          chart: {
                            width: 300
                          },
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }],
                      tooltip: {
                        theme: 'dark',
                        style: {
                          fontSize: '14px',
                          fontFamily: 'Inter, sans-serif'
                        },
                        y: {
                          formatter: function(value) {
                            return value + ' accounts';
                          },
                          title: {
                            formatter: function (seriesName) {
                              return seriesName + ':';
                            }
                          }
                        }
                      },
                      dataLabels: {
                        enabled: true,
                        formatter: function(val, opts) {
                          const total = riskDistribution.high + riskDistribution.medium + riskDistribution.low;
                          return total > 0 ? Math.round(Number(val)) + '%' : '0%';
                        },
                        style: {
                          fontSize: '16px',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          colors: ['#f8fafc']
                        },
                        dropShadow: {
                          enabled: true,
                          top: 1,
                          left: 1,
                          blur: 1,
                          color: '#000',
                          opacity: 0.45
                        }
                      },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '60%',
                            background: 'transparent',
                            labels: {
                              show: true,
                              name: {
                                show: true,
                                fontSize: '22px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                color: '#f8fafc',
                                offsetY: -10
                              },
                              value: {
                                show: true,
                                fontSize: '28px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 700,
                                color: '#f8fafc',
                                offsetY: 5,
                                formatter: function (val) {
                                  return val;
                                }
                              },
                              total: {
                                show: true,
                                showAlways: true,
                                label: 'Total Accounts',
                                fontSize: '16px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                color: '#f8fafc',
                                formatter: function() {
                                  return (riskDistribution.high + riskDistribution.medium + riskDistribution.low).toString();
                                }
                              }
                            }
                          },
                          expandOnClick: true
                        }
                      },
                      states: {
                        hover: {
                          filter: {
                            type: 'darken'
                          }
                        },
                        active: {
                          filter: {
                            type: 'none'
                          }
                        }
                      }
                    }}
                    series={[riskDistribution.high, riskDistribution.medium, riskDistribution.low]}
                  />
                )}
              </div>
              
              {/* Risk indicator dots */}
              <div className="w-full md:w-1/3 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 backdrop-blur-md shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20"></div>
                      <span className="text-white">High Risk</span>
                    </div>
                    <span className="text-white font-medium">{riskDistribution.high}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-md shadow-amber-500/20"></div>
                      <span className="text-white">Medium Risk</span>
                    </div>
                    <span className="text-white font-medium">{riskDistribution.medium}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-md shadow-green-500/20"></div>
                      <span className="text-white">Low Risk</span>
                    </div>
                    <span className="text-white font-medium">{riskDistribution.low}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-white font-bold">{riskDistribution.high + riskDistribution.medium + riskDistribution.low}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Customers table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Accounts</CardTitle>
          <CardDescription>
            {loading ? (
              "Loading customers..."
            ) : (
              <>
                Showing {customers.length} of {totalCustomers.toLocaleString()} customers
                {isSearching ? " matching your search" : ""}
                {activeFilter ? " matching your filter" : ""}
                {!isSearching && !activeFilter ? ` (Page ${currentPage} of ${totalPages})` : ""}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading customers...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p>No customers found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account #</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Outstanding Balance</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.acc_number}</TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.surname_company_trust}, {customer.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {customer.id_number_1}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {customer.cell_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span className="text-sm">{customer.cell_number}</span>
                            </div>
                          )}
                          {customer.email_addr_1 && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="text-sm">{customer.email_addr_1}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.outstanding_balance ? (
                          <div className="font-medium">
                            R {customer.outstanding_balance.toLocaleString('en-ZA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRiskBadgeVariant(customer.risk_level)}
                          className={
                            customer.risk_level === 'medium' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/50' 
                              : ''
                          }
                        >
                          {customer.risk_level.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(customer.account_status_description)}
                          className={
                            customer.account_status_description?.toLowerCase().includes('legal')
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/50'
                              : ''
                          }
                        >
                          {customer.account_status_description || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/user/customers/${customer.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {!loading && !error && customers.length > 0 && totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {/* First page */}
                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis if needed */}
                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Previous page if not on first page */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Current page */}
                  <PaginationItem>
                    <PaginationLink isActive onClick={() => handlePageChange(currentPage)}>
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                  
                  {/* Next page if not on last page */}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis if needed */}
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}