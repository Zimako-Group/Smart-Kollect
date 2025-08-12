"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { VoiceMicrophoneButton } from "@/components/VoiceMicrophoneButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Mic,
  Volume2,
  Zap,
  Shield,
  Globe,
  ArrowLeft,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { HumeVoiceConversationModal } from "@/components/HumeVoiceConversationModal";

export default function VoiceDemoPage() {
  const [showDemo, setShowDemo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features = [
    {
      icon: Heart,
      title: "Emotional Intelligence",
      description: "Hume AI detects and responds to customer emotions for empathetic debt collection conversations."
    },
    {
      icon: MessageSquare,
      title: "Empathetic Responses",
      description: "AI adapts communication style based on emotional context for sensitive debt collection scenarios."
    },
    {
      icon: Mic,
      title: "Voice Emotion Analysis",
      description: "Real-time analysis of vocal tone and speech patterns to understand customer emotional state."
    },
    {
      icon: Volume2,
      title: "Contextual Text-to-Speech",
      description: "Emotionally appropriate voice synthesis that matches the conversation's emotional tone."
    },
    {
      icon: Zap,
      title: "Smart Recommendations",
      description: "AI-powered suggestions for collection approaches based on detected emotional patterns."
    },
    {
      icon: Shield,
      title: "Ethical AI",
      description: "Responsible AI that prioritizes customer wellbeing while achieving collection goals."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/user/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Voice Assistant Demo
          </Badge>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            Voice Conversation Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience the future of debt collection with AI-powered voice conversations. 
            Get instant assistance, guidance, and support through natural voice interactions.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <VoiceMicrophoneButton />
            <div className="text-sm text-muted-foreground">
              Click the microphone to start a conversation
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2">How It Works</CardTitle>
              <CardDescription>
                Simple steps to start your voice conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Click Microphone</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the microphone button in the header or on this page to open the voice assistant.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Start Speaking</h3>
                  <p className="text-sm text-muted-foreground">
                    Press the record button and speak naturally. Ask questions about SmartKollect features.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Get Responses</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive intelligent responses with both text and voice output for natural conversations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Voice System Test */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Try Hume AI Voice Assistant
              </CardTitle>
              <CardDescription>
                Experience empathetic AI conversation for debt collection scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="gap-2"
                size="lg"
              >
                <Mic className="h-4 w-4" />
                Start Voice Conversation
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sample Questions */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2">Try These Questions</CardTitle>
              <CardDescription>
                Sample questions to get you started with the voice assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "How do I create a new PTP for a customer?",
                  "What's the difference between settlements and PTPs?",
                  "How can I track my collection performance?",
                  "How do I flag high-risk accounts?",
                  "What reports are available in SmartKollect?",
                  "How do I manage customer payment history?"
                ].map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => {
                      // Could trigger the voice assistant with this question
                      console.log("Sample question:", question);
                    }}
                  >
                    <p className="text-sm">{question}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hume Voice Modal */}
      <HumeVoiceConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
