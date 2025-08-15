"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Save,
  Settings,
  User,
  Lock,
  Bell,
  Mail,
  Shield,
  Database,
  FileText,
  Globe,
  Smartphone,
  CreditCard,
  AlertTriangle,
  Check,
  X,
  Upload,
  Download,
  RefreshCw,
  Trash2,
  Info,
  HelpCircle,
  Users,
  Building,
  Briefcase,
  Clock,
  Calendar,
  Palette,
  MessageSquare,
  FileSpreadsheet,
  Plus,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SystemSetting, insertDefaultSettings as importedInsertDefaultSettings } from "@/lib/settings-service";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

// Types for API keys, webhooks, and audit logs
interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  permissions: string[];
  status: "active" | "expired" | "revoked";
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  createdAt: string;
  lastTriggered: string | null;
  status: "active" | "inactive";
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

// Mock data for API keys, webhooks, and audit logs
const mockSystemSettings: SystemSetting[] = [
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    name: "Company Name",
    description: "Your company name as it appears in the system",
    value: "SmartCollect",
    type: "text",
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0852",
    name: "Contact Email",
    description: "Primary contact email for system notifications",
    value: "support@smartcollect.com",
    type: "text",
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0853",
    name: "Support Phone",
    description: "Customer support phone number",
    value: "+27 11 123 4567",
    type: "text",
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0854",
    name: "Business Hours",
    description: "Your business operating hours",
    value: "Mon-Fri: 8am-5pm",
    type: "text",
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0855",
    name: "Date Format",
    description: "Default date format for the system",
    value: "DD/MM/YYYY",
    type: "select",
    options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0856",
    name: "Time Format",
    description: "Default time format for the system",
    value: "24-hour",
    type: "select",
    options: ["12-hour", "24-hour"],
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0857",
    name: "Default Language",
    description: "System default language",
    value: "English",
    type: "select",
    options: ["English", "Afrikaans", "Zulu", "Xhosa", "Sotho"],
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0858",
    name: "Currency",
    description: "Default currency for financial calculations",
    value: "ZAR",
    type: "select",
    options: ["ZAR", "USD", "EUR", "GBP"],
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0859",
    name: "Custom CSS",
    description: "Custom CSS for the application",
    value: "",
    type: "textarea",
    category: "general",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0860",
    name: "Enable Two-Factor Authentication",
    description: "Require two-factor authentication for all users",
    value: false,
    type: "boolean",
    category: "security",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0861",
    name: "Password Expiry Days",
    description: "Number of days before passwords expire",
    value: 90,
    type: "number",
    category: "security",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0862",
    name: "Session Timeout (minutes)",
    description: "Inactive session timeout in minutes",
    value: 30,
    type: "number",
    category: "security",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0863",
    name: "IP Whitelist",
    description: "Comma-separated list of allowed IP addresses",
    value: "",
    type: "textarea",
    category: "security",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0864",
    name: "Login Attempts Before Lockout",
    description: "Number of failed login attempts before account lockout",
    value: 5,
    type: "number",
    category: "security",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0865",
    name: "Account Lockout Duration (minutes)",
    description: "Duration of account lockout after failed attempts",
    value: 30,
    type: "number",
    category: "security",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0866",
    name: "Email Notifications",
    description: "Send email notifications for system events",
    value: true,
    type: "boolean",
    category: "notifications",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0867",
    name: "SMS Notifications",
    description: "Send SMS notifications for important events",
    value: false,
    type: "boolean",
    category: "notifications",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0868",
    name: "Payment Notification Threshold",
    description: "Minimum payment amount to trigger notification",
    value: 5000,
    type: "number",
    category: "notifications",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0869",
    name: "Daily Summary Report",
    description: "Send daily summary reports to administrators",
    value: true,
    type: "boolean",
    category: "notifications",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0870",
    name: "Notification Email Template",
    description: "HTML template for email notifications",
    value: "<h1>{{title}}</h1><p>{{message}}</p>",
    type: "textarea",
    category: "notifications",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0871",
    name: "SMS API Key",
    description: "API key for SMS gateway",
    value: "",
    type: "text",
    category: "integrations",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0872",
    name: "Payment Gateway",
    description: "Default payment gateway for transactions",
    value: "PayFast",
    type: "select",
    options: ["PayFast", "PayGate", "Stripe", "PayPal"],
    category: "integrations",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0873",
    name: "CRM Integration",
    description: "Enable integration with CRM system",
    value: false,
    type: "boolean",
    category: "integrations",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0874",
    name: "Primary Color",
    description: "Primary color for UI elements",
    value: "#0f172a",
    type: "text",
    category: "appearance",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0875",
    name: "Secondary Color",
    description: "Secondary color for UI elements",
    value: "#64748b",
    type: "text",
    category: "appearance",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0876",
    name: "Dark Mode",
    description: "Enable dark mode by default",
    value: true,
    type: "boolean",
    category: "appearance",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0877",
    name: "Font Size",
    description: "Default font size for the application",
    value: "16px",
    type: "select",
    options: ["14px", "16px", "18px", "20px"],
    category: "appearance",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0878",
    name: "Payment Processing Fee",
    description: "Fee percentage for payment processing",
    value: 2.5,
    type: "number",
    category: "billing",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0879",
    name: "Invoice Prefix",
    description: "Prefix for invoice numbers",
    value: "INV-",
    type: "text",
    category: "billing",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0880",
    name: "Tax Rate",
    description: "Default tax rate percentage",
    value: 15,
    type: "number",
    category: "billing",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0881",
    name: "Session Timeout",
    description: "Session timeout in minutes. After this period of inactivity, users will be automatically logged out.",
    value: 30,
    type: "number",
    category: "security",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0882",
    name: "Password Policy",
    description: "Password requirements for all users in the system",
    value: "Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character",
    type: "textarea",
    category: "security",
  },
];

