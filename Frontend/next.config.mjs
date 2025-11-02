import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },
  // Add experimental features to help with build issues
  experimental: {
    // Skip static generation for dynamic routes that might hang
  },
  // Configure static generation timeout
  staticPageGenerationTimeout: 30, // 30 seconds timeout
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
  exclude: [
    // add buildExcludes here
    ({ asset, compilation }) => {
      if (
        asset.name.startsWith('server/') ||
        asset.name.match(/^((app-|^)build-manifest\.json|react-loadable-manifest\.json)$/)
      ) {
        return true;
      }
      if (process.env.NODE_ENV !== 'production') {
        // Exclude all files in development mode
        return true;
      }
      return false;
    },
  ],
  // Android-specific PWA optimizations
  fallbacks: {
    // Fallback for offline pages
    document: '/offline',
  }
};

const withPWAConfig = withPWA(pwaConfig);

export default withPWAConfig(nextConfig);