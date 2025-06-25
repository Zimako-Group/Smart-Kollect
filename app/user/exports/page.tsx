"use client";

import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, FileSpreadsheet, FileText, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Mock data for recent exports
const recentExports = [
  { id: 1, name: "Monthly Collections Report", type: "Excel", date: "2025-03-08", status: "completed" },
  { id: 2, name: "Overdue Accounts", type: "CSV", date: "2025-03-07", status: "completed" },
  { id: 3, name: "Payment Plans Summary", type: "PDF", date: "2025-03-05", status: "completed" },
  { id: 4, name: "Client Communication Log", type: "Excel", date: "2025-03-01", status: "completed" },
  { id: 5, name: "Settlement Offers", type: "CSV", date: "2025-02-28", status: "completed" },
];

// Available export templates
const exportTemplates = [
  { id: 1, name: "Collections Summary", description: "Summary of all collection activities", icon: <FileSpreadsheet className="h-8 w-8 text-blue-500" /> },
  { id: 2, name: "Accounts Aging Report", description: "Breakdown of accounts by age of debt", icon: <FileSpreadsheet className="h-8 w-8 text-green-500" /> },
  { id: 3, name: "Payment Plans", description: "Active payment plans and their status", icon: <FileSpreadsheet className="h-8 w-8 text-purple-500" /> },
  { id: 4, name: "Settlement Offers", description: "All settlement offers and their status", icon: <FileText className="h-8 w-8 text-orange-500" /> },
  { id: 5, name: "Client Communications", description: "Log of all client communications", icon: <FileText className="h-8 w-8 text-red-500" /> },
  { id: 6, name: "Performance Report", description: "Agent performance metrics", icon: <FileSpreadsheet className="h-8 w-8 text-indigo-500" /> },
];

export default function ExportsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [exportFormat, setExportFormat] = useState("excel");
  const [activeTab, setActiveTab] = useState("templates");

  const handleExport = (templateId: number) => {
    // In a real application, this would trigger the export process
    console.log(`Exporting template ${templateId} in ${exportFormat} format`);
    // You would typically call an API endpoint here
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exports</h1>
          <p className="text-muted-foreground">
            Export collection data and reports for your assigned accounts
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Export Templates</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Configure your export settings
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium mb-1">Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium mb-1">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium mb-1">Additional Filters</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Account Status</DropdownMenuItem>
                    <DropdownMenuItem>Payment Status</DropdownMenuItem>
                    <DropdownMenuItem>Debt Age</DropdownMenuItem>
                    <DropdownMenuItem>Amount Range</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0">{template.icon}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full mt-2" 
                    onClick={() => handleExport(template.id)}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exports</CardTitle>
              <CardDescription>
                History of your recent export activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExports.map((export_) => (
                    <TableRow key={export_.id}>
                      <TableCell className="font-medium">{export_.name}</TableCell>
                      <TableCell>{export_.type}</TableCell>
                      <TableCell>{export_.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {export_.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Exports are generated based on your assigned accounts only.
        </p>
        <p className="text-sm text-muted-foreground">
          Last updated: {format(new Date(), "PPP")}
        </p>
      </div>
    </div>
  );
}