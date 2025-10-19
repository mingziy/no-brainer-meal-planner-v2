# 🔥 Firebase Setup Guide

This guide will help you set up Firebase for your Meal Planner app so you can save recipes to the cloud and share them with friends!

---

## 📋 **What You'll Get:**

- ✅ **Cloud Storage** - Recipes saved in Firebase Firestore
- ✅ **Google Sign-In** - Easy authentication
- ✅ **Real-time Sync** - Changes appear instantly on all devices
- ✅ **Multi-device Access** - Access from phone, tablet, computer
- ✅ **Share with Friends** - Each person has their own account
- ✅ **FREE** for personal use

---

## ⏱️ **Setup Time:** ~10-15 minutes

---

## 🚀 **Step 1: Create a Firebase Project**

1. **Go to Firebase Console**: https://console.firebase.google.com/

2. **Click "Add project"**

3. **Name your project**:
   - Enter: `meal-planner` (or any name you like)
   - Click "Continue"

4. **Google Analytics** (optional):
   - You can disable this for simplicity
   - Click "Continue"

5. **Create project**:
   - Click "Create project"
   - Wait for it to finish (30 seconds)
   - Click "Continue"

---

## 🌐 **Step 2: Register Your Web App**

1. **On the Firebase Console homepage**, click the **Web icon** `</>`
   - It says "Add an app to get started"

2. **Register app**:
   - App nickname: `Meal Planner Web`
   - ✅ Check "Also set up Firebase Hosting" (optional, but recommended)
   - Click "Register app"

3. **Add Firebase SDK**:
   - You'll see a code block with your Firebase config
   - **Keep this page open!** You'll need these values in Step 4

4. **Click "Continue to console"**

---

## 🔒 **Step 3: Enable Google Authentication**

1. **In Firebase Console**, click "Authentication" in the left sidebar

2. **Click "Get started"**

3. **Go to "Sign-in method" tab**

4. **Enable Google**:
   - Click on "Google"
   - Toggle **Enable** to ON
   - Project support email: (your email will be auto-filled)
   - Click "Save"

---

## 💾 **Step 4: Create Firestore Database**

1. **In Firebase Console**, click "Firestore Database" in the left sidebar

2. **Click "Create database"**

3. **Start in production mode**:
   - Select "Start in production mode"
   - Click "Next"

4. **Choose location**:
   - Select a location close to you (e.g., `us-central` for US)
   - Click "Enable"
   - Wait for it to set up (~30 seconds)

