import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from "next/server";

// Create Anthropic model instance
const model = anthropic('claude-3-haiku-20240307');

export const runtime = 'edge';

// Fallback responses in case of API failures
const fallbackResponses = [
  "I can help you analyze payment patterns for this account. What specific information are you looking for?",
  "Based on the customer's history, I'd recommend offering a settlement plan. Would you like me to suggest some options?",
  "I can draft a payment reminder for you. Would you like me to personalize it with the customer's details?",
  "The optimal time to contact this customer would be during business hours. Would you like me to analyze their previous successful contact times?",
  "I can provide insights on this account's payment likelihood. Would you like me to analyze their payment history?"
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Check if Anthropic API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not configured in environment variables');
    return NextResponse.json({
      id: `error-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'claude-3-haiku-20240307',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: "I'm currently unavailable due to configuration issues. Please contact support.",
          },
          finish_reason: 'stop',
        },
      ],
    });
  }

  try {
    // Parse the request with error handling
    let messages;
    try {
      const body = await req.json();
      messages = body.messages || [];
    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      messages = [{ role: 'user', content: 'Hello' }];
    }

    // Prepare messages for Claude (Claude doesn't use system messages in the same way)
    const systemPrompt = `You are Zimako AI, a professional debt collection assistant for SmartKollect. 
You help debt collectors analyze accounts, suggest collection strategies, and provide information about debtors. 
Be professional, concise, and helpful. Focus on providing actionable insights and recommendations for debt collection tasks.`;
    
    // Convert messages to Claude format
    const claudeMessages = messages
      .filter((msg: any) => msg.role !== 'system') // Remove system messages
      .map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

    try {
      // Make a request to the Anthropic API using the AI SDK
      const result = await Promise.race([
        generateText({
          model: model,
          system: systemPrompt,
          messages: claudeMessages,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Anthropic API request timeout')), 15000)
        )
      ]) as any;

      // Format the response to match what the frontend expects
      return NextResponse.json({
        id: `claude-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'claude-3-haiku-20240307',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: result.text,
            },
            finish_reason: 'stop',
          },
        ],
      });
    } catch (apiError) {
      // Log the error but don't fail the request
      console.error('Anthropic API error:', apiError);
      
      // Use a fallback response
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      // Format the fallback response
      return NextResponse.json({
        id: `fallback-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'claude-3-haiku-20240307',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: fallbackResponse,
            },
            finish_reason: 'stop',
          },
        ],
      });
    }
  } catch (error) {
    // Catch-all error handler
    console.error('Unhandled error in AI route:', error);
    
    // Format the error response
    return NextResponse.json({
      id: `error-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'claude-3-haiku-20240307',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: "I'm having trouble processing your request right now. Please try again in a moment.",
          },
          finish_reason: 'stop',
        },
      ],
    });
  }
}
