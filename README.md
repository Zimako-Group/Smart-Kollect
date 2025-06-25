# Mahikeng Debt Collection Management System (DCMS)

## Overview

Mahikeng DCMS is a comprehensive debt collection management system built to streamline and optimize the debt collection process. The application provides a robust platform for debt collection agencies and financial institutions to manage debtors, track payments, arrange settlements, and monitor agent performance.

## Features

### Account Management
- Debtor information tracking with detailed account history
- Account allocation to collection agents
- Outstanding balance management and tracking
- Comprehensive customer profiles

### Collection Tools
- Promise to Pay (PTP) arrangements with tracking and notifications
- Settlement negotiations and management
- Debi-check integration for automated debit orders
- YeboPay integration for digital payments

### Communication
- BuzzBox telephony integration for making and receiving calls
- Call tracking and recording
- SIP/VoIP functionality for agent communications
- Email template management and sending

### Agent Dashboard
- Performance metrics and KPIs
- Collection statistics and targets
- Contact rate tracking
- Agent ranking and gamification elements

### Reporting and Analytics
- Comprehensive reporting on collection performance
- Settlement adherence tracking
- Collection rate analytics
- Agent performance comparisons

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript and React 19
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **API Integration**: BuzzBox API for telephony
- **Data Visualization**: ApexCharts, Recharts

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account and project
- BuzzBox account for telephony features

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Zimako-Dev/mahikeng-dcms.git
   cd mahikeng-dcms
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Run the development server
   ```bash
   # Standard development server
   npm run dev
   # or with Turbopack for faster development
   npm run dev:turbo
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

### Production Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## BuzzBox Integration

The system integrates with BuzzBox for telephony services. The integration provides:

- Making outbound calls to debtors
- Receiving inbound calls
- Call tracking and status management
- SIP configuration for VoIP calls

To use the BuzzBox integration, you need to authenticate with your BuzzBox credentials:

```typescript
// Initialize BuzzBox authentication
import { initializeBuzzBoxAuth } from './lib/buzzBoxAuthService';

// Use your BuzzBox credentials
initializeBuzzBoxAuth('your_email@example.com', 'your_password');
```

## Database Schema

The application uses Supabase with the following key tables:

- **Debtors**: Stores debtor information including account numbers and balances
- **Settlements**: Tracks settlement arrangements and their status
- **AccountActivities**: Records all account-related activities
- **PTPs**: Stores Promise to Pay arrangements

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and owned by Zimako Smart Business Solutions.

## Support

For support, please contact support@zimako.co.za.

## Cloc Command
cloc . --exclude-dir=node_modules,.git,dist,build,coverage
