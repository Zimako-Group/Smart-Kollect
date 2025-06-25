"use client";

import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  Copy,
  Edit,
  Filter,
  Layers,
  MoreHorizontal,
  PieChart,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  Users,
} from "lucide-react";

// Types
type Segment = {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  debtorCount: number;
  totalDebt: number;
  averageDebt: number;
  createdAt: string;
  lastModified: string;
  createdBy: string;
  isActive: boolean;
  tags: string[];
};

type SegmentCriteria = {
  id: string;
  field: string;
  operator: string;
  value: string | number;
};

type CriteriaField = {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
};

// Mock data
const criteriaFields: CriteriaField[] = [
  { id: "debtAmount", name: "Debt Amount", type: "number" },
  { id: "debtAge", name: "Debt Age (Days)", type: "number" },
  { id: "lastPaymentDate", name: "Last Payment Date", type: "date" },
  { id: "paymentsMade", name: "Payments Made", type: "number" },
  { id: "contactAttempts", name: "Contact Attempts", type: "number" },
  { id: "contactSuccess", name: "Contact Success", type: "number" },
  { id: "promisesMade", name: "Promises Made", type: "number" },
  { id: "promisesKept", name: "Promises Kept", type: "number" },
  {
    id: "debtType",
    name: "Debt Type",
    type: "select",
    options: ["Credit Card", "Personal Loan", "Medical", "Utility", "Other"],
  },
  {
    id: "riskScore",
    name: "Risk Score",
    type: "select",
    options: ["High", "Medium", "Low"],
  },
  {
    id: "collectionStage",
    name: "Collection Stage",
    type: "select",
    options: ["Early", "Mid", "Late", "Legal"],
  },
  {
    id: "location",
    name: "Location",
    type: "select",
    options: ["Urban", "Suburban", "Rural"],
  },
];

