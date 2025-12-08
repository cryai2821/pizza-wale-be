# 🔒 Security Guide - Protecting Sensitive Files

## ⚠️ Files That Should NEVER Be Committed to GitHub

### 1. **Firebase Service Account JSON**
- ❌ `firebase-service-account.json`
- ❌ Any file matching `*-firebase-adminsdk-*.json`
- **Why**: Contains private keys that give full access to your Firebase project
- **Risk**: Anyone with this file can read/write your entire database

### 2. **Environment Variables**
- ❌ `.env`
- ❌ `.env.local`
- **Why**: Contains database passwords, API keys, secrets
- **Risk**: Database compromise, unauthorized access

---

## ✅ What We've Done to Protect You

### 1. Created `.gitignore`
This file tells Git to ignore sensitive files:
```
firebase-service-account.json
.env
.env.local
```

### 2. Created `.env.example`
A template file (safe to commit) showing what variables are needed without actual values.

---

## 📋 How to Use This in Your Team

### For You (First Setup):
1. ✅ You already have `firebase-service-account.json` and `.env`
2. ✅ These files are now protected by `.gitignore`
3. ✅ You can safely push to GitHub

### For Your Teammates:
When they clone the repo, they need to:

1. **Copy the template**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in their values** in `.env`:
   - Get `DATABASE_URL` from you or create their own database
   - Use the same `JWT_SECRET` (share securely, not via GitHub)
   - Set `PORT` if needed

3. **Get Firebase credentials**:
   - You share the `firebase-service-account.json` file with them **securely**
   - Options:
     - Send via encrypted email
     - Share via secure file sharing (Google Drive with restricted access)
     - Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)
     - Or they download their own from Firebase Console

---

## 🚀 Deploying to Production

### Option 1: Environment Variables (Recommended)
Instead of using the JSON file, use environment variables:

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@..."
```

Then update your code to use these instead of the JSON file.

### Option 2: Secrets Management
- **Vercel**: Add secrets in dashboard
- **Railway**: Environment variables in settings
- **AWS/GCP**: Use their secrets managers
- **Docker**: Use secrets or env files

---

## ✅ Verification Checklist

Before pushing to GitHub, verify:

```bash
# Check what will be committed
git status

# Should NOT see:
# ❌ firebase-service-account.json
# ❌ .env

# Should see:
# ✅ .gitignore
# ✅ .env.example
```

---

## 🆘 If You Accidentally Committed Secrets

### If you haven't pushed yet:
```bash
git reset HEAD~1
# Remove the file from staging
git rm --cached firebase-service-account.json
git rm --cached .env
# Commit again
git add .
git commit -m "Add project files (secrets excluded)"
```

### If you already pushed to GitHub:
1. **Immediately rotate all credentials**:
   - Generate new Firebase service account
   - Change database password
   - Change JWT_SECRET
2. **Remove from Git history**:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch firebase-service-account.json" \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```
3. **Contact GitHub support** to purge from their cache

---

## 📝 Summary

✅ **Safe to commit**:
- `.gitignore`
- `.env.example`
- All source code
- README.md
- package.json

❌ **NEVER commit**:
- `firebase-service-account.json`
- `.env`
- Any file with passwords/keys
- `node_modules/`

You're now protected! 🛡️
