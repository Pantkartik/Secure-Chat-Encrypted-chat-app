const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for Cypher Chat
function createAppIcon(size) {
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background circle -->
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#grad1)" stroke="#ffffff" stroke-width="2"/>
    
    <!-- Shield/Chat bubble shape -->
    <path d="M ${size * 0.3} ${size * 0.25} 
             L ${size * 0.7} ${size * 0.25} 
             C ${size * 0.85} ${size * 0.25} ${size * 0.85} ${size * 0.45} ${size * 0.7} ${size * 0.45} 
             L ${size * 0.5} ${size * 0.45} 
             L ${size * 0.3} ${size * 0.65} 
             L ${size * 0.3} ${size * 0.45} 
             C ${size * 0.15} ${size * 0.45} ${size * 0.15} ${size * 0.25} ${size * 0.3} ${size * 0.25} Z" 
          fill="url(#grad2)" opacity="0.9"/>
    
    <!-- Lock/Security symbol -->
    <rect x="${size * 0.4}" y="${size * 0.55}" width="${size * 0.2}" height="${size * 0.15}" fill="#ffffff" rx="2"/>
    <path d="M ${size * 0.42} ${size * 0.55} 
             L ${size * 0.42} ${size * 0.5} 
             C ${size * 0.42} ${size * 0.45} ${size * 0.45} ${size * 0.42} ${size * 0.5} ${size * 0.42} 
             C ${size * 0.55} ${size * 0.42} ${size * 0.58} ${size * 0.45} ${size * 0.58} ${size * 0.5} 
             L ${size * 0.58} ${size * 0.55} 
             M ${size * 0.46} ${size * 0.52} 
             L ${size * 0.46} ${size * 0.55} 
             M ${size * 0.54} ${size * 0.52} 
             L ${size * 0.54} ${size * 0.55}" 
          stroke="#ffffff" stroke-width="1.5" fill="none"/>
  </svg>`;
  
  return svgContent;
}

function createShortcutIcon(size, type) {
  const color = type === 'chat' ? '#6366f1' : '#10b981';
  const icon = type === 'chat' ? 
    `<path d="M ${size * 0.3} ${size * 0.25} L ${size * 0.7} ${size * 0.25} C ${size * 0.85} ${size * 0.25} ${size * 0.85} ${size * 0.45} ${size * 0.7} ${size * 0.45} L ${size * 0.5} ${size * 0.45} L ${size * 0.3} ${size * 0.65} L ${size * 0.3} ${size * 0.45} C ${size * 0.15} ${size * 0.45} ${size * 0.15} ${size * 0.25} ${size * 0.3} ${size * 0.25} Z" fill="#ffffff"/>` :
    `<circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.3}" fill="none" stroke="#ffffff" stroke-width="3"/><path d="M ${size * 0.35} ${size * 0.5} L ${size * 0.5} ${size * 0.65} L ${size * 0.65} ${size * 0.35}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
    ${icon}
  </svg>`;
}

// Generate all icons
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate main app icons
iconSizes.forEach(size => {
  const svgContent = createAppIcon(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

// Generate shortcut icons
['chat', 'video'].forEach(type => {
  const svgContent = createShortcutIcon(192, type);
  const svgPath = path.join(iconsDir, `shortcut-${type}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Generated: shortcut-${type}.svg`);
});

console.log('All SVG icons generated successfully!');
console.log('Note: You may want to convert these SVG files to PNG for better compatibility.');
console.log('Consider using online tools like svg2png or sharp library for conversion.');