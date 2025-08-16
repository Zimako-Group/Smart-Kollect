"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Sparkles,
  HelpCircle,
  Search,
  Book,
  FileText,
  Phone,
  Mail,
  MessageSquare,
  Zap,
  Download,
  ExternalLink,
  LifeBuoy,
  FileQuestion,
  Settings,
  Lightbulb,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HelpPage() {
  return (
    <div className="w-full max-w-none py-8 space-y-6 px-6">
      {/* Hero Section */}
      <div className="relative mb-12 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 z-0"></div>
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10 z-0"></div>
        <div className="relative z-10 px-8 py-12 md:py-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4">
              How can we help you today?
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Find answers, resources, and support for Zimako DCMS
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for help topics..."
                className="pl-11 py-6 text-lg rounded-full border-2 border-muted/80 focus-visible:ring-purple-500"
              />
            </div>
          </div>
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(124, 58, 237, 0)",
                  "0 0 0 4px rgba(124, 58, 237, 0.3)",
                  "0 0 0 8px rgba(124, 58, 237, 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
            <Link href="/user/changelog">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 relative group"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Changelog
                <motion.div
                  className="absolute -right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: -5 }}
                  whileHover={{ x: 0 }}
                >
                  <div className="border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-primary"></div>
                </motion.div>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Popular Topics</h2>
          <Link
            href="#"
            className="text-primary hover:underline flex items-center"
          >
            View all topics <ExternalLink className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Zap className="h-5 w-5" />,
              title: "Getting Started",
              desc: "New to Zimako DCMS? Start here",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: <Settings className="h-5 w-5" />,
              title: "Account Settings",
              desc: "Manage your account",
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: <FileQuestion className="h-5 w-5" />,
              title: "FAQs",
              desc: "Common questions",
              color: "from-amber-500 to-orange-500",
            },
            {
              icon: <Lightbulb className="h-5 w-5" />,
              title: "Best Practices",
              desc: "Optimize your workflow",
              color: "from-emerald-500 to-green-500",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-gradient-to-br ${item.color} text-white`}
              >
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Help Resources Tabs */}
      <div className="mb-12">
        <Tabs defaultValue="guides" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Help Resources</h2>
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="guides" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Debt Collection Basics",
                  desc: "Learn the fundamentals of effective debt collection",
                  time: "5 min read",
                  new: true,
                },
                {
                  title: "Campaign Management",
                  desc: "Create and optimize collection campaigns",
                  time: "8 min read",
                },
                {
                  title: "Reporting & Analytics",
                  desc: "Get insights from your collection data",
                  time: "6 min read",
                },
              ].map((guide, i) => (
                <Card key={i} className="overflow-hidden group">
                  <div className="h-40 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative">
                    <div className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-5"></div>
                    {guide.new && (
                      <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                        New
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {guide.title}
                    </CardTitle>
                    <CardDescription>{guide.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> {guide.time}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group-hover:text-primary group-hover:bg-primary/10 transition-colors"
                    >
                      Read Guide
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documentation" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[
                    {
                      icon: <Book className="h-5 w-5" />,
                      title: "User Manual",
                      description: "Complete system documentation",
                    },
                    {
                      icon: <FileText className="h-5 w-5" />,
                      title: "API Documentation",
                      description: "Integration reference for developers",
                    },
                    {
                      icon: <Settings className="h-5 w-5" />,
                      title: "System Configuration",
                      description: "Setup and configuration guides",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 5 }}
                      className="flex items-center p-4 rounded-lg hover:bg-muted cursor-pointer group border"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {item.icon}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="downloads" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Quick Start Guide", format: "PDF", size: "2.4 MB" },
                {
                  title: "Data Import Templates",
                  format: "XLSX",
                  size: "1.8 MB",
                },
                { title: "System Requirements", format: "PDF", size: "1.2 MB" },
                { title: "Branding Guidelines", format: "PDF", size: "3.5 MB" },
              ].map((resource, i) => (
                <Card
                  key={i}
                  className="flex items-center p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-4">
                    <Download className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{resource.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">
                        {resource.format}
                      </Badge>
                      <span>{resource.size}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-4">
                    Download
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Support */}
      <Card className="overflow-hidden border-2">
        <div className="absolute right-0 top-0 h-16 w-16">
          <div className="absolute transform rotate-45 bg-primary text-primary-foreground text-xs font-medium py-1 right-[-40px] top-[32px] w-[170px] text-center">
            24/7 Support
          </div>
        </div>
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardTitle className="flex items-center text-2xl">
            <LifeBuoy className="h-6 w-6 mr-2 text-primary" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Our support team is ready to assist you with any questions or issues
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-muted rounded-xl p-6 text-center hover:border-primary/50 hover:shadow-md transition-all">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
              <p className="text-muted-foreground mb-4">
                Speak directly with our support agents
              </p>
              <p className="font-medium text-lg">+27 (0) 11 123 4567</p>
              <p className="text-sm text-muted-foreground">
                Mon-Fri, 8am-6pm SAST
              </p>
            </div>

            <div className="bg-card border-2 border-muted rounded-xl p-6 text-center hover:border-primary/50 hover:shadow-md transition-all">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email Support</h3>
              <p className="text-muted-foreground mb-4">
                Send us your questions anytime
              </p>
              <p className="font-medium text-lg">support@zimako.co.za</p>
              <p className="text-sm text-muted-foreground">
                24-hour response time
              </p>
            </div>

            <div className="bg-card border-2 border-primary/50 rounded-xl p-6 text-center shadow-md shadow-primary/10">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
              <p className="text-muted-foreground mb-4">
                Get immediate assistance from our team
              </p>
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Start Chat Now
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Typically replies in minutes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
