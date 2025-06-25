'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateMonthlyArrangementsReport, exportMonthlyArrangementsToExcel } from '@/lib/monthly-arrangements-service';

export default function MonthlyArrangementsCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      
      // Show toast for report generation
      toast.info('Generating monthly arrangements report...');
      
      // Generate the report
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const report = await generateMonthlyArrangementsReport(month, year);
      
      if (report.totalRecords === 0) {
        toast.warning(`No arrangements found for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`);
        setIsLoading(false);
        return;
      }
      
      // Export to Excel
      await exportMonthlyArrangementsToExcel(
        report.data,
        { month, year },
        `monthly_arrangements_${year}-${month.toString().padStart(2, '0')}.xlsx`
      );
      
      // Show success toast
      toast.success(`Monthly arrangements report for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear} exported successfully`);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(`Failed to generate report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-purple-900/30 p-2.5">
            <CalendarIcon className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-slate-200">Monthly Arrangements</h3>
            <p className="text-xs text-slate-400">Arrangement records for the current month</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label htmlFor="month" className="text-xs text-slate-400 mb-1 block">Month</Label>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
              disabled={isLoading}
            >
              <SelectTrigger id="month" className="bg-slate-900/50 border-slate-700 text-slate-200 h-8 text-xs">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value} className="text-xs">
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="year" className="text-xs text-slate-400 mb-1 block">Year</Label>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
              disabled={isLoading}
            >
              <SelectTrigger id="year" className="bg-slate-900/50 border-slate-700 text-slate-200 h-8 text-xs">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value} className="text-xs">
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-xs h-8 flex items-center gap-2"
          onClick={handleGenerateReport}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Generate Excel Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
