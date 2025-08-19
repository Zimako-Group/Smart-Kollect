"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  Globe,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Shield,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

const teamMembers = [
  {
    name: "Rofhiwa Mudau",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    bio: "Visionary leader with 10+ years in fintech and debt collection automation.",
    linkedin: "#",
  },
  {
    name: "Sarah Johnson",
    role: "CTO",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    bio: "Technology expert specializing in AI and machine learning solutions.",
    linkedin: "#",
  },
  {
    name: "Michael Chen",
    role: "Head of Product",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    bio: "Product strategist focused on user experience and business automation.",
    linkedin: "#",
  },
  {
    name: "Priya Patel",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    bio: "Operations expert ensuring seamless service delivery and client success.",
    linkedin: "#",
  },
];

const values = [
  {
    icon: Shield,
    title: "Trust & Security",
    description: "We prioritize data security and compliance with the highest industry standards.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Continuously evolving our platform with cutting-edge AI and automation technologies.",
  },
  {
    icon: Heart,
    title: "Empathy",
    description: "Understanding the human side of debt collection while maintaining professionalism.",
  },
  {
    icon: Target,
    title: "Results-Driven",
    description: "Focused on delivering measurable improvements in collection rates and efficiency.",
  },
];

const milestones = [
  {
    year: "2020",
    title: "Company Founded",
    description: "Zimako Smart Business Solutions established with a vision to revolutionize debt collection.",
  },
  {
    year: "2021",
    title: "First Major Client",
    description: "Mahikeng Local Municipality becomes our flagship client, processing millions in debt recovery.",
  },
  {
    year: "2023",
    title: "AI Integration",
    description: "Launched advanced AI-powered analytics and automated workflow capabilities.",
  },
  {
    year: "2024",
    title: "Multi-Tenant Platform",
    description: "Evolved into a scalable multi-tenant SaaS platform serving diverse industries.",
  },
  {
    year: "2025",
    title: "Market Expansion",
    description: "Expanding across South Africa with enterprise-grade solutions and partnerships.",
  },
];