const segments: Segment[] = [
  {
    id: "seg-001",
    name: "High Value Debtors",
    description: "Debtors with outstanding balances over $10,000",
    criteria: [
      {
        id: "crit-001",
        field: "debtAmount",
        operator: ">",
        value: 10000,
      },
    ],
    debtorCount: 342,
    totalDebt: 5840000,
    averageDebt: 17076,
    createdAt: "2025-01-15",
    lastModified: "2025-02-28",
    createdBy: "Sarah Johnson",
    isActive: true,
    tags: ["high-value", "priority"],
  },
  {
    id: "seg-002",
    name: "Recent Payers",
    description: "Debtors who made a payment in the last 30 days",
    criteria: [
      {
        id: "crit-002",
        field: "lastPaymentDate",
        operator: ">",
        value: "2025-02-09",
      },
    ],
    debtorCount: 876,
    totalDebt: 2340000,
    averageDebt: 2671,
    createdAt: "2025-01-20",
    lastModified: "2025-02-10",
    createdBy: "Michael Chen",
    isActive: true,
    tags: ["active", "engaged"],
  },
  {
    id: "seg-003",
    name: "Promise Breakers",
    description: "Debtors who made promises but didn't keep them",
    criteria: [
      {
        id: "crit-003",
        field: "promisesMade",
        operator: ">",
        value: 0,
      },
      {
        id: "crit-004",
        field: "promisesKept",
        operator: "=",
        value: 0,
      },
    ],
    debtorCount: 523,
    totalDebt: 1870000,
    averageDebt: 3575,
    createdAt: "2025-02-01",
    lastModified: "2025-03-01",
    createdBy: "James Wilson",
    isActive: true,
    tags: ["high-risk", "follow-up"],
  },
  {
    id: "seg-004",
    name: "No Contact",
    description: "Debtors who haven't been successfully contacted",
    criteria: [
      {
        id: "crit-005",
        field: "contactAttempts",
        operator: ">",
        value: 3,
      },
      {
        id: "crit-006",
        field: "contactSuccess",
        operator: "=",
        value: 0,
      },
    ],
    debtorCount: 689,
    totalDebt: 2150000,
    averageDebt: 3120,
    createdAt: "2025-02-05",
    lastModified: "2025-03-05",
    createdBy: "Emily Rodriguez",
    isActive: true,
    tags: ["hard-to-reach", "skip-trace"],
  },
  {
    id: "seg-005",
    name: "Medical Debt - High Risk",
    description: "Medical debtors with high risk scores",
    criteria: [
      {
        id: "crit-007",
        field: "debtType",
        operator: "=",
        value: "Medical",
      },
      {
        id: "crit-008",
        field: "riskScore",
        operator: "=",
        value: "High",
      },
    ],
    debtorCount: 217,
    totalDebt: 980000,
    averageDebt: 4516,
    createdAt: "2025-02-10",
    lastModified: "2025-02-10",
    createdBy: "David Thompson",
    isActive: true,
    tags: ["medical", "high-risk"],
  },
  {
    id: "seg-006",
    name: "Legal Stage - Urban",
    description: "Urban debtors in legal collection stage",
    criteria: [
      {
        id: "crit-009",
        field: "collectionStage",
        operator: "=",
        value: "Legal",
      },
      {
        id: "crit-010",
        field: "location",
        operator: "=",
        value: "Urban",
      },
    ],
    debtorCount: 156,
    totalDebt: 1240000,
    averageDebt: 7949,
    createdAt: "2025-02-15",
    lastModified: "2025-03-01",
    createdBy: "Lisa Martinez",
    isActive: true,
    tags: ["legal", "urban"],
  },
  {
    id: "seg-007",
    name: "Aging Debt (90+ Days)",
    description: "Debts older than 90 days with no recent payment",
    criteria: [
      {
        id: "crit-011",
        field: "debtAge",
        operator: ">",
        value: 90,
      },
      {
        id: "crit-012",
        field: "lastPaymentDate",
        operator: "<",
        value: "2025-01-09",
      },
    ],
    debtorCount: 892,
    totalDebt: 3120000,
    averageDebt: 3498,
    createdAt: "2025-01-25",
    lastModified: "2025-02-25",
    createdBy: "Robert Jackson",
    isActive: true,
    tags: ["aging", "priority"],
  },
  {
    id: "seg-008",
    name: "Small Balances",
    description: "Debtors with balances under $500",
    criteria: [
      {
        id: "crit-013",
        field: "debtAmount",
        operator: "<",
        value: 500,
      },
    ],
    debtorCount: 1243,
    totalDebt: 435000,
    averageDebt: 350,
    createdAt: "2025-02-20",
    lastModified: "2025-02-20",
    createdBy: "Jennifer Kim",
    isActive: false,
    tags: ["low-value", "bulk-processing"],
  },
];

