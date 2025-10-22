# Google Analytics Setup Guide

Quick setup guide for Google Analytics 4 in De-encrypt Hub.

## Quick Setup

### 1. Get Measurement ID

1. Visit [analytics.google.com](https://analytics.google.com/)
2. Admin → Data Streams → Your Stream
3. Copy your Measurement ID (G-XXXXXXXXXX)

### 2. Configure

Open `src/lib/googleAnalytics.ts`:

```typescript
export const GOOGLE_ANALYTICS_CONFIG = {
  measurementId: 'G-YOUR-ID-HERE', // Replace with your ID
  enabled: true,                     // Enable tracking
  trackInDevelopment: false,         // Test locally
};
```

### 3. Build & Deploy

```bash
pnpm build
# Deploy dist/ folder to your hosting
```

### 4. Verify

Check browser console for:
```
[Google Analytics] Initialized successfully with ID: G-XXXXXXXXXX
```

## Tracked Events

The app automatically tracks:

- **Encryption Operations**: `trackEncryption(algorithm, mode)`
- **Hashing**: `trackHashing(algorithm)`
- **RSA Operations**: `trackRSA(operation)`
- **Image Encryption**: `trackImageEncryption(mode)`
- **JWT Operations**: `trackJWT(operation)`

## Custom Tracking

```typescript
import { trackEvent } from '@/lib/googleAnalytics';

// Track custom event
trackEvent('Category', 'Action', 'Label', 100);
```

## Usage Examples

```typescript
import {
  trackEncryption,
  trackHashing,
  trackRSA
} from '@/lib/googleAnalytics';

// Track encryption
trackEncryption('AES', 'encrypt');

// Track hashing
trackHashing('SHA-256');

// Track RSA
trackRSA('generate');
```

## Privacy First

- **Disabled by default** - respects user privacy
- **No tracking in development** - clean dev environment
- **Configurable** - easy to enable/disable

## Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Google Analytics Config](../src/lib/googleAnalytics.ts)
