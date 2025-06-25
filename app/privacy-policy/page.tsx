"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  Database, 
  ShieldCheck, 
  Clock,
  Info,
  Mail,
  Phone,
  Users,
  Server,
  Globe,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PrivacyPolicyPage() {
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

  const privacyCategories = [
    {
      title: "Information Collection",
      icon: <Database className="h-8 w-8 text-primary" />,
      description: "The types of personal information we collect and how we collect it."
    },
    {
      title: "Information Usage",
      icon: <Eye className="h-8 w-8 text-primary" />,
      description: "How we use the information we collect from you."
    },
    {
      title: "Information Sharing",
      icon: <Users className="h-8 w-8 text-primary" />,
      description: "When and with whom we share your personal information."
    },
    {
      title: "Data Security",
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      description: "How we protect your personal information from unauthorized access."
    },
    {
      title: "Data Retention",
      icon: <Clock className="h-8 w-8 text-primary" />,
      description: "How long we keep your personal information."
    },
    {
      title: "Your Rights",
      icon: <FileText className="h-8 w-8 text-primary" />,
      description: "Your rights regarding your personal information and how to exercise them."
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
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              How we collect, use, and protect your personal information
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => scrollToSection('introduction')}
                className="rounded-full"
              >
                Learn More
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => scrollToSection('categories')}
                className="rounded-full"
              >
                Key Sections
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto py-4 no-scrollbar">
            {['introduction', 'categories', 'collection', 'usage', 'sharing', 'security', 'rights', 'contact'].map((section) => (
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
                At SmartKollect, we are committed to protecting your privacy and the privacy of your customers. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our debt collection management system.
              </p>
              <p>
                Please read this Privacy Policy carefully. By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy and our Terms and Conditions.
              </p>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-primary" />
                  Last Updated
                </h3>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  This Privacy Policy was last updated on May 5, 2025.
                </p>
              </div>
              
              <p>
                This Privacy Policy applies to all information collected through our services, as well as any related services, sales, marketing, or events. It is important that you read this Privacy Policy together with any other privacy notice we may provide on specific occasions when we are collecting or processing personal information about you so that you are fully aware of how and why we are using your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Key Privacy Categories</h2>
            <p className="text-xl text-muted-foreground">
              Our Privacy Policy covers several important areas that explain how we handle your data
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {privacyCategories.map((category, index) => (
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

      {/* Information Collection Section */}
      <section id="collection" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Information Collection</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                We collect personal information that you voluntarily provide to us when you register on our platform, express an interest in obtaining information about us or our products and services, or otherwise contact us.
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
                  <p>The personal information we collect may include:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Name, email address, phone number, and business address</li>
                    <li>Login credentials and account preferences</li>
                    <li>Payment information and billing details</li>
                    <li>Information about your customers (debtors) that you input into our system</li>
                    <li>Communications and correspondence with us</li>
                  </ul>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Automatically Collected Information</h3>
                  <p>We automatically collect certain information when you visit, use, or navigate our platform. This information does not reveal your specific identity but may include:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Device and usage information (IP address, browser type, operating system)</li>
                    <li>Location information (general geographic location based on IP address)</li>
                    <li>User activity and interaction with our platform</li>
                    <li>System logs and performance information</li>
                  </ul>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Cookies and Similar Technologies</h3>
                  <p>We may use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities on our platform. You can set your browser to refuse all or some browser cookies, but this may prevent some parts of our platform from functioning properly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information Usage Section */}
      <section id="usage" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Information Usage</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                We use the information we collect for various business purposes. We process your personal information for these purposes in reliance on our legitimate business interests, with your consent, and/or for compliance with our legal obligations.
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Business Operations</h3>
                  <ul className="mt-2 space-y-1">
                    <li>To provide and maintain our services</li>
                    <li>To process your transactions and manage your account</li>
                    <li>To respond to your inquiries and provide customer support</li>
                    <li>To send administrative information, such as updates, security alerts, and support messages</li>
                  </ul>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Improvement and Development</h3>
                  <ul className="mt-2 space-y-1">
                    <li>To improve our services and develop new features</li>
                    <li>To analyze usage patterns and trends</li>
                    <li>To diagnose technical problems and maintain security</li>
                    <li>To conduct research and analytics to better understand our users</li>
                  </ul>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Marketing and Communication</h3>
                  <ul className="mt-2 space-y-1">
                    <li>To send you marketing communications (with your consent where required by law)</li>
                    <li>To provide you with information about features, services, and updates</li>
                    <li>To measure the effectiveness of our marketing campaigns</li>
                  </ul>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Legal and Safety</h3>
                  <ul className="mt-2 space-y-1">
                    <li>To comply with legal obligations and regulatory requirements</li>
                    <li>To enforce our terms, conditions, and policies</li>
                    <li>To protect our rights, privacy, safety, or property</li>
                    <li>To detect, prevent, or address fraud and security issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information Sharing Section */}
      <section id="sharing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Information Sharing</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                We may share your information in the following situations:
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Third-Party Service Providers</h3>
                  <p>We may share your information with third-party service providers who perform services for us or on our behalf, such as payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Business Transfers</h3>
                  <p>We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Legal Obligations</h3>
                  <p>We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process, such as in response to a court order or a subpoena.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">With Your Consent</h3>
                  <p>We may disclose your personal information for any other purpose with your consent.</p>
                </div>
              </div>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-primary" />
                  Important Note
                </h3>
                <p>
                  We do not sell, rent, or trade your personal information with third parties for their commercial purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Security Section */}
      <section id="security" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Data Security</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Security Measures</h3>
                  <ul className="mt-2 space-y-1">
                    <li>Encryption of sensitive data in transit and at rest</li>
                    <li>Regular security assessments and penetration testing</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Monitoring systems for detecting and preventing security breaches</li>
                    <li>Regular backups and disaster recovery procedures</li>
                  </ul>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Data Retention</h3>
                  <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Policy, unless a longer retention period is required or permitted by law. When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">International Data Transfers</h3>
                  <p>Our servers are located in South Africa. If you are accessing our platform from outside South Africa, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information, in South Africa and other countries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Rights Section */}
      <section id="rights" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Your Rights</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Depending on your location, you may have certain rights regarding your personal information. These may include:
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Access</h3>
                  <p>You have the right to request copies of your personal information. We may charge you a small fee for this service.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Rectification</h3>
                  <p>You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Erasure</h3>
                  <p>You have the right to request that we erase your personal information, under certain conditions.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Restrict Processing</h3>
                  <p>You have the right to request that we restrict the processing of your personal information, under certain conditions.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Object to Processing</h3>
                  <p>You have the right to object to our processing of your personal information, under certain conditions.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Data Portability</h3>
                  <p>You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</p>
                </div>
              </div>
              
              <p>
                If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us using the information provided in the Contact section.
              </p>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-primary" />
                  POPI Act Compliance
                </h3>
                <p>
                  We comply with the Protection of Personal Information Act (POPI Act) of South Africa. For more information about our POPI Act compliance, please refer to our <Link href="/popi-act" className="text-primary hover:underline">POPI Act</Link> page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                If you have any questions about this Privacy Policy, please contact us:
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
                <h3 className="text-xl font-semibold mb-4">Changes to This Privacy Policy</h3>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
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
            This Privacy Policy was last updated on May 5, 2025.
          </p>
        </div>
      </footer>
    </div>
  );
}
