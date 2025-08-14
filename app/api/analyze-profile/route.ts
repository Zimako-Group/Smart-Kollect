import { NextRequest, NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { z } from 'zod';

// Define the analysis result schema to match Claude's response format
const analysisSchema = z.object({
  riskScore: z.number().min(0).max(100).describe('Risk score from 0-100, where 100 is highest risk'),
  paymentLikelihood: z.enum(['low', 'medium', 'high']).describe('Likelihood of payment success'),
  recommendedStrategy: z.string().describe('Detailed recommended collection strategy'),
  behavioralPatterns: z.array(z.string()).describe('Observed behavioral patterns'),
  communicationPreferences: z.array(z.string()).describe('Preferred communication methods'),
  urgencyLevel: z.enum(['low', 'medium', 'high']).describe('How urgently this account needs attention'),
  settlementRecommendations: z.string().describe('Settlement recommendations and reasoning'),
  keyInsights: z.array(z.string()).describe('3-5 key insights about the customer'),
  nextBestActions: z.array(z.string()).describe('3-4 specific next actions to take')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer, accountHistory, paymentHistory } = body;

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer data is required'
      }, { status: 400 });
    }

    // Construct detailed prompt for AI analysis
    const analysisPrompt = `
You are an expert debt collection analyst. Analyze the following customer profile and provide actionable insights for collection strategy.

CUSTOMER INFORMATION:
- Name: ${customer.first_name} ${customer.last_name}
- Account Number: ${customer.account_number}
- Balance: ${customer.balance}
- Status: ${customer.status}
- Phone: ${customer.phone}
- Email: ${customer.email}
- Address: ${customer.address}
- Created: ${customer.created_at}
- Last Updated: ${customer.updated_at}

ACCOUNT HISTORY:
${accountHistory?.map((entry: any) => `- ${entry.date}: ${entry.action} - ${entry.notes}`).join('\n') || 'No account history available'}

PAYMENT HISTORY:
${paymentHistory?.map((payment: any) => `- ${payment.date}: $${payment.amount} (${payment.method}) - ${payment.status}`).join('\n') || 'No payment history available'}

Based on this information, provide a comprehensive analysis focusing on:
1. Risk assessment and payment likelihood
2. Behavioral patterns and insights
3. Recommended collection strategy
4. Communication preferences
5. Next best actions
6. Settlement recommendations if applicable

Consider factors like:
- Payment history patterns
- Communication responsiveness
- Account age and balance
- Previous collection attempts
- Customer behavior indicators
`;

    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    // Generate AI analysis using Anthropic Claude Sonnet 4
    // Create Anthropic provider instance
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Using generateText with structured JSON response format
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `${analysisPrompt}

IMPORTANT: Respond with ONLY a valid JSON object that matches this exact schema:
{
  "riskScore": number (0-100),
  "paymentLikelihood": "low" | "medium" | "high",
  "recommendedStrategy": "detailed strategy description as a string",
  "behavioralPatterns": ["pattern1", "pattern2", "pattern3"],
  "communicationPreferences": ["phone", "email", "sms"],
  "urgencyLevel": "low" | "medium" | "high",
  "settlementRecommendations": "settlement analysis and recommendations as a string",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "nextBestActions": ["action1", "action2", "action3"]
}

Do not include any other text, explanations, or markdown formatting. Return only the JSON object.`,
    });

    // Parse the JSON response from Claude
    console.log('Raw AI response:', result.text);
    
    let analysisData;
    try {
      // Clean the response text - remove any markdown formatting or extra text
      let cleanedText = result.text.trim();
      
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        cleanedText = jsonMatch[1];
      }
      
      // Try to find JSON object if there's extra text
      const jsonObjectMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        cleanedText = jsonObjectMatch[0];
      }
      
      console.log('Cleaned text for parsing:', cleanedText);
      
      analysisData = JSON.parse(cleanedText);
      console.log('Parsed analysis data:', analysisData);
      
      // Validate against our schema
      const validatedData = analysisSchema.parse(analysisData);
      console.log('Validated data:', validatedData);
      
      return NextResponse.json({
        success: true,
        analysis: validatedData,
        timestamp: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI response:', result.text);
      console.error('Parse error details:', parseError);
      
      // Return more detailed error information
      return NextResponse.json({
        success: false,
        error: 'Invalid AI response format',
        details: `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        rawResponse: result.text.substring(0, 500), // First 500 chars for debugging
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in AI profile analysis:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's an API key issue
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userFriendlyMessage = 'Failed to analyze profile';
    
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      userFriendlyMessage = 'AI service authentication error. Please check API configuration.';
    } else if (errorMessage.includes('rate limit')) {
      userFriendlyMessage = 'AI service rate limit exceeded. Please try again later.';
    } else if (errorMessage.includes('model')) {
      userFriendlyMessage = 'AI model error. Please try again.';
    }

    return NextResponse.json({
      success: false,
      error: userFriendlyMessage,
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
