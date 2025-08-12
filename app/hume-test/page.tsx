"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HumeVoiceService } from "@/lib/hume-voice-service";
import { AudioUtils } from "@/lib/audio-utils";
import { Heart, Mic, Volume2, MessageSquare, Brain, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function HumeTestPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');

  const testHumeConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    setTestResult("Testing Hume AI connection...");

    try {
      // Test with demo API key first
      const service = new HumeVoiceService({
        apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY || 'demo-key'
      });
      
      setTestResult(prev => prev + "\n✓ Hume service created");

      // Test connection
      await service.connect();
      setTestResult(prev => prev + "\n✓ Connected to Hume AI successfully!");
      setConnectionStatus('connected');

      // Test voice session
      const sessionId = await service.startVoiceSession();
      setTestResult(prev => prev + `\n✓ Voice session started: ${sessionId}`);

      // Test message sending
      const response = await service.sendMessage("Hello, I need help with SmartKollect debt collection. Can you assist me with empathy?");
      setTestResult(prev => prev + `\n✓ Empathetic response received: "${response.content}"`);

      // Test emotional context
      const emotionalContext = service.getCurrentEmotionalContext();
      if (emotionalContext) {
        setTestResult(prev => prev + `\n✓ Emotional context available: ${emotionalContext.dominantEmotion}`);
      }

      setTestResult(prev => prev + "\n\n🎉 All Hume AI tests passed! Empathetic voice system is ready.");

    } catch (error) {
      console.error("Hume test failed:", error);
      setTestResult(prev => prev + `\n❌ Error: ${error}`);
      setConnectionStatus('failed');
      
      // Show fallback information
      setTestResult(prev => prev + "\n\n⚠️ Hume AI unavailable - system will use fallback responses");
      setTestResult(prev => prev + "\n📝 To enable Hume AI:");
      setTestResult(prev => prev + "\n1. Get API key from https://hume.ai");
      setTestResult(prev => prev + "\n2. Add NEXT_PUBLIC_HUME_API_KEY to .env.local");
      setTestResult(prev => prev + "\n3. Restart the development server");
    } finally {
      setIsLoading(false);
    }
  };

  const testEmotionAnalysis = async () => {
    setTestResult("Testing emotion analysis...");
    
    try {
      // Generate a test audio blob
      const testAudio = AudioUtils.generateBeepAudio(440, 1000);
      setTestResult(prev => prev + "\n✓ Test audio generated");

      const service = new HumeVoiceService({
        apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY || 'demo-key'
      });

      await service.connect();
      const emotionalContext = await service.analyzeEmotion(testAudio);
      
      setTestResult(prev => prev + `\n✓ Emotion analysis completed:`);
      setTestResult(prev => prev + `\n  - Dominant emotion: ${emotionalContext.dominantEmotion}`);
      setTestResult(prev => prev + `\n  - Emotional state: ${emotionalContext.emotionalState}`);
      setTestResult(prev => prev + `\n  - Confidence: ${Math.round(emotionalContext.emotionScore * 100)}%`);
      setTestResult(prev => prev + `\n  - Recommendations: ${emotionalContext.recommendations.join(', ')}`);

    } catch (error) {
      setTestResult(prev => prev + `\n❌ Emotion analysis failed: ${error}`);
    }
  };

  const testTextToSpeech = async () => {
    try {
      await AudioUtils.textToSpeech("Hello! This is Hume AI's empathetic voice assistant integrated with SmartKollect. I understand emotional context and respond with appropriate empathy for debt collection scenarios.");
    } catch (error) {
      console.error("TTS test failed:", error);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected': return <Badge className="bg-green-500/10 text-green-600">Connected</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'connecting': return <Badge variant="secondary">Connecting...</Badge>;
      default: return <Badge variant="secondary">Not Tested</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-4">
          <Heart className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Hume AI Integration Test</h1>
        <p className="text-muted-foreground">
          Test the empathetic voice AI integration for SmartKollect debt collection
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Hume AI Connection Status
              {getStatusBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Empathic Voice Interface (EVI)</div>
                  <div className="text-sm text-muted-foreground">
                    Advanced conversational AI with emotional intelligence
                  </div>
                </div>
                {connectionStatus === 'connected' && (
                  <Badge className="bg-green-500/10 text-green-600">
                    <Heart className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Hume AI System Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={testHumeConnection} 
                disabled={isLoading}
                className="gap-2"
              >
                <Heart className="h-4 w-4" />
                Test Hume Connection
              </Button>
              
              <Button 
                onClick={testEmotionAnalysis} 
                variant="outline"
                disabled={isLoading}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                Test Emotion Analysis
              </Button>
              
              <Button 
                onClick={testTextToSpeech} 
                variant="outline"
                className="gap-2"
              >
                <Volume2 className="h-4 w-4" />
                Test Text-to-Speech
              </Button>
            </div>

            {testResult && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {testResult}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Hume AI Features for SmartKollect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Emotional Intelligence
                </h4>
                <p className="text-sm text-muted-foreground">
                  Detects customer emotions (stress, frustration, willingness) for better collection strategies
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Empathetic Responses
                </h4>
                <p className="text-sm text-muted-foreground">
                  Adapts communication style based on emotional context for sensitive debt collection
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Mic className="h-4 w-4 text-green-500" />
                  Voice Analysis
                </h4>
                <p className="text-sm text-muted-foreground">
                  Real-time analysis of vocal tone and speech patterns for emotional insights
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Smart Recommendations
                </h4>
                <p className="text-sm text-muted-foreground">
                  AI-powered suggestions for appropriate collection approaches based on emotional state
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
