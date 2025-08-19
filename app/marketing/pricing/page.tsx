"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  Shield,
  Star,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

const plans = [
  {
    name: "Starter",
    price: "R2,500",
    period: "/month",
    description: "Perfect for small teams getting started",
    icon: Users,
    popular: false,
    features: [
      "Up to 10 agents",
      "Basic automation workflows",
      "Standard reporting dashboard",
      "Email support",
      "5GB data storage",
      "Basic integrations",
      "Mobile app access",
      "Standard security",
    ],
    limitations: [
      "Limited to 1,000 accounts per month",
      "Basic analytics only",
      "Standard support hours",
    ],
  },
  {
    name: "Professional",
    price: "R7,500",
    period: "/month",
    description: "Ideal for growing businesses",
    icon: BarChart3,
    popular: true,
    features: [
      "Up to 50 agents",
      "Advanced automation & AI",
      "Comprehensive analytics",
      "Priority support (24/7)",
      "50GB data storage",
      "Custom integrations",
      "Advanced mobile features",
      "Enhanced security",
      "Multi-tenant support",
      "Custom reporting",
      "API access",
      "Workflow customization",
    ],
    limitations: [
      "Up to 10,000 accounts per month",
      "Standard API rate limits",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "/month",
    description: "For large organizations with complex needs",
    icon: Shield,
    popular: false,
    features: [
      "Unlimited agents",
      "Full automation suite",
      "Advanced AI & machine learning",
      "Dedicated support team",
      "Unlimited storage",
      "White-label options",
      "Custom development",
      "Enterprise security",
      "SLA guarantees",
      "Advanced analytics",
      "Custom integrations",
      "On-premise deployment",
      "Compliance management",
      "Training & onboarding",
    ],
    limitations: [],
  },
];

const addOns = [
  {
    name: "Advanced AI Analytics",
    price: "R1,500/month",
    description: "Enhanced AI-powered insights and predictive analytics",
  },
  {
    name: "SMS Integration",
    price: "R0.50/SMS",
    description: "Automated SMS notifications and reminders",
  },
  {
    name: "Voice Integration",
    price: "R2.00/minute",
    description: "Automated voice calls and IVR systems",
  },
  {
    name: "Custom Integrations",
    price: "From R5,000",
    description: "Bespoke integrations with your existing systems",
  },
];

const faqs = [
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.",
  },
  {
    question: "Is there a setup fee?",
    answer: "No, there are no setup fees for any of our plans. We include onboarding and training at no extra cost.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, bank transfers, and can arrange invoice billing for enterprise clients.",
  },
  {
    question: "Do you offer discounts for annual payments?",
    answer: "Yes, we offer a 15% discount for annual payments and 10% for semi-annual payments.",
  },
  {
    question: "What happens if I exceed my plan limits?",
    answer: "We'll notify you before you reach your limits and help you upgrade to a suitable plan. No service interruptions.",
  },
];

export default function Pricing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const getPrice = (price: string) => {
    if (price === "Custom") return price;
    if (billingCycle === 'annual') {
      const monthlyPrice = parseInt(price.replace(/[^0-9]/g, ''));
      const annualPrice = Math.round(monthlyPrice * 12 * 0.85); // 15% discount
      return `R${annualPrice.toLocaleString()}`;
    }
    return price;
  };

  const getPeriod = () => {
    return billingCycle === 'annual' ? '/year' : '/month';
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
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
            Choose the perfect plan for your organization. All plans include{" "}
            <span className="text-primary font-semibold">30-day free trial</span>,{" "}
            <span className="text-secondary font-semibold">no setup fees</span>, and{" "}
            <span className="text-tertiary font-semibold">cancel anytime</span>.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-background/20 backdrop-blur-sm rounded-full p-1 border border-white/10">
              <div className="flex items-center">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
                    billingCycle === 'annual'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  Annual
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-secondary to-tertiary text-white text-xs px-2 py-1 rounded-full">
                    Save 15%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={index}
                  className={`group card-hover glass-effect p-8 border-white/10 transition-all duration-500 relative ${
                    plan.popular
                      ? 'border-primary/30 hover:border-primary/50 scale-105 lg:scale-110'
                      : 'hover:border-primary/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-8 w-8 text-primary group-hover:text-secondary transition-colors duration-300" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                      {plan.name}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    
                    <div className="mb-8">
                      <span className="text-4xl font-bold gradient-text">
                        {getPrice(plan.price)}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.price !== "Custom" ? getPeriod() : ""}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-8 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Limitations:</h4>
                        <ul className="space-y-2 text-left">
                          {plan.limitations.map((limitation, limitIndex) => (
                            <li key={limitIndex} className="flex items-center text-sm text-muted-foreground">
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full mr-3 flex-shrink-0"></div>
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => setIsLoginModalOpen(true)}
                      className={`w-full transition-all duration-300 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80'
                          : plan.name === 'Enterprise'
                          ? 'border-tertiary/40 text-tertiary hover:bg-tertiary/20 hover:border-tertiary/60'
                          : 'bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary'
                      }`}
                      variant={plan.name === 'Enterprise' ? 'outline' : 'default'}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful <span className="gradient-text">Add-ons</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Enhance your SmartKollect experience with these optional features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {addOns.map((addon, index) => (
              <Card
                key={index}
                className="group card-hover glass-effect p-6 border-white/10 hover:border-primary/30 transition-all duration-500"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-6 w-6 text-primary group-hover:text-secondary transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                    {addon.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                  <div className="text-primary font-semibold">{addon.price}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pricing <span className="gradient-text">FAQ</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Common questions about our pricing and plans.
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
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            Trusted by <span className="gradient-text">Industry Leaders</span>
          </h2>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground mb-12">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>POPI Act Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" />
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-400" />
              <span>99.9% Uptime SLA</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">30 Days</div>
              <div className="text-muted-foreground">Free Trial</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-muted-foreground">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">No</div>
              <div className="text-muted-foreground">Setup Fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="gradient-text">Get Started</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Start your free trial today and see how SmartKollect can transform your debt collection process.
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
                  <Link href="/marketing/pricing" className="text-primary hover:text-primary/80 transition-all duration-300">
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
