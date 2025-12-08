# 🚀 Deployment Guide - Firebase Credentials

## 🎯 Best Practice: Use Environment Variables

Instead of uploading the JSON file to your server, extract the values into environment variables. This is:
- ✅ More secure
- ✅ Easier to manage
- ✅ Works with all deployment platforms (Vercel, Railway, Render, AWS, etc.)
- ✅ No file upload needed

---

## 📋 Step-by-Step Setup

### Step 1: Extract Values from JSON

Open your `firebase-service-account.json` and extract these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",           // ← Copy this
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",  // ← Copy this
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",  // ← Copy this
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### Step 2: Add to `.env` (Local Development)

Update your `.env` file:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="your-secret-key"

# Server
PORT=3000

# Firebase - Use environment variables instead of JSON file
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
```

**Important**: For `FIREBASE_PRIVATE_KEY`, keep the `\n` characters - they're important!

### Step 3: Update `.env.example`

```env
# Firebase - Use environment variables (recommended for production)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# OR use JSON file path (local development only)
# FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"
```

---

## 🔧 Deployment Platform Instructions

### **Vercel**
1. Go to your project → Settings → Environment Variables
2. Add each variable:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY` (paste the entire key with \n)
   - `FIREBASE_CLIENT_EMAIL`
   - `DATABASE_URL`
   - `JWT_SECRET`

### **Railway**
1. Project → Variables tab
2. Click "New Variable"
3. Add each Firebase variable
4. Railway automatically restarts your app

### **Render**
1. Dashboard → Your Service → Environment
2. Add each variable
3. Click "Save Changes"

### **AWS / EC2 / VPS**
Option 1 - Environment Variables:
```bash
# Add to ~/.bashrc or ~/.zshrc
export FIREBASE_PROJECT_ID="..."
export FIREBASE_PRIVATE_KEY="..."
export FIREBASE_CLIENT_EMAIL="..."
```

Option 2 - Use a `.env` file on server:
```bash
# Upload .env file via SCP
scp .env user@your-server:/path/to/app/

# Or create it directly on server
nano /path/to/app/.env
```

### **Docker**
In your `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
```

Or use `.env` file:
```yaml
services:
  backend:
    env_file:
      - .env
```

---

## 🔄 Alternative: Upload JSON File (Not Recommended)

If you really want to use the JSON file on the server:

### For VPS/EC2:
```bash
# Upload via SCP
scp firebase-service-account.json user@your-server:/path/to/app/

# Set environment variable to point to it
export FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/app/firebase-service-account.json"
```

### For Docker:
```yaml
services:
  backend:
    volumes:
      - ./firebase-service-account.json:/app/firebase-service-account.json
    environment:
      - FIREBASE_SERVICE_ACCOUNT_PATH=/app/firebase-service-account.json
```

**Why not recommended:**
- ❌ File can be accidentally exposed
- ❌ Harder to rotate credentials
- ❌ Doesn't work well with some platforms (Vercel, Railway)

---

## ✅ Recommended Approach Summary

**Local Development:**
- Use `firebase-service-account.json` file (easier)
- OR use environment variables

**Production/Deployment:**
- ✅ **Always use environment variables**
- Add them in your platform's dashboard
- Never upload the JSON file to production

---

## 🔒 Security Tips

1. **Rotate credentials regularly** (every 90 days)
2. **Use different Firebase projects** for dev/staging/production
3. **Never commit** `.env` or JSON files
4. **Use secrets managers** for team sharing (1Password, AWS Secrets Manager)

---

## 🆘 Quick Reference

**What to add to deployment platform:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

That's it! No file uploads needed. 🎉
