"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  FileText, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Mail,
  Phone 
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function POPIActPage() {
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

  const popiPrinciples = [
    {
      title: "Accountability",
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      description: "Organizations must ensure that the POPI Act's principles are complied with through appropriate measures."
    },
    {
      title: "Processing Limitation",
      icon: <Lock className="h-8 w-8 text-primary" />,
      description: "Personal information must be processed lawfully and in a manner that doesn't infringe on the privacy of the data subject."
    },
    {
      title: "Purpose Specification",
      icon: <FileText className="h-8 w-8 text-primary" />,
      description: "Personal information must be collected for specific, explicitly defined, and legitimate purposes."
    },
    {
      title: "Further Processing Limitation",
      icon: <AlertTriangle className="h-8 w-8 text-primary" />,
      description: "Further processing must be compatible with the purpose for which it was collected."
    },
    {
      title: "Information Quality",
      icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
      description: "Personal information must be complete, accurate, not misleading, and updated when necessary."
    },
    {
      title: "Openness",
      icon: <Info className="h-8 w-8 text-primary" />,
      description: "Data subjects must be aware that their information is being collected and for what purpose."
    },
    {
      title: "Security Safeguards",
      icon: <Shield className="h-8 w-8 text-primary" />,
      description: "Personal information must be kept secure against risks of loss, unauthorized access, or unlawful processing."
    },
    {
      title: "Data Subject Participation",
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      description: "Data subjects have the right to access their personal information and request corrections or deletions."
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
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Protection of Personal Information Act (POPI)
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Understanding your rights and our responsibilities under South Africa&apos;s data protection law
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => scrollToSection('overview')}
                className="rounded-full"
              >
                Learn More
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => scrollToSection('principles')}
                className="rounded-full"
              >
                Key Principles
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto py-4 no-scrollbar">
            {['overview', 'principles', 'rights', 'compliance', 'contact'].map((section) => (
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

      {/* Overview Section */}
      <section id="overview" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">What is the POPI Act?</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                The Protection of Personal Information Act (POPI Act or POPIA) is South Africa&apos;s data protection law that came into full effect on July 1, 2021. The Act regulates how organizations collect, process, store, and share personal information.
              </p>
              <p>
                The POPI Act aims to protect the personal information of individuals (data subjects) and ensure that South African organizations process personal information in a fair, responsible, and secure manner.
              </p>
              <p>
                At SmartKollect, we are fully committed to complying with the POPI Act and protecting your personal information. We have implemented comprehensive measures to ensure that your data is processed lawfully, securely, and transparently.
              </p>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-primary" />
                  Key Definitions
                </h3>
                <ul className="space-y-3">
                  <li><strong>Personal Information:</strong> Information relating to an identifiable, living individual or company.</li>
                  <li><strong>Data Subject:</strong> The person to whom the personal information relates.</li>
                  <li><strong>Responsible Party:</strong> The entity that determines the purpose and means of processing personal information.</li>
                  <li><strong>Operator:</strong> A person who processes personal information for a responsible party in terms of a contract or mandate.</li>
                  <li><strong>Processing:</strong> Any operation concerning personal information, including collection, storage, use, dissemination, or destruction.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section id="principles" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">8 Key Principles of the POPI Act</h2>
            <p className="text-xl text-muted-foreground">
              The POPI Act is built on eight fundamental principles that guide how personal information should be handled
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popiPrinciples.map((principle, index) => (
              <div key={index} className="group">
                <Card className="h-full p-6 bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {principle.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{principle.title}</h3>
                  <p className="text-muted-foreground">{principle.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rights Section */}
      <section id="rights" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Your Rights Under the POPI Act</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                The POPI Act grants data subjects (you) specific rights regarding your personal information. At SmartKollect, we respect and uphold these rights:
              </p>
              
              <div className="space-y-6 my-8">
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Access</h3>
                  <p>You have the right to request confirmation of whether we hold your personal information and to access that information.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Correction</h3>
                  <p>You have the right to request the correction of inaccurate or incomplete personal information we hold about you.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Deletion</h3>
                  <p>You have the right to request the deletion of your personal information under certain circumstances.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Object</h3>
                  <p>You have the right to object to the processing of your personal information for direct marketing purposes or based on legitimate interests.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Withdraw Consent</h3>
                  <p>Where processing is based on consent, you have the right to withdraw that consent at any time.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Right to Complain</h3>
                  <p>You have the right to lodge a complaint with the Information Regulator if you believe your rights under the POPI Act have been infringed.</p>
                </div>
              </div>
              
              <p>
                To exercise any of these rights, please contact our Information Officer using the contact details provided at the bottom of this page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section id="compliance" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">How We Ensure Compliance</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                At SmartKollect, we have implemented comprehensive measures to ensure compliance with the POPI Act:
              </p>
              
              <ul className="space-y-4 my-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Appointed an Information Officer responsible for ensuring POPI Act compliance</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Implemented robust security measures to protect personal information from unauthorized access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Developed comprehensive data protection policies and procedures</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Conducted regular staff training on data protection and POPI Act requirements</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Implemented data breach notification procedures</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Regularly review and update our data protection measures</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Ensure that all third-party service providers comply with the POPI Act</span>
                </li>
              </ul>
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h3 className="text-xl font-semibold mb-4">Our Commitment</h3>
                <p>
                  We are committed to processing your personal information lawfully, fairly, and transparently. We only collect and process personal information for specific, explicitly defined, and legitimate purposes, and we ensure that the personal information we process is adequate, relevant, and limited to what is necessary.
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
            <h2 className="text-3xl font-bold mb-6">Contact Our Information Officer</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                If you have any questions about the POPI Act or how we handle your personal information, please contact our Information Officer:
              </p>
              
              <Card className="p-6 my-8 bg-background/50 backdrop-blur-sm">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Information Officer</h3>
                    <p>Rofhiwa Zimako</p>
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
              
              <p>
                You also have the right to lodge a complaint with the Information Regulator if you believe that your personal information has been processed in a way that does not comply with the POPI Act.
              </p>
              
              <div>
                <h3 className="font-semibold">Information Regulator (South Africa)</h3>
                <p>
                  <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    https://www.justice.gov.za/inforeg/
                  </a>
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
            This document was last updated on May 5, 2025.
          </p>
        </div>
      </footer>
    </div>
  );
}
