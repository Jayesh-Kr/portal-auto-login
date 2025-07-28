/**
 * Background script for SRM Auto Login extension
 * Handles extension lifecycle and provides support for content scripts
 */

// Service Worker compatibility check
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('🔧 SRM Auto Login - Background Service Worker Starting');
} else {
  console.error('❌ Chrome runtime not available');
}

class BackgroundService {
  constructor() {
    try {
      this.initializeEventListeners();
      console.log('✅ SRM Auto Login - Background Service Started');
    } catch (error) {
      console.error('❌ Background service initialization failed:', error);
    }
  }

  /**
   * Initialize event listeners for chrome extension events
   */
  initializeEventListeners() {
    // Handle extension installation/update
    if (chrome.runtime && chrome.runtime.onInstalled) {
      chrome.runtime.onInstalled.addListener((details) => {
        this.handleInstallation(details);
      });
    }

    // Handle messages from content scripts
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
      });
    }

    // Handle tab updates to inject content script if needed
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        this.handleTabUpdate(tabId, changeInfo, tab);
      });
    }

    // Handle extension startup
    if (chrome.runtime && chrome.runtime.onStartup) {
      chrome.runtime.onStartup.addListener(() => {
        console.log('🚀 Extension startup detected');
      });
    }
  }

  /**
   * Handle extension installation or update
   */
  async handleInstallation(details) {
    console.log('📦 Extension installation event:', details.reason);

    if (details.reason === 'install') {
      // First time installation
      await this.handleFirstInstall();
    } else if (details.reason === 'update') {
      // Extension updated
      await this.handleUpdate(details.previousVersion);
    }
  }

  /**
   * Handle first-time installation
   */
  async handleFirstInstall() {
    console.log('🎉 First time installation detected');

    try {
      // Open options page on first install
      if (chrome.tabs && chrome.tabs.create) {
        await chrome.tabs.create({
          url: chrome.runtime.getURL('options.html')
        });
      }

      // Show welcome notification
      if (chrome.notifications && chrome.notifications.create) {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon.svg',
          title: 'SRM Auto Login Installed!',
          message: 'Configure your credentials in the options page to get started.'
        });
      }

      // Set installation timestamp
      if (chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({
          installedAt: Date.now(),
          version: chrome.runtime.getManifest().version
        });
      }
    } catch (error) {
      console.error('❌ Error during first install:', error);
    }
  }

  /**
   * Handle extension update
   */
  async handleUpdate(previousVersion) {
    console.log(`🔄 Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);

    // Store update information
    await chrome.storage.local.set({
      lastUpdated: Date.now(),
      previousVersion: previousVersion,
      currentVersion: chrome.runtime.getManifest().version
    });
  }

  /**
   * Handle messages from content scripts
   */
  async handleMessage(message, sender, sendResponse) {
    console.log('📨 Message received:', message);

    try {
      switch (message.action) {
        case 'getCredentials':
          await this.handleGetCredentials(sendResponse);
          break;

        case 'storeCredentials':
          await this.handleStoreCredentials(message.data, sendResponse);
          break;

        case 'clearCredentials':
          await this.handleClearCredentials(sendResponse);
          break;

        case 'showNotification':
          await this.handleShowNotification(message.data, sendResponse);
          break;

        case 'openOptionsPage':
          await this.handleOpenOptionsPage(sendResponse);
          break;

        case 'logActivity':
          await this.handleLogActivity(message.data, sendResponse);
          break;

        default:
          console.warn('⚠️ Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle tab update events
   */
  async handleTabUpdate(tabId, changeInfo, tab) {
    // Only process when page is completely loaded
    if (changeInfo.status !== 'complete') return;

    // Check if this is the SRM login page
    if (tab.url && tab.url.includes('student.srmap.edu.in/srmapstudentcorner/HRDSystem')) {
      console.log('🎯 SRM login page detected in tab:', tabId);
      
      // Ensure content script is injected (backup mechanism)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            // Check if content script is already loaded
            return window.srmAutoLoginInstance ? 'loaded' : 'not_loaded';
          }
        });
      } catch (error) {
        console.log('📄 Content script check failed (normal if already injected):', error.message);
      }
    }
  }

  /**
   * Handle credential retrieval request
   */
  async handleGetCredentials(sendResponse) {
    try {
      const result = await chrome.storage.local.get([
        'encryptedUsername',
        'encryptedPassword',
        'credentialsStored'
      ]);

      sendResponse({
        success: true,
        data: result
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle credential storage request
   */
  async handleStoreCredentials(data, sendResponse) {
    try {
      await chrome.storage.local.set({
        encryptedUsername: data.encryptedUsername,
        encryptedPassword: data.encryptedPassword,
        credentialsStored: true,
        lastUpdated: Date.now()
      });

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle credential clearing request
   */
  async handleClearCredentials(sendResponse) {
    try {
      await chrome.storage.local.remove([
        'encryptedUsername',
        'encryptedPassword',
        'credentialsStored'
      ]);

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle notification display request
   */
  async handleShowNotification(data, sendResponse) {
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.svg',
        title: data.title || 'SRM Auto Login',
        message: data.message
      });

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle options page opening request
   */
  async handleOpenOptionsPage(sendResponse) {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('options.html')
      });

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle activity logging
   */
  async handleLogActivity(data, sendResponse) {
    try {
      // Get existing activity log
      const result = await chrome.storage.local.get(['activityLog']);
      const activityLog = result.activityLog || [];

      // Add new activity entry
      activityLog.push({
        timestamp: Date.now(),
        action: data.action,
        details: data.details,
        url: data.url
      });

      // Keep only last 100 entries
      if (activityLog.length > 100) {
        activityLog.splice(0, activityLog.length - 100);
      }

      // Store updated log
      await chrome.storage.local.set({ activityLog });

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get extension statistics
   */
  async getStats() {
    try {
      const result = await chrome.storage.local.get([
        'installedAt',
        'lastUpdated',
        'activityLog',
        'credentialsStored'
      ]);

      return {
        installedAt: result.installedAt,
        lastUpdated: result.lastUpdated,
        activityCount: result.activityLog ? result.activityLog.length : 0,
        hasCredentials: !!result.credentialsStored,
        version: chrome.runtime.getManifest().version
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  /**
   * Clean up old data (maintenance)
   */
  async performMaintenance() {
    try {
      // Clean old activity logs (older than 30 days)
      const result = await chrome.storage.local.get(['activityLog']);
      if (result.activityLog) {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filteredLog = result.activityLog.filter(entry => entry.timestamp > thirtyDaysAgo);
        
        if (filteredLog.length !== result.activityLog.length) {
          await chrome.storage.local.set({ activityLog: filteredLog });
          console.log('🧹 Cleaned old activity log entries');
        }
      }
    } catch (error) {
      console.error('❌ Maintenance error:', error);
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Run maintenance on startup
backgroundService.performMaintenance();

// Schedule periodic maintenance (every 24 hours)
chrome.alarms.create('maintenance', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'maintenance') {
    backgroundService.performMaintenance();
  }
});

// Export for debugging
if (typeof window !== 'undefined') {
  window.backgroundService = backgroundService;
}
