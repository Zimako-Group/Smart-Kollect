"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Users,
} from "lucide-react";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useToast } from "@/hooks/use-toast";

const contactMethods = [
  {
    icon: Phone,
    title: "Phone",
    description: "Speak directly with our team",
    contact: "+27 84 962 6748",
    action: "tel:+27849626748",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Send us a detailed message",
    contact: "rofhiwa@zimako.co.za",
    action: "mailto:rofhiwa@zimako.co.za",
  },
  {
    icon: MapPin,
    title: "Office",
    description: "Visit us in person",
    contact: "61 Sonop Street, Horizonview, Roodepoort",
    action: "#",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Get instant support",
    contact: "Available 9 AM - 5 PM",
    action: "#",
  },
];

const faqs = [
  {
    question: "How quickly can we get started?",
    answer: "Implementation typically takes 2-4 weeks depending on your requirements. We provide full onboarding support and training.",
  },
  {
    question: "Is SmartKollect POPI Act compliant?",
    answer: "Yes, SmartKollect is fully POPI Act compliant with bank-grade security measures and data protection protocols.",
  },
  {
    question: "Can we integrate with our existing systems?",
    answer: "Absolutely! SmartKollect offers robust API integrations and can connect with most CRM, ERP, and financial systems.",
  },
  {
    question: "What support do you provide?",
    answer: "We offer 24/7 technical support, dedicated account management, training sessions, and comprehensive documentation.",
  },
];

export default function Contact() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    employees: "",
    message: "",
    requestDemo: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        phone: "",
        employees: "",
        message: "",
        requestDemo: false,
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                href="/marketing/about"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                About
              </Link>
              <Link
                href="/marketing/pricing"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Pricing
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
            Get in <span className="gradient-text">Touch</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
            Ready to transform your debt collection process? Let's discuss how{" "}
            <span className="text-primary font-semibold">SmartKollect</span> can help your organization.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Multiple Ways to <span className="gradient-text">Connect</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the communication method that works best for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card
                  key={index}
                  className="group card-hover glass-effect p-8 text-center border-white/10 hover:border-primary/30 transition-all duration-500 cursor-pointer"
                  onClick={() => method.action.startsWith('tel:') || method.action.startsWith('mailto:') ? window.location.href = method.action : null}
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-primary group-hover:text-secondary transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                    {method.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">{method.description}</p>
                  <p className="text-sm font-medium text-primary">{method.contact}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Send Us a <span className="gradient-text">Message</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>
            </div>

            <Card className="glass-effect p-8 border-white/10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="bg-background/50 border-white/20 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="bg-background/50 border-white/20 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-background/50 border-white/20 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-background/50 border-white/20 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="bg-background/50 border-white/20 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees">Number of Employees</Label>
                    <select
                      id="employees"
                      name="employees"
                      value={formData.employees}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select range</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-1000">201-1000</option>
                      <option value="1000+">1000+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    placeholder="Tell us about your debt collection challenges and how we can help..."
                    className="bg-background/50 border-white/20 focus:border-primary/50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requestDemo"
                    name="requestDemo"
                    checked={formData.requestDemo}
                    onChange={handleInputChange}
                    className="rounded border-white/20 text-primary focus:ring-primary/20"
                  />
                  <Label htmlFor="requestDemo" className="text-sm">
                    I would like to request a personalized demo
                  </Label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/60 transition-all duration-300"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Demo
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Quick answers to common questions about SmartKollect.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass-effect p-6 border-white/10 hover:border-primary/30 transition-all duration-500">
                <h3 className="text-xl font-semibold mb-3 text-primary">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Still have questions? We're here to help!
            </p>
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/60 transition-all duration-300"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-tertiary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get <span className="gradient-text">Started</span>?
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
                  <Link href="/marketing/about" className="text-muted-foreground hover:text-primary transition-all duration-300">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/marketing/pricing" className="text-muted-foreground hover:text-primary transition-all duration-300">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/marketing/contact" className="text-primary hover:text-primary/80 transition-all duration-300">
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
