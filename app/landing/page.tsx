"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Lock,
  Mail,
  Phone,
  PlayCircle,
  Shield,
  Star,
  Users,
  Workflow,
  Zap,
  Target,
  TrendingUp,
  HeadphonesIcon,
  FileText,
  Menu,
  User
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

const features = [
  {
    title: "Intelligent Automation",
    description: "AI-powered workflows that adapt to your collection strategies and optimize performance automatically.",
    icon: Workflow,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Real-time Analytics",
    description: "Comprehensive dashboards with live data insights to make informed collection decisions.",
    icon: BarChart3,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "POPI Compliance",
    description: "Built-in compliance management ensuring adherence to South African data protection laws.",
    icon: Shield,
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Multi-Channel Collection",
    description: "Integrated SMS, email, voice calls, and payment processing for maximum reach.",
    icon: DollarSign,
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Performance Tracking",
    description: "Detailed agent performance metrics with gamification and productivity insights.",
    icon: Target,
    color: "from-indigo-500 to-purple-500"
  },
  {
    title: "24/7 Support",
    description: "Round-the-clock technical support and dedicated account management.",
    icon: HeadphonesIcon,
    color: "from-teal-500 to-blue-500"
  }
];

const stats = [
  {
    value: "R100M+",
    label: "Debt Recovered",
    description: "Total amount successfully collected for our clients",
    icon: TrendingUp,
  },
  {
    value: "95%",
    label: "Success Rate",
    description: "Average improvement in collection rates",
    icon: Target,
  },
  {
    value: "2000+",
    label: "Active Users",
    description: "Collection agents using our platform daily",
    icon: Users,
  },
  {
    value: "75%",
    label: "Time Saved",
    description: "Reduction in manual processing time",
    icon: Clock,
  },
];

