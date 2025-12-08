# 🧪 Firebase Integration Testing Guide

## ✅ Current Status

**Firebase Credentials:** Migrated to environment variables ✅
**Server Status:** Running on port 3000 ✅

---

## 🔍 Quick Firebase Connection Check

### Check Server Logs

When the server starts, you should see one of these messages:

✅ **Success:**
```
✅ Firebase initialized with environment variables
```

⚠️ **Warning (if credentials missing):**
```
⚠️ Firebase not initialized - missing credentials
```

---

## 🧪 Manual Testing Steps

### Test 1: Send OTP (Server is Working)
```bash
curl -X POST http://localhost:3000/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

**Expected Response:**
```json
{"message": "OTP sent"}
```

**Check Console:** You should see the OTP code:
```
[MOCK OTP] Sending 123456 to +1234567890
```

---

### Test 2: Complete Order Flow with Firebase

#### Step 1: Get OTP from console (from Test 1)
Look for: `[MOCK OTP] Sending XXXXXX to +1234567890`

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:3000/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp": "REPLACE_WITH_OTP"}'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the `access_token`** - you'll need it for the next step!

#### Step 3: Create Order (This tests Firebase!)
```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-123" \
  -d '{
    "shopId": "630f4828-f130-4e8d-9038-c9e3361d43fc",
    "items": [
      {
        "productId": "098014d8-b9de-41c1-bb5b-fae35265cc1",
        "quantity": 2,
        "options": []
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "some-uuid",
  "shortId": "1234",
  "status": "PENDING",
  "totalAmount": 598,
  ...
}
```

**Check Server Console for:**
```
✅ Firestore updated for order {orderId}
```

---

## 🔥 Verify in Firebase Console

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/project/pizza-wale-d09be/firestore

### Step 2: Check Collections

You should see:

**For Shop Owners:**
```
📁 shops
  └─ 📁 630f4828-f130-4e8d-9038-c9e3361d43fc
      └─ 📁 orders
          └─ 📄 {orderId}
              - orderId: "..."
              - shortId: "1234"
              - status: "PENDING"
              - totalAmount: 598
              - customerPhone: "+1234567890"
              - items: [...]
              - createdAt: timestamp
              - updatedAt: timestamp
```

**For Customers:**
```
📁 users
  └─ 📁 {userId}
      └─ 📁 orders
          └─ 📄 {orderId}
              - orderId: "..."
              - shortId: "1234"
              - shopId: "..."
              - status: "PENDING"
              - totalAmount: 598
              - items: [...]
              - createdAt: timestamp
              - updatedAt: timestamp
```

---

## ✅ Success Criteria

Firebase integration is working if:

1. ✅ Server starts without Firebase errors
2. ✅ Order creation succeeds
3. ✅ Console shows: `✅ Firestore updated for order {orderId}`
4. ✅ Firebase Console shows order data in both collections
5. ✅ Timestamps are automatically set

---

## ❌ Troubleshooting

### Issue: "Firebase not initialized"

**Check:**
1. `.env` file has all three Firebase variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

2. Private key has `\n` characters (not actual newlines)

3. Restart server after updating `.env`

### Issue: "Permission denied" in Firestore

**Solution:** Update Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For testing only!
    }
  }
}
```

⚠️ **Note:** This allows all access - use proper rules in production!

### Issue: Order created but no Firestore data

**Check:**
1. Server console for error messages
2. Firebase project ID matches your project
3. Service account has Firestore permissions

---

## 🎯 Quick Test Command

Copy this entire block and run it (replace OTP with actual code from console):

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# 2. Check console for OTP, then verify (replace XXXXXX)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp": "XXXXXX"}' | jq -r '.access_token')

# 3. Create order
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{
    "shopId": "630f4828-f130-4e8d-9038-c9e3361d43fc",
    "items": [{
      "productId": "098014d8-b9de-41c1-bb5b-fae35265cc1",
      "quantity": 2,
      "options": []
    }]
  }'
```

---

## 📊 Test Results Checklist

- [ ] OTP sent successfully
- [ ] OTP verified, received JWT token
- [ ] Order created successfully
- [ ] Server console shows "✅ Firestore updated"
- [ ] Firebase Console shows order in `/shops/{shopId}/orders`
- [ ] Firebase Console shows order in `/users/{userId}/orders`
- [ ] Timestamps are set correctly

If all checked ✅ - **Firebase integration is complete!** 🎉
