# SMS Service Migration Guide: Infobip to MyMobileAPI

## Overview
This document outlines the migration from Infobip SMS service to MyMobileAPI for the Smart-Kollect application.

## What Changed

### 1. Service Provider
- **Before:** Infobip SMS API
- **After:** MyMobileAPI REST API

### 2. Authentication Method
- **Before:** App-based API key authentication
- **After:** Basic HTTP Authentication using ClientID:APISecret (Base64 encoded)

### 3. Environment Variables
Update your `.env.local` file with the following new variables:

```env
# Remove these old Infobip variables:
# INFOBIP_BASE_URL=http://wpmnqd.api.infobip.com
# INFOBIP_API_KEY=your_infobip_api_key
# INFOBIP_SENDER=SmartKollect

# Add these new MyMobileAPI variables:
MYMOBILEAPI_BASE_URL=https://rest.mymobileapi.com/v1
MYMOBILEAPI_CLIENT_ID=your_mymobileapi_client_id
MYMOBILEAPI_API_SECRET=your_mymobileapi_api_secret
MYMOBILEAPI_SENDER=SmartKollect
```

### 4. Code Changes

#### Files Modified:
1. `lib/sms-service.ts` - Complete rewrite for MyMobileAPI
2. `app/api/send-ptp-sms/route.ts` - Updated imports and response handling

#### Key Improvements:
- **Simple Authentication:** Direct Basic HTTP Authentication using ClientID:APISecret
- **E.164 Format:** Properly formats phone numbers to E.164 format as required
- **Test Mode Support:** Automatically enables test mode in development environment
- **Better Error Handling:** Enhanced error messages and status checking
- **Security:** No hardcoded credentials, all from environment variables
- **No Token Management:** Simpler than token-based auth, no caching needed

## API Differences

### Request Structure
**Infobip:**
```json
{
  "messages": [{
    "destinations": [{"to": "+27123456789"}],
    "from": "SmartKollect",
    "text": "Your message"
  }]
}
```

**MyMobileAPI:**
```json
{
  "to": "+27123456789",
  "from": "SmartKollect", 
  "body": "Your message",
  "testMode": true
}
```

### Response Structure
**Infobip:**
```json
{
  "messages": [{
    "to": "+27123456789",
    "status": {
      "groupId": 1,
      "groupName": "PENDING",
      "id": 26,
      "name": "MESSAGE_ACCEPTED",
      "description": "Message sent to next instance"
    },
    "messageId": "2250be2d4219-3af1-78856-aabe-1362af1edfd2"
  }]
}
```

**MyMobileAPI:**
```json
{
  "id": "msg_123456789",
  "from": "SmartKollect",
  "to": "+27123456789",
  "body": "Your message",
  "status": "sent",
  "direction": "outbound",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:01Z"
}
```

## Benefits of Migration

1. **Simplified Authentication:** Direct API key authentication without token management
2. **Better Documentation:** Clear REST API with standard HTTP responses
3. **Cost Efficiency:** MyMobileAPI typically offers competitive pricing
4. **Test Mode Support:** Built-in test mode for development and testing
5. **Compliance:** E.164 number formatting ensures international compatibility
6. **Reliability:** Robust error handling and status management
7. **No Token Overhead:** No need for token caching or refresh logic

## Testing Checklist

After deployment, verify:

- [ ] Environment variables are set correctly (CLIENT_ID and API_SECRET)
- [ ] SMS sending works via `/api/send-ptp-sms` endpoint
- [ ] Phone number validation functions correctly
- [ ] Test mode works in development environment
- [ ] Error handling displays appropriate messages
- [ ] PTP confirmation messages format correctly

## Rollback Plan

If issues arise, you can quickly rollback by:

1. Restore the old `lib/sms-service.ts` from version control
2. Restore the old `app/api/send-ptp-sms/route.ts` from version control  
3. Update environment variables back to Infobip settings
4. Redeploy the application

## Support

For MyMobileAPI specific issues:
- Check their REST API documentation at https://rest.mymobileapi.com
- Contact MyMobileAPI support for service-related questions

For implementation issues:
- Check application logs for detailed error messages
- Verify environment variable configuration
- Test authentication endpoint separately if needed