# 🔧 Fix Mobile Login Issue

## 🐛 **Problem:**
When logging in via phone, you get redirected to Gmail login page and get stuck there.

## ✅ **Solution:**
Add your production domain to Firebase authorized domains.

---

## 📋 **Step-by-Step Fix:**

### **Step 1: Go to Firebase Console**

1. Open: **https://console.firebase.google.com/**
2. Click on your project: **meal-planer-v2**

---

### **Step 2: Navigate to Authentication Settings**

1. In the left sidebar, click **"Authentication"**
2. Click the **"Settings"** tab at the top
3. Scroll down to **"Authorized domains"**

---

### **Step 3: Add Your Production Domains**

You should see a list like this:
- ✅ `localhost` (already there)
- ✅ `meal-planer-v2.firebaseapp.com` (already there)

**Click "Add domain"** and add these TWO domains:

1. **First domain:** `meal-planer-v2.web.app`
   - Click "Add domain"
   - Paste: `meal-planer-v2.web.app`
   - Click "Add"

2. **Second domain:** `meal-planer-v2.firebaseapp.com`
   - (This one might already be there - if so, skip it!)

---

### **Step 4: Test on Mobile**

1. Open your phone browser
2. Go to: **https://meal-planer-v2.web.app**
3. Click "Sign in with Google"
4. You should now be redirected back to the app! ✨

---

## 🎯 **What Should Be in Authorized Domains:**

Your authorized domains list should have:
- ✅ `localhost`
- ✅ `meal-planer-v2.firebaseapp.com`
- ✅ `meal-planer-v2.web.app`

---

## 🔍 **Why This Happens:**

Firebase redirect authentication works like this:
1. User clicks "Sign in with Google"
2. App redirects to Google sign-in page
3. User signs in
4. **Google redirects back to your app domain**
5. If domain is not authorized → Stuck at Gmail page ❌
6. If domain is authorized → Success! ✅

---

## 💡 **Pro Tip:**

If you later add a custom domain (like `mymealplanner.com`), you'll need to add that to authorized domains too!

---

## 🐛 **Still Not Working?**

### **Clear Browser Cache:**

On your phone:
- **iPhone Safari:** Settings → Safari → Clear History and Website Data
- **Android Chrome:** Settings → Privacy → Clear browsing data

Then try signing in again!

---

## 📱 **Alternative: Try Incognito/Private Mode**

This helps rule out cache issues:
- **iPhone:** Use Private browsing
- **Android:** Use Incognito mode

---

## ✅ **Test Checklist:**

After adding domains, test:
- [ ] Sign in on phone browser
- [ ] Sign in on computer
- [ ] Sign in on different phone
- [ ] Try Safari (iPhone)
- [ ] Try Chrome (Android)

All should work! 🎉

---

## 🎊 **That's It!**

After adding the domain, mobile sign-in should work perfectly!

The redirect flow will be:
1. Click "Sign in" → Google page
2. Sign in with Google
3. **Automatically redirect back to app** ✨
4. You're in! 🎉


