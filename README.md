# SRM Auto Login Chrome Extension

A Chrome extension that automates login for SRM Student Portal with OCR-powered captcha solving.

## Features

- 🔐 **Secure Credential Storage**: AES-256 encryption for stored credentials
- 🤖 **OCR Captcha Solving**: Automatic captcha recognition using Tesseract.js
- 🚀 **Auto-Fill Forms**: Automatically fills username, password, and captcha
- 🔒 **Privacy-First**: All data stays on your device, never transmitted
- ⚡ **Manifest V3**: Built with the latest Chrome extension standards

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download or Clone this repository**
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle switch in top-right corner)
4. **Click "Load unpacked"** and select the `my-extension` folder
5. **Configure credentials** by clicking on the extension icon and selecting "Configure Credentials"

### Method 2: Installation from Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once approved.

## Setup Instructions

### 1. Configure Credentials

1. Click on the extension icon in your Chrome toolbar
2. Click "Configure Credentials" or right-click the extension → "Options"
3. Enter your SRM Student Portal username and password
4. Click "Save Credentials"

Your credentials are encrypted using AES-256 encryption before being stored locally.

### 2. Test Auto-Login

1. Visit the SRM Student Portal: https://student.srmap.edu.in/srmapstudentcorner/HRDSystem
2. The extension will automatically:
   - Fill in your username and password
   - Capture and solve the captcha using OCR
   - Submit the login form

## How It Works

### 1. Credential Storage
- Uses Web Crypto API for AES-GCM encryption
- PBKDF2 key derivation with 100,000 iterations
- All data stored locally in Chrome's secure storage

### 2. OCR Processing
- Captures captcha image from the page
- Converts to base64 format
- Processes with Tesseract.js OCR engine
- Filters results for confidence threshold (>80%)

### 3. Form Automation
- Intelligently finds form fields using multiple selectors
- Simulates user input with proper event triggering
- Handles various form submission methods

## Security Features

- **Local Storage Only**: No data ever leaves your device
- **AES-256 Encryption**: Military-grade encryption for stored credentials
- **No Hardcoded Secrets**: No sensitive information in source code
- **Permission Minimal**: Only requests necessary permissions
- **Open Source**: Full source code available for security review

## Troubleshooting

### Extension Not Working
1. Make sure you're on the correct login page
2. Check if credentials are saved in options
3. Try refreshing the page
4. Check browser console for error messages

### Captcha Recognition Issues
- The extension requires clear captcha images
- If OCR confidence is below 80%, manual input is required
- Some captchas may be too distorted for automatic recognition

### Clear Data and Reset
1. Click extension icon → "Clear Stored Data"
2. Or go to `chrome://extensions/` → Extension details → "Extension options"
3. Use "Clear Stored Data" button to reset everything

## Development

### Project Structure
```
my-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── content.js            # Main auto-login logic
├── background.js         # Background service worker
├── options.html          # Options page UI
├── options.js           # Options page logic
├── popup.html           # Extension popup UI
├── popup.js            # Popup logic
├── crypto.js           # Encryption/decryption utilities
└── lib/
    └── tesseract.min.js # OCR library
```

### Key Files

- **`manifest.json`**: Extension configuration and permissions
- **`content.js`**: Main script that runs on SRM login page
- **`crypto.js`**: Handles secure credential encryption/decryption
- **`options.js`**: Manages the settings page
- **`background.js`**: Service worker for extension lifecycle

### Building from Source

1. Clone this repository
2. Ensure all files are in the `my-extension` folder
3. The Tesseract.js library should be in `lib/tesseract.min.js`
4. Load as unpacked extension in Chrome

## Permissions Explained

- **`storage`**: Store encrypted credentials locally
- **`scripting`**: Inject content script on login page
- **`notifications`**: Show status notifications
- **`host_permissions`**: Access to SRM domain only

## Privacy Policy

This extension:
- Does NOT collect any personal data
- Does NOT transmit data to external servers
- Stores credentials locally with encryption
- Only operates on specified SRM domain
- Is completely open source for transparency

## Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Brave**: Latest version
- **Other Chromium browsers**: Should work with Manifest V3 support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Disclaimer

This extension is created for educational purposes and to improve user experience. Users are responsible for:
- Keeping their credentials secure
- Complying with SRM's terms of service
- Using the extension responsibly

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Create an issue on GitHub with details

---

**⚠️ Important**: This extension is not officially affiliated with SRM University. Use at your own discretion and ensure compliance with university policies.
