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

  const projectStructureDiagram = `
    graph TD
        A[Smart-Kollect] --> B[app/]
        A --> C[components/]
        A --> D[contexts/]
        A --> E[hooks/]
        A --> F[lib/]
        A --> G[public/]
        A --> H[types/]
        
        B --> B1[admin/]
        B --> B2[api/]
        B --> B3[user/]
        B --> B4[marketing/]
        B --> B5[layout.tsx]
        B --> B6[page.tsx]
        
        C --> C1[auth/]
        C --> C2[dashboard/]
        C --> C3[settings/]
        C --> C4[ui/]
        C --> C5[GlobalDialer.tsx]
        C --> C6[MinimizedDialer.tsx]
        
        D --> D1[AuthContext.tsx]
        D --> D2[DialerContext.tsx]
        D --> D3[FloatingButtonContext.tsx]
        
        F --> F1[redux/]
        F --> F2[services/]
        F --> F3[supabase/]
        
        F1 --> F1A[features/]
        F1 --> F1B[store.ts]
        F1 --> F1C[provider.tsx]
        
        F1A --> F1A1[accountsSlice.ts]
        F1A --> F1A2[userSlice.ts]
        F1A --> F1A3[dialerSlice.ts]
        
        classDef rootClass fill:#3b82f6,stroke:#1e40af,stroke-width:3px,color:#ffffff
        classDef folderClass fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:#ffffff
        classDef fileClass fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff
        classDef reduxClass fill:#dc2626,stroke:#991b1b,stroke-width:2px,color:#ffffff
        classDef contextClass fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#ffffff
        
        class A rootClass
        class B,C,D,E,F,G,H,B1,B2,B3,B4,C1,C2,C3,C4,F1,F2,F3,F1A folderClass
        class B5,B6,C5,C6 fileClass
        class D1,D2,D3 contextClass
        class F1B,F1C,F1A1,F1A2,F1A3 reduxClass
  `;

  const frontendArchitectureDiagram = `
    graph TB
        subgraph "Presentation Layer"
            A[React Components] --> B[UI Library]
            A --> C[Layout Components]
            A --> D[Feature Components]
            B --> E[shadcn/ui]
            B --> F[Tailwind CSS]
        end
        
        subgraph "Business Logic Layer"
            G[Custom Hooks] --> H[State Management]
            G --> I[Service Layer]
            H --> J[Redux Toolkit]
            H --> K[React Context]
            I --> L[API Services]
            I --> M[Utility Functions]
        end
        
        subgraph "Data Layer"
            N[Data Sources] --> O[Supabase Client]
            N --> P[Real-time Subscriptions]
            N --> Q[Local Storage]
            O --> R[Database Operations]
            P --> S[Live Updates]
        end
        
        subgraph "External Integrations"
            T[BuzzBox API] --> U[Telephony]
            V[Infobip SMS] --> W[Messaging]
            X[Anthropic Claude] --> Y[AI Analysis]
        end
        
        A --> G
        G --> N
        N --> T
        N --> V
        N --> X
        
        classDef presentationClass fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:#ffffff
        classDef businessClass fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#ffffff
        classDef dataClass fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff
        classDef externalClass fill:#dc2626,stroke:#991b1b,stroke-width:2px,color:#ffffff
        
        class A,B,C,D,E,F presentationClass
        class G,H,I,J,K,L,M businessClass
        class N,O,P,Q,R,S dataClass
        class T,U,V,W,X,Y externalClass
  `;

  const componentAnalysisDiagram = `
    graph TD
        A[RootLayout]
        
        A --- B[Layout Layer]
        B --- B1[Sidebar]
        B --- B2[Header]
        B --- B3[Footer]
        
        B1 --- B1A[Navigation Menu]
        B2 --- B2A[User Profile]
        B2 --- B2B[Notifications]
        
        A --- C[Feature Layer]
        C --- C1[CustomerDashboard]
        C --- C2[CallManager]
        C --- C3[PTPCreator]
        C --- C4[MetricsViewer]
        
        C1 --- C1A[Customer Profile]
        C1 --- C1B[Account Details]
        C2 --- C2A[Active Call Interface]
        C2 --- C2B[Call History]
        C3 --- C3A[Payment Form]
        C3 --- C3B[SMS Confirmation]
        C4 --- C4A[Performance Charts]
        C4 --- C4B[Real-time Stats]
        
        A --- D[Shared Layer]
        D --- D1[DataTable]
        D --- D2[Modal]
        D --- D3[Form]
        D --- D4[LoadingSpinner]
        
        D1 --- D1A[Pagination]
        D1 --- D1B[Sorting]
        D1 --- D1C[Filtering]
        D2 --- D2A[Confirmation Dialog]
        D2 --- D2B[Form Dialog]
        D3 --- D3A[Input Fields]
        D3 --- D3B[Validation]
        D4 --- D4A[Skeleton Loader]
        
        A --- E[Communication Layer]
        E --- E1[GlobalDialer]
        E --- E2[MinimizedDialer]
        E --- E3[SMSComposer]
        
        E1 --- E1A[Dialer Interface]
        E1 --- E1B[Call Controls]
        E2 --- E2A[Quick Actions]
        E3 --- E3A[Template Selector]
        E3 --- E3B[Message Preview]
        
        classDef rootClass fill:#1f2937,stroke:#374151,stroke-width:3px,color:#ffffff
        classDef layerClass fill:#4b5563,stroke:#6b7280,stroke-width:2px,color:#ffffff
        classDef layoutClass fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:#ffffff
        classDef featureClass fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#ffffff
        classDef sharedClass fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff
        classDef commClass fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#ffffff
        
        class A rootClass
        class B,C,D,E layerClass
        class B1,B2,B3,B1A,B2A,B2B layoutClass
        class C1,C2,C3,C4,C1A,C1B,C2A,C2B,C3A,C3B,C4A,C4B featureClass
        class D1,D2,D3,D4,D1A,D1B,D1C,D2A,D2B,D3A,D3B,D4A sharedClass
        class E1,E2,E3,E1A,E1B,E2A,E3A,E3B commClass
  `;

  const stateManagementDiagram = `
    graph TD
        A[Application State]
        
        A --- B[Redux Toolkit Store]
        A --- C[React Context]
        
        B --- B1[Global State]
        B1 --- B1A[accountsSlice]
        B1 --- B1B[userSlice]
        B1 --- B1C[dialerSlice]
        
        B1A --- B1A1[Customer Data]
        B1A --- B1A2[Account History]
        B1A --- B1A3[Payment Records]
        
        B1B --- B1B1[User Profile]
        B1B --- B1B2[Authentication]
        B1B --- B1B3[Permissions]
        
        B1C --- B1C1[Active Calls]
        B1C --- B1C2[Call History]
        B1C --- B1C3[Dialer State]
        
        C --- C1[AuthContext]
        C --- C2[DialerContext]
        C --- C3[FloatingButtonContext]
        
        C1 --- C1A[Login State]
        C1 --- C1B[Session Management]
        C1 --- C1C[Tenant Context]
        
        C2 --- C2A[Call Controls]
        C2 --- C2B[Phone Interface]
        C2 --- C2C[Real-time Updates]
        
        C3 --- C3A[Button Visibility]
        C3 --- C3B[Action Handlers]
        C3 --- C3C[Position State]
        
        D[Components]
        D --- D1[useSelector]
        D --- D2[useDispatch]
        D --- D3[useContext]
        
        D1 --> B1
        D2 --> B1
        D3 --> C1
        D3 --> C2
        D3 --> C3
        
        classDef rootClass fill:#1f2937,stroke:#374151,stroke-width:3px,color:#ffffff
        classDef reduxClass fill:#764abc,stroke:#5a2d91,stroke-width:2px,color:#ffffff
        classDef contextClass fill:#61dafb,stroke:#21a1c4,stroke-width:2px,color:#ffffff
        classDef sliceClass fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#ffffff
        classDef dataClass fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff
        classDef componentClass fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#ffffff
        
        class A rootClass
        class B,B1 reduxClass
        class C contextClass
        class B1A,B1B,B1C sliceClass
        class B1A1,B1A2,B1A3,B1B1,B1B2,B1B3,B1C1,B1C2,B1C3,C1,C2,C3,C1A,C1B,C1C,C2A,C2B,C2C,C3A,C3B,C3C dataClass
        class D,D1,D2,D3 componentClass
  `;

  const routingLayoutDiagram = `
    flowchart TD
        A[Next.js App Router]
        
        A --> B[Root Layout]
        B --> B1[app/layout.tsx]
        B1 --> B1A[Providers Setup]
        B1 --> B1B[Global Styles]
        B1 --> B1C[Metadata Config]
        
        A --> C[Route Structure]
        C --> C1[Admin Routes]
        C --> C2[API Routes]
        C --> C3[User Routes]
        C --> C4[Marketing Routes]
        C --> C5[Documentation]
        
        C1 --> C1A[Admin Layout]
        C1A --> C1A1[Sidebar Navigation]
        C1A --> C1A2[Header Bar]
        C1A --> C1A3[Protected Routes]
        
        C1 --> C1B[Admin Pages]
        C1B --> C1B1[Dashboard]
        C1B --> C1B2[Customers]
        C1B --> C1B3[Campaigns]
        C1B --> C1B4[Accounts]
        C1B --> C1B5[Settings]
        
        C2 --> C2A[API Endpoints]
        C2A --> C2A1[PTP API]
        C2A --> C2A2[Metrics API]
        C2A --> C2A3[SMS API]
        C2A --> C2A4[Profile API]
        
        C3 --> C3A[User Layout]
        C3A --> C3A1[Public Header]
        C3A --> C3A2[User Navigation]
        
        C4 --> C4A[Marketing Layout]
        C4A --> C4A1[Landing Pages]
        C4A --> C4A2[Feature Pages]
        
        A --> D[Middleware]
        D --> D1[Tenant Detection]
        D --> D2[Authentication Check]
        D --> D3[Route Protection]
        
        D1 --> D1A[Subdomain Parsing]
        D1 --> D1B[Tenant Context]
        D2 --> D2A[Session Validation]
        D2 --> D2B[User Permissions]
        D3 --> D3A[Role-based Access]
        D3 --> D3B[Redirect Logic]
        
        classDef rootClass fill:#1f2937,stroke:#374151,stroke-width:3px,color:#ffffff
        classDef layoutClass fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:#ffffff
        classDef routeClass fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#ffffff
        classDef pageClass fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff
        classDef middlewareClass fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#ffffff
        classDef apiClass fill:#dc2626,stroke:#991b1b,stroke-width:2px,color:#ffffff
        
        class A rootClass
        class B,B1,C1A,C3A,C4A layoutClass
        class C,C1,C2,C3,C4,C5 routeClass
        class B1A,B1B,B1C,C1A1,C1A2,C1A3,C1B1,C1B2,C1B3,C1B4,C1B5,C3A1,C3A2,C4A1,C4A2 pageClass
        class D,D1,D2,D3,D1A,D1B,D2A,D2B,D3A,D3B middlewareClass
        class C1B,C2A,C2A1,C2A2,C2A3,C2A4 apiClass
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
                    { id: 'frontend-architecture', label: 'Frontend Architecture', icon: Brain },
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

            {/* Frontend Architecture Section */}
            <section id="frontend-architecture" className="scroll-mt-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-200 flex items-center gap-2">
                    <Brain className="h-6 w-6 text-cyan-400" />
                    Frontend Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300 text-lg leading-relaxed">
                    SmartKollect's frontend is built with Next.js 15 and follows modern React patterns with TypeScript, 
                    providing a scalable, maintainable, and performant user interface.
                  </p>

                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="table-of-contents" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Table of Contents
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                          <ul className="space-y-2 text-slate-300">
                            {[
                              "Introduction",
                              "Project Structure", 
                              "Core Components",
                              "Architecture Overview",
                              "Detailed Component Analysis",
                              "State Management Strategy",
                              "Routing and Layout Organization",
                              "UI Component Library",
                              "Context API Usage",
                              "Data Fetching and Performance"
                            ].map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-cyan-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="introduction" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Introduction
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <p className="text-slate-300 mb-4">
                            The SmartKollect frontend architecture is designed for scalability, maintainability, and performance. 
                            Built on Next.js 15 with TypeScript, it leverages modern React patterns and best practices.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border border-cyan-700/30">
                              <h4 className="font-semibold text-cyan-300 mb-2">Modern Stack</h4>
                              <p className="text-slate-400 text-sm">Next.js 15, React 18, TypeScript, Tailwind CSS</p>
                            </div>
                            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30">
                              <h4 className="font-semibold text-blue-300 mb-2">Performance First</h4>
                              <p className="text-slate-400 text-sm">Server-side rendering, code splitting, optimized bundles</p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="project-structure" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Project Structure
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-cyan-400" />
                            SmartKollect Project Architecture
                          </h4>
                          <Mermaid chart={projectStructureDiagram} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Code className="h-4 w-4 text-green-400" />
                              Diagram Sources
                            </h5>
                            <ul className="space-y-1 text-slate-400 text-sm font-mono">
                              <li>• app/layout.tsx</li>
                              <li>• contexts/AuthContext.tsx</li>
                              <li>• lib/redux/store.ts</li>
                            </ul>
                          </div>
                          
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-400" />
                              Section Sources
                            </h5>
                            <ul className="space-y-1 text-slate-400 text-sm font-mono">
                              <li>• app/layout.tsx</li>
                              <li>• contexts/AuthContext.tsx</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <h5 className="font-semibold text-slate-200 mb-3">Directory Structure Details</h5>
                          <pre className="text-xs text-slate-300 overflow-x-auto">
                            <code>{`├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── user/              # User-facing pages
