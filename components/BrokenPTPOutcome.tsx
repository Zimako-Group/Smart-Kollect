"use client";

import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  CalendarClock,
  Banknote,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

type BrokenPTPCustomer = {
  id: string;
  name: string;
  phone: string;
  amount: number;
  promiseDate: string;
  daysLate: number;
  status: "high" | "medium" | "low";
};

type CallOutcome = {
  id: string;
  customerId: string;
  outcome: string;
  notes: string;
  newPromiseDate?: Date;
  newAmount?: number;
  timestamp: Date;
};

interface BrokenPTPOutcomeProps {
  customer: BrokenPTPCustomer;
  onClose: () => void;
  onOutcomeRecorded: (customerId: string, outcome: CallOutcome) => void;
}

const BrokenPTPOutcome: React.FC<BrokenPTPOutcomeProps> = ({ 
  customer, 
  onClose,
  onOutcomeRecorded
}) => {
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [newPromiseDate, setNewPromiseDate] = useState<Date | undefined>(undefined);
  const [newAmount, setNewAmount] = useState<string>(customer.amount.toString());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  };

  // Handle outcome submission
  const handleSubmit = () => {
    if (!outcome) {
      toast.error("Please select an outcome");
      return;
    }

    setIsSubmitting(true);

    // Create the outcome object
    const callOutcome: CallOutcome = {
      id: `CO-${Date.now()}`,
      customerId: customer.id,
      outcome,
      notes,
      newPromiseDate,
      newAmount: newAmount ? parseFloat(newAmount) : undefined,
      timestamp: new Date()
    };

    // Simulate API call
    setTimeout(() => {
      // Call the onOutcomeRecorded callback
      onOutcomeRecorded(customer.id, callOutcome);
      
      // Show success toast
      toast.success("Call outcome recorded successfully", {
        description: `Outcome: ${outcome}`,
        duration: 3000,
      });
      
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              <CardTitle className="text-xl font-semibold text-slate-200">Record Call Outcome</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription className="text-slate-400 mt-1">
            Record the outcome of your call with {customer.name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Customer Information */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-slate-200">{customer.name}</h3>
                <p className="text-sm text-slate-400">{customer.phone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`
                    ${customer.status === "high" ? "bg-red-900/40 text-red-400 border-red-800/40" : 
                      customer.status === "medium" ? "bg-amber-900/40 text-amber-400 border-amber-800/40" : 
                      "bg-blue-900/40 text-blue-400 border-blue-800/40"}
                  `}>
                    {customer.status === "high" ? "High Priority" : 
                     customer.status === "medium" ? "Medium Priority" : 
                     "Low Priority"}
                  </Badge>
                  <span className="text-xs text-slate-500">ID: {customer.id}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-200">{formatCurrency(customer.amount)}</div>
                <div className="flex items-center gap-1 text-sm justify-end">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-400">Promised: {formatDate(customer.promiseDate)}</span>
                </div>
                <div className="flex items-center gap-1 text-sm mt-1 justify-end">
                  <Clock className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-red-400">{customer.daysLate} {customer.daysLate === 1 ? 'day' : 'days'} overdue</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Call Outcome */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Call Outcome</label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="new_ptp">New Promise to Pay</SelectItem>
                  <SelectItem value="partial_payment">Partial Payment Made</SelectItem>
                  <SelectItem value="full_payment">Full Payment Made</SelectItem>
                  <SelectItem value="dispute">Customer Disputes Debt</SelectItem>
                  <SelectItem value="callback">Call Back Later</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="wrong_number">Wrong Number</SelectItem>
                  <SelectItem value="refused">Customer Refused to Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Conditional fields based on outcome */}
            {outcome === "new_ptp" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">New Promise Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        {newPromiseDate ? format(newPromiseDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <CalendarComponent
                        mode="single"
                        selected={newPromiseDate}
                        onSelect={setNewPromiseDate}
                        initialFocus
                        className="bg-slate-800 text-slate-200"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">New Promise Amount</label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="pl-9 bg-slate-800 border-slate-700 text-slate-200"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter call notes..."
                className="min-h-[120px] bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t border-slate-800 pt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? "Saving..." : "Save Outcome"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BrokenPTPOutcome;
