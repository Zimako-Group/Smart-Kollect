"use client";

import React, { useState } from "react";
import { 
  Book, 
  Code, 
  Database, 
  Phone, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Shield, 
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Github,
  Globe,
  Mail,
  FileText,
  Layers,
  Settings,
  CreditCard,
  Bell,
  Activity,
  Brain,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamically import Mermaid to avoid SSR issues
const Mermaid = dynamic(() => import("@/components/ui/mermaid"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-800/50 rounded-lg animate-pulse" />
});

export default function DocumentationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const architectureDiagram = `
    graph TB
        A["Client Browser"] --> B["Next.js Frontend"]
        B --> C["API Routes"]
        C --> D["Supabase Database"]
        C --> E["BuzzBox Telephony"]
        C --> F["Infobip SMS"]
        C --> G["SendGrid Email"]
        
        D --> H["Real-time Subscriptions"]
        H --> B
        
        B --> I["Redux Store"]
        B --> J["React Context"]
        
        K["Agent Dashboard"] --> B
        L["Metrics Dashboard"] --> B
        M["Customer Management"] --> B
        N["PTP System"] --> B
        
        classDef clientClass fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#ffffff
        classDef frontendClass fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:#ffffff
        classDef databaseClass fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff
        classDef integrationClass fill:#dc2626,stroke:#991b1b,stroke-width:2px,color:#ffffff
        classDef serviceClass fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#ffffff
        
        class A clientClass
        class B,I,J frontendClass
        class D,H databaseClass
        class E,F,G integrationClass
        class C,K,L,M,N serviceClass
  `;

  const dataFlowDiagram = `
    sequenceDiagram
        participant A as Agent
        participant F as Frontend
        participant API as API Layer
        participant DB as Supabase
        participant SMS as Infobip SMS
        participant TEL as BuzzBox
        
        Note over A,TEL: Promise-to-Pay Creation Flow
        A->>F: Create PTP
        F->>API: POST /api/ptp
        API->>DB: Insert PTP record
        DB-->>API: Return PTP data
        API->>SMS: Send confirmation SMS
        SMS-->>API: SMS delivery status
        API-->>F: PTP created response
        F-->>A: Success notification
        
        Note over A,TEL: Call Management Flow
        A->>F: Initiate call
        F->>TEL: Start call session
        TEL-->>F: Call status updates
        F->>API: Log call activity
        API->>DB: Store call record
        DB-->>API: Confirm storage
        API-->>F: Activity logged
  `;

  const multiTenantFlowDiagram = `
    flowchart TD
        A[User visits subdomain] --> B{Extract subdomain}
        B --> C[mahikeng.smartkollect.co.za]
        B --> D[triplem.smartkollect.co.za]
        B --> E[smartkollect.co.za]
        
        C --> F[Middleware validates Mahikeng tenant]
        D --> G[Middleware validates Triple M tenant]
        E --> H[Landing page - no tenant context]
        
        F --> I{User authenticated?}
        G --> J{User authenticated?}
        
        I -->|No| K[Redirect to login]
        I -->|Yes| L[Check user tenant membership]
        J -->|No| M[Redirect to login]
        J -->|Yes| N[Check user tenant membership]
        
        L --> O{User belongs to Mahikeng?}
        N --> P{User belongs to Triple M?}
        
        O -->|Yes| Q[Set tenant context]
        O -->|No| R[Redirect to correct tenant]
        P -->|Yes| S[Set tenant context]
        P -->|No| T[Redirect to correct tenant]
        
        Q --> U[Apply RLS policies]
        S --> V[Apply RLS policies]
        
        U --> W[Access Mahikeng data only]
        V --> X[Access Triple M data only]
        
        style C fill:#3b82f6,stroke:#1e40af,color:#fff
        style D fill:#8b5cf6,stroke:#7c3aed,color:#fff
        style E fill:#10b981,stroke:#059669,color:#fff
        style W fill:#3b82f6,stroke:#1e40af,color:#fff
        style X fill:#8b5cf6,stroke:#7c3aed,color:#fff
  `;

  const aiAnalysisFlowDiagram = `
    sequenceDiagram
        participant A as Agent
        participant F as Frontend
        participant API as API Layer
        participant AI as Anthropic Claude
        participant DB as Supabase
        
        Note over A,AI: AI Customer Profile Analysis Flow
        A->>F: Click "Analyze Profile"
        F->>F: Open AI Analysis Dialog
        F->>API: POST /api/analyze-profile
        Note over API: Prepare customer data
        API->>DB: Fetch customer details
        API->>DB: Fetch account history
        API->>DB: Fetch payment history
        DB-->>API: Return customer data
        
        Note over API,AI: AI Processing
        API->>AI: Send structured prompt
        Note over AI: Analyze customer profile<br/>Generate insights<br/>Calculate risk score
        AI-->>API: Return structured analysis
        
        Note over API: Validate & format response
        API-->>F: Return analysis results
        F->>F: Display comprehensive insights
        F-->>A: Show AI recommendations
        
        Note over A: Agent reviews insights<br/>Makes informed decisions<br/>Takes recommended actions
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <Book className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SmartKollect Documentation
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Comprehensive documentation for the intelligent debt collection management platform. 
              Learn how to leverage SmartKollect's powerful features to optimize your collection operations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => window.open('https://github.com/smartkollect', '_blank')}
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Navigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: FileText },
                    { id: 'multi-tenant', label: 'Multi-Tenant', icon: Users },
                    { id: 'architecture', label: 'Architecture', icon: Layers },
                    { id: 'features', label: 'Features', icon: Zap },
                    { id: 'api', label: 'API Reference', icon: Code },
                    { id: 'integration', label: 'Integrations', icon: Settings },
                    { id: 'deployment', label: 'Deployment', icon: Globe },
                  ].map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                      onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Documentation Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Overview Section */}
            <section id="overview" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-400" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300 text-lg leading-relaxed">
                    SmartKollect is a comprehensive debt collection management system built with modern web technologies. 
                    It provides debt collection agencies and financial institutions with powerful tools to manage debtors, 
                    track payments, arrange settlements, and monitor agent performance in real-time.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30">
                      <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Real-time Operations
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Live call tracking, instant metrics updates, and real-time agent monitoring.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/30">
                      <h3 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Enterprise Security
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Row-level security, role-based access control, and secure API integrations.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Technology Stack</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { name: 'Next.js 15', type: 'Frontend' },
                        { name: 'Supabase', type: 'Database' },
                        { name: 'TypeScript', type: 'Language' },
                        { name: 'Tailwind CSS', type: 'Styling' },
                        { name: 'BuzzBox API', type: 'Telephony' },
                        { name: 'Infobip SMS', type: 'Messaging' },
                        { name: 'Redux Toolkit', type: 'State' },
                        { name: 'Framer Motion', type: 'Animation' },
                      ].map((tech) => (
                        <div key={tech.name} className="text-center">
                          <Badge variant="outline" className="border-slate-600 text-slate-300 mb-1">
                            {tech.name}
                          </Badge>
                          <p className="text-xs text-slate-500">{tech.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Multi-Tenant Section */}
            <section id="multi-tenant" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <Users className="h-6 w-6 text-purple-400" />
                    Multi-Tenant Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300 text-lg leading-relaxed">
                    SmartKollect implements a robust multi-tenant architecture with subdomain-based tenant isolation. 
                    Each organization operates in a completely isolated environment while sharing the same infrastructure.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-400" />
                        Current Tenants
                      </h3>
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30">
                          <h4 className="font-semibold text-blue-300 mb-1">Mahikeng Local Municipality</h4>
                          <p className="text-slate-400 text-sm mb-2">Municipal debt collection operations</p>
                          <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                            mahikeng.smartkollect.co.za
                          </Badge>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-700/30">
                          <h4 className="font-semibold text-purple-300 mb-1">Triple M Financial Services</h4>
                          <p className="text-slate-400 text-sm mb-2">Commercial debt recovery solutions</p>
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                            triplem.smartkollect.co.za
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        <Layers className="h-5 w-5 text-orange-400" />
                        Key Features
                      </h3>
                      <div className="space-y-3">
                        {[
                          { title: 'Data Isolation', desc: 'Complete separation of tenant data using RLS policies' },
                          { title: 'Subdomain Routing', desc: 'Automatic tenant detection via subdomain' },
                          { title: 'Shared Infrastructure', desc: 'Cost-effective resource utilization' },
                          { title: 'Scalable Design', desc: 'Easy addition of new tenants' },
                        ].map((feature, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
                            <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                            <div>
                              <h5 className="font-medium text-slate-200">{feature.title}</h5>
                              <p className="text-sm text-slate-400">{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      Multi-Tenant Flow Diagram
                    </h3>
                    <Mermaid chart={multiTenantFlowDiagram} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/30">
                      <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database Level
                      </h4>
                      <p className="text-slate-400 text-sm">
                        Row-Level Security (RLS) policies ensure complete data isolation between tenants at the database level.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30">
                      <h4 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Application Level
                      </h4>
                      <p className="text-slate-400 text-sm">
                        Middleware validates tenant membership and sets context for all database operations.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-700/30">
                      <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Level
                      </h4>
                      <p className="text-slate-400 text-sm">
                        Users are automatically routed to their tenant subdomain and can only access their organization's data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Architecture Section */}
            <section id="architecture" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <Layers className="h-6 w-6 text-purple-400" />
                    System Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300">
                    SmartKollect follows a modern, scalable architecture with clear separation of concerns 
                    and real-time capabilities built into the core.
                  </p>

                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Architecture</TabsTrigger>
                      <TabsTrigger value="dataflow" className="data-[state=active]:bg-slate-700">Data Flow</TabsTrigger>
                      <TabsTrigger value="ai-flow" className="data-[state=active]:bg-slate-700">AI Analysis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-6">
                      <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">System Architecture Overview</h3>
                        <Mermaid chart={architectureDiagram} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="dataflow" className="mt-6">
                      <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Data Flow Sequence</h3>
                        <Mermaid chart={dataFlowDiagram} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="ai-flow" className="mt-6">
                      <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                          <Brain className="h-5 w-5 text-purple-400" />
                          AI Customer Profile Analysis Flow
                          <Sparkles className="h-4 w-4 text-yellow-400" />
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                          Powered by Anthropic Claude-4-sonnet for intelligent customer insights and collection strategy recommendations.
                        </p>
                        <Mermaid chart={aiAnalysisFlowDiagram} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </section>

            {/* Features Section */}
            <section id="features" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <Zap className="h-6 w-6 text-yellow-400" />
                    Core Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        icon: Users,
                        title: "Customer Management",
                        description: "Comprehensive debtor profiles with account history, payment tracking, and interaction logs.",
                        features: ["Account allocation", "Payment history", "Contact management", "Risk assessment"]
                      },
                      {
                        icon: CreditCard,
                        title: "Promise-to-Pay System",
                        description: "Automated and manual PTP creation with real-time tracking and SMS notifications.",
                        features: ["Automated PTP creation", "SMS confirmations", "Status tracking", "Monthly analytics"]
                      },
                      {
                        icon: Phone,
                        title: "Integrated Telephony",
                        description: "BuzzBox integration with SIP/VoIP capabilities for seamless call management.",
                        features: ["Click-to-call", "Call recording", "Real-time monitoring", "Call analytics"]
                      },
                      {
                        icon: BarChart3,
                        title: "Analytics & Reporting",
                        description: "Real-time dashboards with comprehensive metrics and performance tracking.",
                        features: ["Live metrics", "Agent performance", "Collection analytics", "Custom reports"]
                      },
                      {
                        icon: MessageSquare,
                        title: "Multi-channel Communication",
                        description: "Integrated SMS, email, and voice communication with automated workflows.",
                        features: ["SMS automation", "Email templates", "Voice integration", "Communication logs"]
                      },
                      {
                        icon: Shield,
                        title: "Security & Compliance",
                        description: "Enterprise-grade security with role-based access and audit trails.",
                        features: ["Row-level security", "Role management", "Audit logging", "Data encryption"]
                      },
                      {
                        icon: Sparkles,
                        title: "AI Customer Profile Analysis",
                        description: "Intelligent customer insights powered by Anthropic Claude for optimized collection strategies.",
                        features: ["Risk score assessment", "Payment likelihood prediction", "Behavioral analysis", "Smart recommendations"]
                      }
                    ].map((feature, index) => (
                      <div key={index} className="p-6 rounded-lg bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-600/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                            <feature.icon className="h-5 w-5 text-blue-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-200">{feature.title}</h3>
                        </div>
                        <p className="text-slate-400 mb-4">{feature.description}</p>
                        <ul className="space-y-1">
                          {feature.features.map((item, idx) => (
                            <li key={idx} className="text-sm text-slate-500 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-blue-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* API Reference Section */}
            <section id="api" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <Code className="h-6 w-6 text-green-400" />
                    API Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300">
                    SmartKollect provides a comprehensive RESTful API for all core functionality. 
                    All endpoints require authentication and follow consistent response patterns.
                  </p>

                  <Accordion type="multiple" className="w-full">
                    {[
                      {
                        id: "ptp-api",
                        title: "Promise-to-Pay API",
                        endpoints: [
                          {
                            method: "POST",
                            path: "/api/ptp",
                            description: "Create a new Promise-to-Pay arrangement",
                            example: `{
  "debtor_id": "uuid",
  "amount": 1500.00,
  "date": "2024-12-25",
  "payment_method": "Bank Transfer",
  "notes": "Customer agreed to payment"
}`
                          },
                          {
                            method: "GET",
                            path: "/api/ptp-metrics",
                            description: "Get monthly PTP statistics",
                            example: `{
  "totalPTPs": 269,
  "fulfilledPTPs": 156,
  "pendingPTPs": 78,
  "defaultedPTPs": 35,
  "fulfilledPercentage": 58,
  "fulfilledRevenue": 234500.00
}`
                          }
                        ]
                      },
                      {
                        id: "sms-api",
                        title: "SMS API",
                        endpoints: [
                          {
                            method: "POST",
                            path: "/api/send-ptp-sms",
                            description: "Send PTP confirmation SMS to customer",
                            example: `{
  "customerName": "John Doe",
  "phoneNumber": "+27821234567",
  "amount": 1500.00,
  "paymentDate": "December 25, 2024",
  "paymentMethod": "Bank Transfer"
}`
                          }
                        ]
                      },
                      {
                        id: "metrics-api",
                        title: "Metrics API",
                        endpoints: [
                          {
                            method: "GET",
                            path: "/api/metrics",
                            description: "Get comprehensive system metrics",
                            example: `{
  "activeCalls": [],
  "queuedCalls": [],
  "agentStatus": {},
  "collectionMetrics": {},
  "lastUpdated": "2024-07-27T11:57:21Z"
}`
                          }
                        ]
                      },
                      {
                        id: "ai-analysis-api",
                        title: "AI Analysis API",
                        endpoints: [
                          {
                            method: "POST",
                            path: "/api/analyze-profile",
                            description: "Generate AI-powered customer profile analysis using Anthropic Claude",
                            example: `{
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "account_number": "ACC123456",
    "balance": 15000.00,
    "status": "active"
  },
  "accountHistory": [...],
  "paymentHistory": [...]
}

