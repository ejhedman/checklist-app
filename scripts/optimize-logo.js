#!/usr/bin/env node

/**
 * Logo Optimization Script
 * 
 * This script generates optimized logo variants at different sizes
 * to ensure crisp rendering across all devices and use cases.
 * 
 * Requirements:
 * - Install sharp: npm install sharp
 * - Place original logo.png in public/ directory
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'logo-sm', width: 200, height: 65 },
  { name: 'logo-md', width: 400, height: 130 },
  { name: 'logo-lg', width: 800, height: 260 },
  { name: 'logo-xl', width: 1024, height: 334 },
  { name: 'logo-2x', width: 2048, height: 668 }, // For high-DPI displays
];

const inputPath = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/logos');

async function optimizeLogo() {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🔄 Optimizing logo variants...');

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${size.name}.png`);
      
      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size.name}.png (${size.width}x${size.height})`);
    }

    console.log('🎉 Logo optimization complete!');
    console.log('\n📁 Generated files:');
    sizes.forEach(size => {
      console.log(`   - public/logos/${size.name}.png`);
    });
    
    console.log('\n💡 Usage:');
    console.log('   - Use logo-sm for small contexts (16-24px height)');
    console.log('   - Use logo-md for medium contexts (24-32px height)');
    console.log('   - Use logo-lg for large contexts (32-48px height)');
    console.log('   - Use logo-xl for extra large contexts (48px+ height)');
    console.log('   - Use logo-2x for high-DPI displays');

  } catch (error) {
    console.error('❌ Error optimizing logo:', error);
    process.exit(1);
  }
}

// Run the optimization
optimizeLogo(); 