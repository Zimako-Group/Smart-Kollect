"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  FileText, 
  ScrollText, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Mail,
  Phone,
  Clock,
  CreditCard,
  Lock,
  Shield
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TermsAndConditionsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check which section is in view
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.getAttribute('id');
        
        if (sectionTop < window.innerHeight / 3 && sectionTop > -window.innerHeight / 3) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const termsCategories = [
    {
      title: "Account Terms",
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      description: "Terms related to account creation, management, and termination."
    },
    {
      title: "Payment Terms",
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      description: "Terms related to billing, payments, refunds, and subscription management."
    },
    {
      title: "Service Usage",
      icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
      description: "Terms governing how our services may be used and limitations."
    },
    {
      title: "Data Privacy",
      icon: <Lock className="h-8 w-8 text-primary" />,
      description: "Terms related to data collection, storage, processing, and protection."
    },
    {
      title: "Intellectual Property",
      icon: <FileText className="h-8 w-8 text-primary" />,
      description: "Terms governing ownership and use of content and intellectual property."
    },
    {
      title: "Liability Limitations",
      icon: <Shield className="h-8 w-8 text-primary" />,
      description: "Terms limiting our liability and outlining user responsibilities."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/10" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block p-3 rounded-full bg-primary/10 mb-6">
              <ScrollText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Terms and Conditions
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Please read these terms carefully before using our services
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => scrollToSection('introduction')}
                className="rounded-full"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => scrollToSection('categories')}
                className="rounded-full"
              >
                Key Terms
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto py-4 no-scrollbar">
            {['introduction', 'categories', 'accounts', 'payments', 'usage', 'privacy', 'contact'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeSection === section 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-secondary'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <section id="introduction" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Introduction</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Welcome to SmartKollect. These Terms and Conditions govern your use of our website, services, and products. By accessing or using SmartKollect, you agree to be bound by these Terms and Conditions and our Privacy Policy.
              </p>
              <p>
                If you do not agree with any part of these terms, you may not use our services. Please read these terms carefully as they constitute a legal agreement between you and SmartKollect.
              </p>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-primary" />
                  Last Updated
                </h3>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  These Terms and Conditions were last updated on May 5, 2025.
                </p>
              </div>
              
              <p>
                Our debt collection management system provides tools and services to help businesses manage their debt collection processes efficiently. These Terms and Conditions apply to all users of our platform, including administrators, agents, and clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Key Terms Categories</h2>
            <p className="text-xl text-muted-foreground">
              Our Terms and Conditions cover several important areas that govern our relationship
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {termsCategories.map((category, index) => (
              <div key={index} className="group">
                <Card className="h-full p-6 bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account Terms Section */}
      <section id="accounts" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Account Terms</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                To access and use our services, you must create an account with SmartKollect. By creating an account, you agree to the following terms:
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Account Creation</h3>
                  <p>You must provide accurate, complete, and up-to-date information when creating your account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Account Security</h3>
                  <p>You must immediately notify SmartKollect of any unauthorized use of your account or any other breach of security. SmartKollect will not be liable for any loss or damage arising from your failure to comply with this requirement.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Account Termination</h3>
                  <p>SmartKollect reserves the right to suspend or terminate your account at any time for any reason, including but not limited to, violation of these Terms and Conditions. You may also terminate your account at any time by contacting our support team.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Account Data</h3>
                  <p>Upon termination of your account, SmartKollect may retain your data for a reasonable period as required by law or for legitimate business purposes. You may request the deletion of your data by contacting our support team.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Terms Section */}
      <section id="payments" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Payment Terms</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                SmartKollect offers various subscription plans for our services. By subscribing to our services, you agree to the following payment terms:
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Subscription Fees</h3>
                  <p>You agree to pay all fees associated with your subscription plan. Fees are non-refundable except as expressly provided in these Terms and Conditions. All fees are exclusive of taxes, which you are responsible for paying.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Billing Cycle</h3>
                  <p>Subscription fees are billed in advance on a monthly or annual basis, depending on your subscription plan. Your subscription will automatically renew at the end of each billing cycle unless you cancel it before the renewal date.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Payment Methods</h3>
                  <p>SmartKollect accepts various payment methods, including credit cards and electronic funds transfers. By providing a payment method, you authorize SmartKollect to charge that payment method for all fees associated with your subscription.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Price Changes</h3>
                  <p>SmartKollect reserves the right to change the fees for our services at any time. We will provide you with reasonable notice of any changes in fees before they become effective.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Usage Section */}
      <section id="usage" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Service Usage</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                By using SmartKollect, you agree to use our services in accordance with these Terms and Conditions and all applicable laws and regulations:
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Acceptable Use</h3>
                  <p>You agree to use our services only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of our services. You must comply with all applicable debt collection laws and regulations when using our services.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Prohibited Activities</h3>
                  <p>You may not use our services to engage in any illegal activities, harass others, send spam, transmit malware, or attempt to gain unauthorized access to our systems or other users&apos; accounts.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Service Modifications</h3>
                  <p>SmartKollect reserves the right to modify, suspend, or discontinue any part of our services at any time without prior notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation of our services.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Third-Party Services</h3>
                  <p>Our services may integrate with third-party services. Your use of such third-party services is subject to their terms and conditions. SmartKollect is not responsible for any third-party services or their content.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Privacy Section */}
      <section id="privacy" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Data Privacy</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                SmartKollect is committed to protecting your privacy and the privacy of your customers. Our collection and use of personal information is governed by our Privacy Policy and these Terms and Conditions:
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Data Collection</h3>
                  <p>SmartKollect collects and processes personal information as described in our Privacy Policy. By using our services, you consent to our collection and processing of personal information in accordance with our Privacy Policy.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Data Security</h3>
                  <p>SmartKollect implements reasonable security measures to protect personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Data Retention</h3>
                  <p>SmartKollect retains personal information for as long as necessary to provide our services and as required by law. You may request the deletion of your personal information by contacting our support team.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">POPI Act Compliance</h3>
                  <p>SmartKollect complies with the Protection of Personal Information Act (POPI Act) of South Africa. For more information about our POPI Act compliance, please refer to our <Link href="/popi-act" className="text-primary hover:underline">POPI Act</Link> page.</p>
                </div>
              </div>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-primary" />
                  Important Note
                </h3>
                <p>
                  You are responsible for ensuring that your use of our services complies with all applicable data protection laws and regulations. You must obtain all necessary consents from your customers for the collection, processing, and sharing of their personal information with SmartKollect.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              
              <Card className="p-6 my-8 bg-background/50 backdrop-blur-sm">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Company</h3>
                    <p>SmartKollect</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-primary" />
                      <a href="mailto:rofhiwa@zimako.co.za" className="text-primary hover:underline">
                        rofhiwa@zimako.co.za
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      <a href="tel:+27849626748" className="text-primary hover:underline">
                        +27 84 962 6748
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Address</h3>
                    <p>
                      61 Sonop Street,<br />
                      Horizonview Shopping Centre<br />
                      Horizon, Roodepoort, 1724
                    </p>
                  </div>
                </div>
              </Card>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4">Governing Law</h3>
                <p>
                  These Terms and Conditions are governed by and construed in accordance with the laws of South Africa. Any disputes arising under these Terms and Conditions shall be subject to the exclusive jurisdiction of the courts of South Africa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SmartKollect. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            These Terms and Conditions were last updated on May 5, 2025.
          </p>
        </div>
      </footer>
    </div>
  );
}
