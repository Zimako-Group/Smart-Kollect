"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../../../types/supabase";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, Download, PieChart } from "lucide-react";
import * as XLSX from 'xlsx';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define the admin template type
type AdminTemplate = {
  id: string;
  account_number: string | null;
  date: string;
  query_type: string;
  description: string;
  status: string;
  escalated_department: string | null;
  agent_id: string;
  created_at: string;
  agent_name?: string;
};

export default function AdminTemplateListPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AdminTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [queryTypeFilter, setQueryTypeFilter] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<{[key: string]: number}>({});
  const [chartData, setChartData] = useState<any>(null);
  const supabase = createClientComponentClient<Database>();

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "escalated":
        return <Badge className="bg-red-500">Escalated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get query type display name
  const getQueryTypeDisplay = (queryType: string) => {
    switch (queryType) {
      case "billing":
        return "Billing";
      case "indigent":
        return "Indigent";
      case "account_holder_deceased":
        return "Account Holder Deceased";
      case "reconnection_of_services":
        return "Reconnection of Services";
      case "other":
        return "Other";
      default:
        return queryType;
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Format data for Excel
      const excelData = filteredTemplates.map(template => ({
        'Date': formatDate(template.date),
        'Account Number': template.account_number || '-',
        'Query Type': getQueryTypeDisplay(template.query_type),
        'Description': template.description,
        'Status': template.status.charAt(0).toUpperCase() + template.status.slice(1),
        'Escalated To': template.escalated_department
          ? template.escalated_department.charAt(0).toUpperCase() + template.escalated_department.slice(1)
          : '-',
        'Agent': template.agent_name
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Admin Templates');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Create Blob
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin_templates_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast('Admin templates exported to Excel', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast('Failed to export admin templates to Excel', {
        duration: 3000,
        style: { backgroundColor: '#f44336', color: 'white' }
      });
    }
  };

  // Fetch admin templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        // Get admin templates
        const { data, error } = await supabase
          .from("admin_templates")
          .select('*')
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        // Since we don't have access to the profiles table in our TypeScript types,
        // we'll just use the agent_id as the display name for now
        // This can be enhanced later when the profiles table is properly added to the database types
        
        // Format the data with agent IDs as names
        const formattedData = data.map((template: any) => ({
          ...template,
          agent_name: template.agent_id ? template.agent_id.substring(0, 8) + '...' : 'Unknown',
        }));

        setTemplates(formattedData);
        setFilteredTemplates(formattedData);
      } catch (error: any) {
        console.error("Error fetching admin templates:", error);
        toast(error.message || "Failed to load admin templates", {
          duration: 5000,
          style: { backgroundColor: '#f44336', color: 'white' }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [supabase]);

  // Apply filters
  useEffect(() => {
    let filtered = templates;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(
        (template) =>
          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.account_number && template.account_number.includes(searchTerm))
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all_statuses') {
      filtered = filtered.filter((template) => template.status === statusFilter);
    }

    // Apply query type filter
    if (queryTypeFilter && queryTypeFilter !== 'all_query_types') {
      filtered = filtered.filter((template) => template.query_type === queryTypeFilter);
    }

    setFilteredTemplates(filtered);
  }, [searchTerm, statusFilter, queryTypeFilter, templates]);
  
  // Calculate status counts and generate chart data
  useEffect(() => {
    // Count templates by status
    const counts: {[key: string]: number} = {
      pending: 0,
      resolved: 0,
      escalated: 0
    };
    
    templates.forEach(template => {
      if (counts[template.status] !== undefined) {
        counts[template.status]++;
      }
    });
    
    setStatusCounts(counts);
    
    // Generate chart data
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    setChartData({
      labels: ['Pending', 'Resolved', 'Escalated'],
      datasets: [
        {
          data: [counts.pending, counts.resolved, counts.escalated],
          backgroundColor: ['#facc15', '#22c55e', '#ef4444'],
          borderColor: ['#eab308', '#16a34a', '#dc2626'],
          borderWidth: 1,
        },
      ],
    });
  }, [templates]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Templates</h1>
        <div className="flex gap-3">
          <Button 
            onClick={exportToExcel} 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10"
            disabled={filteredTemplates.length === 0 || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Link href="/user/admin-template">
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Admin Template
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter admin templates by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by description or account number..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full md:w-[200px]">
                  <Select
                    value={statusFilter || "all_statuses"}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_statuses">All Statuses</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-[200px]">
                  <Select
                    value={queryTypeFilter || "all_query_types"}
                    onValueChange={(value) => setQueryTypeFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by query type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_query_types">All Query Types</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="indigent">Indigent</SelectItem>
                      <SelectItem value="account_holder_deceased">Account Holder Deceased</SelectItem>
                      <SelectItem value="reconnection_of_services">Reconnection of Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>
                Overview of admin issues by status
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <div className="relative w-full max-w-[200px]">
                  <Pie 
                    data={chartData} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 15
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw as number;
                              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '50%',
                    }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-medium">Total</p>
                      <p className="text-xl font-bold">{templates.length}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2 w-full mt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold text-yellow-500">{statusCounts.pending || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Resolved</p>
                  <p className="text-lg font-bold text-green-500">{statusCounts.resolved || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Escalated</p>
                  <p className="text-lg font-bold text-red-500">{statusCounts.escalated || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Templates</CardTitle>
          <CardDescription>
            View all registered admin issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No admin templates found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Query Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Escalated To</TableHead>
                    <TableHead>Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{formatDate(template.date)}</TableCell>
                      <TableCell>
                        {template.account_number || "-"}
                      </TableCell>
                      <TableCell>
                        {getQueryTypeDisplay(template.query_type)}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {template.description}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(template.status)}
                      </TableCell>
                      <TableCell>
                        {template.escalated_department
                          ? template.escalated_department.charAt(0).toUpperCase() +
                            template.escalated_department.slice(1)
                          : "-"}
                      </TableCell>
                      <TableCell>{template.agent_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
