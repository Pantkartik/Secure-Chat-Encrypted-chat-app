#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying PWA and generating APK...\n');

try {
  // Step 1: Build the PWA
  console.log('📦 Building PWA...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  
  // Step 2: Deploy to Vercel (free hosting)
  console.log('\n🌐 Deploying to Vercel...');
  console.log('Please run: vercel --prod');
  console.log('Or visit: https://vercel.com and drag your build folder');
  
  // Step 3: Alternative - Create a simple APK wrapper
  console.log('\n📱 Alternative: Creating APK wrapper...');
  
  // Create a simple APK generation guide
  const guide = `# APK Generation Guide

## Option 1: PWA Builder (Easiest)
1. Deploy your app to a public URL
2. Visit: https://pwabuilder.com
3. Enter your URL
4. Click "Build My PWA"
5. Select "Android" → "Generate APK"

## Option 2: Web-to-APK Tools
- **WebIntoApp**: https://webintoapp.com
- **GoNative**: https://gonative.io
- **AppMaker**: https://appmaker.xyz/pwa-to-apk/

## Option 3: Manual APK Creation
1. Use Android Studio
2. Create WebView app
3. Load your PWA URL
4. Build signed APK

## Current PWA Status:
- ✅ Built successfully
- ✅ PWA features enabled
- ✅ Ready for deployment

Next step: Deploy to public URL and use PWA Builder!`;

  fs.writeFileSync(path.resolve(__dirname, '..', 'APK_GENERATION.md'), guide);
  
  console.log('\n✅ APK generation guide created!');
  console.log('📋 Check APK_GENERATION.md for detailed instructions');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}