import OpenAI from 'openai';

// Create an OpenAI API client with fallback error handling
const openai = new OpenAI({
  apiKey: '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',
});

export const runtime = 'edge';

// Fallback responses in case of API failures
const fallbackResponses = [
  "I can help you analyze payment patterns for this account. What specific information are you looking for?",
  "Based on the customer's history, I'd recommend offering a settlement plan. Would you like me to suggest some options?",
  "I can draft a payment reminder for you. Would you like me to personalize it with the customer's details?",
  "The optimal time to contact this customer would be during business hours. Would you like me to analyze their previous successful contact times?",
  "I can provide insights on this account's payment likelihood. Would you like me to analyze their payment history?"
];

export async function POST(req: Request) {
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

    // Create the system message
    const systemMessage = {
      role: 'system',
      content: `You are Zimako AI, a debt collection assistant. 
      You help debt collectors analyze accounts, suggest collection strategies, 
      and provide information about debtors. Be professional, concise, and helpful.
      Focus on providing actionable insights and recommendations.`,
    };

    // Combine system message with user messages
    const fullMessages = [systemMessage, ...messages];

    try {
      // Make a request to the OpenAI API with timeout handling
      const response = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: fullMessages,
          max_tokens: 500,
          temperature: 0.7,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API request timeout')), 10000)
        )
      ]) as any;

      // Format the response to match exactly what the Vercel AI SDK expects
      return new Response(
        JSON.stringify({
          id: response.id,
          object: response.object,
          created: response.created,
          model: response.model,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: response.choices[0].message.content,
              },
              finish_reason: response.choices[0].finish_reason,
            },
          ],
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (apiError) {
      // Log the error but don't fail the request
      console.error('OpenAI API error:', apiError);
      
      // Use a fallback response
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      // Format the fallback response to match exactly what the Vercel AI SDK expects
      return new Response(
        JSON.stringify({
          id: `fallback-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-4o-mini',
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
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    // Catch-all error handler
    console.error('Unhandled error in AI route:', error);
    
    // Format the error response to match exactly what the Vercel AI SDK expects
    return new Response(
      JSON.stringify({
        id: `error-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-4o-mini',
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
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
