"use client";

import { useState, useEffect } from "react";
import { useDialer } from "@/contexts/DialerContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Shield, Save, X } from "lucide-react";

// Define the form schema with Zod
const formSchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required" }),
  sipUsername: z.string().optional(),
  sipPassword: z.string().optional(),
  sipDomain: z.string().default("sip.buzzbox.co.za").optional(),
  accountId: z.string().min(1, { message: "Account ID is required" }),
  apiUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
  callbackUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface BuzzBoxConfigProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (config: FormValues) => void;
}

export function BuzzBoxConfig({ open, onOpenChange, onSave }: BuzzBoxConfigProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Get the dialer context to initialize BuzzBox
  const { initializeBuzzBox, isBuzzBoxInitialized } = useDialer();

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      accountId: "",
      apiUrl: "https://buzzboxcloud.co.za/buzzbox-conductor",
      callbackUrl: "https://smartkollect.co.za/api/buzzbox/webhook",
      sipUsername: "200",
      sipPassword: "", // Password will be entered by the user
      sipDomain: "zimakosmartbusinesssolutions.sip.buzzboxcloud.com:5080",
    },
  });

  // Load saved config from localStorage if available
  useEffect(() => {
    const savedConfig = localStorage.getItem('buzzBoxConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        form.reset(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved BuzzBox config:', error);
      }
    }
  }, [form]);

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    console.log("BuzzBox config values:", values);
    setIsSaving(true);
    setTestResult(null);
    
    try {
      // Initialize BuzzBox with the provided configuration
      const success = initializeBuzzBox(
        values.apiKey,
        values.accountId,
        false, // Not test mode
        {
          apiUrl: values.apiUrl || undefined,
          callbackUrl: values.callbackUrl || undefined,
          sipUsername: values.sipUsername || undefined,
          sipPassword: values.sipPassword || undefined,
          sipDomain: values.sipDomain || undefined,
          useMicroSip: false // Disable MicroSIP to use BuzzBox API directly
        }
      );
      
      // Set the test result
      setTestResult({
        success,
        message: success 
          ? "BuzzBox initialized successfully! You can now make and receive calls." 
          : "Failed to initialize BuzzBox. Please check your credentials and try again."
      });
      
      // Call the onSave callback if provided and successful
      if (success && onSave) {
        onSave(values);
      }
      
      // Only close the dialog if successful
      if (success) {
        // Save the configuration to localStorage for persistence
        localStorage.setItem('buzzBoxConfig', JSON.stringify(values));
        
        // Close the dialog after a short delay to show the success message
        setTimeout(() => {
          if (onOpenChange) {
            onOpenChange(false);
          } else {
            setIsDialogOpen(false);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error initializing BuzzBox:', error);
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if we're in dialog mode or inline mode
  const isDialogMode = typeof open !== "undefined" && typeof onOpenChange !== "undefined";
  
  // The actual configuration form
  const configForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">API Key</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your BuzzBox API Key"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                Your BuzzBox API Key from your account dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">Account ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your BuzzBox Account ID"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                Your BuzzBox Account ID from your account dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API URL</FormLabel>
              <FormControl>
                <Input placeholder="https://buzzboxcloud.co.za/buzzbox-conductor" {...field} />
              </FormControl>
              <FormDescription className="text-slate-500">
                The BuzzBox API URL (usually you don&apos;t need to change this)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="callbackUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">Webhook URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://your-domain.com/api/buzzbox/webhook"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                This webhook URL must be provided to BuzzBox for call events. Send this URL to BuzzBox support.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 pb-2">
          <h3 className="text-md font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-indigo-400" />
            MicroSIP Integration
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            These credentials will be used for agents to log into MicroSIP desktop application.
          </p>
        </div>

        <FormField
          control={form.control}
          name="sipUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">SIP Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your SIP username"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                Username for MicroSIP login (usually your BuzzBox extension).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sipPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">SIP Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your SIP password"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                Password for MicroSIP login.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sipDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">SIP Domain</FormLabel>
              <FormControl>
                <Input
                  placeholder="sip.buzzbox.co.za"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                BuzzBox SIP domain. Leave as default unless instructed otherwise.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isDialogMode && (
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  // If we're in dialog mode, render the Dialog component
  if (isDialogMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900 text-slate-200 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              BuzzBox Configuration
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure your BuzzBox integration settings.
            </DialogDescription>
          </DialogHeader>

          {configForm}

          {testResult && (
            <div className={`p-3 rounded-md mt-2 ${testResult.success ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
              {testResult.message}
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => onOpenChange?.(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise, render the inline version with a button to open the dialog
  return (
    <div className="space-y-4">
      {!isDialogOpen ? (
        <div className="p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-slate-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              BuzzBox Configuration
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-700"
              onClick={() => setIsDialogOpen(true)}
            >
              Configure
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            Configure your BuzzBox integration to make and receive calls using the BuzzBox cloud telephony service.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-slate-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              BuzzBox Configuration
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-700"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {configForm}
        </div>
      )}
    </div>
  );
}