const mockApiKeys: ApiKey[] = [
  {
    id: "key1",
    name: "Payment Integration",
    key: "zim_live_pK7tNx2qLmVbRfS8gH3jD9",
    createdAt: "2025-01-15",
    lastUsed: "2025-03-13",
    permissions: ["read:payments", "write:payments"],
    status: "active",
  },
  {
    id: "key2",
    name: "Reporting API",
    key: "zim_live_aB5cD7eF9gH2jK4mN6pQ8",
    createdAt: "2024-11-20",
    lastUsed: "2025-03-10",
    permissions: ["read:reports", "read:accounts"],
    status: "active",
  },
  {
    id: "key3",
    name: "SMS Integration",
    key: "zim_live_xY3zW1vU9tS7rQ5pN3mL1",
    createdAt: "2024-09-05",
    lastUsed: "2025-02-28",
    permissions: ["read:contacts", "write:messages"],
    status: "active",
  },
  {
    id: "key4",
    name: "Legacy System",
    key: "zim_live_oP2iU8yT6rE4wQ2aS0dF9",
    createdAt: "2024-06-12",
    lastUsed: "2024-12-15",
    permissions: ["read:accounts", "write:accounts"],
    status: "expired",
  },
];

const mockWebhooks: Webhook[] = [
  {
    id: "wh1",
    name: "Payment Notification",
    url: "https://erp.zimako.co.za/api/payment-webhook",
    events: ["payment.created", "payment.updated", "payment.failed"],
    createdAt: "2024-12-10",
    lastTriggered: "2025-03-13",
    status: "active",
  },
  {
    id: "wh2",
    name: "Account Status Change",
    url: "https://crm.zimako.co.za/api/account-webhook",
    events: ["account.created", "account.status.changed"],
    createdAt: "2025-01-05",
    lastTriggered: "2025-03-12",
    status: "active",
  },
  {
    id: "wh3",
    name: "Collection Assignment",
    url: "https://teams.zimako.co.za/api/assignment-webhook",
    events: ["collection.assigned", "collection.reassigned"],
    createdAt: "2025-02-15",
    lastTriggered: "2025-03-10",
    status: "active",
  },
  {
    id: "wh4",
    name: "Test Endpoint",
    url: "https://test.zimako.co.za/api/test-webhook",
    events: ["test.event"],
    createdAt: "2025-03-01",
    lastTriggered: null,
    status: "inactive",
  },
];

