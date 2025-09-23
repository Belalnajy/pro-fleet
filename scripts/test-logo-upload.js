#!/usr/bin/env node

/**
 * Test script for logo upload system
 * This script tests both Cloudinary and local upload functionality
 */

const { uploadLogo } = require('../src/lib/upload');
const fs = require('fs');
const path = require('path');

async function testLogoUpload() {
  console.log('🧪 Testing Logo Upload System...\n');

  // Check if test image exists
  const testImagePath = path.join(__dirname, 'test-logo.png');
  
  if (!fs.existsSync(testImagePath)) {
    console.log('❌ Test image not found. Creating a simple test file...');
    
    // Create a simple test file (1x1 pixel PNG)
    const testBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    fs.writeFileSync(testImagePath, testBuffer);
    console.log('✅ Test image created successfully\n');
  }

  try {
    // Read test image
    const imageBuffer = fs.readFileSync(testImagePath);
    console.log(`📁 Test image size: ${imageBuffer.length} bytes`);

    // Check configuration
    console.log('🔧 Configuration Check:');
    console.log(`   CLOUDINARY_URL: ${process.env.CLOUDINARY_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set'}`);
    console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set'}\n`);

    // Test upload
    console.log('🚀 Starting upload test...');
    const result = await uploadLogo(imageBuffer, 'test-logo.png');
    
    console.log('✅ Upload successful!');
    console.log(`📍 Logo URL: ${result}`);
    
    if (result.includes('cloudinary')) {
      console.log('☁️  Uploaded to Cloudinary (cloud storage)');
    } else {
      console.log('💾 Uploaded to local storage');
    }

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('💡 Make sure to set up Cloudinary credentials or check local storage permissions');
  }

  // Cleanup
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test files');
  }
}

// Run test if called directly
if (require.main === module) {
  testLogoUpload().catch(console.error);
}

module.exports = { testLogoUpload };
