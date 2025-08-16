"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { createSettlement, getSettlements } from "@/lib/settlement-service";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Handshake,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Sliders,
  Trash2,
  TrendingUp,
  User2,
} from "lucide-react";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

// Define interfaces for our component's needs

// This interface represents the settlement data as it comes from the database
interface DbSettlement {
  id: string;
  customer_id: string;
  customer_name: string;
  account_number: string;
  original_amount: number;
  settlement_amount: number;
  discount_percentage: number;
  description: string;
  status: string;
  created_at: string;
  expiry_date: string;
  agent_name: string;
}

// This interface represents the settlement data as we use it in our component
interface Settlement {
  id: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  originalAmount: number;
  settlementAmount: number;
  discountPercentage: number;
  description: string;
  status: string;
  createdAt: string;
  expiryDate: string;
  agentName: string;
}

// Function to load settlements from Supabase
const loadSettlements = async (): Promise<Settlement[]> => {
  try {
    const settlements = await getSettlements();
    
    // Map the database column names to our component's expected format
    return settlements.map((settlement: DbSettlement) => ({
      id: settlement.id,
      customerId: settlement.customer_id,
      customerName: settlement.customer_name,
      accountNumber: settlement.account_number,
      originalAmount: settlement.original_amount,
      settlementAmount: settlement.settlement_amount,
      discountPercentage: settlement.discount_percentage,
      description: settlement.description,
      status: settlement.status,
      createdAt: settlement.created_at,
      expiryDate: settlement.expiry_date,
      agentName: settlement.agent_name
    }));
  } catch (error) {
    console.error('Error loading settlements:', error);
    return [];
  }
};

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateDiscountPercentage = (original: number, offer: number) => {
  const discount = ((original - offer) / original) * 100;
  return discount.toFixed(0);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
    case "approved":
      return "bg-green-500/20 text-green-500 border-green-500/20";
    case "rejected":
      return "bg-red-500/20 text-red-500 border-red-500/20";
    case "in-progress":
      return "bg-blue-500/20 text-blue-500 border-blue-500/20";
    case "completed":
      return "bg-emerald-500/20 text-emerald-500 border-emerald-500/20";
    default:
      return "bg-slate-500/20 text-slate-500 border-slate-500/20";
  }
};

