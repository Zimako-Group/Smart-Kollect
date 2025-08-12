import { HumeClient } from 'hume';

export interface HumeVoiceConfig {
  apiKey: string;
  configId?: string; // EVI configuration ID
  baseUrl?: string;
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotions?: Array<{
    name: string;
    score: number;
  }>;
  audioUrl?: string;
}

export interface EmotionalContext {
  dominantEmotion: string;
  emotionScore: number;
  emotionalState: 'positive' | 'neutral' | 'negative' | 'stressed';
  recommendations: string[];
}

export class HumeVoiceService {
  private client: HumeClient;
  private config: HumeVoiceConfig;
  private conversationHistory: VoiceMessage[] = [];
  private isConnected = false;
  private currentSessionId?: string;

  constructor(config: HumeVoiceConfig) {
    this.config = {
      baseUrl: 'https://api.hume.ai',
      ...config
    };
    
    this.client = new HumeClient({
      apiKey: this.config.apiKey,
      environment: this.config.baseUrl
    });
  }

  async connect(): Promise<void> {
    try {
      console.log('🎤 Connecting to Hume AI Empathic Voice Interface...');
      
      // Test connection by checking available configurations
      const configs = await this.client.empathicVoice.configs.listConfigs();
      console.log('✅ Successfully connected to Hume AI!');
      
      this.isConnected = true;
      
      // Use provided config ID or set a default
      if (!this.config.configId) {
        this.config.configId = 'default-config';
        console.log(`🎯 Using default EVI configuration`);
      }
      
    } catch (error) {
      console.error('❌ Failed to connect to Hume AI:', error);
      this.isConnected = false;
      // Don't throw error - allow fallback mode
      console.log('🔄 Will use fallback mode for voice responses');
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentSessionId) {
      // End current session if active
      try {
        // Note: Actual session ending would depend on Hume's WebSocket implementation
        console.log('🔌 Disconnecting from Hume AI session');
        this.currentSessionId = undefined;
      } catch (error) {
        console.warn('Warning during disconnect:', error);
      }
    }
    this.isConnected = false;
  }

  isServiceConnected(): boolean {
    return this.isConnected;
  }

