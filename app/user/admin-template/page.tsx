"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../../types/supabase";

// Define form schema with Zod
const formSchema = z.object({
  accountNumber: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  queryType: z.string().min(1, "Query type is required"),
  description: z.string().min(1, "Description is required"),
  status: z.string().min(1, "Status is required"),
  escalatedDepartment: z.string().optional(),
});

export default function AdminTemplatePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient<Database>();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountNumber: "",
      date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
      queryType: "",
      description: "",
      status: "",
      escalatedDepartment: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Check if user is authenticated using the AuthContext
      if (!isAuthenticated || !user) {
        throw new Error("User not authenticated");
      }

      // Insert the admin template record
      const insertData = {
        account_number: values.accountNumber || null,
        date: values.date,
        query_type: values.queryType,
        description: values.description,
        status: values.status,
        escalated_department: values.escalatedDepartment || null,
        agent_id: user.id,
      };

      const { data, error } = await supabase
        .from("admin_templates")
        .insert(insertData as any);

      if (error) {
        throw error;
      }

      // Show success toast notification using sonner
      toast.success("Admin template has been saved successfully.", {
        description: "Your admin issue has been recorded.",
        duration: 4000,
      });

      // Reset form
      form.reset({
        accountNumber: "",
        date: new Date().toISOString().split("T")[0],
        queryType: "",
        description: "",
        status: "",
        escalatedDepartment: "",
      });

    } catch (error: any) {
      console.error("Error submitting admin template:", error);
      // Show error toast notification using sonner
      toast.error("Failed to save admin template", {
        description: error.message || "An error occurred while saving the admin issue",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show/hide escalated department based on status
  const watchStatus = form.watch("status");
  const showEscalatedDepartment = watchStatus === "escalated";

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-4 border-b bg-card">
        <div>
          <h1 className="text-2xl font-bold text-primary">Admin Issues</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Register and track administrative issues you deal with on a daily basis
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/user/admin-template/list")}
          className="flex items-center gap-2 hover:bg-primary/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
          View All Issues
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-muted/10">
        <Card className="w-full h-full shadow-md border-t-4 border-t-primary overflow-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
              New Admin Issue
            </CardTitle>
            <CardDescription>
              Fill out the form below to register a new administrative issue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number (if applicable)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank if this issue is not related to a specific account.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="queryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Query Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select query type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="indigent">Indigent</SelectItem>
                          <SelectItem value="account_holder_deceased">
                            Account Holder Deceased
                          </SelectItem>
                          <SelectItem value="reconnection_of_services">
                            Reconnection of Services
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the issue in detail"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="escalated">Escalated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showEscalatedDepartment && (
                  <FormField
                    control={form.control}
                    name="escalatedDepartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escalated Department</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="management">Management</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save Admin Issue
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
