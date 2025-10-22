/**
 * Google Analytics 4 Integration
 * Privacy-first analytics implementation with environment-based tracking
 */

import ReactGA from 'react-ga4';

/**
 * Google Analytics Configuration
 */
export const GOOGLE_ANALYTICS_CONFIG = {
  /**
   * Your Google Analytics 4 Measurement ID
   * Get it from: https://analytics.google.com/ > Admin > Data Streams
   */
  measurementId: 'G-XXXXXXXXXX', // Replace with your GA4 Measurement ID

  /**
   * Enable/disable Google Analytics
   * Privacy-first: disabled by default
   */
  enabled: false, // Set to true when you add your measurement ID

  /**
   * Track in development environment
   * Set to true if you want to test analytics locally
   */
  trackInDevelopment: false,

  /**
   * Determine if tracking should be active
   */
  get shouldTrack(): boolean {
    if (!this.enabled) return false;
    if (!this.measurementId || this.measurementId === 'G-XXXXXXXXXX') return false;

    const isProduction = import.meta.env.MODE === 'production';
    if (!isProduction && !this.trackInDevelopment) return false;

    return true;
  },
};

/**
 * Initialize Google Analytics
 * Call this once at app startup
 */
export const initializeGA = (): void => {
  if (!GOOGLE_ANALYTICS_CONFIG.shouldTrack) {
    console.log('[Google Analytics] Tracking disabled');
    return;
  }

  try {
    ReactGA.initialize(GOOGLE_ANALYTICS_CONFIG.measurementId, {
      gaOptions: {
        siteSpeedSampleRate: 100,
      },
    });

    console.log('[Google Analytics] Initialized successfully with ID:', GOOGLE_ANALYTICS_CONFIG.measurementId);

    // Track initial page view
    trackPageView(window.location.pathname + window.location.search);
  } catch (error) {
    console.error('[Google Analytics] Initialization failed:', error);
  }
};

/**
 * Track a custom event
 * @param category - Event category (e.g., 'Encryption', 'Hashing')
 * @param action - Event action (e.g., 'Encrypt Text', 'Hash MD5')
 * @param label - Optional event label for additional context
 * @param value - Optional numeric value
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
): void => {
  if (!GOOGLE_ANALYTICS_CONFIG.shouldTrack) return;

  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });

    console.log('[Google Analytics] Event tracked:', { category, action, label, value });
  } catch (error) {
    console.error('[Google Analytics] Event tracking failed:', error);
  }
};

/**
 * Track a page view
 * @param path - Page path (e.g., '/encryption', '/hashing')
 * @param title - Optional page title
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!GOOGLE_ANALYTICS_CONFIG.shouldTrack) return;

  try {
    ReactGA.send({ hitType: 'pageview', page: path, title });

    console.log('[Google Analytics] Page view tracked:', path);
  } catch (error) {
    console.error('[Google Analytics] Page view tracking failed:', error);
  }
};

/**
 * Track encryption operation
 */
export const trackEncryption = (algorithm: string, mode: 'encrypt' | 'decrypt'): void => {
  trackEvent('Encryption', `${mode} - ${algorithm}`, algorithm);
};

/**
 * Track hashing operation
 */
export const trackHashing = (algorithm: string): void => {
  trackEvent('Hashing', 'Generate Hash', algorithm);
};

/**
 * Track RSA operation
 */
export const trackRSA = (operation: 'generate' | 'encrypt' | 'decrypt' | 'sign' | 'verify'): void => {
  trackEvent('RSA', operation, operation);
};

/**
 * Track image encryption
 */
export const trackImageEncryption = (mode: 'encrypt' | 'decrypt'): void => {
  trackEvent('Image Encryption', mode, mode);
};

/**
 * Track JWT operation
 */
export const trackJWT = (operation: 'sign' | 'verify'): void => {
  trackEvent('JWT', operation, operation);
};
