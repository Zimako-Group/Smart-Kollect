import { Button } from "@/components/ui/button";
import { DollarSign, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PaymentAnalysisCard() {
  return (
    <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-full bg-green-900/30 p-2.5">
          <DollarSign className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h3 className="font-medium text-slate-200">Payment Analysis</h3>
          <p className="text-xs text-slate-400">Payment methods & trends</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Last Generated:</span>
          <span className="text-slate-300">{new Date().toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Format:</span>
          <span className="text-slate-300 flex items-center gap-2">
            <span className="flex items-center">
              <FileText className="h-3 w-3 mr-1 text-red-400" /> PDF
            </span>
            <span className="flex items-center">
              <FileSpreadsheet className="h-3 w-3 mr-1 text-green-400" /> Excel
            </span>
          </span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-xs h-8"
          >
            Generate Report
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem
            className="cursor-pointer flex items-center"
            onClick={async () => {
              try {
                // Show loading toast with information about fetching all records
                toast.loading("Generating Payment Analysis PDF report from all records...", { 
                  id: "payment-report-pdf",
                  duration: 60000 // Longer duration since we're processing many records
                });
                
                // Dynamically import the PDF report service
                const reportService = await import('@/lib/report-service-pdf');
                
                // Update loading message to show we're fetching records
                toast.loading("Fetching all payment records (this may take a minute)...", { id: "payment-report-pdf" });
                
                // Generate the report (now uses pagination to get all records)
                const reportResult = await reportService.generatePaymentAnalysisReport();
                
                // Check if we have any records
                if (reportResult.totalRecords === 0) {
                  toast.dismiss("payment-report-pdf");
                  toast.info('No payment records found', {
                    description: 'No payment records were found for the specified criteria. Please check that payment records exist in the system.',
                    duration: 5000,
                  });
                  return;
                }
                
                // Update loading message to show we're calculating statistics
                toast.loading(`Processing ${reportResult.totalRecords.toLocaleString()} records...`, { id: "payment-report-pdf" });
                
                // Calculate statistics
                const stats = reportService.calculatePaymentStatistics(reportResult.data);
                
                // Update loading message to show we're generating the PDF
                toast.loading(`Creating PDF with ${reportResult.totalRecords.toLocaleString()} records...`, { id: "payment-report-pdf" });
                
                // Export to PDF with pie chart
                await reportService.exportPaymentAnalysisToPDF(
                  reportResult.data,
                  stats,
                  `payment_analysis_${new Date().toISOString().split('T')[0]}.pdf`
                );
                
                // Show success message with statistics
                toast.dismiss("payment-report-pdf");
                toast.success('Payment Analysis PDF report generated successfully', {
                  description: `All ${reportResult.totalRecords.toLocaleString()} records processed with visual charts. Total payments: R${stats.totalPaymentAmount.toFixed(2)}`,
                  duration: 10000, // Longer duration to read the message
                });
                
              } catch (error) {
                console.error('Error generating PDF report:', error);
                toast.dismiss("payment-report-pdf");
                toast.error('Failed to generate PDF report', {
                  description: error instanceof Error ? error.message : 'Unknown error occurred',
                });
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2 text-red-400" />
            PDF Format
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer flex items-center"
            onClick={async () => {
              try {
                // Show loading toast with information about fetching all records
                toast.loading("Generating Payment Analysis Excel report from all records...", { 
                  id: "payment-report-excel",
                  duration: 60000 // Longer duration since we're processing many records
                });
                
                // Dynamically import the report service
                const reportService = await import('@/lib/report-service-pdf');
                
                // Update loading message to show we're fetching records
                toast.loading("Fetching all payment records (this may take a minute)...", { id: "payment-report-excel" });
                
                // Generate the report (now uses pagination to get all records)
                const reportResult = await reportService.generatePaymentAnalysisReport();
                
                // Check if we have any records
                if (reportResult.totalRecords === 0) {
                  toast.dismiss("payment-report-excel");
                  toast.info('No payment records found', {
                    description: 'No payment records were found for the specified criteria. Please check that payment records exist in the system.',
                    duration: 5000,
                  });
                  return;
                }
                
                // Update loading message to show we're calculating statistics
                toast.loading(`Processing ${reportResult.totalRecords.toLocaleString()} records...`, { id: "payment-report-excel" });
                
                // Calculate statistics
                const stats = reportService.calculatePaymentStatistics(reportResult.data);
                
                // Update loading message to show we're generating the Excel file
                toast.loading(`Creating Excel file with ${reportResult.totalRecords.toLocaleString()} records...`, { id: "payment-report-excel" });
                
                // Export to Excel
                await reportService.exportPaymentAnalysisToExcel(
                  reportResult.data,
                  stats,
                  `payment_analysis_${new Date().toISOString().split('T')[0]}.xlsx`
                );
                
                // Show success message with statistics
                toast.dismiss("payment-report-excel");
                toast.success('Payment Analysis Excel report generated successfully', {
                  description: `All ${reportResult.totalRecords.toLocaleString()} records processed. Total payments: R${stats.totalPaymentAmount.toFixed(2)}`,
                  duration: 10000, // Longer duration to read the message
                });
                
              } catch (error) {
                console.error('Error generating Excel report:', error);
                toast.dismiss("payment-report-excel");
                toast.error('Failed to generate Excel report', {
                  description: error instanceof Error ? error.message : 'Unknown error occurred',
                });
              }
            }}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-400" />
            Excel Format
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
