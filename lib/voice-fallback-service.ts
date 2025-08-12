// Fallback service for when Gradio API is not available
export class VoiceFallbackService {
  private responses = [
    "I'm here to help you with SmartKollect! How can I assist you today?",
    "That's interesting! Tell me more about what you need help with.",
    "I understand. Let me help you with that debt collection task.",
    "Great question! In SmartKollect, you can manage customers, track payments, and handle settlements.",
    "I can help you navigate through the system. What specific feature would you like to know about?",
    "For customer management, you can use the All Customers section to view and manage debtor accounts.",
    "The PTP (Promise to Pay) feature helps you track payment commitments from customers.",
    "Settlement offers can be managed through the Settlement Offers section in the sidebar.",
    "You can generate reports and track metrics using the admin dashboard features.",
    "Is there anything specific about debt collection or customer management you'd like to know?"
  ];

  async generateTextResponse(userInput: string): Promise<string> {
    // Simple keyword-based responses
    const input = userInput.toLowerCase();
    
    if (input.includes('help') || input.includes('assist')) {
      return "I'm here to help you with SmartKollect! You can ask me about customer management, payments, settlements, or any other features.";
    }
    
    if (input.includes('customer') || input.includes('debtor')) {
      return "For customer management, you can view all customers in the 'All Customers' section. You can search, filter, and manage individual customer accounts there.";
    }
    
    if (input.includes('payment') || input.includes('ptp')) {
      return "Promise to Pay (PTP) helps you track payment commitments. You can create PTPs, monitor their status, and follow up on defaulted promises.";
    }
    
    if (input.includes('settlement')) {
      return "Settlement offers allow you to negotiate reduced payment amounts with customers. You can create, track, and manage settlements through the Settlement Offers section.";
    }
    
    if (input.includes('report') || input.includes('metric')) {
      return "You can access various reports and metrics through the admin dashboard. This includes payment statistics, agent performance, and collection analytics.";
    }
    
    if (input.includes('flag')) {
      return "Flags help you categorize and prioritize accounts. You can create custom flags to mark accounts that need special attention or follow-up.";
    }
    
    // Return a random response if no keywords match
    const randomIndex = Math.floor(Math.random() * this.responses.length);
    return this.responses[randomIndex];
  }

  // Check if the service is available
  isAvailable(): boolean {
    return typeof window !== 'undefined';
  }
}
