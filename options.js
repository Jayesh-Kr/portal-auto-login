/**
 * Options page script for managing credentials
 * Handles saving, loading, and clearing encrypted credentials
 */

class OptionsManager {
  constructor() {
    this.cryptoHelper = new CryptoHelper();
    this.initializeEventListeners();
    this.loadExistingCredentials();
  }

  /**
   * Initialize event listeners for form elements
   */
  initializeEventListeners() {
    // Form submission handler
    document.getElementById('credentialsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCredentials();
    });

    // Clear credentials button
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearCredentials();
    });

    // Test login page button
    document.getElementById('testBtn').addEventListener('click', () => {
      this.openLoginPage();
    });

    // Input validation
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.validateForm();
      });
    });
  }

  /**
   * Load existing credentials if they exist
   */
  async loadExistingCredentials() {
    try {
      const { username, password } = await this.cryptoHelper.getCredentials();
      
      if (username && password) {
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
        this.showStatus('Existing credentials loaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      this.showStatus('Error loading existing credentials', 'error');
    }
  }

  /**
   * Save credentials with encryption
   */
  async saveCredentials() {
    const saveBtn = document.getElementById('saveBtn');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validation
    if (!username || !password) {
      this.showStatus('Please fill in both username and password', 'error');
      return;
    }

    // Show loading state
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="loading"></span>Saving...';
    saveBtn.disabled = true;

    try {
      const success = await this.cryptoHelper.storeCredentials(username, password);
      
      if (success) {
        this.showStatus('✅ Credentials saved successfully! Extension is ready to use.', 'success');
        
        // Log success for debugging
        console.log('Credentials encrypted and stored successfully');
        
        // Show additional success info
        setTimeout(() => {
          this.showStatus('💡 Visit the SRM login page to see auto-login in action!', 'success');
        }, 3000);
      } else {
        this.showStatus('❌ Failed to save credentials. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      this.showStatus('❌ Error occurred while saving. Please try again.', 'error');
    } finally {
      // Restore button state
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  }

  /**
   * Clear all stored credentials
   */
  async clearCredentials() {
    const clearBtn = document.getElementById('clearBtn');
    
    // Confirm before clearing
    if (!confirm('Are you sure you want to clear all stored credentials?')) {
      return;
    }

    const originalText = clearBtn.innerHTML;
    clearBtn.innerHTML = '<span class="loading"></span>Clearing...';
    clearBtn.disabled = true;

    try {
      const success = await this.cryptoHelper.clearCredentials();
      
      if (success) {
        // Clear form fields
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        this.showStatus('🗑️ All credentials cleared successfully', 'success');
        console.log('Credentials cleared from storage');
      } else {
        this.showStatus('❌ Failed to clear credentials', 'error');
      }
    } catch (error) {
      console.error('Error clearing credentials:', error);
      this.showStatus('❌ Error occurred while clearing data', 'error');
    } finally {
      clearBtn.innerHTML = originalText;
      clearBtn.disabled = false;
    }
  }

  /**
   * Open SRM login page in new tab
   */
  openLoginPage() {
    try {
      const loginUrl = 'https://student.srmap.edu.in/srmapstudentcorner/HRDSystem';
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: loginUrl });
        this.showStatus('🌐 Opening SRM login page...', 'success');
      } else {
        this.showStatus('❌ Unable to open new tab', 'error');
      }
    } catch (error) {
      console.error('Error opening login page:', error);
      this.showStatus('❌ Error opening login page', 'error');
    }
  }

  /**
   * Validate form inputs
   */
  validateForm() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const saveBtn = document.getElementById('saveBtn');

    // Enable save button only if both fields have content
    if (username.length > 0 && password.length > 0) {
      saveBtn.disabled = false;
    } else {
      saveBtn.disabled = true;
    }
  }

  /**
   * Show status message to user
   * @param {string} message - Message to display
   * @param {string} type - Type of message ('success' or 'error')
   */
  showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Test storage functionality (for debugging)
   */
  async testStorage() {
    try {
      // Test encryption/decryption
      const testData = 'test-credential';
      const encrypted = await this.cryptoHelper.encrypt(testData);
      const decrypted = await this.cryptoHelper.decrypt(encrypted);
      
      console.log('Storage test:', {
        original: testData,
        encrypted: encrypted,
        decrypted: decrypted,
        success: testData === decrypted
      });
      
      return testData === decrypted;
    } catch (error) {
      console.error('Storage test failed:', error);
      return false;
    }
  }
}

// Initialize options manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const optionsManager = new OptionsManager();
  
  // Expose for debugging
  window.optionsManager = optionsManager;
  
  console.log('SRM Auto Login Options - Initialized');
});

// Handle chrome extension context
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Extension context detected');
} else {
  console.warn('Not running in extension context');
}
