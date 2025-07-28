/**
 * Content script for SRM Auto Login
 * Handles automatic login with OCR captcha solving
 */

class SRMAutoLogin {
  constructor() {
    this.cryptoHelper = new CryptoHelper();
    this.isProcessing = false;
    this.maxRetries = 3;
    this.currentRetry = 0;
    this.ocrConfidenceThreshold = 0.8;
    
    console.log('🚀 SRM Auto Login - Content Script Loaded');
    this.initialize();
  }

  /**
   * Initialize the auto-login process
   */
  async initialize() {
    // Wait for page to fully load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startAutoLogin());
    } else {
      this.startAutoLogin();
    }
  }

  /**
   * Start the automatic login process
   */
  async startAutoLogin() {
    try {
      console.log('🔍 Checking if we\'re on the login page...');
      
      // Verify we're on the correct page
      if (!this.isLoginPage()) {
        console.log('❌ Not on login page, skipping auto-login');
        return;
      }

      console.log('✅ Login page detected, starting auto-login process...');
      
      // Get stored credentials
      const { username, password } = await this.cryptoHelper.getCredentials();
      
      if (!username || !password) {
        this.showNotification('No credentials stored. Please configure in extension options.', 'warning');
        return;
      }

      console.log('🔐 Credentials retrieved, proceeding with login...');
      
      // Add a small delay to ensure page is fully rendered
      await this.delay(1000);
      
      // Start login process
      await this.performLogin(username, password);
      
    } catch (error) {
      console.error('❌ Error in auto-login process:', error);
      this.showNotification('Auto-login failed. Please try manual login.', 'error');
    }
  }

  /**
   * Check if current page is the login page
   */
  isLoginPage() {
    const url = window.location.href;
    const hasLoginForm = document.querySelector('input[type="password"]') || 
                        document.querySelector('input[name*="password"]') ||
                        document.querySelector('input[id*="password"]');
    
    return url.includes('student.srmap.edu.in/srmapstudentcorner/HRDSystem') && hasLoginForm;
  }

  /**
   * Perform the complete login process
   */
  async performLogin(username, password) {
    if (this.isProcessing) {
      console.log('⏸️ Login already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      console.log('📝 Step 1: Filling username and password...');
      await this.fillCredentials(username, password);
      
      console.log('🖼️ Step 2: Processing captcha...');
      const captchaSolved = await this.solveCaptcha();
      
      if (!captchaSolved) {
        this.showNotification('Could not solve captcha automatically. Please solve it manually and try again.', 'warning');
        return;
      }

      console.log('🚀 Step 3: Submitting login form...');
      await this.submitLogin();
      
    } catch (error) {
      console.error('❌ Login process failed:', error);
      this.showNotification('Login process failed: ' + error.message, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Fill username and password fields
   */
  async fillCredentials(username, password) {
    // Common selectors for username field
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="user"]',
      'input[name="userid"]',
      'input[name="login"]',
      'input[id*="username"]',
      'input[id*="user"]',
      'input[placeholder*="username"]',
      'input[placeholder*="User"]',
      'input[type="text"]'
    ];

    // Common selectors for password field
    const passwordSelectors = [
      'input[name="password"]',
      'input[name="pass"]',
      'input[name="pwd"]',
      'input[id*="password"]',
      'input[id*="pass"]',
      'input[type="password"]'
    ];

    // Find and fill username
    const usernameField = this.findElement(usernameSelectors);
    if (usernameField) {
      this.setInputValue(usernameField, username);
      console.log('✅ Username filled');
    } else {
      throw new Error('Username field not found');
    }

    // Find and fill password
    const passwordField = this.findElement(passwordSelectors);
    if (passwordField) {
      this.setInputValue(passwordField, password);
      console.log('✅ Password filled');
    } else {
      throw new Error('Password field not found');
    }

    // Small delay after filling
    await this.delay(500);
  }

  /**
   * Solve captcha using OCR
   */
  async solveCaptcha() {
    try {
      console.log('🔍 Getting captcha image from direct URL...');
      
      // Get captcha image from direct URL
      const captchaImg = await this.getCaptchaImage();
      if (!captchaImg) {
        console.log('⚠️ No captcha image available, proceeding without captcha...');
        return true;
      }

      console.log('🖼️ Captcha image loaded, converting to base64...');
      const imageData = await this.imageToBase64(captchaImg);
      
      console.log('🤖 Running OCR on captcha...');
      const ocrResult = await this.performOCR(imageData);
      
      if (ocrResult.confidence < this.ocrConfidenceThreshold) {
        console.log(`⚠️ OCR confidence too low: ${(ocrResult.confidence * 100).toFixed(1)}%`);
        this.showNotification(`Captcha OCR confidence low (${(ocrResult.confidence * 100).toFixed(1)}%). Please solve manually.`, 'warning');
        return false;
      }

      console.log(`✅ OCR successful: "${ocrResult.text}" (confidence: ${(ocrResult.confidence * 100).toFixed(1)}%)`);
      
      // Fill captcha field
      const captchaField = this.findCaptchaField();
      if (captchaField) {
        this.setInputValue(captchaField, ocrResult.text);
        console.log('✅ Captcha filled');
        this.showNotification(`Captcha solved: ${ocrResult.text}`, 'success');
        return true;
      } else {
        console.log('❌ Captcha input field not found');
        this.showNotification('Captcha input field not found on page', 'error');
        return false;
      }

    } catch (error) {
      console.error('❌ Captcha solving failed:', error);
      this.showNotification('Captcha solving failed: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Get captcha image from direct URL
   */
  async getCaptchaImage() {
    try {
      console.log('🔗 Fetching captcha from direct URL...');
      
      // Try method 1: Direct image loading
      try {
        const img = await this.loadImageDirectly();
        return img;
      } catch (error) {
        console.log('⚠️ Direct image loading failed, trying fetch method...');
      }
      
      // Try method 2: Fetch as blob and create object URL
      try {
        const img = await this.loadImageViaFetch();
        return img;
      } catch (error) {
        console.log('⚠️ Fetch method failed, trying page search as fallback...');
      }
      
      // Try method 3: Fallback to finding image on page
      return this.findCaptchaImageOnPage();
      
    } catch (error) {
      console.error('❌ Error getting captcha image:', error);
      throw error;
    }
  }

  /**
   * Load image directly with cross-origin settings
   */
  async loadImageDirectly() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('✅ Captcha image loaded via direct method');
        resolve(img);
      };
      
      img.onerror = (error) => {
        reject(new Error('Direct image loading failed'));
      };

      img.src = `https://student.srmap.edu.in/srmapstudentcorner/captchas`;
    });
  }

  /**
   * Load image via fetch API
   */
  async loadImageViaFetch() {
    try {
      const response = await fetch(`https://student.srmap.edu.in/srmapstudentcorner/captchas`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Accept': 'image/*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log('✅ Captcha image loaded via fetch method');
          // Clean up object URL after loading
          URL.revokeObjectURL(objectURL);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectURL);
          reject(new Error('Failed to load image from blob'));
        };
        img.src = objectURL;
      });
      
    } catch (error) {
      console.error('Fetch method error:', error);
      throw error;
    }
  }

  /**
   * Fallback: Find captcha image on the page
   */
  findCaptchaImageOnPage() {
    console.log('🔍 Falling back to searching for captcha on page...');
    
    const captchaSelectors = [
      'img[src*="captcha"]',
      'img[src*="Captcha"]',
      'img[src*="CAPTCHA"]',
      'img[alt*="captcha"]',
      'img[id*="captcha"]',
      'img[class*="captcha"]',
      'img[src*="code"]',
      'img[src*="verify"]'
    ];

    return this.findElement(captchaSelectors);
  }

  /**
   * Find captcha input field
   */
  findCaptchaField() {
    const captchaInputSelectors = [
      'input[name*="captcha"]',
      'input[name*="Captcha"]',
      'input[name*="CAPTCHA"]',
      'input[id*="captcha"]',
      'input[placeholder*="captcha"]',
      'input[placeholder*="code"]',
      'input[placeholder*="verification"]',
      'input[name*="code"]',
      'input[name*="verify"]'
    ];

    return this.findElement(captchaInputSelectors);
  }

  /**
   * Convert image to base64
   */
  async imageToBase64(img) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Wait for image to load if it hasn't already
        if (!img.complete) {
          img.onload = () => {
            this.drawImageToCanvas(canvas, ctx, img, resolve);
          };
          img.onerror = reject;
        } else {
          this.drawImageToCanvas(canvas, ctx, img, resolve);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw image to canvas and get base64
   */
  drawImageToCanvas(canvas, ctx, img, resolve) {
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    ctx.drawImage(img, 0, 0);
    const dataURL = canvas.toDataURL('image/png');
    resolve(dataURL);
  }

  /**
   * Perform OCR using Tesseract.js
   */
  async performOCR(imageData) {
    try {
      // Check if Tesseract is available
      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract.js not loaded');
      }

      console.log('🔄 Initializing Tesseract OCR...');
      
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
      });

      const text = result.data.text.trim().replace(/[^a-zA-Z0-9]/g, '');
      const confidence = result.data.confidence / 100;

      return {
        text: text,
        confidence: confidence
      };

    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('OCR processing failed: ' + error.message);
    }
  }

  /**
   * Submit the login form
   */
  async submitLogin() {
    // Look for submit button
    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'input[value*="Login"]',
      'input[value*="Sign"]',
      'button:contains("Login")',
      'button:contains("Sign")',
      '.login-btn',
      '#login-btn',
      'form button',
      'form input[type="button"]'
    ];

    const submitButton = this.findElement(submitSelectors);
    
    if (submitButton) {
      console.log('🎯 Found submit button, clicking...');
      submitButton.click();
      
      // Also try form submission as backup
      const form = submitButton.closest('form');
      if (form) {
        await this.delay(100);
        form.submit();
      }
      
      this.showNotification('Login submitted! Redirecting...', 'success');
    } else {
      // Try to find and submit form directly
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        console.log('📋 No submit button found, submitting form directly...');
        forms[0].submit();
        this.showNotification('Login form submitted!', 'success');
      } else {
        throw new Error('No submit button or form found');
      }
    }
  }

  /**
   * Utility function to find element by multiple selectors
   */
  findElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }

  /**
   * Set input value and trigger events
   */
  setInputValue(input, value) {
    // Clear existing value
    input.value = '';
    input.focus();
    
    // Set new value
    input.value = value;
    
    // Trigger events that frameworks might be listening for
    const events = ['input', 'change', 'keyup', 'blur'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      input.dispatchEvent(event);
    });
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `srm-auto-login-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#4CAF50',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '6px',
      zIndex: '10000',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxWidth: '300px',
      wordWrap: 'break-word'
    });
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
    
    console.log(`📢 Notification (${type}): ${message}`);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry mechanism for failed operations
   */
  async retryOperation(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`⚠️ Attempt ${i + 1} failed:`, error.message);
        if (i === maxRetries - 1) throw error;
        await this.delay(1000 * (i + 1)); // Exponential backoff
      }
    }
  }
}

// Initialize auto-login when script loads
(function() {
  // Prevent multiple instances
  if (window.srmAutoLoginInstance) {
    console.log('⚠️ SRM Auto Login already running');
    return;
  }
  
  window.srmAutoLoginInstance = new SRMAutoLogin();
})();

// Listen for messages from popup/background scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message);
  
  try {
    if (message.action === 'triggerAutoLogin') {
      // Trigger auto-login manually
      if (window.srmAutoLoginInstance) {
        window.srmAutoLoginInstance.startAutoLogin();
        sendResponse({ success: true, message: 'Auto-login triggered' });
      } else {
        sendResponse({ success: false, error: 'Auto-login instance not found' });
      }
    } else {
      sendResponse({ success: false, error: 'Unknown action: ' + message.action });
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep message channel open for async response
});
