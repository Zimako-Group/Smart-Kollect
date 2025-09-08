#!/bin/bash

# SMS Test Script using curl commands
# Make sure your Next.js server is running with: npm run dev

echo "==============================================="
echo "           SMS SERVICE TEST (CURL)"
echo "==============================================="
echo ""

BASE_URL="http://localhost:3000"
PHONE_NUMBER="0606424958"

echo "📋 Testing SMS service configuration..."
echo "GET $BASE_URL/api/test-sms"
echo ""

curl -s -X GET "$BASE_URL/api/test-sms" \
  -H "Accept: application/json" | jq . || echo "Response received (jq not available for formatting)"

echo ""
echo "=============================================="
echo ""

echo "📱 Sending test SMS to $PHONE_NUMBER..."
echo "POST $BASE_URL/api/test-sms"
echo ""

curl -s -X POST "$BASE_URL/api/test-sms" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"phoneNumber\": \"$PHONE_NUMBER\"}" | jq . || echo "Response received (jq not available for formatting)"

echo ""
echo "=============================================="
echo ""

echo "💰 Testing PTP SMS..."
echo "POST $BASE_URL/api/send-ptp-sms"
echo ""

PAYMENT_DATE=$(date -d "+7 days" +%Y-%m-%d)

curl -s -X POST "$BASE_URL/api/send-ptp-sms" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"customerName\": \"Test Customer\",
    \"phoneNumber\": \"$PHONE_NUMBER\",
    \"amount\": 1500.00,
    \"paymentDate\": \"$PAYMENT_DATE\",
    \"paymentMethod\": \"bank_transfer\",
    \"notes\": \"Test PTP from curl script\"
  }" | jq . || echo "Response received (jq not available for formatting)"

echo ""
echo "=============================================="
echo "                 TEST COMPLETE"
echo "=============================================="
echo ""
echo "📱 Check your phone for test messages!"
echo "💡 If tests failed, check your .env.local file for correct MyMobileAPI credentials"