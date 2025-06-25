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
    value: "R2.5B+",
    label: "Debt Collected",
    prefix: "$",
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
        className={`fixed w-full glass-effect z-50 transition-all duration-500 ${
          isScrolled ? "shadow-lg shadow-primary/20" : ""
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-xl font-bold gradient-text">SmartKollect</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Testimonials
            </a>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-primary/10 btn-glow"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Log in
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 btn-glow"
            >
              Sign up
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-8 px-4 hero-gradient">
        <div className="container mx-auto text-center">
          <h1 className="heading-xl mb-6">
            Welcome to{" "}
            <span className="gradient-text">SmartKollect</span>, a product of Zimako Smart Business Solutions
          </h1>
          <div className="pt-16">
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Automate your collections, improve recovery rates, and maintain
              compliance with our intelligent debt management platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold gradient-text">
                 SmartKollect
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transforming debt collection through intelligent automation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Features
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Security
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Roadmap
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  About
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Careers
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Blog
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Contact
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/popi-act" className="hover:text-primary transition-colors cursor-pointer">
                    POPI Act
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="hover:text-primary transition-colors cursor-pointer">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-primary transition-colors cursor-pointer">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <address className="text-sm text-muted-foreground not-italic">
                61 Sonop Street,<br />
                Horizonview Shopping Centre<br />
                Horizon, Roodepoort, 1724
              </address>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-primary" />
                  <a href="mailto:rofhiwa@zimako.co.za" className="hover:text-primary transition-colors">
                    rofhiwa@zimako.co.za
                  </a>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-primary" />
                  <a href="tel:+27849626748" className="hover:text-primary transition-colors">
                    +27 84 962 6748
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-sm text-muted-foreground">
            &copy; 2025 SmartKollect. All rights reserved.
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
