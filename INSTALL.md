# 🚀 SRM Auto Login - Installation Guide

## Quick Setup (5 minutes)

### Step 1: Prepare the Extension
1. **Ensure all files are present** in the `my-extension` folder:
   ```
   my-extension/
   ├── manifest.json
   ├── content.js
   ├── background.js
   ├── options.html
   ├── options.js
   ├── popup.html
   ├── popup.js
   ├── crypto.js
   ├── README.md
   ├── build.bat
   └── lib/
       └── tesseract.min.js
   ```

### Step 2: Install Extension in Chrome
1. **Open Google Chrome**
2. **Navigate to** `chrome://extensions/`
3. **Enable "Developer mode"** (toggle switch in top-right corner)
4. **Click "Load unpacked"**
5. **Select the entire `my-extension` folder**
6. **Click "Select Folder"**

### Step 3: Configure Your Credentials
1. **Click the extension icon** in Chrome toolbar (🔐)
2. **Click "Configure Credentials"**
3. **Enter your SRM credentials:**
   - Student ID/Username
   - Password
4. **Click "Save Credentials"**
5. **See success message**

### Step 4: Test Auto-Login
1. **Visit:** https://student.srmap.edu.in/srmapstudentcorner/HRDSystem
2. **Watch the magic happen:**
   - Username auto-filled ✓
   - Password auto-filled ✓
   - Captcha automatically solved ✓
   - Form submitted ✓

## Alternative Installation (Using Build Script)

### Windows Users:
1. **Double-click `build.bat`** in the `my-extension` folder
2. **Follow the prompts** to create a clean build
3. **Load the generated build folder** as unpacked extension

## Troubleshooting

### ❌ Extension not loading:
- Make sure all files are present
- Check that you selected the correct folder
- Refresh the extensions page

### ❌ Auto-login not working:
- Verify credentials are saved in extension options
- Check you're on the correct SRM login page
- Look for error notifications on the page

### ❌ Captcha not solving:
- Clear and blurry captchas may fail OCR
- Extension will show notification if OCR confidence is low
- Manual captcha entry may be required in some cases

### ❌ Permission errors:
- Ensure the extension has proper permissions
- Try disabling and re-enabling the extension

## Features Overview

### 🔐 Security Features
- **AES-256 encryption** for stored credentials
- **Local storage only** - no data transmitted anywhere
- **PBKDF2 key derivation** with 100,000 iterations
- **Open source** - full transparency

### 🤖 Smart Features
- **OCR captcha solving** using Tesseract.js
- **Intelligent form detection** - works with various login forms
- **Confidence threshold** - only proceeds with high-confidence OCR
- **Error handling** - graceful fallbacks for failed operations

### 🎨 User Experience
- **Clean popup interface** with status indicators
- **Options page** for easy credential management
- **Real-time notifications** for user feedback
- **One-click testing** of login page

## Security Notes

✅ **Your credentials are safe:**
- Encrypted with military-grade AES-256 encryption
- Stored locally on your device only
- Never transmitted to any external servers
- Can be cleared at any time

✅ **Privacy respected:**
- No tracking or analytics
- No data collection
- No external network requests (except for login)
- Open source for full transparency

## Support

### Need Help?
1. **Check the troubleshooting section** above
2. **Review browser console** for error messages (F12 → Console)
3. **Try clearing and reconfiguring** credentials
4. **Ensure you're on the correct login page**

### Advanced Users
- Check browser console for detailed logs
- Extension logs operations with emoji prefixes
- Storage can be inspected via Chrome DevTools

---

## 🎉 Ready to Go!

Once installed and configured, the extension will automatically handle your SRM login process. Just visit the login page and watch it work!

**Happy logging in! 🎓**
