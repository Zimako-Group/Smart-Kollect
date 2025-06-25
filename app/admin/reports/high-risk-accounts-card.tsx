import { Button } from "@/components/ui/button";
import { AlertTriangle, FileText, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HighRiskAccountsCard() {
  return (
    <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-full bg-red-900/30 p-2.5">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-medium text-slate-200">Accounts Category Risk</h3>
          <p className="text-xs text-slate-400">Accounts at risk of default</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Risk Criteria:</span>
          <span className="text-slate-300">No payment for 120+ days</span>
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
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-xs h-8"
          >
            Generate Report
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem
            className="cursor-pointer flex items-center"
            onClick={async () => {
              try {
                // Show loading toast
                toast.loading("Generating Accounts Category Risk PDF report...", { 
                  id: "accounts-category-risk-report",
                  duration: 30000
                });
                
                // Dynamically import the high risk accounts service
                const highRiskService = await import('@/lib/high-risk-accounts-service');
                
                // Update loading message
                toast.loading("Identifying accounts with no payment for 120+ days...", { id: "accounts-category-risk-report" });
                
                // Generate the report
                const reportResult = await highRiskService.generateHighRiskAccountsReport();
                
                if (reportResult.totalRecords === 0) {
                  toast.dismiss("accounts-category-risk-report");
                  toast.info('No high risk accounts found', {
                    description: 'No accounts with 120+ days without payment were found in the system.',
                    duration: 5000,
                  });
                  return;
                }
                
                // Update loading message
                toast.loading(`Processing ${reportResult.totalRecords.toLocaleString()} category risk accounts...`, { id: "accounts-category-risk-report" });
                
                // Export to PDF
                await highRiskService.exportHighRiskAccountsToPDF(
                  reportResult.data,
                  `accounts_category_risk_${new Date().toISOString().split('T')[0]}.pdf`
                );
                
                // Show success message
                toast.dismiss("accounts-category-risk-report");
                toast.success('Accounts Category Risk PDF report generated successfully', {
                  description: `Identified ${reportResult.totalRecords.toLocaleString()} accounts with no payment for 120+ days.`,
                  duration: 5000,
                });
                
              } catch (error) {
                console.error('Error generating PDF report:', error);
                toast.dismiss("accounts-category-risk-report");
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
                // Show loading toast
                toast.loading("Generating Accounts Category Risk Excel report...", { 
                  id: "accounts-category-risk-excel",
                  duration: 30000
                });
                
                // Dynamically import the high risk accounts service
                const highRiskService = await import('@/lib/high-risk-accounts-service');
                
                // Update loading message
                toast.loading("Identifying accounts with no payment for 120+ days...", { id: "accounts-category-risk-excel" });
                
                // Generate the report
                const reportResult = await highRiskService.generateHighRiskAccountsReport();
                
                if (reportResult.totalRecords === 0) {
                  toast.dismiss("accounts-category-risk-excel");
                  toast.info('No high risk accounts found', {
                    description: 'No accounts with 120+ days without payment were found in the system.',
                    duration: 5000,
                  });
                  return;
                }
                
                // Update loading message
                toast.loading(`Processing ${reportResult.totalRecords.toLocaleString()} category risk accounts...`, { id: "accounts-category-risk-excel" });
                
                // Export to Excel - we need to add this function to the service
                await highRiskService.exportHighRiskAccountsToExcel(
                  reportResult.data,
                  `accounts_category_risk_${new Date().toISOString().split('T')[0]}.xlsx`
                );
                
                // Show success message
                toast.dismiss("accounts-category-risk-excel");
                toast.success('Accounts Category Risk Excel report generated successfully', {
                  description: `Identified ${reportResult.totalRecords.toLocaleString()} accounts with no payment for 120+ days.`,
                  duration: 5000,
                });
                
              } catch (error) {
                console.error('Error generating Excel report:', error);
                toast.dismiss("accounts-category-risk-excel");
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