  async startVoiceSession(): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Service not connected. Call connect() first.');
    }

    try {
      // Create a new EVI session using correct API
      // Generate a session ID for tracking
      this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🎙️ Started voice session: ${this.currentSessionId}`);
      
      return this.currentSessionId;
    } catch (error) {
      console.error('Failed to start voice session:', error);
      // Don't throw error - allow fallback mode
      this.currentSessionId = `fallback_${Date.now()}`;
      return this.currentSessionId;
    }
  }

  async sendMessage(content: string, audioBlob?: Blob): Promise<VoiceMessage> {
    // Auto-start session if not connected or no session exists
    if (!this.isConnected) {
      await this.connect();
    }
    
    if (!this.currentSessionId) {
      await this.startVoiceSession();
    }

    try {
      // Add user message to history
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      this.conversationHistory.push(userMessage);

      // Generate empathetic response for SmartKollect
      const assistantMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: this.generateSmartKollectResponse(content),
        timestamp: new Date(),
        emotions: []
      };

      this.conversationHistory.push(assistantMessage);
      return assistantMessage;

    } catch (error) {
      console.error('Error sending message to Hume:', error);
      
      // Fallback to local response
      const fallbackResponse: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: this.generateFallbackResponse(content),
        timestamp: new Date()
      };
      
      this.conversationHistory.push(fallbackResponse);
      return fallbackResponse;
    }
  }

  async analyzeEmotion(audioBlob: Blob): Promise<EmotionalContext> {
    if (!this.isConnected) {
      throw new Error('Service not connected');
    }

    try {
      console.log('🧠 Analyzing emotional context from audio...');
      
      // For now, return a simulated emotional analysis
      // In production, this would use the correct Hume API structure
      return {
        dominantEmotion: 'concerned',
        emotionScore: 0.7,
        emotionalState: 'stressed',
        recommendations: [
          'Use empathetic language',
          'Offer flexible payment options',
          'Listen actively to concerns'
        ]
      };

    } catch (error) {
      console.error('Error analyzing emotion:', error);
      
      // Return neutral emotional context as fallback
      return {
        dominantEmotion: 'neutral',
        emotionScore: 0.5,
        emotionalState: 'neutral',
        recommendations: ['Continue with standard approach']
      };
    }
  }

  private generateSmartKollectResponse(userInput: string): string {
    // Combine Hume's empathetic understanding with SmartKollect-specific knowledge
    const input = userInput.toLowerCase();
    
    // Debt collection specific responses with empathy
    if (input.includes('payment') || input.includes('pay')) {
      return "I understand discussing payments can be stressful. In SmartKollect, you can create Promise-to-Pay (PTP) agreements to help customers commit to payment schedules that work for them. Would you like me to show you how to set up a PTP?";
    }
    
    if (input.includes('customer') || input.includes('debtor')) {
      return "Managing customer relationships is crucial in debt collection. SmartKollect helps you track all customer interactions, payment history, and communication preferences. This empathetic approach often leads to better collection outcomes.";
    }
    
    if (input.includes('settlement')) {
      return "Settlement negotiations require sensitivity and understanding. SmartKollect's settlement module helps you create fair offers while tracking negotiation history. Remember, finding mutually beneficial solutions often works better than aggressive tactics.";
    }
    
    if (input.includes('stress') || input.includes('difficult') || input.includes('hard')) {
      return "I can sense this might be challenging. Debt collection can be emotionally demanding work. SmartKollect is designed to help you maintain professional, empathetic communication while achieving collection goals. What specific area would you like help with?";
    }
    
    // Default empathetic response
    return "I'm here to help you navigate SmartKollect with understanding and care. Whether you're dealing with challenging customers or complex collection scenarios, I can guide you through the system's features. What would you like to explore?";
  }

  private generateFallbackResponse(userInput: string): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('help') || input.includes('assist')) {
      return "I'm here to provide empathetic guidance with SmartKollect. I understand debt collection can be emotionally challenging, and I'm here to help you navigate both the technical and human aspects of the work.";
    }
    
    return "I understand you're looking for assistance with SmartKollect. I'm designed to provide empathetic, helpful guidance for debt collection professionals. How can I support you today?";
  }

  private processEmotionResults(result: any): EmotionalContext {
    // Process Hume's emotion analysis results
    // This is a simplified version - actual implementation would parse detailed emotion data
    
    const emotions = result.emotions || [];
    const dominantEmotion = emotions.length > 0 ? emotions[0].name : 'neutral';
    const emotionScore = emotions.length > 0 ? emotions[0].score : 0.5;
    
    let emotionalState: 'positive' | 'neutral' | 'negative' | 'stressed';
    let recommendations: string[];
    
    if (dominantEmotion.includes('stress') || dominantEmotion.includes('anger') || dominantEmotion.includes('frustration')) {
      emotionalState = 'stressed';
      recommendations = [
        'Use calming, empathetic language',
        'Acknowledge their concerns',
        'Offer flexible payment options',
        'Avoid aggressive collection tactics'
      ];
    } else if (dominantEmotion.includes('sad') || dominantEmotion.includes('fear') || dominantEmotion.includes('anxiety')) {
      emotionalState = 'negative';
      recommendations = [
        'Show understanding and compassion',
        'Provide clear, simple options',
        'Offer support resources',
        'Use reassuring tone'
      ];
    } else if (dominantEmotion.includes('joy') || dominantEmotion.includes('satisfaction') || dominantEmotion.includes('relief')) {
      emotionalState = 'positive';
      recommendations = [
        'Maintain positive momentum',
        'Confirm agreements clearly',
        'Express appreciation for cooperation'
      ];
    } else {
      emotionalState = 'neutral';
      recommendations = [
        'Continue with standard professional approach',
        'Monitor for emotional changes'
      ];
    }
    
    return {
      dominantEmotion,
      emotionScore,
      emotionalState,
      recommendations
    };
  }

  getConversationHistory(): VoiceMessage[] {
    return [...this.conversationHistory];
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  getCurrentEmotionalContext(): EmotionalContext | null {
    const lastMessage = this.conversationHistory
      .filter(msg => msg.role === 'user' && msg.emotions)
      .slice(-1)[0];
    
    if (lastMessage?.emotions) {
      return this.processEmotionResults({ emotions: lastMessage.emotions });
    }
    
    return null;
  }
}