5. **Set up Security Rules**:
   - Click "Rules" tab
   - Replace the entire content with:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own recipes
    match /recipes/{recipeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
\`\`\`

   - Click "Publish"

---

## ⚙️ **Step 5: Configure Your App (IMPORTANT)**

### 🔐 **Security First: Your credentials will NOT be committed to git!**

1. **In Firebase Console**, click the gear icon (⚙️) → "Project settings"

2. **Scroll down** to "Your apps" section

3. **Find "SDK setup and configuration"**

4. **Select "Config" radio button**

5. **Copy your Firebase config** - You'll see something like:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "meal-planner-xxxxx.firebaseapp.com",
  projectId: "meal-planner-xxxxx",
  storageBucket: "meal-planner-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
\`\`\`

6. **Create your local Firebase config** (this file is in .gitignore):

   **In your terminal, run:**
   \`\`\`bash
   cp src/config/firebase.example.ts src/config/firebase.ts
   \`\`\`

   This creates a copy of the template file that you can safely edit.

7. **Update your config file**:
   - Open: `src/config/firebase.ts` (the file you just created)
   - Replace ALL the placeholder values with your actual Firebase values:

\`\`\`typescript
const firebaseConfig = {
  apiKey: "AIzaSyA1234567890abcdefghijk",           // ← Paste your actual apiKey
  authDomain: "meal-planner-xxxxx.firebaseapp.com",  // ← Paste your actual authDomain
  projectId: "meal-planner-xxxxx",                   // ← Paste your actual projectId
  storageBucket: "meal-planner-xxxxx.appspot.com",   // ← Paste your actual storageBucket
  messagingSenderId: "123456789012",                 // ← Paste your actual messagingSenderId
  appId: "1:123456789012:web:abcdef1234567890"       // ← Paste your actual appId
};
\`\`\`

   - **Save the file**

8. **Verify the file is ignored by git**:
   \`\`\`bash
   git status
   \`\`\`
   
   You should **NOT** see `src/config/firebase.ts` in the list.
   
   ✅ **Good**: The file is being ignored (secure!)
   ❌ **Bad**: If you see it, check your .gitignore file

### 🔒 **Important Security Notes:**

- ✅ `firebase.ts` is in `.gitignore` - your credentials are safe
- ✅ `firebase.example.ts` is the template - this IS committed to git
- ✅ Never commit `firebase.ts` to git
- ✅ If you share your code, others will copy the example file and add their own credentials

---

## 📦 **Step 6: Install Dependencies**

In your terminal, run:

\`\`\`bash
npm install
\`\`\`

This will install Firebase and all required packages.

---

## 🎉 **Step 7: Start Your App**

1. **Stop your current dev server** (if running):
   - Press `Ctrl+C` in the terminal

2. **Start the dev server again**:
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Open your browser** to http://localhost:5173

4. **You should see the Sign-In Screen!** 🎊

---

## ✅ **Step 8: Test It Out**

1. **Click "Sign in with Google"**

2. **Choose your Google account**

3. **You're in!** 🎉

4. **Try adding a recipe**:
   - Click "Add" button
   - Choose "Paste Recipe Text"
   - Paste a recipe from `SAMPLE_CHINESE_RECIPE.txt`
   - Click "Process with AI"
   - Click "Save Recipe"

5. **Open in another browser/device**:
   - Go to http://localhost:5173
   - Sign in with the same Google account
   - Your recipes should appear! ✨

---

## 🤝 **Sharing with Friends**

Your friends can use the app in two ways:

### **Option 1: Share Deployed App (Recommended)**

1. **Deploy your app** (free options):
   - **Vercel**: https://vercel.com (easiest)
   - **Netlify**: https://netlify.com
   - **Firebase Hosting**: Already set up!

2. **Friends access your app URL**

3. **They sign in with their Google account**

4. **They get their own recipe collection** (completely separate from yours)

### **Option 2: Share Code**

If you want to share the code on GitHub:

1. **Your credentials are already safe**:
   - ✅ `firebase.ts` is in `.gitignore`
   - ✅ Your credentials will NOT be pushed to GitHub

2. **Push to GitHub**:
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

3. **Friends clone your repo**:
   \`\`\`bash
   git clone YOUR_REPO_URL
   cd meal-planner
   npm install
   \`\`\`

4. **They create their own Firebase config**:
   \`\`\`bash
   cp src/config/firebase.example.ts src/config/firebase.ts
   \`\`\`
   
   Then they add their own Firebase credentials to `firebase.ts`

5. **They can either**:
   - Use YOUR Firebase project (you add them as users)
   - Create THEIR OWN Firebase project (completely separate)

### **Adding Collaborators to Your Firebase Project:**

If you want friends to use YOUR Firebase project:

1. **Firebase Console** → Select your project
2. **Click gear icon** → "Users and permissions"
3. **Click "Add member"**
4. **Enter their email**
5. **Choose role**: "Editor" or "Viewer"
6. **They'll get an email invitation**

They can then use YOUR Firebase config values!

---

## 🐛 **Troubleshooting**

### **Issue: "Failed to sign in"**

**Solution**: 
1. Check that Google Sign-in is enabled in Firebase Console
2. Make sure your `firebaseConfig` values are correct
3. Try clearing your browser cache

---

### **Issue: "Permission denied" when saving recipes**

**Solution**:
1. Check Firestore Security Rules (Step 4.5)
2. Make sure you're signed in
3. Check browser console for detailed errors

---

### **Issue: Recipes not syncing**

**Solution**:
1. Check your internet connection
2. Open browser console (F12) → look for errors
3. Make sure you're signed in with the same account

---

### **Issue: Cannot connect to Firebase**

**Solution**:
1. Verify `firebaseConfig` in `/src/config/firebase.ts`
2. Make sure you ran `npm install`
3. Restart your dev server

---

## 📊 **Monitoring Usage**

Check your Firebase usage:

1. **Go to Firebase Console**
2. **Click "Usage" in the left sidebar**
3. **View**:
   - Daily active users
   - Database reads/writes
   - Storage used

**Free tier limits**:
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

*More than enough for personal/family use!*

---

## 💡 **Next Steps**

Once everything is working:

1. ✅ **Add your friends** - Share your app URL
2. ✅ **Add more recipes** - Build your collection
3. ✅ **Try on different devices** - Phone, tablet, etc.
4. ✅ **Deploy** - Make it accessible from anywhere
5. ✅ **Backup** - Firebase automatically backs up your data

---

## 🔐 **Security Notes**

- ✅ Your API keys are safe to expose (Firebase has security rules)
- ✅ Each user can only access their own data
- ✅ Google handles authentication securely
- ✅ Data is encrypted in transit and at rest

---

## 🆘 **Need Help?**

If you run into issues:

1. Check the Troubleshooting section above
2. Look at browser console errors (F12)
3. Check Firebase Console for error messages
4. Ask me for help!

---

## 🎊 **You're All Set!**

Congratulations! Your Meal Planner now has:
- ✅ Cloud storage
- ✅ Google Sign-in
- ✅ Real-time sync
- ✅ Multi-device access
- ✅ Ready to share with friends

Enjoy your cloud-powered meal planning! 🚀👨‍🍳👩‍🍳