Response:
{
  "success": true,
  "analysis": {
    "riskScore": 75,
    "paymentLikelihood": "medium",
    "recommendedStrategy": "Focus on payment plan options...",
    "behavioralPatterns": ["Responsive to SMS", "Prefers morning calls"],
    "communicationPreferences": ["phone", "sms"],
    "urgencyLevel": "high",
    "settlementRecommendations": "Consider 70% settlement...",
    "keyInsights": ["Customer shows willingness to pay", "Previous PTP fulfilled"],
    "nextBestActions": ["Call within 2 days", "Offer payment plan"]
  }
}`
                          }
                        ]
                      }
                    ].map((section) => (
                      <AccordionItem key={section.id} value={section.id} className="border-slate-600">
                        <AccordionTrigger className="text-slate-200 hover:text-white">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {section.endpoints.map((endpoint, idx) => (
                            <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  variant={endpoint.method === 'GET' ? 'default' : 'secondary'}
                                  className={`${
                                    endpoint.method === 'GET' 
                                      ? 'bg-green-600 hover:bg-green-700' 
                                      : 'bg-blue-600 hover:bg-blue-700'
                                  } text-white`}
                                >
                                  {endpoint.method}
                                </Badge>
                                <code className="text-slate-300 font-mono text-sm">{endpoint.path}</code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(endpoint.path, `${section.id}-${idx}`)}
                                  className="ml-auto h-6 w-6 p-0"
                                >
                                  {copiedCode === `${section.id}-${idx}` ? (
                                    <Check className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-slate-400 text-sm mb-3">{endpoint.description}</p>
                              <div className="bg-slate-950/50 rounded p-3 border border-slate-700/50">
                                <pre className="text-xs text-slate-300 overflow-x-auto">
                                  <code>{endpoint.example}</code>
                                </pre>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </section>

            {/* Integration Section */}
            <section id="integration" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-orange-400" />
                    Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300">
                    SmartKollect integrates with leading third-party services to provide comprehensive 
                    debt collection capabilities.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        name: "BuzzBox Telephony",
                        description: "Complete telephony solution with SIP/VoIP capabilities",
                        features: ["Click-to-call", "Call recording", "Real-time monitoring", "Call analytics"],
                        status: "Active",
                        docs: "https://buzzbox.co.za/api-docs"
                      },
                      {
                        name: "Infobip SMS",
                        description: "Global SMS delivery platform for customer notifications",
                        features: ["SMS delivery", "Delivery reports", "Global coverage", "Template management"],
                        status: "Active",
                        docs: "https://www.infobip.com/docs"
                      },
                      {
                        name: "Supabase Database",
                        description: "PostgreSQL database with real-time subscriptions",
                        features: ["Real-time updates", "Row-level security", "Authentication", "Edge functions"],
                        status: "Active",
                        docs: "https://supabase.com/docs"
                      },
                      {
                        name: "SendGrid Email",
                        description: "Email delivery service for customer communications",
                        features: ["Email templates", "Delivery tracking", "Analytics", "Automation"],
                        status: "Active",
                        docs: "https://docs.sendgrid.com"
                      },
                      {
                        name: "Anthropic Claude",
                        description: "Advanced AI model for intelligent customer profile analysis and insights",
                        features: ["Risk assessment", "Behavioral analysis", "Strategy recommendations", "Natural language processing"],
                        status: "Active",
                        docs: "https://docs.anthropic.com"
                      }
                    ].map((integration, index) => (
                      <div key={index} className="p-6 rounded-lg bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-600/30">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-200">{integration.name}</h3>
                          <Badge 
                            variant="outline" 
                            className="border-green-600 text-green-400 bg-green-600/10"
                          >
                            {integration.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 mb-4">{integration.description}</p>
                        <ul className="space-y-1 mb-4">
                          {integration.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-slate-500 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-orange-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          onClick={() => window.open(integration.docs, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View Docs
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Deployment Section */}
            <section id="deployment" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <Globe className="h-6 w-6 text-cyan-400" />
                    Deployment & Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300">
                    SmartKollect is deployed on modern cloud infrastructure with automatic scaling 
                    and high availability.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-200">Environment Variables</h3>
                      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                        <pre className="text-xs text-slate-300 overflow-x-auto">
                          <code>{`# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# SMS Configuration