export default function About() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background animated-bg">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/smartkollect-logo.png"
                alt="SmartKollect"
                width={120}
                height={120}
                className="drop-shadow-2xl hover:drop-shadow-3xl transition-all duration-300"
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Home
              </Link>
              <Link
                href="/marketing/pricing"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Pricing
              </Link>
              <Link
                href="/marketing/contact"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Contact
              </Link>
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-glow bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Log in
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 hero-gradient overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            About{" "}
            <span className="gradient-text">SmartKollect</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
            We're revolutionizing debt collection through{" "}
            <span className="text-primary font-semibold">intelligent automation</span>,{" "}
            <span className="text-secondary font-semibold">ethical practices</span>, and{" "}
            <span className="text-tertiary font-semibold">cutting-edge technology</span>.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="glass-effect p-8 border-white/10 hover:border-primary/30 transition-all duration-500">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-6 gradient-text">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To transform debt collection through intelligent automation while maintaining 
                ethical standards and human dignity. We empower organizations to recover debts 
                efficiently while treating customers with respect and understanding.
              </p>
            </Card>

            <Card className="glass-effect p-8 border-white/10 hover:border-secondary/30 transition-all duration-500">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-secondary/20 to-tertiary/20 rounded-2xl flex items-center justify-center">
                <Globe className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-3xl font-bold mb-6 gradient-text">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To become Africa's leading debt collection platform, setting new standards 
                for efficiency, compliance, and customer experience. We envision a future 
                where debt recovery is seamless, ethical, and beneficial for all parties.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Story Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our <span className="gradient-text">Journey</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From a small startup to a leading debt collection platform, 
              here's how we've grown and evolved over the years.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start mb-12 last:mb-0">
                <div className="flex-shrink-0 w-24 text-right mr-8">
                  <div className="text-2xl font-bold gradient-text">{milestone.year}</div>
                </div>
                <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full mt-2 mr-8 relative">
                  <div className="absolute top-4 left-1/2 w-0.5 h-16 bg-gradient-to-b from-primary/50 to-transparent transform -translate-x-1/2"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-primary">{milestone.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The principles that guide everything we do and shape our company culture.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="group card-hover glass-effect p-8 text-center border-white/10 hover:border-primary/30 transition-all duration-500"
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-primary group-hover:text-secondary transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Meet Our <span className="gradient-text">Team</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The passionate individuals behind SmartKollect's success, 
              dedicated to innovation and excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="group card-hover glass-effect p-6 text-center border-white/10 hover:border-primary/30 transition-all duration-500"
              >
                <div className="relative mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={120}
                    height={120}
                    className="rounded-full mx-auto ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="text-secondary font-medium mb-4">{member.role}</p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {member.bio}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/60 transition-all duration-300"
                >
                  Connect
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our <span className="gradient-text">Impact</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Numbers that showcase our commitment to delivering exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-2xl glass-effect border border-white/10 hover:border-primary/30 transition-all duration-500">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">R100M+</div>
              <div className="text-muted-foreground font-medium">Debt Recovered</div>
            </div>
            <div className="text-center p-8 rounded-2xl glass-effect border border-white/10 hover:border-secondary/30 transition-all duration-500">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">2000+</div>
              <div className="text-muted-foreground font-medium">Active Users</div>
            </div>
            <div className="text-center p-8 rounded-2xl glass-effect border border-white/10 hover:border-tertiary/30 transition-all duration-500">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">95%</div>
              <div className="text-muted-foreground font-medium">Success Rate</div>
            </div>
            <div className="text-center p-8 rounded-2xl glass-effect border border-white/10 hover:border-primary/30 transition-all duration-500">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-muted-foreground font-medium">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-tertiary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="gradient-text">Transform</span> Your Business?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Join thousands of organizations that trust SmartKollect for their debt collection needs.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              size="lg"
              className="btn-glow bg-gradient-to-r from-primary via-secondary to-tertiary hover:from-primary/80 hover:via-secondary/80 hover:to-tertiary/80 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link href="/marketing/contact">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-black/40 via-black/30 to-black/20 backdrop-blur-xl border-t border-white/10 py-16">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center mb-6">
                <Image
                  src="/images/smartkollect-logo.png"
                  alt="SmartKollect"
                  width={80}
                  height={80}
                  className="drop-shadow-2xl hover:drop-shadow-3xl transition-all duration-300"
                />
              </Link>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Transforming debt collection through intelligent automation and ethical practices.
              </p>
              <div className="space-y-4">
                <div className="flex items-center group">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/30 transition-colors duration-300">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">
                    61 Sonop Street, Horizonview, Roodepoort, 1724
                  </span>
                </div>
                <div className="flex items-center group">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-secondary/30 transition-colors duration-300">
                    <Mail className="h-4 w-4 text-secondary" />
                  </div>
                  <a href="mailto:rofhiwa@zimako.co.za" className="text-muted-foreground hover:text-secondary transition-colors duration-300">
                    rofhiwa@zimako.co.za
                  </a>
                </div>
                <div className="flex items-center group">
                  <div className="w-8 h-8 bg-tertiary/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-tertiary/30 transition-colors duration-300">
                    <Phone className="h-4 w-4 text-tertiary" />
                  </div>
                  <a href="tel:+27849626748" className="text-muted-foreground hover:text-tertiary transition-colors duration-300">
                    +27 84 962 6748
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-white">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/marketing/about" className="text-primary hover:text-primary/80 transition-all duration-300">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/marketing/pricing" className="text-muted-foreground hover:text-primary transition-all duration-300">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/marketing/contact" className="text-muted-foreground hover:text-primary transition-all duration-300">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-white">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-all duration-300">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-primary transition-all duration-300">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/popi-act" className="text-muted-foreground hover:text-primary transition-all duration-300">
                    POPI Act
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
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
    </div>
  );
}
