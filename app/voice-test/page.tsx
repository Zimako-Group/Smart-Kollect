"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceConversationService } from "@/lib/voice-conversation-service";
import { AudioUtils } from "@/lib/audio-utils";
import { testGradioImport, testAlternativeImport } from "@/lib/gradio-import-test";
import { Mic, Volume2, MessageSquare, Bug } from "lucide-react";

export default function VoiceTestPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testVoiceService = async () => {
    setIsLoading(true);
    setTestResult("Testing voice service...");

    try {
      // Test 1: Create service
      const service = new VoiceConversationService();
      setTestResult(prev => prev + "\n✓ Voice service created");

      // Test 2: Connect
      await service.connect();
      setTestResult(prev => prev + "\n✓ Service connected");

      // Test 3: Generate response
      const response = await service.generateResponse("Hello, can you help me with SmartKollect?");
      setTestResult(prev => prev + `\n✓ Response generated: "${response.text}"`);

      // Test 4: Test audio utils
      const silentAudio = AudioUtils.generateSilentAudio(500);
      setTestResult(prev => prev + `\n✓ Audio generated: ${silentAudio.size} bytes`);

      // Test 5: Test text-to-speech availability
      const ttsAvailable = AudioUtils.isSpeechSynthesisAvailable();
      setTestResult(prev => prev + `\n✓ Text-to-speech available: ${ttsAvailable}`);

      setTestResult(prev => prev + "\n\n🎉 All tests passed! Voice system is working.");

    } catch (error) {
      setTestResult(prev => prev + `\n❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTextToSpeech = async () => {
    try {
      await AudioUtils.textToSpeech("Hello! This is a test of the text to speech functionality in SmartKollect.");
    } catch (error) {
      console.error("TTS test failed:", error);
    }
  };

  const debugGradioImport = async () => {
    setIsLoading(true);
    setTestResult("Debugging Gradio import...");

    try {
      // Test 1: Standard import test
      const result1 = await testGradioImport();
      setTestResult(prev => prev + `\n\n=== Standard Import Test ===`);
      setTestResult(prev => prev + `\nSuccess: ${result1.success}`);
      if (result1.success) {
        setTestResult(prev => prev + `\nClient type: ${typeof result1.client}`);
      } else {
        setTestResult(prev => prev + `\nReason: ${result1.reason}`);
        if (result1.exports) {
          setTestResult(prev => prev + `\nAvailable exports: ${result1.exports.join(', ')}`);
        }
      }

      // Test 2: Alternative import test
      const result2 = await testAlternativeImport();
      setTestResult(prev => prev + `\n\n=== Alternative Import Test ===`);
      setTestResult(prev => prev + `\nSuccess: ${result2.success}`);
      if (result2.success) {
        setTestResult(prev => prev + `\nClient found at index: ${result2.index}`);
        setTestResult(prev => prev + `\nClient type: ${typeof result2.client}`);
      } else {
        setTestResult(prev => prev + `\nReason: ${result2.reason}`);
      }

    } catch (error) {
      setTestResult(prev => prev + `\n❌ Debug error: ${error}`);
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
            Voice System Test
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
              onClick={testTextToSpeech} 
              variant="outline"
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Test Text-to-Speech
            </Button>
            
            <Button 
              onClick={debugGradioImport} 
              variant="secondary"
              disabled={isLoading}
              className="gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug Gradio Import
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
