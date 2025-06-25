// app/user/settings/page.tsx
"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  Info,
  Key,
  Languages,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Moon,
  Phone,
  Save,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Trash2,
  Edit,
  MoreHorizontal
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  jobTitle: z.string().min(2, {
    message: "Job title must be at least 2 characters.",
  }),
  bio: z.string().max(500, {
    message: "Bio must not be longer than 500 characters.",
  }),
  language: z.string(),
  timezone: z.string(),
});

const securityFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  paymentReminders: z.boolean(),
  newDebtorAssignments: z.boolean(),
  campaignUpdates: z.boolean(),
  systemAnnouncements: z.boolean(),
  teamMessages: z.boolean(),
});

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  colorScheme: z.enum(["default", "blue", "green", "purple", "orange"]),
  reducedMotion: z.boolean(),
  compactMode: z.boolean(),
});

// Mock user data
const userData = {
  id: "user-001",
  name: "Thabo Mokoena",
  email: "thabo.mokoena@zimako.co.za",
  phone: "+27 73 123 4567",
  jobTitle: "Senior Debt Collection Agent",
  avatar: "/avatars/thabo.png",
  bio: "Experienced debt collection professional with 8+ years in the financial services industry. Specialized in high-value debt recovery and negotiation.",
  language: "en",
  timezone: "Africa/Johannesburg",
  role: "agent",
  team: "Financial Services",
  joinDate: "2022-05-15",
  lastActive: "2025-03-09T14:30:00",
  twoFactorEnabled: true,
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    paymentReminders: true,
    newDebtorAssignments: true,
    campaignUpdates: true,
    systemAnnouncements: true,
    teamMessages: true,
  },
  appearance: {
    theme: "system",
    fontSize: "medium",
    colorScheme: "default",
    reducedMotion: false,
    compactMode: false,
  },
  stats: {
    assignedDebtors: 412,
    activeCampaigns: 3,
    collectionRate: 32,
    totalCollected: 4250000,
    callsMade: 1876,
    successfulCalls: 945,
  },
  apiKeys: [
    {
      id: "key-001",
      name: "Mobile App",
      key: "••••••••••••••••",
      created: "2024-11-10T09:00:00",
      lastUsed: "2025-03-08T16:45:00",
    },
    {
      id: "key-002",
      name: "Personal Integration",
      key: "••••••••••••••••",
      created: "2025-01-22T14:30:00",
      lastUsed: "2025-03-07T11:20:00",
    },
  ],
  sessions: [
    {
      id: "session-001",
      device: "Windows PC - Chrome",
      ip: "196.25.XX.XX",
      location: "Johannesburg, South Africa",
      lastActive: "2025-03-09T14:30:00",
      current: true,
    },
    {
      id: "session-002",
      device: "iPhone 15 - Safari",
      ip: "105.12.XX.XX",
      location: "Pretoria, South Africa",
      lastActive: "2025-03-09T08:15:00",
      current: false,
    },
    {
      id: "session-003",
      device: "MacBook Pro - Firefox",
      ip: "196.25.XX.XX",
      location: "Johannesburg, South Africa",
      lastActive: "2025-03-08T19:45:00",
      current: false,
    },
  ],
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Format time
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false);
  const [isCreateApiKeyDialogOpen, setIsCreateApiKeyDialogOpen] =
    useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [generatedApiKey, setGeneratedApiKey] = useState("");

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      jobTitle: userData.jobTitle,
      bio: userData.bio,
      language: userData.language,
      timezone: userData.timezone,
    },
  });

  // Security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification form
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: userData.notifications.emailNotifications,
      smsNotifications: userData.notifications.smsNotifications,
      pushNotifications: userData.notifications.pushNotifications,
      paymentReminders: userData.notifications.paymentReminders,
      newDebtorAssignments: userData.notifications.newDebtorAssignments,
      campaignUpdates: userData.notifications.campaignUpdates,
      systemAnnouncements: userData.notifications.systemAnnouncements,
      teamMessages: userData.notifications.teamMessages,
    },
  });

  // Appearance form
  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: userData.appearance.theme as "light" | "dark" | "system",
      fontSize: userData.appearance.fontSize as "small" | "medium" | "large",
      colorScheme: userData.appearance.colorScheme as
        | "default"
        | "blue"
        | "green"
        | "purple"
        | "orange",
      reducedMotion: userData.appearance.reducedMotion,
      compactMode: userData.appearance.compactMode,
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    console.log("Profile form submitted:", data);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    console.log("Security form submitted:", data);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
    securityForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const onNotificationSubmit = (
    data: z.infer<typeof notificationFormSchema>
  ) => {
    console.log("Notification form submitted:", data);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const onAppearanceSubmit = (data: z.infer<typeof appearanceFormSchema>) => {
    console.log("Appearance form submitted:", data);
    setTheme(data.theme);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  // Generate API key
  const handleGenerateApiKey = () => {
    if (!newApiKeyName) return;

    // Generate a random API key (this is just for demonstration)
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    setGeneratedApiKey(result);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback>
              {userData.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{userData.name}</div>
            <div className="text-sm text-muted-foreground">
              {userData.email}
            </div>
          </div>
        </div>
      </div>

      {showSuccessAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your settings have been saved successfully.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === "security" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
                <Button
                  variant={activeTab === "appearance" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("appearance")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Appearance
                </Button>
                <Button
                  variant={activeTab === "api" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("api")}
                >
                  <Key className="mr-2 h-4 w-4" />
                  API Keys
                </Button>
                <Button
                  variant={activeTab === "sessions" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("sessions")}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Agent Stats</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Assigned Debtors
                  </span>
                  <span className="font-medium">
                    {userData.stats.assignedDebtors}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Campaigns
                  </span>
                  <span className="font-medium">
                    {userData.stats.activeCampaigns}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Collection Rate
                  </span>
                  <span className="font-medium">
                    {userData.stats.collectionRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Collected
                  </span>
                  <span className="font-medium">
                    {formatCurrency(userData.stats.totalCollected)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Calls Made
                  </span>
                  <span className="font-medium">
                    {userData.stats.callsMade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Successful Calls
                  </span>
                  <span className="font-medium">
                    {userData.stats.successfulCalls}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-800">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setIsDeleteAccountDialogOpen(true)}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-col items-center space-y-2">
                        <Avatar className="h-24 w-24 border">
                          <AvatarImage
                            src={userData.avatar}
                            alt={userData.name}
                          />
                          <AvatarFallback>
                            {userData.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your phone number"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="jobTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your job title"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about yourself"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Brief description for your profile. Maximum 500
                                characters.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="af">
                                      Afrikaans
                                    </SelectItem>
                                    <SelectItem value="zu">isiZulu</SelectItem>
                                    <SelectItem value="xh">isiXhosa</SelectItem>
                                    <SelectItem value="st">Sesotho</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="timezone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timezone</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Africa/Johannesburg">
                                      Africa/Johannesburg (SAST)
                                    </SelectItem>
                                    <SelectItem value="Africa/Lagos">
                                      Africa/Lagos (WAT)
                                    </SelectItem>
                                    <SelectItem value="Africa/Nairobi">
                                      Africa/Nairobi (EAT)
                                    </SelectItem>
                                    <SelectItem value="Europe/London">
                                      Europe/London (GMT)
                                    </SelectItem>
                                    <SelectItem value="America/New_York">
                                      America/New_York (EST)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...securityForm}>
                  <form
                    onSubmit={securityForm.handleSubmit(onSecuritySubmit)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 8 characters and include
                              a mix of letters, numbers, and symbols.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Two-Factor Authentication
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Two-Factor Authentication
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="twoFactor"
                            checked={userData.twoFactorEnabled}
                          />
                          <Label htmlFor="twoFactor">
                            {userData.twoFactorEnabled ? "Enabled" : "Disabled"}
                          </Label>
                        </div>
                      </div>
                      {userData.twoFactorEnabled && (
                        <Button variant="outline">Reconfigure 2FA</Button>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form
                    onSubmit={notificationForm.handleSubmit(
                      onNotificationSubmit
                    )}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Notification Channels
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Email
                                </FormLabel>
                                <FormDescription>
                                  Receive notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="smsNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">SMS</FormLabel>
                                <FormDescription>
                                  Receive notifications via SMS
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Push
                                </FormLabel>
                                <FormDescription>
                                  Receive push notifications
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-4 mt-6">
                      <h3 className="text-lg font-medium">
                        Notification Types
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="paymentReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Payment Reminders
                                </FormLabel>
                                <FormDescription>
                                  Notifications about payment due dates and
                                  reminders
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="newDebtorAssignments"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  New Debtor Assignments
                                </FormLabel>
                                <FormDescription>
                                  Notifications when new debtors are assigned to
                                  you
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="campaignUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Campaign Updates
                                </FormLabel>
                                <FormDescription>
                                  Updates about campaigns you're participating
                                  in
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="systemAnnouncements"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  System Announcements
                                </FormLabel>
                                <FormDescription>
                                  Important system-wide announcements
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="teamMessages"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Team Messages
                                </FormLabel>
                                <FormDescription>
                                  Messages from your team and supervisors
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appearanceForm}>
                  <form
                    onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={appearanceForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <div className="grid grid-cols-3 gap-4 pt-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-all ${
                                        field.value === "light"
                                          ? "border-primary bg-primary/10"
                                          : ""
                                      }`}
                                      onClick={() => field.onChange("light")}
                                    >
                                      <Sun className="h-6 w-6 mb-2" />
                                      <span>Light</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Light mode</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-all ${
                                        field.value === "dark"
                                          ? "border-primary bg-primary/10"
                                          : ""
                                      }`}
                                      onClick={() => field.onChange("dark")}
                                    >
                                      <Moon className="h-6 w-6 mb-2" />
                                      <span>Dark</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Dark mode</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-all ${
                                        field.value === "system"
                                          ? "border-primary bg-primary/10"
                                          : ""
                                      }`}
                                      onClick={() => field.onChange("system")}
                                    >
                                      <Settings className="h-6 w-6 mb-2" />
                                      <span>System</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Follow system preference</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormDescription>
                              Choose between light, dark, or system preference
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={appearanceForm.control}
                        name="fontSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Size</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select font size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Adjust the font size for better readability
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={appearanceForm.control}
                        name="colorScheme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Scheme</FormLabel>
                            <div className="grid grid-cols-5 gap-4 pt-2">
                              <div
                                className={`h-10 rounded-md bg-primary cursor-pointer border-2 ${
                                  field.value === "default"
                                    ? "border-black dark:border-white"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange("default")}
                              />
                              <div
                                className={`h-10 rounded-md bg-blue-600 cursor-pointer border-2 ${
                                  field.value === "blue"
                                    ? "border-black dark:border-white"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange("blue")}
                              />
                              <div
                                className={`h-10 rounded-md bg-green-600 cursor-pointer border-2 ${
                                  field.value === "green"
                                    ? "border-black dark:border-white"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange("green")}
                              />
                              <div
                                className={`h-10 rounded-md bg-purple-600 cursor-pointer border-2 ${
                                  field.value === "purple"
                                    ? "border-black dark:border-white"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange("purple")}
                              />
                              <div
                                className={`h-10 rounded-md bg-orange-600 cursor-pointer border-2 ${
                                  field.value === "orange"
                                    ? "border-black dark:border-white"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange("orange")}
                              />
                            </div>
                            <FormDescription>
                              Choose your preferred color scheme
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={appearanceForm.control}
                          name="reducedMotion"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Reduced Motion
                                </FormLabel>
                                <FormDescription>
                                  Minimize animations throughout the interface
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={appearanceForm.control}
                          name="compactMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Compact Mode
                                </FormLabel>
                                <FormDescription>
                                  Reduce spacing to show more content
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* API Keys */}
          {activeTab === "api" && (
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for external integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Your API Keys</h3>
                    <p className="text-sm text-muted-foreground">
                      These keys allow secure access to the Zimako DCMS API
                    </p>
                  </div>
                  <Button onClick={() => setIsCreateApiKeyDialogOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Create New Key
                  </Button>
                </div>

                <div className="space-y-4">
                  {userData.apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div>
                        <div className="font-medium">{apiKey.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created: {formatDate(apiKey.created)} • Last used:{" "}
                          {formatDate(apiKey.lastUsed)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-mono bg-muted p-1 rounded">
                          {apiKey.key}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Sessions */}
          {activeTab === "sessions" && (
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active sessions across different devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {userData.sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-start justify-between p-4 border rounded-md ${
                        session.current ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="mt-1">
                          {session.device.includes("Windows") ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-monitor"
                            >
                              <rect width="20" height="14" x="2" y="3" rx="2" />
                              <line x1="8" x2="16" y1="21" y2="21" />
                              <line x1="12" x2="12" y1="17" y2="21" />
                            </svg>
                          ) : session.device.includes("iPhone") ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-smartphone"
                            >
                              <rect
                                width="14"
                                height="20"
                                x="5"
                                y="2"
                                rx="2"
                                ry="2"
                              />
                              <path d="M12 18h.01" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-laptop"
                            >
                              <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {session.device}
                            {session.current && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-primary/10"
                              >
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.location} • IP: {session.ip}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Last active: {formatDate(session.lastActive)} at{" "}
                            {formatTime(session.lastActive)}
                          </div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          End Session
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog
        open={isDeleteAccountDialogOpen}
        onOpenChange={setIsDeleteAccountDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                All your personal data, settings, and history will be
                permanently deleted.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Label htmlFor="confirm-delete">Type "DELETE" to confirm</Label>
              <Input
                id="confirm-delete"
                className="mt-2"
                placeholder="DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive">Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog
        open={isCreateApiKeyDialogOpen}
        onOpenChange={setIsCreateApiKeyDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for secure access to the Zimako DCMS API.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key-name">API Key Name</Label>
              <Input
                id="api-key-name"
                placeholder="e.g., Mobile App Integration"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Give your API key a descriptive name to remember what it's used
                for.
              </p>
            </div>

            {generatedApiKey && (
              <div className="space-y-2 p-3 border rounded-md bg-muted">
                <Label>Your New API Key</Label>
                <div className="flex items-center">
                  <Input
                    readOnly
                    value={generatedApiKey}
                    className="font-mono text-xs"
                  />
                  <Button variant="ghost" size="icon" className="ml-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-copy"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </Button>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Save this key now! You won't be able to see it again.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateApiKeyDialogOpen(false)}
            >
              Cancel
            </Button>
            {!generatedApiKey ? (
              <Button onClick={handleGenerateApiKey} disabled={!newApiKeyName}>
                Generate Key
              </Button>
            ) : (
              <Button onClick={() => setIsCreateApiKeyDialogOpen(false)}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}