INFOBIP_BASE_URL=http://wpmnqd.api.infobip.com
INFOBIP_API_KEY=your_api_key
INFOBIP_SENDER=SmartKollect

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_key

# BuzzBox Configuration
BUZZBOX_API_URL=your_buzzbox_url
BUZZBOX_API_KEY=your_buzzbox_key

# AI Analysis Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key`}</code>
                        </pre>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-200">Deployment Steps</h3>
                      <div className="space-y-3">
                        {[
                          "Clone the repository",
                          "Install dependencies with npm install",
                          "Configure environment variables",
                          "Run database migrations",
                          "Build the application",
                          "Deploy to production"
                        ].map((step, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/30">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-700 flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
                            </div>
                            <span className="text-slate-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-700/30">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      Production Environment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">99.9%</div>
                        <div className="text-sm text-slate-400">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">&lt;200ms</div>
                        <div className="text-sm text-slate-400">Response Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">24/7</div>
                        <div className="text-sm text-slate-400">Monitoring</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Footer */}
            <div className="text-center py-12 border-t border-slate-700/50">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => window.open('https://smartkollect.co.za', '_blank')}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Visit Website
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => window.open('mailto:support@smartkollect.co.za')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
              <p className="text-slate-500 text-sm">
                © 2025 SmartKollect. All rights reserved. Built with ❤️ for debt collection professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
