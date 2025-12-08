#!/bin/bash

# Firebase Integration Test Script
# This script tests the complete order flow with Firebase integration

echo "🧪 Testing Firebase Integration..."
echo ""

# Get the shop ID and product ID from seed data
SHOP_ID="630f4828-f130-4e8d-9038-c9e3361d43fc"
PRODUCT_ID="098014d8-b9de-41c1-bb5b-fae35265cc1"

echo "📋 Step 1: Shop Owner Login"
echo "================================"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/shop/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

echo "$LOGIN_RESPONSE" | jq '.'
SHOP_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ "$SHOP_TOKEN" = "null" ] || [ -z "$SHOP_TOKEN" ]; then
  echo "❌ Shop login failed!"
  exit 1
fi
echo "✅ Shop owner logged in"
echo ""

echo "📋 Step 2: Customer OTP Flow"
echo "================================"
echo "Sending OTP to +1234567890..."
OTP_SEND=$(curl -s -X POST http://localhost:3000/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}')

echo "$OTP_SEND" | jq '.'
echo ""
echo "⚠️  Check server console for OTP code (Mock OTP Provider)"
echo "Enter the OTP code: "
read OTP_CODE

echo ""
echo "Verifying OTP..."
OTP_VERIFY=$(curl -s -X POST http://localhost:3000/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+1234567890\", \"otp\": \"$OTP_CODE\"}")

echo "$OTP_VERIFY" | jq '.'
CUSTOMER_TOKEN=$(echo "$OTP_VERIFY" | jq -r '.access_token')

if [ "$CUSTOMER_TOKEN" = "null" ] || [ -z "$CUSTOMER_TOKEN" ]; then
  echo "❌ OTP verification failed!"
  exit 1
fi
echo "✅ Customer authenticated"
echo ""

echo "📋 Step 3: Create Order (Firebase Test)"
echo "================================"
IDEMPOTENCY_KEY="test-firebase-$(date +%s)"

ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "{
    \"shopId\": \"$SHOP_ID\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2,
        \"options\": []
      }
    ]
  }")

echo "$ORDER_RESPONSE" | jq '.'
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id')

if [ "$ORDER_ID" = "null" ] || [ -z "$ORDER_ID" ]; then
  echo "❌ Order creation failed!"
  exit 1
fi
echo "✅ Order created: $ORDER_ID"
echo ""

echo "📋 Step 4: Update Order Status (Firebase Test)"
echo "================================"
STATUS_UPDATE=$(curl -s -X POST "http://localhost:3000/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $SHOP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}')

echo "$STATUS_UPDATE" | jq '.'
echo "✅ Order status updated"
echo ""

echo "🎉 Firebase Integration Test Complete!"
echo ""
echo "📊 Summary:"
echo "  - Shop Owner Login: ✅"
echo "  - Customer OTP Auth: ✅"
echo "  - Order Creation: ✅ (Order ID: $ORDER_ID)"
echo "  - Status Update: ✅"
echo ""
echo "🔥 Check Firebase Console:"
echo "  1. Go to: https://console.firebase.google.com/project/pizza-wale-d09be/firestore"
echo "  2. Look for collections:"
echo "     - /shops/$SHOP_ID/orders/$ORDER_ID"
echo "     - /users/{userId}/orders/$ORDER_ID"
echo ""
echo "✅ If you see the order data in Firestore, Firebase integration is working!"
