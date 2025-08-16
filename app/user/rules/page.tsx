"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Info,
  LifeBuoy,
  LucideIcon,
  Scale,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";

// Types
type RuleCategory = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

type Rule = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  compliance: "mandatory" | "recommended" | "optional";
  lastUpdated: string;
  details: string;
  examples?: string[];
  relatedRules?: number[];
};

// Mock data
const ruleCategories: RuleCategory[] = [
  {
    id: "legal",
    name: "Legal Compliance",
    description: "Rules related to legal requirements and regulations",
    icon: <Scale className="h-5 w-5" />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "communication",
    name: "Communication Guidelines",
    description: "How to communicate with debtors appropriately",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: "payment",
    name: "Payment Processing",
    description: "Rules for handling payments and settlements",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "escalation",
    name: "Escalation Procedures",
    description: "When and how to escalate collection cases",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: "documentation",
    name: "Documentation Requirements",
    description: "Required documentation for collection activities",
    icon: <BookOpen className="h-5 w-5" />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "timeframes",
    name: "Timeframes & Deadlines",
    description: "Important timeframes for collection activities",
    icon: <Clock className="h-5 w-5" />,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
];

const rules: Rule[] = [
  {
    id: 1,
    title: "Debt Collection Communication Hours",
    description: "Restrictions on when debtors can be contacted",
    category: "legal",
    priority: "high",
    compliance: "mandatory",
    lastUpdated: "2025-02-15",
    details:
      "Communications with debtors must only occur between 8:00 AM and 9:00 PM local time. Any communication outside these hours is strictly prohibited unless explicitly requested by the debtor in writing.",
    examples: [
      "Do not call debtors before 8:00 AM or after 9:00 PM in their local time zone",
      "Scheduled emails should be timed to arrive within permitted hours",
      "Document any debtor-initiated communications outside these hours",
    ],
    relatedRules: [2, 5],
  },
  {
    id: 2,
    title: "Communication Frequency Limitations",
    description: "Limits on how often debtors can be contacted",
    category: "legal",
    priority: "high",
    compliance: "mandatory",
    lastUpdated: "2025-02-10",
    details:
      "Debtors must not be contacted more than 3 times in a 7-day period unless they have explicitly requested more frequent communication. This includes all forms of communication (calls, emails, SMS, etc.).",
    examples: [
      "Track all communication attempts in the system",
      "If a debtor doesn't respond to 3 attempts, wait until the next 7-day period",
      "Document when a debtor requests more frequent communication",
    ],
  },
  {
    id: 3,
    title: "Payment Plan Documentation",
    description: "Requirements for documenting payment plans",
    category: "documentation",
    priority: "medium",
    compliance: "mandatory",
    lastUpdated: "2025-01-20",
    details:
      "All payment plans must be documented with specific terms, including payment amounts, dates, duration, and consequences of missed payments. Both parties must receive copies of the agreement.",
    examples: [
      "Use the standard payment plan template in the system",
      "Ensure all terms are clearly explained to the debtor",
      "Document verbal agreements in writing within 24 hours",
    ],
    relatedRules: [7],
  },
  {
    id: 4,
    title: "Settlement Authority Limits",
    description: "Approval levels for settlement offers",
    category: "payment",
    priority: "medium",
    compliance: "mandatory",
    lastUpdated: "2025-03-01",
    details:
      "Collection agents may offer settlements up to 20% discount without approval. Settlements between 21-40% require supervisor approval. Settlements over 40% require manager approval.",
    examples: [
      "For a $1,000 debt, you can offer up to $800 without approval",
      "Document all settlement offers in the system",
      "Escalate larger settlement requests through proper channels",
    ],
  },
  {
    id: 5,
    title: "Cease Communication Requests",
    description: "Handling requests to stop communication",
    category: "legal",
    priority: "high",
    compliance: "mandatory",
    lastUpdated: "2025-02-28",
    details:
      "If a debtor requests to cease communication in writing, all direct communication must stop immediately except to notify of specific actions (legal proceedings, etc.). Flag the account appropriately.",
    examples: [
      "Document the cease communication request in the system",
      "Notify supervisor immediately",
      "Only send legally required notices after request is received",
    ],
  },
  {
    id: 6,
    title: "Hardship Case Identification",
    description: "Identifying and handling hardship cases",
    category: "escalation",
    priority: "medium",
    compliance: "recommended",
    lastUpdated: "2025-01-15",
    details:
      "Identify potential hardship cases based on specific criteria and escalate to the hardship team. Indicators include medical issues, job loss, natural disasters, or other significant life events.",
    examples: [
      "Use the hardship assessment checklist",
      "Collect relevant documentation sensitively",
      "Offer temporary payment suspensions when appropriate",
    ],
  },
  {
    id: 7,
    title: "Payment Receipt Documentation",
    description: "Requirements for documenting payments",
    category: "documentation",
    priority: "medium",
    compliance: "mandatory",
    lastUpdated: "2025-02-05",
    details:
      "All payments must be documented in the system within 24 hours of receipt. Documentation must include amount, date, payment method, and confirmation number if applicable.",
    examples: [
      "Enter payment details immediately when received",
      "Send payment confirmation to debtor",
      "Reconcile payments daily",
    ],
  },
  {
    id: 8,
    title: "Dispute Resolution Timeframes",
    description: "Timeframes for resolving disputes",
    category: "timeframes",
    priority: "high",
    compliance: "mandatory",
    lastUpdated: "2025-01-10",
    details:
      "All debt disputes must be acknowledged within 48 hours and resolved within 30 days. Collection activities must be paused during the dispute investigation period.",
    examples: [
      "Flag disputed accounts immediately in the system",
      "Acknowledge receipt of dispute in writing",
      "Provide regular updates on investigation progress",
    ],
  },
  {
    id: 9,
    title: "Respectful Communication Language",
    description: "Guidelines for respectful communication",
    category: "communication",
    priority: "high",
    compliance: "mandatory",
    lastUpdated: "2025-02-20",
    details:
      "All communications must be respectful and free from threatening, abusive, or deceptive language. Use clear, simple language and avoid legal jargon when possible.",
    examples: [
      "Use approved communication templates",
      "Focus on facts and solutions rather than blame",
      "Avoid implying legal action unless specifically authorized",
    ],
  },
  {
    id: 10,
    title: "Escalation for Legal Action",
    description: "Process for escalating to legal action",
    category: "escalation",
    priority: "high",
    compliance: "mandatory",
    lastUpdated: "2025-03-05",
    details:
      "Accounts can only be referred for legal action after all other collection attempts have been exhausted, the debt exceeds $1,000, and the account is at least 120 days past due. Manager approval is required.",
    examples: [
      "Complete the legal action checklist",
      "Document all previous collection attempts",
      "Obtain written approval from manager",
    ],
  },
];

export default function RulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [complianceFilter, setComplianceFilter] = useState<string | null>(null);

  // Filter rules based on search, category, and compliance
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      searchQuery === "" ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || rule.category === selectedCategory;

    const matchesCompliance =
      complianceFilter === null || rule.compliance === complianceFilter;

    return matchesSearch && matchesCategory && matchesCompliance;
  });

  // Get related rules for the selected rule
  const relatedRules = selectedRule?.relatedRules
    ? rules.filter((rule) => selectedRule.relatedRules?.includes(rule.id))
    : [];

  // Priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "";
    }
  };

  // Compliance badge color
  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case "mandatory":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "recommended":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "optional":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "";
    }
  };

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = ruleCategories.find((cat) => cat.id === categoryId);
    return category?.color || "";
  };

  // Get category icon
  const getCategoryIcon = (categoryId: string) => {
    const category = ruleCategories.find((cat) => cat.id === categoryId);
    return category?.icon || <Info className="h-5 w-5" />;
  };

  return (
    <div className="w-full max-w-none py-6 space-y-6 px-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Collection Rules
          </h1>
          <p className="text-muted-foreground">
            Guidelines and regulations for debt collection activities
          </p>
        </div>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="outline" size="sm">
              <LifeBuoy className="h-4 w-4 mr-2" />
              Need Help?
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Rules Help</h4>
              <p className="text-sm text-muted-foreground">
                Collection rules guide your daily activities. For specific
                questions, contact your supervisor or the compliance team.
              </p>
              <div className="flex items-center pt-2">
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium">
                  Compliance Hotline: 555-123-4567
                </span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Categories and filters */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>Find specific rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Compliance Level</Label>
                <Select
                  value={complianceFilter || "all"}
                  onValueChange={(value) =>
                    setComplianceFilter(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All compliance levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All compliance levels</SelectItem>
                    <SelectItem value="mandatory">Mandatory</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                    setComplianceFilter(null);
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Rule Categories</CardTitle>
              <CardDescription>Browse by category</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 p-2">
                <Button
                  variant={selectedCategory === null ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {ruleCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center">
                      <div
                        className={`mr-2 ${
                          category.id === selectedCategory
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {category.icon}
                      </div>
                      <span>{category.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle - Rules list */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>
              {selectedCategory
                ? ruleCategories.find((c) => c.id === selectedCategory)?.name
                : "All Rules"}
            </CardTitle>
            <CardDescription>
              {selectedCategory
                ? ruleCategories.find((c) => c.id === selectedCategory)
                    ?.description
                : "Complete list of collection rules and guidelines"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRules.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-1 p-2">
                  {filteredRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={cn(
                        "flex flex-col space-y-2 rounded-md p-3 cursor-pointer transition-colors",
                        selectedRule?.id === rule.id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedRule(rule)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getCategoryIcon(rule.category)}
                          </div>
                          <div>
                            <div className="font-medium">{rule.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {rule.description}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-wrap gap-2 ml-8">
                        <Badge
                          variant="outline"
                          className={getCategoryColor(rule.category)}
                        >
                          {
                            ruleCategories.find((c) => c.id === rule.category)
                              ?.name
                          }
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(rule.priority)}
                        >
                          {rule.priority.charAt(0).toUpperCase() +
                            rule.priority.slice(1)}{" "}
                          Priority
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getComplianceColor(rule.compliance)}
                        >
                          {rule.compliance.charAt(0).toUpperCase() +
                            rule.compliance.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <SearchIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No rules found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar - Rule details */}
        {selectedRule && (
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedRule.title}</CardTitle>
                  <CardDescription>{selectedRule.description}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(selectedRule.priority)}
                  >
                    {selectedRule.priority.charAt(0).toUpperCase() +
                      selectedRule.priority.slice(1)}{" "}
                    Priority
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getComplianceColor(selectedRule.compliance)}
                  >
                    {selectedRule.compliance.charAt(0).toUpperCase() +
                      selectedRule.compliance.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Rule Details</h3>
                <p>{selectedRule.details}</p>
              </div>

              {selectedRule.examples && selectedRule.examples.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Examples & Best Practices</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedRule.examples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}

              {relatedRules.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Related Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {relatedRules.map((rule) => (
                      <Button
                        key={rule.id}
                        variant="outline"
                        className="justify-start"
                        onClick={() => setSelectedRule(rule)}
                      >
                        <div className="flex items-center">
                          {getCategoryIcon(rule.category)}
                          <span className="ml-2">{rule.title}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last updated: {selectedRule.lastUpdated}
                </div>
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Rule ID: {selectedRule.id}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Icon component for search results
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
