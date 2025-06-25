"use client";

import { useState } from "react";
import {
  Search,
  HelpCircle,
  Book,
  FileText,
  Video,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

// Types for our help center content
interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FAQ {
  question: string;
  answer: string;
  isOpen?: boolean;
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: "How do I add a new agent to the system?",
      answer: "To add a new agent, navigate to the Team Management page and click the 'Add Agent' button. Fill in the required information including name, email, and role. Once saved, the agent will receive an email invitation to join the system.",
      isOpen: false,
    },
    {
      question: "How can I generate custom reports?",
      answer: "Custom reports can be generated from the Reports page. Click on 'Generate Report', select 'Custom Report' from the dropdown, and specify your parameters including date range, data points, and format. Click 'Generate' to create your report.",
      isOpen: false,
    },
    {
      question: "How do I set up payment plans for debtors?",
      answer: "To set up a payment plan, go to the Payments page, select the debtor, and click 'Create Payment Plan'. Define the total amount, installment frequency, and duration. The system will automatically track payments against this plan.",
      isOpen: false,
    },
    {
      question: "What do the different agent statuses mean?",
      answer: "Agent statuses include: Active (currently working), Inactive (account disabled), and On Leave (temporarily unavailable). These can be updated from the Team Management page by selecting an agent and changing their status.",
      isOpen: false,
    },
    {
      question: "How do I handle chargebacks?",
      answer: "Chargebacks can be managed from the Chargebacks page. When a new chargeback is received, click 'Process Chargeback', enter the transaction details, and select the appropriate action (accept, dispute, or escalate).",
      isOpen: false,
    },
  ]);

  // Toggle FAQ open/closed state
  const toggleFAQ = (index: number) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index].isOpen = !updatedFaqs[index].isOpen;
    setFaqs(updatedFaqs);
  };

  // Help categories
  const helpCategories: HelpCategory[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Learn the basics of navigating and using the ZIMAKO DCMS",
      icon: <Book className="h-8 w-8 text-blue-500" />,
    },
    {
      id: "user-guides",
      title: "User Guides",
      description: "Detailed guides for all system features and functions",
      icon: <FileText className="h-8 w-8 text-green-500" />,
    },
    {
      id: "video-tutorials",
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs of key processes",
      icon: <Video className="h-8 w-8 text-purple-500" />,
    },
    {
      id: "contact-support",
      title: "Contact Support",
      description: "Get in touch with our support team for assistance",
      icon: <MessageCircle className="h-8 w-8 text-amber-500" />,
    },
  ];

  // Filter FAQs based on search query
  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground">
            Find answers, guides, and support for ZIMAKO DCMS
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for help, guides, and answers..."
            className="pl-10 py-6 text-lg bg-slate-900/40 border-slate-700/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="bg-slate-900/40 border border-slate-800/60 mx-auto flex justify-center">
          <TabsTrigger value="categories" className="data-[state=active]:bg-slate-800">
            Help Categories
          </TabsTrigger>
          <TabsTrigger value="faqs" className="data-[state=active]:bg-slate-800">
            Frequently Asked Questions
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-slate-800">
            Contact Support
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {helpCategories.map((category) => (
              <Card key={category.id} className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/40 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="bg-slate-800/80 p-3 rounded-lg">
                      {category.icon}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured Articles */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Featured Articles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-slate-900/40 border-slate-800/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Complete Guide to Debt Collection Campaigns</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-400">
                  Learn how to create, manage, and optimize collection campaigns for maximum effectiveness.
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="px-0">
                    Read Article <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-slate-900/40 border-slate-800/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Understanding Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-400">
                  A comprehensive breakdown of all agent and team performance metrics and how to interpret them.
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="px-0">
                    Read Article <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <div className="max-w-3xl mx-auto">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-10">
                <HelpCircle className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-slate-400 mb-4">
                  We couldn&apos;t find any FAQs matching your search query.
                </p>
                <Button onClick={() => setSearchQuery("")}>Clear Search</Button>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-slate-800 rounded-lg overflow-hidden mb-3"
                >
                  <button
                    className="w-full flex items-center justify-between p-4 text-left bg-slate-900/60 hover:bg-slate-900/80 transition-colors"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className="font-medium">{faq.question}</span>
                    {faq.isOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                  {faq.isOpen && (
                    <div className="p-4 bg-slate-900/30 border-t border-slate-800">
                      <p className="text-slate-300">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card className="bg-slate-900/40 border-slate-800/60">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-blue-400" />
                  Email Support
                </CardTitle>
                <CardDescription>
                  Send us an email and we&apos;ll respond within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Email</label>
                  <Input placeholder="Enter your email address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="What is your inquiry about?" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea 
                    className="w-full min-h-[120px] rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm"
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500">
                  Send Message
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card className="bg-slate-900/40 border-slate-800/60">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-green-400" />
                    Phone Support
                  </CardTitle>
                  <CardDescription>
                    Call us directly for urgent assistance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Technical Support</p>
                      <p className="text-sm text-slate-400">For system issues and technical help</p>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      +27 11 123 4567
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Account Management</p>
                      <p className="text-sm text-slate-400">For billing and account questions</p>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      +27 11 987 6543
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-slate-400">
                  Available Monday to Friday, 8:00 AM - 5:00 PM SAST
                </CardFooter>
              </Card>

              <Card className="bg-slate-900/40 border-slate-800/60">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-purple-400" />
                    Live Chat
                  </CardTitle>
                  <CardDescription>
                    Chat with a support agent in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-500">
                    Start Live Chat
                  </Button>
                  <p className="text-xs text-slate-400 mt-4">
                    Current wait time: Approximately 5 minutes
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
