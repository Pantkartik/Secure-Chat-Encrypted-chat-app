#!/usr/bin/env node

/**
 * Cypher Chat Android PWA Build Script
 * 
 * This script builds the Next.js application and prepares it for Android PWA deployment.
 * It handles icon conversion, manifest validation, and deployment preparation.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// Build steps
const buildSteps = [
  {
    name: 'Validate Environment',
    execute: validateEnvironment
  },
  {
    name: 'Generate PWA Icons',
    execute: generateIcons
  },
  {
    name: 'Convert Icons to PNG',
    execute: convertIconsToPng
  },
  {
    name: 'Build Next.js Application',
    execute: buildNextApp
  },
  {
    name: 'Validate PWA Manifest',
    execute: validateManifest
  },
  {
    name: 'Check Service Worker',
    execute: checkServiceWorker
  },
  {
    name: 'Generate Deployment Package',
    execute: generateDeploymentPackage
  },
  {
    name: 'Create Deployment Instructions',
    execute: createDeploymentInstructions
  }
];

async function validateEnvironment() {
  log('\n📋 Validating build environment...', colors.bright);
  
  // Check Node.js version
  const nodeVersion = process.version;
  info(`Node.js version: ${nodeVersion}`);
  
  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found. Please run this script from the Frontend directory.');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.name !== 'cypher-chat') {
    warning('Project name is not "cypher-chat". Make sure you\'re in the right directory.');
  }
  
  success('Environment validation passed');
}

async function generateIcons() {
  log('\n🎨 Generating PWA icons...', colors.bright);
  
  try {
    execSync('node scripts/generate-icons.js', { stdio: 'inherit' });
    success('PWA icons generated successfully');
  } catch (error) {
    throw new Error(`Icon generation failed: ${error.message}`);
  }
}

async function convertIconsToPng() {
  log('\n🖼️  Converting SVG icons to PNG...', colors.bright);
  
  try {
    execSync('node scripts/convert-icons.js', { stdio: 'inherit' });
    success('Icons converted to PNG format');
  } catch (error) {
    warning('Icon conversion failed. SVG icons will be used as fallback.');
    // Don't fail the build, just warn
  }
}

async function buildNextApp() {
  log('\n🏗️  Building Next.js application...', colors.bright);
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    success('Next.js application built successfully');
  } catch (error) {
    throw new Error(`Next.js build failed: ${error.message}`);
  }
}

async function validateManifest() {
  log('\n📱 Validating PWA manifest...', colors.bright);
  
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found in public directory');
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Required fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required field in manifest.json: ${field}`);
      }
    }
    
    // Validate icons
    if (!manifest.icons || manifest.icons.length === 0) {
      throw new Error('No icons found in manifest.json');
    }
    
    // Check for Android-specific features
    const androidFeatures = ['categories', 'share_target', 'shortcuts'];
    const missingFeatures = androidFeatures.filter(feature => !manifest[feature]);
    if (missingFeatures.length > 0) {
      warning(`Missing Android-specific features: ${missingFeatures.join(', ')}`);
    }
    
    success('PWA manifest validation passed');
    info(`App Name: ${manifest.name}`);
    info(`Short Name: ${manifest.short_name}`);
    info(`Display Mode: ${manifest.display}`);
    info(`Icons: ${manifest.icons.length} icons configured`);
    
  } catch (error) {
    throw new Error(`Manifest validation failed: ${error.message}`);
  }
}

async function checkServiceWorker() {
  log('\n🔧 Checking service worker...', colors.bright);
  
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  const customSwPath = path.join(process.cwd(), 'public', 'custom-sw.js');
  
  if (!fs.existsSync(swPath)) {
    throw new Error('Service worker (sw.js) not found in public directory');
  }
  
  if (fs.existsSync(customSwPath)) {
    info('Custom service worker (custom-sw.js) found');
  }
  
  success('Service worker validation passed');
}

async function generateDeploymentPackage() {
  log('\n📦 Generating deployment package...', colors.bright);
  
  const buildDir = path.join(process.cwd(), '.next');
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory (.next) not found. Run build first.');
  }
  
  // Create deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    version: require('./package.json').version,
    buildSize: calculateDirectorySize(buildDir),
    publicSize: calculateDirectorySize(publicDir),
    features: [
      'PWA with Android-specific optimizations',
      'Offline functionality',
      'Push notifications',
      'App shortcuts',
      'Share target',
      'File handling'
    ]
  };
  
  const infoPath = path.join(process.cwd(), 'deployment-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
  
  success('Deployment package generated');
  info(`Build size: ${(deploymentInfo.buildSize / 1024 / 1024).toFixed(2)} MB`);
  info(`Public assets: ${(deploymentInfo.publicSize / 1024 / 1024).toFixed(2)} MB`);
}

async function createDeploymentInstructions() {
  log('\n📝 Creating deployment instructions...', colors.bright);
  
  const instructions = `# Cypher Chat Android PWA - Deployment Instructions

## 📦 Deployment Package Ready

Your Android PWA has been successfully built with the following features:

### ✅ Included Features
- Progressive Web App (PWA) with Android optimizations
- Offline functionality with service worker
- Push notification support
- App shortcuts for quick actions
- Share target for receiving shared content
- File handling capabilities
- Custom install prompt for Android users

### 📱 Android-Specific Features
- Standalone display mode (no browser UI)
- Portrait orientation lock
- Custom app icons (multiple sizes)
- Android app shortcuts
- Enhanced offline page
- Background sync for messages

## 🚀 Deployment Steps

### 1. Choose Your Hosting Platform
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Firebase Hosting**
- **AWS Amplify**
- **DigitalOcean App Platform**
- **Any HTTPS-enabled server**

### 2. Deploy Your Application
\`\`\`bash
# Your build files are ready in .next/
# Deploy the entire project directory
# The hosting platform will handle the rest
\`\`\`

### 3. Configure Your Domain
- Ensure HTTPS is enabled (required for PWA)
- Set up custom domain if needed
- Configure DNS properly

### 4. Test on Android Devices
1. Visit your deployed URL in Chrome
2. Look for install prompt or use menu → "Add to Home Screen"
3. Test all PWA features
4. Verify offline functionality

## 📋 Post-Deployment Checklist

- [ ] HTTPS is working correctly
- [ ] PWA install prompt appears on Android
- [ ] App installs successfully
- [ ] Offline mode works
- [ ] Push notifications function
- [ ] App shortcuts work (long-press icon)
- [ ] Share target receives content
- [ ] Performance is smooth

## 🔧 Monitoring & Maintenance

### Analytics to Track
- PWA installation rate
- App usage vs. web usage
- Offline engagement
- Push notification interactions

### Regular Maintenance
- Monitor service worker updates
- Check for broken functionality
- Update app icons if needed
- Review user feedback

## 🆘 Support

If you encounter issues:
1. Check the deployment-info.json file
2. Review the Android deployment guide
3. Test with Chrome DevTools
4. Check browser console for errors

---
**Build completed at**: ${new Date().toISOString()}
**Version**: ${require('./package.json').version}
`;

  const instructionsPath = path.join(process.cwd(), 'DEPLOYMENT_INSTRUCTIONS.md');
  fs.writeFileSync(instructionsPath, instructions);
  
  success('Deployment instructions created');
}

// Helper functions
function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (error) {
    console.warn(`Could not calculate size for ${dirPath}`);
  }
  
  return totalSize;
}

// Main execution
async function main() {
  log('\n🚀 Cypher Chat Android PWA Build Script', colors.bright);
  log('========================================', colors.bright);
  
  const startTime = Date.now();
  
  try {
    for (const step of buildSteps) {
      log(`\n📍 Step ${buildSteps.indexOf(step) + 1}/${buildSteps.length}: ${step.name}`, colors.magenta);
      await step.execute();
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log('\n🎉 Build completed successfully!', colors.green);
    log(`⏱️  Total build time: ${duration} seconds`, colors.blue);
    log('\n📖 Next steps:', colors.bright);
    log('1. Review DEPLOYMENT_INSTRUCTIONS.md');
    log('2. Deploy to your chosen hosting platform');
    log('3. Test on Android devices');
    log('4. Monitor user engagement and feedback');
    
  } catch (error) {
    error(`\n❌ Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };