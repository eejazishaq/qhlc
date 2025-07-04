const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1e40af"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold">QHLC</text>
</svg>
`;

// Icon sizes needed
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
iconSizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

// Generate apple touch icon
const appleIcon = createSVGIcon(180);
const appleIconPath = path.join(iconsDir, 'apple-touch-icon.svg');
fs.writeFileSync(appleIconPath, appleIcon);
console.log('Generated apple-touch-icon.svg');

console.log('All placeholder icons generated successfully!');
console.log('Note: These are SVG placeholders. For production, replace with proper PNG icons.'); 