│   ├── marketing/         # Marketing pages
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── settings/         # Settings components
│   ├── ui/               # UI library components
│   ├── GlobalDialer.tsx  # Global dialer component
│   └── MinimizedDialer.tsx # Minimized dialer view
├── contexts/             # React Context providers
│   ├── AuthContext.tsx   # Authentication context
│   ├── DialerContext.tsx # Dialer state management
│   └── FloatingButtonContext.tsx # Floating button state
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── redux/           # Redux store configuration
│   │   ├── features/    # Redux slices
│   │   │   ├── accountsSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   └── dialerSlice.ts
│   │   ├── store.ts     # Redux store setup
│   │   └── provider.tsx # Redux provider
│   ├── services/        # API service layers
│   └── supabase/        # Database client
├── public/               # Static assets
└── types/                # TypeScript type definitions`}</code>
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="core-components" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Core Components
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              name: "Dashboard Components",
                              description: "Real-time metrics, charts, and monitoring interfaces",
                              files: ["AgentPerformanceTable.tsx", "CallAnalyticsVisualization.tsx", "MetricsDashboard.tsx"]
                            },
                            {
                              name: "Authentication",
                              description: "Login, registration, and session management",
                              files: ["LoginModal.tsx", "AuthContext.tsx", "ProtectedRoute.tsx"]
                            },
                            {
                              name: "Customer Management",
                              description: "Customer profiles, account management, and interactions",
                              files: ["CustomerProfile.tsx", "AccountDetails.tsx", "InteractionHistory.tsx"]
                            },
                            {
                              name: "Communication",
                              description: "Call management, SMS, and email interfaces",
                              files: ["CallInterface.tsx", "SMSComposer.tsx", "EmailTemplates.tsx"]
                            }
                          ].map((component, idx) => (
                            <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                              <h4 className="font-semibold text-slate-200 mb-2">{component.name}</h4>
                              <p className="text-slate-400 text-sm mb-3">{component.description}</p>
                              <div className="space-y-1">
                                {component.files.map((file, fileIdx) => (
                                  <div key={fileIdx} className="text-xs text-slate-500 font-mono">{file}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="architecture-overview" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Architecture Overview
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-purple-400" />
                            Frontend Architecture Flow
                          </h4>
                          <Mermaid chart={frontendArchitectureDiagram} />
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-700/30">
                              <h4 className="font-semibold text-purple-300 mb-2">Presentation Layer</h4>
                              <p className="text-slate-400 text-sm">React components, UI library, styling</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30">
                              <h4 className="font-semibold text-blue-300 mb-2">Business Logic</h4>
                              <p className="text-slate-400 text-sm">Custom hooks, services, state management</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/30">
                              <h4 className="font-semibold text-green-300 mb-2">Data Layer</h4>
                              <p className="text-slate-400 text-sm">API clients, caching, real-time subscriptions</p>
                            </div>
                          </div>
                          <p className="text-slate-300">
                            The architecture follows a layered approach with clear separation between presentation, 
                            business logic, and data access layers, ensuring maintainability and testability.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Brain className="h-4 w-4 text-cyan-400" />
                              Layer Interactions
                            </h5>
                            <ul className="space-y-2 text-slate-400 text-sm">
                              <li>• Components consume custom hooks</li>
                              <li>• Hooks manage state and services</li>
                              <li>• Services interact with data sources</li>
                              <li>• External APIs provide specialized functionality</li>
                            </ul>
                          </div>
                          
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-yellow-400" />
                              Key Benefits
                            </h5>
                            <ul className="space-y-2 text-slate-400 text-sm">
                              <li>• Clear separation of concerns</li>
                              <li>• Reusable business logic</li>
                              <li>• Testable architecture</li>
                              <li>• Scalable component structure</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="detailed-analysis" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Detailed Component Analysis
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <Brain className="h-5 w-5 text-blue-400" />
                            Component Hierarchy & Relationships
                          </h4>
                          <Mermaid chart={componentAnalysisDiagram} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Layers className="h-4 w-4 text-purple-400" />
                              Layout Components
                            </h5>
                            <p className="text-slate-400 text-sm mb-3">Root layout, navigation, and structural components</p>
                            <div className="flex flex-wrap gap-2">
                              {["RootLayout", "Sidebar", "Header", "Footer"].map((example, exIdx) => (
                                <Badge key={exIdx} variant="outline" className="border-purple-600 text-purple-300 bg-purple-600/10">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-blue-400" />
                              Feature Components
                            </h5>
                            <p className="text-slate-400 text-sm mb-3">Business logic components for specific features</p>
                            <div className="flex flex-wrap gap-2">
                              {["CustomerDashboard", "CallManager", "PTPCreator", "MetricsViewer"].map((example, exIdx) => (
                                <Badge key={exIdx} variant="outline" className="border-blue-600 text-blue-300 bg-blue-600/10">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Settings className="h-4 w-4 text-green-400" />
                              Shared Components
                            </h5>
                            <p className="text-slate-400 text-sm mb-3">Reusable components across the application</p>
                            <div className="flex flex-wrap gap-2">
                              {["DataTable", "Modal", "Form", "LoadingSpinner"].map((example, exIdx) => (
                                <Badge key={exIdx} variant="outline" className="border-green-600 text-green-300 bg-green-600/10">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Phone className="h-4 w-4 text-orange-400" />
                              Communication Components
                            </h5>
                            <p className="text-slate-400 text-sm mb-3">Call management, SMS, and messaging interfaces</p>
                            <div className="flex flex-wrap gap-2">
                              {["GlobalDialer", "MinimizedDialer", "SMSComposer"].map((example, exIdx) => (
                                <Badge key={exIdx} variant="outline" className="border-orange-600 text-orange-300 bg-orange-600/10">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                          <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-cyan-400" />
                            Component Relationships
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                            <div>
                              <h6 className="font-medium text-slate-300 mb-2">Composition Patterns</h6>
                              <ul className="space-y-1">
                                <li>• Layout components wrap feature components</li>
                                <li>• Feature components consume shared components</li>
                                <li>• Communication components integrate globally</li>
                              </ul>
                            </div>
                            <div>
                              <h6 className="font-medium text-slate-300 mb-2">Data Flow</h6>
                              <ul className="space-y-1">
                                <li>• Props flow down the component tree</li>
                                <li>• Events bubble up through callbacks</li>
                                <li>• Global state managed via Redux/Context</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="state-management" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        State Management Strategy
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-purple-400" />
                            State Management Architecture
                          </h4>
                          <Mermaid chart={stateManagementDiagram} />
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                <Database className="h-4 w-4 text-purple-400" />
                                Redux Toolkit
                              </h4>
                              <ul className="space-y-2 text-slate-400 text-sm">
                                <li>• Global application state</li>
                                <li>• User authentication state</li>
                                <li>• Dashboard metrics cache</li>
                                <li>• Real-time data synchronization</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-cyan-400" />
                                React Context
                              </h4>
                              <ul className="space-y-2 text-slate-400 text-sm">
                                <li>• Theme and UI preferences</li>
                                <li>• Tenant context</li>
                                <li>• Dialer state management</li>
                                <li>• Floating button context</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Code className="h-4 w-4 text-blue-400" />
                              Redux Slices
                            </h5>
                            <div className="space-y-2">
                              {["accountsSlice", "userSlice", "dialerSlice"].map((slice, idx) => (
                                <Badge key={idx} variant="outline" className="border-blue-600 text-blue-300 bg-blue-600/10 block text-center">
                                  {slice}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Globe className="h-4 w-4 text-cyan-400" />
                              Context Providers
                            </h5>
                            <div className="space-y-2">
                              {["AuthContext", "DialerContext", "FloatingButtonContext"].map((context, idx) => (
                                <Badge key={idx} variant="outline" className="border-cyan-600 text-cyan-300 bg-cyan-600/10 block text-center">
                                  {context}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-orange-400" />
                              React Hooks
                            </h5>
                            <div className="space-y-2">
                              {["useSelector", "useDispatch", "useContext"].map((hook, idx) => (
                                <Badge key={idx} variant="outline" className="border-orange-600 text-orange-300 bg-orange-600/10 block text-center">
                                  {hook}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                          <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-green-400" />
                            State Management Patterns
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                            <div>
                              <h6 className="font-medium text-slate-300 mb-2">Redux for Global State</h6>
                              <ul className="space-y-1">
                                <li>• Complex data that needs to be shared</li>
                                <li>• Application-wide state management</li>
                                <li>• Time-travel debugging capabilities</li>
                                <li>• Predictable state updates</li>
                              </ul>
                            </div>
                            <div>
                              <h6 className="font-medium text-slate-300 mb-2">Context for Local State</h6>
                              <ul className="space-y-1">
                                <li>• Component-specific state</li>
                                <li>• UI state and preferences</li>
                                <li>• Authentication state</li>
                                <li>• Theme and configuration</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="routing-layout" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Routing and Layout Organization
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-400" />
                            Next.js App Router Architecture
                          </h4>
                          <Mermaid chart={routingLayoutDiagram} />
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <p className="text-slate-300 mb-4">
                            Using Next.js App Router for file-based routing with nested layouts and middleware for tenant isolation.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-orange-900/30 to-orange-800/30 border border-orange-700/30">
                              <h4 className="font-semibold text-orange-300 mb-2">Route Structure</h4>
                              <ul className="text-slate-400 text-sm space-y-1">
                                <li>• /admin/* - Admin dashboard</li>
                                <li>• /api/* - API endpoints</li>
                                <li>• /user/* - User-facing pages</li>
                                <li>• /marketing/* - Marketing pages</li>
                                <li>• /documentation - Documentation</li>
                              </ul>
                            </div>
                            <div className="p-4 rounded-lg bg-gradient-to-r from-teal-900/30 to-teal-800/30 border border-teal-700/30">
                              <h4 className="font-semibold text-teal-300 mb-2">Layout Hierarchy</h4>
                              <ul className="text-slate-400 text-sm space-y-1">
                                <li>• Root layout with providers</li>
                                <li>• Admin layout with sidebar</li>
                                <li>• User layout with public header</li>
                                <li>• Marketing layout for landing pages</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Layers className="h-4 w-4 text-purple-400" />
                              Layout Files
                            </h5>
                            <div className="space-y-2">
                              {["app/layout.tsx", "Admin Layout", "User Layout", "Marketing Layout"].map((layout, idx) => (
                                <Badge key={idx} variant="outline" className="border-purple-600 text-purple-300 bg-purple-600/10 block text-center">
                                  {layout}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Code className="h-4 w-4 text-red-400" />
                              API Routes
                            </h5>
                            <div className="space-y-2">
                              {["/ptp", "/metrics", "/sms", "/analyze-profile"].map((route, idx) => (
                                <Badge key={idx} variant="outline" className="border-red-600 text-red-300 bg-red-600/10 block text-center">
                                  {route}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                            <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                              <Shield className="h-4 w-4 text-orange-400" />
                              Middleware
                            </h5>
                            <div className="space-y-2">
                              {["Tenant Detection", "Authentication", "Route Protection"].map((middleware, idx) => (
                                <Badge key={idx} variant="outline" className="border-orange-600 text-orange-300 bg-orange-600/10 block text-center">
                                  {middleware}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                          <h5 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-cyan-400" />
                            Routing Features
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                            <div>
                              <h6 className="font-medium text-slate-300 mb-2">File-based Routing</h6>
                              <ul className="space-y-1">
                                <li>• Automatic route generation</li>
                                <li>• Nested layouts support</li>
                                <li>• Dynamic route segments</li>
                                <li>• Route groups and parallel routes</li>
                              </ul>
                            </div>
                            <div>
                              <h6 className="font-medium text-slate-300 mb-2">Middleware Integration</h6>
                              <ul className="space-y-1">
                                <li>• Subdomain-based tenant detection</li>
                                <li>• Authentication middleware</li>
                                <li>• Role-based route protection</li>
                                <li>• Automatic redirects</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="ui-library" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        UI Component Library
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <p className="text-slate-300 mb-4">
                            Built on shadcn/ui with Tailwind CSS for consistent, accessible, and customizable components.
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              "Button", "Card", "Dialog", "Form", "Input", "Select", "Table", "Tabs",
                              "Accordion", "Alert", "Badge", "Checkbox", "Dropdown", "Modal", "Toast", "Tooltip"
                            ].map((component, idx) => (
                              <div key={idx} className="p-2 text-center rounded bg-slate-800/50 border border-slate-600/30">
                                <span className="text-slate-300 text-sm">{component}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="context-usage" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Context API Usage
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-4">
                          {[
                            {
                              name: "AuthContext",
                              purpose: "User authentication and session management",
                              provides: ["user", "login", "logout", "isAuthenticated"]
                            },
                            {
                              name: "DialerContext", 
                              purpose: "Call management and telephony state",
                              provides: ["activeCall", "callHistory", "dialNumber", "endCall"]
                            },
                            {
                              name: "FloatingButtonContext",
                              purpose: "Global floating action button state",
                              provides: ["isVisible", "actions", "position", "toggle"]
                            }
                          ].map((context, idx) => (
                            <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                              <h4 className="font-semibold text-slate-200 mb-2">{context.name}</h4>
                              <p className="text-slate-400 text-sm mb-3">{context.purpose}</p>
                              <div className="flex flex-wrap gap-2">
                                {context.provides.map((item, itemIdx) => (
                                  <Badge key={itemIdx} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="data-fetching" className="border-slate-600">
                      <AccordionTrigger className="text-slate-200 hover:text-white">
                        Data Fetching and Performance
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-slate-200 mb-3">Data Fetching Strategy</h4>
                              <ul className="space-y-2 text-slate-400 text-sm">
                                <li>• Server-side rendering (SSR)</li>
                                <li>• Static generation (SSG)</li>
                                <li>• Client-side fetching with SWR</li>
                                <li>• Real-time subscriptions</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-200 mb-3">Performance Optimizations</h4>
                              <ul className="space-y-2 text-slate-400 text-sm">
                                <li>• Code splitting and lazy loading</li>
                                <li>• Image optimization</li>
                                <li>• Bundle analysis and optimization</li>
                                <li>• Caching strategies</li>
                              </ul>
                            </div>
                          </div>
                          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/30">
                            <h4 className="font-semibold text-green-300 mb-2">Performance Metrics</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-lg font-bold text-green-400">95+</div>
                                <div className="text-xs text-slate-400">Lighthouse Score</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-green-400">&lt;1s</div>
                                <div className="text-xs text-slate-400">First Paint</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-green-400">&lt;2s</div>
                                <div className="text-xs text-slate-400">Interactive</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
