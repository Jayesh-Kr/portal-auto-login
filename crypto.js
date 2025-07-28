/**
 * Crypto utilities for secure credential storage
 * Uses Web Crypto API with AES-GCM encryption
 */

class CryptoHelper {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  /**
   * Generate a cryptographic key from a password
   * @param {string} password - Master password for encryption
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} - Derived key
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt text using AES-GCM
   * @param {string} text - Text to encrypt
   * @param {string} masterPassword - Master password (optional, uses default)
   * @returns {Promise<Object>} - Encrypted data with IV and salt
   */
  async encrypt(text, masterPassword = 'srm-auto-login-key-2024') {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from master password
    const key = await this.deriveKey(masterPassword, salt);
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv: iv },
      key,
      data
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      salt: Array.from(salt)
    };
  }

  /**
   * Decrypt encrypted data
   * @param {Object} encryptedData - Object containing encrypted, iv, and salt
   * @param {string} masterPassword - Master password (optional, uses default)
   * @returns {Promise<string>} - Decrypted text
   */
  async decrypt(encryptedData, masterPassword = 'srm-auto-login-key-2024') {
    const { encrypted, iv, salt } = encryptedData;
    
    // Convert arrays back to Uint8Array
    const encryptedArray = new Uint8Array(encrypted);
    const ivArray = new Uint8Array(iv);
    const saltArray = new Uint8Array(salt);
    
    // Derive key from master password
    const key = await this.deriveKey(masterPassword, saltArray);
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: this.algorithm, iv: ivArray },
      key,
      encryptedArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Store encrypted credentials in chrome storage
   * @param {string} username - Username to encrypt and store
   * @param {string} password - Password to encrypt and store
   * @returns {Promise<boolean>} - Success status
   */
  async storeCredentials(username, password) {
    try {
      const encryptedUsername = await this.encrypt(username);
      const encryptedPassword = await this.encrypt(password);
      
      await chrome.storage.local.set({
        encryptedUsername: encryptedUsername,
        encryptedPassword: encryptedPassword,
        credentialsStored: true
      });
      
      return true;
    } catch (error) {
      console.error('Error storing credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt credentials from chrome storage
   * @returns {Promise<Object>} - Object containing username and password
   */
  async getCredentials() {
    try {
      const result = await chrome.storage.local.get([
        'encryptedUsername',
        'encryptedPassword',
        'credentialsStored'
      ]);
      
      if (!result.credentialsStored) {
        return { username: null, password: null };
      }
      
      const username = await this.decrypt(result.encryptedUsername);
      const password = await this.decrypt(result.encryptedPassword);
      
      return { username, password };
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return { username: null, password: null };
    }
  }

  /**
   * Clear stored credentials
   * @returns {Promise<boolean>} - Success status
   */
  async clearCredentials() {
    try {
      await chrome.storage.local.remove([
        'encryptedUsername',
        'encryptedPassword',
        'credentialsStored'
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return false;
    }
  }
}

// Make CryptoHelper available globally
window.CryptoHelper = CryptoHelper;
