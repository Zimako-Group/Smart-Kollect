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
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/smartkollect-logo.png"
                alt="SmartKollect"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Pricing
              </Link>
              <Link
                href="/marketing/about"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                About
              </Link>
              <Link
                href="/marketing/contact"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Contact
              </Link>
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Sign In
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Transform Your{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Debt Collection
              </span>{" "}
              Process
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              SmartKollect combines intelligent automation, real-time analytics, and POPI compliance 
              to revolutionize how South African organizations manage debt collection.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-primary/20 hover:border-primary/40 px-8 py-4 text-lg font-semibold"
              >
                <Link href="/marketing/contact">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>30-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>POPI compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>24/7 support</span>
              </div>
            </div>
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

      {/* Pricing Preview Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Choose the perfect plan for your organization. All plans include a 30-day free trial.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`p-8 text-center relative border-border/50 hover:shadow-lg transition-all duration-300 ${
                  plan.popular ? 'border-primary/50 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </Button>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link href="/marketing/pricing">
                View Detailed Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Get Started
              </span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of organizations that trust SmartKollect for their debt collection needs.
              Start your free trial today—no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-primary/20 hover:border-primary/40 px-8 py-4 text-lg font-semibold"
              >
                <Link href="/marketing/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-t border-white/10">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-tertiary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Newsletter Section */}
          <div className="py-16 border-b border-white/10">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Stay Updated with SmartKollect
              </h3>
              <p className="text-gray-300 mb-8">
                Get the latest insights on debt collection trends, product updates, and industry best practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                />
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Footer Content */}
          <div className="py-16">
            <div className="grid md:grid-cols-5 gap-8 mb-12">
              {/* Company Info */}
              <div className="md:col-span-2">
                <Link href="/" className="flex items-center mb-6 group">
                  <Image
                    src="/images/smartkollect-logo.png"
                    alt="SmartKollect"
                    width={160}
                    height={45}
                    className="h-12 w-auto drop-shadow-2xl hover:drop-shadow-3xl transition-all duration-300 group-hover:scale-105"
                  />
                </Link>
                <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
                  Transforming debt collection through intelligent automation and ethical practices. 
                  Empowering businesses with AI-driven solutions for better recovery rates and 
                  seamless compliance management.
                </p>
                
                {/* Social Media Icons */}
                <div className="flex space-x-4 mb-6">
                  <div className="w-10 h-10 bg-white/10 hover:bg-primary/30 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group">
                    <Mail className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </div>
                  <div className="w-10 h-10 bg-white/10 hover:bg-secondary/30 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group">
                    <Phone className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </div>
                  <div className="w-10 h-10 bg-white/10 hover:bg-blue-500/30 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group">
                    <svg className="h-5 w-5 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </div>
                  <div className="w-10 h-10 bg-white/10 hover:bg-blue-600/30 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group">
                    <svg className="h-5 w-5 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Product Links */}
              <div>
                <h4 className="font-semibold mb-6 text-white flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
                  Product
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#features" className="text-gray-300 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Features
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </a>
                  </li>
                  <li>
                    <Link href="/marketing/pricing" className="text-gray-300 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Pricing
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-gray-300 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Security
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-300 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Integrations
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Company Links */}
              <div>
                <h4 className="font-semibold mb-6 text-white flex items-center">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-3 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  Company
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/marketing/about" className="text-gray-300 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block group">
                      About Us
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-gray-300 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Careers
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-300 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Blog
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </a>
                  </li>
                  <li>
                    <Link href="/marketing/contact" className="text-gray-300 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Contact
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Legal Links */}
              <div>
                <h4 className="font-semibold mb-6 text-white flex items-center">
                  <div className="w-2 h-2 bg-tertiary rounded-full mr-3 animate-pulse" style={{animationDelay: '1s'}}></div>
                  Legal
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/popi-act" className="text-gray-300 hover:text-tertiary transition-all duration-300 hover:translate-x-1 inline-block group">
                      POPI Act
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-and-conditions" className="text-gray-300 hover:text-tertiary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Terms & Conditions
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="text-gray-300 hover:text-tertiary transition-all duration-300 hover:translate-x-1 inline-block group">
                      Privacy Policy
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
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