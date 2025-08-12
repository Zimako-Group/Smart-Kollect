"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  Settings,
  MessageSquare,
  Bot,
  User,
  Loader2,
  Play,
  Pause,
  Square,
  Heart,
  Brain,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { HumeVoiceService, VoiceMessage, EmotionalContext } from "@/lib/hume-voice-service";
import { AudioRecorder, AudioPlayer } from "@/lib/audio-recording-utils";
import { AudioUtils } from "@/lib/audio-utils";

interface HumeVoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HumeVoiceConversationModal({
  isOpen,
  onClose,
}: HumeVoiceConversationModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [emotionalContext, setEmotionalContext] = useState<EmotionalContext | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const humeServiceRef = useRef<HumeVoiceService | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize services
  useEffect(() => {
    if (isOpen && !humeServiceRef.current) {
      initializeServices();
    }
    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeServices = async () => {
    setIsConnecting(true);
    try {
      // Initialize Hume service with API key
      // Note: In production, this should come from environment variables
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY || 'demo-key';
      
      humeServiceRef.current = new HumeVoiceService({
        apiKey: apiKey
      });
      
      await humeServiceRef.current.connect();
      
      // Initialize audio services
      audioRecorderRef.current = new AudioRecorder();
      audioPlayerRef.current = new AudioPlayer();
      
      setIsConnected(true);
      toast.success("🎤 Hume AI Empathic Voice Interface connected!");
      
      // Load conversation history
      const history = humeServiceRef.current.getConversationHistory();
      setMessages(history);
      
    } catch (error) {
      console.error("Failed to initialize Hume voice services:", error);
      toast.error("Failed to connect to Hume AI. Using fallback mode.");
      
      // Initialize fallback mode
      audioRecorderRef.current = new AudioRecorder();
      audioPlayerRef.current = new AudioPlayer();
      setIsConnected(true); // Allow usage in fallback mode
    } finally {
      setIsConnecting(false);
    }
  };

  const cleanup = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    if (audioRecorderRef.current?.isRecording()) {
      audioRecorderRef.current.stopRecording();
    }
    
    audioPlayerRef.current?.stopAudio();
    humeServiceRef.current?.disconnect();
    
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingTime(0);
    setSessionActive(false);
  };

  const startVoiceSession = async () => {
    if (!humeServiceRef.current) return;

    try {
      await humeServiceRef.current.startVoiceSession();
      setSessionActive(true);
      toast.success("🎙️ Voice session started");
    } catch (error) {
      console.error("Failed to start voice session:", error);
      toast.error("Failed to start voice session");
    }
  };

  const startRecording = async () => {
    if (!audioRecorderRef.current || !isConnected) return;

    // Start voice session if not already active
    if (!sessionActive && humeServiceRef.current) {
      await startVoiceSession();
    }

    try {
      await audioPlayerRef.current?.resumeContext();
      await audioRecorderRef.current.startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success("🎤 Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current || !isRecording) return;

    try {
      const audioBlob = await audioRecorderRef.current.stopRecording();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      // Process the recorded audio
      await processVoiceInput("", audioBlob);
      
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast.error("Failed to process recording");
    }
  };

  const processVoiceInput = async (text: string, audio?: Blob) => {
    if (!humeServiceRef.current || (!text.trim() && !audio)) return;

    setIsProcessing(true);
    
    try {
      // Analyze emotion if audio provided
      let emotionContext: EmotionalContext | null = null;
      if (audio) {
        try {
          emotionContext = await humeServiceRef.current.analyzeEmotion(audio);
          setEmotionalContext(emotionContext);
        } catch (error) {
          console.warn("Emotion analysis failed:", error);
        }
      }

      // Send message to Hume
      const response = await humeServiceRef.current.sendMessage(
        text || "I just sent you an audio message"
      );
      
      // Update messages from service history
      const updatedHistory = humeServiceRef.current.getConversationHistory();
      setMessages(updatedHistory);
      
      // Use text-to-speech for response
      if (response.content && AudioUtils.isSpeechSynthesisAvailable()) {
        try {
          await AudioUtils.textToSpeech(response.content);
        } catch (error) {
          console.warn("Text-to-speech failed:", error);
        }
      }
      
      toast.success("🧠 Empathetic response generated!");
      
    } catch (error) {
      console.error("Failed to process voice input:", error);
      toast.error("Failed to generate response");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendTextMessage = async () => {
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput("");
    
    await processVoiceInput(message);
  };

  const clearConversation = () => {
    humeServiceRef.current?.clearConversationHistory();
    setMessages([]);
    setEmotionalContext(null);
    toast.success("Conversation cleared");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionIcon = (emotionalState?: string) => {
    switch (emotionalState) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'negative': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'stressed': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Brain className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Hume AI Empathic Voice Assistant
            {isConnected && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                <Heart className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
            {isConnecting && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Connecting...
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Experience empathetic AI conversations that understand emotional context. Perfect for sensitive debt collection scenarios requiring emotional intelligence and professional empathy.
          </DialogDescription>
        </DialogHeader>

        {/* Emotional Context Display */}
        {emotionalContext && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 p-3 bg-muted/50 rounded-lg border"
          >
            <div className="flex items-center gap-2 mb-2">
              {getEmotionIcon(emotionalContext.emotionalState)}
              <span className="font-medium text-sm">
                Emotional Context: {emotionalContext.dominantEmotion}
              </span>
              <Badge variant="outline" className="text-xs">
                {Math.round(emotionalContext.emotionScore * 100)}% confidence
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Recommendations:</strong> {emotionalContext.recommendations.join(', ')}
            </div>
          </motion.div>
        )}

        {/* Connection Status */}
        {!isConnected && !isConnecting && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Hume AI Assistant Unavailable</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Failed to connect to the Hume AI empathic voice service.
                </p>
                <Button onClick={initializeServices} disabled={isConnecting}>
                  <Loader2 className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Interface */}
        {isConnected && (
          <>
            {/* Messages Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Start an Empathetic Conversation</h3>
                      <p className="text-sm text-muted-foreground">
                        Hume AI understands emotional context and responds with empathy. Perfect for sensitive debt collection conversations.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              }`}
                            >
                              {message.role === 'user' ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Heart className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gradient-to-r from-purple-50 to-pink-50 border'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            {message.emotions && message.emotions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {message.emotions.slice(0, 3).map((emotion, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {emotion.name} {Math.round(emotion.score * 100)}%
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Recording Status */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Recording with emotion analysis...</span>
                      <Badge variant="secondary">{formatTime(recordingTime)}</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Controls */}
            <div className="flex-shrink-0 border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing || !isConnected}
                  className="flex-shrink-0"
                >
                  {isRecording ? (
                    <MicOff className="h-5 w-5 mr-2" />
                  ) : (
                    <Mic className="h-5 w-5 mr-2" />
                  )}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>

                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Or type your message here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendTextMessage();
                      }
                    }}
                    className="min-h-[44px] resize-none"
                    disabled={isProcessing || !isConnected}
                  />
                  <Button
                    onClick={sendTextMessage}
                    disabled={!textInput.trim() || isProcessing || !isConnected}
                    size="lg"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={clearConversation}
                  disabled={messages.length === 0 || isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    {isConnected ? 'Hume AI Connected' : 'Disconnected'}
                  </div>
                  {sessionActive && (
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-pink-500" />
                      Voice session active
                    </div>
                  )}
                  {isProcessing && (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processing with empathy...
                    </div>
                  )}
                </div>
                <div>
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