const testimonials = [
  {
    quote: "SmartKollect has revolutionized our debt collection process. The automation features have increased our recovery rates by 40% while ensuring full POPI compliance.",
    author: "Sarah Molefe",
    role: "CFO, Mahikeng Local Municipality",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    company: "Mahikeng Local Municipality"
  },
  {
    quote: "The platform's intelligent workflows and real-time analytics have transformed how we approach debt collection. Our agents are more productive than ever.",
    author: "Michael Ndaba",
    role: "Operations Director, Triple M Collections",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    company: "Triple M Collections"
  },
  {
    quote: "Outstanding support and a platform that truly understands the South African market. The compliance features give us complete peace of mind.",
    author: "Dr. Nomsa Khumalo",
    role: "Head of Finance, Regional Municipality",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    company: "Regional Municipality"
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "R2,500",
    period: "/month",
    description: "Perfect for small collection teams",
    features: [
      "Up to 10 agents",
      "Basic automation",
      "Standard reporting",
      "Email support",
      "5GB storage"
    ]
  },
  {
    name: "Professional",
    price: "R7,500",
    period: "/month",
    description: "Ideal for growing businesses",
    features: [
      "Up to 50 agents",
      "Advanced AI automation",
      "Real-time analytics",
      "24/7 priority support",
      "50GB storage"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Unlimited agents",
      "Full automation suite",
      "Custom integrations",
      "Dedicated support",
      "Unlimited storage"
    ]
  }
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStats();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsSection = document.getElementById("stats");
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const animateStats = () => {
    stats.forEach((stat, index) => {
      const target = parseInt(stat.value.replace(/[^0-9]/g, ""));
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedStats((prev) => {
          const newStats = [...prev];
          newStats[index] = Math.floor(current);
          return newStats;
        });
      }, 30);
    });
  };

  const formatStatValue = (stat: any, animatedValue: number) => {
    if (stat.value.includes("R")) {
      return `R${animatedValue}M+`;
    }
    if (stat.value.includes("%")) {
      return `${animatedValue}%`;
    }
    if (stat.value.includes("+")) {
      return `${animatedValue}+`;
    }
    return `${animatedValue}%`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-background/90 backdrop-blur-2xl border-b border-primary/20 shadow-2xl shadow-primary/5"
            : "bg-gradient-to-r from-background/10 via-background/5 to-background/10 backdrop-blur-sm"
        }`}
      >
        {/* Animated background gradient */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          isScrolled ? "opacity-100" : "opacity-0"
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute top-0 right-1/4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
          </div>
        </div>
        
        <div className="container mx-auto px-6 py-5 relative z-10">
          <div className="flex items-center justify-between">
            {/* Enhanced Logo */}
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src="/images/smartkollect-logo.png"
                  alt="SmartKollect"
                  width={160}
                  height={45}
                  className="h-12 w-auto relative z-10 group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                />
              </div>
            </Link>

            {/* Enhanced Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {[
                { href: "#features", label: "Features", icon: "" },
                { href: "#pricing", label: "Pricing", icon: "" },
                { href: "/marketing/about", label: "About", icon: "" },
                { href: "/marketing/contact", label: "Contact", icon: "" }
              ].map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative px-4 py-2 rounded-xl text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </Link>
              ))}
              
              {/* Enhanced Sign In Button */}
              <div className="ml-4 pl-4 border-l border-border/30">
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-primary/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="flex items-center gap-2 relative z-10">
                    <User className="h-4 w-4" />
                    <span>Sign In</span>
                  </div>
                </Button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
              >
                <Menu className="h-6 w-6 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle bottom border animation */}
        <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-opacity duration-500 ${
          isScrolled ? "opacity-100" : "opacity-0"
        }`} />
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative pt-40 pb-32 px-4 overflow-hidden min-h-screen flex items-center">
        {/* Multi-layered Background */}
        <div className="absolute inset-0">
          {/* Primary gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/8" />
          
          {/* Animated orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-primary/15 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-10 w-[500px] h-[500px] bg-gradient-to-l from-secondary/15 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}} />
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}} />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary/40 rounded-full animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '3s', animationDuration: '2.5s'}} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '60px 60px'
            }} />
          </div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/15 to-secondary/15 backdrop-blur-sm border border-primary/30 rounded-full px-6 py-3 mb-8 group hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-primary">🚀 Now Available</span>
              </div>
              <span className="text-sm text-muted-foreground">Advanced AI-Powered Debt Collection</span>
              <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block mb-2">Transform Your</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
                  Debt Collection
                </span>
                {/* Underline animation */}
                <div className="absolute -bottom-4 left-0 right-0 h-2 bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
              </span>
              <span className="block mt-2">Process</span>
            </h1>
            
            {/* Enhanced Description */}
            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 leading-relaxed">
                SmartKollect combines <span className="font-semibold text-primary">intelligent automation</span>, 
                <span className="font-semibold text-secondary"> real-time analytics</span>, and 
                <span className="font-semibold text-green-500"> POPI compliance</span> to revolutionize 
                how South African organizations manage debt collection.
              </p>
              
              {/* Key benefits pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                  ✅ 40% Higher Recovery Rates
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  🛡️ 100% POPI Compliant
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  ⚡ Setup in Minutes
                </div>
              </div>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button
                size="lg"
                onClick={() => setIsLoginModalOpen(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary hover:from-primary/90 hover:via-secondary/90 hover:to-primary/90 text-white px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 border-2 border-primary/30"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="flex items-center gap-3 relative z-10">
                  <Zap className="h-6 w-6 animate-pulse" />
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                asChild
                className="group border-2 border-primary/30 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-primary/5 px-10 py-5 text-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Link href="/marketing/contact">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <PlayCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                    </div>
                    <span>Watch Demo</span>
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </Link>
              </Button>
            </div>

            {/* Enhanced Trust Indicators */}
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105 group">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-green-500/30 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-green-600 dark:text-green-400">30-Day Free Trial</h3>
                  <p className="text-sm text-muted-foreground text-center">Full access to all features with no commitment required</p>
                </div>
                
                <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 group">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <Shield className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">POPI Compliant</h3>
                  <p className="text-sm text-muted-foreground text-center">Built-in compliance for South African data protection laws</p>
                </div>
                
                <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 group">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-purple-600 dark:text-purple-400">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground text-center">Round-the-clock expert assistance and dedicated support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-8 text-center hover:shadow-lg transition-all duration-300 border-border/50">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {formatStatValue(stat, animatedStats[index])}
                  </div>
                  <div className="font-semibold mb-2">{stat.label}</div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Powerful Features for{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Modern Collection
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Everything you need to streamline your debt collection process and maximize recovery rates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group p-8 hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20"
                >
                  <div className={`w-14 h-14 mb-6 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Industry Leaders
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              See what our clients say about their experience with SmartKollect.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 md:p-12 text-center border-border/50">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed italic">
                "{testimonials[activeTestimonial].quote}"
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <Image
                  src={testimonials[activeTestimonial].image}
                  alt={testimonials[activeTestimonial].author}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                <div className="text-left">
                  <div className="font-semibold">{testimonials[activeTestimonial].author}</div>
                  <div className="text-sm text-muted-foreground">{testimonials[activeTestimonial].role}</div>
                  <div className="text-xs text-primary font-medium">{testimonials[activeTestimonial].company}</div>
                </div>
              </div>
            </Card>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-20 px-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/3 to-secondary/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm border border-primary/20 rounded-full px-6 py-2 mb-6">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Transparent Pricing</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Flexible pricing designed to grow with your business. All plans include a comprehensive 30-day free trial with full access to features.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`group relative overflow-hidden backdrop-blur-sm transition-all duration-500 hover:scale-105 ${
                  plan.popular 
                    ? 'border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-2xl shadow-primary/10' 
                    : 'border border-border/30 bg-gradient-to-br from-background/80 to-muted/20 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'
                }`}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-primary/10 via-transparent to-secondary/10' 
                    : 'bg-gradient-to-br from-primary/5 via-transparent to-secondary/5'
                }`} />
                
                {plan.popular && (
                  <>
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-primary via-secondary to-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                        ⭐ Most Popular
                      </div>
                    </div>
                    {/* Glowing border effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-lg blur-sm -z-10" />
                  </>
                )}
                
                <div className="relative z-10 p-8 text-center">
                  {/* Plan header */}
                  <div className="mb-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30' 
                        : 'bg-gradient-to-br from-muted/50 to-background border border-border/50'
                    }`}>
                      {index === 0 && <Zap className="h-8 w-8 text-primary" />}
                      {index === 1 && <Target className="h-8 w-8 text-primary" />}
                      {index === 2 && <Star className="h-8 w-8 text-primary" />}
                    </div>
                    <h3 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{plan.name}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{plan.description}</p>
                  </div>
                  
                  {/* Pricing */}
                  <div className="mb-10">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className={`text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${
                        plan.popular ? 'animate-pulse' : ''
                      }`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground text-lg">{plan.period}</span>
                      )}
                    </div>
                    {plan.name !== 'Enterprise' && (
                      <p className="text-sm text-muted-foreground mt-2">Billed monthly • Cancel anytime</p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-10">
                    <ul className="space-y-4 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3 group/item">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mt-0.5">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                          <span className="text-foreground group-hover/item:text-primary transition-colors duration-200">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => setIsLoginModalOpen(true)}
                    size="lg"
                    className={`w-full py-4 text-lg font-semibold transition-all duration-300 group-hover:scale-105 shadow-lg ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary via-secondary to-primary hover:from-primary/90 hover:via-secondary/90 hover:to-primary/90 shadow-primary/20 hover:shadow-xl hover:shadow-primary/30'
                        : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 hover:shadow-xl hover:shadow-primary/20'
                    }`}
                  >
                    {plan.name === 'Enterprise' ? (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Contact Sales
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Start Free Trial
                      </>
                    )}
                  </Button>
                  
                  {plan.name !== 'Enterprise' && (
                    <p className="text-xs text-muted-foreground mt-3">
                      No credit card required • Full access for 30 days
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Additional info */}
          <div className="text-center mt-16">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-muted/30 to-background/50 backdrop-blur-sm border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>24/7 premium support</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                <span>99.9% uptime guarantee</span>
              </div>
            </div>
            
            <div className="mt-8">
              <Button variant="outline" size="lg" asChild className="group border-2 border-primary/20 hover:border-primary/40 px-8 py-3">
                <Link href="/marketing/pricing">
                  <FileText className="mr-2 h-5 w-5" />
                  View Detailed Pricing
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Ready to Get Started Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Dynamic background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-l from-secondary/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
          </div>
          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: '50px 50px'
            }} />
          </div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Header badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 backdrop-blur-sm border border-primary/30 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-primary">Ready to Transform Your Business?</span>
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
            </div>
            
            {/* Main heading */}
            <h2 className="text-4xl md:text-7xl font-bold mb-8 leading-tight">
              Ready to{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
                  Get Started
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 rounded-full animate-pulse" />
              </span>
              ?
            </h2>
            
            {/* Enhanced description */}
            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 leading-relaxed">
                Join <span className="font-bold text-primary">thousands of organizations</span> that trust SmartKollect for their debt collection needs.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-300 font-medium">30-day free trial</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-700 dark:text-blue-300 font-medium">No credit card required</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Setup in minutes</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button
                size="lg"
                onClick={() => setIsLoginModalOpen(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary hover:from-primary/90 hover:via-secondary/90 hover:to-primary/90 text-white px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border-2 border-primary/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Zap className="mr-3 h-6 w-6 animate-pulse" />
                Start Free Trial Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                asChild
                className="group border-2 border-primary/30 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-primary/5 px-10 py-5 text-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Link href="/marketing/contact">
                  <Users className="mr-3 h-6 w-6" />
                  Contact Sales
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-green-500/30">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Proven Results</h3>
                  <p className="text-muted-foreground text-center text-sm">Average 40% improvement in collection rates within the first month</p>
                </div>
                
                <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-sm border border-border/30 hover:border-secondary/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <Shield className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Fully Compliant</h3>
                  <p className="text-muted-foreground text-center text-sm">Built-in POPI compliance and data protection for South African businesses</p>
                </div>
                
                <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-sm border border-border/30 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                    <HeadphonesIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Expert Support</h3>
                  <p className="text-muted-foreground text-center text-sm">24/7 dedicated support team and onboarding assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative overflow-hidden">
        {/* Multi-layered Background */}
        <div className="absolute inset-0">
          {/* Primary gradient background matching your color scheme */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8" />
          
          {/* Animated orbs using your brand colors */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-primary/15 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-l from-secondary/15 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}} />
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}} />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary/40 rounded-full animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '3s', animationDuration: '2.5s'}} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '60px 60px'
            }} />
          </div>
        </div>

        {/* Top border with gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Enhanced Newsletter Section */}
          <div className="py-20 border-b border-border/20">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 backdrop-blur-sm border border-primary/30 rounded-full px-6 py-2 mb-6">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Stay Connected</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
                  Stay Updated with SmartKollect
                </span>
              </h3>
              
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                Get the latest insights on debt collection trends, product updates, and industry best practices 
                delivered straight to your inbox.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
                <div className="relative flex-1">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full px-6 py-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 hover:border-primary/30"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <Button className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 px-8 py-4 font-semibold text-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 group">
                  <span className="relative z-10 flex items-center gap-2">
                    Subscribe
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>No spam, ever</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>Join 5,000+ subscribers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span>Weekly insights</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Main Footer Content */}
          <div className="py-20">
            <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-12 mb-16">
              {/* Enhanced Company Info */}
              <div className="lg:col-span-2 md:col-span-3">
                <Link href="/" className="flex items-center mb-8 group">
                  <div className="relative">
                    <Image
                      src="/images/smartkollect-logo.png"
                      alt="SmartKollect"
                      width={180}
                      height={50}
                      className="h-14 w-auto transition-all duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  </div>
                </Link>
                
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-lg">
                  Transforming debt collection through intelligent automation and ethical practices. 
                  Empowering businesses with AI-driven solutions for better recovery rates and 
                  seamless compliance management.
                </p>
                
                {/* Enhanced Social Media Icons */}
                <div className="flex space-x-4 mb-8">
                  <div className="relative group">
                    <div className="w-12 h-12 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/25">
                      <Mail className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="relative group">
                    <div className="w-12 h-12 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 hover:border-secondary/50 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-secondary/25">
                      <Phone className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="relative group">
                    <div className="w-12 h-12 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 hover:border-blue-500/50 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25">
                      <svg className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="relative group">
                    <div className="w-12 h-12 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-border/50 hover:border-blue-600/50 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-600/25">
                      <svg className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                
                {/* Key stats */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-1">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                    <div className="text-2xl font-bold text-secondary mb-1">24/7</div>
                    <div className="text-sm text-muted-foreground">Support</div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Product Links */}
              <div>
                <h4 className="font-bold mb-8 text-foreground flex items-center text-lg">
                  <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/50 rounded-full mr-3 animate-pulse"></div>
                  Product
                </h4>
                <ul className="space-y-4">
                  <li>
                    <a href="#features" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Features</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </a>
                  </li>
                  <li>
                    <Link href="/marketing/pricing" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Pricing</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Security</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Integrations</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Enhanced Company Links */}
              <div>
                <h4 className="font-bold mb-8 text-foreground flex items-center text-lg">
                  <div className="w-3 h-3 bg-gradient-to-r from-secondary to-secondary/50 rounded-full mr-3 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  Company
                </h4>
                <ul className="space-y-4">
                  <li>
                    <Link href="/marketing/about" className="text-muted-foreground hover:text-secondary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>About Us</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-secondary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Careers</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-secondary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Blog</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </a>
                  </li>
                  <li>
                    <Link href="/marketing/contact" className="text-muted-foreground hover:text-secondary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Contact</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Enhanced Legal Links */}
              <div>
                <h4 className="font-bold mb-8 text-foreground flex items-center text-lg">
                  <div className="w-3 h-3 bg-gradient-to-r from-tertiary to-tertiary/50 rounded-full mr-3 animate-pulse" style={{animationDelay: '1s'}}></div>
                  Legal
                </h4>
                <ul className="space-y-4">
                  <li>
                    <Link href="/popi-act" className="text-muted-foreground hover:text-tertiary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>POPI Act</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-tertiary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Terms & Conditions</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="text-muted-foreground hover:text-tertiary transition-all duration-300 hover:translate-x-2 inline-flex items-center group text-base">
                      <span>Privacy Policy</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="border-t border-white/10 py-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-6 text-white flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full mr-3 animate-pulse"></div>
                  Get in Touch
                </h4>
                <address className="text-gray-300 not-italic leading-relaxed">
                  <div className="mb-3">
                    <strong className="text-white">Zimako Smart Business Solutions</strong>
                  </div>
                  61 Sonop Street,<br />
                  Horizonview Shopping Centre<br />
                  Horizon, Roodepoort, 1724<br />
                  South Africa
                </address>
              </div>
              <div>
                <h4 className="font-semibold mb-6 text-white flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-secondary to-tertiary rounded-full mr-3 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  Contact Information
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center group">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/30 transition-colors duration-300">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <a href="mailto:rofhiwa@zimako.co.za" className="text-gray-300 hover:text-primary transition-colors duration-300">
                      rofhiwa@zimako.co.za
                    </a>
                  </div>
                  <div className="flex items-center group">
                    <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-secondary/30 transition-colors duration-300">
                      <Phone className="h-4 w-4 text-secondary" />
                    </div>
                    <a href="tel:+27849626748" className="text-gray-300 hover:text-secondary transition-colors duration-300">
                      +27 84 962 6748
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Footer */}
          <div className="border-t border-white/10 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0 text-sm">
                &copy; 2025 SmartKollect by Zimako Smart Business Solutions. All rights reserved.
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>Made with</span>
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
                  <span>in South Africa</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center gap-2 text-green-400">
                    <Shield className="h-4 w-4" />
                    <span>POPI Compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <Lock className="h-4 w-4" />
                    <span>Bank-Grade Security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}