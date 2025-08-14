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
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import SupabaseConnectionTest from '@/components/SupabaseConnectionTest';
import { MahikengAIButton } from "@/components/MahikengAIButton";

const features = [
  {
    title: "Automated Workflows",
    description:
      "Streamline collection processes with intelligent automation and customizable workflows.",
    icon: Workflow,
  },
  {
    title: "Real-time Analytics",
    description:
      "Make data-driven decisions with comprehensive dashboards and reporting tools.",
    icon: BarChart3,
  },
  {
    title: "Compliance Management",
    description:
      "Stay compliant with automated regulatory checks and documentation.",
    icon: Shield,
  },
  {
    title: "Payment Processing",
    description:
      "Seamless integration with multiple payment gateways for faster collections.",
    icon: DollarSign,
  },
];

const stats = [
  {
    value: "R100M+",
    label: "Debt Collected",
    prefix: "R",
  },
  {
    value: "95%",
    label: "Success Rate",
    prefix: "",
  },
  {
    value: "2000+",
    label: "Active Clients",
    prefix: "",
  },
  {
    value: "75%",
    label: "Time Saved",
    prefix: "",
  },
];


const testimonials = [
  {
    quote:
      "DCMS has transformed our collection process. We've seen a 40% increase in recovery rates.",
    author: "Sarah Johnson",
    role: "CFO, TechCorp Inc.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  },
  {
    quote:
      "The automation features have saved us countless hours. Best investment we made this year.",
    author: "Michael Chen",
    role: "Operations Director, Global Finance",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
  },
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);

      // Animate sections on scroll
      sectionRefs.current.forEach((section) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const isInView = rect.top <= window.innerHeight * 0.75;
        if (isInView) {
          section.classList.add("in-view");
        }
      });
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
      }, 20);
    });
  };

  return (
    <div className="min-h-screen bg-background animated-bg">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-white/10 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <DollarSign className="h-8 w-8 text-primary drop-shadow-lg" />
                <div className="absolute inset-0 h-8 w-8 text-primary animate-pulse opacity-30"></div>
              </div>
              <span className="text-2xl font-bold gradient-text drop-shadow-sm">
                SmartKollect
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="#testimonials"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group"
              >
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-glow bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Log in
              </Button>
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/60 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                Sign up
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 hero-gradient overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
              Powered by Zimako Smart Business Solutions
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Welcome to{" "}
            <span className="gradient-text block md:inline">SmartKollect</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
            Revolutionize your debt collection with{" "}
            <span className="text-primary font-semibold">AI-powered automation</span>,{" "}
            <span className="text-secondary font-semibold">intelligent workflows</span>, and{" "}
            <span className="text-tertiary font-semibold">compliance management</span>{" "}
            that delivers exceptional recovery rates.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              size="lg"
              className="btn-glow bg-gradient-to-r from-primary via-secondary to-tertiary hover:from-primary/80 hover:via-secondary/80 hover:to-tertiary/80 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105 group"
            >
              <PlayCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>POPI Act Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span>2000+ Active Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-400" />
              <span>95% Success Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for{" "}
              <span className="gradient-text">Modern Collection</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Streamline your debt collection process with cutting-edge technology
              designed to maximize recovery rates while maintaining compliance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group card-hover glass-effect p-8 text-center border-white/10 hover:border-primary/30 transition-all duration-500"
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-8 w-8 text-primary group-hover:text-secondary transition-colors duration-300" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
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

      {/* Our Clients Section */}
      <section id="clients" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by <span className="gradient-text">Leading Organizations</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              SmartKollect powers debt collection for municipalities and businesses across South Africa
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mahikeng Client Card */}
            <Card className="group card-hover glass-effect p-8 border-white/10 hover:border-primary/30 transition-all duration-500">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-10 w-10 text-primary group-hover:text-secondary transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  Mahikeng Local Municipality
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Streamlining municipal debt collection with intelligent automation and compliance management
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>500+ Agents</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>R50M+ Recovered</span>
                  </div>
                </div>
                <Link href="https://mahikeng.smartkollect.co.za" target="_blank" className="mt-6">
                  <Button variant="outline" className="group-hover:border-primary group-hover:text-primary transition-all duration-300">
                    Visit Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Triple M Client Card */}
            <Card className="group card-hover glass-effect p-8 border-white/10 hover:border-primary/30 transition-all duration-500">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 mb-6 bg-gradient-to-br from-secondary/20 to-tertiary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-10 w-10 text-secondary group-hover:text-tertiary transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-secondary transition-colors duration-300">
                  Triple M Financial Services
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Advanced debt recovery solutions with AI-powered analytics and automated workflows
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>10+ Agents</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>New Client</span>
                  </div>
                </div>
                <Link href="https://triplem.smartkollect.co.za" target="_blank" className="mt-6">
                  <Button variant="outline" className="group-hover:border-secondary group-hover:text-secondary transition-all duration-300">
                    Visit Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Proven <span className="gradient-text">Results</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
            Join thousands of businesses that have transformed their collection processes
            with SmartKollect's intelligent automation.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl glass-effect border border-white/10 hover:border-primary/30 transition-all duration-500 hover:scale-105"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.prefix}{animatedStats[index] || 0}{stat.value.includes('%') ? '%' : stat.value.includes('+') ? '+' : ''}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Our <span className="gradient-text">Clients Say</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. See how SmartKollect has transformed
              businesses across various industries.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="group card-hover glass-effect p-8 border-white/10 hover:border-primary/30 transition-all duration-500"
              >
                <div className="flex items-start space-x-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    width={60}
                    height={60}
                    className="rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300"
                  />
                  <div className="flex-1">
                    <p className="text-muted-foreground mb-4 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <div className="font-semibold text-primary group-hover:text-secondary transition-colors duration-300">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-black/40 via-black/30 to-black/20 backdrop-blur-xl border-t border-white/10 py-16 mt-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <DollarSign className="h-8 w-8 text-primary drop-shadow-lg" />
                  <div className="absolute inset-0 h-8 w-8 text-primary animate-pulse opacity-30"></div>
                </div>
                <span className="text-2xl font-bold gradient-text">
                 SmartKollect
                </span>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Transforming debt collection through intelligent automation.
                Empowering businesses with AI-driven solutions for better recovery rates
                and seamless compliance management.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110">
                  <Phone className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-white">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-white">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-white">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/popi-act" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    POPI Act
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="border-t border-white/10 pt-12 mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-6 text-white flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
                  Get in Touch
                </h4>
                <address className="text-muted-foreground not-italic leading-relaxed">
                  61 Sonop Street,<br />
                  Horizonview Shopping Centre<br />
                  Horizon, Roodepoort, 1724<br />
                  South Africa
                </address>
              </div>
              <div>
                <h4 className="font-semibold mb-6 text-white flex items-center">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-3 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  Contact Information
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center group">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/30 transition-colors duration-300">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <a href="mailto:rofhiwa@zimako.co.za" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                      rofhiwa@zimako.co.za
                    </a>
                  </div>
                  <div className="flex items-center group">
                    <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-secondary/30 transition-colors duration-300">
                      <Phone className="h-4 w-4 text-secondary" />
                    </div>
                    <a href="tel:+27849626748" className="text-muted-foreground hover:text-secondary transition-colors duration-300">
                      +27 84 962 6748
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-muted-foreground mb-4 md:mb-0">
                &copy; 2025 SmartKollect by Zimako Smart Business Solutions. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Made with</span>
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
                <span>in South Africa</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      
      {/* Mahikeng AI Floating Button */}
      <MahikengAIButton />
    </div>
  );
}
