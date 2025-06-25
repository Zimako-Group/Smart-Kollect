# Notification System Documentation

## Overview

The Mahikeng DCMS notification system tracks customer profile actions performed by agents, displays these notifications on the admin dashboard, and provides a dedicated admin notifications page for better auditing and monitoring of activities.

## Features

- **Real-time Notifications**: Tracks actions on customer profiles in real-time
- **Admin Dashboard Integration**: Shows latest notifications on the admin dashboard
- **Dedicated Notifications Page**: Provides detailed view of all notifications with filtering options
- **Notification Types**: Supports info, warning, and urgent notification types
- **Action Tracking**: Logs various actions including:
  - Profile edits
  - Settlement offers (creation, acceptance, rejection, expiration)
  - PTP arrangements (creation, defaulting)
  - Notes and flags

## Automated Processes

The system includes automated background processes to:

1. **Check for Expired Settlements**: Automatically marks settlements as expired when their expiry date passes
2. **Check for Defaulted PTPs**: Automatically marks PTP arrangements as defaulted when the payment date passes

## Setting Up Cron Jobs

To ensure the automated processes run regularly, you need to set up cron jobs. Here are two approaches:

### Option 1: Using Vercel Cron Jobs (Recommended)

If deploying on Vercel, add the following to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expired-settlements",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/check-defaulted-ptps",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This will run both jobs daily at midnight.

### Option 2: Using External Cron Service

If not using Vercel, you can use an external service like cron-job.org or GitHub Actions:

1. Register at a cron job service
2. Set up jobs to call these endpoints daily:
   - `https://your-domain.com/api/cron/check-expired-settlements`
   - `https://your-domain.com/api/cron/check-defaulted-ptps`

## API Endpoints

- **GET /api/cron/check-expired-settlements**: Checks for and updates expired settlements
- **GET /api/cron/check-defaulted-ptps**: Checks for and updates defaulted PTP arrangements

## Notification Types

The system supports three notification types:

1. **Info** (blue): General information notifications
2. **Warning** (amber): Important notices that require attention
3. **Urgent** (red): Critical alerts that need immediate action

## Implementation Details

The notification system is implemented using:

- **Supabase**: For storing and retrieving notifications
- **React**: For the frontend UI components
- **Next.js API Routes**: For the cron job endpoints
- **TailwindCSS**: For styling the notification components

## Security

The notification system implements Row Level Security (RLS) policies to ensure that only authenticated users can view and manipulate notifications.