const mockAuditLogs: AuditLog[] = [
  {
    id: "log1",
    action: "Settings Updated",
    user: "Admin User",
    timestamp: "2025-03-14 09:45:22",
    details: "Updated system settings: Email Notifications, SMS Provider",
    ipAddress: "196.25.102.45",
  },
  {
    id: "log2",
    action: "API Key Created",
    user: "System Admin",
    timestamp: "2025-03-13 14:30:15",
    details: "Created new API key: Reporting API",
    ipAddress: "196.25.102.45",
  },
  {
    id: "log3",
    action: "User Role Modified",
    user: "Admin User",
    timestamp: "2025-03-12 11:20:33",
    details: 'Changed role for user "John Smith" from "Agent" to "Team Leader"',
    ipAddress: "196.25.102.45",
  },
  {
    id: "log4",
    action: "Backup Initiated",
    user: "System",
    timestamp: "2025-03-12 01:00:00",
    details: "Automated system backup completed successfully",
    ipAddress: "196.25.102.45",
  },
  {
    id: "log5",
    action: "Login Failed",
    user: "Unknown",
    timestamp: "2025-03-11 16:45:12",
    details: 'Failed login attempt for username "admin" (3rd attempt)',
    ipAddress: "41.182.56.78",
  },
  {
    id: "log6",
    action: "Webhook Added",
    user: "System Admin",
    timestamp: "2025-03-10 13:15:40",
    details: "Added new webhook: Collection Assignment",
    ipAddress: "196.25.102.45",
  },
  {
    id: "log7",
    action: "System Update",
    user: "System",
    timestamp: "2025-03-09 02:30:00",
    details: "System updated to version 2.4.1",
    ipAddress: "196.25.102.45",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // State for form values
  const [formValues, setFormValues] = useState<{ [key: string]: any }>({});

  // Fetch settings on component mount
  useEffect(() => {
    const initializeSettings = async () => {
      // Skip if not in browser environment
      if (typeof window === 'undefined') return;
      
      try {
        setIsLoading(true);
        setError(null);
        setAuthError(null);

        // First, ensure the settings table exists
        const createTableResponse = await fetch('/api/settings/create-table', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!createTableResponse.ok) {
          const errorData = await createTableResponse.json();
          console.error('Failed to create settings table:', errorData);
          // Continue anyway, as the table might already exist
        }

        // Fetch all settings
        const response = await fetch('/api/settings', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch settings');
        }

        const { success, data } = await response.json();

        if (!success) {
          throw new Error('Failed to fetch settings');
        }

        // If no settings exist yet, use the mock data for initial setup
        if (!data || data.length === 0) {
          // Insert default settings from mock data using the categories from mockSystemSettings
          const categories = ["general", "security", "notifications", "integrations", "appearance", "billing"];
          
          for (const category of categories) {
            const categorySettings = mockSystemSettings.filter(s => s.category === category);
            if (categorySettings.length > 0) {
              await importedInsertDefaultSettings(category, categorySettings);
            }
          }

          // Fetch settings again
          const retryResponse = await fetch('/api/settings', {
            credentials: 'include'
          });
          const retryData = await retryResponse.json();

          if (retryData.success && retryData.data && retryData.data.length > 0) {
            setSystemSettings(retryData.data);
            initializeFormValues(retryData.data);
          } else {
            // If still no data, use mock data for display
            setSystemSettings(mockSystemSettings);
            initializeFormValues(mockSystemSettings);
          }
        } else {
          setSystemSettings(data);
          initializeFormValues(data);
        }
      } catch (error) {
        console.error('Error initializing settings:', error);
        setError('Failed to load settings. Please try again.');
        // Fall back to mock data
        setSystemSettings(mockSystemSettings);
        initializeFormValues(mockSystemSettings);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, []);

  // Initialize form values from settings
  const initializeFormValues = (settings: SystemSetting[]) => {
    const initialValues: { [key: string]: any } = {};
    settings.forEach((setting) => {
      initialValues[setting.id] = setting.value;
    });
    setFormValues(initialValues);
  };

  // Insert default settings if none exist
  const insertDefaultSettings = async () => {
    try {
      // Create default settings for each category
      const categories = ["general", "security", "notifications", "integrations", "appearance", "billing"];

      for (const category of categories) {
        const categorySettings = mockSystemSettings.filter(s => s.category === category);
        if (categorySettings.length > 0) {
          const response = await fetch('/api/settings', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category,
              settings: categorySettings.map(s => ({ id: s.id, value: s.value }))
            }),
            credentials: 'include'
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to insert default ${category} settings:`, errorData);

            // Check if it's an auth error
            if (response.status === 401 || response.status === 403) {
              setAuthError(errorData.error || 'Authentication error');
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error inserting default settings:', error);
    }
  };

  const handleInputChange = (
    settingId: string,
    value: string | boolean | number
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [settingId]: value,
    }));
  };

  // Update handler functions to work with Supabase
  const handleSaveSettings = async (category: string) => {
    try {
      setIsSaving(true);
      setAuthError(null);

      // Get all settings for this category
      const categorySettings = systemSettings.filter(
        (setting) => setting.category === category
      );

      // Prepare settings updates
      const settingsToUpdate = categorySettings.map((setting) => ({
        id: setting.id,
        value: formValues[setting.id]
      }));

      // Call the API to update settings
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          settings: settingsToUpdate
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle authentication errors specifically
        if (response.status === 401) {
          setAuthError('You must be logged in to update settings');
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          setAuthError('You must have admin privileges to update settings');
          throw new Error('Admin privileges required');
        }

        throw new Error(errorData.error || 'Failed to update settings');
      }

      const { success } = await response.json();

      if (!success) {
        throw new Error('Failed to update settings');
      }

      // Update local state with new values
      setSystemSettings(prev => 
        prev.map(setting => 
          settingsToUpdate.some(s => s.id === setting.id)
            ? { ...setting, value: formValues[setting.id] }
            : setting
        )
      );

      toast.success(
        `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } settings have been updated successfully.`,
        {
          description: "Your changes have been saved to the database.",
        }
      );
    } catch (error) {
      console.error(`Error saving ${category} settings:`, error);

      if (!authError) {
        toast.error(`Failed to save ${category} settings`, {
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      } else {
        toast.error('Authentication Error', {
          description: authError,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = () => {
    setIsBackupInProgress(true);

    // Simulate backup process
    setTimeout(() => {
      setIsBackupInProgress(false);
      toast.success("System backup has been created successfully.", {
        description: "Your backup is ready to download.",
      });
    }, 3000);
  };

  const handleApiKeyRevoke = (keyId: string) => {
    // In a real app, this would call an API to revoke the key
    toast.success("API key revoked", {
      description: "The API key has been revoked successfully.",
    });
  };

  const handleWebhookStatusToggle = (
    webhookId: string,
    newStatus: "active" | "inactive"
  ) => {
    // In a real app, this would update the webhook status
    toast.success("Webhook updated", {
      description: `Webhook status changed to ${newStatus}.`,
    });
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case "text":
        return (
          <Input
            id={setting.id}
            value={formValues[setting.id] as string}
            onChange={(e) => handleInputChange(setting.id, e.target.value)}
          />
        );
      case "number":
        return (
          <Input
            id={setting.id}
            type="number"
            value={formValues[setting.id] as number}
            onChange={(e) =>
              handleInputChange(setting.id, parseFloat(e.target.value))
            }
          />
        );
      case "boolean":
        return (
          <Switch
            id={setting.id}
            checked={formValues[setting.id] as boolean}
            onCheckedChange={(checked) =>
              handleInputChange(setting.id, checked)
            }
          />
        );
      case "select":
        return (
          <Select
            value={formValues[setting.id] as string}
            onValueChange={(value) => handleInputChange(setting.id, value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "textarea":
        return (
          <Textarea
            id={setting.id}
            value={formValues[setting.id] as string}
            onChange={(e) => handleInputChange(setting.id, e.target.value)}
            rows={3}
          />
        );
      default:
        return null;
    }
  };

  const renderSettingsForCategory = (category: string) => {
    const categorySettings = systemSettings.filter(
      (setting) => setting.category === category
    );

    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading settings...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (authError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      );
    }

    if (categorySettings.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No settings found for this category.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {categorySettings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={setting.id} className="text-sm font-medium">
                {setting.name}
              </Label>
              {setting.type === "boolean" && renderSettingInput(setting)}
            </div>
            <div className={setting.type !== "boolean" ? "mt-1" : "hidden"}>
              {setting.type !== "boolean" && renderSettingInput(setting)}
            </div>
            <p className="text-xs text-muted-foreground">
              {setting.description}
            </p>
          </div>
        ))}

        <Button 
          onClick={() => handleSaveSettings(category)}
          disabled={isSaving || !!authError}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save {category.charAt(0).toUpperCase() + category.slice(1)} Settings
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure and manage your debt collection management system
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 md:grid-cols-7 lg:w-[800px]">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic configuration for your debt collection system
              </CardDescription>
            </CardHeader>
            <CardContent>{renderSettingsForCategory("general")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Session Timeout Setting */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="session-timeout" className="text-sm font-medium">
                      Session Timeout
                    </Label>
                  </div>
                  <div className="mt-1">
                    <Input
                      id="session-timeout"
                      type="number"
                      min="5"
                      max="120"
                      value={
                        systemSettings.find(s => s.name === "Session Timeout")
                          ? formValues[systemSettings.find(s => s.name === "Session Timeout")?.id || ""]
                          : 30
                      }
                      onChange={(e) => {
                        const setting = systemSettings.find(s => s.name === "Session Timeout");
                        if (setting) {
                          handleInputChange(setting.id, parseInt(e.target.value));
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Session timeout in minutes. After this period of inactivity, users will be automatically logged out.
                  </p>
                </div>

                {/* Password Policy Setting */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-policy" className="text-sm font-medium">
                      Password Policy
                    </Label>
                  </div>
                  <div className="mt-1">
                    <Textarea
                      id="password-policy"
                      rows={3}
                      value={
                        systemSettings.find(s => s.name === "Password Policy")
                          ? formValues[systemSettings.find(s => s.name === "Password Policy")?.id || ""]
                          : "Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character"
                      }
                      onChange={(e) => {
                        const setting = systemSettings.find(s => s.name === "Password Policy");
                        if (setting) {
                          handleInputChange(setting.id, e.target.value);
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password requirements for all users in the system.
                  </p>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={() => handleSaveSettings("security")}
                  disabled={isSaving || !!authError}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Security Settings
                    </>
                  )}
                </Button>
                
                {/* Separator */}
                <Separator className="my-6" />
                
                {/* Change Password Form */}
                <div className="mt-6">
                  <ChangePasswordForm />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate New API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Generate a new API key for integration with external
                        services
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiKeyName">Key Name</Label>
                        <Input
                          id="apiKeyName"
                          placeholder="e.g., Payment Gateway Integration"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="perm1" />
                            <label htmlFor="perm1" className="text-sm">
                              read:accounts
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="perm2" />
                            <label htmlFor="perm2" className="text-sm">
                              write:accounts
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="perm3" />
                            <label htmlFor="perm3" className="text-sm">
                              read:payments
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="perm4" />
                            <label htmlFor="perm4" className="text-sm">
                              write:payments
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="perm5" />
                            <label htmlFor="perm5" className="text-sm">
                              read:reports
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="perm6" />
                            <label htmlFor="perm6" className="text-sm">
                              read:contacts
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="perm7" />
                            <label htmlFor="perm7" className="text-sm">
                              write:messages
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">
                          Expiry Date (Optional)
                        </Label>
                        <Input
                          id="expiryDate"
                          type="date"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button>Generate Key</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apiKey.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {apiKey.permissions.join(", ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {apiKey.key.substring(0, 10)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 ml-2"
                        >
                          <span className="sr-only">Copy</span>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{apiKey.createdAt}</TableCell>
                      <TableCell>{apiKey.lastUsed || "Never"}</TableCell>
                      <TableCell>
                        {apiKey.status === "active" && (
                          <Badge className="bg-green-500">Active</Badge>
                        )}
                        {apiKey.status === "expired" && (
                          <Badge variant="outline">Expired</Badge>
                        )}
                        {apiKey.status === "revoked" && (
                          <Badge variant="destructive">Revoked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {apiKey.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApiKeyRevoke(apiKey.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSettingsForCategory("notifications")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Customize the content of system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      Payment Confirmation
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Template for payment receipt notifications
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Payment Reminder</h3>
                    <p className="text-xs text-muted-foreground">
                      Template for upcoming payment reminders
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      Account Status Change
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Template for account status updates
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      Collection Assignment
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Template for new collection assignments
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure third-party service integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSettingsForCategory("integrations")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Manage webhook endpoints for real-time data updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Webhook</DialogTitle>
                      <DialogDescription>
                        Create a new webhook endpoint to receive real-time
                        updates
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhookName">Webhook Name</Label>
                        <Input
                          id="webhookName"
                          placeholder="e.g., Payment Notification"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhookUrl">Endpoint URL</Label>
                        <Input
                          id="webhookUrl"
                          placeholder="https://your-endpoint.com/webhook"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Events to Subscribe</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="event1" />
                            <label htmlFor="event1" className="text-sm">
                              payment.created
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="event2" />
                            <label htmlFor="event2" className="text-sm">
                              payment.updated
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="event3" />
                            <label htmlFor="event3" className="text-sm">
                              payment.failed
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="event4" />
                            <label htmlFor="event4" className="text-sm">
                              account.created
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="event5" />
                            <label htmlFor="event5" className="text-sm">
                              account.status.changed
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="event6" />
                            <label htmlFor="event6" className="text-sm">
                              collection.assigned
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="event7" />
                            <label htmlFor="event7" className="text-sm">
                              collection.reassigned
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secretKey">Secret Key (Optional)</Label>
                        <Input
                          id="secretKey"
                          type="password"
                          placeholder="Webhook secret for verification"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button>Create Webhook</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWebhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">
                        {webhook.name}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {webhook.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge
                              key={event}
                              variant="outline"
                              className="text-xs"
                            >
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{webhook.lastTriggered || "Never"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge
                            className={
                              webhook.status === "active"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }
                          >
                            {webhook.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleWebhookStatusToggle(
                                webhook.id,
                                webhook.status === "active"
                                  ? "inactive"
                                  : "active"
                              )
                            }
                          >
                            {webhook.status === "active" ? "Disable" : "Enable"}
                          </Button>
                          <Button variant="outline" size="sm">
                            Test
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSettingsForCategory("appearance")}

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md bg-primary flex items-center justify-center">
                        <span className="text-white font-bold">Logo</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Zimako DCMS</h3>
                        <p className="text-sm text-muted-foreground">
                          Debt Collection Management System
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="bg-primary text-primary-foreground p-2 rounded-md text-center">
                        Primary
                      </div>
                      <div className="bg-secondary text-secondary-foreground p-2 rounded-md text-center">
                        Secondary
                      </div>
                      <div className="bg-accent text-accent-foreground p-2 rounded-md text-center">
                        Accent
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Custom CSS</Label>
                  <Textarea
                    placeholder=":root { --custom-color: #ff0000; }"
                    className="font-mono text-sm"
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add custom CSS to override default styles. Changes will
                    apply system-wide.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Upload Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md border flex items-center justify-center">
                      <Image src="/placeholder-logo.png" width={32} height={32} className="h-8 w-8 text-muted-foreground" alt="Company logo" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Logo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveSettings("appearance")}>
                <Save className="h-4 w-4 mr-2" />
                Save Appearance Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Configure billing and payment options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSettingsForCategory("billing")}

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Late Fee Structure
                  </Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch id="enableLateFees" checked={true} />
                        <Label htmlFor="enableLateFees">Enable Late Fees</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lateFeeType">Fee Type</Label>
                        <Select defaultValue="percentage">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lateFeeAmount">Amount</Label>
                        <div className="flex items-center">
                          <Input
                            id="lateFeeAmount"
                            type="number"
                            defaultValue="5"
                          />
                          <span className="ml-2">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Methods</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="method1" checked />
                      <label htmlFor="method1" className="text-sm">
                        Bank Transfer
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="method2" checked />
                      <label htmlFor="method2" className="text-sm">
                        Credit Card
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="method3" checked />
                      <label htmlFor="method3" className="text-sm">
                        Debit Card
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="method4" checked />
                      <label htmlFor="method4" className="text-sm">
                        Cash
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="method5" />
                      <label htmlFor="method5" className="text-sm">
                        Mobile Money
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveSettings("billing")}>
                <Save className="h-4 w-4 mr-2" />
                Save Billing Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>
                Backup, restore, and maintain your system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">System Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Version</p>
                    <p className="font-medium">2.4.1</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">March 9, 2025</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Database Size</p>
                    <p className="font-medium">1.2 GB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Users</p>
                    <p className="font-medium">24</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Backup & Restore</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Create System Backup</p>
                      <p className="text-xs text-muted-foreground">
                        Backup all system data including accounts, payments, and
                        settings
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleBackup}
                      disabled={isBackupInProgress}
                    >
                      {isBackupInProgress ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Backing up...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Create Backup
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Restore from Backup</p>
                      <p className="text-xs text-muted-foreground">
                        Restore system from a previous backup file
                      </p>
                    </div>
                    <Dialog
                      open={isRestoreDialogOpen}
                      onOpenChange={setIsRestoreDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Restore System</DialogTitle>
                          <DialogDescription>
                            Warning: This will replace all current data with the
                            backup data. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Caution</AlertTitle>
                            <AlertDescription>
                              All current data will be overwritten by the backup
                              data. Make sure you have a backup of your current
                              system before proceeding.
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-2">
                            <Label htmlFor="backupFile">
                              Select Backup File
                            </Label>
                            <Input id="backupFile" type="file" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsRestoreDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button variant="destructive">Restore System</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">System Logs</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockAuditLogs.slice(0, 5).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.action}
                          </TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>{log.timestamp}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {log.details}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <Button variant="link" size="sm">
                    View All Logs
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">System Maintenance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Clear Cache</p>
                      <p className="text-xs text-muted-foreground">
                        Clear system cache to improve performance
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Clear Cache
                    </Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Optimize Database</p>
                      <p className="text-xs text-muted-foreground">
                        Run database optimization to improve performance
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Optimize
                    </Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Check for Updates</p>
                      <p className="text-xs text-muted-foreground">
                        Check for system updates and security patches
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Check Updates
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
