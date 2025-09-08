"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Database,
  Filter,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Users,
  DollarSign,
  FileText,
  Plus,
  X,
  Save,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Percent,
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { DATA_SOURCES, ReportConfig, FilterCondition } from './report-builder-types';

interface CustomReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomReportBuilder({ isOpen, onClose }: CustomReportBuilderProps) {
  const [activeTab, setActiveTab] = useState('config');
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    dataSources: [],
    selectedFields: {},
    filters: [],
    groupBy: [],
    orderBy: [],
    joins: [],
    aggregations: [],
    visualization: { type: 'table' }
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [dataSourceStats, setDataSourceStats] = useState<Record<string, any>>({});

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            if (reportConfig.dataSources.length > 0 && !isGenerating) {
              generateReport();
            }
            break;
          case 's':
            event.preventDefault();
            if (reportConfig.name.trim() !== '') {
              saveReportTemplate();
            }
            break;
          case 'Escape':
            event.preventDefault();
            onClose();
            break;
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, reportConfig, isGenerating, onClose]);

  const addDataSource = (sourceKey: string) => {
    if (!reportConfig.dataSources.includes(sourceKey)) {
      setReportConfig(prev => ({
        ...prev,
        dataSources: [...prev.dataSources, sourceKey],
        selectedFields: {
          ...prev.selectedFields,
          [sourceKey]: []
        }
      }));
      
      // Fetch stats for this data source
      fetchDataSourceStats(sourceKey);
    }
  };

  const fetchDataSourceStats = async (sourceKey: string) => {
    try {
      const source = DATA_SOURCES[sourceKey as keyof typeof DATA_SOURCES];
      const { count, error } = await supabase
        .from(source.table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        setDataSourceStats(prev => ({
          ...prev,
          [sourceKey]: { recordCount: count || 0 }
        }));
      }
    } catch (error) {
      console.error(`Error fetching stats for ${sourceKey}:`, error);
    }
  };

  const removeDataSource = (sourceKey: string) => {
    setReportConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.filter(ds => ds !== sourceKey),
      selectedFields: Object.fromEntries(
        Object.entries(prev.selectedFields).filter(([key]) => key !== sourceKey)
      )
    }));
  };

  const toggleField = (sourceKey: string, fieldKey: string) => {
    setReportConfig(prev => ({
      ...prev,
      selectedFields: {
        ...prev.selectedFields,
        [sourceKey]: prev.selectedFields[sourceKey]?.includes(fieldKey)
          ? prev.selectedFields[sourceKey].filter(f => f !== fieldKey)
          : [...(prev.selectedFields[sourceKey] || []), fieldKey]
      }
    }));
  };

  const addFilter = () => {
    setReportConfig(prev => ({
      ...prev,
      filters: [
        ...prev.filters,
        { field: '', operator: 'equals', value: '' }
      ]
    }));
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) =>
        i === index ? { ...filter, ...updates } : filter
      )
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Validate configuration
      if (reportConfig.dataSources.length === 0) {
        toast.error('Please select at least one data source');
        return;
      }

      if (reportConfig.name.trim() === '') {
        toast.error('Please enter a report name');
        return;
      }

      // Check if any fields are selected
      const hasSelectedFields = Object.values(reportConfig.selectedFields).some(
        fields => fields && fields.length > 0
      );

      if (!hasSelectedFields) {
        toast.error('Please select at least one field to include in the report');
        return;
      }

      // Call the API to generate the report
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSources: reportConfig.dataSources,
          selectedFields: reportConfig.selectedFields,
          filters: reportConfig.filters,
          orderBy: reportConfig.orderBy,
          limit: reportConfig.limit,
          joins: reportConfig.joins,
          aggregations: reportConfig.aggregations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Report generation failed');
      }
      
      setReportData(result.data || []);
      setActiveTab('preview');
      setIsPreviewMode(true);
      
      toast.success(`Report generated successfully! ${result.count} records found.`);
      
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(`Error generating report: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };



  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (reportData.length === 0) {
      toast.error('No data to export. Please generate a report first.');
      return;
    }

    try {
      if (format === 'csv') {
        // Convert data to CSV
        const csvContent = convertToCSV(reportData);
        downloadFile(csvContent, `${reportConfig.name || 'custom-report'}.csv`, 'text/csv');
        toast.success('Report exported as CSV successfully!');
      } else {
        toast.info(`${format.toUpperCase()} export feature coming soon!`);
      }
    } catch (error: any) {
      toast.error(`Error exporting report: ${error.message}`);
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (value === null || value === undefined) return '';
        const stringValue = value.toString();
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const saveReportTemplate = async () => {
    if (reportConfig.name.trim() === '') {
      toast.error('Please enter a report name before saving');
      return;
    }

    try {
      // Save to localStorage for now (could be extended to save to database)
      const templates = JSON.parse(localStorage.getItem('customReportTemplates') || '[]');
      const newTemplate = {
        ...reportConfig,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        createdBy: 'current_user' // Replace with actual user ID
      };
      
      templates.push(newTemplate);
      localStorage.setItem('customReportTemplates', JSON.stringify(templates));
      
      toast.success('Report template saved successfully!');
    } catch (error: any) {
      toast.error(`Error saving template: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <Database className="h-5 w-5 text-blue-400" />
            Custom Report Builder
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create powerful custom reports from all your data sources with advanced filtering and visualization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="filters">Filters & Sorting</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="preview" disabled={!isPreviewMode}>Preview & Export</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-auto p-4">
              {/* Configuration Tab */}
              <TabsContent value="config" className="space-y-6 mt-0">
                <Card className="bg-slate-800/40 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Report Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Report Name</Label>
                        <Input
                          placeholder="Enter report name..."
                          value={reportConfig.name}
                          onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-slate-900/50 border-slate-700 text-slate-200"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Record Limit</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 1000"
                          value={reportConfig.limit || ''}
                          onChange={(e) => setReportConfig(prev => ({ 
                            ...prev, 
                            limit: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          className="bg-slate-900/50 border-slate-700 text-slate-200"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-slate-300">Description</Label>
                      <Textarea
                        placeholder="Describe what this report shows..."
                        value={reportConfig.description}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-900/50 border-slate-700 text-slate-200"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Data Sources Selection */}
                <Card className="bg-slate-800/40 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Data Sources</CardTitle>
                    <CardDescription className="text-slate-400">
                      Select the data tables you want to include in your report
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(DATA_SOURCES).map(([key, source]) => (
                        <Card 
                          key={key} 
                          className={`cursor-pointer transition-colors border-2 ${
                            reportConfig.dataSources.includes(key)
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-slate-700 hover:border-slate-600 bg-slate-800/20'
                          }`}
                          onClick={() => reportConfig.dataSources.includes(key) ? removeDataSource(key) : addDataSource(key)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-blue-400">{source.icon}</div>
                              <h3 className="font-medium text-slate-200">{source.name}</h3>
                              {reportConfig.dataSources.includes(key) && (
                                <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mb-2">{source.description}</p>
                            {dataSourceStats[key] && (
                              <div className="text-xs text-slate-500">
                                📊 {dataSourceStats[key].recordCount.toLocaleString()} records
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Field Selection */}
                {reportConfig.dataSources.length > 0 && (
                  <Card className="bg-slate-800/40 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-slate-200">Field Selection</CardTitle>
                      <CardDescription className="text-slate-400">
                        Choose which fields to include in your report
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-80">
                        {reportConfig.dataSources.map(sourceKey => {
                          const source = DATA_SOURCES[sourceKey as keyof typeof DATA_SOURCES];
                          return (
                            <div key={sourceKey} className="mb-6">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                                {source.icon}
                                <h3 className="font-medium text-slate-200">{source.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {reportConfig.selectedFields[sourceKey]?.length || 0} selected
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(source.fields).map(([fieldKey, fieldConfig]) => (
                                  <div key={fieldKey} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${sourceKey}-${fieldKey}`}
                                      checked={reportConfig.selectedFields[sourceKey]?.includes(fieldKey) || false}
                                      onCheckedChange={() => toggleField(sourceKey, fieldKey)}
                                    />
                                    <Label 
                                      htmlFor={`${sourceKey}-${fieldKey}`} 
                                      className="text-sm text-slate-300 cursor-pointer"
                                    >
                                      {fieldConfig.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Filters Tab */}
              <TabsContent value="filters" className="space-y-6 mt-0">
                <Card className="bg-slate-800/40 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Filters</CardTitle>
                    <CardDescription className="text-slate-400">
                      Add conditions to filter your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reportConfig.filters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <Select
                          value={filter.field}
                          onValueChange={(value) => updateFilter(index, { field: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {reportConfig.dataSources.map(sourceKey => {
                              const source = DATA_SOURCES[sourceKey as keyof typeof DATA_SOURCES];
                              return Object.entries(source.fields).map(([fieldKey, fieldConfig]) => (
                                <SelectItem key={`${sourceKey}.${fieldKey}`} value={fieldKey}>
                                  {source.name}.{fieldConfig.label}
                                </SelectItem>
                              ));
                            })}
                          </SelectContent>
                        </Select>

                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(index, { operator: value as any })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="is_null">Is Null</SelectItem>
                            <SelectItem value="is_not_null">Is Not Null</SelectItem>
                          </SelectContent>
                        </Select>

                        {filter.operator !== 'is_null' && filter.operator !== 'is_not_null' && (
                          <Input
                            placeholder="Value..."
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            className="flex-1 bg-slate-900/50 border-slate-700"
                          />
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={addFilter}
                      className="w-full border-slate-700 text-slate-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Visualization Tab */}
              <TabsContent value="visualization" className="space-y-6 mt-0">
                <Card className="bg-slate-800/40 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Visualization Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card 
                        className={`cursor-pointer transition-colors border-2 ${
                          reportConfig.visualization.type === 'table'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => setReportConfig(prev => ({
                          ...prev,
                          visualization: { type: 'table' }
                        }))}
                      >
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                          <p className="text-sm text-slate-300">Table</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-colors border-2 ${
                          reportConfig.visualization.chartType === 'bar'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => setReportConfig(prev => ({
                          ...prev,
                          visualization: { type: 'chart', chartType: 'bar' }
                        }))}
                      >
                        <CardContent className="p-4 text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                          <p className="text-sm text-slate-300">Bar Chart</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-colors border-2 ${
                          reportConfig.visualization.chartType === 'line'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => setReportConfig(prev => ({
                          ...prev,
                          visualization: { type: 'chart', chartType: 'line' }
                        }))}
                      >
                        <CardContent className="p-4 text-center">
                          <LineChart className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                          <p className="text-sm text-slate-300">Line Chart</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-colors border-2 ${
                          reportConfig.visualization.chartType === 'pie'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => setReportConfig(prev => ({
                          ...prev,
                          visualization: { type: 'chart', chartType: 'pie' }
                        }))}
                      >
                        <CardContent className="p-4 text-center">
                          <PieChart className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                          <p className="text-sm text-slate-300">Pie Chart</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6 mt-0">
                <Card className="bg-slate-800/40 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Report Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => exportReport('csv')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" onClick={() => exportReport('excel')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                      <Button variant="outline" onClick={() => exportReport('pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button onClick={saveReportTemplate}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reportData.length > 0 ? (
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(reportData[0]).map(key => (
                                <TableHead key={key} className="text-slate-300">{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.slice(0, 50).map((row, index) => (
                              <TableRow key={index}>
                                {Object.values(row).map((value: any, cellIndex) => (
                                  <TableCell key={cellIndex} className="text-slate-400">
                                    {value?.toString() || 'N/A'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {reportData.length > 50 && (
                          <p className="text-center text-slate-500 mt-4">
                            Showing first 50 rows of {reportData.length} total records
                          </p>
                        )}
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        No data to preview. Generate the report first.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <div className="text-sm text-slate-400">
            {reportConfig.dataSources.length} data source(s) selected, {reportConfig.filters.length} filter(s) applied
            <div className="text-xs text-slate-500 mt-1">
              💯 Pro tip: Ctrl+Enter to generate, Ctrl+S to save, Escape to close
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={generateReport} 
              disabled={reportConfig.dataSources.length === 0 || isGenerating}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}