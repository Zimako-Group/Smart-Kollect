"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HumeVoiceService, HumeVoiceConfig } from "@/lib/hume-voice-service";
import { Mic, Volume2, MessageSquare, Bug } from "lucide-react";

export default function VoiceTestPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testVoiceService = async () => {
    setIsLoading(true);
    setTestResult("Testing Hume AI voice service...");

    try {
      // Test 1: Create service
      const config: HumeVoiceConfig = {
        apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY || 'test-key'
      };
      const service = new HumeVoiceService(config);
      setTestResult(prev => prev + "\n✓ Hume voice service created");

      // Test 2: Connect
      await service.connect();
      setTestResult(prev => prev + "\n✓ Service connected");

      // Test 3: Generate response
      const response = await service.sendMessage("Hello, can you help me with SmartKollect?");
      setTestResult(prev => prev + `\n✓ Response generated: "${response.content}"`);

      // Test 4: Test conversation history
      const history = service.getConversationHistory();
      setTestResult(prev => prev + `\n✓ Conversation history: ${history.length} messages`);

      // Test 5: Test emotional context
      const emotionalContext = service.getCurrentEmotionalContext();
      setTestResult(prev => prev + `\n✓ Emotional context available: ${emotionalContext ? 'Yes' : 'No'}`);

      setTestResult(prev => prev + "\n\n🎉 All tests passed! Hume AI voice system is working.");

    } catch (error) {
      setTestResult(prev => prev + `\n❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEmotionalAnalysis = async () => {
    setIsLoading(true);
    setTestResult("Testing emotional analysis...");
    
    try {
      const config: HumeVoiceConfig = {
        apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY || 'test-key'
      };
      const service = new HumeVoiceService(config);
      await service.connect();
      
      // Test emotional response generation
      const stressedResponse = await service.sendMessage("I'm really stressed about this debt situation");
      setTestResult(prev => prev + `\n✓ Stress response: "${stressedResponse.content.substring(0, 100)}..."`);;
      
      const helpResponse = await service.sendMessage("Can you help me with payment plans?");
      setTestResult(prev => prev + `\n✓ Help response: "${helpResponse.content.substring(0, 100)}..."`);;
      
      setTestResult(prev => prev + "\n\n🎭 Emotional analysis test completed!");
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Emotional analysis failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHumeConnection = async () => {
    setIsLoading(true);
    setTestResult("Testing Hume API connection...");

    try {
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY;
      setTestResult(prev => prev + `\n\n=== Hume API Configuration ===`);
      setTestResult(prev => prev + `\nAPI Key configured: ${apiKey ? 'Yes' : 'No'}`);
      
      if (!apiKey) {
        setTestResult(prev => prev + `\n⚠️ Warning: NEXT_PUBLIC_HUME_API_KEY not found in environment`);
        setTestResult(prev => prev + `\n💡 Add your Hume API key to .env.local for full functionality`);
      }
      
      const config: HumeVoiceConfig = {
        apiKey: apiKey || 'test-key'
      };
      const service = new HumeVoiceService(config);
      
      setTestResult(prev => prev + `\n\n=== Connection Test ===`);
      await service.connect();
      const isConnected = service.isServiceConnected();
      setTestResult(prev => prev + `\nConnection status: ${isConnected ? 'Connected' : 'Fallback mode'}`);
      
      if (isConnected) {
        const sessionId = await service.startVoiceSession();
        setTestResult(prev => prev + `\nSession ID: ${sessionId}`);
      }

    } catch (error) {
      setTestResult(prev => prev + `\n❌ Connection test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Hume AI Voice System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testVoiceService} 
              disabled={isLoading}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Test Voice Service
            </Button>
            
            <Button 
              onClick={testEmotionalAnalysis} 
              variant="outline"
              disabled={isLoading}
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Test Emotional Analysis
            </Button>
            
            <Button 
              onClick={testHumeConnection} 
              variant="secondary"
              disabled={isLoading}
              className="gap-2"
            >
              <Bug className="h-4 w-4" />
              Test Hume Connection
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
    </div>
  );
}