export default function SegmentsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSegment, setNewSegment] = useState<{
    name: string;
    description: string;
    criteria: SegmentCriteria[];
  }>({
    name: "",
    description: "",
    criteria: [
      {
        id: `crit-${Math.random().toString(36).substr(2, 9)}`,
        field: "",
        operator: "",
        value: "",
      },
    ],
  });

  // Filter segments based on search and active tab
  const filteredSegments = segments.filter((segment) => {
    const matchesSearch =
      searchQuery === "" ||
      segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      segment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      segment.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && segment.isActive) ||
      (activeTab === "inactive" && !segment.isActive);

    return matchesSearch && matchesTab;
  });

  // Toggle segment selection
  const toggleSegmentSelection = (segmentId: string) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  // Select all segments
  const toggleSelectAll = () => {
    if (selectedSegments.length === filteredSegments.length) {
      setSelectedSegments([]);
    } else {
      setSelectedSegments(filteredSegments.map((segment) => segment.id));
    }
  };

  // Add criteria to new segment
  const addCriteria = () => {
    setNewSegment({
      ...newSegment,
      criteria: [
        ...newSegment.criteria,
        {
          id: `crit-${Math.random().toString(36).substr(2, 9)}`,
          field: "",
          operator: "",
          value: "",
        },
      ],
    });
  };

  // Remove criteria from new segment
  const removeCriteria = (criteriaId: string) => {
    if (newSegment.criteria.length > 1) {
      setNewSegment({
        ...newSegment,
        criteria: newSegment.criteria.filter(
          (criteria) => criteria.id !== criteriaId
        ),
      });
    }
  };

  // Update criteria field
  const updateCriteriaField = (
    criteriaId: string,
    field: "field" | "operator" | "value",
    value: string
  ) => {
    setNewSegment({
      ...newSegment,
      criteria: newSegment.criteria.map((criteria) =>
        criteria.id === criteriaId ? { ...criteria, [field]: value } : criteria
      ),
    });
  };

  // Get operator options based on field type
  const getOperatorOptions = (fieldId: string) => {
    const field = criteriaFields.find((f) => f.id === fieldId);
    if (!field) return [];

    switch (field.type) {
      case "number":
        return [
          { value: "=", label: "Equal to" },
          { value: ">", label: "Greater than" },
          { value: "<", label: "Less than" },
          { value: ">=", label: "Greater than or equal to" },
          { value: "<=", label: "Less than or equal to" },
          { value: "!=", label: "Not equal to" },
        ];
      case "date":
        return [
          { value: "=", label: "On" },
          { value: ">", label: "After" },
          { value: "<", label: "Before" },
          { value: ">=", label: "On or after" },
          { value: "<=", label: "On or before" },
        ];
      case "select":
        return [
          { value: "=", label: "Is" },
          { value: "!=", label: "Is not" },
        ];
      default:
        return [
          { value: "=", label: "Equal to" },
          { value: "!=", label: "Not equal to" },
          { value: "contains", label: "Contains" },
          { value: "starts", label: "Starts with" },
          { value: "ends", label: "Ends with" },
        ];
    }
  };

  // Format number as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Create new segment
  const createSegment = () => {
    // In a real app, this would send data to an API
    console.log("Creating new segment:", newSegment);
    setIsCreateDialogOpen(false);
    // Reset form
    setNewSegment({
      name: "",
      description: "",
      criteria: [
        {
          id: `crit-${Math.random().toString(36).substr(2, 9)}`,
          field: "",
          operator: "",
          value: "",
        },
      ],
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debtor Segments</h1>
          <p className="text-muted-foreground">
            Create and manage targeted debtor segments for collection strategies
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Segment</DialogTitle>
                <DialogDescription>
                  Define criteria to identify a specific group of debtors
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Segment Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., High Value Debtors"
                        value={newSegment.name}
                        onChange={(e) =>
                          setNewSegment({
                            ...newSegment,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Describe the purpose of this segment"
                        value={newSegment.description}
                        onChange={(e) =>
                          setNewSegment({
                            ...newSegment,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Segment Criteria</h3>
                      <Button variant="outline" size="sm" onClick={addCriteria}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Criteria
                      </Button>
                    </div>

                    {newSegment.criteria.map((criteria, index) => (
                      <div
                        key={criteria.id}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-4">
                          <Select
                            value={criteria.field}
                            onValueChange={(value) =>
                              updateCriteriaField(criteria.id, "field", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {criteriaFields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={criteria.operator}
                            onValueChange={(value) =>
                              updateCriteriaField(
                                criteria.id,
                                "operator",
                                value
                              )
                            }
                            disabled={!criteria.field}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Operator" />
                            </SelectTrigger>
                            <SelectContent>
                              {criteria.field &&
                                getOperatorOptions(criteria.field).map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          {criteria.field &&
                          criteriaFields.find((f) => f.id === criteria.field)
                            ?.type === "select" ? (
                            <Select
                              value={criteria.value.toString()}
                              onValueChange={(value) =>
                                updateCriteriaField(criteria.id, "value", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select value" />
                              </SelectTrigger>
                              <SelectContent>
                                {criteriaFields
                                  .find((f) => f.id === criteria.field)
                                  ?.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : criteria.field &&
                            criteriaFields.find((f) => f.id === criteria.field)
                              ?.type === "date" ? (
                            <Input
                              type="date"
                              value={criteria.value.toString()}
                              onChange={(e) =>
                                updateCriteriaField(
                                  criteria.id,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            <Input
                              type={
                                criteria.field &&
                                criteriaFields.find(
                                  (f) => f.id === criteria.field
                                )?.type === "number"
                                  ? "number"
                                  : "text"
                              }
                              placeholder="Value"
                              value={criteria.value.toString()}
                              onChange={(e) =>
                                updateCriteriaField(
                                  criteria.id,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCriteria(criteria.id)}
                            disabled={newSegment.criteria.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createSegment}
                  disabled={
                    !newSegment.name ||
                    newSegment.criteria.some(
                      (c) => !c.field || !c.operator || !c.value
                    )
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Segment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{segments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {segments.filter((s) => s.isActive).length} active segments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Debtors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {segments
                .reduce((acc, segment) => acc + segment.debtorCount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all segments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Debt Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(
                segments.reduce((acc, segment) => acc + segment.totalDebt, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all segments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(
                segments.reduce((acc, segment) => acc + segment.totalDebt, 0) /
                  segments.reduce(
                    (acc, segment) => acc + segment.debtorCount,
                    0
                  )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per debtor</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All Segments</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search segments..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Creation Date</DropdownMenuItem>
                    <DropdownMenuItem>Debt Value</DropdownMenuItem>
                    <DropdownMenuItem>Debtor Count</DropdownMenuItem>
                    <DropdownMenuItem>Tags</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="all" className="mt-4">
              <SegmentTable
                segments={filteredSegments}
                selectedSegments={selectedSegments}
                toggleSegmentSelection={toggleSegmentSelection}
                toggleSelectAll={toggleSelectAll}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
            <TabsContent value="active" className="mt-4">
              <SegmentTable
                segments={filteredSegments}
                selectedSegments={selectedSegments}
                toggleSegmentSelection={toggleSegmentSelection}
                toggleSelectAll={toggleSelectAll}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
            <TabsContent value="inactive" className="mt-4">
              <SegmentTable
                segments={filteredSegments}
                selectedSegments={selectedSegments}
                toggleSegmentSelection={toggleSegmentSelection}
                toggleSelectAll={toggleSelectAll}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Segment Table Component
function SegmentTable({
  segments,
  selectedSegments,
  toggleSegmentSelection,
  toggleSelectAll,
  formatCurrency,
}: {
  segments: Segment[];
  selectedSegments: string[];
  toggleSegmentSelection: (id: string) => void;
  toggleSelectAll: () => void;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    segments.length > 0 &&
                    selectedSegments.length === segments.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all segments"
                />
              </TableHead>
              <TableHead>Segment Name</TableHead>
              <TableHead>Debtors</TableHead>
              <TableHead>Total Debt</TableHead>
              <TableHead>Avg. Debt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Layers className="h-10 w-10 mb-2" />
                    <h3 className="font-medium text-lg">No segments found</h3>
                    <p>Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              segments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSegments.includes(segment.id)}
                      onCheckedChange={() => toggleSegmentSelection(segment.id)}
                      aria-label={`Select ${segment.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{segment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {segment.description}
                    </div>
                  </TableCell>
                  <TableCell>{segment.debtorCount.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(segment.totalDebt)}</TableCell>
                  <TableCell>{formatCurrency(segment.averageDebt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={segment.isActive ? "default" : "outline"}
                      className={
                        segment.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "text-slate-800"
                      }
                    >
                      {segment.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {segment.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          View Debtors
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Segment
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {segments.length > 0 && (
        <CardFooter className="flex justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {selectedSegments.length > 0
              ? `${selectedSegments.length} of ${segments.length} segments selected`
              : `${segments.length} segments`}
          </div>
          <div className="flex gap-2">
            {selectedSegments.length > 0 && (
              <>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Compare
                </Button>
                <Button variant="outline" size="sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Mark Inactive
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              <PieChart className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
