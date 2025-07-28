/**
 * Popup script for SRM Auto Login extension
 * Handles popup UI interactions and status display
 */

class PopupManager {
  constructor() {
    this.initializeUI();
    this.checkStatus();
  }

  /**
   * Initialize popup UI and event listeners
   */
  initializeUI() {
    // Configure credentials button
    document.getElementById('configureBtn').addEventListener('click', () => {
      this.openOptionsPage();
    });

    // Test login button
    document.getElementById('testLoginBtn').addEventListener('click', () => {
      this.openLoginPage();
    });

    // Clear data button
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      this.clearStoredData();
    });

    console.log('🎨 Popup UI initialized');
  }

  /**
   * Check extension status and update UI
   */
  async checkStatus() {
    try {
      // Check if credentials are stored
      const result = await chrome.storage.local.get(['credentialsStored', 'lastUpdated']);
      
      const statusDot = document.getElementById('statusDot');
      const statusText = document.getElementById('statusText');
      const statusDetails = document.getElementById('statusDetails');

      if (result.credentialsStored) {
        statusDot.className = 'status-dot active';
        statusText.textContent = 'Ready for auto-login';
        
        if (result.lastUpdated) {
          const lastUpdated = new Date(result.lastUpdated);
          statusDetails.textContent = `Credentials saved on ${lastUpdated.toLocaleDateString()}`;
        } else {
          statusDetails.textContent = 'Credentials are configured';
        }
      } else {
        statusDot.className = 'status-dot inactive';
        statusText.textContent = 'Not configured';
        statusDetails.textContent = 'Click "Configure Credentials" to set up auto-login';
      }

      // Check current tab
      await this.checkCurrentTab();

    } catch (error) {
      console.error('Error checking status:', error);
      this.showError('Error checking status');
    }
  }

  /**
   * Check if current tab is the SRM login page
   */
  async checkCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (currentTab && currentTab.url && currentTab.url.includes('student.srmap.edu.in/srmapstudentcorner/HRDSystem')) {
        const statusDetails = document.getElementById('statusDetails');
        statusDetails.innerHTML = statusDetails.innerHTML + '<br>📍 Currently on SRM login page';
        
        // Add a trigger auto-login button
        this.addTriggerButton();
      }
    } catch (error) {
      console.error('Error checking current tab:', error);
    }
  }

  /**
   * Add trigger auto-login button for current tab
   */
  addTriggerButton() {
    const buttonGroup = document.querySelector('.button-group');
    
    // Check if button already exists
    if (document.getElementById('triggerBtn')) return;

    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'triggerBtn';
    triggerBtn.className = 'primary-btn';
    triggerBtn.innerHTML = '🚀 Trigger Auto-Login';
    triggerBtn.style.background = 'rgba(255, 152, 0, 0.8)';
    
    triggerBtn.addEventListener('click', () => {
      this.triggerAutoLogin();
    });

    // Insert after configure button
    buttonGroup.insertBefore(triggerBtn, buttonGroup.children[1]);
  }

  /**
   * Trigger auto-login on current tab
   */
  async triggerAutoLogin() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab) {
        this.showError('No active tab found');
        return;
      }

      // Send message to content script to trigger auto-login
      await chrome.tabs.sendMessage(currentTab.id, {
        action: 'triggerAutoLogin'
      });

      // Show success message
      this.showSuccess('Auto-login triggered!');
      
      // Close popup after a delay
      setTimeout(() => {
        window.close();
      }, 1500);

    } catch (error) {
      console.error('Error triggering auto-login:', error);
      this.showError('Failed to trigger auto-login');
    }
  }

  /**
   * Open options page
   */
  openOptionsPage() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
    window.close();
  }

  /**
   * Open SRM login page
   */
  openLoginPage() {
    chrome.tabs.create({
      url: 'https://student.srmap.edu.in/srmapstudentcorner/HRDSystem'
    });
    window.close();
  }

  /**
   * Clear stored data
   */
  async clearStoredData() {
    if (!confirm('Are you sure you want to clear all stored credentials?')) {
      return;
    }

    try {
      await chrome.storage.local.clear();
      this.showSuccess('All data cleared');
      
      // Update status
      setTimeout(() => {
        this.checkStatus();
      }, 500);

    } catch (error) {
      console.error('Error clearing data:', error);
      this.showError('Failed to clear data');
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showMessage(message, '#4CAF50');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showMessage(message, '#f44336');
  }

  /**
   * Show temporary message
   */
  showMessage(message, color) {
    const statusText = document.getElementById('statusText');
    const originalText = statusText.textContent;
    const originalColor = statusText.style.color;

    statusText.textContent = message;
    statusText.style.color = color;

    setTimeout(() => {
      statusText.textContent = originalText;
      statusText.style.color = originalColor;
    }, 3000);
  }

  /**
   * Get extension statistics for display
   */
  async getExtensionStats() {
    try {
      const result = await chrome.storage.local.get([
        'installedAt',
        'activityLog',
        'lastUpdated'
      ]);

      return {
        installedAt: result.installedAt,
        activityCount: result.activityLog ? result.activityLog.length : 0,
        lastUpdated: result.lastUpdated
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const popupManager = new PopupManager();
  
  // Expose for debugging
  window.popupManager = popupManager;
  
  console.log('🚀 SRM Auto Login Popup - Initialized');
});

// Handle popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updatePopupStatus') {
    // Update popup status when needed
    const popupManager = window.popupManager;
    if (popupManager) {
      popupManager.checkStatus();
    }
  }
});
