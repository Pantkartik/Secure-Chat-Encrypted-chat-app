const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG to PNG conversion for PWA icons
async function convertSvgToPng(svgPath, outputPath, size) {
  try {
    await sharp(svgPath)
      .png()
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(outputPath);
    
    console.log(`✓ Converted ${svgPath} to ${outputPath} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Failed to convert ${svgPath}:`, error.message);
  }
}

// Convert all SVG icons to PNG
async function convertAllIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  console.log('🔄 Converting SVG icons to PNG format...\n');
  
  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      await convertSvgToPng(svgPath, pngPath, size);
    } else {
      console.log(`⚠️  SVG file not found: ${svgPath}`);
    }
  }
  
  // Convert shortcut icons
  const shortcutTypes = ['chat', 'video'];
  for (const type of shortcutTypes) {
    const svgPath = path.join(iconsDir, `shortcut-${type}.svg`);
    const pngPath = path.join(iconsDir, `shortcut-${type}.png`);
    
    if (fs.existsSync(svgPath)) {
      await convertSvgToPng(svgPath, pngPath, 192);
    } else {
      console.log(`⚠️  SVG file not found: ${svgPath}`);
    }
  }
  
  console.log('\n✅ Icon conversion complete!');
}

// Create a simple offline fallback if sharp is not available
function createFallbackIcons() {
  console.log('⚠️  Sharp not available. Creating placeholder PNG files...');
  
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  // Create simple placeholder files
  sizes.forEach(size => {
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    if (!fs.existsSync(pngPath)) {
      // Copy a base64 encoded minimal PNG (1x1 transparent pixel)
      const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      fs.writeFileSync(pngPath, Buffer.from(minimalPng, 'base64'));
      console.log(`✓ Created placeholder: icon-${size}x${size}.png`);
    }
  });
  
  console.log('\n✅ Fallback icons created!');
  console.log('💡 Consider installing sharp for proper SVG conversion:');
  console.log('   npm install sharp');
}

// Main execution
async function main() {
  try {
    // Check if sharp is available
    try {
      require.resolve('sharp');
      await convertAllIcons();
    } catch (error) {
      createFallbackIcons();
    }
  } catch (error) {
    console.error('❌ Icon conversion failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertAllIcons, createFallbackIcons };