export default function SettlementsPage() {
  const [showNewSettlementDialog, setShowNewSettlementDialog] = useState(false);
  const [originalAmount, setOriginalAmount] = useState(10000);
  const [offerAmount, setOfferAmount] = useState(7500);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [uniqueAgents, setUniqueAgents] = useState<string[]>([]);
  
  // Load settlements from Supabase on component mount
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const loadedSettlements = await loadSettlements();
        setSettlements(loadedSettlements);
        
        // Extract unique agent names for the filter dropdown
        const agentNames = loadedSettlements
          .map(settlement => settlement.agentName)
          .filter((value, index, self) => value && self.indexOf(value) === index);
        
        setUniqueAgents(agentNames);
      } catch (error) {
        console.error('Error fetching settlements:', error);
      }
    };
    
    fetchSettlements();
  }, []);

  // Update offer amount when slider changes
  const handleOfferAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOfferAmount = parseFloat(e.target.value) || 0;
    setOfferAmount(newOfferAmount);
  };

  // Update original amount and recalculate offer
  const handleOriginalAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newOriginalAmount = parseFloat(e.target.value) || 0;
    setOriginalAmount(newOriginalAmount);
  };

  // Handle creating a new settlement
  const handleCreateSettlement = async () => {
    console.log('=== SETTLEMENT CREATION STARTED ===');
    
    // Validate settlement data
    if (!originalAmount || !offerAmount) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      // Get form values using more specific selectors with IDs
      const debtorNameInput = document.getElementById('debtor-name') as HTMLInputElement;
      const accountNumberInput = document.getElementById('account-number') as HTMLInputElement;
      const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
      const expiryDateInput = document.getElementById('expiry-date') as HTMLInputElement;
      
      // Get the current user's ID directly from Supabase
      let userId;
      let agentName = 'Unknown Agent';
      
      // Try to get the user from Supabase session
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting Supabase session:', error);
      }
      
      userId = data.session?.user?.id;
      agentName = data.session?.user?.user_metadata?.name || data.session?.user?.email || 'Unknown Agent';
      
      // If still no user ID, try localStorage
      if (!userId) {
        try {
          const storedSession = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL + '-auth-token');
          
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            userId = parsedSession.user?.id;
            agentName = parsedSession.user?.user_metadata?.name || 
                      parsedSession.user?.email || 'Unknown Agent';
          }
        } catch (e) {
          console.error('Error accessing localStorage:', e);
        }
      }
      
      // Last resort - hardcode a UUID for testing
      if (!userId) {
        userId = '00000000-0000-0000-0000-000000000000';
      }
      
      // Create settlement ID
      const settlementId = crypto.randomUUID();
      
      // Check if we need to look up a debtor ID
      let debtorId = null;
      const accountNumber = accountNumberInput?.value;
      
      if (accountNumber) {
        // Try to find the debtor by account number
        try {
          const { data: debtorData, error: debtorError } = await supabase
            .from('Debtors')
            .select('id')
            .eq('acc_number', accountNumber)
            .single();
            
          if (debtorError) {
            console.warn('Could not find debtor with account number:', accountNumber);
          } else if (debtorData) {
            debtorId = debtorData.id;
            console.log('Found debtor ID:', debtorId);
          }
        } catch (debtorLookupError) {
          console.error('Error looking up debtor:', debtorLookupError);
        }
      }
      
      const discountPercentage = parseInt(calculateDiscountPercentage(originalAmount, offerAmount));
      
      const settlementData = {
        id: settlementId,
        customer_id: debtorId, // Use the found debtor ID or null if not found
        customer_name: debtorNameInput?.value || 'Unknown Debtor',
        account_number: accountNumber || 'Unknown Account',
        original_amount: originalAmount,
        settlement_amount: offerAmount,
        discount_percentage: discountPercentage,
        description: descriptionInput?.value || '',
        status: 'pending',
        expiry_date: expiryDateInput?.value || new Date().toISOString().split('T')[0],
        agent_name: agentName,
        created_by: userId
      };
      
      // Try through the service function first
      try {
        const savedSettlement = await createSettlement(settlementData);
      
        if (savedSettlement) {
          // Map the DB settlement to our component format
          const newSettlement: Settlement = {
            id: savedSettlement.id,
            customerId: savedSettlement.customer_id,
            customerName: savedSettlement.customer_name,
            accountNumber: savedSettlement.account_number,
            originalAmount: savedSettlement.original_amount,
            settlementAmount: savedSettlement.settlement_amount,
            discountPercentage: savedSettlement.discount_percentage,
            description: savedSettlement.description,
            status: savedSettlement.status,
            createdAt: savedSettlement.created_at,
            expiryDate: savedSettlement.expiry_date,
            agentName: savedSettlement.agent_name
          };
          
          // Update the settlements state with the new settlement
          setSettlements([newSettlement, ...settlements]);
          
          // Show success message
          alert('Settlement created successfully!');
          
          // Close the dialog
          setShowNewSettlementDialog(false);
          
          // Reset form fields
          setOriginalAmount(10000);
          setOfferAmount(7500);
        } else {
          throw new Error('Failed to save settlement to database');
        }
      } catch (serviceError) {
        console.error('Error in settlement service function:', serviceError);
        
        // If service function fails, try direct insert as fallback
        try {
          const { data: directData, error: directError } = await supabase
            .from('Settlements')
            .insert(settlementData)
            .select()
            .single();
            
          if (directError) {
            console.error('Direct Supabase insert error:', directError);
            alert(`Failed to create settlement: ${directError.message}`);
          } else {
            console.log('Direct Supabase insert successful:', directData);
            
            // Map the direct DB insert to our component format
            const newSettlement: Settlement = {
              id: directData.id,
              customerId: directData.customer_id,
              customerName: directData.customer_name,
              accountNumber: directData.account_number,
              originalAmount: directData.original_amount,
              settlementAmount: directData.settlement_amount,
              discountPercentage: directData.discount_percentage,
              description: directData.description,
              status: directData.status,
              createdAt: directData.created_at,
              expiryDate: directData.expiry_date,
              agentName: directData.agent_name
            };
            
            // Update the settlements state with the new settlement
            setSettlements([newSettlement, ...settlements]);
            
            // Show success message
            alert('Settlement created successfully!');
            
            // Close the dialog
            setShowNewSettlementDialog(false);
            
            // Reset form fields
            setOriginalAmount(10000);
            setOfferAmount(7500);
          }
        } catch (directInsertError) {
          console.error('Exception during direct Supabase insert:', directInsertError);
          alert('Failed to create settlement. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating settlement:', error);
      alert('Failed to create settlement. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-none py-6 space-y-6 px-6">
      {/* Settlement Creation Dialog */}
      <Dialog open={showNewSettlementDialog} onOpenChange={setShowNewSettlementDialog}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-100 flex items-center">
              <Handshake className="h-5 w-5 mr-2 text-blue-500" />
              Create Settlement Offer
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new settlement offer for a debtor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debtor-name" className="text-slate-300">Debtor Name</Label>
                <Input 
                  id="debtor-name" 
                  placeholder="Enter debtor name" 
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number" className="text-slate-300">Account Number</Label>
                <Input 
                  id="account-number" 
                  placeholder="Enter account number" 
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="original-amount" className="text-slate-300">Original Amount (R)</Label>
                <Input 
                  id="original-amount" 
                  type="number" 
                  value={originalAmount}
                  onChange={handleOriginalAmountChange}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-amount" className="text-slate-300">Settlement Amount (R)</Label>
                <Input 
                  id="offer-amount" 
                  type="number" 
                  value={offerAmount}
                  onChange={handleOfferAmountChange}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="discount" className="text-slate-300">Discount</Label>
                <span className="text-blue-500 font-medium">
                  {calculateDiscountPercentage(originalAmount, offerAmount)}%
                </span>
              </div>
              <Slider
                id="discount"
                min={0}
                max={100}
                step={5}
                value={[parseInt(calculateDiscountPercentage(originalAmount, offerAmount))]}
                onValueChange={(value) => {
                  const discountPercent = value[0];
                  const newOfferAmount = originalAmount * (1 - discountPercent / 100);
                  setOfferAmount(parseFloat(newOfferAmount.toFixed(2)));
                }}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiry-date" className="text-slate-300">Expiry Date</Label>
              <Input 
                id="expiry-date" 
                type="date" 
                className="bg-slate-800 border-slate-700 text-slate-100"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter settlement details and terms" 
                className="bg-slate-800 border-slate-700 text-slate-100 min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSettlementDialog(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSettlement} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Settlement Management
          </h1>
          <p className="text-slate-400 mt-1">
            Create and manage settlement offers for debtors
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-700">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-500" onClick={() => setShowNewSettlementDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Settlement
          </Button>
        </div>
      </div>

      {/* Settlement Statistics Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-lg">
                Total Settlements
              </CardTitle>
              <CardDescription className="text-slate-400">
                All time settlement offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-3xl font-bold">
                    {settlements.length}
                  </div>
                  <div className="text-xs text-slate-500">All settlements</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-lg">
                Acceptance Rate
              </CardTitle>
              <CardDescription className="text-slate-400">
                Settlements accepted vs offered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <div className="text-3xl font-bold">0%</div>
                  <div className="text-xs text-slate-500">
                    No settlements yet
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-lg">
                Recovery Amount
              </CardTitle>
              <CardDescription className="text-slate-400">
                Total recovered through settlements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-emerald-500 mr-3" />
                <div>
                  <div className="text-3xl font-bold">R0</div>
                  <div className="text-xs text-slate-500">
                    0% of total debt value
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Handshake className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-medium">Settlement Offers</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search settlements..."
                  className="pl-8 bg-slate-800 border-slate-700 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Select 
                  defaultValue="all"
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  defaultValue="all"
                  value={agentFilter}
                  onValueChange={setAgentFilter}
                >
                  <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Filter by agent" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Agents</SelectItem>
                    {uniqueAgents.map(agent => (
                      <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-800/50">
              <TableRow className="hover:bg-slate-800/80 border-slate-700">
                <TableHead className="text-slate-400">ID</TableHead>
                <TableHead className="text-slate-400">Debtor</TableHead>
                <TableHead className="text-slate-400">
                  <div className="flex items-center space-x-1">
                    <span>Original Amount</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-400">
                  <div className="flex items-center space-x-1">
                    <span>Offer Amount</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-400">Discount</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Agent</TableHead>
                <TableHead className="text-slate-400">
                  <div className="flex items-center space-x-1">
                    <span>Expiry Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Handshake className="h-10 w-10 text-slate-500" />
                      <p className="text-slate-400 font-medium">No settlements found</p>
                      <p className="text-slate-500 text-sm">Create a new settlement to get started</p>
                      <Button 
                        className="mt-2 bg-gradient-to-r from-blue-600 to-blue-500"
                        onClick={() => setShowNewSettlementDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Settlement
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                settlements
                  .filter(settlement => {
                    // Filter by search query
                    const matchesSearch = searchQuery === '' || 
                      settlement.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      settlement.accountNumber.toLowerCase().includes(searchQuery.toLowerCase());
                    
                    // Filter by status
                    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;
                    
                    // Filter by agent name
                    const matchesAgent = agentFilter === 'all' || settlement.agentName === agentFilter;
                    
                    return matchesSearch && matchesStatus && matchesAgent;
                  })
                  .map((settlement) => (
                  <TableRow
                    key={settlement.id}
                    className="hover:bg-slate-800/50 border-slate-700 cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {settlement.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>{settlement.customerName}</TableCell>
                    <TableCell>
                      {formatCurrency(settlement.originalAmount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(settlement.settlementAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">
                        {settlement.discountPercentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(settlement.status)}
                      >
                        {settlement.status.charAt(0).toUpperCase() +
                          settlement.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20">
                        {settlement.agentName}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(settlement.expiryDate)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-slate-800 border-slate-700"
                        >
                          <DropdownMenuLabel className="text-slate-300">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-slate-200">
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-slate-200">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send to Debtor
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-slate-200">
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem className="text-red-400 focus:bg-slate-700 focus:text-red-300">
                            <Trash2 className="mr-2 h-4 w-4" />
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
        </div>
      </div>
    </div>
  );
}